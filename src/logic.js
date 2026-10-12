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
  { id: 'tigre',    nome: 'Tigre',     em: '🐅', r: 3, ev: 1 },
  /* eventos de calendário */
  { id: 'coelhopas', nome: 'Lebre-dourada', em: '🐇', r: 3, ev: 1 }, { id: 'boi', nome: 'Boi-mansinho', em: '🐂', r: 3, ev: 1 },
  { id: 'pandavermelho', nome: 'Panda-vermelho', em: '🐼', r: 3, ev: 1 }, { id: 'morcego', nome: 'Morcego-frugívoro', em: '🦇', r: 3, ev: 1 },
  { id: 'elefanteasia', nome: 'Elefante-asiático', em: '🐘', r: 4, ev: 1 }, { id: 'oncanegra', nome: 'Onça-negra', em: '🐆', r: 3, ev: 1 }
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
const custoOvo = (S, id) => OVOS[id].moeda === 'coins' ? Math.round(OVOS[id].base * (1 + 0.2 * (S.nivel - 1)) * Math.pow(1.03, S.summons) * (1 - 0.03 * pq(S, 'ovos'))) : OVOS[id].base;
const tempoOvo = (S, id) => Math.max(5, Math.round(OVOS[id].tempo * fatorChocar(S.obras.chocadeira)));
const metaSafra = n => Math.round(120 * Math.pow(1.2, n - 1));
function recSafra(n) { return { coins: Math.round(metaSafra(n) * 0.25), xp: 8 + 2 * n, gems: n % 10 === 0 ? 15 : n % 5 === 0 ? 5 : n % 3 === 0 ? 1 : 0 }; }
function prodPet(id, lvl) { return RARIDADES[PET_POR_ID[id].r].prod * (1 + 0.3 * (lvl - 1)); }
function ativos(S) {
  return Object.keys(S.pets)
    .map(id => ({ id, lvl: S.pets[id].lvl, prod: prodPet(id, S.pets[id].lvl) * (1 + 0.15 * felicidade(S, id)) * (1 + 0.5 * (S.pets[id].est || 0)) }))
    .sort((a, b) => b.prod - a.prod)
    .slice(0, S.slots);
}
function setsCompletos(S) { return RARIDADES.map((_, r) => PETS.filter(p => p.r === r).every(p => S.pets[p.id])); }
function bonusSets(S) { const c = setsCompletos(S); return c.reduce((a, ok, r) => a + (ok ? SET_BONUS[r] : 0), 0); }
function bonusGuildaProd(S) { return S.guilda.id >= 0 ? 0.04 * (S.guilda.nivel - 1) : 0; }
function prodBase(S) { return ativos(S).reduce((a, p) => a + p.prod, 0); }
function multProd(S) { return multMoinho(S.obras.moinho) * (1 + bonusSets(S)) * (1 + bonusGuildaProd(S)) * (1 + 0.25 * (S.prest || 0)) * (1 + bonusDecor(S)) * (S.premium && S.premium.passe ? 1.25 : 1) * (1 + 0.05 * pq(S, 'prod')) * (1 + bonusCombos(S)) * (1 + bonusAreas(S)) * (1 + bonusFest(S, 'prod')); }
function prodTotal(S) { return prodBase(S) * multProd(S); }
function capCeleiro(S) { return Math.max(200, prodTotal(S) * 3600 * (horasCeleiro(S.obras.celeiro) + 0.5 * pq(S, 'silo'))); }
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
  S.xp += Math.round(n * multXP(S.obras.estufa) * (1 + 0.04 * pq(S, 'xp')) * (1 + bonusFest(S, 'xp'))); if (S.passe) S.passe.xp += Math.max(1, Math.round(n * 0.6));
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
    tut: { passo: 0, fim: false }, cfg: { eco: 'auto', som: true, vibra: true, musica: true }, metr: { sessoes: 0, dias: {}, convites: 0 },
    dev: { ecpm: 5, dau: 1000, adsDia: 6 },
    avatar: { sexo: 'm', pele: 1, roupa: 'padrao', bicho: 'auto' }, roupas: { padrao: 1 }, passe: { temp: -1, xp: 0, res: [], resP: [] }, marcos: {}, exped: [], areas: {}, torre: { andar: 0, dia: -1, tent: 0 }, cal: { id: '', ano: 0, pts: 0, res: [0, 0, 0, 0] }, correio: { dia: -1, pegou: 0, enviou: 0 }, ing: 0, oficina: [], pesq: { n: {}, at: null }, cruz: null, conq: {}, chefe: { sem: -1, dano: 0, dia: -1, hoje: 0, res: 0 }, corrida: { j: -1, pts: 0, res: [0, 0, 0, 0] }, codigos: {},
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
  S.coins += reembolso; cur.frag = (cur.frag || 0) + 1;
  return { tipo: 'max', reembolso, frag: true };
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
  addPontos(S, 30, 'missao'); ganharIng(S, k);
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
  S.diario = { ultimo: hoje, seq }; if ((seq - 1) % 7 === 6) ganharIng(S, 3 * k); if (S.passe) S.passe.xp += 25;
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
  p.cuid = now; p.carinho = now; S.stats.carinhos = (S.stats.carinhos || 0) + 1;
  return { ok: true, ups: ganharXP(S, 3) };
}

/* ===== Horta ===== */
const CULTIVOS = {   // rende: unidades por colheita; valor: quanto cada unidade vale nos pedidos (acompanha o tempo de cultivo)
  cenoura:  { nome: 'Cenoura',  em: '🥕', tempo: 120,   nivel: 4,  semente: 40,   rende: 4, valor: 1 },
  milho:    { nome: 'Milho',    em: '🌽', tempo: 600,   nivel: 4,  semente: 120,  rende: 3, valor: 3 },
  morango:  { nome: 'Morango',  em: '🍓', tempo: 1800,  nivel: 7,  semente: 400,  rende: 3, valor: 6 },
  tomate:   { nome: 'Tomate',   em: '🍅', tempo: 3600,  nivel: 10, semente: 900,  rende: 2, valor: 12 },
  abobora:  { nome: 'Abóbora',  em: '🎃', tempo: 14400, nivel: 14, semente: 3000, rende: 2, valor: 36 }
};
const rendeHorta = (S, id) => CULTIVOS[id].rende + (S.obras.estufa >= 5 ? 1 : 0) + (S.obras.estufa >= 10 ? 1 : 0) + bonusFest(S, 'horta');
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
  const qtd = rendeHorta(S, p.id);
  S.colheita[p.id] = (S.colheita[p.id] || 0) + qtd; S.horta[i] = null;
  pontoEvento(S, 2); addPontos(S, 3, 'horta'); S.stats.colhidas = (S.stats.colhidas || 0) + 1;
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
    const id = disp[Math.floor(rng() * disp.length)], c = CULTIVOS[id], qtd = (c.valor >= 12 ? 1 : 2) + Math.floor(rng() * (c.valor >= 12 ? 3 : 4));
    p = { t: 'colheita', id, qtd, rec: { coins: Math.round(Math.max(120, prod * 120) * qtd * c.valor), xp: 10 + 2 * qtd + c.nivel + Math.round(c.valor / 2), gems: qtd * c.valor >= 12 ? 1 + Math.floor(c.valor / 12) : 0 }, ate: now + 12 * HORA };
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
function pontoEvento(S, n) { if (S.evt && S.evt.sem >= 0 && S.nivel >= 3) S.evt.pts += n; pontoCorrida(S, n); pontoFestival(S, n); }
function resgatarEvento(S, k, now) {
  ajustarEvento(S, now);
  if (S.evt.res[k]) return { erro: 'ja' };
  if (S.evt.pts < EVT_METAS[k]) return { erro: 'meta' };
  const r = evtRec(S, k); S.evt.res[k] = 1;
  S.coins += r.coins; S.gems += r.gems; if (k === 2) ganharIng(S, 1); if (k === 3) ganharIng(S, 2);
  let pet = null, res = null, roupa = null;
  if (k === 3 && ganharRoupa(S, 'evt:' + eventoDaSemana(now).id)) roupa = 'evt:' + eventoDaSemana(now).id;
  if (r.pet) { pet = PET_POR_ID[eventoDaSemana(now).pet]; res = aplicarPet(S, pet.id); }
  return { ok: true, r, pet, res, roupa, ups: ganharXP(S, 30 + 20 * k) };
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
  S.coins += base * k; S.gems += gems; const ing = rng() < 0.3 ? 1 : 0; ganharIng(S, ing);
  return { ok: true, coins: base * k, gems, ing, resta: BAU_DIA_MAX - S.bau.qtd, ups: ganharXP(S, 10) };
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
  const keep = { avatar: S.avatar, roupas: S.roupas, passe: S.passe, marcos: S.marcos, areas: S.areas, torre: S.torre, cal: S.cal, correio: S.correio, pets: S.pets, gems: S.gems + g, ads: S.ads, dev: S.dev, guilda: S.guilda, stats: S.stats, premium: S.premium, decor: S.decor, tema: S.tema, tut: S.tut, cfg: S.cfg, metr: S.metr, visto: S.visto, nome: S.nome, convUsado: S.convUsado, diario: S.diario, bau: S.bau, brilho: S.brilho, evt: S.evt, colheita: {}, ing: S.ing, pesq: { n: S.pesq.n, at: null }, conq: S.conq, chefe: S.chefe, corrida: S.corrida, codigos: S.codigos };
  const N = novoEstado(now);
  Object.assign(N, keep, { prest: n, criadoDia: S.criadoDia });
  for (const k of Object.keys(S)) delete S[k];
  Object.assign(S, N); ajustarAvatar(S);
  return { ok: true, prest: n, gems: g };
}

