/* ===== Sons e vibração =====
   Sons sintetizados na hora (WebAudio), sem arquivos. O áudio só liga depois do primeiro toque, como os navegadores exigem. */
const Som = (() => {
  let ctx = null, mestre = null, mudo = false, musOn = true, musGain = null, chuvaG = null, ruidoBuf = null, musTimer = 0, musHora = 12, musN = 0;
  try { mudo = localStorage.getItem('sitio.mudo') === '1'; } catch (e) {}
  function ligar() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); mestre = ctx.createGain(); mestre.gain.value = 0.5; mestre.connect(ctx.destination);
    musGain = ctx.createGain(); musGain.gain.value = 0.55; musGain.connect(mestre); iniciarMusica();
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
  /* ruído branco em loop: base da chuva e do trovão */
  function ruido() {
    if (ruidoBuf || !ctx) return ruidoBuf;
    const n = ctx.sampleRate * 2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    return (ruidoBuf = b);
  }
  function chuva(v) {
    if (!ctx) return;
    if (!chuvaG) {
      if (v <= 0) return;
      const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), hp = ctx.createBiquadFilter(); chuvaG = ctx.createGain(); chuvaG.gain.value = 0;
      src.buffer = ruido(); src.loop = true; f.type = 'lowpass'; f.frequency.value = 3200; hp.type = 'highpass'; hp.frequency.value = 500;
      src.connect(hp); hp.connect(f); f.connect(chuvaG); chuvaG.connect(mestre); src.start();
    }
    chuvaG.gain.setTargetAtTime(mudo ? 0 : v * 0.12, ctx.currentTime, 0.6);
  }
  function trovao() {
    if (!ctx || mudo) return;
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(), t = ctx.currentTime;
    src.buffer = ruido(); f.type = 'lowpass'; f.frequency.setValueAtTime(420, t); f.frequency.exponentialRampToValueAtTime(70, t + 2.2);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    src.connect(f); f.connect(g); g.connect(mestre); src.start(t); src.stop(t + 2.5);
  }
  /* vozes simples por tipo de bicho */
  const VOZ = {
    ave() { tom(1500, 0.07, 'triangle', 0.07, 0, 2000); tom(1900, 0.06, 'triangle', 0.06, 0.09, 1500); tom(1700, 0.05, 'triangle', 0.05, 0.17, 2100); },
    miau() { tom(620, 0.36, 'triangle', 0.09, 0, 950); tom(950, 0.2, 'triangle', 0.07, 0.3, 560); },
    au() { tom(260, 0.09, 'sawtooth', 0.09, 0, 160); tom(250, 0.11, 'sawtooth', 0.09, 0.14, 150); },
    grave() { tom(130, 0.55, 'sawtooth', 0.07, 0, 95); tom(65, 0.55, 'sine', 0.1, 0, 50); },
    rugido() { tom(110, 0.7, 'sawtooth', 0.09, 0, 70); tom(160, 0.6, 'square', 0.04, 0.05, 90); },
    sapo() { [0, 0.13].forEach(a => tom(190, 0.08, 'square', 0.06, a, 280)); },
    zumbido() { tom(240, 0.5, 'sawtooth', 0.035, 0, 260); tom(246, 0.5, 'sawtooth', 0.035, 0, 252); },
    pequeno() { tom(1100, 0.06, 'sine', 0.08, 0, 1500); tom(1400, 0.06, 'sine', 0.07, 0.08, 1100); },
    mugido() { tom(150, 0.7, 'triangle', 0.1, 0, 110); },
    be() { tom(420, 0.45, 'sawtooth', 0.05, 0, 330); tom(445, 0.45, 'sawtooth', 0.04, 0.02, 340); }
  };
  const VOZ_DE = { pintinho: 'ave', patinho: 'ave', peru: 'ave', galinha: 'ave', cisne: 'ave', pavao: 'ave', coruja: 'ave', flamingo: 'ave', arara: 'ave', gato: 'miau', cachorro: 'au', raposa: 'au', lobo: 'au', sapo: 'sapo', abelha: 'zumbido', bezerra: 'mugido', boi: 'mugido', ovelha: 'be', cabrito: 'be', lhama: 'be', leao: 'rugido', tigre: 'rugido', onca: 'rugido', trex: 'rugido', urso: 'rugido', elefante: 'grave', mamute: 'grave', camelo: 'grave', girafa: 'grave', potro: 'grave', cervo: 'grave', canguru: 'grave' };
  function bicho(id) { const v = VOZ[VOZ_DE[id] || 'pequeno']; try { v(); } catch (e) {} }
  /* música generativa: arpejos suaves numa escala pentatônica, mais calma de noite */
  const ESC_DIA = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3], ESC_NOITE = [220, 261.6, 293.7, 329.6, 392, 440, 523.3];
  function notaMus(f, dur, vol, atraso) {
    if (!ctx) return; const t = ctx.currentTime + atraso, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(musGain); o.start(t); o.stop(t + dur + 0.05);
  }
  function compasso() {
    if (!ctx || mudo || !musOn || document.hidden) return;
    const noite = musHora < 6 || musHora >= 19, esc = noite ? ESC_NOITE : ESC_DIA, passo = noite ? 0.9 : 0.6, v = noite ? 0.035 : 0.045;
    const raiz = [0, 2, 4, 3][musN++ % 4];
    notaMus(esc[raiz] / 2, passo * 4, v * 0.9, 0);
    for (let i = 0; i < 4; i++) if (Math.random() < 0.8) notaMus(esc[(raiz + [0, 2, 4, 2][i] + (Math.random() < 0.3 ? 1 : 0)) % esc.length], passo * 2, v, i * passo);
  }
  function iniciarMusica() { if (musTimer) return; compasso(); musTimer = setInterval(compasso, 2400); }
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
    trovao() { trovao(); },
    erro() { tom(220, 0.14, 'sawtooth', 0.08, 0, 150); },
    bau() { [NOTAS.mi, NOTAS.sol, NOTAS.do2].forEach((f, i) => tom(f, 0.2, 'triangle', 0.16, i * 0.08)); },
  };
  return {
    semVibra: false,
    get mudo() { return mudo; },
    alternar() { mudo = !mudo; try { localStorage.setItem('sitio.mudo', mudo ? '1' : '0'); } catch (e) {} if (chuvaG) chuvaG.gain.value = 0; if (!mudo) { ligar(); SONS.tap(); } return mudo; },
    chuva, trovao, bicho,
    get musica() { return musOn; },
    musicaLigar(v) { musOn = !!v; if (musOn) { ligar(); } },
    hora(h) { musHora = h; },
    play(nome) { try { if (SONS[nome]) SONS[nome](); } catch (e) {} },
    vibrar(ms) { if (!mudo && !this.semVibra && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) {} },
  };
})();

