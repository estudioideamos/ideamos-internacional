# Ideamos Internacional — sitio institucional

Sitio de [Ideamos Internacional](https://estudioideamos.com), desarrollado con Next.js y publicado como exportación estática en GitHub Pages.

## Stack

- Next.js 16 con App Router
- React 19 y TypeScript
- Exportación estática (`output: "export"`)
- GitHub Actions + GitHub Pages
- Dominio canónico: `https://estudioideamos.com`
- Repositorio: `estudioideamos/ideamos-internacional`

## Desarrollo local

Requiere Node.js 22 o superior.

```bash
npm ci
npm run dev
```

Abrir `http://localhost:3000`.

## Validación

```bash
npm run typecheck
npm run lint
npm test
```

`npm test` genera el sitio estático y valida títulos, URLs canónicas, sitemap, robots, archivos para asistentes de IA y las optimizaciones críticas de carga.

## Estructura principal

- `app/`: páginas, metadatos, sitemap y robots.
- `components/`: componentes visuales compartidos.
- `lib/`: configuración común de SEO, analítica y contacto.
- `public/`: imágenes, videos, favicon, verificación y archivos públicos.
- `.github/workflows/deploy-pages.yml`: publicación automática.

Las rutas públicas de prueba no deben agregarse a `app/`. Para experimentar, usar una rama o un entorno local.

## SEO y descubrimiento

- Sitemap: `https://estudioideamos.com/sitemap.xml`
- Robots: `https://estudioideamos.com/robots.txt`
- Resumen para agentes: `https://estudioideamos.com/llms.txt`
- Información ampliada: `https://estudioideamos.com/llms-full.txt`
- Contacto de seguridad: `https://estudioideamos.com/security.txt`

Los títulos, descripciones, datos sociales y URLs canónicas se generan desde `lib/seo.ts`. Toda página pública nueva debe usar `createPageMetadata` y agregarse a `app/sitemap.ts`.

## Rendimiento

- Las capturas del sitio se publican en WebP y con dimensiones explícitas.
- El video decorativo principal usa un poster WebP inmediato y se reserva para escritorio; en móvil se prioriza el contenido.
- Las animaciones automáticas se publican sin audio y con un presupuesto de peso cubierto por pruebas.
- La portada es estática y delega solo las galerías, menú, videos y controles necesarios a componentes interactivos.
- El proyecto usa CSS propio con un reset mínimo; no incorpora Tailwind ni su cadena de compilación.
- Google Analytics se carga tras la primera interacción o cuando la página queda inactiva.
- Las fuentes externas no deben agregarse a la ruta crítica.

## Seguridad y mantenimiento

- Las dependencias se mantienen fijadas en versiones exactas y se auditan antes de publicar.
- Dependabot revisa semanalmente npm y mensualmente las acciones de GitHub.
- El formulario incluye honeypot, límite temporal, bloqueo de duplicados y timeout.
- El contacto de seguridad se publica en `/.well-known/security.txt`.

## Publicación

Cada push a `main` ejecuta el workflow **Deploy to GitHub Pages**. El workflow detecta si está publicando con el dominio personalizado o con la URL de proyecto y ajusta automáticamente las rutas de recursos.

No se deben subir manualmente `.next/`, `out/`, `node_modules/` ni archivos de variables de entorno.

## Autoría

Diseño, estrategia y desarrollo por [Ideamos](https://ideamos.com.ar).

## Colaboracion y soporte

Ver [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md) y la [configuracion del formulario](server/contact/README.md). Las consultas del sitio llegan a hola@estudioideamos.com.