/* ===== Pontos para a guilda semanal já existem em addPontos; rodada geral de ajustes ao carregar/avançar ===== */
function ajustarTudo(S, now, rng) { ajustarAvatar(S); ajustarNovidades(S, now); ajustarHorta(S); ajustarPedidos(S, now, rng); ajustarEvento(S, now); ajustarExtras(S, now); }

/* ===== Mecânicas de longo prazo =====
   Sorteio em lote com ingressos, oficina (fila de produção), pesquisa, combos, cruzamento, evolução,
   conquistas, chefe da guilda e corrida de 48 horas. */
const pq = (S, id) => (S.pesq && S.pesq.n && S.pesq.n[id]) || 0;
const baseOf = S => Math.max(150, Math.round(prodTotal(S) * 600));
function ganharIng(S, n) { if (n > 0) S.ing = (S.ing || 0) + n; }
function ajustarExtras(S, now) {
  if (!Array.isArray(S.oficina)) S.oficina = [];
  if (S.nivel >= OFICINA_NIVEL) while (S.oficina.length < oficinaSlots(S)) S.oficina.push(null);
  if (!S.pesq || typeof S.pesq !== 'object') S.pesq = { n: {}, at: null };
  if (!S.pesq.n) S.pesq.n = {};
  if (!S.conq) S.conq = {};
  if (!S.codigos) S.codigos = {};
  if (!S.chefe || S.chefe.sem !== semanaDe(now)) S.chefe = { sem: semanaDe(now), dano: 0, dia: -1, hoje: 0, res: 0 };
  if (!S.corrida || S.corrida.j !== janelaDe(now)) S.corrida = { j: janelaDe(now), pts: 0, res: [0, 0, 0, 0] };
  return ajustarPesquisa(S, now);
}

/* ----- sorteio em lote ----- */
const LOTE_N = 10, LOTE_GEMAS = 35, LOTE_NIVEL = 5, PESOS_LOTE = [26, 40, 24, 8.5, 1.5];
function sortearLote(S, tipo, rng) {
  rng = rng || Math.random;
  if (S.nivel < LOTE_NIVEL) return { erro: 'nivel', nivel: LOTE_NIVEL };
  if (tipo === 'gemas') { if (S.gems < LOTE_GEMAS) return { erro: 'gemas' }; S.gems -= LOTE_GEMAS; }
  else { if ((S.ing || 0) < LOTE_N) return { erro: 'ingressos' }; S.ing -= LOTE_N; }
  const lista = []; let xp = 0, melhor = 0;
  for (let i = 0; i < LOTE_N; i++) {
    let r = sortearRaridade(PESOS_LOTE, S.pity, rng);
    if (i === LOTE_N - 1 && !lista.some(x => x.r >= 2)) r = Math.max(r, 2);   // todo lote traz pelo menos um Raro
    const opc = PETS.filter(p => p.r === r), pet = opc[Math.floor(rng() * opc.length)];
    S.pity = r >= 3 ? 0 : S.pity + 1;
    const res = aplicarPet(S, pet.id);
    xp += XP_OVO[r] * (res.tipo === 'novo' ? 2 : 1); if (r > melhor) melhor = r;
    lista.push({ pet, r, res });
    if (HOOK_CHOQUE && r >= 3) HOOK_CHOQUE(pet.id);
  }
  S.summons += LOTE_N; S.stats.chocados += LOTE_N; S.stats.lotes = (S.stats.lotes || 0) + 1;
  evento(S, 'chocar', LOTE_N); evento(S, 'melhor', 1, melhor);
  addPontos(S, 10, 'ovo'); pontoEvento(S, 6);
  return { ok: true, lista, melhor, ups: ganharXP(S, xp) };
}

/* ----- oficina: fila de produção ----- */
const OFICINA_NIVEL = 6;
const RECEITAS = {
  queijo: { nome: 'Queijo',        em: '🧀', min: 5,   custo: 0.4, rende: 0.6,  nivel: 6 },
  pao:    { nome: 'Pão caseiro',   em: '🍞', min: 30,  custo: 1.5, rende: 2.7,  nivel: 8 },
  geleia: { nome: 'Geleia',        em: '🍓', min: 120, custo: 5,   rende: 10,   nivel: 12 },
  bolo:   { nome: 'Bolo de milho', em: '🌽', min: 480, custo: 16,  rende: 38,   nivel: 16 },
  /* fábricas: usam o que sai da horta e rendem bem mais */
  suco:   { nome: 'Suco de cenoura', em: '🧃', min: 15,  custo: 0.3, rende: 2.4, nivel: 6,  usa: { cenoura: 3 } },
  torta:  { nome: 'Torta de morango', em: '🥧', min: 180, custo: 3,  rende: 34,  nivel: 12, usa: { morango: 2, milho: 1 } },
  molho:  { nome: 'Molho de tomate', em: '🥫', min: 90,  custo: 2,   rende: 30,  nivel: 10, usa: { tomate: 2 } },
  doce:   { nome: 'Doce de abóbora', em: '🍮', min: 300, custo: 6,   rende: 130, nivel: 14, usa: { abobora: 2 } }
};
const oficinaSlots = S => 1 + (S.nivel >= 14 ? 1 : 0) + (S.nivel >= 20 ? 1 : 0);
const custoReceita = (S, id) => Math.round(baseOf(S) * RECEITAS[id].custo);
function iniciarReceita(S, i, id, now) {
  const r = RECEITAS[id]; if (!r) return { erro: 'tipo' };
  if (S.nivel < r.nivel) return { erro: 'nivel', nivel: r.nivel };
  if (i < 0 || i >= S.oficina.length) return { erro: 'vaga' };
  if (S.oficina[i]) return { erro: 'ocupada' };
  const c = custoReceita(S, id); if (S.coins < c) return { erro: 'moedas', custo: c };
  for (const k in (r.usa || {})) if ((S.colheita[k] || 0) < r.usa[k]) return { erro: 'ingrediente', falta: k, qtd: r.usa[k] };
  for (const k in (r.usa || {})) S.colheita[k] -= r.usa[k];
  S.coins -= c;
  S.oficina[i] = { id, fim: now + r.min * 60000, coins: Math.round(baseOf(S) * r.rende), xp: 6 + S.nivel };
  return { ok: true, custo: c };
}
function acelerarReceita(S, i, now) {
  const o = S.oficina[i]; if (!o || now >= o.fim) return { erro: 'nada' };
  o.fim = now + Math.floor((o.fim - now) / 2); return { ok: true };
}
function colherReceita(S, i, now) {
  const o = S.oficina[i]; if (!o) return { erro: 'vazia' };
  if (now < o.fim) return { erro: 'cedo' };
  S.coins += o.coins; S.oficina[i] = null; S.stats.receitas = (S.stats.receitas || 0) + 1;
  pontoEvento(S, 2); addPontos(S, 3, 'horta');
  return { ok: true, id: o.id, coins: o.coins, ups: ganharXP(S, o.xp) };
}

