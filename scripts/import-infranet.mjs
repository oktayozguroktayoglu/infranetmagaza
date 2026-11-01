// infranet.com.tr ana sayfasını, stil dosyalarını ve logoyu indirir (renk paleti ve logo için).
import { mkdir, writeFile, access } from 'node:fs/promises';
const exists = (p) => access(p).then(() => true, () => false);
const UA = { 'user-agent': 'Mozilla/5.0 (infranet-magaza-import)' };
await mkdir('import', { recursive: true });
await mkdir('public/brand', { recursive: true });
if (await exists('import/home.html')) { console.log('zaten var'); process.exit(0); }
const html = await (await fetch('https://infranet.com.tr/', { headers: UA })).text();
await writeFile('import/home.html', html);
const css = [...html.matchAll(/<link[^>]+href=['"]([^'"]+\.css[^'"]*)['"]/g)].map((m) => m[1]);
let i = 0;
for (const u of css) {
  try { const r = await fetch(u.startsWith('http') ? u : 'https://infranet.com.tr' + u, { headers: UA }); if (r.ok) await writeFile(`import/style-${++i}.css`, await r.text()); } catch (e) { console.warn('css', u, e.message); }
}
const imgs = [...html.matchAll(/<img[^>]+>/g)].map((m) => m[0]).filter((t) => /logo/i.test(t));
let k = 0;
for (const t of imgs.slice(0, 6)) {
  const src = (t.match(/src=['"]([^'"]+)['"]/) || [])[1];
  if (!src) continue;
  try { const r = await fetch(src, { headers: UA }); if (r.ok) { const ext = (src.split('?')[0].match(/\.(\w+)$/) || [, 'png'])[1]; await writeFile(`public/brand/logo-${++k}.${ext}`, Buffer.from(await r.arrayBuffer())); await writeFile('import/logos.txt', imgs.join('\n')); } } catch (e) { console.warn('logo', src, e.message); }
}
console.log('css:', i, 'logo:', k);
