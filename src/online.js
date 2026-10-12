/* ===== Modo online (Supabase) =====
   Entra no mesmo script do jogo (veja build.py --online). Se algo falhar, o jogo continua no modo offline
   com jogadores simulados. Depende de: criarApi (src/api.js), window.SITIO_CONFIG e window.supabase. */
const ONLINE_ID = 1000;               // marca em S.guilda.id: "estou numa guilda real"
var ON = window.ON = { ativo: false, e: null, guildas: null, rank: null, gr: null, convite: null, rkCat: 'poder', rkSrv: null, ch: null, cr: null, msg: '', tE: 0, tR: 0, tG: 0, tGR: 0, tC: 0, tCh: 0, tCr: 0, busy: false, confirmaSair: false };
let pendCorr = 0;
let prestServ = 0;
let sbCli = null, api = null, versaoSave = 0, nivelServ = 1, pend = {}, ultNivel = 0, ultSafra = 0, tPerfil = 0, tSave = 0, saveRodando = false;
const placar = s => (s.prest || 0) * 1e12 + s.nivel * 1e8 + s.safra * 1e4 + s.summons;   // quem tem mais progresso vence ao sincronizar

function pedirNome() {
  return new Promise(res => {
    ACOES.nomeok = () => {
      const v = ($('#nomeIn').value || '').trim();
      if (v.length < 2 || v.length > 24) return toast('Use de 2 a 24 letras');
      S.nome = v; salvar(); fecharModal(); res(v); if (!S.visto) boasVindas();
    };
    abrirModal(`<div class="sheet pop"><p class="eyebrow">Bem-vindo ao Sítio dos Bichos</p><h2>Como você se chama?</h2>
      <p class="muted">Esse nome aparece para a sua guilda e no ranking.</p>
      <input id="nomeIn" class="inp" maxlength="24" placeholder="Seu nome" autocomplete="nickname">
      <button class="btn primary xl" data-act="nomeok">Continuar</button></div>`);
  });
}

async function onlineIniciar() {
  const C = window.SITIO_CONFIG;
  if (!C || !C.url || !window.supabase) return;
  sbCli = window.supabase.createClient(C.url, C.key); api = criarApi(sbCli);
  if (!S.nome) await pedirNome();
  const r = await api.entrar(S.nome);
  if (!r.ok) { ON.msg = r.mensagem; setTimeout(onlineIniciar, 60000); return; }
  nivelServ = r.perfil.nivel; prestServ = r.perfil.prestigio || 0;
  const c = await api.save.carregar();
  if (c.ok) {
    versaoSave = c.versao;
    if (c.existe && c.dados && typeof c.dados === 'object' && placar(c.dados) > placar(S)) {
      try { c.dados.nome = c.dados.nome || S.nome; localStorage.setItem(KEY, JSON.stringify(c.dados)); S = carregar(); processar(avancar(S, Date.now()), true); toast('Progresso carregado da nuvem'); } catch (e) {}
    }
  }
  ultNivel = S.nivel; ultSafra = Math.floor((S.safra - 1) / 10) * 10;
  HOOK_PONTOS = (n, m) => { if (S.guilda.id >= 0) { const k = TETOS[m] ? m : 'missao'; pend[k] = (pend[k] || 0) + n; } };   // horta, pedido e afins contam como 'missao'
  HOOK_CORRIDA = n => { pendCorr += n; };
  HOOK_CHOQUE = id => { if (S.guilda.id >= 0) api.mural.postar('choque', { pet_id: id }).then(() => { ON.tE = 0; }); };
  ON.ativo = true; ON.msg = '';
  ON.metrica = n => { api.evento(n); };
  ON.sync = atualizarPerfil;
  api.evento('sessao');
  if (S.convitePend) {                       // chegou por um link de convite
    const cv = await api.convite.usar(S.convitePend);
    if (cv.ok) { S.gems += 10; S.convUsado = true; toast('Convite de ' + cv.convidante + ': +10 gemas'); }
    if (cv.ok || cv.erro !== 'rede') { S.convitePend = null; if (!cv.ok) S.convUsado = true; }
  }
  await onGuilda();
  salvarNuvem();
  render();
}