/* ----- pesquisa ----- */
const PESQ_NIVEL = 8;
const PESQ = {
  prod: { nome: 'Adubação do pasto', em: '🌱', max: 10, base: 500, cresc: 1.9,  ef: l => '+' + (l * 5) + '% de moedas' },
  silo: { nome: 'Silo reforçado',    em: '🌾', max: 8,  base: 700, cresc: 2.0,  ef: l => '+' + (l * 0.5).toLocaleString('pt-BR') + ' h no celeiro' },
  ovos: { nome: 'Banco de sementes', em: '🥚', max: 8,  base: 600, cresc: 1.95, ef: l => 'ovos ' + (l * 3) + '% mais baratos' },
  xp:   { nome: 'Caderno de campo',  em: '📓', max: 8,  base: 600, cresc: 1.95, ef: l => '+' + (l * 4) + '% de XP' }
};
const custoPesq = (id, l) => Math.round(PESQ[id].base * Math.pow(PESQ[id].cresc, l));
const tempoPesq = l => Math.round(10 * Math.pow(1.6, l)) * 60;   // segundos: 10 min, 16 min, 26 min… até 11 h
const nivelPesq = l => PESQ_NIVEL + l;
function iniciarPesquisa(S, id, now) {
  const p = PESQ[id]; if (!p) return { erro: 'tipo' };
  if (S.nivel < PESQ_NIVEL) return { erro: 'nivel', nivel: PESQ_NIVEL };
  if (S.pesq.at) return { erro: 'ocupada' };
  const l = pq(S, id); if (l >= p.max) return { erro: 'max' };
  if (S.nivel < nivelPesq(l)) return { erro: 'cap', nivel: nivelPesq(l) };
  const c = custoPesq(id, l); if (S.coins < c) return { erro: 'moedas', custo: c };
  S.coins -= c; S.pesq.at = { id, fim: now + tempoPesq(l) * 1000 };
  return { ok: true, custo: c };
}
function acelerarPesquisa(S, now) {
  const a = S.pesq.at; if (!a || now >= a.fim) return { erro: 'nada' };
  a.fim = now + Math.floor((a.fim - now) / 2); return { ok: true };
}
function ajustarPesquisa(S, now) {
  const a = S.pesq && S.pesq.at;
  if (!a || now < a.fim) return null;
  S.pesq.n[a.id] = (S.pesq.n[a.id] || 0) + 1; S.pesq.at = null; S.stats.pesquisas = (S.stats.pesquisas || 0) + 1;
  return a.id;
}

/* ----- combos de bichos ----- */
const COMBOS = [
  { id: 'terreiro',  nome: 'Terreiro',        em: '🐔', ids: ['pintinho', 'galinha', 'peru'],               b: 0.06 },
  { id: 'casa',      nome: 'Bichos de casa',  em: '🏠', ids: ['gato', 'cachorro', 'coelho'],                b: 0.06 },
  { id: 'pasto',     nome: 'Pasto',           em: '🌾', ids: ['ovelha', 'bezerra', 'cabrito'],              b: 0.08 },
  { id: 'lagoa',     nome: 'Lagoa',           em: '🪷', ids: ['sapo', 'patinho', 'lontra'],                 b: 0.08 },
  { id: 'mata',      nome: 'Mata',            em: '🌲', ids: ['raposa', 'esquilo', 'gamba', 'texugo'],      b: 0.12 },
  { id: 'nobres',    nome: 'Aves nobres',     em: '🪶', ids: ['cisne', 'pavao', 'flamingo', 'arara'],       b: 0.15 },
  { id: 'tropical',  nome: 'Floresta tropical', em: '🌴', ids: ['macaco', 'preguica', 'onca', 'arara'],     b: 0.12 },
  { id: 'savana',    nome: 'Savana',          em: '🦁', ids: ['zebra', 'leao', 'elefante'],                 b: 0.15 },
  { id: 'prehist',   nome: 'Pré-história',    em: '🦖', ids: ['trex', 'dino', 'mamute'],                    b: 0.20 }
];
const comboAtivo = (S, c) => c.ids.every(id => S.pets[id]);
const bonusCombos = S => COMBOS.reduce((a, c) => a + (comboAtivo(S, c) ? c.b : 0), 0);

/* ----- cruzamento ----- */
const CRUZ_NIVEL = 10, CRUZ_LV = 3, CRUZ_TEMPO = 3600;
const custoCruz = (S, a, b) => Math.round(baseOf(S) * (4 + 6 * Math.max(PET_POR_ID[a].r, PET_POR_ID[b].r)));
function podeCruzar(S, id) { return !!(S.pets[id] && S.pets[id].lvl >= CRUZ_LV); }
function iniciarCruz(S, a, b, now) {
  if (S.nivel < CRUZ_NIVEL) return { erro: 'nivel', nivel: CRUZ_NIVEL };
  if (S.cruz) return { erro: 'ocupada' };
  if (!a || !b || a === b) return { erro: 'par' };
  if (!podeCruzar(S, a) || !podeCruzar(S, b)) return { erro: 'lvl' };
  const c = custoCruz(S, a, b); if (S.coins < c) return { erro: 'moedas', custo: c };
  S.coins -= c; S.cruz = { a, b, pronto: now + CRUZ_TEMPO * 1000 };
  return { ok: true, custo: c };
}
function acelerarCruz(S, now) {
  if (!S.cruz || now >= S.cruz.pronto) return { erro: 'nada' };
  S.cruz.pronto = now + Math.floor((S.cruz.pronto - now) / 2); return { ok: true };
}
function abrirCruz(S, now, rng) {
  rng = rng || Math.random;
  const c = S.cruz; if (!c) return { erro: 'vazio' };
  if (now < c.pronto) return { erro: 'cedo' };
  const ra = PET_POR_ID[c.a].r, rb = PET_POR_ID[c.b].r;
  let r = Math.max(ra, rb); if (r < 4 && rng() < (S.nivel >= 20 ? 0.2 : 0.15)) r++;
  const pais = [c.a, c.b].filter(id => PET_POR_ID[id].r === r);
  const opc = PETS.filter(p => p.r === r);
  const pet = pais.length && rng() < 0.4 ? PET_POR_ID[pais[Math.floor(rng() * pais.length)]] : opc[Math.floor(rng() * opc.length)];
  S.cruz = null; S.stats.cruzados = (S.stats.cruzados || 0) + 1; S.summons++; S.stats.chocados++;
  const res = aplicarPet(S, pet.id);
  evento(S, 'melhor', 1, r); pontoEvento(S, 4);
  return { ok: true, pet, r, res, ups: ganharXP(S, XP_OVO[r] * (res.tipo === 'novo' ? 2 : 1)) };
}

