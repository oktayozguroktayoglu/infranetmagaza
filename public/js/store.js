// Infranet Mağaza – önizleme sepeti ve teklif listesi (tarayıcıda saklanır, sunucu yok).
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem('inf_' + k)) || {}; } catch { return {}; } },
    set(k, v) { try { localStorage.setItem('inf_' + k, JSON.stringify(v)); } catch {} },
  };
  const bySlug = Object.fromEntries((window.CATALOG || []).map((p) => [p.s, p]));
  const tl = (n) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: n < 100 ? 2 : 0 }).format(n);
  window.tl = tl;

  const counts = () => {
    const c = store.get('cart'), q = store.get('quote');
    const items = Object.entries(c).reduce((a, [s, qty]) => a + (bySlug[s]?.u ? 1 : qty), 0);
    $$('[data-count="cart"]').forEach((e) => (e.textContent = items));
    $$('[data-count="quote"]').forEach((e) => (e.textContent = Object.keys(q).length));
  };
  const toast = (html) => {
    const t = $('.toast'); if (!t) return;
    t.innerHTML = html; t.hidden = false; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(() => { t.classList.remove('show'); setTimeout(() => (t.hidden = true), 250); }, 2600);
  };
  window.addToCart = (slug, qty = 1) => {
    const c = store.get('cart'); c[slug] = (c[slug] || 0) + qty; store.set('cart', c); counts();
    const p = bySlug[slug];
    toast(`<b>✓ Sepete eklendi</b><span>${p ? p.n : ''}</span><a href="${window.BASE}sepet/">Sepete git</a>`);
  };
  window.addToQuote = (slug, qty = 1) => {
    const q = store.get('quote'); q[slug] = (q[slug] || 0) + qty; store.set('quote', q); counts();
    const p = bySlug[slug];
    toast(`<b>✓ Teklif listesine eklendi</b><span>${p ? p.n : ''}</span><a href="${window.BASE}teklif/">Listeyi gör</a>`);
  };
  window.storeApi = { store, bySlug, counts, toast };

  // ürün kartı ve sayfa butonları
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add],[data-quote]');
    if (!b) return;
    e.preventDefault();
    const qtyEl = b.dataset.qtyFrom && $(b.dataset.qtyFrom);
    const qty = Math.max(1, parseFloat(qtyEl?.value || b.dataset.min || 1));
    if (b.dataset.add) window.addToCart(b.dataset.add, qty);
    else window.addToQuote(b.dataset.quote, qty);
  });

  // KDV dahil/hariç göstergesi
  const applyKdv = () => {
    const on = localStorage.getItem('inf_kdv') === '1';
    $$('[data-price]').forEach((el) => {
      const v = parseFloat(el.dataset.price) * (on ? 1 + window.KDV : 1);
      el.textContent = tl(v);
    });
    $$('[data-kdv-label]').forEach((el) => (el.textContent = on ? 'KDV dahil' : '+ KDV'));
    $$('.kdv-toggle input').forEach((i) => (i.checked = on));
  };
  document.addEventListener('change', (e) => {
    if (e.target.matches('.kdv-toggle input')) { localStorage.setItem('inf_kdv', e.target.checked ? '1' : '0'); applyKdv(); }
  });
  window.applyKdv = applyKdv;

  // tüm kategoriler menüsü
  const drawer = $('#drawer'), allBtn = $('.all-btn');
  const close = () => { drawer.hidden = true; allBtn?.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; };
  allBtn?.addEventListener('click', () => { drawer.hidden = false; allBtn.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; });
  drawer?.addEventListener('click', (e) => { if (e.target === drawer || e.target.closest('.drawer-close')) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && drawer && !drawer.hidden) close(); });

  // arama önerileri
  const form = $('.search'), input = $('#sq'), sug = $('.suggest');
  const norm = (s) => s.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '');
  input?.addEventListener('input', () => {
    const v = norm(input.value.trim());
    if (v.length < 2) { sug.hidden = true; return; }
    const hits = (window.CATALOG || []).filter((p) => norm(p.n + ' ' + p.b).includes(v)).slice(0, 7);
    sug.innerHTML = hits.map((p) => `<a href="${window.BASE}urun/${p.s}/"><b>${p.b}</b> ${p.n.replace(p.b, '').trim()}</a>`).join('') || '<p>Sonuç yok — tüm sonuçlar için Enter’a basın</p>';
    sug.hidden = false;
  });
  document.addEventListener('click', (e) => { if (sug && !e.target.closest('.search')) sug.hidden = true; });

  // son görüntülenenler
  const pv = document.body.dataset.product;
  if (pv) { const r = (JSON.parse(localStorage.getItem('inf_recent') || '[]')).filter((s) => s !== pv); r.unshift(pv); localStorage.setItem('inf_recent', JSON.stringify(r.slice(0, 8))); }

  counts(); applyKdv();
})();
