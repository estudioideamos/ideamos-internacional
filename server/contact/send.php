<?php
declare(strict_types=1);
ini_set('display_errors', '0');
require dirname(__DIR__, 2) . '/ideamos-contact/handler.php';
$result = \IdeamosContact\handle(
    $_SERVER,
    $_POST,
    $_FILES,
    static fn(string $to, string $subject, string $body, array $headers): bool => mail($to, $subject, $body, $headers, '-fhola@estudioideamos.com'),
    dirname(__DIR__, 2) . '/ideamos-contact/state.json'
);
http_response_code($result['status']);
foreach ($result['headers'] as $name => $value) header($name . ': ' . $value);
header('Content-Type: application/json; charset=UTF-8');
if ($result['status'] !== 204) echo json_encode($result['body'], JSON_UNESCAPED_UNICODE);