/* ---------- Google Play (adaptador) ----------
   No navegador não faz nada. Ao empacotar com Capacitor e instalar um plugin de Play Games
   (com os IDs criados no Play Console), basta preencher PLAT_IDS: o jogo já chama estes ganchos. */
const PLAT_IDS = {};                       // ex.: { 'conq_id_do_jogo': 'CgkI...' }
const Plat = (() => {
  const pl = () => (window.Capacitor && Capacitor.Plugins && (Capacitor.Plugins.PlayGames || Capacitor.Plugins.GamesServices)) || null;
  const tenta = (f, ...a) => { try { const p = pl(); if (p && p[f]) p[f](...a); } catch (e) {} };
  return {
    disponivel: () => !!pl(),
    entrar: () => tenta('signIn'),
    conquista(id) { const x = PLAT_IDS[id]; if (x) tenta('unlockAchievement', { achievementID: x }); },
    placar(pontos) { if (PLAT_IDS.placar) tenta('submitScore', { leaderboardID: PLAT_IDS.placar, totalScoreLabel: String(pontos), totalScoreValue: pontos }); },
    aviso(titulo, texto, segundos) { try { const p = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.LocalNotifications; if (p) p.schedule({ notifications: [{ id: 1, title: titulo, body: texto, schedule: { at: new Date(Date.now() + segundos * 1000) } }] }); } catch (e) {} },
  };
})();

/* ---------- Anúncios recompensados (adaptador AdMob) ----------
   No navegador o jogo usa o anúncio simulado. No app (Capacitor + @capacitor-community/admob) usa vídeo de verdade.
   Os IDs abaixo são os de TESTE do Google: troque pelos seus no Play/AdMob antes de publicar. */
const ADMOB_IDS = { recompensado: 'ca-app-pub-3940256099942544/5224354917' };
const Anuncios = (() => {
  const pl = () => (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.AdMob) || null;
  return {
    disponivel: () => !!pl(),
    async iniciar() { try { const p = pl(); if (p) await p.initialize({ initializeForTesting: ADMOB_IDS.recompensado.startsWith('ca-app-pub-3940256099942544') }); } catch (e) {} },
    // devolve true se o jogador assistiu até o fim (e merece a recompensa)
    async mostrar(personalizado) {
      const p = pl(); if (!p) return false;
      try {
        await p.prepareRewardVideoAd({ adId: ADMOB_IDS.recompensado, npa: !personalizado });
        const r = await p.showRewardVideoAd();
        return !!(r && (r.amount >= 0 || r.type));
      } catch (e) { return false; }
    }
  };
})();
