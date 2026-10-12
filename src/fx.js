/* ===== Efeitos de partículas por cima de toda a tela =====
   Moedas voando até o saldo, confete, brilhos e corações. Um canvas só, que dorme quando não há partículas. */
const Fx = (() => {
  let cv = null, cx = null, dpr = 1, parts = [], raf = 0, ultimo = 0;
  const reduzido = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function garantir() {
    if (cv) return true;
    cv = document.getElementById('fx'); if (!cv) return false;
    cx = cv.getContext('2d'); redim();
    window.addEventListener('resize', redim);
    return true;
  }
  function redim() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
  }
  function acordar() { if (!raf) { ultimo = performance.now(); raf = requestAnimationFrame(passo); } }
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* alvo: {x,y} em pixels da tela, normalmente o ícone de moedas */
  function moedas(x, y, n, alvo, aoChegar) {
    if (!garantir() || reduzido()) { if (aoChegar) aoChegar(); return; }
    n = Math.min(n, 18);
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), v = rnd(90, 230);
      parts.push({ k: 'moeda', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 140, t: 0, fase: 0, esp: rnd(0.45, 0.7) + i * 0.025, rot: rnd(0, 6), alvo, cb: i === n - 1 ? aoChegar : null, tam: rnd(7, 10) });
    }
    acordar();
  }
  function confete(x, y, n, cores) {
    if (!garantir() || reduzido()) return;
    for (let i = 0; i < n; i++) {
      const a = rnd(-Math.PI * 0.95, -Math.PI * 0.05), v = rnd(260, 620);
      parts.push({ k: 'confete', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, vida: rnd(1.4, 2.6), rot: rnd(0, 6), vr: rnd(-9, 9), w: rnd(5, 10), h: rnd(3, 6), cor: cores[i % cores.length] });
    }
    acordar();
  }
  function brilhos(x, y, n, cor) {
    if (!garantir() || reduzido()) return;
    for (let i = 0; i < n; i++) {
      const a = rnd(0, Math.PI * 2), v = rnd(40, 160);
      parts.push({ k: 'brilho', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, vida: rnd(0.4, 0.9), tam: rnd(3, 7), cor });
    }
    acordar();
  }
  function glifo(x, y, txt, tam) {
    if (!garantir()) return;
    parts.push({ k: 'glifo', x, y, vx: rnd(-18, 18), vy: -70, t: 0, vida: 1.1, txt, tam: tam || 22 });
    acordar();
  }
  function estrela(c, x, y, r, rot) {
    c.beginPath();
    for (let i = 0; i < 8; i++) { const a = rot + i * Math.PI / 4, rr = i % 2 ? r * 0.4 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    c.closePath();
  }
  function passo(agora) {
    const dt = Math.min(0.05, (agora - ultimo) / 1000); ultimo = agora;
    cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => {
      p.t += dt;
      if (p.k === 'moeda') {
        if (p.fase === 0) {                                   // explode para fora, com gravidade
          p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.97;
          if (p.t > p.esp) { p.fase = 1; p.t0 = p.t; p.x0 = p.x; p.y0 = p.y; }
        } else {                                              // voa até o saldo
          const u = Math.min(1, (p.t - p.t0) / 0.55), e = u * u * (3 - 2 * u);
          p.x = p.x0 + (p.alvo.x - p.x0) * e; p.y = p.y0 + (p.alvo.y - p.y0) * e;
          if (u >= 1) { if (p.cb) p.cb(); return false; }
        }
        p.rot += dt * 9;
        const w = Math.abs(Math.cos(p.rot)) * p.tam + 1.5;
        cx.fillStyle = '#FFC21A'; cx.strokeStyle = '#D98F00'; cx.lineWidth = 1.5;
        cx.beginPath(); cx.ellipse(p.x, p.y, w, p.tam, 0, 0, 7); cx.fill(); cx.stroke();
        cx.fillStyle = 'rgba(255,255,255,.55)'; cx.beginPath(); cx.ellipse(p.x - w * 0.25, p.y - p.tam * 0.25, w * 0.3, p.tam * 0.4, 0, 0, 7); cx.fill();
        return true;
      }
      if (p.k === 'confete') {
        p.vy += 900 * dt; p.vx *= 0.985; p.vy *= 0.99; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        const a = Math.max(0, 1 - p.t / p.vida); if (a <= 0 || p.y > innerHeight + 20) return false;
        cx.save(); cx.globalAlpha = Math.min(1, a * 1.6); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.scale(1, Math.cos(p.rot * 1.7));
        cx.fillStyle = p.cor; cx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); cx.restore();
        return true;
      }
      if (p.k === 'brilho') {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.94; p.vy *= 0.94;
        const a = 1 - p.t / p.vida; if (a <= 0) return false;
        cx.globalAlpha = a; cx.fillStyle = p.cor; estrela(cx, p.x, p.y, p.tam, p.t * 4); cx.fill(); cx.globalAlpha = 1;
        return true;
      }
      if (p.k === 'glifo') {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy *= 0.97;
        const a = 1 - p.t / p.vida; if (a <= 0) return false;
        cx.globalAlpha = Math.min(1, a * 2); cx.font = p.tam + 'px system-ui, "Apple Color Emoji", "Noto Color Emoji", sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
        cx.fillText(p.txt, p.x, p.y); cx.globalAlpha = 1;
        return true;
      }
      return false;
    });
    raf = parts.length ? requestAnimationFrame(passo) : 0;
    if (!parts.length) cx.clearRect(0, 0, innerWidth, innerHeight);
  }
  return { moedas, confete, brilhos, glifo };
})();
