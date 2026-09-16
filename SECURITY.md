# Seguridad

Este repositorio contiene exclusivamente el sitio de Ideamos Internacional.

## Reportar una vulnerabilidad

Usar el reporte privado de GitHub:
https://github.com/estudioideamos/ideamos-internacional/security/advisories/new

Alternativamente escribir a hola@estudioideamos.com. No publicar credenciales, datos personales ni detalles explotables en una issue publica. Incluir ruta afectada, pasos para reproducir e impacto esperado.

## Controles

- Alertas y actualizaciones de seguridad de Dependabot.
- Deteccion de secretos y proteccion al subir cambios.
- CodeQL para JavaScript/TypeScript y GitHub Actions.
- Rama main protegida: propuestas de cambio y pruebas obligatorias; sin borrados ni force push.
- Acciones oficiales fijadas por SHA y permisos minimos por trabajo.
- El formulario PHP se prueba por separado con transporte simulado; CodeQL no analiza PHP.

Las claves SSH y archivos de entorno quedan fuera del repositorio. La clave de cPanel no se almacena en GitHub Actions. El backend se instala por separado segun server/contact/README.md.