/* ---------- sincronização ---------- */
async function onGuilda() {
  const r = await api.guilda.estado();
  if (!r.ok) { ON.msg = r.mensagem; return; }
  ON.msg = ''; ON.e = r; ON.tE = Date.now();
  if (r.guilda) { S.guilda.id = ONLINE_ID; S.guilda.nivel = r.guilda.nivel; S.guilda.pontos = r.semana.meus_pontos; }
  else if (S.guilda.id >= 0) S.guilda = novoEstado(Date.now()).guilda;
}
async function onLista() {
  const r = await api.guilda.listar();
  if (r.ok) { ON.guildas = r.guildas; ON.tG = Date.now(); }
}
async function onRanking() {
  const r = await api.classificacao(ON.rkCat, ON.rkSrv, 30);
  if (r.ok) { ON.rank = r; ON.tR = Date.now(); }
}
async function enviarPontos() {
  for (const m of Object.keys(pend)) {
    let guard = 0;
    while (pend[m] > 0 && guard++ < 20) {
      const p = Math.min(pend[m], TETOS[m]);
      const r = await api.guilda.contribuir(p, m);
      if (!r.ok) { if (r.erro !== 'rede') pend[m] = 0; break; }   // limite por hora ou sem guilda: descarta
      pend[m] -= p;
    }
  }
}
async function enviarCorrida() {
  let guard = 0;
  while (pendCorr > 0 && guard++ < 20) {
    const p = Math.min(pendCorr, 60), r = await api.corrida.enviar(p);
    if (!r.ok) { if (r.erro !== 'rede') pendCorr = 0; break; }
    pendCorr -= p;
  }
}
async function postarEventos() {
  if (S.guilda.id < 0) { ultNivel = S.nivel; return; }
  if (S.nivel > ultNivel) { const n = S.nivel; ultNivel = n; if (n >= 2) await api.mural.postar('nivel', { nivel: n }); }
  const s10 = Math.floor((S.safra - 1) / 10) * 10;
  if (s10 >= 10 && s10 > ultSafra) { ultSafra = s10; await api.mural.postar('safra', { n: s10 }); }
}
const tetoPoder = (nivel, pr) => Math.floor(400 * Math.pow(1.5, nivel) * (1 + pr) + 4000 * pr);
async function atualizarPerfil() {
  let alvo = S.nivel, guard = 0;
  while (nivelServ < alvo && guard++ < 8) {
    const passo = Math.min(alvo, nivelServ + 5);
    const r = await api.perfilAtualizar({ nivel: passo, poder: Math.min(poderJogador(S), tetoPoder(passo, prestServ)), prestigio: prestServ });
    if (!r.ok) return;
    nivelServ = passo;
  }
  // o prestígio sobe de 1 em 1; o servidor só aceita depois de ter visto o nível 25
  const pr = (S.prest || 0) > prestServ && nivelServ >= NIVEL_PRESTIGIO ? prestServ + 1 : prestServ;
  const nv = Math.min(S.nivel, nivelServ + 5);
  const r = await api.perfilAtualizar({ nivel: nv, poder: Math.min(poderJogador(S), tetoPoder(nv, pr)), prestigio: pr });
  if (r.ok) { nivelServ = nv; prestServ = pr; }
  await enviarExtra();
}
/* fortuna, bichos, fantasias e aparência para as classificações (a cada 3 min ou quando mudar) */
let extraAss = '', extraT = 0;
async function enviarExtra() {
  if (!ON.ativo) return;
  ajustarAvatar(S);
  const id = bichoDestaque(S), A = S.avatar;
  const o = { moedas: Math.floor(S.stats.coletado || 0), bichos: Object.keys(S.pets).length, roupas: Object.keys(S.roupas).length, sexo: A.sexo, pele: A.pele, roupa: A.roupa.replace(/[^a-z:]/g, ''), bicho: id, est: id ? estagio(S, id) : 0 };
  const ass = [o.bichos, o.roupas, o.sexo, o.pele, o.roupa, o.bicho, o.est].join('|'), agora = Date.now();
  if (ass === extraAss && agora - extraT < 180000) return;
  const r = await api.perfilExtra(o); if (r.ok) { extraAss = ass; extraT = agora; }
}
async function salvarNuvem() {
  if (saveRodando || !ON.ativo) return; saveRodando = true;
  try {
    salvar();
    let r = await api.save.salvar(JSON.parse(JSON.stringify(S)), versaoSave);
    if (!r.ok && r.erro === 'conflito') {
      versaoSave = r.versao;
      r = await api.save.salvar(JSON.parse(JSON.stringify(S)), versaoSave);   // este aparelho está jogando agora: ele vence
    }
    if (r.ok) versaoSave = r.versao;
  } finally { saveRodando = false; }
}
async function ciclo() {
  if (!ON.ativo || document.hidden) return;
  const agora = Date.now();
  try {
    await enviarPontos();
    await enviarCorrida();
    await postarEventos();
    if (agora - tPerfil > 60000) { tPerfil = agora; await atualizarPerfil(); }
    if (agora - tSave > 45000) { tSave = agora; await salvarNuvem(); }
    if (aba === 'guilda' || aba === 'metas') await visitar(false);
  } catch (e) {}
}
async function visitar(forcar) {
  if (!ON.ativo) return;
  const agora = Date.now(); let mudou = false;
  if (aba !== 'metas' && (forcar || agora - ON.tE > 30000)) { await onGuilda(); mudou = true; }
  if (aba !== 'metas' && ON.e && !ON.e.guilda && S.nivel >= NIVEL_GUILDA && (forcar || agora - ON.tG > 30000)) { await onLista(); mudou = true; }
  if (aba === 'guilda' && subG === 'ranking' && (forcar || agora - ON.tR > 60000)) { await onRanking(); mudou = true; }
  if (aba === 'guilda' && subG === 'guildas' && (forcar || agora - ON.tGR > 60000)) { const r = await api.guildas.ranking(20); if (r.ok) { ON.gr = r; ON.tGR = Date.now(); mudou = true; } }
  if (aba === 'guilda' && subG === 'chefe' && (forcar || agora - ON.tCh > 20000)) { const r = await api.chefe.estado(); if (r.ok) { ON.ch = r; ON.tCh = Date.now(); mudou = true; } else if (r.erro === 'sem_guilda') { ON.ch = null; } }
  if (aba === 'metas' && subM === 'evento' && (forcar || agora - ON.tCr > 45000)) { const r = await api.corrida.ranking(10); if (r.ok) { ON.cr = r; ON.tCr = Date.now(); mudou = true; } }
  const campo = document.activeElement && document.activeElement.tagName === 'INPUT';
  if (mudou && (aba === 'guilda' || aba === 'metas') && !campo) render();
}
setInterval(ciclo, 8000);
document.addEventListener('visibilitychange', () => { if (document.hidden && ON.ativo) salvarNuvem(); });

