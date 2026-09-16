import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const out = new URL("../out/", import.meta.url);

function hasExactUrl(text, expected) {
  const expectedUrl = new URL(expected).href;
  return [...text.matchAll(/https?:\/\/[^\s"'<>\\)]+/g)].some(([value]) => {
    try { return new URL(value).href === expectedUrl; }
    catch { return false; }
  });
}

const pagePaths = [
  ["index.html", "https://estudioideamos.com/"],
  ["diseno-web-autoadministrable/index.html", "https://estudioideamos.com/diseno-web-autoadministrable/"],
  ["tiendas-online/index.html", "https://estudioideamos.com/tiendas-online/"],
  ["marketing-digital/index.html", "https://estudioideamos.com/marketing-digital/"],
  ["posicionamiento-web/index.html", "https://estudioideamos.com/posicionamiento-web/"],
  ["casos-de-exito/index.html", "https://estudioideamos.com/casos-de-exito/"],
  ["testimonios/index.html", "https://estudioideamos.com/testimonios/"],
  ["precios/index.html", "https://estudioideamos.com/precios/"],
  ["contacto/index.html", "https://estudioideamos.com/contacto/"],
];

test("cada página pública tiene título, descripción y canonical", async () => {
  for (const [file, canonical] of pagePaths) {
    const html = await readFile(new URL(file, out), "utf8");
    assert.match(html, /<title>[^<]{20,60}<\/title>/i, file);
    assert.match(html, /<meta name="description" content="[^"]{80,170}"/i, file);
    assert.ok(html.includes(`<link rel="canonical" href="${canonical}"`), file);
  }
});

test("la portada acredita a Ideamos y expone datos estructurados", async () => {
  const html = await readFile(new URL("index.html", out), "utf8");
  assert.match(html, /name="author" content="Ideamos"/i);
  assert.match(html, /name="developed-by" content="Ideamos — https:\/\/ideamos\.com\.ar"/i);
  assert.match(html, /application\/ld\+json/i);
  assert.ok(hasExactUrl(html, "https://schema.org"));
  assert.match(html, /rel="describedby" href="\/llms\.txt"/i);
  assert.ok(hasExactUrl(html, "https://www.linkedin.com/company/64755212"));
  assert.ok(hasExactUrl(html, "https://www.facebook.com/ideamos.com.ar"));
});

test("sitemap profesional: solo páginas públicas y prioridades válidas", async () => {
  const xml = await readFile(new URL("sitemap.xml", out), "utf8");
  for (const [, canonical] of pagePaths) assert.ok(xml.includes(`<loc>${canonical}</loc>`), canonical);
  assert.doesNotMatch(xml, /\/test2?\//i);
  assert.match(xml, /<priority>1<\/priority>/);
  assert.match(xml, /<priority>0\.95<\/priority>/);
  assert.equal((xml.match(/<url>/g) ?? []).length, pagePaths.length);
});

test("robots y archivos para agentes están publicados", async () => {
  const robots = await readFile(new URL("robots.txt", out), "utf8");
  const llms = await readFile(new URL("llms.txt", out), "utf8");
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/estudioideamos\.com\/sitemap\.xml/);
  assert.match(robots, /OAI-SearchBot/);
  assert.match(robots, /ClaudeBot/);
  assert.match(robots, /PerplexityBot/);
  assert.match(llms, /^# Ideamos/m);
  assert.ok(hasExactUrl(llms, "https://estudioideamos.com/llms-full.txt"));
  assert.ok(hasExactUrl(llms, "https://www.linkedin.com/company/64755212"));
  assert.ok(hasExactUrl(llms, "https://www.facebook.com/ideamos.com.ar"));
  await access(new URL("security.txt", out));
  await access(new URL(".well-known/security.txt", out));
  await access(new URL(".nojekyll", out));
  const deployWorkflow = await readFile(
    new URL("../.github/workflows/deploy-pages.yml", import.meta.url),
    "utf8",
  );
  assert.match(deployWorkflow, /include-hidden-files:\s*true/);
  await access(new URL("public/googlecac1ad33023af32c.html", root));
});

test("la portada conserva las optimizaciones críticas de rendimiento", async () => {
  const html = await readFile(new URL("index.html", out), "utf8");
  const stylesheets = html.match(/<link rel="stylesheet"/g) ?? [];

  const resources = [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(([, value]) => new URL(value, "https://estudioideamos.com"));
  assert.ok(resources.every((url) => url.hostname !== "fonts.googleapis.com"));
  assert.ok(!html.includes('<script src="https://www.googletagmanager.com/gtag'));
  for (const prefix of ["", "shop-", "frosz-"]) {
    for (const number of [1, 2, 3]) {
      assert.ok(!html.includes(`/media/${prefix}screen-${number}.png`));
    }
  }
  assert.ok(html.includes("/media/screen-1.webp"));
  assert.ok(html.includes('rel="preload" href="/fonts/Gilroy-ExtraBold.otf"'));
  assert.ok(html.includes('rel="preload" href="/media/hero-poster.webp"'));
  assert.ok(html.includes('poster="/media/hero-poster.webp"'));
  assert.ok(html.includes('rel="icon" href="/favicon.jpg"'));
  assert.ok(html.includes("/media/client-001.webp"));
  for (const image of html.match(/<img\b[^>]*>/g) ?? []) {
    assert.match(image, /\bwidth=/, image);
    assert.match(image, /\bheight=/, image);
  }
  assert.ok(stylesheets.length <= 2, `La portada carga ${stylesheets.length} hojas de estilo`);
});

test("el contacto publica las redes oficiales con iconos accesibles", async () => {
  const html = await readFile(new URL("contacto/index.html", out), "utf8");

  assert.match(html, /aria-label="Ideamos en LinkedIn"/);
  assert.match(html, /aria-label="Ideamos en Instagram"/);
  assert.match(html, /aria-label="Contactar a Ideamos por WhatsApp"/);
  assert.match(html, /aria-label="Ideamos en Facebook"/);
  assert.ok(hasExactUrl(html, "https://www.linkedin.com/company/64755212"));
  assert.ok(hasExactUrl(html, "https://www.facebook.com/ideamos.com.ar"));
});

test("el presupuesto de rendimiento evita regresiones pesadas", async () => {
  const homeSource = await readFile(new URL("app/page.tsx", root), "utf8");
  const rootLayout = await readFile(new URL("app/layout.tsx", root), "utf8");
  const packageJson = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
  const videoLimits = {
    "public/media/video-wall-background-2026.webm": 1_500_000,
    "public/media/tablet-animated-final.webm": 700_000,
    "public/media/videollamada-final.webm": 400_000,
    "public/media/marketing-wilde.webm": 450_000,
    "public/media/posicionamiento-video-ads.mp4": 900_000,
  };

  assert.doesNotMatch(homeSource, /^"use client"/);
  assert.equal(packageJson.dependencies?.tailwindcss, undefined);
  assert.equal(packageJson.devDependencies?.tailwindcss, undefined);
  assert.equal(packageJson.devDependencies?.["@tailwindcss/postcss"], undefined);
  assert.match(rootLayout, /casos-de-exito\/casos\.css/);
  assert.match(rootLayout, /DriftWall\.css/);

  for (const [file, maximumBytes] of Object.entries(videoLimits)) {
    const details = await stat(new URL(file, root));
    assert.ok(details.size <= maximumBytes, `${file} pesa ${details.size} bytes`);
  }
});

test("las páginas internas publican schema específico y breadcrumbs", async () => {
  const servicePages = pagePaths.slice(1, 5);
  for (const [file] of pagePaths.slice(1)) {
    const html = await readFile(new URL(file, out), "utf8");
    assert.match(html, /"@type":"BreadcrumbList"/, file);
  }
  for (const [file] of servicePages) {
    const html = await readFile(new URL(file, out), "utf8");
    assert.match(html, /"@type":"Service"/, file);
  }
});

test("los recursos visuales críticos usan formatos livianos y dimensiones", async () => {
  const sourceFiles = [
    "app/page.tsx",
    "components/ShopPage.tsx",
    "components/TestimonialCard.tsx",
    "components/PosicionamientoWebPage.tsx",
    "components/MarketingDigitalPage.tsx",
  ];
  const source = (await Promise.all(sourceFiles.map((file) => readFile(new URL(file, root), "utf8")))).join("\n");

  assert.doesNotMatch(source, /client-.*\.png/);
  assert.doesNotMatch(source, /marketing-google-00[01]\.jpg/);
  assert.doesNotMatch(source, /posicionamiento-(phone|tablet|maps)\.png/);
  assert.match(source, /width=/);
  assert.match(source, /loading="lazy"/);
});

test("el formulario conserva las defensas antispam", async () => {
  const source = await readFile(new URL("components/ContactLeadForm.tsx", root), "utf8");

  assert.match(source, /name="_gotcha"/);
  assert.match(source, /MIN_COMPLETION_TIME_MS/);
  assert.match(source, /SUBMISSION_COOLDOWN_MS/);
  assert.match(source, /DUPLICATE_WINDOW_MS/);
  assert.match(source, /AbortController/);
  assert.match(source, /maxLength=\{2000\}/);
});