/* ----- evolução dos bichos ----- */
const EST_NOMES = ['', 'Crescido', 'Veterano', 'Mestre'], EST_FRAG = [3, 6, 10], EST_COINS = [8, 30, 120];
const estagio = (S, id) => (S.pets[id] && S.pets[id].est) || 0;
const custoEvolucao = (S, id) => { const e = estagio(S, id); return e >= 3 ? null : { frag: EST_FRAG[e], coins: Math.round(baseOf(S) * EST_COINS[e]) }; };
function evoluir(S, id) {
  const p = S.pets[id]; if (!p) return { erro: 'sem' };
  if (p.lvl < LVL_MAX) return { erro: 'lvl' };
  const c = custoEvolucao(S, id); if (!c) return { erro: 'max' };
  if ((p.frag || 0) < c.frag) return { erro: 'frag', falta: c.frag - (p.frag || 0) };
  if (S.coins < c.coins) return { erro: 'moedas', custo: c.coins };
  S.coins -= c.coins; p.frag -= c.frag; p.est = estagio(S, id) + 1; S.stats.evolucoes = (S.stats.evolucoes || 0) + 1;
  return { ok: true, est: p.est, ups: ganharXP(S, 40 * p.est) };
}

/* ----- conquistas ----- */
const CONQS = [
  { id: 'ovos',    nome: 'Chocador',       d: n => 'Choque ' + n + ' ovos',            v: S => S.stats.chocados,                      m: [10, 50, 200, 1000] },
  { id: 'moedas',  nome: 'Mão na massa',   d: n => 'Colete ' + n.toLocaleString('pt-BR') + ' moedas', v: S => S.stats.coletado,        m: [10000, 1000000, 100000000, 10000000000] },
  { id: 'pedidos', nome: 'Bom vendedor',   d: n => 'Entregue ' + n + ' pedidos',       v: S => S.stats.pedidos || 0,                  m: [5, 25, 100, 400] },
  { id: 'safra',   nome: 'Safra farta',    d: n => 'Chegue à safra ' + n,              v: S => S.safra,                               m: [10, 30, 60, 120] },
  { id: 'album',   nome: 'Colecionador',   d: n => 'Tenha ' + n + ' bichos',           v: S => Object.keys(S.pets).length,            m: [10, 25, 40, 48] },
  { id: 'nivel',   nome: 'Fazendeiro',     d: n => 'Chegue ao nível ' + n,             v: S => S.nivel,                               m: [5, 10, 20, 30] },
  { id: 'horta',   nome: 'Mão verde',      d: n => 'Faça ' + n + ' colheitas',         v: S => S.stats.colhidas || 0,                 m: [10, 50, 200, 800] },
  { id: 'carinho', nome: 'Amigo dos bichos', d: n => 'Faça ' + n + ' carinhos',        v: S => S.stats.carinhos || 0,                 m: [10, 50, 200, 800] },
  { id: 'oficina', nome: 'Padeiro',        d: n => 'Produza ' + n + ' receitas',       v: S => S.stats.receitas || 0,                 m: [5, 25, 100, 400] },
  { id: 'cruz',    nome: 'Criador',        d: n => 'Faça ' + n + ' cruzamentos',       v: S => S.stats.cruzados || 0,                 m: [1, 5, 20, 60] },
  { id: 'pesq',    nome: 'Estudioso',      d: n => 'Conclua ' + n + ' pesquisas',      v: S => S.stats.pesquisas || 0,                m: [2, 8, 20, 36] },
  { id: 'evol',    nome: 'Treinador',      d: n => 'Evolua ' + n + ' vezes',           v: S => S.stats.evolucoes || 0,                m: [1, 4, 10, 25] }
];
const CONQ_REC = [{ gems: 3, ing: 0 }, { gems: 6, ing: 1 }, { gems: 12, ing: 2 }, { gems: 30, ing: 5 }];
function conqEstado(S, c) {
  const t = S.conq[c.id] || 0, v = c.v(S);
  return { t, v, meta: t < 4 ? c.m[t] : null, pronta: t < 4 && v >= c.m[t] };
}
const conqProntas = S => CONQS.filter(c => conqEstado(S, c).pronta).length;
function resgatarConq(S, id) {
  const c = CONQS.find(x => x.id === id); if (!c) return { erro: 'tipo' };
  const e = conqEstado(S, c); if (!e.pronta) return { erro: 'meta' };
  const r = CONQ_REC[e.t]; S.conq[id] = e.t + 1; S.gems += r.gems; ganharIng(S, r.ing);
  return { ok: true, rec: r, ups: ganharXP(S, 20 + 20 * e.t) };
}

/* ----- chefe da guilda ----- */
const CHEFES = [
  { nome: 'Nuvem de gafanhotos', em: '🦗' }, { nome: 'Tempestade de granizo', em: '⛈️' }, { nome: 'Bando de raposas ladras', em: '🦊' },
  { nome: 'Geada fora de hora', em: '🥶' }, { nome: 'Enchente do rio', em: '🌊' }, { nome: 'Praga de ratos', em: '🐀' }, { nome: 'Seca braba', em: '☀️' }
];
const CHEFE_NIVEL = 5, CHEFE_GRATIS = 3, CHEFE_MAX = 6;
const chefeDaSemana = n => CHEFES[((n % CHEFES.length) + CHEFES.length) % CHEFES.length];
const danoGolpe = S => Math.round(200 + 40 * S.nivel + Math.min(prodTotal(S) * 3, 20000));
const recChefe = S => ({ coins: baseOf(S) * 12, gems: 8, ing: 2 });
/* Modo offline: os 14 membros simulados também atacam, ao longo da semana. */
const chefeHPSim = S => Math.round(250000 * (1 + 0.1 * (S.guilda.nivel - 1)));
const danoMembroSim = (gid, i, now) => Math.floor(membroTaxa(gid, i) * horasSemana(now) * 30);
function chefeEstadoSim(S, now) {
  const g = S.guilda, ch = S.chefe, hp = chefeHPSim(S);
  let tot = ch.dano; const top = [{ nome: 'Você', dano: ch.dano, voce: true }];
  for (let i = 0; i < N_MEMBROS; i++) { const d = danoMembroSim(g.id, i, now); tot += d; top.push({ nome: membroNome(g.id, i), dano: d, voce: false }); }
  top.sort((a, b) => b.dano - a.dano);
  return { semana: semanaDe(now), hp, dano_total: tot, meu_dano: ch.dano, golpes_hoje: ch.dia === diaDe(now) ? ch.hoje : 0, golpes_max: CHEFE_MAX,
    termina_em: (168 - horasSemana(now)) * 3600, derrotado: tot >= hp, premio_resgatado: !!ch.res, top: top.slice(0, 8) };
}
function golpearChefeSim(S, now) {
  if (S.guilda.id < 0) return { erro: 'sem_guilda' };
  if (S.nivel < CHEFE_NIVEL) return { erro: 'nivel', nivel: CHEFE_NIVEL };
  const ch = S.chefe, dia = diaDe(now);
  if (ch.dia !== dia) { ch.dia = dia; ch.hoje = 0; }
  if (ch.hoje >= CHEFE_MAX) return { erro: 'limite_diario' };
  const d = danoGolpe(S); ch.hoje++; ch.dano += d; addPontos(S, 4, 'missao'); pontoEvento(S, 1);
  return { ok: true, dano: d, ups: ganharXP(S, 6) };
}
function resgatarChefeSim(S, now) {
  const e = chefeEstadoSim(S, now);
  if (!e.derrotado || e.meu_dano <= 0) return { erro: 'sem_premio' };
  if (S.chefe.res) return { erro: 'ja' };
  S.chefe.res = 1; return aplicarRecChefe(S);
}
function aplicarRecChefe(S) { const r = recChefe(S); S.coins += r.coins; S.gems += r.gems; ganharIng(S, r.ing); return { ok: true, rec: r, ups: ganharXP(S, 50) }; }
/* golpes grátis do dia que ainda sobram (os demais exigem anúncio) */
const chefeGratisRest = (S, now) => S.guilda.id >= 0 && S.nivel >= CHEFE_NIVEL ? Math.max(0, CHEFE_GRATIS - (S.chefe.dia === diaDe(now) ? S.chefe.hoje : 0)) : 0;

