# Revision de seguridad y rendimiento: 2026-09-29

Alcance: estudioideamos.com (exportacion estatica) y su receptor PHP de contacto. Guia: https://top10.owasp.org/2025/. No es una certificacion ni una prueba de penetracion completa.

## Controles revisados

| Riesgo OWASP 2025 | Evidencia y limites |
| --- | --- |
| A01 Acceso | Sin sesiones ni panel publico. Destinatario fijo. CORS restringido; CORS no autentica bots. |
| A02 Configuracion | Endpoint con HTTPS, cabeceras y archivos privados fuera de la raiz publica. Las cabeceras del endpoint no se aplican al frontend en Pages. |
| A03 Cadena de suministro | Versiones fijadas, lockfile, auditoria npm y workflows con acciones fijadas por SHA. Actualizacion correctiva Next 16.3.7. |
| A04 Criptografia | TLS y desafios HMAC con random_bytes y hash_equals. No hay credenciales SMTP en el repositorio. |
| A05 Inyeccion | Validacion de tipos, longitud y cabeceras; correo de texto plano; no hay consultas SQL ni comandos construidos con datos del formulario. |
| A06 Diseno | Honeypot, limites persistentes y deduplicacion. Un bot puede solicitar desafios validos: no equivalen a CAPTCHA ni proteccion DDoS. |
| A07 Autenticacion | La web no tiene login. 2FA de cPanel requiere verificacion/activacion por el titular. |
| A08 Integridad | Desafios de un uso, firma y vencimiento. Las respuestas exitosas corresponden a aceptacion por el transporte, no a recepcion final. |
| A09 Registro | Errores genericos en respuesta y registros privados. No existe monitorizacion de incidentes verificada de extremo a extremo. |
| A10 Excepciones | Corregido: reutilizar un desafio consumido tras fallo de correo devuelve error, nunca una confirmacion falsa. Prueba de regresion con transporte simulado. |

Rendimiento: Lenis pasa a importacion dinamica solo para puntero fino sin movimiento reducido. Se conserva el scroll nativo cuando la descarga falla. Se ejecutan los controles existentes de peso de medios, SEO y exportacion. Sin medicion nueva de PageSpeed no se afirma una mejora numerica.

Pendientes: confirmar entrega real de correo; verificar 2FA y alertas operativas; revisar seguridad del proveedor, backups restaurables y cabeceras del frontend/CDN. DMARC, greylisting y politica de destinatarios inexistentes conservan su configuracion hasta la decision del titular.
