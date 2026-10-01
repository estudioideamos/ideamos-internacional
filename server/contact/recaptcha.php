<?php
declare(strict_types=1);
namespace IdeamosContact;

function recaptchaResponseValid(array $result, int $now): bool
{
    $score = $result['score'] ?? null;
    $timestamp = $result['challenge_ts'] ?? null;
    $issued = is_string($timestamp) ? strtotime($timestamp) : false;
    return ($result['success'] ?? null) === true
        && ($result['action'] ?? null) === 'contact_submit'
        && in_array($result['hostname'] ?? null, ['estudioideamos.com', 'www.estudioideamos.com'], true)
        && (is_float($score) || is_int($score)) && $score >= 0.5 && $score <= 1
        && $issued !== false && $issued <= $now + 30 && $issued >= $now - 120;
}

function verifyRecaptcha(string $token): bool
{
    if ($token === '' || strlen($token) > 4096) return false;
    $config = __DIR__ . '/recaptcha-secret.php';
    if (!is_file($config) || !function_exists('curl_init')) throw new \RuntimeException('Verification unavailable');
    $secret = require $config;
    if (!is_string($secret) || strlen($secret) < 20) throw new \RuntimeException('Verification not configured');
    $request = curl_init('https://www.google.com/recaptcha/api/siteverify');
    if ($request === false) throw new \RuntimeException('Verification initialization failed');
    $body = '';
    try {
        curl_setopt_array($request, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query(['secret' => $secret, 'response' => $token]),
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
            CURLOPT_CONNECTTIMEOUT => 2,
            CURLOPT_TIMEOUT => 5,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_WRITEFUNCTION => static function ($handle, string $chunk) use (&$body): int {
                if (strlen($body) + strlen($chunk) > 16384) return 0;
                $body .= $chunk;
                return strlen($chunk);
            },
        ]);
        if (curl_exec($request) === false || curl_getinfo($request, CURLINFO_HTTP_CODE) !== 200) {
            throw new \RuntimeException('Verification service unavailable');
        }
        $result = json_decode($body, true, 32, JSON_THROW_ON_ERROR);
        if (!is_array($result)) throw new \RuntimeException('Invalid verification response');
        if (array_intersect($result['error-codes'] ?? [], ['invalid-input-secret', 'missing-input-secret'])) {
            throw new \RuntimeException('Verification configuration rejected');
        }
        return recaptchaResponseValid($result, time());
    } finally {
        curl_close($request);
    }
}
