/* ===== Regras do jogo (sem DOM) ===== */
const RARIDADES = [
  { id: 'comum',    nome: 'Comum',    prod: 0.5 },
  { id: 'incomum',  nome: 'Incomum',  prod: 1.5 },
  { id: 'raro',     nome: 'Raro',     prod: 4 },
  { id: 'epico',    nome: 'Épico',    prod: 12 },
  { id: 'lendario', nome: 'Lendário', prod: 40 }
];
const PETS = [
  { id: 'pintinho',  nome: 'Pintinho',           em: '🐥', r: 0 },
  { id: 'coelho',    nome: 'Coelho',             em: '🐰', r: 0 },
  { id: 'leitao',    nome: 'Leitão',             em: '🐷', r: 0 },
  { id: 'patinho',   nome: 'Patinho',            em: '🦆', r: 0 },
  { id: 'gato',      nome: 'Gato',               em: '🐱', r: 0 },
  { id: 'cachorro',  nome: 'Cachorro',           em: '🐶', r: 0 },
  { id: 'peru',      nome: 'Peru',               em: '🦃', r: 0 },
  { id: 'sapo',      nome: 'Sapo',               em: '🐸', r: 0 },
  { id: 'ovelha',    nome: 'Ovelha',             em: '🐑', r: 1 },
  { id: 'bezerra',   nome: 'Bezerra',            em: '🐮', r: 1 },
  { id: 'cabrito',   nome: 'Cabrito',            em: '🐐', r: 1 },
  { id: 'galinha',   nome: 'Galinha Caipira',    em: '🐔', r: 1 },
  { id: 'hamster',   nome: 'Hamster',            em: '🐹', r: 1 },
  { id: 'tartaruga', nome: 'Tartaruga',          em: '🐢', r: 1 },
  { id: 'abelha',    nome: 'Abelha',             em: '🐝', r: 1 },
  { id: 'ourico',    nome: 'Ouriço',             em: '🦔', r: 1 },
  { id: 'raposa',    nome: 'Raposa',             em: '🦊', r: 2 },
  { id: 'potro',     nome: 'Potro',              em: '🐴', r: 2 },
  { id: 'lhama',     nome: 'Lhama',              em: '🦙', r: 2 },
  { id: 'lontra',    nome: 'Lontra',             em: '🦦', r: 2 },
  { id: 'esquilo',   nome: 'Esquilo',            em: '🐿️', r: 2 },
  { id: 'gamba',     nome: 'Gambá',              em: '🦨', r: 2 },
  { id: 'texugo',    nome: 'Texugo',             em: '🦡', r: 2 },
  { id: 'cisne',     nome: 'Cisne',              em: '🦢', r: 3 },
  { id: 'pavao',     nome: 'Pavão',              em: '🦚', r: 3 },
  { id: 'coruja',    nome: 'Coruja',             em: '🦉', r: 3 },
  { id: 'cervo',     nome: 'Cervo',              em: '🦌', r: 3 },
  { id: 'macaco',    nome: 'Macaco-prego',       em: '🐒', r: 3 },
  { id: 'preguica',  nome: 'Preguiça',           em: '🦥', r: 3 },
  { id: 'flamingo',  nome: 'Flamingo',           em: '🦩', r: 3 },
  { id: 'canguru',   nome: 'Canguru',            em: '🦘', r: 3 },
  { id: 'trex',      nome: 'Tiranossauro',       em: '🦖', r: 3 },
  { id: 'arara',     nome: 'Arara-azul',         em: '🦜', r: 4 },
  { id: 'elefante',  nome: 'Elefante',           em: '🐘', r: 4 },
  { id: 'onca',      nome: 'Onça-pintada',       em: '🐆', r: 4 },
  { id: 'panda',     nome: 'Panda',              em: '🐼', r: 4 },
  { id: 'leao',      nome: 'Leão',               em: '🦁', r: 4 },
  { id: 'zebra',     nome: 'Zebra',              em: '🦓', r: 4 },
  { id: 'mamute',    nome: 'Mamute-lanoso',      em: '🦣', r: 4 },
  { id: 'dino',      nome: 'Braquiossauro',      em: '🦕', r: 4 }
];
/* Bichos exclusivos dos eventos semanais: não saem dos ovos. */
const PETS_EVENTO = [
  { id: 'pinguim',  nome: 'Pinguim',   em: '🐧', r: 3, ev: 1 },
  { id: 'girafa',   nome: 'Girafa',    em: '🦒', r: 3, ev: 1 },
  { id: 'koala',    nome: 'Coala',     em: '🐨', r: 3, ev: 1 },
  { id: 'golfinho', nome: 'Golfinho',  em: '🐬', r: 3, ev: 1 },
  { id: 'camelo',   nome: 'Camelo',    em: '🐪', r: 3, ev: 1 },
  { id: 'lobo',     nome: 'Lobo-guará', em: '🐺', r: 3, ev: 1 },
  { id: 'urso',     nome: 'Urso-pardo', em: '🐻', r: 3, ev: 1 },
  { id: 'tigre',    nome: 'Tigre',     em: '🐅', r: 3, ev: 1 }
];
/* Saves antigos tinham unicórnio e dragão, que não existem; viram animais reais da mesma raridade. Dinossauros e mamutes existiram de verdade e ficam. */
const PET_MIGRA = { unicornio: 'cisne', dragao: 'arara' };
const PET_POR_ID = Object.fromEntries(PETS.concat(PETS_EVENTO).map(p => [p.id, p]));
const OVOS = {
  palha:   { nome: 'Ovo de Palha', moeda: 'coins', base: 120, tempo: 20, pesos: [60, 28, 9, 2.6, 0.4], nivel: 1 },
  dourado: { nome: 'Ovo Dourado',  moeda: 'gems',  base: 5,   tempo: 60, pesos: [0, 38, 40, 19, 3],    nivel: 5 }
};
const PITY_LIMIT = 30, PITY_PESOS = [0, 0, 0, 92, 8], LVL_MAX = 10;
const SLOTS_INI = 3, SLOTS_MAX = 8;
const PASTO_CUSTO = [500, 4000, 30000, 200000, 1500000];
const PASTO_NIVEL = [2, 4, 7, 10, 14];
const NIVEL_MAX = 30;
const XP_OVO = [8, 12, 25, 60, 200];
const SET_BONUS = [0.10, 0.20, 0.35, 0.60, 1.00];
const DIARIO = [{ k: 1, g: 0 }, { k: 0, g: 2 }, { k: 2, g: 0 }, { k: 0, g: 3 }, { k: 3, g: 0 }, { k: 0, g: 4 }, { k: 4, g: 8 }];
const TITULOS = [[1, 'Aprendiz de Roça'], [3, 'Peão Esperto'], [6, 'Sitiante'], [10, 'Fazendeiro'], [15, 'Capataz-Mor'], [20, 'Barão da Colheita'], [25, 'Duque dos Bichos'], [30, 'Lenda do Campo']];
const OBRAS = {
  celeiro:    { nome: 'Celeiro',    nivel: 1, max: 10, base: 150, cresc: 2.0 },
  chocadeira: { nome: 'Chocadeira', nivel: 2, max: 8,  base: 300, cresc: 2.1 },
  moinho:     { nome: 'Moinho',     nivel: 3, max: 10, base: 400, cresc: 2.2 },
  estufa:     { nome: 'Estufa',     nivel: 5, max: 10, base: 700, cresc: 2.15 }
};
const NIVEL_GUILDA = 5;

