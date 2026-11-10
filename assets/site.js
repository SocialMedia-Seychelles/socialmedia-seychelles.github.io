(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // header
  const top = document.querySelector('.top');
  const onScroll = () => top && top.classList.toggle('scrolled', scrollY > 20);
  addEventListener('scroll', onScroll, {passive:true}); onScroll();
  const burger = document.querySelector('.burger');
  if (burger) burger.addEventListener('click', () => document.body.classList.toggle('menu-open'));

  // split headings into rising words (keeps <em> styling)
  document.querySelectorAll('[data-words]').forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            const w = document.createElement('span'); w.className = 'w';
            const s = document.createElement('span'); s.textContent = part; s.style.setProperty('--i', i++);
            w.appendChild(s); frag.appendChild(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el); el.classList.add('words');
  });

  // reveal on scroll (with stagger for children of [data-stagger])
  document.querySelectorAll('[data-stagger]').forEach(g => {
    [...g.children].forEach((c, k) => { c.setAttribute('data-reveal', c.getAttribute('data-reveal') || ''); c.style.setProperty('--d', (k * 0.09) + 's'); });
  });
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), {threshold: .15, rootMargin: '0px 0px -40px 0px'});
  document.querySelectorAll('[data-reveal],[data-words]').forEach(el => io.observe(el));
  // safety: never leave content hidden if the observer doesn't run (previews, thumbnails)
  setTimeout(() => document.querySelectorAll('[data-reveal]:not(.in),[data-words]:not(.in)').forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight) el.classList.add('in'); }), 2500);

  // count-up numbers: data-count="5.6" data-suffix="M"
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cio.unobserve(e.target);
    const el = e.target, end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
    const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
    const fmt = v => (dec === 0 && end >= 1000) ? Math.round(v).toLocaleString('en-US') : v.toFixed(dec);
    if (reduce) { el.textContent = pre + fmt(end) + suf; return; }
    const t0 = performance.now(), dur = 1400;
    const step = t => { const p = Math.min(1, (t - t0) / dur), v = end * (1 - Math.pow(1 - p, 3));
      el.textContent = pre + fmt(v) + suf; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), {threshold: .6});
  document.querySelectorAll('[data-count]').forEach(el => cio.observe(el));

  // videos: play only when on screen
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target; if (e.isIntersecting) { v.play().catch(()=>{}); } else v.pause();
  }), {threshold: .25});
  document.querySelectorAll('video[data-auto]').forEach(v => { v.muted = true; v.playsInline = true; vio.observe(v); });

  // parallax
  const px = [...document.querySelectorAll('[data-parallax]')];
  if (px.length && !reduce) {
    const run = () => { const h = innerHeight;
      px.forEach(el => { const r = el.getBoundingClientRect(); if (r.bottom < -100 || r.top > h + 100) return;
        const k = parseFloat(el.dataset.parallax) || .08, lim = el.offsetHeight * .06;
        const y = Math.max(-lim, Math.min(lim, ((r.top + r.height/2) - h/2) * -k)); el.style.transform = `translate3d(0,${y}px,0)`; });
    };
    addEventListener('scroll', () => requestAnimationFrame(run), {passive:true}); run();
  }

  // filters (UGC / Work)
  document.querySelectorAll('.filters').forEach(f => {
    const grid = document.querySelector(f.dataset.target);
    f.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return;
      f.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      const k = b.dataset.f;
      grid.querySelectorAll('[data-cat]').forEach(it => it.classList.toggle('hide', k !== 'all' && !it.dataset.cat.split(' ').includes(k)));
    });
  });

  // client switcher (Social Media): tabs swap phone media + stats, auto-advance while on screen
  document.querySelectorAll('.switch').forEach(sw => {
    const tabs = [...sw.querySelectorAll('.sw-tabs button')], media = [...sw.querySelectorAll('.sw-media')], panels = [...sw.querySelectorAll('.sw-panel')];
    const T = 7000; let cur = 0, timer = null, seen = false, held = false;
    sw.style.setProperty('--sw-t', T / 1000 + 's');
    const count = panel => panel.querySelectorAll('b[data-n]').forEach(b => {
      const end = parseFloat(b.dataset.n), dec = (b.dataset.n.split('.')[1] || '').length, pre = b.dataset.pre || '', suf = b.dataset.suf || '';
      const fmt = v => (dec === 0 && end >= 1000) ? Math.round(v).toLocaleString('en-US') : v.toFixed(dec);
      if (reduce) { b.textContent = pre + fmt(end) + suf; return; }
      const t0 = performance.now();
      const step = t => { const p = Math.min(1, (t - t0) / 1100); b.textContent = pre + fmt(end * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    });
    const show = i => {
      cur = i;
      tabs.forEach((t, k) => { const on = k === i; t.classList.remove('on'); void t.offsetWidth; t.classList.toggle('on', on); t.setAttribute('aria-selected', on); });
      media.forEach((m, k) => { m.classList.toggle('on', k === i); const v = m.querySelector('video'); if (v) { if (k === i && seen) v.play().catch(()=>{}); else v.pause(); } });
      panels.forEach((p, k) => p.classList.toggle('on', k === i));
      count(panels[i]);
      if (tabs[i].scrollIntoView && innerWidth <= 700) tabs[i].parentElement.scrollTo({left: tabs[i].offsetLeft - 16, behavior: 'smooth'});
    };
    const run = () => { clearInterval(timer); if (!held && !reduce) timer = setInterval(() => show((cur + 1) % tabs.length), T); };
    tabs.forEach((t, k) => t.addEventListener('click', () => { held = true; sw.classList.add('hold'); clearInterval(timer); show(k); }));
    if (reduce) sw.classList.add('hold');
    new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { if (!seen) { seen = true; show(cur); } run(); const v = media[cur].querySelector('video'); if (v) v.play().catch(()=>{}); }
      else { clearInterval(timer); media.forEach(m => { const v = m.querySelector('video'); if (v) v.pause(); }); }
    }), {threshold: .35}).observe(sw);
  });

  // curved 3D ring (Work)
  const ring = document.querySelector('.ring');
  if (ring) {
    const cards = [...ring.children], n = cards.length, step = 360 / n;
    const w = ring.offsetWidth, radius = Math.round((w / 2) / Math.tan(Math.PI / n)) + 40;
    ring.style.transform = `translateZ(${-radius}px)`;
    cards.forEach((c, i) => c.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px)`);
    let rot = 0, vel = reduce ? 0 : -0.06, drag = false, lastX = 0, idle = 0;
    const stage = ring.parentElement;
    const apply = () => { ring.style.transform = `translateZ(${-radius}px) rotateY(${rot}deg)`;
      cards.forEach((c, i) => { let a = ((i * step + rot) % 360 + 360) % 360; if (a > 180) a -= 360;
        c.style.opacity = Math.max(.25, 1 - Math.abs(a) / 150); }); };
    const loop = () => { if (!drag) { rot += vel; if (idle > 0) idle--; else vel += ((reduce ? 0 : -0.06) - vel) * 0.03; } apply(); requestAnimationFrame(loop); };
    stage.addEventListener('pointerdown', e => { drag = true; lastX = e.clientX; stage.setPointerCapture(e.pointerId); });
    stage.addEventListener('pointermove', e => { if (!drag) return; const dx = e.clientX - lastX; lastX = e.clientX; rot += dx * 0.18; vel = dx * 0.18; });
    const up = () => { drag = false; idle = 90; };
    stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
    loop();
  }
})();
