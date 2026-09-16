# Como publicar cambios

1. Crear una rama desde main actualizado.
2. Ejecutar npm ci, npm run typecheck, npm run lint y npm test.
3. Si cambia server/contact, ejecutar php server/contact/tests.php: no envia correos.
4. Abrir una propuesta de cambio (pull request). Resolver las conversaciones y esperar validate y contact-tests.
5. Integrar con squash. main no admite pushes directos, borrados ni force push.
6. Esperar Deploy to GitHub Pages y comprobar el sitio publicado. PHP se publica separadamente en cPanel.

No se exige una segunda persona para aprobar: la cuenta tiene un unico administrador. Las actualizaciones mayores de Dependabot se revisan individualmente y no se integran automaticamente.

No modificar desde este proyecto ideamosdemo ni el sitio argentino.