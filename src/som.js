/* ===== Sons e vibração =====
   Sons sintetizados na hora (WebAudio), sem arquivos. O áudio só liga depois do primeiro toque, como os navegadores exigem. */
const Som = (() => {
  let ctx = null, mestre = null, mudo = false;
  try { mudo = localStorage.getItem('sitio.mudo') === '1'; } catch (e) {}
  function ligar() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); mestre = ctx.createGain(); mestre.gain.value = 0.5; mestre.connect(ctx.destination);
  }
  document.addEventListener('pointerdown', ligar, { once: true, passive: true });
  /* freq em Hz; atraso em s; desliza = frequência final (opcional) */
  function tom(freq, dur, tipo, vol, atraso, desliza) {
    if (!ctx || mudo) return;
    const t = ctx.currentTime + (atraso || 0), o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo || 'sine'; o.frequency.setValueAtTime(freq, t);
    if (desliza) o.frequency.exponentialRampToValueAtTime(desliza, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(mestre); o.start(t); o.stop(t + dur + 0.05);
  }
  const NOTAS = { do: 523.25, re: 587.33, mi: 659.25, sol: 783.99, la: 880, si: 987.77, do2: 1046.5, mi2: 1318.5, sol2: 1568 };
  const SONS = {
    tap() { tom(520, 0.06, 'triangle', 0.08, 0, 380); },
    coin() { tom(988, 0.09, 'square', 0.07, 0); tom(1319, 0.2, 'square', 0.07, 0.07); },
    moeda() { tom(1200 + Math.random() * 300, 0.07, 'triangle', 0.06); },
    pop() { tom(300, 0.12, 'sine', 0.2, 0, 700); },
    ovo() { for (let i = 0; i < 5; i++) tom(260 + i * 40, 0.07, 'triangle', 0.1, i * 0.12); },
    comum() { tom(NOTAS.do, 0.15, 'triangle', 0.18); tom(NOTAS.mi, 0.25, 'triangle', 0.18, 0.1); },
    raro() { [NOTAS.do, NOTAS.mi, NOTAS.sol, NOTAS.do2].forEach((f, i) => tom(f, 0.22, 'triangle', 0.18, i * 0.1)); },
    epico() { [NOTAS.do, NOTAS.mi, NOTAS.sol, NOTAS.do2, NOTAS.mi2].forEach((f, i) => { tom(f, 0.3, 'triangle', 0.18, i * 0.1); tom(f / 2, 0.3, 'sine', 0.12, i * 0.1); }); },
    lendario() { [NOTAS.do, NOTAS.mi, NOTAS.sol, NOTAS.do2, NOTAS.mi2, NOTAS.sol2].forEach((f, i) => { tom(f, 0.45, 'triangle', 0.18, i * 0.09); tom(f * 1.5, 0.45, 'sine', 0.07, i * 0.09); }); tom(NOTAS.do2, 0.9, 'sawtooth', 0.06, 0.55); },
    nivel() { [NOTAS.sol, NOTAS.do2, NOTAS.mi2, NOTAS.sol2].forEach((f, i) => tom(f, 0.28, 'square', 0.07, i * 0.11)); tom(NOTAS.sol2, 0.6, 'triangle', 0.14, 0.45); },
    erro() { tom(220, 0.14, 'sawtooth', 0.08, 0, 150); },
    bau() { [NOTAS.mi, NOTAS.sol, NOTAS.do2].forEach((f, i) => tom(f, 0.2, 'triangle', 0.16, i * 0.08)); },
  };
  return {
    get mudo() { return mudo; },
    alternar() { mudo = !mudo; try { localStorage.setItem('sitio.mudo', mudo ? '1' : '0'); } catch (e) {} if (!mudo) { ligar(); SONS.tap(); } return mudo; },
    play(nome) { try { if (SONS[nome]) SONS[nome](); } catch (e) {} },
    vibrar(ms) { if (!mudo && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) {} },
  };
})();