/* ----- corrida de 48 horas ----- */
const CORR_METAS = [40, 120, 300, 600];
const janelaDe = now => Math.floor((now - TZ_OFF * 60000) / (2 * DIA));
const corridaResta = now => ((janelaDe(now) + 1) * 2 * DIA + TZ_OFF * 60000 - now) / 1000;
let HOOK_CORRIDA = null;
function pontoCorrida(S, n) {
  if (!S.corrida || S.nivel < 3) return;
  const j = janelaDe(S.ts); if (S.corrida.j !== j) S.corrida = { j, pts: 0, res: [0, 0, 0, 0] };
  S.corrida.pts += n; if (HOOK_CORRIDA) HOOK_CORRIDA(n);
}
function recCorrida(S, k) {
  const b = baseOf(S);
  return [{ coins: b * 3, gems: 0, ing: 0 }, { coins: b * 6, gems: 2, ing: 1 }, { coins: b * 8, gems: 5, ing: 2 }, { coins: b * 12, gems: 10, ing: 3 }][k];
}
function resgatarCorrida(S, k, now) {
  ajustarExtras(S, now);
  if (S.corrida.res[k]) return { erro: 'ja' };
  if (S.corrida.pts < CORR_METAS[k]) return { erro: 'meta' };
  const r = recCorrida(S, k); S.corrida.res[k] = 1; S.coins += r.coins; S.gems += r.gems; ganharIng(S, r.ing);
  const roupa = k === 3 && ganharRoupa(S, 'corrida') ? 'corrida' : null;
  return { ok: true, rec: r, roupa, ups: ganharXP(S, 25 + 15 * k) };
}
/* adversários simulados da corrida (offline) */
function corridaSim(S, now) {
  const j = janelaDe(now), dec = ((now - TZ_OFF * 60000) - j * 2 * DIA) / HORA, l = [];
  for (let i = 0; i < 12; i++) l.push({ nome: NOMES[(i * 3 + j) % NOMES.length] + ' ' + SUFIXOS[i % 3], pts: Math.floor((1 + rnd01(i + 7, j) * 7) * dec), voce: false });
  l.push({ nome: 'Você', pts: S.corrida.pts, voce: true });
  l.sort((a, b) => b.pts - a.pts);
  return l.map((x, k) => Object.assign(x, { pos: k + 1 }));
}

/* ===== Perfil do fazendeiro: roupas e bicho companheiro =====
   Roupas vêm de quatro lugares: nível/prestígio, o prêmio final de cada evento semanal (a roupa do tema),
   o prêmio final da corrida de 48 h e pacotes da loja (SIMULADOS: viram compra do Google Play no app). */
