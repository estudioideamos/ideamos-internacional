# Formulario internacional

Endpoint: https://mail.estudioideamos.com/contact/send.php
Destinatario fijo: hola@estudioideamos.com. Reply-To: email validado del visitante.

## Hosting

Cuenta cPanel exclusiva para estudioideamos.com con PHP 8.3.
El host de correo conserva un certificado SSL valido para el dominio.
No depende del servicio mailer del proyecto argentino.

- send.php, public.htaccess y public.user.ini: $HOME/public_html/contact/ (644).
- handler.php: $HOME/ideamos-contact/handler.php (600; directorio 700).
- state.json: $HOME/ideamos-contact/state.json (600; crear vacio solo en primera instalacion).
- php-error.log: $HOME/ideamos-contact/php-error.log (600; nunca dentro de public_html).
- tests.php: ejecutar fuera de public_html con PHP junto a handler.php. No envia correos: inyecta transporte simulado.

GitHub Pages publica el frontend; estos archivos PHP se instalan por SSH en cPanel, no en Pages.
Nunca sobrescribir state.json al desplegar. No hay contrasenas SMTP en el codigo: usa el transporte local de cPanel con remitente fijo hola@estudioideamos.com.

## Controles

Solo admite los origenes HTTPS estudioideamos.com y www.estudioideamos.com. Antes de aceptar un POST emite un desafio firmado por el servidor, ligado a la IP, con 30 minutos de vigencia y uso unico; esto impide que un envio directo invente el tiempo del formulario. Tambien aplica limites de campos, formato de email y telefono, bloqueo de inyeccion de cabeceras, honeypot y tiempo minimo. Limites persistentes con bloqueo de archivo: 1 intento por minuto, 5 por hora por IP y 100 globales por hora. Deduplicacion de envios aceptados durante 10 minutos. El estado guarda una clave aleatoria local, hashes y marcas de tiempo, nunca los datos de la consulta.

La configuracion publica fuerza HTTPS, deshabilita listados, limita metodos y agrega cabeceras defensivas. La configuracion PHP mantiene los errores fuera de la respuesta, acota recursos y guarda el log en el directorio privado.

La respuesta exitosa indica aceptacion por el transporte local; no garantiza recepcion final. Se probaron validacion, rechazos, deduplicacion, limites y fallo de transporte sin enviar mensajes reales. La entrega a la casilla requiere una prueba real.
Antispam adicional: limites por hash de email incluso al cambiar de IP; deduplicacion normalizada de espacios y mayusculas; maximo cinco enlaces por consulta. No hay listas de palabras ni bloqueos por pais. SpamAssassin y ClamAV no estan instalados por el proveedor; greylisting esta disponible y requiere una decision explicita porque puede demorar correos legitimos.