/* ---------- telas ---------- */
const relSeg = s => { const m = Math.max(1, Math.round(s / 60)); return m < 60 ? 'há ' + m + ' min' : m < 1440 ? 'há ' + Math.floor(m / 60) + ' h' : 'há ' + Math.floor(m / 1440) + ' d'; };
const faixa = () => ON.msg ? `<section class="card"><p class="muted">${esc(ON.msg)}</p></section>` : '';
function viewGuildaOn() {
  const e = ON.e;
  if (!e) return faixa() + '<section class="card"><p class="muted">Carregando sua guilda…</p></section>';
  if (!e.guilda) {
    if (S.nivel < NIVEL_GUILDA) return `<section class="card"><h2>Guilda</h2><p class="muted">Junte-se a outros fazendeiros para cumprir a Grande Colheita da semana, ajudar vizinhos e ganhar bônus de produção. Libera no nível ${NIVEL_GUILDA}.</p><div class="bar"><i style="width:${Math.min(100, S.nivel / NIVEL_GUILDA * 100)}%"></i></div><p class="muted">Seu nível: ${S.nivel} de ${NIVEL_GUILDA}</p></section>`;
    const l = ON.guildas;
    return faixa() + `<section class="card"><h2>Escolha sua guilda</h2><p class="muted">Guildas de jogadores reais. Cada uma aceita até 30 membros.</p>
      ${!l ? '<p class="muted">Carregando…</p>' : l.length ? l.map(x => `<div class="card"><div class="between"><h3>${esc(x.nome)}</h3><span class="muted">${x.membros}/30 · Nv ${x.nivel}</span></div>${x.lema ? `<p class="muted">${esc(x.lema)}</p>` : ''}<button class="btn primary" data-act="gEntrar" data-arg="${esc(x.id)}" ${x.cheia ? 'disabled' : ''}>${x.cheia ? 'Cheia' : 'Entrar'}</button></div>`).join('') : '<p class="muted">Ainda não há guildas. Crie a primeira!</p>'}</section>
      <section class="card"><h2>Criar uma guilda</h2><input id="gNome" class="inp" maxlength="24" placeholder="Nome (3 a 24 letras)"><input id="gLema" class="inp" maxlength="60" placeholder="Lema (opcional)"><button class="btn primary" data-act="gCriar">Criar guilda</button></section>`;
  }
  const g = e.guilda, w = e.semana, now = Date.now();
  const pg = g.fundo_proximo ? Math.min(100, (g.fundo - g.fundo_anterior) / (g.fundo_proximo - g.fundo_anterior) * 100) : 100;
  const pw = Math.min(100, w.total / w.meta * 100), base = Math.max(200, Math.round(prodTotal(S) * 600));
  const resto = Math.max(0, w.termina_em - (now - ON.tE) / 1000), falta = Math.max(0, MIN_PONTOS_BAU - w.meus_pontos);
  const baus = BAUS.map((b, i) => {
    const st = w.baus.includes(i) ? 'ok' : w.total >= b.p * w.meta ? 'pronto' : 'trava';
    return `<button class="chest ${st}" data-act="gBau" data-arg="${i}" ${st === 'ok' ? 'disabled' : ''}>${Math.round(b.p * 100)}%<small>${st === 'ok' ? 'Resgatado' : fmt(b.k * base) + ' moedas'}</small><small>+${b.g} gemas</small></button>`;
  }).join('');
  const papel = p => p === 'lider' ? 'Líder' : p === 'vice' ? 'Vice' : 'Membro';
  const membros = e.membros.map((m, k) => `<div class="mrow ${m.voce ? 'eu' : ''}"><span class="pos">${k + 1}</span><span class="who"><b>${esc(m.nome)}</b><small>${papel(m.papel)} · Nv ${m.nivel}</small></span><span class="pts num">${fmt(m.pontos)}</span>${m.voce ? '<span></span>' : `<button class="btn mini ghost" data-act="gAjudar" data-arg="${esc(m.id)}" ${m.ajudado_hoje ? 'disabled' : ''}>${m.ajudado_hoje ? 'Ajudado' : 'Ajudar'}</button>`}</div>`).join('');
  const mural = e.mural.length ? e.mural.map(m => `<div class="evt"><p>${esc(m.texto)}<small>${relSeg(m.segundos + (now - ON.tE) / 1000)}</small></p><button class="btn mini ghost" data-act="gParab" data-arg="${m.id}" ${m.meu || m.parabenizado ? 'disabled' : ''}>${m.parabenizado ? 'Enviado' : 'Parabéns'}</button></div>`).join('') : '<p class="muted">Nada por aqui ainda. Choque um bicho raro e apareça no mural.</p>';
  return faixa() + `
    <section class="card"><div class="between"><h2>${esc(g.nome)}</h2><span class="badge on">Nível ${g.nivel}</span></div>
      <p class="muted">${g.lema ? esc(g.lema) + '. ' : ''}Bônus da guilda: <b>+${Math.round(g.bonus_prod * 100)}% de moedas</b> para todos os membros.</p>
      <div class="bar sky"><i style="width:${pg}%"></i></div>
      <p class="muted num">Fundo: ${fmt(g.fundo)}${g.fundo_proximo ? ' / ' + fmt(g.fundo_proximo) + ' para o nível ' + (g.nivel + 1) : ' (nível máximo)'}</p>
      <div class="row">${[10, 25, 50].map(p => `<button class="btn ghost" data-act="gDoar" data-arg="${p}" ${Math.floor(S.coins * p / 100) < 100 ? 'disabled' : ''}>Doar ${fmt(Math.floor(S.coins * p / 100))}</button>`).join('')}</div>
    </section>
    <section class="card"><div class="between"><h2>Grande Colheita</h2><span class="muted">Termina em ${duracao(resto)}</span></div>
      <div class="bar"><i style="width:${pw}%"></i>${BAUS.slice(0, 3).map(b => `<span class="mk" style="left:${b.p * 100}%"></span>`).join('')}</div>
      <div class="between"><span class="big num">${fmt(w.total)}</span><span class="muted num">meta ${fmt(w.meta)}</span></div>
      <div class="chests">${baus}</div>
      <p class="muted">${falta > 0 ? `Você tem ${w.meus_pontos} pontos. Faça mais ${falta} para resgatar os baús.` : `Seus pontos: ${w.meus_pontos}.`} Pontos vêm de chocar ovos, coletar, missões, ajudar vizinhos e doar. A meta zera toda segunda.</p></section>
    <section class="card"><h2>Membros</h2><p class="muted">Pontos da semana. Ajude cada vizinho uma vez por dia para ganhar moedas e pontos.</p>${membros}</section>
    <section class="card"><h2>Mural da guilda</h2>${mural}<div class="reacoes">${[['oi', '👋 Oi'], ['parabens', '👏 Parabéns'], ['bora', '💪 Bora!'], ['valeu', '🙏 Valeu'], ['uau', '😮 Uau']].map(r => `<button class="btn mini ghost" data-act="gReagir" data-arg="${r[0]}">${r[1]}</button>`).join('')}</div></section>
    <section class="card"><button class="btn ghost" data-act="gSair">${ON.confirmaSair ? 'Toque de novo para sair da guilda' : 'Sair da guilda'}</button></section>`;
}
async function carregarConvite() {
  if (!ON.ativo || Date.now() - ON.tC < 30000) return; ON.tC = Date.now();
  const r = await api.convite.codigo(); if (r.ok) { ON.convite = r; if (aba === 'ajustes') render(); }
}
function viewGuildasRankOn() {
  const r = ON.gr;
  if (!r) return faixa() + '<section class="card"><p class="muted">Carregando o ranking das guildas…</p></section>';
  const p = r.premio, premioG = p ? [30, 20, 10][p.posicao - 1] : 0;
  const linha = x => `<div class="mrow ${x.minha ? 'eu' : ''}"><span class="pos">${x.pos}</span><span class="who"><b>${esc(x.nome)}</b><small>Nv ${x.nivel} · ${x.ativos} ativos</small></span><span class="pts num">${fmt(x.pontos)}</span><span></span></div>`;
  return faixa() + `${p ? `<section class="card guia"><span class="gic">🏆</span><div class="gtx"><b>Sua guilda ficou em ${p.posicao}º lugar!</b><span>Prêmio da semana passada: ${premioG} gemas e ${fmt(Math.max(500, Math.round(prodTotal(S) * 1800)))} moedas.</span></div><button class="btn primary" data-act="gPremio">Resgatar</button></section>` : ''}
    <section class="card"><div class="between"><h2>Guilda contra guilda</h2><span class="badge on">${r.minha ? r.minha.pos + 'º lugar' : 'fora da disputa'}</span></div>
      <p class="muted">Soma dos pontos de todos os membros nesta semana. A disputa fecha no domingo à noite (termina em ${duracao(Math.max(0, r.termina_em - (Date.now() - ON.tGR) / 1000))}). O pódio ganha gemas e moedas.</p>
      <p class="muted">Para entrar na disputa a guilda precisa ter 3 ou mais membros pontuando na semana, e você precisa de 30 pontos para receber o prêmio.</p></section>
    <section class="card">${r.top.length ? r.top.map(linha).join('') : '<p class="muted">Nenhuma guilda pontuou ainda. Seja a primeira!</p>'}</section>`;
}
const CATS_RK = [['poder', 'Poder'], ['moedas', 'Fortuna'], ['bichos', 'Bichos'], ['fantasias', 'Fantasias'], ['prestigio', 'Prestígio']];
const RK_TXT = { poder: ['Ranking dos sítios', 'O poder soma produção, nível do fazendeiro, bichos descobertos e safras.'], moedas: ['Maiores fortunas', 'Total de moedas que cada fazendeiro já coletou na vida, mesmo depois de prestígios.'], bichos: ['Mais bichos', 'Quem descobriu mais bichos diferentes.'], fantasias: ['Mais fantasias', 'Quem tem mais roupas de evento, de pacote e de conquistas.'], prestigio: ['Mais prestígios', 'Quem recomeçou o sítio mais vezes.'] };
const fmtRk = (cat, v) => cat === 'fantasias' ? v + ' 👕' : cat === 'bichos' ? v + ' 🐾' : cat === 'prestigio' ? '⭐' + v : fmt(v);
function viewRankingOn() {
  const r = ON.rank;
  const segs = `<div class="seg n5">${CATS_RK.map(c => `<button class="${ON.rkCat === c[0] ? 'on' : ''}" data-act="rkCat" data-arg="${c[0]}">${c[1]}</button>`).join('')}</div>`;
  if (!r) return faixa() + `<section class="card">${segs}<p class="muted">Carregando a classificação…</p></section>`;
  const srvs = (r.servidores && r.servidores.length ? r.servidores : [{ n: r.servidor, total: 0 }]).map(x => `<button class="chipbicho ${x.n === r.servidor ? 'on' : ''}" data-act="rkSrv" data-arg="${x.n}" style="font-size:13px">Servidor ${x.n}${x.n === r.meu_servidor ? ' ★' : ''}</button>`).join('');
  const cat = r.categoria, acima = r.eu.pos && r.eu.pos > 1 ? r.top.find(x => x.pos === r.eu.pos - 1) : null;
  const linha = x => {
    const a = x.avatar || {}, pet = a.bicho && PET_POR_ID[a.bicho] ? PET_POR_ID[a.bicho].em : '', est = a.est ? '<small class="estr">' + '★'.repeat(a.est) + '</small>' : '';
    const roupa = ROUPAS[a.roupa] ? a.roupa : 'padrao', medalha = x.pos <= 3 ? ['🥇', '🥈', '🥉'][x.pos - 1] : x.pos;
    return `<div class="mrow rk ${x.voce ? 'eu' : ''}"><span class="pos">${medalha}</span><span class="rkav">${avatarSVG(a.sexo === 'f' ? 'f' : 'm', a.pele >= 0 && a.pele < 4 ? a.pele : 1, roupa, { tier: 0 })}<i>${pet}</i></span><span class="who"><b>${esc(x.nome)}</b><small>Nv ${x.nivel}${x.prestigio ? ' · ⭐' + x.prestigio : ''} ${est}</small></span><span class="pts num">${fmtRk(cat, x.valor)}</span>${x.voce ? '<span></span>' : `<button class="btn mini ghost" data-act="visitarSitio" data-arg="${esc(x.id)}">Visitar</button>`}</div>`;
  };
  return faixa() + `<section class="card">${segs}<div class="between"><h2>${RK_TXT[cat][0]}</h2><span class="badge on">${r.eu.pos ? r.eu.pos + 'º de ' + r.total : 'sem posição'}</span></div>
      <p class="muted">${RK_TXT[cat][1]}${cat === 'poder' ? ` Seu poder: <b>${fmt(poderJogador(S))}</b>${acima ? `. Faltam ${fmt(acima.valor - r.eu.valor + 1)} para passar ${esc(acima.nome)}.` : r.eu.pos === 1 ? '. Você lidera.' : '.'}` : ''} Seus números são enviados ao servidor a cada poucos minutos.</p>
      <div class="chipsbicho">${srvs}</div></section>
    <section class="card">${r.top.length ? r.top.map(linha).join('') : '<p class="muted">Ninguém nesta classificação ainda neste servidor.</p>'}</section>`;
}
function onBauPronto() {
  const e = ON.e; if (!e || !e.guilda) return false;
  const w = e.semana; return w.meus_pontos >= MIN_PONTOS_BAU && BAUS.some((b, i) => !w.baus.includes(i) && w.total >= b.p * w.meta);
}