const ROUPAS = {
  padrao:   { nome: 'Roupa do sítio',    fonte: 'base',   cam: null,      calca: '#3A4A63', chapeu: 'palha',   hc: '#e8cf84' },
  junina:   { nome: 'Festa junina',      fonte: 'nivel',  nivel: 8,  cam: '#d9453a', cam2: '#fff',    calca: '#2f5fa8', chapeu: 'palha',   hc: '#e3c46a', acess: 'remendo' },
  gala:     { nome: 'Gala do sítio',     fonte: 'nivel',  nivel: 20, cam: '#2a2f45', cam2: '#fff',    calca: '#1c2033', chapeu: 'cartola', hc: '#1c2033', acess: 'gravata' },
  lenda:    { nome: 'Manto da lenda',    fonte: 'prest',  prest: 1,  cam: '#7a2fc8', cam2: '#ffd23f', calca: '#4a1f86', chapeu: 'coroa',   hc: '#f4b31f', acess: 'capa' },
  'evt:polar':    { nome: 'Explorador polar',   fonte: 'evento', ev: 'polar',    cam: '#3a8fe0', cam2: '#fff',    calca: '#274c85', chapeu: 'gorro',   hc: '#e9f4ff', acess: 'cachecol' },
  'evt:savana':   { nome: 'Guia da savana',     fonte: 'evento', ev: 'savana',   cam: '#c9a45a', cam2: '#7a5636', calca: '#6b5a3a', chapeu: 'safari',  hc: '#d8c07a' },
  'evt:oceania':  { nome: 'Ranger da Oceania',  fonte: 'evento', ev: 'oceania',  cam: '#6f8a4a', cam2: '#e8cf84', calca: '#4a5a38', chapeu: 'akubra',  hc: '#8a6a44' },
  'evt:mar':      { nome: 'Marujo',             fonte: 'evento', ev: 'mar',      cam: '#fff',    cam2: '#2f6fd1', calca: '#2f4f8a', chapeu: 'marujo',  hc: '#fff',    acess: 'listras' },
  'evt:deserto':  { nome: 'Nômade do deserto',  fonte: 'evento', ev: 'deserto',  cam: '#e8d6a4', cam2: '#c4563b', calca: '#a88a52', chapeu: 'turbante', hc: '#c4563b' },
  'evt:cerrado':  { nome: 'Vaqueiro do cerrado', fonte: 'evento', ev: 'cerrado', cam: '#b9783a', cam2: '#7a4a1f', calca: '#3a4a63', chapeu: 'couro',   hc: '#a8733a', acess: 'lenco' },
  'evt:floresta': { nome: 'Lenhador',           fonte: 'evento', ev: 'floresta', cam: '#c8453a', cam2: '#2b1d00', calca: '#3a4a63', chapeu: 'gorro',   hc: '#2f7a4a', acess: 'xadrez' },
  'evt:selva':    { nome: 'Explorador da selva', fonte: 'evento', ev: 'selva',   cam: '#4a8a4a', cam2: '#f4b31f', calca: '#5a4a2a', chapeu: 'capacete', hc: '#e8e0c0' },
  corrida:  { nome: 'Piloto da corrida', fonte: 'corrida', cam: '#e63946', cam2: '#fff',   calca: '#1d1d2b', chapeu: 'capacete2', hc: '#e63946', acess: 'listras' },
  astro:    { nome: 'Astronauta',        fonte: 'pacote', pacote: 'aventura', cam: '#f2f4f8', cam2: '#ff7a1a', calca: '#d7dbe6', chapeu: 'astro',   hc: '#f2f4f8', acess: 'remendo' },
  pirata:   { nome: 'Pirata',            fonte: 'pacote', pacote: 'aventura', cam: '#7a2020', cam2: '#f4d97a', calca: '#2b1d00', chapeu: 'pirata',  hc: '#1c1c24' },
  realeza:  { nome: 'Realeza',           fonte: 'pacote', pacote: 'realeza',  cam: '#b3202e', cam2: '#ffd23f', calca: '#6b1520', chapeu: 'coroa',   hc: '#f4b31f', acess: 'capa' },
  dino:     { nome: 'Fantasia de dino',  fonte: 'pacote', pacote: 'realeza',  cam: '#4fa869', cam2: '#a6e6b4', calca: '#2f7a4a', chapeu: 'dino',    hc: '#4fa869' }
};
Object.assign(ROUPAS, {
  passea:  { nome: 'Fazendeiro de bronze', fonte: 'passe', passe: 10, cam: '#b9783a', cam2: '#ffd9a0', calca: '#5a3a24', chapeu: 'safari', hc: '#c98a4a' },
  passeb:  { nome: 'Fazendeiro de prata',  fonte: 'passe', passe: 20, cam: '#aeb7c4', cam2: '#fff',    calca: '#46506a', chapeu: 'cartola', hc: '#8a94a8', acess: 'gravata' },
  passec:  { nome: 'Fazendeiro de ouro',   fonte: 'passe', passe: 30, cam: '#e8b21a', cam2: '#fff3b0', calca: '#7a5a10', chapeu: 'coroa',   hc: '#f4b31f', acess: 'capa' },
  fiel:       { nome: 'Fiel ao sítio',      fonte: 'marco', marco: 30,  cam: '#2f8f6a', cam2: '#f4d97a', calca: '#274a3a', chapeu: 'couro',    hc: '#8a6a44', acess: 'lenco' },
  centenario: { nome: 'Centenário',         fonte: 'marco', marco: 100, cam: '#6a3fb0', cam2: '#ffd23f', calca: '#2a1a50', chapeu: 'turbante', hc: '#ffd23f', acess: 'capa' },
  campeao:    { nome: 'Campeão da torre',   fonte: 'torre', andar: 20,  cam: '#c8302a', cam2: '#ffd23f', calca: '#2b2b3a', chapeu: 'capacete2', hc: '#c8302a', acess: 'listras' },
  'cal:estrelas': { nome: 'Traje das Estrelas', fonte: 'cal', cam: '#2b3a8a', cam2: '#ffe27a', calca: '#1a2250', chapeu: 'cartola', hc: '#2b3a8a', acess: 'gravata' },
  'cal:ritmo':    { nome: 'Traje do Ritmo',     fonte: 'cal', cam: '#e8452a', cam2: '#ffd23f', calca: '#2a2a3a', chapeu: 'marujo',  hc: '#ffd23f', acess: 'listras' },
  'cal:dourado':  { nome: 'Traje Dourado',      fonte: 'cal', cam: '#e8c23a', cam2: '#fff', calca: '#8a6a1a', chapeu: 'coroa',   hc: '#f4b31f' },
  'cal:colheita': { nome: 'Traje da Colheita',  fonte: 'cal', cam: '#b9783a', cam2: '#e8cf84', calca: '#5a4a2a', chapeu: 'palha',   hc: '#e3c46a', acess: 'remendo' },
  'cal:alegria':  { nome: 'Traje da Alegria',   fonte: 'cal', cam: '#2fa8e0', cam2: '#ff7ab6', calca: '#2f5fa8', chapeu: 'gorro',   hc: '#ff7ab6', acess: 'xadrez' },
  'cal:noite':    { nome: 'Traje da Noite',     fonte: 'cal', cam: '#2a2f55', cam2: '#a98bff', calca: '#141a3a', chapeu: 'pirata',  hc: '#1c1c34', acess: 'capa' }
});
const PACOTES_ROUPA = {
  aventura: { nome: 'Pacote Aventureiro', desc: 'Astronauta e Pirata, com 30 gemas de bônus.', preco: 'R$ 12,90', gemas: 30 },
  realeza:  { nome: 'Pacote Realeza',     desc: 'Realeza e Fantasia de dino, com 30 gemas de bônus.', preco: 'R$ 14,90', gemas: 30 }
};
const PELES = ['#F6D5B5', '#E8B88A', '#C68B5E', '#8A5A3C'];
function ajustarAvatar(S) {
  S.avatar = Object.assign({ sexo: 'm', pele: 1, roupa: 'padrao', bicho: 'auto' }, S.avatar && typeof S.avatar === 'object' ? S.avatar : {});
  if (!S.roupas || typeof S.roupas !== 'object') S.roupas = {};
  S.roupas.padrao = 1;
  for (const id in ROUPAS) {                                            // as de nível e prestígio liberam sozinhas
    const r = ROUPAS[id];
    if (r.fonte === 'nivel' && S.nivel >= r.nivel) S.roupas[id] = 1;
    if (r.fonte === 'prest' && (S.prest || 0) >= r.prest) S.roupas[id] = 1;
  }
  if (!ROUPAS[S.avatar.roupa] || !S.roupas[S.avatar.roupa]) S.avatar.roupa = 'padrao';
}
function ganharRoupa(S, id) { ajustarAvatar(S); if (!ROUPAS[id] || S.roupas[id]) return false; S.roupas[id] = 1; return true; }
function equiparRoupa(S, id) { ajustarAvatar(S); if (!S.roupas[id]) return { erro: 'nao_tem' }; S.avatar.roupa = id; return { ok: true }; }
function mudarAvatar(S, campo, v) {
  ajustarAvatar(S);
  if (campo === 'sexo' && (v === 'm' || v === 'f')) S.avatar.sexo = v;
  else if (campo === 'pele' && v >= 0 && v < PELES.length) S.avatar.pele = +v;
  else return { erro: 'valor' };
  return { ok: true };
}
function comprarPacoteRoupa(S, id) {
  const p = PACOTES_ROUPA[id]; if (!p) return { erro: 'tipo' };
  ajustarAvatar(S);
  const itens = Object.keys(ROUPAS).filter(k => ROUPAS[k].pacote === id);
  if (itens.every(k => S.roupas[k])) return { erro: 'ja' };
  itens.forEach(k => { S.roupas[k] = 1; }); S.gems += p.gemas;
  return { ok: true, itens, gemas: p.gemas };
}
/* bicho companheiro: o que o jogador escolheu ou, no automático, o mais evoluído e mais forte */
function bichoDestaque(S) {
  ajustarAvatar(S);
  const forca = id => (S.pets[id].est || 0) * 1e6 + prodPet(id, S.pets[id].lvl) * (1 + 0.5 * (S.pets[id].est || 0)) + PET_POR_ID[id].r * 1e3;
  if (S.avatar.bicho !== 'auto' && S.pets[S.avatar.bicho]) return S.avatar.bicho;
  const ids = Object.keys(S.pets); if (!ids.length) return null;
  return ids.sort((a, b) => forca(b) - forca(a))[0];
}
function escolherCompanheiro(S, id) {
  ajustarAvatar(S);
  if (id !== 'auto' && !S.pets[id]) return { erro: 'sem' };
  S.avatar.bicho = id; return { ok: true };
}


/* ===== Novidades de longo prazo II: passe, marcos, expedições, áreas, torre, festivais, correio ===== */
const temporadaDe = now => { const d = new Date(now - TZ_OFF * 60000); return d.getUTCFullYear() * 12 + d.getUTCMonth(); };
function ajustarNovidades(S, now) {
  const t = temporadaDe(now);
  if (!S.passe || S.passe.temp !== t) S.passe = { temp: t, xp: 0, res: [], resP: [] };
  if (!S.marcos) S.marcos = {}; if (!Array.isArray(S.exped)) S.exped = []; if (!S.areas) S.areas = {};
  if (!S.torre) S.torre = { andar: 0, dia: -1, tent: 0 };
  if (!S.correio) S.correio = { dia: -1, pegou: 0, enviou: 0 };
  const hoje = diaDe(now); if (S.torre.dia !== hoje) { S.torre.dia = hoje; S.torre.tent = 0; } if (S.correio.dia !== hoje) S.correio = { dia: hoje, pegou: 0, enviou: 0 };
  const f = festivalAtivo(now);
  if (!S.cal) S.cal = { id: '', ano: 0, pts: 0, res: [0, 0, 0, 0] };
  if (f && (S.cal.id !== f.def.id || S.cal.ano !== f.ano)) S.cal = { id: f.def.id, ano: f.ano, pts: 0, res: [0, 0, 0, 0] };
}