/* ----- tempo ----- */
let TZ_OFF = 0;
const HORA = 3600000, DIA = 86400000;
const diaDe = now => Math.floor((now - TZ_OFF * 60000) / DIA);
const semanaDe = now => Math.floor((diaDe(now) + 3) / 7);
const horasSemana = now => ((now - TZ_OFF * 60000) - (semanaDe(now) * 7 - 3) * DIA) / HORA;

/* ----- sorteio ----- */
function sortearRaridade(pesos, pity, rng) {
  rng = rng || Math.random;
  const p = pity >= PITY_LIMIT - 1 ? PITY_PESOS : pesos;
  const t = p.reduce((a, b) => a + b, 0);
  let x = rng() * t;
  for (let i = 0; i < p.length; i++) { if (x < p[i]) return i; x -= p[i]; }
  return p.length - 1;
}
function sortearPet(ovoId, pity, rng) {
  rng = rng || Math.random;
  const r = sortearRaridade(OVOS[ovoId].pesos, pity, rng);
  const lista = PETS.filter(p => p.r === r);
  return { r, pet: lista[Math.floor(rng() * lista.length)] };
}

/* ----- fórmulas ----- */
const horasCeleiro = l => 1 + 0.5 * l;
const multMoinho = l => 1 + 0.1 * l;
const fatorChocar = l => Math.max(0.36, 1 - 0.08 * l);
const multXP = l => 1 + 0.1 * l;
const xpProx = l => Math.round(60 * Math.pow(1.45, l - 1));
const nivelParaObra = l => 3 * l + 1;   // nível do fazendeiro para subir a obra do nível l para l+1
const tituloDe = l => TITULOS.filter(t => l >= t[0]).pop()[1];
const tierDe = l => Math.min(5, Math.floor((l - 1) / 5));
const incubadoras = n => 2 + (n >= 6 ? 1 : 0) + (n >= 12 ? 1 : 0);
const custoObra = (id, l) => Math.round(OBRAS[id].base * Math.pow(OBRAS[id].cresc, l));
const custoOvo = (S, id) => OVOS[id].moeda === 'coins' ? Math.round(OVOS[id].base * (1 + 0.2 * (S.nivel - 1)) * Math.pow(1.03, S.summons)) : OVOS[id].base;
const tempoOvo = (S, id) => Math.max(5, Math.round(OVOS[id].tempo * fatorChocar(S.obras.chocadeira)));
const metaSafra = n => Math.round(120 * Math.pow(1.2, n - 1));
function recSafra(n) { return { coins: Math.round(metaSafra(n) * 0.25), xp: 8 + 2 * n, gems: n % 10 === 0 ? 15 : n % 5 === 0 ? 5 : n % 3 === 0 ? 1 : 0 }; }
function prodPet(id, lvl) { return RARIDADES[PET_POR_ID[id].r].prod * (1 + 0.3 * (lvl - 1)); }
function ativos(S) {
  return Object.keys(S.pets)
    .map(id => ({ id, lvl: S.pets[id].lvl, prod: prodPet(id, S.pets[id].lvl) * (1 + 0.15 * felicidade(S, id)) }))
    .sort((a, b) => b.prod - a.prod)
    .slice(0, S.slots);
}
function setsCompletos(S) { return RARIDADES.map((_, r) => PETS.filter(p => p.r === r).every(p => S.pets[p.id])); }
function bonusSets(S) { const c = setsCompletos(S); return c.reduce((a, ok, r) => a + (ok ? SET_BONUS[r] : 0), 0); }
function bonusGuildaProd(S) { return S.guilda.id >= 0 ? 0.04 * (S.guilda.nivel - 1) : 0; }
function prodBase(S) { return ativos(S).reduce((a, p) => a + p.prod, 0); }
function multProd(S) { return multMoinho(S.obras.moinho) * (1 + bonusSets(S)) * (1 + bonusGuildaProd(S)) * (1 + 0.25 * (S.prest || 0)) * (1 + bonusDecor(S)) * (S.premium && S.premium.passe ? 1.25 : 1); }
function prodTotal(S) { return prodBase(S) * multProd(S); }
function capCeleiro(S) { return Math.max(200, prodTotal(S) * 3600 * horasCeleiro(S.obras.celeiro)); }
function pastoProx(S) { return S.slots < SLOTS_MAX ? { custo: PASTO_CUSTO[S.slots - SLOTS_INI], nivel: PASTO_NIVEL[S.slots - SLOTS_INI] } : null; }
function desbloqueios(n) {
  const r = [];
  for (const id in OBRAS) if (OBRAS[id].nivel === n && n > 1) r.push(OBRAS[id].nome);
  PASTO_NIVEL.forEach((l, i) => { if (l === n) r.push('Pasto ' + (i + 4)); });
  if (n === OVOS.dourado.nivel) r.push('Ovo Dourado');
  if (n === NIVEL_GUILDA) r.push('Guilda');
  if (n === 6 || n === 12) r.push('Nova incubadora');
  return r;
}
function ajustarIncubadoras(S) { const n = incubadoras(S.nivel); while (S.eggs.length < n) S.eggs.push(null); }