/* ---------- ações ---------- */
async function agir(fn) {
  if (ON.busy) return; ON.busy = true;
  try { await fn(); } finally { ON.busy = false; }
  salvar(); render(); drenar();
}
const falhou = r => { toast(r.mensagem || 'Não foi possível'); return false; };
Object.assign(ACOES, {
  async rkCat(c) { ON.rkCat = c; ON.rank = null; render(); await onRanking(); render(); },
  async rkSrv(n) { ON.rkSrv = +n; ON.rank = null; render(); await onRanking(); render(); },
  gEntrar: id => agir(async () => { const r = await api.guilda.entrar(id); if (!r.ok) return falhou(r); receber(ganharXP(S, 40)); await onGuilda(); toast('Bem-vindo à guilda!'); }),
  gCriar: () => agir(async () => { const r = await api.guilda.criar($('#gNome').value, $('#gLema').value); if (!r.ok) return falhou(r); receber(ganharXP(S, 40)); await onGuilda(); toast('Guilda criada!'); }),
  gSair: () => { if (!ON.confirmaSair) { ON.confirmaSair = true; render(); setTimeout(() => { ON.confirmaSair = false; if (aba === 'guilda') render(); }, 4000); return; }
    ON.confirmaSair = false; return agir(async () => { const r = await api.guilda.sair(); if (!r.ok) return falhou(r); await onGuilda(); await onLista(); toast('Você saiu da guilda'); }); },
  gDoar: p => agir(async () => {
    const v = Math.floor(S.coins * (+p) / 100); if (v < 100) return toast('Doe pelo menos 100 moedas');
    const r = await api.guilda.doar(v); if (!r.ok) return falhou(r);
    S.coins = Math.max(0, S.coins - v); S.guilda.doado += v; receber(ganharXP(S, Math.ceil(Math.sqrt(v) / 2)));
    await onGuilda(); toast('Doou ' + fmt(v) + ' moedas ao fundo');
  }),
  gAjudar: id => agir(async () => {
    const r = await api.guilda.ajudar(id); if (!r.ok) return falhou(r);
    const coins = Math.max(30, Math.round(prodTotal(S) * 60)); S.coins += coins; receber(ganharXP(S, 5));
    await onGuilda(); toast('Você ajudou um vizinho: +' + fmt(coins) + ' moedas');
  }),
  gBau: i => agir(async () => {
    const r = await api.guilda.resgatarBau(+i); if (!r.ok) return falhou(r);
    const b = BAUS[+i], coins = b.k * Math.max(200, Math.round(prodTotal(S) * 600));
    S.coins += coins; S.gems += b.g; receber(ganharXP(S, 30 + 10 * +i));
    await onGuilda(); toast('Baú: +' + fmt(coins) + ' moedas, +' + b.g + ' gemas');
  }),
  gReagir: r => agir(async () => { const x = await api.mural.reagir(r); if (!x.ok) return falhou(x); await onGuilda(); }),
  gPremio: () => agir(async () => {
    const x = await api.guildas.premio(); if (!x.ok) return falhou(x);
    const g = [30, 20, 10][x.posicao - 1], c = Math.max(500, Math.round(prodTotal(S) * 1800));
    S.gems += g; S.coins += c; ON.tGR = 0; Som.play('bau'); Fx.confete(innerWidth / 2, innerHeight * 0.4, 90, ['#FFC21A', '#fff', '#3DBB6B']);
    toast('Prêmio da guilda: +' + g + ' gemas e +' + fmt(c) + ' moedas'); await visitar(true);
  }),
  visitarSitio: id => agir(async () => { const r = await api.visitar(id); if (!r.ok) return falhou(r); abrirVisita(r.sitio); }),
  curtirSitio: id => agir(async () => {
    const r = await api.curtir(id); if (!r.ok) return falhou(r);
    const c = Math.max(50, Math.round(prodTotal(S) * 40)); S.coins += c; Fx.glifo(innerWidth / 2, innerHeight * 0.3, '♥', 36); Som.play('pop'); toast('Curtida enviada: +' + fmt(c) + ' moedas'); fecharModal();
  }),
  convResg: () => agir(async () => {
    const r = await api.convite.resgatar(); if (!r.ok) return falhou(r);
    S.gems += r.novos * 15; Som.play('bau'); toast('Convites: +' + (r.novos * 15) + ' gemas'); ON.tC = 0; carregarConvite();
  }),
  chefeGolpeOn: () => agir(async () => {
    const r = await api.chefe.golpear(danoGolpe(S)); if (!r.ok) return falhou(r);
    ON.ch = r; ON.tCh = Date.now(); addPontos(S, 4, 'missao'); pontoEvento(S, 1); receber(ganharXP(S, 6));
    Som.play('bau'); toast('Golpe certeiro: ' + fmt(r.dano_golpe) + ' de dano');
  }),
  chefeResgOn: () => agir(async () => {
    const r = await api.chefe.resgatar(); if (!r.ok) return falhou({ mensagem: 'Ainda não há prêmio do chefe para você.' });
    const x = aplicarRecChefe(S); receber(x.ups); ON.tCh = 0; Som.play('bau'); Fx.confete(innerWidth / 2, innerHeight * 0.4, 90, ['#FFC21A', '#fff', '#3DBB6B']);
    toast('Chefe derrotado! ' + textoRec({ coins: x.rec.coins, gems: x.rec.gems, xp: 0 }) + ' · +' + x.rec.ing + ' ingressos'); await visitar(true);
  }),
  corrPremioOn: () => agir(async () => {
    const x = await api.corrida.premio(); if (!x.ok) return falhou(x);
    const g = [30, 20, 12, 8, 8, 5, 5, 5, 5, 5][x.posicao - 1] || 5, c = baseOf(S) * 10; S.gems += g; S.coins += c; ganharIng(S, x.posicao <= 3 ? 3 : 1);
    ON.tCr = 0; Som.play('bau'); Fx.confete(innerWidth / 2, innerHeight * 0.4, 90, ['#FFC21A', '#fff', '#3DBB6B']); toast('Corrida: ' + x.posicao + 'º lugar! +' + g + ' gemas e +' + fmt(c) + ' moedas'); await visitar(true);
  }),
  codigoUsarOn: () => agir(async () => {
    const v = ($('#codigoIn') || {}).value || ''; if (v.trim().length < 4) return toast('Digite o código');
    const r = await api.codigo(v); if (!r.ok) return falhou(r);
    S.gems += r.gemas; ganharIng(S, r.ingressos); Som.play('bau'); toast('Código aceito: +' + r.gemas + ' gemas' + (r.ingressos ? ' e +' + r.ingressos + ' ingressos' : '')); api.evento('codigo');
  }),
  contaApagar: () => {
    if (!ON.confirmaApagar) { ON.confirmaApagar = true; render(); setTimeout(() => { ON.confirmaApagar = false; if (aba === 'ajustes') render(); }, 5000); return; }
    return agir(async () => {
      const r = await api.conta.apagar(); if (!r.ok) return falhou(r);
      try { await sbCli.auth.signOut(); } catch (e) {}
      ON.ativo = false; try { localStorage.removeItem(KEY); } catch (e) {}
      S = novoEstado(Date.now()); toast('Conta apagada. Reiniciando…'); setTimeout(() => location.reload(), 1200);
    });
  },
  gParab: id => agir(async () => {
    const r = await api.mural.parabenizar(+id); if (!r.ok) return falhou(r);
    const coins = Math.max(20, Math.round(prodTotal(S) * 30)); S.coins += coins;
    await onGuilda(); toast('Parabéns enviado: +' + fmt(coins) + ' moedas');
  }),
});
{ const aba0 = ACOES.aba, sub0 = ACOES.subG;
  ACOES.aba = a => { aba0(a); if (a === 'guilda' || a === 'metas') visitar(true); if (a === 'ajustes') carregarConvite(); };
  ACOES.subG = x => { sub0(x); visitar(true); };
  const subM0 = ACOES.subM; ACOES.subM = x => { subM0(x); visitar(true); }; }

onlineIniciar();