/* ----- passe da temporada: trilha de 30 níveis; a faixa premium vem com o Passe da Temporada (assinatura) ----- */
const PASSE_N = 30, PASSE_XP = 50;
const nivelPasse = S => Math.min(PASSE_N, Math.floor((S.passe ? S.passe.xp : 0) / PASSE_XP));
const passeProx = S => nivelPasse(S) >= PASSE_N ? null : { falta: PASSE_XP - (S.passe.xp % PASSE_XP), pct: (S.passe.xp % PASSE_XP) / PASSE_XP };
function recPasse(S, i, premium) {      // i = 1..30
  const base = Math.max(200, Math.round(prodTotal(S) * 500));
  if (!premium) return { coins: Math.round(base * (0.5 + i * 0.25)), gems: i % 5 === 0 ? 4 : 0, ing: i % 3 === 0 ? 1 : 0 };
  return { coins: 0, gems: i % 2 ? 3 : 1, ing: i % 4 === 0 ? 2 : 0, roupa: i === 10 ? 'passea' : i === 20 ? 'passeb' : i === 30 ? 'passec' : null };
}
function resgatarPasse(S, i, premium, now) {
  ajustarNovidades(S, now);
  if (i < 1 || i > PASSE_N) return { erro: 'nivel' };
  if (nivelPasse(S) < i) return { erro: 'falta' };
  if (premium && !temPasse(S)) return { erro: 'premium' };
  const lista = premium ? S.passe.resP : S.passe.res; if (lista[i - 1]) return { erro: 'ja' };
  const r = recPasse(S, i, premium); lista[i - 1] = 1;
  S.coins += r.coins; S.gems += r.gems; ganharIng(S, r.ing); if (r.roupa) ganharRoupa(S, r.roupa);
  return { ok: true, r };
}
const passePendentes = S => { let n = 0; const nv = nivelPasse(S); for (let i = 1; i <= nv; i++) { if (!S.passe.res[i - 1]) n++; if (temPasse(S) && !S.passe.resP[i - 1]) n++; } return n; };

/* ----- marcos de sequência diária ----- */
const MARCOS = [
  { d: 14,  gems: 20,  ing: 3,  nome: '2 semanas seguidas' },
  { d: 30,  gems: 40,  ing: 6,  roupa: 'fiel', nome: '30 dias seguidos' },
  { d: 60,  gems: 80,  ing: 10, nome: '60 dias seguidos' },
  { d: 100, gems: 150, ing: 15, roupa: 'centenario', ovo: 'dourado', nome: '100 dias seguidos' }
];
const marcosPendentes = S => MARCOS.filter(m => S.diario.seq >= m.d && !S.marcos[m.d]);
function resgatarMarco(S, d, now) {
  const m = MARCOS.find(x => x.d === d); if (!m) return { erro: 'tipo' };
  if (S.diario.seq < d) return { erro: 'falta' }; if (S.marcos[d]) return { erro: 'ja' };
  S.marcos[d] = 1; S.gems += m.gems; ganharIng(S, m.ing); if (m.roupa) ganharRoupa(S, m.roupa);
  let ovo = false; if (m.ovo) { const i = S.eggs.findIndex(e => !e); if (i >= 0) { S.eggs[i] = { tipo: m.ovo, pronto: now }; ovo = true; } else S.gems += 60; }
  return { ok: true, m, ovo };
}

/* ----- áreas do mapa ----- */
const AREAS = {
  praia:    { nome: 'Praia',    em: '🏖️', nivel: 10, gemas: 30,  bonus: 0.04, desc: 'Areia clara e coqueiros no canto do sítio.' },
  montanha: { nome: 'Montanha', em: '⛰️', nivel: 16, gemas: 60,  bonus: 0.05, desc: 'Pedras e picos ao fundo, com trilhas novas.' },
  deserto:  { nome: 'Deserto',  em: '🏜️', nivel: 22, gemas: 100, bonus: 0.06, desc: 'Dunas, cactos e expedições longas.' }
};
const bonusAreas = S => Object.keys(S.areas || {}).reduce((a, k) => a + (AREAS[k] ? AREAS[k].bonus : 0), 0);
function comprarArea(S, id) {
  const a = AREAS[id]; if (!a) return { erro: 'tipo' }; if (S.areas[id]) return { erro: 'ja' };
  if (S.nivel < a.nivel) return { erro: 'nivel', nivel: a.nivel }; if (S.gems < a.gemas) return { erro: 'gemas' };
  S.gems -= a.gemas; S.areas[id] = 1; return { ok: true, ups: ganharXP(S, 60) };
}

/* ----- expedições ----- */
const DESTINOS = {
  floresta: { nome: 'Floresta',  em: '🌲', h: 1, nivel: 5,  req: 6,  mult: 1.0 },
  caverna:  { nome: 'Caverna',   em: '🕳️', h: 3, nivel: 9,  req: 18, mult: 1.2 },
  praia:    { nome: 'Praia',     em: '🏖️', h: 2, nivel: 10, req: 14, mult: 1.3, area: 'praia' },
  montanha: { nome: 'Montanha',  em: '⛰️', h: 5, nivel: 16, req: 30, mult: 1.5, area: 'montanha' },
  deserto:  { nome: 'Deserto',   em: '🏜️', h: 8, nivel: 22, req: 45, mult: 1.8, area: 'deserto' }
};
const expSlots = S => 1 + (S.nivel >= 12 ? 1 : 0) + (S.nivel >= 18 ? 1 : 0);
const forcaBicho = (S, id) => { const o = S.pets[id]; return o ? o.lvl + 4 * PET_POR_ID[id].r + 6 * (o.est || 0) : 0; };
const forcaExp = (S, ids) => ids.reduce((a, id) => a + forcaBicho(S, id), 0);
const chanceExp = (S, d, ids) => Math.max(0.35, Math.min(0.95, 0.35 + 0.55 * forcaExp(S, ids) / DESTINOS[d].req));
const bichosEmExp = S => new Set([].concat(...S.exped.filter(Boolean).map(e => e.ids)));
function destinoLiberado(S, d) { const x = DESTINOS[d]; return !!x && S.nivel >= x.nivel && (!x.area || !!S.areas[x.area]); }
function iniciarExp(S, i, d, ids, now, rng) {
  rng = rng || Math.random;
  if (!destinoLiberado(S, d)) return { erro: 'bloqueado' };
  if (i < 0 || i >= expSlots(S)) return { erro: 'vaga' }; if (S.exped[i]) return { erro: 'ocupada' };
  if (!ids.length || ids.length > 3 || new Set(ids).size !== ids.length) return { erro: 'bichos' };
  const fora = bichosEmExp(S); if (ids.some(id => !S.pets[id] || fora.has(id))) return { erro: 'bichos' };
  S.exped[i] = { d, ids: ids.slice(), fim: now + DESTINOS[d].h * HORA, roll: rng() };
  return { ok: true, chance: chanceExp(S, d, ids) };
}
function acelerarExp(S, i, now) { const e = S.exped[i]; if (!e || now >= e.fim) return { erro: 'nada' }; e.fim = now + Math.floor((e.fim - now) / 2); return { ok: true }; }
function colherExp(S, i, now, rng) {
  rng = rng || Math.random; const e = S.exped[i]; if (!e) return { erro: 'vazia' }; if (now < e.fim) return { erro: 'cedo' };
  const D = DESTINOS[e.d], ok = e.roll < chanceExp(S, e.d, e.ids), base = baseOf(S) * D.h * D.mult;
  const r = { ok: true, sucesso: ok, d: e.d, coins: Math.round(base * (ok ? 6 : 2)), frag: 0, fragId: null, ovo: false, ing: 0, gems: 0 };
  S.coins += r.coins;
  if (ok) {
    const id = e.ids[Math.floor(rng() * e.ids.length)]; r.frag = D.h >= 5 ? 2 : 1; r.fragId = id; S.pets[id].frag = (S.pets[id].frag || 0) + r.frag;
    if (D.h >= 3 && rng() < 0.3) { const k = S.eggs.findIndex(x => !x); if (k >= 0) { S.eggs[k] = { tipo: 'brilhante', pronto: now }; r.ovo = true; } }
    if (D.h >= 5) { r.ing = 1; ganharIng(S, 1); } if (D.h >= 8) r.gems = 3, S.gems += 3;
  }
  S.exped[i] = null; S.stats.exped = (S.stats.exped || 0) + 1; pontoEvento(S, 3); addPontos(S, 4, 'horta');
  r.ups = ganharXP(S, 10 + 6 * D.h); return r;
}

