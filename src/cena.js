/* ===== Cena do sítio (canvas 2D) =====
   Céu que segue a hora real, sol e lua, nuvens, colinas, construções que crescem com as obras,
   bichos que passeiam e pulam quando tocados, fazendeiro, vaga-lumes e borboletas.
   Tudo desenhado por código: sem imagens, sem bibliotecas. O fundo estático fica em cache e só o que se mexe é redesenhado. */
const Cena = (() => {
  const W = 360, H = 292, HORIZ = 118;
  const EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  let cv = null, cx = null, bg = null, bgx = null, dpr = 1, esc = 1, raf = 0, ultimo = 0, relogio = 0, bgHora = -9;
  let info = { nivel: 1, tier: 0, obras: { celeiro: 0, chocadeira: 0, moinho: 0, estufa: 0 }, ativos: [], pct: 0, tema: 'primavera', decor: {} };
  let eco = false, ultDes = 0, medN = 0, medT = 0, medido = false, clima = [], temaVisto = '';
  let bichos = [], chave = '', nuvens = [], estrelas = [], borbs = [], vagas = [], flores = [], tufos = [];
  let fazendeiro = { x: 80, y: 192, tx: 80, dir: 1, fase: 0, t: 2, acena: 0 };
  const cb = { celeiro: null, bicho: null, fazendeiro: null, lento: null };
  const reduzido = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- cor ---------- */
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
  const rgb = c => 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
  const NOITE = hex('#141b4a');
  let L = 1;                                      // luz do dia: 0 noite, 1 dia pleno
  const tom = (h, forca) => rgb(mix(hex(h), NOITE, (1 - L) * (forca == null ? 0.55 : forca)));
  /* Estações (hemisfério sul): cores do pasto, das árvores e das flores. */
  const PALS = {
    primavera: { c1: '#8cc9a0', c2: '#6fbb86', g1: '#7cd08d', g2: '#4fa869', ter: '#d9bd8a', arv: ['#3f9f5e', '#4fb56d', '#4fb56d', '#f7b6d2'], flor: ['#ff7ab6', '#fff', '#ffd23f', '#b69bff'] },
    verao:     { c1: '#86c98a', c2: '#62bb62', g1: '#8bd45f', g2: '#4fae48', ter: '#d8bd7e', arv: ['#2f9a4f', '#3fae5f', '#57c274', '#6cd388'], flor: ['#ffd23f', '#ffb02e', '#fff', '#ff7a5a'] },
    outono:    { c1: '#c9b27a', c2: '#b79a58', g1: '#c8b45a', g2: '#a8913f', ter: '#c9a46c', arv: ['#c9742a', '#d98b32', '#e3a23a', '#b8602a'], flor: ['#e58b2b', '#c4563b', '#ffd23f', '#fff'] },
    inverno:   { c1: '#a8c9bd', c2: '#93b8aa', g1: '#a7d0b2', g2: '#86b496', ter: '#cbb999', arv: ['#5f8a78', '#6f9c89', '#80ad9a', '#a8c4b4'], flor: ['#fff', '#dfe9f5', '#c9d8ee', '#fff'] }
  };
  let pal = PALS.primavera;
  const CEU = [[0, '#0a1030', '#1d2b5e'], [5, '#1a2150', '#5b4a86'], [6.5, '#ff9f7a', '#ffd9a0'], [8, '#5fb6f5', '#cdeeff'], [12, '#4aa8f0', '#d6f2ff'], [17, '#5aa5e6', '#ffe2b5'], [18.5, '#ff8a5c', '#8a5aa0'], [20, '#1b2152', '#3a3470'], [24, '#0a1030', '#1d2b5e']];
  function ceuEm(h) {
    for (let i = 0; i < CEU.length - 1; i++) {
      const a = CEU[i], b = CEU[i + 1];
      if (h >= a[0] && h <= b[0]) { const t = (h - a[0]) / (b[0] - a[0]); return [rgb(mix(hex(a[1]), hex(b[1]), t)), rgb(mix(hex(a[2]), hex(b[2]), t))]; }
    }
    return [CEU[0][1], CEU[0][2]];
  }
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const luzDe = h => Math.min(smooth(6, 8, h), 1 - smooth(17.5, 19.5, h));
  const horaAgora = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
  let horaFixa = null;                            // para testes e capturas

  /* ---------- elementos ---------- */
  function semear() {
    nuvens = [...Array(5)].map((_, i) => ({ x: rnd(0, W), y: rnd(18, 70), s: rnd(0.7, 1.4), v: rnd(2, 6) }));
    estrelas = [...Array(46)].map(() => ({ x: rnd(0, W), y: rnd(0, 95), r: rnd(0.5, 1.5), f: rnd(0, 6) }));
    borbs = [...Array(3)].map(() => ({ x: rnd(120, 340), y: rnd(120, 170), a: rnd(0, 6), cor: ['#ff7ab6', '#ffb02e', '#8f7bff'][Math.floor(rnd(0, 3))] }));
    vagas = [...Array(12)].map(() => ({ x: rnd(10, 350), y: rnd(125, 185), a: rnd(0, 6), v: rnd(0.4, 1) }));
    flores = [...Array(34)].map(() => ({ x: rnd(4, 356), y: rnd(HORIZ + 14, 280), k: Math.floor(rnd(0, 4)), r: rnd(1, 1.8) }));
    clima = [...Array(24)].map(() => ({ x: rnd(0, W), y: rnd(0, H), v: rnd(10, 26), vx: rnd(-8, 8), a: rnd(0, 6), s: rnd(1.2, 2.6) }));
    tufos = [...Array(44)].map(() => ({ x: rnd(2, 358), y: rnd(HORIZ + 8, 284), a: rnd(0, 6), h: rnd(4, 8) }));
  }

  function novoBicho(a) {
    return { id: a.id, em: a.em, r: a.r, x: rnd(120, 340), y: rnd(174, 200), tx: 0, ty: 0, estado: 'idle', t: rnd(0.3, 3), dir: Math.random() < 0.5 ? -1 : 1, fase: rnd(0, 6), vy: 0, yoff: 0, nasc: 0, quic: 0 };
  }
  function sincronizar() {
    const k = info.ativos.map(a => a.id).join(',');
    if (k === chave) return; chave = k;
    const velhos = bichos.slice(), novos = [];
    info.ativos.slice(0, 10).forEach(a => { const i = velhos.findIndex(b => b.id === a.id); novos.push(i >= 0 ? velhos.splice(i, 1)[0] : novoBicho(a)); });
    bichos = novos;
  }

  /* ---------- desenho do fundo (cache) ---------- */
  function pintarFundo(h) {
    const c = bgx; c.setTransform(dpr * esc, 0, 0, dpr * esc, 0, 0);
    const [ct, cb2] = ceuEm(h);
    let g = c.createLinearGradient(0, 0, 0, HORIZ + 10); g.addColorStop(0, ct); g.addColorStop(1, cb2);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // sol e lua
    const dia = h >= 6 && h <= 18, ph = dia ? (h - 6) / 12 : ((h < 6 ? h + 24 : h) - 18) / 12;
    const sx = 28 + ph * (W - 56), sy = HORIZ - 8 - Math.sin(Math.PI * clamp(ph, 0, 1)) * 92;
    if (dia) {
      g = c.createRadialGradient(sx, sy, 4, sx, sy, 90); g.addColorStop(0, 'rgba(255,240,170,.95)'); g.addColorStop(0.35, 'rgba(255,235,160,.35)'); g.addColorStop(1, 'rgba(255,240,170,0)');
      c.fillStyle = g; c.beginPath(); c.arc(sx, sy, 90, 0, 7); c.fill();
      c.fillStyle = '#fff3b0'; c.beginPath(); c.arc(sx, sy, 15, 0, 7); c.fill();
    } else {
      g = c.createRadialGradient(sx, sy, 4, sx, sy, 38); g.addColorStop(0, 'rgba(200,215,255,.5)'); g.addColorStop(1, 'rgba(200,215,255,0)');
      c.fillStyle = g; c.beginPath(); c.arc(sx, sy, 38, 0, 7); c.fill();
      c.fillStyle = '#eef2ff'; c.beginPath(); c.arc(sx, sy, 12, 0, 7); c.fill();
      c.fillStyle = 'rgba(160,170,210,.5)'; c.beginPath(); c.arc(sx - 4, sy - 2, 3, 0, 7); c.arc(sx + 4, sy + 4, 2, 0, 7); c.fill();
    }
    // colinas
    const colina = (base, amp, fase, cor) => {
      c.fillStyle = cor; c.beginPath(); c.moveTo(0, H);
      for (let x = 0; x <= W; x += 6) c.lineTo(x, base - Math.sin(x / 58 + fase) * amp - Math.sin(x / 23 + fase * 2) * amp * 0.25);
      c.lineTo(W, H); c.closePath(); c.fill();
    };
    // montanhas distantes enevoadas (perspectiva atmosférica)
    const nev = mix(hex(ceuEm(h)[1].replace(/rgb\((\d+),(\d+),(\d+)\)/, (m, a, b, d) => '#' + [a, b, d].map(v => (+v).toString(16).padStart(2, '0')).join(''))), hex(pal.c1), 0.35);
    c.fillStyle = rgb(nev); c.beginPath(); c.moveTo(0, HORIZ);
    for (let x = 0; x <= W; x += 5) c.lineTo(x, HORIZ - 24 - Math.abs(Math.sin(x / 70 + 1)) * 26 - Math.sin(x / 19) * 3);
    c.lineTo(W, HORIZ + 4); c.lineTo(0, HORIZ + 4); c.closePath(); c.fill();
    colina(HORIZ - 2, 14, 0.5, tom(pal.c1));
    g = c.createLinearGradient(0, HORIZ - 30, 0, HORIZ + 6); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,' + (0.18 + 0.12 * L) + ')');
    c.fillStyle = g; c.fillRect(0, HORIZ - 30, W, 36);
    colina(HORIZ + 8, 9, 2.1, tom(pal.c2));
    // pasto
    g = c.createLinearGradient(0, HORIZ + 4, 0, H); g.addColorStop(0, tom(pal.g1)); g.addColorStop(1, tom(pal.g2));
    c.fillStyle = g; c.beginPath(); c.moveTo(0, HORIZ + 12);
    for (let x = 0; x <= W; x += 8) c.lineTo(x, HORIZ + 12 + Math.sin(x / 40) * 2);
    c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
    // luz no pasto: clarão do lado do sol e sombra escura nas bordas
    g = c.createRadialGradient(sx, HORIZ + 40, 10, sx, HORIZ + 40, 230); g.addColorStop(0, 'rgba(255,248,190,' + (dia ? 0.22 * L : 0) + ')'); g.addColorStop(1, 'rgba(255,248,190,0)');
    c.fillStyle = g; c.fillRect(0, HORIZ + 8, W, H);
    // listras de corte do gramado: dão profundidade (mais largas perto da câmera)
    for (let i = 0; i < 9; i++) { const y0 = HORIZ + 14 + i * i * 2.2 + i * 6, hh = 4 + i * 1.7; c.fillStyle = i % 2 ? 'rgba(255,255,255,.045)' : 'rgba(0,40,10,.05)'; c.fillRect(0, y0, W, hh); }
    // trilha de terra com bordas em relevo
    c.fillStyle = 'rgba(0,0,0,.14)'; c.beginPath(); c.moveTo(18, H); c.quadraticCurveTo(120, 228, 301, 174); c.lineTo(314, 183); c.quadraticCurveTo(150, 252, 78, H); c.closePath(); c.fill();
    g = c.createLinearGradient(0, 172, 0, H); g.addColorStop(0, tom(pal.ter, 0.5)); g.addColorStop(1, tom('#bb9a68', 0.5));
    c.fillStyle = g; c.beginPath(); c.moveTo(20, H); c.quadraticCurveTo(120, 226, 300, 172); c.lineTo(312, 180); c.quadraticCurveTo(150, 250, 76, H); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 1; c.beginPath(); c.moveTo(20, H); c.quadraticCurveTo(120, 226, 300, 172); c.stroke();
    // flores
    flores.forEach(f => { const k = 0.6 + (f.y - HORIZ) / 170; c.fillStyle = 'rgba(0,30,10,.2)'; c.beginPath(); c.ellipse(f.x + 1, f.y + f.r * 0.9, f.r * k, f.r * 0.45 * k, 0, 0, 7); c.fill(); c.fillStyle = tom(pal.flor[f.k], 0.3); c.beginPath(); c.arc(f.x, f.y, f.r * k, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(f.x - f.r * 0.3 * k, f.y - f.r * 0.3 * k, f.r * 0.3 * k, 0, 7); c.fill(); });
    // vinheta suave: foco no centro, como uma lente
    g = c.createRadialGradient(W / 2, H * 0.55, H * 0.35, W / 2, H * 0.55, W * 0.78); g.addColorStop(0, 'rgba(0,20,30,0)'); g.addColorStop(1, 'rgba(0,20,30,' + (0.22 + 0.12 * (1 - L)) + ')');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    bgHora = h;
  }

  /* ---------- construções ---------- */
  function sombra(c, x, y, rx) {
    const a = 0.16 + 0.12 * L, g = c.createRadialGradient(x + rx * 0.22, y, rx * 0.1, x + rx * 0.22, y, rx * 1.15);
    g.addColorStop(0, 'rgba(10,35,20,' + (a * 1.6) + ')'); g.addColorStop(0.55, 'rgba(10,35,20,' + a + ')'); g.addColorStop(1, 'rgba(10,35,20,0)');
    c.save(); c.translate(x + rx * 0.22, y); c.scale(1, 0.26); c.translate(-(x + rx * 0.22), -y);
    c.fillStyle = g; c.beginPath(); c.arc(x + rx * 0.22, y, rx * 1.15, 0, 7); c.fill(); c.restore();
  }
  /* esfera iluminada: luz de cima à esquerda, borda escura, brilho */
  function esfera(c, x, y, r, cor, forca) {
    const base = hex(cor), g = c.createRadialGradient(x - r * 0.38, y - r * 0.42, r * 0.1, x, y, r * 1.05);
    g.addColorStop(0, tom(rgb(mix(base, [255, 255, 235], 0.42)).replace(/rgb\((\d+),(\d+),(\d+)\)/, (m, a, b, d) => '#' + [a, b, d].map(v => (+v).toString(16).padStart(2, '0')).join('')), forca));
    g.addColorStop(0.55, tom(cor, forca));
    g.addColorStop(1, tom(rgb(mix(base, [10, 40, 30], 0.45)).replace(/rgb\((\d+),(\d+),(\d+)\)/, (m, a, b, d) => '#' + [a, b, d].map(v => (+v).toString(16).padStart(2, '0')).join('')), forca));
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  }
  function celeiro(c, o, t) {
    const s = 0.92 + 0.03 * o.celeiro; c.save(); c.translate(62, 150); sombra(c, 0, 0, 44 * s); c.scale(s, s);
    if (o.celeiro >= 5) {                                          // silo
      c.fillStyle = tom('#cdd6da'); c.fillRect(34, -62, 17, 62); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(37, -62, 4, 62);
      c.fillStyle = tom('#8a979d'); c.beginPath(); c.ellipse(42.5, -62, 8.5, 6, 0, Math.PI, 0); c.fill();
      c.fillStyle = tom('#6f7c82'); for (let i = 1; i < 5; i++) c.fillRect(34, -62 + i * 12, 17, 1.2);
    }
    // parede lateral (na sombra) e parede da frente (iluminada): dá a quina em 3D
    c.fillStyle = tom('#8f372d'); c.beginPath(); c.moveTo(30, -46); c.lineTo(46, -52); c.lineTo(46, -8); c.lineTo(30, 0); c.closePath(); c.fill();
    c.fillStyle = tom('#6d6a62'); c.beginPath(); c.moveTo(30, -46); c.lineTo(46, -52); c.lineTo(34, -80 + 6); c.lineTo(0, -69); c.closePath();
    c.fillStyle = tom('#8a3128'); c.beginPath(); c.moveTo(0, -74); c.lineTo(37, -44); c.lineTo(50, -50); c.lineTo(14, -80); c.closePath(); c.fill();   // água do telhado em sombra
    let g = c.createLinearGradient(-30, 0, 30, 0); g.addColorStop(0, tom('#e07a6a')); g.addColorStop(0.6, tom('#c9584a')); g.addColorStop(1, tom('#b24a3d'));
    c.fillStyle = g; c.fillRect(-30, -46, 60, 46);
    g = c.createLinearGradient(0, -46, 0, 0); g.addColorStop(0, 'rgba(255,255,255,.1)'); g.addColorStop(0.7, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.22)');
    c.fillStyle = g; c.fillRect(-30, -46, 60, 46);
    c.fillStyle = 'rgba(0,0,0,.12)'; for (let x = -24; x < 30; x += 8) c.fillRect(x, -46, 1.4, 46);
    c.fillStyle = tom('#c4584b'); c.beginPath(); c.moveTo(-33, -44); c.lineTo(0, -69); c.lineTo(33, -44); c.closePath(); c.fill();   // frontão
    c.fillStyle = o.celeiro >= 10 ? tom('#ffc21a', 0.3) : tom('#7b3a32');                 // telhado
    c.beginPath(); c.moveTo(-37, -44); c.lineTo(0, -74); c.lineTo(37, -44); c.lineTo(32, -42); c.lineTo(0, -66); c.lineTo(-32, -42); c.closePath(); c.fill();
    c.fillStyle = tom('#8a4338'); c.beginPath(); c.moveTo(-34, -45); c.lineTo(0, -71); c.lineTo(34, -45); c.lineTo(30, -44); c.lineTo(0, -64); c.lineTo(-30, -44); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,230,200,.5)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-36, -44.5); c.lineTo(0, -73); c.stroke();
    c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(-10.5, -28.5, 21, 29);                         // vão da porta (profundidade)
    c.fillStyle = tom('#f6ead3'); c.fillRect(-9, -27, 18, 27);                                // porta
    c.strokeStyle = tom('#b24a3d'); c.lineWidth = 2; c.beginPath(); c.moveTo(-9, -27); c.lineTo(9, 0); c.moveTo(9, -27); c.lineTo(-9, 0); c.strokeRect(-9, -27, 18, 27);
    c.fillStyle = 'rgba(255,255,255,.22)'; c.beginPath(); c.moveTo(-30, -46); c.lineTo(-27, -46); c.lineTo(-27, 0); c.lineTo(-30, 0); c.fill();   // luz na quina
    c.fillStyle = tom('#f6ead3'); c.beginPath(); c.arc(0, -55, 4.5, 0, 7); c.fill();         // janela do palheiro
    if (L < 0.7) { c.fillStyle = 'rgba(255,214,120,' + (0.9 - L) + ')'; c.beginPath(); c.arc(0, -55, 3.3, 0, 7); c.fill(); }
    c.restore();
  }
  function chocadeira(c, o) {
    if (o.chocadeira < 1) return;
    const s = 0.85 + 0.04 * o.chocadeira; c.save(); c.translate(150, 142); sombra(c, 0, 0, 28 * s); c.scale(s, s);
    c.fillStyle = tom('#efe5cd'); c.fillRect(-20, -24, 40, 24);
    c.fillStyle = tom('#7b3a32'); c.beginPath(); c.moveTo(-25, -23); c.lineTo(0, -45); c.lineTo(25, -23); c.closePath(); c.fill();
    c.fillStyle = tom('#cdb98f'); c.fillRect(-5, -14, 10, 14); c.fillStyle = 'rgba(0,0,0,.13)'; c.fillRect(8, -24, 12, 24); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(-20, -24, 3, 24);
    c.fillStyle = tom('#ffc21a', 0.3); c.beginPath(); c.ellipse(0, -31, 4.2, 5.5, 0, 0, 7); c.fill();
    if (L < 0.7) { c.fillStyle = 'rgba(255,200,90,' + (0.85 - L) + ')'; c.fillRect(-15, -19, 6, 6); c.fillRect(9, -19, 6, 6); }
    c.restore();
  }
  function estufa(c, o) {
    if (o.estufa < 1) return;
    const s = 0.85 + 0.04 * o.estufa; c.save(); c.translate(224, 142); sombra(c, 0, 0, 32 * s); c.scale(s, s);
    c.fillStyle = 'rgba(190,235,245,.78)'; c.beginPath(); c.moveTo(-27, 0); c.lineTo(-27, -16); c.quadraticCurveTo(0, -48, 27, -16); c.lineTo(27, 0); c.closePath(); c.fill();
    c.strokeStyle = tom('#e9e1cd', 0.3); c.lineWidth = 1.4; c.stroke(); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -32); c.moveTo(-14, 0); c.lineTo(-14, -27); c.moveTo(14, 0); c.lineTo(14, -27); c.stroke();
    c.fillStyle = tom('#3fa061'); [-12, 0, 12].forEach(x => { c.beginPath(); c.arc(x, -5, 4.4, 0, 7); c.fill(); });
    c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(-12, -22, 6, 2.6, -0.7, 0, 7); c.fill(); const gv = c.createLinearGradient(-27, 0, 27, 0); gv.addColorStop(0, 'rgba(255,255,255,.18)'); gv.addColorStop(1, 'rgba(0,50,70,.2)'); c.fillStyle = gv; c.beginPath(); c.moveTo(-27, 0); c.lineTo(-27, -16); c.quadraticCurveTo(0, -48, 27, -16); c.lineTo(27, 0); c.closePath(); c.fill();
    c.restore();
  }
  function moinho(c, o, t) {
    if (o.moinho < 1) return;
    const s = 0.85 + 0.04 * o.moinho; c.save(); c.translate(306, 140); sombra(c, 0, 0, 20 * s); c.scale(s, s);
    c.fillStyle = tom('#ebe3cf'); c.beginPath(); c.moveTo(-11, 0); c.lineTo(11, 0); c.lineTo(6, -48); c.lineTo(-6, -48); c.closePath(); c.fill();
    c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.moveTo(1, 0); c.lineTo(11, 0); c.lineTo(6, -48); c.lineTo(1, -48); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.moveTo(-11, 0); c.lineTo(-8, 0); c.lineTo(-4, -48); c.lineTo(-6, -48); c.closePath(); c.fill();
    c.fillStyle = tom('#7b3a32'); c.beginPath(); c.moveTo(-9, -48); c.lineTo(0, -61); c.lineTo(9, -48); c.closePath(); c.fill();
    c.translate(0, -51); c.rotate(reduzido() ? 0.4 : t * (0.7 + 0.14 * o.moinho));
    for (let i = 0; i < 4; i++) {
      c.rotate(Math.PI / 2); c.fillStyle = tom('#8a6a44'); c.fillRect(-1.3, -30, 2.6, 30);
      c.fillStyle = tom('#f1ead6'); c.fillRect(1.3, -29, 9, 15); c.strokeStyle = tom('#b9a77f'); c.lineWidth = 0.8; c.strokeRect(1.3, -29, 9, 15);
    }
    c.fillStyle = tom('#5a3a2a'); c.beginPath(); c.arc(0, 0, 3, 0, 7); c.fill();
    c.restore();
  }
  function arvore(c, x, y, s, t, fase) {
    c.save(); c.translate(x, y); sombra(c, 0, 0, 16 * s); c.scale(s, s);
    const gt = c.createLinearGradient(-3, 0, 3, 0); gt.addColorStop(0, tom('#9a7048')); gt.addColorStop(1, tom('#5e4128')); c.fillStyle = gt; c.fillRect(-3, -22, 6, 22);
    const bal = reduzido() ? 0 : Math.sin(t * 1.2 + fase) * 1.4;
    [[pal.arv[0], 0, -34, 17], [pal.arv[1], -9, -27, 12], [pal.arv[2], 10, -28, 12], [pal.arv[3], 2, -40, 9]].forEach(a => esfera(c, a[1] + bal * (1 + (-a[2] / 40)), a[2], a[3], a[0]));
    c.restore();
  }
  function cerca(c, x0, x1) {
    c.fillStyle = tom('#9b7a4d'); c.fillRect(x0, 154, x1 - x0, 3); c.fillRect(x0, 162, x1 - x0, 3);
    for (let x = x0; x <= x1; x += 20) { c.fillStyle = tom('#8a6a44'); c.fillRect(x, 148, 3.5, 20); }
  }


  /* ---------- decoração (comprada na aba Obras) ---------- */
  // Posição final de cada item na faixa visível do pasto (os botões cobrem a parte de baixo da cena).
  const DECOR_P = { girassol: [212, 203, 214, 262], banco: [326, 203, 318, 238], espantalho: [176, 192, 150, 244], colmeia: [26, 198, 30, 216], lago: [78, 199, 96, 270], balanco: [0, 0, 0, 0], fogueira: [262, 205, 270, 266], estandarte: [124, 206, 96, 218] };
  function dGirassol(c, t) {
    [[200, 0], [214, 5], [228, -2]].forEach((p, i) => {
      const bal = reduzido() ? 0 : Math.sin(t * 1.6 + i) * 1.2;
      c.strokeStyle = tom('#3f9f5e'); c.lineWidth = 2; c.beginPath(); c.moveTo(p[0], 262 + p[1]); c.lineTo(p[0] + bal, 246 + p[1]); c.stroke();
      c.fillStyle = tom('#ffc21a', 0.3); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; c.beginPath(); c.arc(p[0] + bal + Math.cos(a) * 5, 244 + p[1] + Math.sin(a) * 5, 3, 0, 7); c.fill(); }
      c.fillStyle = tom('#6b3f1d'); c.beginPath(); c.arc(p[0] + bal, 244 + p[1], 3.4, 0, 7); c.fill();
    });
  }
  function dBanco(c) { sombra(c, 318, 238, 18); c.fillStyle = tom('#8a6a44'); c.fillRect(304, 222, 30, 5); c.fillRect(306, 214, 26, 3); c.fillRect(306, 227, 3, 11); c.fillRect(329, 227, 3, 11); c.fillStyle = tom('#a98557'); c.fillRect(304, 220, 30, 3); }
  function dEspantalho(c, t) {
    const x = 150, y = 244; sombra(c, x, y, 10); c.strokeStyle = tom('#7a5636'); c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 34); c.moveTo(x - 15, y - 26); c.lineTo(x + 15, y - 26); c.stroke();
    c.fillStyle = tom('#3A6EA5'); c.fillRect(x - 6, y - 30, 12, 14); c.fillStyle = tom('#e9c98a'); c.beginPath(); c.arc(x, y - 38, 6, 0, 7); c.fill();
    c.fillStyle = tom('#8a6a44'); c.beginPath(); c.ellipse(x, y - 43, 11, 2.6, 0, 0, 7); c.fill(); c.fillRect(x - 5, y - 50, 10, 7);
    c.fillStyle = '#2b1d00'; c.fillRect(x - 3, y - 39, 1.5, 1.5); c.fillRect(x + 1.5, y - 39, 1.5, 1.5);
  }
  function dColmeia(c, t) {
    const x = 30, y = 216; sombra(c, x, y, 12); c.fillStyle = tom('#8a6a44'); c.fillRect(x - 9, y - 6, 3, 8); c.fillRect(x + 6, y - 6, 3, 8);
    c.fillStyle = tom('#f0c24a'); [[-10, 0], [-9, -8], [-8, -15]].forEach((p, i) => { c.beginPath(); c.ellipse(x, y + p[1] - 2, 11 - i * 1.5, 4.5, 0, 0, 7); c.fill(); });
    c.fillStyle = '#4a2f00'; c.beginPath(); c.arc(x, y - 8, 2.2, 0, 7); c.fill();
    if (!reduzido() && !eco) for (let k = 0; k < 3; k++) { const a = t * 2 + k * 2.1; c.fillStyle = '#2b1d00'; c.beginPath(); c.arc(x + Math.cos(a) * 16, y - 18 + Math.sin(a * 1.3) * 7, 1.3, 0, 7); c.fill(); }
  }
  function dLago(c, t) {
    const x = 96, y = 270; c.fillStyle = tom('#5aa9d8', 0.3); c.beginPath(); c.ellipse(x, y, 34, 11, 0, 0, 7); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1; const r = reduzido() ? 0 : (t * 8) % 14; c.beginPath(); c.ellipse(x - 8, y + 1, 4 + r * 0.6, 1.5 + r * 0.2, 0, 0, 7); c.stroke();
    c.fillStyle = tom('#3f9f5e'); [[x + 14, y + 2], [x + 22, y - 2], [x - 20, y + 3]].forEach(p => { c.beginPath(); c.ellipse(p[0], p[1], 5, 2, 0, 0, 7); c.fill(); });
    c.fillStyle = '#000'; c.font = '17px ' + EMOJI; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🦆', x - 2 + (reduzido() ? 0 : Math.sin(t * 0.8) * 8), y - 8);
  }
  function dBalanco(c, t) {
    const a = reduzido() ? 0 : Math.sin(t * 1.8) * 0.35; c.save(); c.translate(30, 142); c.rotate(a);
    c.strokeStyle = tom('#7a5636'); c.lineWidth = 1.2; c.beginPath(); c.moveTo(-5, 0); c.lineTo(-5, 26); c.moveTo(5, 0); c.lineTo(5, 26); c.stroke();
    c.fillStyle = tom('#a98557'); c.fillRect(-8, 26, 16, 3); c.restore();
  }
  function dFogueira(c, t) {
    const x = 270, y = 266; sombra(c, x, y, 14); c.fillStyle = tom('#6b4a2d'); c.save(); c.translate(x, y); c.rotate(0.5); c.fillRect(-10, -2, 20, 4); c.rotate(-1); c.fillRect(-10, -2, 20, 4); c.restore();
    const f = reduzido() ? 1 : 1 + Math.sin(t * 9) * 0.12 + Math.sin(t * 17) * 0.06;
    c.fillStyle = '#ff7a1a'; c.beginPath(); c.moveTo(x - 8, y - 2); c.quadraticCurveTo(x - 6, y - 16 * f, x, y - 22 * f); c.quadraticCurveTo(x + 6, y - 16 * f, x + 8, y - 2); c.closePath(); c.fill();
    c.fillStyle = '#ffc21a'; c.beginPath(); c.moveTo(x - 4, y - 2); c.quadraticCurveTo(x - 3, y - 10 * f, x, y - 14 * f); c.quadraticCurveTo(x + 3, y - 10 * f, x + 4, y - 2); c.closePath(); c.fill();
    if (L < 0.8) { const g = c.createRadialGradient(x, y - 8, 2, x, y - 8, 38); g.addColorStop(0, 'rgba(255,170,60,' + (0.4 * (1 - L)) + ')'); g.addColorStop(1, 'rgba(255,170,60,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y - 8, 38, 0, 7); c.fill(); }
  }
  function dEstandarte(c, t) {
    const x = 96, y = 218; c.fillStyle = tom('#6b4a2d'); c.fillRect(x, y - 44, 2.5, 46);
    const o = reduzido() ? 0 : Math.sin(t * 3) * 2; c.fillStyle = '#FFC21A'; c.beginPath(); c.moveTo(x + 2.5, y - 44); c.quadraticCurveTo(x + 14, y - 42 + o, x + 26, y - 40); c.lineTo(x + 24, y - 28); c.quadraticCurveTo(x + 14, y - 30 + o, x + 2.5, y - 28); c.closePath(); c.fill();
    c.fillStyle = '#4a2f00'; c.font = '700 9px system-ui'; c.textAlign = 'center'; c.fillText('★', x + 14, y - 33);
  }
  const DECOR_F = { girassol: dGirassol, banco: dBanco, espantalho: dEspantalho, colmeia: dColmeia, lago: dLago, balanco: dBalanco, fogueira: dFogueira, estandarte: dEstandarte };

  /* ---------- clima da estação: pétalas, folhas, flocos ---------- */
  function desenharClima(c, dt, t) {
    const k = info.tema; if (eco || reduzido() || (k !== 'primavera' && k !== 'outono' && k !== 'inverno')) return;
    clima.forEach(p => {
      p.y += p.v * dt * (k === 'inverno' ? 0.8 : 1); p.x += (p.vx + Math.sin(t * 1.3 + p.a) * 9) * dt; p.a += dt * 2;
      if (p.y > H + 6) { p.y = -6; p.x = rnd(0, W); } if (p.x < -6) p.x = W + 4; if (p.x > W + 6) p.x = -4;
      if (k === 'inverno') { c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(p.x, p.y, p.s * 0.55, 0, 7); c.fill(); return; }
      c.fillStyle = k === 'outono' ? (p.s > 1.9 ? '#d9822b' : '#b8602a') : (p.s > 1.9 ? '#ffb6d3' : '#fff');
      c.beginPath(); c.ellipse(p.x, p.y, p.s * 1.4, p.s * 0.8, p.a, 0, 7); c.fill();
    });
  }

  /* ---------- seres ---------- */
  function desenharBicho(c, b, t) {
    const persp = 0.86 + clamp((b.y - 172) / 28, 0, 1) * 0.2;                 // mais perto da câmera = maior
    const sc = persp * (1 + b.r * 0.07) * (b.nasc < 1 ? 0.2 + 0.8 * (1 - Math.pow(1 - b.nasc, 3)) : 1), tam = 27 * sc;
    const alto = clamp(-b.yoff / 28, 0, 1);                                    // altura do pulo: sombra encolhe e clareia
    sombra(c, b.x, b.y + 3, 11 * sc * (1 - alto * 0.35));
    if (b.r >= 1) {                                                            // base: disco que brilha na cor da raridade
      const cor = ['', '110,200,255', '175,120,255', '175,120,255', '255,190,40'][b.r] || '255,255,255';
      c.save(); c.translate(b.x, b.y + 2); c.scale(1, 0.3);
      const gb = c.createRadialGradient(0, 0, 2, 0, 0, 17 * sc); gb.addColorStop(0, 'rgba(' + cor + ',' + (0.2 + b.r * 0.1) + ')'); gb.addColorStop(1, 'rgba(' + cor + ',0)');
      c.fillStyle = gb; c.beginPath(); c.arc(0, 0, 17 * sc, 0, 7); c.fill(); c.restore();
    }
    if (b.r >= 3) {
      const cor = b.r === 4 ? '255,190,40' : '175,120,255', pulso = 0.28 + 0.12 * Math.sin(t * 3 + b.fase);
      const g = c.createRadialGradient(b.x, b.y - 8, 2, b.x, b.y - 8, 28); g.addColorStop(0, 'rgba(' + cor + ',' + pulso + ')'); g.addColorStop(1, 'rgba(' + cor + ',0)');
      c.fillStyle = g; c.beginPath(); c.arc(b.x, b.y - 8, 24, 0, 7); c.fill();
    }
    const quique = b.estado === 'walk' ? Math.abs(Math.sin(b.fase * 2)) * 3.2 : Math.sin(t * 2.2 + b.fase) * 0.6;
    c.save(); c.translate(b.x, b.y - tam * 0.4 + b.yoff - quique);
    const ar = b.estado === 'idle' ? Math.sin(t * 2.2 + b.fase) * 0.025 : 0, es = b.vy < -20 ? 1.1 : (b.vy > 20 ? 1.06 : 1);   // estica no pulo
    c.scale(b.dir * (2 - es) * (1 - ar * 0.4), es * (1 + ar));
    if (!eco) { c.shadowColor = 'rgba(0,30,20,.35)'; c.shadowBlur = 4; c.shadowOffsetX = -b.dir * 1; c.shadowOffsetY = 2.5; }   // relevo: o bicho "descola" do chão
    c.fillStyle = '#000'; c.font = tam + 'px ' + EMOJI; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b.em, 0, 0);
    c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetX = 0; c.shadowOffsetY = 0;
    if (!eco) { const gl = c.createRadialGradient(-tam * 0.18, -tam * 0.28, 1, -tam * 0.18, -tam * 0.28, tam * 0.5); gl.addColorStop(0, 'rgba(255,255,255,.28)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); c.globalCompositeOperation = 'source-atop'; c.fillStyle = gl; c.fillRect(-tam, -tam, tam * 2, tam * 2); c.globalCompositeOperation = 'source-over'; }   // emoji colorido herda a opacidade do fillStyle
    c.restore();
  }
  function atualizarBicho(b, dt) {
    if (b.nasc < 1) b.nasc = Math.min(1, b.nasc + dt * 2.2);
    if (b.vy !== 0 || b.yoff < 0) { b.vy += 520 * dt; b.yoff += b.vy * dt; if (b.yoff >= 0) { b.yoff = 0; b.vy = 0; } }
    if (reduzido()) return;
    if (b.estado === 'idle') { b.t -= dt; if (b.t <= 0) { b.tx = rnd(116, 342); b.ty = rnd(172, 200); b.estado = 'walk'; } }
    else {
      const dx = b.tx - b.x, dy = b.ty - b.y, d = Math.hypot(dx, dy), v = 15 + b.r;
      if (d < 2) { b.estado = 'idle'; b.t = rnd(1.5, 5); } else { b.x += dx / d * v * dt; b.y += dy / d * v * dt * 0.6; b.dir = dx < 0 ? -1 : 1; b.fase += dt * 4; }
    }
  }
  function desenharFazendeiro(c, f, t) {
    const cam = ['#C8453A', '#2F8FD1', '#7A4CC8', '#23834A', '#E39A0B', '#E39A0B'][info.tier] || '#C8453A', tier = info.tier;
    const andar = f.x !== f.tx ? Math.sin(f.fase * 2) * 3 : 0, resp = Math.sin(t * 2) * 0.6;
    c.save(); c.translate(f.x, f.y); c.scale(f.dir, 1); sombra(c, 0, 1, 9);
    c.fillStyle = '#3A4A63'; c.fillRect(-6, -12 + andar * 0.0, 5, 12 - andar * 0.4); c.fillRect(1.5, -12, 5, 12 + andar * 0.4);
    { const gc = c.createLinearGradient(-9, 0, 9, 0); gc.addColorStop(0, tom(rgb(mix(hex(cam), [255, 255, 255], 0.22)).replace(/rgb\((\d+),(\d+),(\d+)\)/, (m, a, b, d) => '#' + [a, b, d].map(v => (+v).toString(16).padStart(2, '0')).join(''))));  gc.addColorStop(1, tom(rgb(mix(hex(cam), [0, 0, 0], 0.28)).replace(/rgb\((\d+),(\d+),(\d+)\)/, (m, a, b, d) => '#' + [a, b, d].map(v => (+v).toString(16).padStart(2, '0')).join('')))); c.fillStyle = gc; } c.beginPath(); c.roundRect ? c.roundRect(-9, -31 + resp, 18, 21, 5) : c.rect(-9, -31 + resp, 18, 21); c.fill();
    if (tier >= 2) { c.fillStyle = '#2C5E8C'; c.fillRect(-5, -31 + resp, 3, 12); c.fillRect(2, -31 + resp, 3, 12); }
    if (tier >= 4) { c.fillStyle = '#F2C94C'; c.fillRect(-9, -17, 18, 3.5); }
    c.fillStyle = tom(cam);                                                    // braços
    c.fillRect(-12, -29 + resp, 4, 12 + andar * 0.3);
    if (f.acena > 0) { c.save(); c.translate(9, -29); c.rotate(-2.2 + Math.sin(t * 14) * 0.45); c.fillRect(0, 0, 4, 12); c.fillStyle = '#F0C9A0'; c.fillRect(0, 11, 4, 3); c.restore(); }
    else c.fillRect(8, -29 + resp, 4, 12 - andar * 0.3);
    esfera(c, 0, -39 + resp, 7.2, '#F0C9A0', 0.3);
    c.fillStyle = '#2B1D00'; c.fillRect(1.2, -40.5 + resp, 1.6, 1.8); c.fillRect(-3.6, -40.5 + resp, 1.6, 1.8);
    if (tier >= 5) { c.fillStyle = '#F4B31F'; c.beginPath(); c.moveTo(-7, -45); c.lineTo(-7, -54); c.lineTo(-3.5, -49); c.lineTo(0, -56); c.lineTo(3.5, -49); c.lineTo(7, -54); c.lineTo(7, -45); c.fill(); }
    else { c.fillStyle = tom('#e8cf84'); c.beginPath(); c.ellipse(0, -45 + resp, 12, 3, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(-7, -45 + resp); c.quadraticCurveTo(0, -57 + resp, 7, -45 + resp); c.fill(); if (tier >= 1) { c.fillStyle = cam; c.fillRect(-7, -48 + resp, 14, 2.2); } }
    c.restore();
  }
  function atualizarFazendeiro(f, dt) {
    if (f.acena > 0) f.acena -= dt;
    if (reduzido()) return;
    if (f.x === f.tx) { f.t -= dt; if (f.t <= 0) { f.tx = rnd(40, 110); f.t = rnd(3, 8); } }
    else { const dx = f.tx - f.x, v = 14; if (Math.abs(dx) < 1.5) f.x = f.tx; else { f.x += Math.sign(dx) * v * dt; f.dir = dx < 0 ? -1 : 1; f.fase += dt * 5; } }
  }

  /* ---------- quadro ---------- */
  function quadro(ts) {
    raf = 0;
    if (!cv || !cv.isConnected || document.hidden) return;
    if (eco && ts - ultDes < 32) { raf = requestAnimationFrame(quadro); return; }
    ultDes = ts;
    if (!medido && !eco && ultimo) { const d = (ts - ultimo) / 1000; if (d < 0.5) { medN++; medT += d; } if (medN >= 150) { medido = true; if (medT / medN > 0.027 && cb.lento) cb.lento(); } }
    const dt = Math.max(0, Math.min(0.05, (ts - ultimo) / 1000 || 0.016)); ultimo = ts; relogio += dt;
    const h = horaFixa == null ? horaAgora() : horaFixa; L = luzDe(h);
    if (Math.abs(h - bgHora) > 0.03) pintarFundo(h);
    const c = cx; c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(bg, 0, 0); c.setTransform(dpr * esc, 0, 0, dpr * esc, 0, 0);
    const t = relogio;
    // estrelas
    if (L < 0.65) estrelas.forEach(s => { c.globalAlpha = (0.65 - L) / 0.65 * (0.5 + 0.5 * Math.sin(t * 2 + s.f)); c.fillStyle = '#fff'; c.fillRect(s.x, s.y, s.r, s.r); }); c.globalAlpha = 1;
    // nuvens
    nuvens.forEach(n => {
      if (!reduzido()) { n.x += n.v * dt; if (n.x > W + 50) n.x = -50; }
      const x = n.x, y = n.y, s = n.s, forma = () => { c.beginPath(); c.ellipse(x, y, 22 * s, 8 * s, 0, 0, 7); c.ellipse(x - 12 * s, y + 2 * s, 14 * s, 6 * s, 0, 0, 7); c.ellipse(x + 13 * s, y + 2 * s, 15 * s, 6.5 * s, 0, 0, 7); c.ellipse(x + 2 * s, y - 6 * s, 12 * s, 7 * s, 0, 0, 7); };
      const ga = 0.35 + 0.55 * L; c.fillStyle = 'rgba(150,170,205,' + ga + ')'; forma(); c.fill();                  // base na sombra
      c.fillStyle = 'rgba(255,255,255,' + ga + ')'; c.save(); c.translate(-1.2 * s, -2.2 * s); forma(); c.fill(); c.restore();   // topo iluminado
    });
    // capim balançando
    tufos.forEach(g => { c.strokeStyle = tom('#3d9a5b', 0.5); c.lineWidth = 1.2; const b = reduzido() ? 0 : Math.sin(t * 2 + g.a) * 1.6; c.beginPath(); c.moveTo(g.x - 1.5, g.y); c.lineTo(g.x - 1.5 + b, g.y - g.h); c.moveTo(g.x + 1.5, g.y); c.lineTo(g.x + 1.5 + b, g.y - g.h * 0.8); c.stroke(); });
    arvore(c, 18, 150, 1.05, t, 0); arvore(c, 346, 152, 0.95, t, 2);
    celeiro(c, info.obras, t); chocadeira(c, info.obras); estufa(c, info.obras); moinho(c, info.obras, t);
    cerca(c, 106, W - 8);
    // seres ordenados pela profundidade
    const lista = bichos.map(b => ({ y: b.y, f: () => desenharBicho(c, b, t) }));
    lista.push({ y: fazendeiro.y, f: () => desenharFazendeiro(c, fazendeiro, t) });
    Object.keys(info.decor || {}).forEach(k => { const f = DECOR_F[k], q = DECOR_P[k]; if (f) lista.push({ y: k === 'balanco' ? 120 : q[1], f: () => { c.save(); c.translate(q[0] - q[2], q[1] - q[3]); f(c, t); c.restore(); } }); });
    lista.sort((a, b) => a.y - b.y).forEach(i => i.f());
    bichos.forEach(b => atualizarBicho(b, dt)); atualizarFazendeiro(fazendeiro, dt);
    // borboletas de dia, vaga-lumes à noite
    if (L > 0.55 && !reduzido() && !eco) borbs.forEach(b => {
      b.a += dt * 1.6; b.x += Math.cos(b.a * 0.7) * 14 * dt; b.y += Math.sin(b.a * 1.1) * 9 * dt; b.x = clamp(b.x, 110, 345); b.y = clamp(b.y, 128, 172);
      const bat = Math.abs(Math.sin(t * 14 + b.a)) * 4 + 1; c.fillStyle = b.cor; c.beginPath(); c.ellipse(b.x - 2, b.y, bat, 3, -0.4, 0, 7); c.ellipse(b.x + 2, b.y, bat, 3, 0.4, 0, 7); c.fill();
    });
    desenharClima(c, dt, t);
    // capim alto na frente dos bichos (camada mais próxima da câmera)
    if (!eco) { const bal = reduzido() ? 0 : 1; for (let x = 4; x < W; x += 9) { const hh = 9 + ((x * 7) % 5), b = Math.sin(t * 1.8 + x) * 1.6 * bal; c.fillStyle = tom(x % 18 < 9 ? '#3f9f5e' : '#2f8a4e', 0.5); c.beginPath(); c.moveTo(x - 2.5, H); c.quadraticCurveTo(x, H - hh * 0.6, x + b, H - hh); c.quadraticCurveTo(x + 1.5, H - hh * 0.6, x + 2.5, H); c.fill(); } }
    // raios de luz atravessando o céu (só de dia)
    if (L > 0.6 && !eco) { c.save(); c.globalCompositeOperation = 'lighter'; const sxp = 28 + ((clamp(((horaFixa == null ? horaAgora() : horaFixa) - 6) / 12, 0, 1)) * (W - 56)); for (let k = 0; k < 4; k++) { const a = 0.045 * L * (0.7 + 0.3 * Math.sin(t * 0.6 + k * 2)); const gr = c.createLinearGradient(sxp, 0, sxp + (k - 1.5) * 60, H); gr.addColorStop(0, 'rgba(255,245,190,' + a + ')'); gr.addColorStop(1, 'rgba(255,245,190,0)'); c.fillStyle = gr; c.beginPath(); c.moveTo(sxp - 4, 0); c.lineTo(sxp + 6, 0); c.lineTo(sxp + (k - 1.5) * 90 + 26, H); c.lineTo(sxp + (k - 1.5) * 90 - 26, H); c.closePath(); c.fill(); } c.restore(); }
    // véu da noite
    if (L < 0.95) { c.fillStyle = 'rgba(14,20,70,' + ((1 - L) * 0.38) + ')'; c.fillRect(0, 0, W, H); }
    if (L < 0.5 && !eco) vagas.forEach(v => {
      v.a += dt * v.v; v.x += Math.cos(v.a) * 9 * dt; v.y += Math.sin(v.a * 1.3) * 6 * dt;
      const al = (0.5 - L) * 2 * (0.5 + 0.5 * Math.sin(t * 3 + v.a * 4)), g = c.createRadialGradient(v.x, v.y, 0, v.x, v.y, 7);
      g.addColorStop(0, 'rgba(255,245,140,' + al + ')'); g.addColorStop(1, 'rgba(255,245,140,0)'); c.fillStyle = g; c.beginPath(); c.arc(v.x, v.y, 7, 0, 7); c.fill();
    });
    // moeda sobre o celeiro quando há o que coletar
    if (info.pct > 0.06) {
      const cheio = info.pct >= 0.95, s = 0.92 + 0.03 * info.obras.celeiro, by = 150 - 82 * s - 10 + Math.sin(t * 3) * 3, pulso = cheio ? 1 + Math.sin(t * 8) * 0.08 : 1;
      c.save(); c.translate(62, by); c.scale(pulso, pulso);
      c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.arc(0, 0, 13, 0, 7); c.fill(); c.beginPath(); c.moveTo(-4, 11); c.lineTo(0, 17); c.lineTo(4, 11); c.fill();
      c.fillStyle = '#FFC21A'; c.beginPath(); c.arc(0, 0, 9, 0, 7); c.fill(); c.strokeStyle = '#D98F00'; c.lineWidth = 1.6; c.stroke();
      c.fillStyle = '#D98F00'; c.font = '700 11px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(cheio ? '!' : '$', 0, 0.5);
      c.restore();
    }
    raf = requestAnimationFrame(quadro);
  }

  /* ---------- API ---------- */
  function medir() {
    const r = cv.getBoundingClientRect(); if (!r.width) return;
    dpr = eco ? 1 : Math.min(2, window.devicePixelRatio || 1); esc = r.width / W;
    const pw = Math.round(r.width * dpr), ph = Math.round(r.width * H / W * dpr);
    if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; bg.width = pw; bg.height = ph; bgHora = -9; }
  }
  function aoTocar(e) {
    const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
    let melhor = null, d0 = 24;
    bichos.forEach(b => { const d = Math.hypot(b.x - x, b.y - 12 - y); if (d < d0) { d0 = d; melhor = b; } });
    if (melhor) { melhor.vy = -150; melhor.yoff = -0.01; melhor.estado = 'idle'; melhor.t = 1.2; if (cb.bicho) cb.bicho(melhor, pos(melhor.x, melhor.y - 26)); return; }
    if (Math.abs(x - fazendeiro.x) < 14 && y > fazendeiro.y - 56 && y < fazendeiro.y + 4) { fazendeiro.acena = 1.4; if (cb.fazendeiro) cb.fazendeiro(); return; }
    if (x > 18 && x < 112 && y > 58 && y < 160 && cb.celeiro) cb.celeiro(pos(62, 118));
  }
  function pos(x, y) { const r = cv.getBoundingClientRect(); return { x: r.left + x / W * r.width, y: r.top + y / H * r.height }; }
  function montar(host) {
    if (!cv) {
      cv = document.createElement('canvas'); cx = cv.getContext('2d'); bg = document.createElement('canvas'); bgx = bg.getContext('2d');
      cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Seu sítio. Toque no celeiro para coletar e nos bichos para brincar.');
      cv.addEventListener('pointerdown', aoTocar); semear();
      window.addEventListener('resize', () => { if (cv.isConnected) medir(); });
    }
    if (cv.parentNode !== host) host.appendChild(cv);
    medir(); sincronizar(); iniciar();
  }
  function iniciar() { if (!raf && cv && cv.isConnected) { ultimo = performance.now(); raf = requestAnimationFrame(quadro); } }
  function parar() { if (raf) cancelAnimationFrame(raf); raf = 0; }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) iniciar(); });
  return {
    montar, parar, iniciar,
    atualizar(i) {
      info = i;
      if (i.tema !== temaVisto) { temaVisto = i.tema; pal = PALS[i.tema] || PALS.primavera; bgHora = -9; }
      if (cv && cv.isConnected) sincronizar();
    },
    eco(v) { v = !!v; if (v !== eco) { eco = v; if (cv && cv.isConnected) { medir(); bgHora = -9; } } },
    pal(t) { pal = PALS[t] || PALS.primavera; temaVisto = t; bgHora = -9; },
    aoTocar(f) { Object.assign(cb, f); },
    posCeleiro() { return cv && cv.isConnected ? pos(62, 118) : null; },
    hora(h) { horaFixa = h; bgHora = -9; },
  };
})();
