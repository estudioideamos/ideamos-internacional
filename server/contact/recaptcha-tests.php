<?php
declare(strict_types=1);
require_once __DIR__ . '/handler.php';
$time = time();
$valid = ['success'=>true, 'score'=>0.9, 'action'=>'contact_submit', 'hostname'=>'estudioideamos.com', 'challenge_ts'=>gmdate('c', $time)];
$cases = [
    'valid' => [$valid, true],
    'www' => [array_replace($valid, ['hostname'=>'www.estudioideamos.com']), true],
    'threshold' => [array_replace($valid, ['score'=>0.5]), true],
    'low score' => [array_replace($valid, ['score'=>0.4]), false],
    'missing score' => [array_diff_key($valid, ['score'=>1]), false],
    'string score' => [array_replace($valid, ['score'=>'0.9']), false],
    'invalid score' => [array_replace($valid, ['score'=>1.1]), false],
    'wrong action' => [array_replace($valid, ['action'=>'login']), false],
    'foreign host' => [array_replace($valid, ['hostname'=>'ideamos.com.ar']), false],
    'host suffix' => [array_replace($valid, ['hostname'=>'estudioideamos.com.evil.example']), false],
    'rejected or replayed token' => [array_replace($valid, ['success'=>false]), false],
    'expired' => [array_replace($valid, ['challenge_ts'=>gmdate('c', $time-121)]), false],
    'future' => [array_replace($valid, ['challenge_ts'=>gmdate('c', $time+60)]), false],
    'missing time' => [array_diff_key($valid, ['challenge_ts'=>1]), false],
    'malformed' => [[], false],
];
foreach ($cases as $name => [$result, $expected]) {
    if (\IdeamosContact\recaptchaResponseValid($result, $time) !== $expected) throw new RuntimeException('reCAPTCHA: '.$name);
    echo 'PASS reCAPTCHA '.$name."\n";
}
foreach (['missing'=>422, 'array'=>422, 'oversize'=>422, 'rejected'=>422, 'unavailable'=>503, 'valid'=>200] as $mode => $expected) {
    $path = tempnam(sys_get_temp_dir(), 'recaptcha-test-');
    $deliveries = 0;
    $calls = 0;
    $delivery = static function () use (&$deliveries): bool { $deliveries++; return true; };
    $verify = static function (string $token) use ($mode, &$calls): bool {
        $calls++;
        if ($mode === 'unavailable') throw new RuntimeException('Simulated provider outage');
        return $mode === 'valid';
    };
    try {
        $server = ['HTTP_ORIGIN'=>'https://estudioideamos.com','REQUEST_METHOD'=>'GET','REMOTE_ADDR'=>'192.0.2.50','REQUEST_TIME'=>$time];
        $challenge = \IdeamosContact\handle($server, [], [], $delivery, $path)['body']['challenge'];
        $server['REQUEST_METHOD'] = 'POST';
        $server['REQUEST_TIME'] += 3;
        $post = ['nombre'=>'Prueba','empresa'=>'Prueba','email'=>'visitor@example.com','telefono'=>'+54 1112345678','mensaje'=>'Prueba de seguridad sin enviar correo.','_form_elapsed_ms'=>'3000','_form_challenge'=>$challenge];
        if ($mode !== 'missing') $post['g-recaptcha-response'] = match($mode) { 'array'=>[], 'oversize'=>str_repeat('x',4097), default=>'fake-test-token' };
        $result = \IdeamosContact\handle($server, $post, [], $delivery, $path, $verify);
        if ($result['status'] !== $expected || $deliveries !== ($mode === 'valid' ? 1 : 0)) throw new RuntimeException('Contact gate: '.$mode);
        if (in_array($mode, ['missing','array','oversize'], true) && $calls !== 0) throw new RuntimeException('Invalid token reached provider');
        echo 'PASS contact reCAPTCHA gate '.$mode."\n";
    } finally { unlink($path); }
}
echo "reCAPTCHA tests passed. No emails sent.\n";