/* ----- pseudo-aleatório determinístico (jogadores simulados) ----- */
function h32(x) { x = (x ^ 61) ^ (x >>> 16); x = x + (x << 3); x = x ^ (x >>> 4); x = Math.imul(x, 0x27d4eb2d); x = x ^ (x >>> 15); return x >>> 0; }
const rnd01 = (a, b) => (h32(Math.imul(a, 7919) + Math.imul(b, 104729) + 12345) % 100000) / 100000;

/* ----- guilda (jogadores simulados) ----- */
const GUILDAS = [
  { id: 0, nome: 'Liga do Celeiro',  lema: 'Um ovo novo por dia' },
  { id: 1, nome: 'Raposas da Roça',  lema: 'Espertas e sempre no pasto' },
  { id: 2, nome: 'Os Colhedores',    lema: 'Quem planta, colhe' }
];
const NOMES = ['Mari', 'Zé do Milho', 'Tati', 'Duda', 'Bento', 'Lia', 'Caco', 'Nina', 'Teco', 'Gabi', 'Rafa', 'Joaquim', 'Bia', 'Pipo', 'Dona Cida', 'Tonho', 'Léo', 'Sol', 'Vitória', 'Nando'];
const SUFIXOS = ['do Vale', 'da Serra', 'do Riacho'];
const N_MEMBROS = 14;
const BAUS = [{ p: 0.25, k: 2, g: 2 }, { p: 0.5, k: 4, g: 3 }, { p: 0.75, k: 8, g: 5 }, { p: 1, k: 15, g: 10 }];
const MIN_PONTOS_BAU = 30;
const membroNome = (gid, i) => NOMES[(i + gid * 4) % NOMES.length];
const membroPapel = i => i === 0 ? 'Líder' : i === 1 ? 'Vice' : 'Membro';
const membroTaxa = (gid, i) => 0.8 + rnd01(gid * 100 + i, 1) * 3.4;
const pontosMembro = (gid, i, now) => Math.floor(membroTaxa(gid, i) * horasSemana(now));
const membroNivel = (S, i, now) => 4 + Math.floor(rnd01(S.guilda.id * 100 + i, 2) * 22) + Math.floor(Math.max(0, diaDe(now) - S.criadoDia) * 0.2);
function fundoGuilda(S, now) {
  const g = S.guilda; let soma = 0;
  for (let i = 0; i < N_MEMBROS; i++) soma += membroTaxa(g.id, i);
  return soma * 0.4 * Math.max(0, (now - g.entrou) / HORA) + g.doado;
}
const fundoNivel = n => Math.round(2500 * Math.pow(1.7, n - 1));  // fundo necessário para passar do nível n para n+1
function nivelPorFundo(f) { let n = 1; while (n < 20 && f >= fundoNivel(n)) n++; return n; }
function atualizarGuilda(S, now) {
  const g = S.guilda; if (g.id < 0 || g.id >= GUILDAS.length) return;   // guilda online: o servidor manda
  g.nivel = nivelPorFundo(fundoGuilda(S, now));
  const sem = semanaDe(now);
  if (g.semana !== sem) { g.semana = sem; g.pontos = 0; g.baus = [0, 0, 0, 0]; }
}
const metaSemana = S => Math.round(9000 * (1 + 0.1 * (S.guilda.nivel - 1)));
function totalSemana(S, now) {
  let t = S.guilda.pontos;
  for (let i = 0; i < N_MEMBROS; i++) t += pontosMembro(S.guilda.id, i, now);
  return t;
}
/* Ganchos do modo online (src/online.js): recebem os pontos e os choques raros para enviar ao servidor. */
let HOOK_PONTOS = null, HOOK_CHOQUE = null;
function addPontos(S, n, motivo) {
  if (S.guilda.id >= 0) S.guilda.pontos += n;
  if (motivo && HOOK_PONTOS) HOOK_PONTOS(n, motivo);
}
function membrosOrdenados(S, now) {
  const l = [];
  for (let i = 0; i < N_MEMBROS; i++) l.push({ i, nome: membroNome(S.guilda.id, i), papel: membroPapel(i), nivel: membroNivel(S, i, now), pontos: pontosMembro(S.guilda.id, i, now), voce: false });
  l.push({ i: -1, nome: 'Você', papel: 'Membro', nivel: S.nivel, pontos: S.guilda.pontos, voce: true });
  return l.sort((a, b) => b.pontos - a.pontos);
}
function entrarGuilda(S, id, now) {
  if (S.nivel < NIVEL_GUILDA) return { erro: 'nivel' };
  if (S.guilda.id >= 0) return { erro: 'ja' };
  S.guilda = { id, entrou: now, doado: 0, nivel: 1, pontos: 0, semana: -1, baus: [0, 0, 0, 0], ajudou: {}, parab: {}, parabDia: { dia: -1, qtd: 0 } };
  atualizarGuilda(S, now);
  return { ok: true, ups: ganharXP(S, 40) };
}
function doar(S, valor, now) {
  if (S.guilda.id < 0) return { erro: 'sem' };
  if (S.coins < valor) return { erro: 'moedas' };
  S.coins -= valor; S.guilda.doado += valor;
  addPontos(S, Math.floor(valor / 50));
  atualizarGuilda(S, now);
  return { ok: true, ups: ganharXP(S, Math.ceil(Math.sqrt(valor) / 2)) };
}
function ajudar(S, i, now) {
  const g = S.guilda, dia = diaDe(now);
  if (g.id < 0) return { erro: 'sem' };
  if (g.ajudou[i] === dia) return { erro: 'ja' };
  g.ajudou[i] = dia;
  const coins = Math.max(30, Math.round(prodTotal(S) * 60));
  S.coins += coins; addPontos(S, 15);
  return { ok: true, coins, ups: ganharXP(S, 5) };
}
function resgatarBau(S, i, now) {
  const g = S.guilda;
  if (g.id < 0) return { erro: 'sem' };
  if (g.baus[i]) return { erro: 'ja' };
  if (g.pontos < MIN_PONTOS_BAU) return { erro: 'min' };
  if (totalSemana(S, now) < BAUS[i].p * metaSemana(S)) return { erro: 'meta' };
  const base = Math.max(200, Math.round(prodTotal(S) * 600)), b = BAUS[i];
  S.coins += b.k * base; S.gems += b.g; g.baus[i] = 1;
  return { ok: true, coins: b.k * base, gems: b.g, ups: ganharXP(S, 30 + 10 * i) };
}
/* mural: um evento novo a cada 25 minutos, sempre igual para o mesmo horário */
const SLOT_MURAL = 25 * 60000;
function muralEventos(S, now, n) {
  const g = S.guilda, atual = Math.floor(now / SLOT_MURAL), out = [];
  if (g.id < 0) return out;
  for (let j = 0; j < n; j++) {
    const slot = atual - j, hh = h32(g.id * 997 + slot);
    const i = hh % N_MEMBROS, nome = membroNome(g.id, i), tipo = (hh >>> 4) % 5;
    let txt;
    if (tipo === 0) { const r = 2 + ((hh >>> 8) % 20 < 15 ? 0 : (hh >>> 8) % 20 < 19 ? 1 : 2); const l = PETS.filter(p => p.r === r); const p = l[(hh >>> 12) % l.length]; txt = `${nome} chocou ${p.em} ${p.nome} (${RARIDADES[r].nome})!`; }
    else if (tipo === 1) txt = `${nome} subiu para o nível ${membroNivel(S, i, slot * SLOT_MURAL)}.`;
    else if (tipo === 2) txt = `${nome} doou ${(1 + (hh >>> 9) % 9) * 500} moedas ao fundo da guilda.`;
    else if (tipo === 3) txt = `${nome} completou a safra ${5 + (hh >>> 10) % 40}.`;
    else txt = `${nome} ajudou ${membroNome(g.id, (i + 3) % N_MEMBROS)} no sítio.`;
    out.push({ key: slot, txt, t: slot * SLOT_MURAL });
  }
  return out;
}
function parabenizar(S, key, now) {
  const g = S.guilda, dia = diaDe(now);
  if (g.id < 0) return { erro: 'sem' };
  if (g.parab[key]) return { erro: 'ja' };
  if (g.parabDia.dia !== dia) g.parabDia = { dia, qtd: 0 };
  if (g.parabDia.qtd >= 10) return { erro: 'limite' };
  g.parabDia.qtd++; g.parab[key] = 1;
  const ks = Object.keys(g.parab); if (ks.length > 40) ks.slice(0, ks.length - 40).forEach(k => delete g.parab[k]);
  const coins = Math.max(20, Math.round(prodTotal(S) * 30));
  S.coins += coins;
  return { ok: true, coins };
}
/* ranking dos sítios (jogadores simulados) */
function poderJogador(S) { return Math.round(prodTotal(S) * 10 + S.nivel * 40 + Object.keys(S.pets).length * 25 + S.safra * 12 + (S.prest || 0) * 300); }
function rankingSitios(S, now) {
  const dias = Math.max(0, diaDe(now) - S.criadoDia), l = [];
  for (let i = 0; i < 50; i++) l.push({ nome: NOMES[i % 20] + ' ' + SUFIXOS[Math.floor(i / 20)], poder: Math.round(60 * Math.pow(1.17, i) * (1 + 0.04 * dias)), voce: false });
  l.push({ nome: 'Você', poder: poderJogador(S), voce: true });
  l.sort((a, b) => b.poder - a.poder);
  return l.map((x, k) => Object.assign(x, { pos: k + 1 }));
}

