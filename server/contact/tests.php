<?php
declare(strict_types=1);
require __DIR__ . '/handler.php';
$state = tempnam(sys_get_temp_dir(), 'ideamos-test-');
$count = 0;
$transport = function ($to, $subject, $body, $headers) use (&$count) {
    if ($to !== 'hola@estudioideamos.com' || $headers['Reply-To'] !== 'visitor@example.com') throw new RuntimeException('Wrong mail routing');
    if (!str_contains(quoted_printable_decode($body), 'Prueba del formulario')) throw new RuntimeException('Missing body');
    $count++;
    return true;
};
$server = ['HTTP_ORIGIN'=>'https://estudioideamos.com','REQUEST_METHOD'=>'POST','REMOTE_ADDR'=>'192.0.2.1'];
$post = ['nombre'=>'Prueba','empresa'=>'Prueba','email'=>'visitor@example.com','telefono'=>'+54 1112345678','mensaje'=>'Prueba del formulario sin envio de correo.','_form_elapsed_ms'=>'3000'];
function check($result, int $status, string $label): void {
    if ($result['status'] !== $status) throw new RuntimeException($label . ': ' . json_encode($result));
    echo "PASS $label\n";
}
try {
    check(\IdeamosContact\handle(array_replace($server,['HTTP_ORIGIN'=>'https://evil.example']),$post,[],$transport,$state),403,'reject foreign origin');
    check(\IdeamosContact\handle(array_replace($server,['REQUEST_METHOD'=>'OPTIONS']),[],[],$transport,$state),204,'preflight');
    check(\IdeamosContact\handle($server,array_replace($post,['email'=>"visitor@example.com\r\nBcc: victim@example.com"]),[],$transport,$state),422,'header injection');
    check(\IdeamosContact\handle($server,array_replace($post,['nombre'=>[]]),[],$transport,$state),422,'reject array fields');
    check(\IdeamosContact\handle($server,array_replace($post,['mensaje'=>'short']),[],$transport,$state),422,'reject short message');
    check(\IdeamosContact\handle($server,array_replace($post,['_form_elapsed_ms'=>'100']),[],$transport,$state),422,'minimum time');
    check(\IdeamosContact\handle(array_replace($server,['CONTENT_LENGTH'=>20000]),$post,[],$transport,$state),413,'size limit');
    check(\IdeamosContact\handle($server,array_replace($post,['_gotcha'=>'bot']),[],$transport,$state),200,'honeypot');
    if ($count !== 0) throw new RuntimeException('Unexpected delivery');
    check(\IdeamosContact\handle($server,$post,[],$transport,$state),200,'valid message to fixed recipient');
    check(\IdeamosContact\handle($server,$post,[],$transport,$state),200,'duplicate suppressed');
    if ($count !== 1) throw new RuntimeException('Duplicate sent');
    check(\IdeamosContact\handle($server,array_replace($post,['nombre'=>'Otra persona']),[],$transport,$state),429,'rate limit');
    file_put_contents($state,'');
    check(\IdeamosContact\handle($server,$post,[],static fn()=>false,$state),503,'transport failure');
    if ($count !== 1) throw new RuntimeException('Unexpected delivery');
    echo "All checks passed. No emails sent.\n";
} finally { unlink($state); }