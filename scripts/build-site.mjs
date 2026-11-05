// Builds the GitHub Pages site into site/: one page listing every template in provelox-templates.yaml, with its logo,
// category and a link to its Compose file, plus the icons. No dependencies beyond the yaml package. Run: npm run site
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'site');
const REPO = 'https://github.com/provelox/templates';

const index = YAML.parse(readFileSync(join(root, 'provelox-templates.yaml'), 'utf8'));
const templates = [...index.templates].sort((a, b) => a.name.localeCompare(b.name));
const categories = [...new Set(templates.map((t) => t.category || 'Other'))].sort();

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const initials = (name) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const card = (t) => {
  const logo = t.icon
    ? `<img src="${esc(t.icon)}" alt="" width="40" height="40" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'initials',textContent:this.dataset.initials}))" data-initials="${esc(initials(t.name))}">`
    : `<span class="initials">${esc(initials(t.name))}</span>`;
  const tags = [t.category || 'Other', t.publicWeb ? 'web' : null].filter(Boolean);
  return `<article class="card" data-search="${esc(`${t.name} ${t.description ?? ''} ${t.category ?? ''} ${t.id}`.toLowerCase())}" data-category="${esc(t.category || 'Other')}">
  <div class="logo">${logo}</div>
  <div class="body">
    <h2>${esc(t.name)}</h2>
    <p>${esc(t.description ?? '')}</p>
    <div class="meta">${tags.map((x) => `<span class="tag">${esc(x)}</span>`).join('')}</div>
    <a class="src" href="${REPO}/blob/main/apps/${esc(t.id)}/compose.yml">Compose file</a>
  </div>
</article>`;
};

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Provelox templates</title>
<meta name="description" content="${templates.length} ready-made apps for Provelox, each a Docker Compose file you can read before you deploy it.">
<style>
  :root { color-scheme: light dark; --bg: #f7f7f8; --fg: #16181d; --muted: #5b616e; --card: #ffffff; --line: #e2e4e9; --accent: #2f5bea; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #0e1117; --fg: #e8eaf0; --muted: #9aa3b2; --card: #161b24; --line: #262d3a; --accent: #7aa2ff; } }
  :root[data-theme="dark"] { --bg: #0e1117; --fg: #e8eaf0; --muted: #9aa3b2; --card: #161b24; --line: #262d3a; --accent: #7aa2ff; }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  main { max-width: 1100px; margin: 0 auto; padding: 32px 16px 64px; }
  h1 { margin: 0 0 4px; font-size: 28px; }
  .lede { color: var(--muted); margin: 0 0 20px; max-width: 70ch; }
  .controls { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
  input, select { font: inherit; color: var(--fg); background: var(--card); border: 1px solid var(--line); border-radius: 8px; padding: 9px 12px; }
  input { flex: 1 1 260px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
  .card { display: flex; gap: 12px; background: var(--card); border: 1px solid var(--line); border-radius: 12px; padding: 14px; }
  .logo { flex: 0 0 40px; }
  .logo img, .initials { width: 40px; height: 40px; border-radius: 8px; display: block; }
  .initials { background: var(--line); color: var(--fg); font-weight: 700; font-size: 13px; line-height: 40px; text-align: center; }
  .body { min-width: 0; }
  h2 { font-size: 16px; margin: 0 0 4px; }
  p { margin: 0 0 8px; color: var(--muted); font-size: 14px; }
  .meta { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; }
  .tag { font-size: 12px; color: var(--muted); border: 1px solid var(--line); border-radius: 999px; padding: 1px 8px; }
  .src { font-size: 13px; color: var(--accent); text-decoration: none; }
  .src:hover { text-decoration: underline; }
  .count { color: var(--muted); font-size: 14px; margin: 0 0 12px; }
  .how { margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--line); max-width: 75ch; }
  code { background: var(--card); border: 1px solid var(--line); border-radius: 6px; padding: 1px 6px; font-size: 13px; word-break: break-all; }
  a { color: var(--accent); }
  .hidden { display: none !important; }
  @media (max-width: 480px) { main { padding: 24px 16px 48px; } }
</style>
</head>
<body>
<main>
  <h1>Provelox templates</h1>
  <p class="lede">${templates.length} ready-made apps for Provelox. Each is a Docker Compose file you can read before you deploy it. Passwords and secret keys are generated for every deployment.</p>
  <div class="controls">
    <input id="q" type="search" placeholder="Search ${templates.length} templates" aria-label="Search templates">
    <select id="cat" aria-label="Category">
      <option value="">All categories</option>
      ${categories.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join('\n      ')}
    </select>
  </div>
  <p class="count" id="count">${templates.length} templates</p>
  <section class="grid" id="grid">
${templates.map(card).join('\n')}
  </section>
  <section class="how">
    <h2>Use these in Provelox</h2>
    <p>In the console, open <strong>Settings → Template registries</strong>, choose <strong>Git repository</strong>, and enter:</p>
    <p>Repository <code>${REPO}</code>, branch <code>main</code>, file <code>provelox-templates.yaml</code>.</p>
    <p>To add an app, see <a href="${REPO}/blob/main/CONTRIBUTING.md">CONTRIBUTING.md</a>. The source is on <a href="${REPO}">GitHub</a>.</p>
  </section>
</main>
<script>
  (function () {
    var q = document.getElementById('q'), cat = document.getElementById('cat');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.card'));
    var count = document.getElementById('count');
    function apply() {
      var needle = q.value.trim().toLowerCase(), c = cat.value, shown = 0;
      cards.forEach(function (el) {
        var ok = (!needle || el.dataset.search.indexOf(needle) !== -1) && (!c || el.dataset.category === c);
        el.classList.toggle('hidden', !ok);
        if (ok) shown++;
      });
      count.textContent = shown + (shown === 1 ? ' template' : ' templates');
    }
    q.addEventListener('input', apply);
    cat.addEventListener('change', apply);
  })();
</script>
</body>
</html>
`;

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'index.html'), html);
writeFileSync(join(out, '.nojekyll'), '');
cpSync(join(root, 'icons'), join(out, 'icons'), { recursive: true });
cpSync(join(root, 'provelox-templates.yaml'), join(out, 'provelox-templates.yaml'));
console.log(`site: ${templates.length} templates, ${categories.length} categories -> ${out}`);