/* ----- progressão do fazendeiro ----- */
function ganharXP(S, n) {
  const ups = [];
  if (S.nivel >= NIVEL_MAX) return ups;
  S.xp += Math.round(n * multXP(S.obras.estufa));
  while (S.nivel < NIVEL_MAX && S.xp >= xpProx(S.nivel)) {
    S.xp -= xpProx(S.nivel); S.nivel++;
    const g = S.nivel % 5 === 0 ? 10 : 3; S.gems += g;
    ups.push({ nivel: S.nivel, gems: g });
  }
  if (S.nivel >= NIVEL_MAX) S.xp = 0;
  ajustarIncubadoras(S);
  return ups;
}
const xpColeta = q => Math.max(1, Math.ceil(Math.sqrt(q) * 0.4));

/* ----- missões ----- */
const MISSOES_INI = [{ t: 'chocar', meta: 1 }, { t: 'coletar', meta: 100 }, { t: 'obra', meta: 1 }];
function arred(n) { if (n < 20) return Math.max(1, Math.round(n)); const p = Math.pow(10, Math.floor(Math.log10(n)) - 1); return Math.round(n / p) * p; }
function recMissao(t, meta, L) {
  if (t === 'coletar') return { coins: Math.round(meta * 0.35), xp: 25 + 4 * L, gems: 1 };
  if (t === 'chocar')  return { coins: 60 * meta, xp: 30 + 6 * L, gems: meta >= 3 ? 2 : 1 };
  if (t === 'obra')    return { coins: 150 + 40 * L, xp: 35 + 6 * L, gems: 1 };
  if (t === 'anuncio') return { coins: 0, xp: 20 + 3 * L, gems: 3 };
  return { coins: 100 + 50 * L, xp: 60 + 8 * L, gems: 3 };
}
function novaMissao(S, rng) {
  rng = rng || Math.random;
  const L = S.nivel; let t, meta;
  if (S.mCont < MISSOES_INI.length) { t = MISSOES_INI[S.mCont].t; meta = MISSOES_INI[S.mCont].meta; }
  else {
    const tipos = ['coletar', 'chocar', 'obra', 'anuncio', 'melhor'].filter(x => !S.missoes.some(m => m && m.t === x));
    t = tipos[Math.floor(rng() * tipos.length)];
    meta = t === 'coletar' ? arred(Math.max(150, prodTotal(S) * 900)) : t === 'chocar' ? 2 + Math.floor(L / 4) : t === 'obra' ? 1 + Math.floor(L / 8) : 1;
  }
  S.mCont++;
  return { t, meta, prog: 0, min: L < 6 ? 1 : 2, rec: recMissao(t, meta, L), feita: false };
}
function evento(S, t, q, r) {
  for (const m of S.missoes) {
    if (!m || m.feita || m.t !== t) continue;
    if (t === 'melhor' && r < m.min) continue;
    m.prog = Math.min(m.meta, m.prog + q);
    if (m.prog >= m.meta) m.feita = true;
  }
}

