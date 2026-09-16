# Formulario internacional

Endpoint: https://mail.estudioideamos.com/contact/send.php
Destinatario fijo: hola@estudioideamos.com. Reply-To: email validado del visitante.

## Hosting

Cuenta estudio en buenosaires.servidoraweb.net, SSH puerto 9022. PHP ea-php83.
El host mail conserva la IP de cPanel 167.250.5.104 y el certificado del dominio.
No depende del servicio mailer del proyecto argentino.

- send.php: /home3/estudio/public_html/contact/send.php (644).
- handler.php: /home3/estudio/ideamos-contact/handler.php (600; directorio 700).
- state.json: /home3/estudio/ideamos-contact/state.json (600; crear vacio solo en primera instalacion).
- tests.php: ejecutar fuera de public_html con PHP junto a handler.php. No envia correos: inyecta transporte simulado.

GitHub Pages publica el frontend; estos archivos PHP se instalan por SSH en cPanel, no en Pages.
Nunca sobrescribir state.json al desplegar. No hay contrasenas SMTP en el codigo: usa el transporte local de cPanel con remitente fijo hola@estudioideamos.com.

## Controles

Solo admite los origenes HTTPS estudioideamos.com y www.estudioideamos.com. Limites de campos, formato de email y telefono, bloqueo de inyeccion de cabeceras, honeypot y tiempo minimo. Limites persistentes con bloqueo de archivo: 1 intento por minuto, 5 por hora por IP y 100 globales por hora. Deduplicacion de envios aceptados durante 10 minutos. El estado guarda hashes, no los datos de la consulta.

La respuesta exitosa indica aceptacion por el transporte local; no garantiza recepcion final. Se probaron validacion, rechazos, deduplicacion, limites y fallo de transporte sin enviar mensajes reales. La entrega a la casilla requiere una prueba real.