/* ----- torre de andares ----- */
const TORRE_TENT = 3;
function poderTorre(S) { return Math.round(Object.keys(S.pets).map(id => forcaBicho(S, id) * 10 * (1 + 0.1 * felicidade(S, id))).sort((a, b) => b - a).slice(0, 6).reduce((a, b) => a + b, 0) * (1 + bonusCombos(S))); }
const reqTorre = a => Math.round(70 * Math.pow(1.17, a - 1));
const chanceTorre = S => { const p = poderTorre(S), r = reqTorre(S.torre.andar + 1); return Math.max(0, Math.min(1, (p * 1.15 - r) / (p * 0.3 || 1))); };
function recTorre(S, a) { const base = Math.max(200, Math.round(prodTotal(S) * 400)); return { coins: Math.round(base * (1 + a * 0.6)), gems: a % 5 === 0 ? 5 : 0, ing: a % 10 === 0 ? 2 : 0, roupa: a === 20 ? 'campeao' : null }; }
function subirTorre(S, rng, extra) {
  rng = rng || Math.random;
  if (S.torre.tent >= TORRE_TENT + (extra ? 1 : 0)) return { erro: 'limite' };
  if (Object.keys(S.pets).length === 0) return { erro: 'sem_bichos' };
  S.torre.tent++; const a = S.torre.andar + 1, p = poderTorre(S), ok = p * (0.85 + 0.3 * rng()) >= reqTorre(a);
  if (!ok) return { ok: true, vitoria: false, andar: a };
  S.torre.andar = a; const r = recTorre(S, a); S.coins += r.coins; S.gems += r.gems; ganharIng(S, r.ing); if (r.roupa) ganharRoupa(S, r.roupa);
  pontoEvento(S, 4); return { ok: true, vitoria: true, andar: a, r, ups: ganharXP(S, 15 + a) };
}

/* ----- festivais de data (sem tema de feriado: nomes e bônus neutros, bichos e trajes exclusivos) ----- */
const FESTIVAIS = [
  { id: 'estrelas', nome: 'Festival das Estrelas', em: '🌟', de: [12, 20], ate: [1, 2],  bonus: { prod: 0.30 }, pet: 'elefanteasia',  roupa: 'cal:estrelas', traje: 'Traje das Estrelas' },
  { id: 'ritmo',    nome: 'Festival do Ritmo',     em: '🥁', de: [2, 10],  ate: [2, 21], bonus: { xp: 0.30 },   pet: 'oncanegra',      roupa: 'cal:ritmo',    traje: 'Traje do Ritmo' },
  { id: 'dourado',  nome: 'Festival Dourado',      em: '✨', de: [3, 28],  ate: [4, 10], bonus: { prod: 0.20, xp: 0.15 }, pet: 'coelhopas', roupa: 'cal:dourado', traje: 'Traje Dourado' },
  { id: 'colheita', nome: 'Festival da Colheita',  em: '🧺', de: [6, 8],   ate: [6, 30], bonus: { horta: 1, prod: 0.10 },  pet: 'boi',       roupa: 'cal:colheita', traje: 'Traje da Colheita' },
  { id: 'alegria',  nome: 'Festival da Alegria',   em: '🎈', de: [10, 5],  ate: [10, 16], bonus: { prod: 0.30 }, pet: 'pandavermelho',     roupa: 'cal:alegria',  traje: 'Traje da Alegria' },
  { id: 'noite',    nome: 'Festival da Noite',     em: '🌙', de: [10, 25], ate: [11, 3], bonus: { xp: 0.25, prod: 0.15 }, pet: 'morcego',   roupa: 'cal:noite',    traje: 'Traje da Noite' }
];
const FEST_METAS = [30, 90, 180, 320];
function festivalAtivo(now) {
  const d = new Date(now - TZ_OFF * 60000), ano = d.getUTCFullYear(), m = d.getUTCMonth() + 1, dia = d.getUTCDate(), v = m * 100 + dia;
  for (const f of FESTIVAIS) {
    const a = f.de[0] * 100 + f.de[1], b = f.ate[0] * 100 + f.ate[1];
    const dentro = a <= b ? v >= a && v <= b : v >= a || v <= b;
    if (dentro) {
      const fimAno = a > b && m <= f.ate[0] ? ano : ano, fim = Date.UTC(fimAno + (a > b && m >= f.de[0] ? 1 : 0), f.ate[0] - 1, f.ate[1] + 1) + TZ_OFF * 60000;
      return { def: f, ano: a > b && m <= f.ate[0] ? ano - 1 : ano, fim, resta: Math.max(0, fim - now) };
    }
  }
  return null;
}
const bonusFest = (S, k) => { const f = festivalAtivo(S.ts || Date.now()); return f && f.def.bonus[k] ? f.def.bonus[k] : 0; };
function pontoFestival(S, n) { const f = festivalAtivo(S.ts || Date.now()); if (f && S.cal && S.cal.id === f.def.id && S.nivel >= 3) S.cal.pts += n; }
function recFest(S, k) {
  const base = Math.max(250, Math.round(prodTotal(S) * 800));
  return [{ coins: base * 2, gems: 0 }, { coins: base * 4, gems: 5, ing: 2 }, { coins: 0, gems: 8, roupa: true }, { coins: 0, gems: 10, pet: true }][k];
}
function resgatarFestival(S, k, now) {
  ajustarNovidades(S, now); const f = festivalAtivo(now); if (!f || S.cal.id !== f.def.id) return { erro: 'sem_festival' };
  if (S.cal.res[k]) return { erro: 'ja' }; if (S.cal.pts < FEST_METAS[k]) return { erro: 'meta' };
  const r = recFest(S, k); S.cal.res[k] = 1; S.coins += r.coins; S.gems += r.gems; ganharIng(S, r.ing || 0);
  let roupa = null, pet = null, res = null;
  if (r.roupa && ganharRoupa(S, f.def.roupa)) roupa = f.def.roupa;
  if (r.pet) { pet = PET_POR_ID[f.def.pet]; res = aplicarPet(S, pet.id); }
  return { ok: true, r, roupa, pet, res, ups: ganharXP(S, 40 + 20 * k) };
}

/* ----- correio (offline: um presente por dia de um vizinho; online usa o servidor) ----- */
const CORREIO_MAX = 5;
function recPresente(S) { return { coins: Math.max(100, Math.round(prodTotal(S) * 180)), gems: 0 }; }
function pegarPresentes(S, n, now) {     // n = quantos presentes estão na caixa (o servidor informa; offline, 1)
  ajustarNovidades(S, now); const k = Math.max(0, Math.min(n, CORREIO_MAX - S.correio.pegou)); if (!k) return { erro: 'nada' };
  const r = recPresente(S); S.correio.pegou += k; S.coins += r.coins * k; if (S.passe) S.passe.xp += 5 * k;
  if (S.correio.pegou >= CORREIO_MAX) S.gems += 1;
  return { ok: true, k, coins: r.coins * k };
}
function enviarPresenteLocal(S, now) {
  ajustarNovidades(S, now); if (S.correio.enviou >= CORREIO_MAX) return { erro: 'limite' };
  S.correio.enviou++; if (S.passe) S.passe.xp += 8; return { ok: true };
}