/* ----- estado e ações ----- */
function novoEstado(now) {
  const S = {
    v: 2, prest: 0, ts: now, coins: 240, gems: 5, barn: 0, pets: {}, slots: SLOTS_INI, nivel: 1, xp: 0,
    obras: { celeiro: 0, chocadeira: 0, moinho: 0, estufa: 0 },
    eggs: [{ tipo: 'palha', pronto: now }, null], pity: 0, summons: 0, cd: { ovo: 0, gemas: 0 },
    safra: 1, safraProg: 0, criadoDia: diaDe(now),
    ads: { dobro: 0, ovo: 0, gemas: 0, acelerar: 0, missao: 0, diario: 0, bau: 0, brilho: 0, adubo: 0, pedido: 0 },
    horta: [null, null], colheita: {}, pedidos: [null, null, null], pedidoCont: 0, evt: { sem: -1, pts: 0, res: [0, 0, 0, 0] },
    bau: { dia: -1, qtd: 0 }, brilho: { dia: -1 }, premium: { semAnuncios: false, passe: false }, decor: {}, tema: 'auto',
    tut: { passo: 0, fim: false }, cfg: { eco: 'auto', som: true, vibra: true }, metr: { sessoes: 0, dias: {}, convites: 0 },
    dev: { ecpm: 5, dau: 1000, adsDia: 6 },
    missoes: [null, null, null], mCont: 0, diario: { ultimo: -1, seq: 0 }, stats: { coletado: 0, chocados: 0 },
    guilda: { id: -1, entrou: 0, doado: 0, nivel: 1, pontos: 0, semana: -1, baus: [0, 0, 0, 0], ajudou: {}, parab: {}, parabDia: { dia: -1, qtd: 0 } }
  };
  for (let i = 0; i < 3; i++) S.missoes[i] = novaMissao(S);
  return S;
}
/* avança o relógio: produção do celeiro e progresso das safras */
function avancar(S, now) {
  const dt = Math.max(0, (now - S.ts) / 1000), out = { safras: [], ups: [] };
  S.ts = now;
  atualizarGuilda(S, now);
  const prod = prodTotal(S);
  S.barn = Math.min(capCeleiro(S), S.barn + prod * dt);
  S.safraProg += prod * dt;
  let guard = 0;
  while (S.safraProg >= metaSafra(S.safra) && guard++ < 300) {
    S.safraProg -= metaSafra(S.safra);
    const r = recSafra(S.safra);
    S.coins += r.coins; S.gems += r.gems; addPontos(S, 5, 'safra');
    out.safras.push({ n: S.safra, rec: r });
    out.ups.push(...ganharXP(S, r.xp));
    S.safra++;
  }
  return out;
}
function aplicarPet(S, id) {
  const cur = S.pets[id];
  if (!cur) { S.pets[id] = { lvl: 1 }; return { tipo: 'novo' }; }
  if (cur.lvl < LVL_MAX) { cur.lvl++; return { tipo: 'nivel', lvl: cur.lvl }; }
  const reembolso = Math.round(50 * Math.pow(3, PET_POR_ID[id].r));
  S.coins += reembolso;
  return { tipo: 'max', reembolso };
}
function coletar(S, mult) {
  const q = Math.floor(S.barn); if (q < 1) return null;
  const ganho = q * (mult || 1);
  S.coins += ganho; S.barn -= q; S.stats.coletado += ganho;
  evento(S, 'coletar', ganho); pontoEvento(S, Math.max(1, Math.floor(q / 400)));
  addPontos(S, Math.max(1, Math.floor(q / 200)), 'coleta');
  return { q, ganho, ups: ganharXP(S, xpColeta(q)) };
}
function comprarOvo(S, tipo, now) {
  const o = OVOS[tipo];
  if (S.nivel < o.nivel) return { erro: 'nivel', nivel: o.nivel };
  const i = S.eggs.findIndex(e => !e);
  if (i < 0) return { erro: 'cheio' };
  const c = custoOvo(S, tipo);
  if (o.moeda === 'coins') { if (S.coins < c) return { erro: 'moedas' }; S.coins -= c; }
  else { if (S.gems < c) return { erro: 'gemas' }; S.gems -= c; }
  S.eggs[i] = { tipo, pronto: now + tempoOvo(S, tipo) * 1000 };
  return { ok: true, i };
}
function abrirOvo(S, i, now, rng) {
  const e = S.eggs[i];
  if (!e || now < e.pronto) return null;
  const r = sortearPet(e.tipo, S.pity, rng);
  S.eggs[i] = null; S.summons++; S.stats.chocados++;
  S.pity = r.r >= 3 ? 0 : S.pity + 1;
  const res = aplicarPet(S, r.pet.id);
  evento(S, 'chocar', 1); evento(S, 'melhor', 1, r.r);
  addPontos(S, 10, 'ovo'); pontoEvento(S, 3);
  if (HOOK_CHOQUE && r.r >= 2) HOOK_CHOQUE(r.pet.id);
  return { tipo: e.tipo, pet: r.pet, r: r.r, res, ups: ganharXP(S, XP_OVO[r.r] * (res.tipo === 'novo' ? 2 : 1)) };
}
function melhorarObra(S, id) {
  const o = OBRAS[id];
  if (S.nivel < o.nivel) return { erro: 'nivel', nivel: o.nivel };
  const l = S.obras[id];
  if (l >= o.max) return { erro: 'max' };
  if (S.nivel < nivelParaObra(l)) return { erro: 'cap', nivel: nivelParaObra(l) };
  const c = custoObra(id, l);
  if (S.coins < c) return { erro: 'moedas' };
  S.coins -= c; S.obras[id] = l + 1;
  evento(S, 'obra', 1);
  return { ok: true, lvl: l + 1, ups: ganharXP(S, 15 + 3 * (l + 1)) };
}
function comprarPasto(S) {
  const p = pastoProx(S);
  if (!p) return { erro: 'max' };
  if (S.nivel < p.nivel) return { erro: 'nivel', nivel: p.nivel };
  if (S.coins < p.custo) return { erro: 'moedas' };
  S.coins -= p.custo; S.slots++;
  return { ok: true, ups: ganharXP(S, 25 + 5 * S.slots) };
}
function resgatarMissao(S, i, dobro) {
  const m = S.missoes[i]; if (!m || !m.feita) return null;
  const k = dobro ? 2 : 1;
  S.coins += m.rec.coins * k; S.gems += m.rec.gems * k;
  addPontos(S, 30, 'missao');
  const ups = ganharXP(S, m.rec.xp * k);
  S.missoes[i] = novaMissao(S);
  return { rec: m.rec, k, ups };
}
function seqDiaria(S, hoje) { return S.diario.ultimo === hoje ? S.diario.seq : (S.diario.ultimo === hoje - 1 ? S.diario.seq + 1 : 1); }
function recDiario(S, seq) { const d = DIARIO[(seq - 1) % 7], base = Math.max(150, Math.round(prodTotal(S) * 600)); return { coins: d.k * base, gems: d.g }; }
function resgatarDiario(S, hoje, dobro) {
  if (S.diario.ultimo === hoje) return null;
  const seq = seqDiaria(S, hoje), r = recDiario(S, seq), k = dobro ? 2 : 1;
  S.coins += r.coins * k; S.gems += r.gems * k;
  S.diario = { ultimo: hoje, seq };
  return { r, k, seq, ups: ganharXP(S, 20) };
}


