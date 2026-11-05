// Checks provelox-templates.yaml and every Compose file it names, with the rules Provelox applies when it reads a
// registry (docs: Guide → Template registries). Run: npm run validate. Exit code 1 if anything is wrong.
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join, isAbsolute, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INDEX = join(root, 'provelox-templates.yaml');
const ID = /^[a-z0-9-]{1,48}$/;
const KEY = /^[A-Za-z_][A-Za-z0-9_]*$/;
const REF = /\$\{([A-Za-z_][A-Za-z0-9_]*)/g;
// Refused by Provelox: they would give a service more power over the server than an app has.
const REFUSED = ['privileged', 'cap_add', 'devices', 'network_mode', 'pid', 'ipc', 'security_opt', 'sysctls', 'build', 'env_file'];
const MAX_TEMPLATES = 200;

const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);

const index = YAML.parse(readFileSync(INDEX, 'utf8'));
const templates = Array.isArray(index?.templates) ? index.templates : null;
if (!templates) fail('provelox-templates.yaml', 'needs a "templates" list');
else if (templates.length > MAX_TEMPLATES) fail('provelox-templates.yaml', `at most ${MAX_TEMPLATES} templates`);

const seen = new Set();
for (const t of templates ?? []) {
  const w = `template "${t?.id ?? '?'}"`;
  if (typeof t?.id !== 'string' || !ID.test(t.id)) fail(w, 'id must be lowercase letters, numbers and dashes, up to 48');
  else if (seen.has(t.id)) fail(w, 'id is used twice');
  else seen.add(t.id);
  if (!t?.name) fail(w, 'name is required');
  if (!t?.description || t.description.length < 20) fail(w, 'description should say what the app is (20+ characters)');
  if (t?.category && String(t.category).length > 30) fail(w, 'category is at most 30 characters');
  if (t?.icon && !/^[a-z0-9-]+$/.test(t.icon) && !/^https:\/\//.test(t.icon)) fail(w, 'icon is a built-in name or an https:// address');
  if (t?.publicWeb !== undefined && typeof t.publicWeb !== 'boolean') fail(w, 'publicWeb is true or false');
  if (!t?.mainService) fail(w, 'mainService is required');

  // The Compose file: inline, or a path inside this repository.
  let text = t?.compose;
  if (t?.composeFile) {
    const p = String(t.composeFile);
    const abs = resolve(root, p);
    if (isAbsolute(p) || relative(root, abs).startsWith('..')) fail(w, `composeFile "${p}" must stay inside the repository`);
    else if (!existsSync(abs)) fail(w, `composeFile "${p}" does not exist`);
    else text = readFileSync(abs, 'utf8');
  } else if (!t?.compose) {
    fail(w, 'needs compose or composeFile');
  }
  if (!text) continue;

  let doc;
  try {
    doc = YAML.parse(text);
  } catch (e) {
    fail(w, `Compose file does not parse: ${e.message.split('\n')[0]}`);
    continue;
  }
  const services = doc?.services ?? {};
  if (!Object.keys(services).length) fail(w, 'Compose file has no services');
  if (t?.mainService && !services[t.mainService]) fail(w, `mainService "${t.mainService}" is not a service in the Compose file`);

  for (const [name, svc] of Object.entries(services)) {
    for (const key of REFUSED) if (svc && key in svc) fail(w, `service "${name}" uses ${key}, which Provelox refuses`);
    const exposed = svc?.['x-provelox']?.expose === true;
    if (exposed && name !== t?.mainService) fail(w, `only mainService may be exposed; "${name}" has x-provelox.expose`);
  }
  // A web template needs its main service exposed; a private one (a database, a cache) must not be exposed at all.
  const mainExposed = services[t?.mainService]?.['x-provelox']?.expose === true;
  if (t?.publicWeb === true && !mainExposed) fail(w, `publicWeb is true but mainService "${t?.mainService}" has no x-provelox: { expose: true, port: … }`);
  if (t?.publicWeb !== true && mainExposed) fail(w, `mainService "${t?.mainService}" is exposed; set publicWeb: true or remove expose`);

  // Variables: every ${NAME} used is declared, and every declared one is used.
  const declared = new Set();
  for (const v of t?.variables ?? []) {
    if (!v?.key || !KEY.test(v.key)) fail(w, `variable key "${v?.key}" is not a valid name`);
    else if (declared.has(v.key)) fail(w, `variable ${v.key} is declared twice`);
    else declared.add(v.key);
    if (v?.kind && v.kind !== 'text' && v.kind !== 'secret') fail(w, `variable ${v.key} kind must be text or secret`);
  }
  const used = new Set([...text.matchAll(REF)].map((m) => m[1]));
  for (const u of used) if (!declared.has(u)) fail(w, `\${${u}} is used but not declared in variables`);
  for (const d of declared) if (!used.has(d)) fail(w, `variable ${d} is declared but never used`);
}

if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`\n${errors.length} problem(s).`);
  process.exit(1);
}
console.log(`OK: ${templates.length} templates checked.`);
