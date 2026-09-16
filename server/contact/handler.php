<?php
declare(strict_types=1);
namespace IdeamosContact;

/** Transport is injected so validation and delivery outcomes can be tested without sending mail. */
function handle(array $server, array $post, array $files, callable $deliver, string $stateFile): array
{
    $origin = $server['HTTP_ORIGIN'] ?? '';
    $headers = ['Vary' => 'Origin', 'Cache-Control' => 'no-store', 'X-Content-Type-Options' => 'nosniff'];
    $reply = static function (int $status, string $message, bool $ok = false) use (&$headers): array {
        return ['status' => $status, 'headers' => $headers, 'body' => ['ok' => $ok, 'message' => $message]];
    };
    if (!in_array($origin, ['https://estudioideamos.com', 'https://www.estudioideamos.com'], true)) {
        return $reply(403, 'Origen no permitido.');
    }
    $headers['Access-Control-Allow-Origin'] = $origin;
    $headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    $headers['Access-Control-Allow-Headers'] = 'Content-Type, Accept';
    $method = $server['REQUEST_METHOD'] ?? '';
    if ($method === 'OPTIONS') return $reply(204, '');
    if ($method !== 'POST') {
        $headers['Allow'] = 'POST, OPTIONS';
        return $reply(405, 'Metodo no permitido.');
    }
    if ((int)($server['CONTENT_LENGTH'] ?? 0) > 16384 || $files) return $reply(413, 'Solicitud demasiado grande.');
    foreach (['_gotcha', 'nombre', 'empresa', 'email', 'telefono', 'mensaje', '_form_elapsed_ms'] as $key) {
        if (isset($post[$key]) && !is_string($post[$key])) return $reply(422, 'Datos invalidos.');
    }
    if (trim($post['_gotcha'] ?? '') !== '') return $reply(200, 'Consulta recibida.', true);
    if (!ctype_digit($post['_form_elapsed_ms'] ?? '') || (int)$post['_form_elapsed_ms'] < 2500) {
        return $reply(422, 'Espera unos segundos antes de enviar.');
    }
    $data = [];
    foreach (['nombre' => [2,80], 'empresa' => [0,120], 'email' => [3,254], 'telefono' => [8,30], 'mensaje' => [20,2000]] as $key => [$min,$max]) {
        $value = trim($post[$key] ?? '');
        if (!preg_match('//u', $value) || str_contains($value, "\0")) return $reply(422, 'Datos invalidos.');
        $length = preg_match_all('/./us', $value);
        if ($length < $min || $length > $max || ($key !== 'mensaje' && preg_match('/[\r\n]/', $value))) {
            return $reply(422, 'Revisa los campos del formulario.');
        }
        $data[$key] = $value;
    }
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL) || !preg_match('/^[0-9+() -]{8,30}$/D', $data['telefono'])) {
        return $reply(422, 'Revisa el email y el telefono.');
    }
    // A project brief can include links, but link-heavy bulk advertisements are rejected.
    if (preg_match_all('~(?:https?://|www\.)~i', implode(' ', $data)) > 5) {
        return $reply(422, 'Inclui como maximo cinco enlaces en tu consulta.');
    }
    $emailKey = hash('sha256', strtolower($data['email']));
    $normalized = array_map(static fn($value) => strtolower(preg_replace('/\s+/u', ' ', trim($value))), $data);
    $now = time();
    $ip = hash('sha256', $server['REMOTE_ADDR'] ?? 'unknown');
    $fingerprint = hash('sha256', json_encode($normalized));
    $lock = @fopen($stateFile, 'c+');
    if (!$lock || !flock($lock, LOCK_EX)) {
        if (is_resource($lock)) fclose($lock);
        return $reply(503, 'Servicio temporalmente no disponible.');
    }
    try {
        $raw = stream_get_contents($lock);
        $state = $raw === '' ? [] : json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        $state['attempts'] = array_values(array_filter($state['attempts'] ?? [], static fn($r) => $r['at'] > $now - 3600));
        $state['sent'] = array_filter($state['sent'] ?? [], static fn($at) => $at > $now - 600);
        if (isset($state['sent'][$fingerprint])) return $reply(200, 'Esta consulta ya fue enviada.', true);
        $byIp = array_filter($state['attempts'], static fn($r) => $r['ip'] === $ip);
        $byEmail = array_filter($state['attempts'], static fn($r) => ($r['email'] ?? '') === $emailKey);
        $recent = array_filter(array_merge($byIp, $byEmail), static fn($r) => $r['at'] > $now - 60);
        if (count($state['attempts']) >= 100 || count($byIp) >= 5 || count($byEmail) >= 5 || $recent) {
            $headers['Retry-After'] = '60';
            return $reply(429, 'Espera antes de enviar otra consulta.');
        }
        $state['attempts'][] = ['at' => $now, 'ip' => $ip, 'email' => $emailKey];
        // Persist the attempt before delivery; failures cannot bypass rate limiting.
        $persist = static function () use ($lock, &$state): void {
            $json = json_encode($state, JSON_THROW_ON_ERROR);
            rewind($lock);
            if (!ftruncate($lock, 0) || fwrite($lock, $json) !== strlen($json) || !fflush($lock)) {
                throw new \RuntimeException('Unable to persist contact limits');
            }
        };
        $persist();
        $body = "Consulta desde Ideamos Internacional\r\n\r\n";
        foreach (['nombre' => 'Nombre', 'empresa' => 'Empresa', 'email' => 'Email', 'telefono' => 'Telefono', 'mensaje' => 'Mensaje'] as $key => $label) {
            $body .= $label . ': ' . str_replace(["\r\n", "\r", "\n"], "\r\n", $data[$key]) . "\r\n";
        }
        $mailHeaders = [
            'From' => 'Ideamos Internacional <hola@estudioideamos.com>',
            'Reply-To' => $data['email'],
            'MIME-Version' => '1.0',
            'Content-Type' => 'text/plain; charset=UTF-8',
            'Content-Transfer-Encoding' => 'quoted-printable',
            'Auto-Submitted' => 'auto-generated',
        ];
        $accepted = $deliver('hola@estudioideamos.com', 'Nueva consulta - Ideamos Internacional', quoted_printable_encode($body), $mailHeaders);
        if (!$accepted) return $reply(503, 'No pudimos enviar la consulta. Intenta nuevamente.');
        $state['sent'][$fingerprint] = $now;
        $persist();
        return $reply(200, 'Consulta enviada.', true);
    } catch (\Throwable $error) {
        error_log('Ideamos contact handler failed: ' . get_class($error));
        return $reply(503, 'Servicio temporalmente no disponible.');
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}