function anuncioVisto(S, tipo) { S.ads[tipo] = (S.ads[tipo] || 0) + 1; evento(S, 'anuncio', 1); }

/* ===== Cuidar dos bichos ===== */
const CUIDADO_H = 36, CARINHO_CD = 4 * HORA;
function felicidade(S, id) {
  const p = S.pets[id]; if (!p || !p.cuid) return 0;
  return Math.max(0, Math.min(1, 1 - (S.ts - p.cuid) / (CUIDADO_H * HORA)));
}
function nomeDoBicho(S, id) { return (S.pets[id] && S.pets[id].nome) || PET_POR_ID[id].nome; }
function limparNome(t) { return String(t || '').replace(/[^\p{L}\p{N} \-']/gu, '').replace(/\s+/g, ' ').trim().slice(0, 14); }
function renomear(S, id, nome) {
  if (!S.pets[id]) return { erro: 'sem' };
  const n = limparNome(nome);
  if (!n) { delete S.pets[id].nome; return { ok: true, nome: PET_POR_ID[id].nome }; }
  S.pets[id].nome = n; return { ok: true, nome: n };
}
function custoRacao(S) { return Math.max(100, Math.round(prodTotal(S) * 300)); }
function cuidar(S, id, now, tipo) {
  const p = S.pets[id]; if (!p) return { erro: 'sem' };
  if (tipo === 'racao') {
    const c = custoRacao(S); if (S.coins < c) return { erro: 'moedas', custo: c };
    S.coins -= c; p.cuid = now + 12 * HORA; p.carinho = now;
    return { ok: true, custo: c, ups: ganharXP(S, 6) };
  }
  if (p.carinho && now - p.carinho < CARINHO_CD) return { erro: 'espera', falta: CARINHO_CD - (now - p.carinho) };
  p.cuid = now; p.carinho = now;
  return { ok: true, ups: ganharXP(S, 3) };
}

/* ===== Horta ===== */
const CULTIVOS = {
  cenoura:  { nome: 'Cenoura',  em: '🥕', tempo: 120,   nivel: 4,  semente: 40 },
  milho:    { nome: 'Milho',    em: '🌽', tempo: 600,   nivel: 4,  semente: 120 },
  morango:  { nome: 'Morango',  em: '🍓', tempo: 1800,  nivel: 7,  semente: 400 },
  tomate:   { nome: 'Tomate',   em: '🍅', tempo: 3600,  nivel: 10, semente: 900 },
  abobora:  { nome: 'Abóbora',  em: '🎃', tempo: 14400, nivel: 14, semente: 3000 }
};
const HORTA_NIVEL = [4, 4, 8, 12, 16];
const parcelasHorta = n => HORTA_NIVEL.filter(l => n >= l).length;
function ajustarHorta(S) { const n = parcelasHorta(S.nivel); while (S.horta.length < n) S.horta.push(null); }
const custoSemente = (S, id) => Math.round(CULTIVOS[id].semente * (1 + 0.1 * (S.nivel - 1)));
function plantar(S, i, id, now) {
  const c = CULTIVOS[id]; if (!c) return { erro: 'tipo' };
  if (S.nivel < c.nivel) return { erro: 'nivel', nivel: c.nivel };
  if (i < 0 || i >= S.horta.length) return { erro: 'parcela' };
  if (S.horta[i]) return { erro: 'ocupada' };
  const custo = custoSemente(S, id); if (S.coins < custo) return { erro: 'moedas', custo };
  S.coins -= custo; S.horta[i] = { id, pronto: now + c.tempo * 1000 };
  return { ok: true, custo };
}
function adubar(S, i, now) {   // anúncio: corta o que falta pela metade
  const p = S.horta[i]; if (!p || now >= p.pronto) return { erro: 'nada' };
  p.pronto = now + Math.floor((p.pronto - now) / 2); return { ok: true };
}
function colherHorta(S, i, now) {
  const p = S.horta[i]; if (!p) return { erro: 'vazia' };
  if (now < p.pronto) return { erro: 'cedo', falta: p.pronto - now };
  const qtd = 2 + (S.obras.estufa >= 5 ? 1 : 0) + (S.obras.estufa >= 10 ? 1 : 0);
  S.colheita[p.id] = (S.colheita[p.id] || 0) + qtd; S.horta[i] = null;
  pontoEvento(S, 2); addPontos(S, 3, 'horta');
  return { ok: true, id: p.id, qtd, ups: ganharXP(S, 6 + 2 * CULTIVOS[p.id].nivel) };
}

/* ===== Pedidos de clientes ===== */
const CLIENTES = [['Dona Cida', '👵'], ['Seu Tonho', '👨‍🌾'], ['Mari', '👩‍🍳'], ['Padeiro Bento', '🧑‍🍳'], ['Tati', '👩‍🌾'], ['Zé do Milho', '🧓']];
const PEDIDO_NIVEL = 4;
function novoPedido(S, now, rng) {
  rng = rng || Math.random;
  const cl = CLIENTES[Math.floor(rng() * CLIENTES.length)], L = S.nivel, prod = Math.max(1, prodTotal(S));
  const disp = Object.keys(CULTIVOS).filter(id => CULTIVOS[id].nivel <= L);
  const temBicho = Object.keys(S.pets).length > 0;
  let p;
  if (temBicho && rng() < 0.3) {
    const r = Math.min(3, Math.floor(rng() * (1 + L / 8))), lv = 2 + Math.floor(rng() * 3);
    p = { t: 'bicho', r, lvl: lv, rec: { coins: Math.round(prod * 900 * (1 + r)), xp: 25 + 10 * r, gems: 1 + r }, ate: now + 24 * HORA };
  } else {
    const id = disp[Math.floor(rng() * disp.length)], qtd = 2 + Math.floor(rng() * 4);
    const c = CULTIVOS[id];
    p = { t: 'colheita', id, qtd, rec: { coins: Math.round(Math.max(60, prod * 120) * qtd * (1 + c.nivel / 6)), xp: 10 + 2 * qtd + c.nivel, gems: qtd >= 5 ? 1 : 0 }, ate: now + 12 * HORA };
  }
  p.cliente = cl[0]; p.em = cl[1]; return p;
}
function ajustarPedidos(S, now, rng) {
  if (S.nivel < PEDIDO_NIVEL) return;
  for (let i = 0; i < S.pedidos.length; i++) if (!S.pedidos[i] || now > S.pedidos[i].ate) { S.pedidos[i] = novoPedido(S, now, rng); S.pedidoCont++; }
}
function melhorBichoPara(S, p) {
  return Object.keys(S.pets).find(id => PET_POR_ID[id].r >= p.r && S.pets[id].lvl >= p.lvl) || null;
}
function podeEntregar(S, p) {
  if (!p) return false;
  return p.t === 'colheita' ? (S.colheita[p.id] || 0) >= p.qtd : !!melhorBichoPara(S, p);
}
function entregarPedido(S, i, now, dobro) {
  const p = S.pedidos[i]; if (!p) return { erro: 'vazio' };
  if (now > p.ate) return { erro: 'expirou' };
  if (!podeEntregar(S, p)) return { erro: 'falta' };
  if (p.t === 'colheita') S.colheita[p.id] -= p.qtd;
  const k = dobro ? 2 : 1;
  S.coins += p.rec.coins * k; S.gems += p.rec.gems * k;
  pontoEvento(S, 5); addPontos(S, 8, 'pedido'); evento(S, 'pedido', 1);
  const ups = ganharXP(S, p.rec.xp * k);
  S.pedidos[i] = novoPedido(S, now); S.pedidoCont++;
  S.stats.pedidos = (S.stats.pedidos || 0) + 1;
  return { ok: true, rec: p.rec, k, ups };
}

/* ===== Evento semanal ===== */
const EVENTOS = [
  { id: 'polar',    nome: 'Semana Polar',        em: '🧊', pet: 'pinguim' },
  { id: 'savana',   nome: 'Semana da Savana',    em: '🌾', pet: 'girafa' },
  { id: 'oceania',  nome: 'Semana da Oceania',   em: '🌏', pet: 'koala' },
  { id: 'mar',      nome: 'Semana do Mar',       em: '🌊', pet: 'golfinho' },
  { id: 'deserto',  nome: 'Semana do Deserto',   em: '🏜️', pet: 'camelo' },
  { id: 'cerrado',  nome: 'Semana do Cerrado',   em: '🌿', pet: 'lobo' },
  { id: 'floresta', nome: 'Semana da Floresta',  em: '🌲', pet: 'urso' },
  { id: 'selva',    nome: 'Semana da Selva',     em: '🌴', pet: 'tigre' }
];
const EVT_METAS = [20, 60, 130, 240];
const eventoDaSemana = now => EVENTOS[((semanaDe(now) % EVENTOS.length) + EVENTOS.length) % EVENTOS.length];
function evtRec(S, k) {
  const base = Math.max(200, Math.round(prodTotal(S) * 900));
  return [{ coins: base, gems: 0 }, { coins: base * 3, gems: 2 }, { coins: base * 6, gems: 4 }, { coins: 0, gems: 5, pet: true }][k];
}
function ajustarEvento(S, now) {
  const sem = semanaDe(now);
  if (!S.evt || S.evt.sem !== sem) S.evt = { sem, pts: 0, res: [0, 0, 0, 0] };
}
function pontoEvento(S, n) { if (S.evt && S.evt.sem >= 0 && S.nivel >= 3) S.evt.pts += n; }
function resgatarEvento(S, k, now) {
  ajustarEvento(S, now);
  if (S.evt.res[k]) return { erro: 'ja' };
  if (S.evt.pts < EVT_METAS[k]) return { erro: 'meta' };
  const r = evtRec(S, k); S.evt.res[k] = 1;
  S.coins += r.coins; S.gems += r.gems;
  let pet = null, res = null;
  if (r.pet) { pet = PET_POR_ID[eventoDaSemana(now).pet]; res = aplicarPet(S, pet.id); }
  return { ok: true, r, pet, res, ups: ganharXP(S, 30 + 20 * k) };
}

/* ===== Baú diário e ovo brilhante (com anúncio) ===== */
const BAU_DIA_MAX = 3;
function bauDisponivel(S, hoje) { return (S.bau.dia === hoje ? S.bau.qtd : 0) < BAU_DIA_MAX; }
function bauPrecisaAnuncio(S, hoje) { return S.bau.dia === hoje && S.bau.qtd >= 1; }   // o primeiro do dia é de graça
function abrirBau(S, hoje, rng) {
  rng = rng || Math.random;
  if (!bauDisponivel(S, hoje)) return { erro: 'limite' };
  if (S.bau.dia !== hoje) S.bau = { dia: hoje, qtd: 0 };
  S.bau.qtd++;
  const base = Math.max(200, Math.round(prodTotal(S) * 480)), k = 1 + Math.floor(rng() * 3);
  const gems = rng() < 0.35 ? 1 + Math.floor(rng() * 3) : 0;
  S.coins += base * k; S.gems += gems;
  return { ok: true, coins: base * k, gems, resta: BAU_DIA_MAX - S.bau.qtd, ups: ganharXP(S, 10) };
}
OVOS.brilhante = { nome: 'Ovo Brilhante', moeda: 'anuncio', base: 0, tempo: 30, pesos: [0, 22, 46, 27, 5], nivel: 3 };
function brilhoDisponivel(S, hoje) { return S.nivel >= OVOS.brilhante.nivel && S.brilho.dia !== hoje; }
function ganharOvoBrilho(S, hoje, now) {
  if (S.nivel < OVOS.brilhante.nivel) return { erro: 'nivel', nivel: OVOS.brilhante.nivel };
  if (!brilhoDisponivel(S, hoje)) return { erro: 'ja' };
  const i = S.eggs.findIndex(e => !e); if (i < 0) return { erro: 'cheio' };
  S.eggs[i] = { tipo: 'brilhante', pronto: now + tempoOvo(S, 'brilhante') * 1000 };
  S.brilho = { dia: hoje }; return { ok: true, i };
}

/* ===== Premium (SIMULADO neste protótipo: na loja real vira compra pelo Google Play) ===== */
const PREMIUM = {
  semAnuncios: { nome: 'Sem anúncios', desc: 'Os bônus de vídeo passam a ser dados direto, sem precisar assistir.', preco: 'R$ 14,90' },
  passe:       { nome: 'Passe da Temporada', desc: '+25% de produção, +2 gemas por dia e uma decoração exclusiva.', preco: 'R$ 9,90 / mês' }
};
function comprarPremium(S, id) { if (!PREMIUM[id]) return { erro: 'tipo' }; S.premium[id] = true; return { ok: true }; }
const temPasse = S => !!(S.premium && S.premium.passe);
const semAnuncios = S => !!(S.premium && S.premium.semAnuncios);

/* ===== Decoração ===== */
const DECORS = {
  girassol:  { nome: 'Canteiro de girassóis', em: '🌻', moedas: 300,   nivel: 2 },
  banco:     { nome: 'Banco de madeira',      em: '🪑', moedas: 1200,  nivel: 3 },
  espantalho:{ nome: 'Espantalho',            em: '🧑‍🌾', moedas: 5000, nivel: 5 },
  colmeia:   { nome: 'Colmeia',               em: '🐝', moedas: 20000, nivel: 7 },
  lago:      { nome: 'Lagoa com patos',       em: '🪷', gemas: 25,    nivel: 8 },
  balanco:   { nome: 'Balanço na árvore',     em: '🪢', gemas: 40,    nivel: 12 },
  fogueira:  { nome: 'Fogueira de festa junina', em: '🔥', gemas: 60, nivel: 16 },
  estandarte:{ nome: 'Estandarte do passe',   em: '🚩', passe: true,   nivel: 1 }
};
const bonusDecor = S => Math.min(0.08, 0.01 * Object.keys(S.decor || {}).length);
function comprarDecor(S, id) {
  const d = DECORS[id]; if (!d) return { erro: 'tipo' };
  if (S.decor[id]) return { erro: 'ja' };
  if (S.nivel < d.nivel) return { erro: 'nivel', nivel: d.nivel };
  if (d.passe) { if (!temPasse(S)) return { erro: 'passe' }; }
  else if (d.moedas) { if (S.coins < d.moedas) return { erro: 'moedas' }; S.coins -= d.moedas; }
  else { if (S.gems < d.gemas) return { erro: 'gemas' }; S.gems -= d.gemas; }
  S.decor[id] = 1; return { ok: true, ups: ganharXP(S, 20) };
}

/* ===== Estações e temas (hemisfério sul) ===== */
const TEMAS = { auto: 'Automático', primavera: 'Primavera', verao: 'Verão', outono: 'Outono', inverno: 'Inverno' };
function estacaoDe(now) {
  const m = new Date(now - TZ_OFF * 60000).getUTCMonth();   // 0 = janeiro
  return m === 11 || m <= 1 ? 'verao' : m <= 4 ? 'outono' : m <= 7 ? 'inverno' : 'primavera';
}
const temaAtual = (S, now) => (S.tema && S.tema !== 'auto' && TEMAS[S.tema]) ? S.tema : estacaoDe(now);

/* ===== Prestígio ===== */
const prestigioGemas = S => 40 + 20 * (S.prest || 0);
const NIVEL_PRESTIGIO = 25;
function podePrestigiar(S) { return S.nivel >= NIVEL_PRESTIGIO; }
function prestigiar(S, now) {
  if (!podePrestigiar(S)) return { erro: 'nivel' };
  const g = prestigioGemas(S), n = (S.prest || 0) + 1;
  const keep = { pets: S.pets, gems: S.gems + g, ads: S.ads, dev: S.dev, guilda: S.guilda, stats: S.stats, premium: S.premium, decor: S.decor, tema: S.tema, tut: S.tut, cfg: S.cfg, metr: S.metr, visto: S.visto, nome: S.nome, convUsado: S.convUsado, diario: S.diario, bau: S.bau, brilho: S.brilho, evt: S.evt, colheita: {} };
  const N = novoEstado(now);
  Object.assign(N, keep, { prest: n, criadoDia: S.criadoDia });
  for (const k of Object.keys(S)) delete S[k];
  Object.assign(S, N);
  return { ok: true, prest: n, gems: g };
}

/* ===== Pontos para a guilda semanal já existem em addPontos; rodada geral de ajustes ao carregar/avançar ===== */
function ajustarTudo(S, now, rng) { ajustarHorta(S); ajustarPedidos(S, now, rng); ajustarEvento(S, now); }
