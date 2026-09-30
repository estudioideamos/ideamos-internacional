# reCAPTCHA v3 - Ideamos Internacional

- Only estudioideamos.com and www.estudioideamos.com are accepted.
- Public key: GitHub repository variable NEXT_PUBLIC_RECAPTCHA_SITE_KEY, injected at build time. Never put the secret in a NEXT_PUBLIC variable.
- Private key: recaptcha-secret.php next to the private handler, outside the document root. File returns the secret as a PHP string; permissions 0600, directory 0700. This file is ignored by Git.
- Upload recaptcha.php before replacing handler.php. Keep a private backup of the previous handler. Never copy tests or credentials into the document root.
- Verification is mandatory on the server, before mail transport, including success, action contact_submit, exact hostname, numeric score >= 0.5 and timestamp within two minutes.
- Invalid tokens are rejected; provider errors fail closed. Existing rate limits, signed challenge, honeypot and deduplication remain.
- Script loads on form focus, with a fresh token on submit. The Google badge and privacy/terms notice remain visible. No token or key is logged.
- Unit tests use injected verification and mail transports, never real delivery. Run php server/contact/tests.php.
- Review scores in Google's console and legitimate failure reports before adjusting the threshold. No CAPTCHA eliminates all spam.
- Activation order: configure private secret and verifier, publish the frontend with the public key, then activate the mandatory backend gate and verify production. During this short transition the existing antispam protections remain.
- A real browser acceptance and mailbox-receipt check is still required; static checks and rejection tests alone do not prove delivery.

Google documentation: https://developers.google.com/recaptcha/docs/v3 and https://developers.google.com/recaptcha/docs/verify
