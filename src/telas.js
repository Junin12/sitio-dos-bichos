/* ===== Telas e sistemas novos =====
   Horta, pedidos, evento semanal, presentes do dia, decoração, cuidar dos bichos, ajustes, prestígio,
   convites, visitas, tutorial guiado, modo econômico e lembretes. Entra no mesmo script do jogo (veja build.py). */
let subO = 'obras', confirmaPrest = false;
const URL_JOGO = 'https://junin12.github.io/sitio-dos-bichos/';
const hojeN = () => diaDe(Date.now());
const trunc = (t, n) => String(t).length > n ? String(t).slice(0, n - 1) + '…' : String(t);
function metrica(n) {
  try { S.metr[n] = (S.metr[n] || 0) + 1; if (window.ON && ON.ativo && ON.metrica) ON.metrica(n); } catch (e) {}
}
const fimSemanaMs = now => (semanaDe(now) * 7 - 3 + 7) * DIA + TZ_OFF * 60000;

/* ---------- revelar bicho (evento, pedido etc.) ---------- */
function revelarPet(pet, res, topo) {
  const r = pet.r, cor = COR_RAR[r];
  const msg = res.tipo === 'novo' ? 'Novo bicho na coleção!' : res.tipo === 'nivel' ? 'Repetido: subiu para o nível ' + res.lvl : 'Nível máximo: +' + fmt(res.reembolso) + ' moedas';
  abrirModal(`<div class="sheet" style="--rc:var(--r${r})"><div class="reveal pop"><div class="rays"></div><div class="face">${pet.em}</div>${res.tipo === 'novo' ? '<span class="novo">NOVO!</span>' : ''}<p class="rlabel">${topo || RARIDADES[r].nome}</p><h2>${esc(pet.nome)}</h2><p class="muted">${msg}</p></div><button class="btn primary xl" data-act="fechar">Continuar</button></div>`);
  Som.play(['comum', 'comum', 'raro', 'epico', 'lendario'][r]); Som.vibrar([30, 30, 80]);
  Fx.brilhos(innerWidth / 2, innerHeight * 0.42, 14, cor); Fx.confete(innerWidth / 2, innerHeight * 0.42, 70, [cor, '#FFC21A', '#fff', '#FF7AB6']);
}

/* ---------- cuidar dos bichos ---------- */
function humor(f) { return f > 0.66 ? '😊' : f > 0.25 ? '🙂' : '😐'; }
function modalBicho(id) {
  const p = PET_POR_ID[id], o = S.pets[id]; if (!p || !o) return;
  const f = felicidade(S, id), agora = Date.now(), esp = o.carinho && agora - o.carinho < CARINHO_CD ? CARINHO_CD - (agora - o.carinho) : 0;
  abrirModal(`<div class="sheet" style="--rc:var(--r${p.r})"><div class="reveal"><div class="face">${p.em}</div><p class="rlabel">${RARIDADES[p.r].nome}</p><h2>${esc(nomeDoBicho(S, id))}</h2>
    <p class="muted">Nv ${o.lvl} · ${fmt1(prodPet(id, o.lvl))} moedas/s base</p></div>
    <div><div class="bar"><i style="width:${(f * 100).toFixed(0)}%"></i></div><p class="muted" style="margin-top:6px">${humor(f)} Felicidade ${Math.round(f * 100)}%: até +15% de produção enquanto estiver feliz.</p></div>
    <div class="row"><button class="btn primary" data-act="carinho" data-arg="${id}" ${esp ? 'disabled' : ''}>${esp ? 'Carinho em ' + duracao(esp / 1000) : 'Fazer carinho'}</button>
      <button class="btn ghost" data-act="racao" data-arg="${id}">Ração · ${fmt(custoRacao(S))}</button></div>
 ${blocoEvolucao(id)}
    <input id="petNome" class="inp" maxlength="14" placeholder="Dar um nome" value="${esc(o.nome || '')}" aria-label="Nome do bicho">
    <div class="row"><button class="btn ghost" data-act="renomear" data-arg="${id}">Salvar nome</button><button class="btn ghost" data-act="fechar">Fechar</button></div></div>`);
}

/* ---------- Sítio: evento e presentes do dia ---------- */
function cardEventoMini() {
  if (S.nivel < 3) return '';
  const now = Date.now(), ev = eventoDaSemana(now), pet = PET_POR_ID[ev.pet];
  const prox = EVT_METAS.findIndex((m, k) => !S.evt.res[k]);
  const pronto = EVT_METAS.some((m, k) => !S.evt.res[k] && S.evt.pts >= m);
  const alvo = prox < 0 ? EVT_METAS[3] : EVT_METAS[prox];
  return `<section class="card evtmini"><div class="between"><h3>${ev.em} ${ev.nome}</h3><span class="muted">termina em ${duracao((fimSemanaMs(now) - now) / 1000)}</span></div>
    <div class="bar"><i style="width:${Math.min(100, S.evt.pts / EVT_METAS[3] * 100)}%"></i></div>
    <div class="between"><span class="muted num">${S.evt.pts}/${EVT_METAS[3]} pontos · prêmio final: ${pet.em} ${esc(pet.nome)}</span>
    <button class="btn mini ${pronto ? 'primary' : 'ghost'}" data-act="subMetas" data-arg="evento">${pronto ? 'Resgatar' : 'Ver'}</button></div></section>`;
}
function cardPresentes() {
  const hoje = hojeN(), bau = bauDisponivel(S, hoje), br = brilhoDisponivel(S, hoje);
  if (!bau && !br && S.nivel >= OVOS.brilhante.nivel) return '';
  const bBau = !bau ? '<button class="btn ghost" disabled>Baú: volte amanhã</button>'
    : bauPrecisaAnuncio(S, hoje) ? `<button class="btn ad" data-act="bauDia">${PLAY}Baú extra (${BAU_DIA_MAX - S.bau.qtd}) <span class="tag">${semAnuncios(S) ? 'Passe' : 'Anúncio'}</span></button>`
    : '<button class="btn primary" data-act="bauDia">🎁 Baú do dia grátis</button>';
  const bBri = S.nivel < OVOS.brilhante.nivel ? '' : br ? `<button class="btn ad" data-act="brilho">${PLAY}Ovo brilhante <span class="tag">${semAnuncios(S) ? 'Passe' : 'Anúncio'}</span></button>` : '<button class="btn ghost" disabled>Ovo brilhante: amanhã</button>';
  return `<section class="card"><div class="between"><h3>Presentes do dia</h3><span class="muted">renovam todo dia</span></div><div class="row">${bBau}${bBri}</div></section>`;
}

/* ---------- Obras: Horta e Decoração ---------- */
function viewObrasTab() {
  const seg = segHTML('subO', subO, [['obras', 'Obras'], ['horta', 'Horta'], ['oficina', 'Oficina'], ['pesq', 'Pesquisa'], ['decor', 'Decor.']]);
  return seg + (subO === 'horta' ? viewHorta() : subO === 'oficina' ? viewOficina() : subO === 'pesq' ? viewPesquisa() : subO === 'decor' ? viewDecor() : viewObras());
}
function viewHorta() {
  if (S.nivel < CULTIVOS.cenoura.nivel) return `<section class="card"><h2>Horta</h2><p class="muted">Plante legumes e frutas, colha e entregue aos clientes por moedas e gemas. Libera no nível ${CULTIVOS.cenoura.nivel}.</p></section>`;
  const now = Date.now();
  const disp = Object.keys(CULTIVOS).filter(id => CULTIVOS[id].nivel <= S.nivel);
  const parcelas = S.horta.map((p, i) => {
    if (!p) return `<div class="card parcela"><div class="between"><h3>Canteiro ${i + 1}</h3><span class="muted">livre</span></div><div class="row wrap">${disp.map(id => { const c = CULTIVOS[id], custo = custoSemente(S, id); return `<button class="btn mini ghost" data-act="plantar" data-arg="${i}:${id}" ${S.coins < custo ? 'disabled' : ''}>${c.em} ${fmt(custo)}</button>`; }).join('')}</div><p class="muted">Escolha o que plantar. ${disp.map(id => CULTIVOS[id].em + ' ' + duracao(CULTIVOS[id].tempo) + ' → ' + rendeHorta(S, id) + ' un.').join(' · ')}</p></div>`;
    const c = CULTIVOS[p.id], pronto = now >= p.pronto;
    return `<div class="card parcela ${pronto ? 'pronto' : ''}"><div class="between"><h3>${c.em} ${c.nome}</h3><span class="muted num">rende ${rendeHorta(S, p.id)} · <span data-hort="${i}" data-ready="${pronto ? 1 : 0}">${pronto ? 'Pronto!' : mmss(p.pronto - now)}</span></span></div>
      <div class="bar green"><i data-hortbar="${i}" style="width:${Math.min(100, (1 - (p.pronto - now) / (c.tempo * 1000)) * 100)}%"></i></div>
      <div class="row">${pronto ? `<button class="btn primary" data-act="colher" data-arg="${i}">Colher</button>` : `<button class="btn ad" data-act="adubar" data-arg="${i}">${PLAY}Adubar <span class="tag">${semAnuncios(S) ? 'Passe' : 'Anúncio'}</span></button>`}</div></div>`;
  }).join('');
  const est = Object.keys(S.colheita).filter(id => S.colheita[id] > 0 && CULTIVOS[id]).map(id => `<span class="badge on">${CULTIVOS[id].em} ${S.colheita[id]}</span>`).join(' ') || '<span class="muted">Nada colhido ainda.</span>';
  const prox = HORTA_NIVEL.find(l => l > S.nivel);
  return `<section class="card"><div class="between"><h2>Horta</h2><span class="muted">${S.horta.length} canteiros</span></div><p class="muted">Colha e entregue aos clientes na aba Metas, em Pedidos. A Estufa rende mais por colheita.</p><div class="row wrap">${est}</div>${prox ? `<p class="muted">Próximo canteiro no nível ${prox}.</p>` : ''}</section>${parcelas}`;
}
function viewDecor() {
  const n = Object.keys(S.decor).length;
  const itens = Object.keys(DECORS).map(id => {
    const d = DECORS[id], tem = S.decor[id], trava = S.nivel < d.nivel;
    const custo = d.passe ? 'Passe da Temporada' : d.moedas ? fmt(d.moedas) + ' moedas' : d.gemas + ' gemas';
    const btn = tem ? '<button class="btn ghost" disabled>No seu sítio</button>' : trava ? `<button class="btn ghost" disabled>Nível ${d.nivel}</button>` : d.passe && !temPasse(S) ? '<button class="btn ghost" disabled>Exige o Passe</button>' : `<button class="btn primary" data-act="decorar" data-arg="${id}">Comprar · ${custo}</button>`;
    return `<div class="card egg"><div class="decem">${d.em}</div><div class="info"><h3>${esc(d.nome)}</h3>${btn}</div></div>`;
  }).join('');
  return `<section class="card"><div class="between"><h2>Decoração</h2><span class="badge on">+${Math.round(bonusDecor(S) * 100)}% moedas</span></div><p class="muted">${n} de ${Object.keys(DECORS).length} itens. Cada item deixa o sítio mais bonito e dá +1% de moedas (até +8%).</p></section>${itens}`;
}

/* ---------- Metas: Pedidos e Evento ---------- */
function viewPedidos() {
  if (S.nivel < PEDIDO_NIVEL) return `<section class="card"><h2>Pedidos</h2><p class="muted">Clientes pedem colheitas e querem conhecer seus bichos. Libera no nível ${PEDIDO_NIVEL}.</p></section>`;
  const now = Date.now();
  const est = Object.keys(S.colheita).filter(id => S.colheita[id] > 0 && CULTIVOS[id]).map(id => `<span class="badge on">${CULTIVOS[id].em} ${S.colheita[id]}</span>`).join(' ') || '<span class="muted">Sem colheita guardada. Plante na aba Obras, em Horta.</span>';
  const cards = S.pedidos.map((p, i) => {
    if (!p) return '';
    const ok = podeEntregar(S, p), falta = (p.ate - now) / 1000;
    const quer = p.t === 'colheita' ? `${CULTIVOS[p.id].em} ${p.qtd} ${CULTIVOS[p.id].nome}` : `Um bicho ${RARIDADES[p.r].nome} ou melhor, nível ${p.lvl}+`;
    const tem = p.t === 'colheita' ? `${Math.min(p.qtd, S.colheita[p.id] || 0)}/${p.qtd}` : (ok ? 'Você tem!' : 'Ainda não');
    return `<section class="card pedido ${ok ? 'pronto' : ''}"><div class="between"><h3>${p.em} ${esc(p.cliente)}</h3><span class="muted num" ${falta < 1800 ? 'style="color:var(--bad)"' : ''}>${duracao(falta)}</span></div>
      <p>${quer} <span class="muted">(${tem})</span></p><p class="muted">${textoRec(p.rec)}</p>
      <div class="row"><button class="btn primary" data-act="entregar" data-arg="${i}" ${ok ? '' : 'disabled'}>Entregar</button>
      <button class="btn ad" data-act="entregar2x" data-arg="${i}" ${ok ? '' : 'disabled'}>${PLAY}Em dobro <span class="tag">${semAnuncios(S) ? 'Passe' : 'Anúncio'}</span></button></div></section>`;
  }).join('');
  return `<section class="card"><div class="between"><h2>Pedidos</h2><span class="muted">${S.stats.pedidos || 0} entregues</span></div><p class="muted">Pedidos vencidos são trocados por outros. Pedidos de bicho não gastam o bicho.</p><div class="row wrap">${est}</div></section>${cards}`;
}
function viewEvento() {
  if (S.nivel < 3) return '<section class="card"><h2>Evento da semana</h2><p class="muted">Todo domingo à noite um tema novo e um bicho exclusivo. Libera no nível 3.</p></section>';
  const now = Date.now(), ev = eventoDaSemana(now), pet = PET_POR_ID[ev.pet], tem = !!S.pets[pet.id];
  const premios = EVT_METAS.map((m, k) => {
    const r = evtRec(S, k), feito = S.evt.res[k], pronto = !feito && S.evt.pts >= m;
    const txt = r.pet ? `${pet.em} ${esc(pet.nome)} + ${r.gems} gemas` : textoRec({ coins: r.coins, gems: r.gems, xp: 0 });
    return `<div class="evtrew ${pronto ? 'pronto' : ''} ${feito ? 'ok' : ''}"><span class="num">${m}</span><span class="muted">${txt}</span><button class="btn mini ${pronto ? 'primary' : 'ghost'}" data-act="evtResg" data-arg="${k}" ${pronto ? '' : 'disabled'}>${feito ? 'Pego' : pronto ? 'Resgatar' : 'Trava'}</button></div>`;
  }).join('');
  return `<section class="card evthead"><div class="between"><h2>${ev.em} ${ev.nome}</h2><span class="muted">termina em ${duracao((fimSemanaMs(now) - now) / 1000)}</span></div>
      <div class="evtpet ${tem ? '' : 'sombra'}">${pet.em}</div><p class="muted" style="text-align:center">Bicho exclusivo da semana: <b>${esc(pet.nome)}</b>${tem ? ' (você já tem)' : ''}</p>
      <div class="bar"><i style="width:${Math.min(100, S.evt.pts / EVT_METAS[3] * 100)}%"></i></div>
      <p class="muted num">${S.evt.pts} pontos. Ganhe pontos chocando ovos (+3), coletando, colhendo (+2) e entregando pedidos (+5).</p></section>
    <section class="card"><h3>Prêmios</h3>${premios}</section>${viewCorrida()}`;
}

/* ---------- Ajustes ---------- */
function ecoAtivo() {
  const c = S.cfg.eco;
  if (c === 'on') return true; if (c === 'off') return false;
  return !!S.cfg.ecoAuto || (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 3) || false;
}
function aplicarEco() { const v = ecoAtivo(); Cena.eco(v); Fx.eco(v); document.body.classList.toggle('eco', v); }
function viewAjustes() {
  const on = window.ON && ON.ativo, p = S.prest || 0;
  const tema = S.tema || 'auto';
  const nStat = Notif.estado();
  const notifTxt = nStat === 'app' || nStat === 'granted' ? (S.cfg.notif ? 'Lembretes ligados' : 'Ligar lembretes') : nStat === 'denied' ? 'Bloqueado no navegador' : nStat === 'nao' ? 'Não disponível aqui' : 'Ligar lembretes';
  const loja = Object.keys(PREMIUM).map(id => {
    const x = PREMIUM[id], tem = S.premium[id];
    return `<div class="card"><div class="between"><h3>${x.nome}</h3><span class="badge ${tem ? 'on' : ''}">${tem ? 'Ativo' : x.preco}</span></div><p class="muted">${x.desc}</p>${tem ? '<button class="btn ghost" data-act="premiumOff" data-arg="' + id + '">Desativar (teste)</button>' : '<button class="btn primary" data-act="premiumOn" data-arg="' + id + '">Simular compra</button>'}</div>`;
  }).join('');
  const conv = on && ON.convite ? `<p class="muted">Seu código: <b class="num">${esc(ON.convite.codigo)}</b> · ${ON.convite.ativos} amigo(s) ativo(s) de ${ON.convite.convidados}</p>` : '';
  const sit = `${S.nome ? esc(S.nome) + ' · ' : ''}${on ? 'online' : 'offline'}`;
  return `<section class="card"><h2>Ajustes</h2><p class="muted">${sit}</p>
      <div class="between ajrow"><b>Som</b><button class="btn mini ${Som.mudo ? 'ghost' : 'primary'}" data-act="som">${Som.mudo ? 'Desligado' : 'Ligado'}</button></div>
      <div class="between ajrow"><b>Vibração</b><button class="btn mini ${S.cfg.vibra ? 'primary' : 'ghost'}" data-act="cfgVibra">${S.cfg.vibra ? 'Ligada' : 'Desligada'}</button></div>
      <div><b>Modo econômico</b><p class="muted">Menos efeitos e animações em aparelhos mais simples. No automático, o jogo mede o desempenho e liga sozinho se precisar.</p>${segHTML('cfgEco', S.cfg.eco, [['auto', 'Automático'], ['on', 'Ligado'], ['off', 'Desligado']])}</div>
      <div><b>Estação do sítio</b>${segHTML('cfgTema', tema, [['auto', 'Auto'], ['primavera', 'Prim.'], ['verao', 'Verão'], ['outono', 'Outono'], ['inverno', 'Inverno']])}</div></section>
    <section class="card"><div class="between"><h2>Meu perfil</h2><button class="btn mini primary" data-act="perfil">Abrir</button></div><p class="muted">Vista seu fazendeiro com roupas de eventos e escolha o bicho que fica ao lado dele.</p></section>
    <section class="card"><h2>Lembretes</h2><p class="muted">Avisos de ovo pronto, celeiro cheio, horta e bônus diário. No app instalado pela loja eles chegam com o jogo fechado; no navegador, só enquanto o jogo estiver aberto ou em segundo plano.</p>
      <button class="btn ${S.cfg.notif ? 'ghost' : 'primary'}" data-act="notif" ${nStat === 'denied' || nStat === 'nao' ? 'disabled' : ''}>${S.cfg.notif ? 'Desligar lembretes' : notifTxt}</button></section>
    <section class="card"><h2>Convidar amigos</h2><p class="muted">Quem entra pelo seu link ganha 10 gemas, e você ganha 15 gemas por amigo que chegar ao nível 3 (até 20 amigos).</p>${conv}
      <div class="row"><button class="btn primary" data-act="convidar">Compartilhar convite</button>${on ? '<button class="btn ghost" data-act="convResg">Resgatar prêmios</button>' : ''}</div>
      ${on ? '' : '<p class="muted">Entre no modo online para ter seu código pessoal.</p>'}</section>
    ${cardCodigo()}
    <section class="card prest"><div class="between"><h2>Prestígio</h2><span class="badge ${p ? 'on' : ''}">${p ? '×' + (1 + 0.25 * p).toLocaleString('pt-BR') + ' moedas' : 'nunca feito'}</span></div>
      <p class="muted">No nível ${NIVEL_PRESTIGIO} você pode recomeçar o sítio. Você mantém todos os bichos, o álbum, a decoração e as gemas, ganha <b>${prestigioGemas(S)} gemas</b> e um bônus permanente de <b>+25% de moedas</b>. Perde o nível, as obras, as moedas e a horta.</p>
      <button class="btn ${podePrestigiar(S) ? 'primary' : 'ghost'}" data-act="prestigio" ${podePrestigiar(S) ? '' : 'disabled'}>${podePrestigiar(S) ? (confirmaPrest ? 'Toque de novo para confirmar' : 'Fazer prestígio') : 'Chegue ao nível ' + NIVEL_PRESTIGIO + ' (você: ' + S.nivel + ')'}</button></section>
    <section class="card"><h2>Loja <span class="tag" style="background:var(--yolk);color:var(--yolk-ink)">Simulação</span></h2><p class="muted">Neste protótipo, "comprar" apenas liga o benefício, sem cobrança. No app da loja entram as compras reais do Google Play.</p>${loja}</section>
    <section class="card"><h2>Mais</h2><div class="row wrap"><button class="btn ghost" data-act="aba" data-arg="dev">Painel e métricas</button><button class="btn ghost" data-act="tutorial">Rever tutorial</button></div>
      <p class="muted"><a href="${URL_JOGO}privacidade.html" target="_blank" rel="noopener">Política de privacidade</a></p>
      <button class="btn ghost" data-act="resetar">${confirmaReset ? 'Toque de novo para confirmar' : 'Zerar progresso'}</button>
      ${on ? `<button class="btn ghost" data-act="contaApagar">${ON.confirmaApagar ? 'Toque de novo: apagar conta e dados online' : 'Apagar minha conta e dados online'}</button>` : ''}</section>`;
}

/* ---------- Visitas ---------- */
function abrirVisita(s) {
  const ids = Object.keys(s.pets || {}).filter(id => PET_POR_ID[id]).sort((a, b) => PET_POR_ID[b].r - PET_POR_ID[a].r || s.pets[b].lvl - s.pets[a].lvl);
  const bichos = ids.slice(0, 24).map(id => { const p = PET_POR_ID[id], o = s.pets[id]; return `<div class="cell" style="--rc:var(--r${p.r})" title="${esc(o.nome || p.nome)}"><span class="em">${p.em}</span><span class="nm">${esc(trunc(o.nome || p.nome, 9))}</span></div>`; }).join('');
  const dec = Object.keys(s.decor || {}).filter(k => DECORS[k]).map(k => DECORS[k].em).join(' ');
  abrirModal(`<div class="sheet"><p class="eyebrow">Visita ao sítio</p><h2>${esc(s.nome)}</h2>
    <p class="muted">Nível ${s.nivel}${s.prestigio ? ' · Prestígio ' + s.prestigio : ''} · Poder ${fmt(s.poder)} · ♥ ${s.curtidas}</p>
    ${dec ? `<p style="font-size:24px">${dec}</p>` : ''}
    <div class="cgrid">${bichos || '<p class="muted">Ainda sem bichos.</p>'}</div>${ids.length > 24 ? `<p class="muted">e mais ${ids.length - 24} bichos</p>` : ''}
    <div class="row"><button class="btn primary" data-act="curtirSitio" data-arg="${esc(s.id)}" ${s.curtiu_hoje ? 'disabled' : ''}>${s.curtiu_hoje ? 'Curtido hoje' : '♥ Curtir (+moedas)'}</button><button class="btn ghost" data-act="fechar">Fechar</button></div></div>`);
}

/* ---------- Notificações (abstração) ---------- */
const Notif = (() => {
  const cap = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications;
  const web = () => 'Notification' in window;
  let timers = [];
  const estado = () => cap() ? 'app' : !web() ? 'nao' : Notification.permission;
  async function pedir() {
    try {
      if (cap()) { const r = await cap().requestPermissions(); return r.display === 'granted'; }
      if (web()) return (await Notification.requestPermission()) === 'granted';
    } catch (e) {}
    return false;
  }
  function proximaHora(h, now, diasMais) { const d = new Date(now); d.setHours(h, 0, 0, 0); if (d.getTime() <= now) d.setDate(d.getDate() + 1); if (diasMais) d.setDate(d.getDate() + diasMais); return d.getTime(); }
  function agenda(now) {
    const l = [], p = prodTotal(S), cap0 = capCeleiro(S);
    const ovo = S.eggs.filter(e => e && e.pronto > now).sort((a, b) => a.pronto - b.pronto)[0];
    if (ovo) l.push({ id: 1, ts: ovo.pronto, t: 'Seu ovo chocou!', c: 'Venha descobrir qual bicho nasceu.' });
    if (p > 0 && S.barn < cap0 - 1) l.push({ id: 2, ts: now + (cap0 - S.barn) / p * 1000, t: 'Celeiro cheio', c: 'Suas moedas estão esperando para serem coletadas.' });
    const hort = S.horta.filter(x => x && x.pronto > now).sort((a, b) => a.pronto - b.pronto)[0];
    if (hort) l.push({ id: 3, ts: hort.pronto, t: 'Hora da colheita', c: CULTIVOS[hort.id].em + ' ' + CULTIVOS[hort.id].nome + ' pronto na horta.' });
    const of = S.oficina.filter(o => o && o.fim > now).sort((a, b) => a.fim - b.fim)[0];
    if (of) l.push({ id: 6, ts: of.fim, t: 'Receita pronta', c: RECEITAS[of.id].em + ' ' + RECEITAS[of.id].nome + ' saiu da oficina.' });
    if (S.pesq.at && S.pesq.at.fim > now) l.push({ id: 7, ts: S.pesq.at.fim, t: 'Pesquisa concluída', c: PESQ[S.pesq.at.id].nome + ' está pronta.' });
    if (S.cruz && S.cruz.pronto > now) l.push({ id: 8, ts: S.cruz.pronto, t: 'Filhote nasceu', c: 'O cruzamento terminou. Venha conhecer o filhote!' });
    l.push({ id: 4, ts: proximaHora(9, now), t: 'Bônus do dia', c: 'Seu prêmio diário está esperando.' });
    const seg = fimSemanaMs(now); if (seg > now) l.push({ id: 5, ts: seg + 9 * HORA, t: 'Novo evento semanal', c: 'Tem bicho exclusivo e prêmios novos no sítio.' });
    return l.filter(n => n.ts > now + 30000);
  }
  async function mostrar(n) {
    try {
      const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) return reg.showNotification(n.t, { body: n.c, icon: 'icon-192.png', tag: 'sitio' + n.id });
      new Notification(n.t, { body: n.c });
    } catch (e) {}
  }
  function cancelar() {
    timers.forEach(clearTimeout); timers = [];
    try { if (cap()) cap().cancel({ notifications: [1, 2, 3, 4, 5, 6, 7, 8].map(id => ({ id })) }); } catch (e) {}
  }
  function agendar() {
    cancelar(); if (!S.cfg.notif) return;
    const now = Date.now(), l = agenda(now);
    try {
      if (cap()) cap().schedule({ notifications: l.map(n => ({ id: n.id, title: n.t, body: n.c, schedule: { at: new Date(n.ts) } })) });
      else if (web() && Notification.permission === 'granted') l.forEach(n => { if (n.ts - now < 6 * HORA) timers.push(setTimeout(() => mostrar(n), n.ts - now)); });
    } catch (e) {}
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) agendar(); else cancelar(); });
  return { estado, pedir, agendar, cancelar, agenda };
})();

/* ---------- Tutorial guiado ---------- */
const TUT = [
  { aba: 'sitio', sel: '#guia', txt: 'Este cartão sempre mostra o próximo passo. É só seguir o botão amarelo!', manual: true },
  { aba: 'ovos', sel: '.egg.pronto [data-act="abrir"]', txt: 'Seu primeiro ovo já está pronto. Toque em Abrir!', ok: () => S.summons >= 1 },
  { aba: 'sitio', sel: '#btnColetar', txt: 'Os bichos produzem moedas no celeiro. Toque em Coletar!', ok: () => S.stats.coletado > 0 },
  { aba: 'obras', sel: '[data-act="melhorar"][data-arg="celeiro"]', txt: 'Gaste as moedas melhorando o sítio. O celeiro guarda mais moedas.', ok: () => Object.keys(S.obras).some(k => S.obras[k] > 0) },
  { aba: 'metas', sel: '[data-act="diario"]', txt: 'Missões e bônus diários dão gemas. Pegue o bônus de hoje!', ok: () => S.diario.ultimo >= diaDe(Date.now()) }
];
const NOME_ABA = { sitio: 'Sítio', ovos: 'Ovos', obras: 'Obras', guilda: 'Guilda', metas: 'Metas' };
let tutEl = null, tutPasso = -1;
function tutGarantir() {
  if (tutEl) return tutEl;
  tutEl = document.createElement('div'); tutEl.id = 'tut'; tutEl.hidden = true;
  tutEl.innerHTML = '<div class="tutspot"></div><div class="tutbub"><p></p><div class="row"><button class="btn mini ghost" data-act="tutPular">Pular</button><button class="btn mini primary" data-act="tutProx" id="tutOk">Entendi</button></div></div>';
  document.body.appendChild(tutEl); return tutEl;
}
function ocultarTut(el) { if (!el.hidden) { el.hidden = true; el.querySelector('.tutspot').style.cssText = 'width:0;height:0'; } }
function tickTutorial() {
  const el = tutGarantir();
  if (S.tut.fim || !S.visto || !MODAL.hidden || (window.SITIO_CONFIG && !S.nome)) { ocultarTut(el); return; }
  while (S.tut.passo < TUT.length && TUT[S.tut.passo].ok && TUT[S.tut.passo].ok()) S.tut.passo++;
  if (S.tut.passo >= TUT.length) { S.tut.fim = true; S.gems += 5; salvar(); ocultarTut(el); toast('Tutorial concluído! +5 gemas'); metrica('tutorial_fim'); return; }
  const st = TUT[S.tut.passo];
  let alvo, txt = st.txt, manual = !!st.manual;
  if (aba !== st.aba) { alvo = document.querySelector('#nav [data-arg="' + st.aba + '"]'); txt = 'Toque na aba ' + NOME_ABA[st.aba] + '.'; manual = false; }
  else alvo = document.querySelector(st.sel);
  if (!alvo) { ocultarTut(el); return; }
  const r = alvo.getBoundingClientRect();
  if (r.bottom > innerHeight - 90 || r.top < 60) { if (tutPasso !== S.tut.passo + aba) { alvo.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }
  tutPasso = S.tut.passo + aba;
  const sp = el.querySelector('.tutspot'), bub = el.querySelector('.tutbub');
  sp.style.cssText = `left:${r.left - 6}px;top:${r.top - 6}px;width:${r.width + 12}px;height:${r.height + 12}px`;
  el.querySelector('p').textContent = txt;
  el.querySelector('#tutOk').hidden = !manual;
  const acima = r.top + r.height / 2 > innerHeight * 0.5;
  bub.className = 'tutbub ' + (acima ? 'cima' : 'baixo');
  bub.style.top = acima ? 'auto' : (r.bottom + 16) + 'px'; bub.style.bottom = acima ? (innerHeight - r.top + 16) + 'px' : 'auto';
  bub.style.setProperty('--ax', Math.max(24, Math.min(r.left + r.width / 2 - bub.getBoundingClientRect().left, bub.getBoundingClientRect().width - 24)) + 'px');
  el.hidden = false;
}

/* ---------- ciclo ---------- */
let ultHort = 0;
function tickTelas(now) {
  tickTutorial();
  if (aba === 'obras' && subO === 'horta') {
    let refazer = false;
    document.querySelectorAll('[data-hort]').forEach(el => {
      const p = S.horta[+el.dataset.hort]; if (!p) { refazer = true; return; }
      const pronto = now >= p.pronto;
      if ((el.dataset.ready === '1') !== pronto) refazer = true; else if (!pronto) el.textContent = mmss(p.pronto - now);
    });
    document.querySelectorAll('[data-hortbar]').forEach(el => { const p = S.horta[+el.dataset.hortbar]; if (p) el.style.width = Math.min(100, (1 - (p.pronto - now) / (CULTIVOS[p.id].tempo * 1000)) * 100) + '%'; });
    if (refazer) render();
  }
  if ((aba === 'obras' && (subO === 'oficina' || subO === 'pesq')) || aba === 'ovos') tickTempos(now);
  if (now - ultHort > 4000) {
    ultHort = now; const pesq = ajustarExtras(S, now); ajustarTudo(S, now);
    if (pesq) { salvar(); toast('Pesquisa concluída: ' + PESQ[pesq].nome + ' ' + pq(S, pesq)); Som.play('bau'); if (aba === 'obras' && subO === 'pesq') render(); }
  }
}
function corridaPronta() { return S.nivel >= 3 && CORR_METAS.some((m, k) => !S.corrida.res[k] && S.corrida.pts >= m); }
function oficinaPronta() { const now = Date.now(); return S.oficina.some(o => o && now >= o.fim); }
function cruzPronto() { return !!(S.cruz && Date.now() >= S.cruz.pronto); }
function temPendenciaMetas() {
  const now = Date.now();
  return conqProntas(S) > 0 || corridaPronta() || S.pedidos.some(p => p && podeEntregar(S, p) && now <= p.ate) || EVT_METAS.some((m, k) => !S.evt.res[k] && S.evt.pts >= m && S.nivel >= 3);
}
function hortaPronta() { const now = Date.now(); return S.horta.some(p => p && now >= p.pronto); }

/* ---------- relógios genéricos (oficina, pesquisa, cruzamento) ---------- */
const tempoTxt = ms => ms < 3600000 ? mmss(ms) : duracao(ms / 1000);
function relogio(fim, ini) {
  const now = Date.now(), pronto = now >= fim;
  return { txt: `<span data-tm="${fim}" data-ready="${pronto ? 1 : 0}">${pronto ? 'Pronto!' : tempoTxt(fim - now)}</span>`, barra: `<div class="bar green"><i data-bar="${ini}:${fim}" style="width:${Math.min(100, (now - ini) / Math.max(1, fim - ini) * 100)}%"></i></div>`, pronto };
}
function tickTempos(now) {
  let refazer = false;
  document.querySelectorAll('[data-tm]').forEach(el => {
    const fim = +el.dataset.tm, pronto = now >= fim;
    if ((el.dataset.ready === '1') !== pronto) refazer = true; else if (!pronto) el.textContent = tempoTxt(fim - now);
  });
  document.querySelectorAll('[data-bar]').forEach(el => { const [a, b] = el.dataset.bar.split(':').map(Number); el.style.width = Math.min(100, (now - a) / Math.max(1, b - a) * 100) + '%'; });
  if (refazer) render();
}
const travado = (tit, txt) => `<section class="card"><h2>${tit}</h2><p class="muted">${txt}</p></section>`;
const rotuloAd = () => semAnuncios(S) ? 'Passe' : 'Anúncio';

/* ---------- oficina ---------- */
function viewOficina() {
  if (S.nivel < OFICINA_NIVEL) return travado('Oficina', 'Queijo, pão, geleia e bolo: ponha a produção na fila, volte depois e leve o lucro. Libera no nível ' + OFICINA_NIVEL + '.');
  const now = Date.now(), base = baseOf(S), disp = Object.keys(RECEITAS).filter(id => RECEITAS[id].nivel <= S.nivel);
  const lista = Object.keys(RECEITAS).map(id => { const r = RECEITAS[id]; return `<p class="muted">${r.em} <b>${r.nome}</b>: ${duracao(r.min * 60)} · custa ${fmt(custoReceita(S, id))} · rende ${fmt(base * r.rende)}${r.nivel > S.nivel ? ' (nível ' + r.nivel + ')' : ''}</p>`; }).join('');
  const vagas = S.oficina.map((o, i) => {
    if (!o) return `<section class="card"><div class="between"><h3>Bancada ${i + 1}</h3><span class="muted">livre</span></div><div class="row wrap">${disp.map(id => `<button class="btn mini ghost" data-act="receita" data-arg="${i}:${id}" ${S.coins < custoReceita(S, id) ? 'disabled' : ''}>${RECEITAS[id].em} ${fmt(custoReceita(S, id))}</button>`).join('')}</div></section>`;
    const r = RECEITAS[o.id], t = relogio(o.fim, o.fim - r.min * 60000);
    return `<section class="card parcela ${t.pronto ? 'pronto' : ''}"><div class="between"><h3>${r.em} ${r.nome}</h3><span class="muted num">${t.txt}</span></div>${t.barra}
      <p class="muted">Rende ${fmt(o.coins)} moedas</p>
      <div class="row">${t.pronto ? `<button class="btn primary" data-act="colherRec" data-arg="${i}">Colher</button>` : `<button class="btn ad" data-act="acelRec" data-arg="${i}">${PLAY}Acelerar <span class="tag">${rotuloAd()}</span></button>`}</div></section>`;
  }).join('');
  const prox = S.nivel < 14 ? 14 : S.nivel < 20 ? 20 : 0;
  return `<section class="card"><div class="between"><h2>Oficina</h2><span class="muted">${S.oficina.length} bancada(s)</span></div><p class="muted">Gaste moedas para produzir e receba mais depois. Pode ficar com o app fechado.${prox ? ' Nova bancada no nível ' + prox + '.' : ''}</p>${lista}</section>${vagas}`;
}

/* ---------- pesquisa ---------- */
function viewPesquisa() {
  if (S.nivel < PESQ_NIVEL) return travado('Pesquisa', 'Estude melhorias permanentes para o sítio: mais moedas, celeiro maior, ovos mais baratos e mais XP. Libera no nível ' + PESQ_NIVEL + '.');
  const at = S.pesq.at;
  const ativa = at ? (() => { const t = relogio(at.fim, at.fim - tempoPesq(pq(S, at.id)) * 1000); return `<section class="card parcela ${t.pronto ? 'pronto' : ''}"><div class="between"><h3>${PESQ[at.id].em} Pesquisando: ${PESQ[at.id].nome}</h3><span class="muted num">${t.txt}</span></div>${t.barra}<div class="row"><button class="btn ad" data-act="acelPesq">${PLAY}Acelerar <span class="tag">${rotuloAd()}</span></button></div></section>`; })() : '';
  const itens = Object.keys(PESQ).map(id => {
    const p = PESQ[id], l = pq(S, id), cheio = l >= p.max, cap = !cheio && S.nivel < nivelPesq(l), c = cheio ? 0 : custoPesq(id, l);
    const btn = cheio ? '<button class="btn ghost" disabled>Máximo</button>' : cap ? `<button class="btn ghost" disabled>Fazendeiro nível ${nivelPesq(l)}</button>` : `<button class="btn primary" data-act="pesquisar" data-arg="${id}" ${at || S.coins < c ? 'disabled' : ''}>Pesquisar · ${fmt(c)} · ${duracao(tempoPesq(l))}</button>`;
    return `<section class="card"><div class="between"><h3>${p.em} ${p.nome}</h3><span class="muted num">Nv ${l}/${p.max}</span></div><p class="muted">Agora: ${l ? p.ef(l) : 'sem bônus'}${cheio ? '' : '<br>Próximo: ' + p.ef(l + 1)}</p>${btn}</section>`;
  }).join('');
  return `<section class="card"><h2>Pesquisa</h2><p class="muted">Uma pesquisa por vez, com tempo real. Os bônus são permanentes e sobrevivem ao prestígio.</p></section>${ativa}${itens}`;
}

/* ---------- ovos: sorteio em lote e cruzamento ---------- */
function cardLote() {
  if (S.nivel < LOTE_NIVEL) return '';
  const ing = S.ing || 0;
  return `<section class="card"><div class="between"><h2>Sorteio em lote</h2><span class="badge on">🎟️ ${ing}</span></div>
    <p class="muted">${LOTE_N} bichos de uma vez, com pelo menos um Raro garantido. Ingressos vêm de missões, do bônus do 7º dia, de baús, de conquistas e de eventos.</p>
    <div class="chips">${chancesChips(PESOS_LOTE)}</div>
    <div class="row" style="margin-top:8px"><button class="btn primary" data-act="lote" data-arg="ingresso" ${ing < LOTE_N ? 'disabled' : ''}>Usar ${LOTE_N} ingressos</button>
      <button class="btn ghost" data-act="lote" data-arg="gemas" ${S.gems < LOTE_GEMAS ? 'disabled' : ''}>${LOTE_GEMAS} gemas</button></div></section>`;
}
function cardCruz() {
  if (S.nivel < CRUZ_NIVEL) return travado('Cruzamento', 'Dois bichos geram um filhote, com chance de raridade maior. Libera no nível ' + CRUZ_NIVEL + '.');
  if (S.cruz) {
    const a = PET_POR_ID[S.cruz.a], b = PET_POR_ID[S.cruz.b], t = relogio(S.cruz.pronto, S.cruz.pronto - CRUZ_TEMPO * 1000);
    return `<section class="card parcela ${t.pronto ? 'pronto' : ''}"><div class="between"><h2>Cruzamento</h2><span class="muted num">${t.txt}</span></div>
      <p style="font-size:30px;text-align:center">${a.em} + ${b.em} = 🥚</p>${t.barra}
      <div class="row">${t.pronto ? '<button class="btn primary" data-act="cruzAbrir">Ver o filhote</button>' : `<button class="btn ad" data-act="cruzAcel">${PLAY}Acelerar <span class="tag">${rotuloAd()}</span></button>`}</div></section>`;
  }
  const el = Object.keys(S.pets).filter(id => podeCruzar(S, id)).sort((x, y) => PET_POR_ID[y].r - PET_POR_ID[x].r || S.pets[y].lvl - S.pets[x].lvl);
  const opt = el.map(id => `<option value="${id}">${PET_POR_ID[id].em} ${esc(nomeDoBicho(S, id))} (Nv ${S.pets[id].lvl})</option>`).join('');
  const custo = [0, 4].map(r => fmt(baseOf(S) * (4 + 6 * r)));
  return `<section class="card"><h2>Cruzamento</h2><p class="muted">Escolha dois bichos de nível ${CRUZ_LV} ou mais. Em 1 hora nasce um filhote da raridade do melhor pai, com 15% de chance de subir um degrau, ou igual a um dos pais. Os pais ficam com você. Custo de ${custo[0]} (Comuns) a ${custo[1]} moedas (Lendários).</p>
    ${el.length < 2 ? '<p class="muted">Você ainda não tem dois bichos de nível ' + CRUZ_LV + '.</p>' : `<select id="cruzA" class="inp" aria-label="Primeiro bicho">${opt}</select><select id="cruzB" class="inp" aria-label="Segundo bicho">${opt}</select><button class="btn primary" data-act="cruzar">Cruzar</button>`}</section>`;
}

/* ---------- evolução (no modal do bicho) ---------- */
function blocoEvolucao(id) {
  const o = S.pets[id], e = estagio(S, id), c = custoEvolucao(S, id);
  const nome = e ? EST_NOMES[e] + ' (+' + (e * 50) + '% de produção)' : 'Filhote';
  if (o.lvl < LVL_MAX) return `<div><b>Evolução: ${nome}</b><p class="muted">No nível ${LVL_MAX} ele pode evoluir. Cada repetido a partir daí vira um fragmento.</p></div>`;
  if (!c) return `<div><b>Evolução: ${nome}</b><p class="muted">Estágio máximo!</p></div>`;
  const ok = (o.frag || 0) >= c.frag && S.coins >= c.coins;
  return `<div><b>Evolução: ${nome}</b><p class="muted">Para ${EST_NOMES[e + 1]} (+${(e + 1) * 50}%): ${o.frag || 0}/${c.frag} fragmentos e ${fmt(c.coins)} moedas.</p><button class="btn ${ok ? 'primary' : 'ghost'}" data-act="evoluir" data-arg="${id}" ${ok ? '' : 'disabled'}>Evoluir</button></div>`;
}
function cardCombos() {
  const itens = COMBOS.map(c => {
    const tem = c.ids.filter(id => S.pets[id]).length, ok = tem === c.ids.length;
    return `<div class="evtrew ${ok ? 'ok' : ''}"><span style="font-size:22px">${c.em}</span><span><b>${c.nome}</b> <span class="muted">${c.ids.map(id => PET_POR_ID[id].em).join(' ')}</span><br><span class="muted">${ok ? 'Ativo' : tem + '/' + c.ids.length + ' bichos'} · +${Math.round(c.b * 100)}% de moedas</span></span><span class="badge ${ok ? 'on' : ''}">${ok ? 'Ativo' : '+' + Math.round(c.b * 100) + '%'}</span></div>`;
  }).join('');
  return `<section class="card"><div class="between"><h2>Combos</h2><span class="badge on">+${Math.round(bonusCombos(S) * 100)}%</span></div><p class="muted">Junte os bichos de cada grupo na coleção (não precisam estar no pasto) para um bônus permanente de moedas.</p>${itens}</section>`;
}

/* ---------- conquistas ---------- */
function cardConquistas() {
  const linhas = CONQS.map(c => {
    const e = conqEstado(S, c), r = e.t < 4 ? CONQ_REC[e.t] : null;
    return `<div class="evtrew ${e.pronta ? 'pronto' : ''} ${e.t >= 4 ? 'ok' : ''}"><span class="num">${e.t}/4</span><span><b>${c.nome}</b><br><span class="muted">${e.meta ? c.d(e.meta) + ' (' + fmt(Math.min(e.v, e.meta)) + ')' : 'Tudo concluído'}${r ? ' · ' + r.gems + ' gemas' + (r.ing ? ' + ' + r.ing + ' 🎟️' : '') : ''}</span></span>
      <button class="btn mini ${e.pronta ? 'primary' : 'ghost'}" data-act="conqResg" data-arg="${c.id}" ${e.pronta ? '' : 'disabled'}>${e.t >= 4 ? 'Pego' : e.pronta ? 'Resgatar' : 'Trava'}</button></div>`;
  }).join('');
  return `<section class="card"><div class="between"><h2>Conquistas</h2><span class="muted">${conqProntas(S)} pronta(s)</span></div>${linhas}</section>`;
}

/* ---------- corrida de 48 horas ---------- */
function viewCorrida() {
  if (S.nivel < 3) return '';
  const now = Date.now(), on = window.ON && ON.ativo, cr = on ? ON.cr : null;
  const premios = CORR_METAS.map((m, k) => {
    const r = recCorrida(S, k), feito = S.corrida.res[k], pronto = !feito && S.corrida.pts >= m;
    return `<div class="evtrew ${pronto ? 'pronto' : ''} ${feito ? 'ok' : ''}"><span class="num">${m}</span><span class="muted">${textoRec({ coins: r.coins, gems: r.gems, xp: 0 })}${r.ing ? ' · ' + r.ing + ' 🎟️' : ''}</span><button class="btn mini ${pronto ? 'primary' : 'ghost'}" data-act="corrResg" data-arg="${k}" ${pronto ? '' : 'disabled'}>${feito ? 'Pego' : pronto ? 'Resgatar' : 'Trava'}</button></div>`;
  }).join('');
  let rank;
  if (on) {
    rank = !cr ? '<p class="muted">Carregando o ranking…</p>' : (cr.premio ? `<div class="guia card" style="margin:8px 0"><span class="gic">🏆</span><div class="gtx"><b>Você ficou em ${cr.premio}º na corrida passada!</b><span>Resgate seu prêmio.</span></div><button class="btn primary" data-act="corrPremio">Resgatar</button></div>` : '') +
      (cr.top.length ? cr.top.map(x => `<div class="mrow ${x.voce ? 'eu' : ''}"><span class="pos">${x.pos}</span><span class="who"><b>${esc(x.nome)}</b><small>Nv ${x.nivel}</small></span><span class="pts num">${fmt(x.pontos)}</span><span></span></div>`).join('') : '<p class="muted">Ninguém pontuou ainda. Seja o primeiro!</p>');
  } else {
    const l = corridaSim(S, now), i = l.findIndex(x => x.voce);
    rank = [...l.slice(0, 5), ...(i > 4 ? l.slice(Math.max(5, i - 1), i + 2) : [])].map(x => `<div class="mrow ${x.voce ? 'eu' : ''}"><span class="pos">${x.pos}</span><span class="who"><b>${x.nome}</b></span><span class="pts num">${fmt(x.pts)}</span><span></span></div>`).join('') + '<p class="muted">Concorrentes simulados neste modo. Online, você corre contra jogadores reais.</p>';
  }
  const pos = on ? (cr && cr.pos ? cr.pos + 'º lugar' : '') : corridaSim(S, now).find(x => x.voce).pos + 'º lugar';
  return `<section class="card evthead"><div class="between"><h2>🏁 Corrida de 48 h</h2><span class="muted">termina em ${duracao(corridaResta(now))}</span></div>
      <div class="bar"><i style="width:${Math.min(100, S.corrida.pts / CORR_METAS[3] * 100)}%"></i></div>
      <div class="between"><span class="big num">${fmt(S.corrida.pts)} pts</span><span class="badge on">${pos || 'sem posição'}</span></div>
      <p class="muted">Mesmos pontos do evento semanal, só que valendo 48 horas: ovos, coletas, colheitas, pedidos, oficina e golpes no chefe.</p></section>
    <section class="card"><h3>Metas da corrida</h3>${premios}</section><section class="card"><h3>Ranking</h3>${rank}</section>`;
}

/* ---------- chefe da guilda ---------- */
function chefeDados(now) {
  if (window.ON && ON.ativo) return ON.ch ? Object.assign({}, ON.ch, { termina_em: Math.max(0, ON.ch.termina_em - (now - ON.tCh) / 1000) }) : null;
  return S.guilda.id >= 0 ? chefeEstadoSim(S, now) : null;
}
function chefeLivres(now) { const d = chefeDados(now); return d && S.nivel >= CHEFE_NIVEL ? Math.max(0, CHEFE_GRATIS - d.golpes_hoje) : 0; }
function viewChefe() {
  const now = Date.now(), on = window.ON && ON.ativo, d = chefeDados(now);
  if (S.nivel < CHEFE_NIVEL) return travado('Chefe da guilda', 'Toda semana uma praga ataca o campo e a guilda inteira precisa vencer junto. Libera no nível ' + CHEFE_NIVEL + '.');
  if (on ? (ON.e && !ON.e.guilda) : S.guilda.id < 0) return travado('Chefe da guilda', 'Entre numa guilda para enfrentar a praga da semana com os outros membros.');
  if (!d) return '<section class="card"><p class="muted">Carregando o chefe…</p></section>';
  const ch = chefeDaSemana(d.semana !== undefined ? d.semana : semanaDe(now)), pct = Math.max(0, 100 - d.dano_total / d.hp * 100), livres = Math.max(0, CHEFE_GRATIS - d.golpes_hoje), resta = d.golpes_max - d.golpes_hoje;
  const atacar = d.derrotado ? '<button class="btn ghost" disabled>Praga derrotada!</button>' : resta <= 0 ? '<button class="btn ghost" disabled>Sem golpes hoje. Volte amanhã</button>' :
    livres > 0 ? `<button class="btn primary" data-act="chefeGolpe">⚔️ Atacar (${livres} grátis) · ${fmt(danoGolpe(S))}</button>` : `<button class="btn ad" data-act="chefeGolpe">${PLAY}Atacar mais (${resta}) <span class="tag">${rotuloAd()}</span></button>`;
  const premio = d.derrotado && !d.premio_resgatado && d.meu_dano > 0 || d.premio_anterior;
  const rec = recChefe(S);
  const top = d.top.map((m, k) => `<div class="mrow ${m.voce ? 'eu' : ''}"><span class="pos">${k + 1}</span><span class="who"><b>${esc(m.nome)}</b></span><span class="pts num">${fmt(m.dano)}</span><span></span></div>`).join('');
  return `<section class="card evthead"><div class="between"><h2>${ch.em} ${ch.nome}</h2><span class="muted">some em ${duracao(d.termina_em)}</span></div>
      <div class="evtpet ${d.derrotado ? 'sombra' : ''}">${ch.em}</div>
      <div class="bar"><i style="width:${pct}%;background:linear-gradient(180deg,#ff8a7a,#e5483a)"></i></div>
      <div class="between"><span class="num">${fmt(Math.max(0, d.hp - d.dano_total))} de ${fmt(d.hp)} de vida</span><span class="muted num">seu dano: ${fmt(d.meu_dano)}</span></div>
      <p class="muted">Cada fazendeiro tem ${d.golpes_max} golpes por dia: ${CHEFE_GRATIS} grátis e o resto com anúncio. Quem causar dano divide o prêmio quando a praga cair.</p>
      <div class="row">${atacar}</div>
      ${premio ? `<div class="row" style="margin-top:8px"><button class="btn primary" data-act="chefeResg">🎁 Resgatar prêmio: ${fmt(rec.coins)} moedas, ${rec.gems} gemas, ${rec.ing} 🎟️</button></div>` : d.premio_resgatado ? '<p class="muted">Prêmio da semana já resgatado.</p>' : ''}</section>
    <section class="card"><h3>Quem mais bateu</h3>${top || '<p class="muted">Ninguém atacou ainda.</p>'}${on ? '' : '<p class="muted">Neste modo, os membros da guilda são simulados.</p>'}</section>`;
}

/* ---------- ajustes: código promocional ---------- */
function cardCodigo() {
  const on = window.ON && ON.ativo;
  return `<section class="card"><h2>Código promocional</h2><p class="muted">Tem um código de presente? Digite aqui e ganhe gemas e ingressos.</p>${on ? '<input id="codigoIn" class="inp" maxlength="24" placeholder="Digite o código" autocapitalize="characters" autocomplete="off"><button class="btn primary" data-act="codigoUsar">Resgatar</button>' : '<p class="muted">Disponível no modo online.</p>'}</section>`;
}

/* ---------- ações ---------- */
function dobroPedido(i) { return entregarPedido(S, +i, Date.now(), true); }
Object.assign(ACOES, {
  subO(x) { subO = x; render(); },
  subMetas(x) { aba = 'metas'; subM = x; render(); },
  bicho(id) { modalBicho(id); },
  carinho(id) { const r = cuidar(S, id, Date.now(), 'carinho'); if (!r.ok) return toast('Ele já está relaxado. Volte em ' + duracao((r.falta || 0) / 1000)); receber(r.ups); salvar(); Fx.glifo(innerWidth / 2, innerHeight * 0.3, '❤️', 34); Som.play('pop'); modalBicho(id); render(); },
  racao(id) { const r = cuidar(S, id, Date.now(), 'racao'); if (!r.ok) return toast(erroMsg(r)); receber(r.ups); salvar(); Som.play('coin'); modalBicho(id); render(); toast('Bicho bem alimentado: felicidade por mais tempo'); },
  renomear(id) { const r = renomear(S, id, ($('#petNome') || {}).value); if (!r.ok) return; salvar(); modalBicho(id); render(); toast('Nome salvo: ' + r.nome); },
  bauDia() {
    const hoje = hojeN(); if (!bauDisponivel(S, hoje)) return toast('Volte amanhã para mais baús');
    const abrir = () => { const r = abrirBau(S, hoje); if (!r.ok) return; receber(r.ups); salvar(); Som.play('bau'); Fx.confete(innerWidth / 2, innerHeight * 0.5, 40, ['#FFC21A', '#fff', '#3DBB6B']); toast('Baú: +' + fmt(r.coins) + ' moedas' + (r.gems ? ', +' + r.gems + ' gemas' : '')); };
    if (bauPrecisaAnuncio(S, hoje)) anuncio('bau', 'Baú extra do dia', abrir); else { abrir(); render(); }
  },
  brilho() {
    if (!brilhoDisponivel(S, hojeN())) return toast('Amanhã tem outro');
    if (S.eggs.findIndex(e => !e) < 0) return toast(ERROS.cheio);
    anuncio('brilho', 'Ovo brilhante', () => { const r = ganharOvoBrilho(S, hojeN(), Date.now()); toast(r.ok ? 'Ovo brilhante na incubadora' : 'Não foi possível'); });
  },
  plantar(a) { const [i, id] = String(a).split(':'); const r = plantar(S, +i, id, Date.now()); if (!r.ok) return toast(erroMsg(r)); salvar(); render(); Som.play('pop'); },
  adubar(i) { const p = S.horta[+i]; if (!p) return; anuncio('adubo', 'Adubo: metade do tempo', () => { adubar(S, +i, Date.now()); toast('Cresce em metade do tempo'); }); },
  colher(i) { const r = colherHorta(S, +i, Date.now()); if (!r.ok) return; receber(r.ups); salvar(); render(); Som.play('coin'); Fx.glifo(innerWidth / 2, innerHeight * 0.4, CULTIVOS[r.id].em + ' +' + r.qtd, 30); metrica('horta'); },
  decorar(id) { const r = comprarDecor(S, id); if (!r.ok) return toast(r.erro === 'passe' ? 'Exige o Passe da Temporada' : erroMsg(r)); receber(r.ups); salvar(); render(); Som.play('bau'); toast(DECORS[id].nome + ' no seu sítio!'); },
  entregar(i) { const r = entregarPedido(S, +i, Date.now(), false); if (!r.ok) return toast(r.erro === 'falta' ? 'Faltam itens' : 'Pedido vencido'); receber(r.ups); salvar(); render(); Som.play('coin'); toast('Entregue! ' + textoRec(r.rec)); metrica('pedido'); },
  entregar2x(i) {
    const p = S.pedidos[+i]; if (!p || !podeEntregar(S, p)) return;
    anuncio('pedido', 'Recompensa em dobro', () => { const r = dobroPedido(i); if (r.ok) { receber(r.ups); toast('Em dobro! ' + textoRec({ coins: r.rec.coins * 2, gems: r.rec.gems * 2, xp: 0 })); metrica('pedido'); } });
  },
  evtResg(k) {
    const r = resgatarEvento(S, +k, Date.now()); if (!r.ok) return toast(r.erro === 'meta' ? 'Faltam pontos' : 'Já resgatado');
    receber(r.ups); salvar(); render(); metrica('evento_semana'); if (r.roupa) setTimeout(() => toast('Roupa nova: ' + ROUPAS[r.roupa].nome + '! Veja no seu perfil.'), 1800);
    if (r.pet) revelarPet(r.pet, r.res, 'Bicho do evento'); else { Som.play('bau'); toast('Prêmio: ' + textoRec({ coins: r.r.coins, gems: r.r.gems, xp: 0 })); }
  },
  cfgVibra() { S.cfg.vibra = !S.cfg.vibra; Som.semVibra = !S.cfg.vibra; salvar(); render(); },
  cfgEco(v) { S.cfg.eco = v; if (v !== 'auto') S.cfg.ecoAuto = false; aplicarEco(); salvar(); render(); },
  cfgTema(v) { S.tema = v; salvar(); render(); },
  premiumOn(id) { comprarPremium(S, id); metrica('compra_simulada'); salvar(); render(); toast(PREMIUM[id].nome + ' ativado (simulação)'); },
  premiumOff(id) { S.premium[id] = false; salvar(); render(); },
  tutorial() { S.tut = { passo: 0, fim: false }; aba = 'sitio'; salvar(); render(); },
  tutPular() { S.tut.fim = true; salvar(); ocultarTut(tutGarantir()); },
  tutProx() { S.tut.passo++; salvar(); tickTutorial(); },
  async notif() {
    if (S.cfg.notif) { S.cfg.notif = false; Notif.cancelar(); salvar(); return render(); }
    const ok = await Notif.pedir(); S.cfg.notif = ok; salvar(); render();
    toast(ok ? 'Lembretes ligados' : 'Permissão negada');
  },
  async convidar() {
    const cod = window.ON && ON.ativo && ON.convite ? ON.convite.codigo : '';
    const url = URL_JOGO + (cod ? '?convite=' + encodeURIComponent(cod) : '');
    const texto = 'Venha criar bichos no Sítio dos Bichos! ' + (cod ? 'Use meu código ' + cod + ' e ganhe gemas.' : '');
    try {
      if (navigator.share) { await navigator.share({ title: 'Sítio dos Bichos', text: texto, url }); metrica('convite'); return; }
      await navigator.clipboard.writeText(texto + ' ' + url); toast('Convite copiado!'); metrica('convite');
    } catch (e) { if (!(e && e.name === 'AbortError')) toast('Copie o link: ' + url); }
  },
  async prestigio() {
    if (!podePrestigiar(S)) return toast('Chegue ao nível ' + NIVEL_PRESTIGIO);
    if (!confirmaPrest) { confirmaPrest = true; render(); setTimeout(() => { if (confirmaPrest) { confirmaPrest = false; if (aba === 'ajustes') render(); } }, 5000); return; }
    confirmaPrest = false;
    if (window.ON && ON.ativo && ON.sync) { try { await ON.sync(); } catch (e) {} }
    const r = prestigiar(S, Date.now()); if (!r.ok) return;
    ajustarTudo(S, Date.now()); fila = []; salvar(); aba = 'sitio'; subO = 'obras'; render(); metrica('prestigio');
    abrirModal(`<div class="sheet pop"><p class="eyebrow">Prestígio ${r.prest}</p><h2>Sítio renovado!</h2><p class="muted">+${r.gems} gemas e bônus permanente de <b>+${r.prest * 25}% de moedas</b>. Seus bichos continuam com você.</p><button class="btn primary xl" data-act="fechar">Recomeçar</button></div>`);
    Som.play('lendario'); Fx.confete(innerWidth / 2, innerHeight * 0.4, 140, ['#FFC21A', '#3DBB6B', '#2F9BE8', '#FF7AB6', '#fff']);
  },
});

Object.assign(ACOES, {
  irObras(x) { aba = 'obras'; subO = x; render(); },
  irGuilda(x) { aba = 'guilda'; subG = x; render(); },
  receita(a) { const [i, id] = String(a).split(':'); const r = iniciarReceita(S, +i, id, Date.now()); if (!r.ok) return toast(erroMsg(r)); salvar(); render(); Som.play('pop'); metrica('oficina'); },
  acelRec(i) { const o = S.oficina[+i]; if (!o) return; anuncio('acelerar', 'Acelerar a bancada', () => { acelerarReceita(S, +i, Date.now()); toast('Metade do tempo'); }); },
  colherRec(i) { const r = colherReceita(S, +i, Date.now()); if (!r.ok) return; receber(r.ups); salvar(); render(); Som.play('coin'); Fx.glifo(innerWidth / 2, innerHeight * 0.4, RECEITAS[r.id].em + ' +' + fmt(r.coins), 28); },
  pesquisar(id) { const r = iniciarPesquisa(S, id, Date.now()); if (!r.ok) return toast(erroMsg(r)); salvar(); render(); Som.play('pop'); metrica('pesquisa'); },
  acelPesq() { if (!S.pesq.at) return; anuncio('acelerar', 'Acelerar a pesquisa', () => { acelerarPesquisa(S, Date.now()); toast('Metade do tempo'); }); },
  lote(tipo) {
    const r = sortearLote(S, tipo, Math.random); if (!r.ok) return toast(erroMsg(r));
    receber(r.ups); salvar(); metrica('lote'); Som.play(['comum', 'comum', 'raro', 'epico', 'lendario'][r.melhor]); Som.vibrar([30, 30, 80]);
    const cel = r.lista.map(x => `<div class="cell" style="--rc:var(--r${x.r})"><span class="em">${x.pet.em}</span><span class="nm">${x.res.tipo === 'novo' ? 'NOVO' : 'Nv ' + (S.pets[x.pet.id] ? S.pets[x.pet.id].lvl : '')}</span></div>`).join('');
    abrirModal(`<div class="sheet pop" style="--rc:var(--r${r.melhor})"><p class="eyebrow">Sorteio em lote</p><h2>${RARIDADES[r.melhor].nome} no lote!</h2><div class="cgrid" style="grid-template-columns:repeat(5,minmax(0,1fr))">${cel}</div><button class="btn primary xl" data-act="fechar">Continuar</button></div>`);
    const cor = COR_RAR[r.melhor]; Fx.brilhos(innerWidth / 2, innerHeight * 0.4, 12 + r.melhor * 5, cor); if (r.melhor >= 2) Fx.confete(innerWidth / 2, innerHeight * 0.4, 40 + r.melhor * 30, [cor, '#FFC21A', '#fff', '#FF7AB6']); render();
  },
  cruzar() { const a = ($('#cruzA') || {}).value, b = ($('#cruzB') || {}).value; const r = iniciarCruz(S, a, b, Date.now()); if (!r.ok) return toast(r.erro === 'par' ? 'Escolha dois bichos diferentes' : r.erro === 'moedas' ? 'Precisa de ' + fmt(r.custo) + ' moedas' : erroMsg(r)); salvar(); render(); Som.play('pop'); metrica('cruzamento'); },
  cruzAcel() { if (!S.cruz) return; anuncio('acelerar', 'Acelerar o cruzamento', () => { acelerarCruz(S, Date.now()); toast('Metade do tempo'); }); },
  cruzAbrir() { const r = abrirCruz(S, Date.now(), Math.random); if (!r.ok) return; receber(r.ups); salvar(); render(); revelarPet(r.pet, r.res, 'Filhote ' + RARIDADES[r.r].nome); },
  evoluir(id) { const r = evoluir(S, id); if (!r.ok) return toast(r.erro === 'frag' ? 'Faltam ' + r.falta + ' fragmentos' : erroMsg(r)); receber(r.ups); salvar(); modalBicho(id); render(); Som.play('lendario'); Fx.confete(innerWidth / 2, innerHeight * 0.35, 60, ['#FFC21A', '#fff', '#3DBB6B']); metrica('evolucao'); toast(nomeDoBicho(S, id) + ' evoluiu: ' + EST_NOMES[r.est]); },
  conqResg(id) { const r = resgatarConq(S, id); if (!r.ok) return; receber(r.ups); salvar(); render(); Som.play('bau'); toast('Conquista: +' + r.rec.gems + ' gemas' + (r.rec.ing ? ' e +' + r.rec.ing + ' ingressos' : '')); metrica('conquista'); },
  corrResg(k) { const r = resgatarCorrida(S, +k, Date.now()); if (!r.ok) return toast(r.erro === 'meta' ? 'Faltam pontos' : 'Já resgatado'); receber(r.ups); salvar(); render(); Som.play('bau'); toast('Corrida: ' + textoRec({ coins: r.rec.coins, gems: r.rec.gems, xp: 0 }) + (r.rec.ing ? ' · +' + r.rec.ing + ' ingressos' : '') + (r.roupa ? ' · roupa nova: ' + ROUPAS[r.roupa].nome : '')); },
  corrPremio() { if (window.ON && ON.ativo) ACOES.corrPremioOn(); },
  chefeGolpe() {
    const now = Date.now(), d = chefeDados(now); if (!d || d.derrotado) return;
    const livres = Math.max(0, CHEFE_GRATIS - d.golpes_hoje);
    const bater = () => {
      if (window.ON && ON.ativo) return ACOES.chefeGolpeOn();
      const r = golpearChefeSim(S, Date.now()); if (!r.ok) return toast(r.erro === 'limite_diario' ? 'Sem golpes hoje' : erroMsg(r));
      receber(r.ups); salvar(); render(); Som.play('bau'); Fx.glifo(innerWidth / 2, innerHeight * 0.4, '⚔️ -' + fmt(r.dano), 30); metrica('chefe');
    };
    if (livres > 0) bater(); else anuncio('chefe', 'Golpe extra no chefe', bater);
  },
  chefeResg() {
    if (window.ON && ON.ativo) return ACOES.chefeResgOn();
    const r = resgatarChefeSim(S, Date.now()); if (!r.ok) return toast('Ainda não há prêmio do chefe para você');
    receber(r.ups); salvar(); render(); Som.play('bau'); Fx.confete(innerWidth / 2, innerHeight * 0.4, 90, ['#FFC21A', '#fff', '#3DBB6B']);
    toast('Chefe derrotado! ' + textoRec({ coins: r.rec.coins, gems: r.rec.gems, xp: 0 }) + ' · +' + r.rec.ing + ' ingressos');
  },
  codigoUsar() { if (window.ON && ON.ativo) ACOES.codigoUsarOn(); },
  voltaDobro() { if (Math.floor(S.barn) < 1) return toast('Já coletado'); anuncio('dobro', 'Coletar em dobro', () => { const r = coletar(S, 2); if (r) { receber(r.ups); toast('+' + fmt(r.ganho) + ' moedas (dobro)'); } fecharModal(); }); },
});

/* Guilda contra guilda no modo offline: as três guildas simuladas disputam entre si. */
function viewGuildasSim() {
  const now = Date.now();
  const lista = GUILDAS.map(g => { let t = 0; for (let i = 0; i < N_MEMBROS; i++) t += pontosMembro(g.id, i, now); if (S.guilda.id === g.id) t += S.guilda.pontos; return { nome: g.nome, pontos: t, minha: S.guilda.id === g.id }; }).sort((a, b) => b.pontos - a.pontos);
  return `<section class="card"><h2>Guilda contra guilda</h2><p class="muted">No modo online, guildas de jogadores reais disputam o pódio da semana e ganham prêmios. Aqui, as três guildas simuladas mostram como funciona.</p></section>
    <section class="card">${lista.map((x, k) => `<div class="mrow ${x.minha ? 'eu' : ''}"><span class="pos">${k + 1}</span><span class="who"><b>${x.nome}</b></span><span class="pts num">${fmt(x.pontos)}</span><span></span></div>`).join('')}</section>`;
}

/* ===== Perfil do fazendeiro ===== */
function chapeuSVG(t, hc, c2, cor) {
  const dk = '#00000026';
  switch (t) {
    case 'cartola': return `<ellipse cx="50" cy="22" rx="19" ry="4.5" fill="${hc}"/><rect x="38" y="2" width="24" height="20" rx="2" fill="${hc}"/><rect x="38" y="15" width="24" height="5" fill="${c2 || '#b3202e'}"/><ellipse cx="50" cy="2.5" rx="12" ry="2.6" fill="#ffffff22"/>`;
    case 'coroa': return `<path d="M34 24 L36 8 L43 16 L50 4 L57 16 L64 8 L66 24 Z" fill="${hc}" stroke="#c98a00" stroke-width="1"/><circle cx="50" cy="12" r="2.2" fill="#e63946"/><circle cx="39" cy="17" r="1.6" fill="#3a8fe0"/><circle cx="61" cy="17" r="1.6" fill="#3a8fe0"/>`;
    case 'gorro': return `<path d="M33 25 Q33 6 50 6 Q67 6 67 25 Z" fill="${hc}"/><rect x="32" y="21" width="36" height="6" rx="3" fill="${c2 || '#fff'}"/><circle cx="50" cy="5" r="4.5" fill="${c2 || '#fff'}"/>`;
    case 'safari': case 'akubra': return `<ellipse cx="50" cy="23" rx="25" ry="5.5" fill="${hc}"/><path d="M36 23 Q36 7 50 7 Q64 7 64 23 Z" fill="${hc}"/><rect x="36" y="18" width="28" height="4" fill="${c2 || '#7a5636'}"/><ellipse cx="50" cy="23" rx="25" ry="5.5" fill="${dk}" opacity=".3"/>`;
    case 'couro': return `<path d="M24 20 Q34 28 50 25 Q66 28 76 20 Q70 26 64 22 L36 22 Q30 26 24 20Z" fill="${hc}"/><path d="M36 22 Q36 6 50 8 Q64 6 64 22 Z" fill="${hc}"/><rect x="36" y="17" width="28" height="3.5" fill="${c2 || '#7a4a1f'}"/>`;
    case 'marujo': return `<ellipse cx="50" cy="22" rx="18" ry="5" fill="${hc}"/><path d="M34 22 Q34 8 50 8 Q66 8 66 22 Z" fill="${hc}"/><rect x="34" y="18" width="32" height="4" fill="${c2 || '#2f6fd1'}"/><circle cx="50" cy="10" r="2" fill="${c2 || '#2f6fd1'}"/>`;
    case 'turbante': return `<path d="M32 24 Q30 8 50 6 Q70 8 68 24 Q50 18 32 24Z" fill="${hc}"/><path d="M34 18 Q50 10 66 18 M33 22 Q50 14 67 22" stroke="#00000033" stroke-width="1.6" fill="none"/><circle cx="50" cy="14" r="3" fill="#ffd23f" stroke="#c98a00" stroke-width=".8"/>`;
    case 'capacete': return `<ellipse cx="50" cy="23" rx="24" ry="5" fill="${hc}"/><path d="M34 23 Q34 4 50 4 Q66 4 66 23 Z" fill="${hc}"/><rect x="34" y="18" width="32" height="3.5" fill="${c2 || '#f4b31f'}"/><path d="M40 8 Q50 3 60 8" stroke="#fff" stroke-opacity=".6" stroke-width="2" fill="none"/>`;
    case 'capacete2': return `<path d="M32 36 Q30 6 50 5 Q70 6 68 36 L62 30 Q50 26 38 30 Z" fill="${hc}"/><path d="M36 28 Q50 22 64 28 L64 33 Q50 28 36 33Z" fill="#1d2b3f"/><path d="M40 10 Q50 5 60 10" stroke="#fff" stroke-opacity=".6" stroke-width="2.2" fill="none"/><rect x="48" y="5" width="4" height="12" fill="${c2 || '#fff'}"/>`;
    case 'astro': return `<circle cx="50" cy="35" r="23" fill="#cfe8ff" fill-opacity=".28" stroke="#f2f4f8" stroke-width="3.5"/><path d="M36 24 Q42 16 52 15" stroke="#fff" stroke-opacity=".8" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="38" y="55" width="24" height="5" rx="2.5" fill="#f2f4f8"/>`;
    case 'pirata': return `<path d="M28 24 L50 4 L72 24 Q50 17 28 24Z" fill="${hc}"/><path d="M34 21 Q50 15 66 21" stroke="${c2 || '#f4d97a'}" stroke-width="1.6" fill="none"/><circle cx="50" cy="15" r="3" fill="#fff"/><rect x="48.4" y="17" width="3.2" height="3" fill="#fff"/>`;
    case 'dino': return `<path d="M32 30 Q30 8 50 7 Q70 8 68 30 Q50 20 32 30Z" fill="${hc}"/><path d="M38 9 L42 2 L46 8 L50 0 L54 8 L58 2 L62 9Z" fill="${c2 || '#a6e6b4'}"/><circle cx="41" cy="18" r="4" fill="#fff"/><circle cx="59" cy="18" r="4" fill="#fff"/><circle cx="41.5" cy="18.5" r="1.8" fill="#222"/><circle cx="58.5" cy="18.5" r="1.8" fill="#222"/>`;
    default: return `<ellipse cx="50" cy="23" rx="25" ry="5.5" fill="${hc}"/><path d="M37 23 Q37 6 50 6 Q63 6 63 23 Z" fill="${hc}"/><rect x="37" y="18" width="26" height="3.6" fill="${cor || '#c8453a'}"/><ellipse cx="50" cy="23" rx="25" ry="5.5" fill="#00000022"/>`;
  }
}
function avatarSVG(sexo, pele, rid, extra) {
  const R = ROUPAS[rid] || ROUPAS.padrao, tier = (extra && extra.tier) || 0, cam = R.cam || ['#C8453A', '#2F8FD1', '#7A4CC8', '#23834A', '#E39A0B', '#E39A0B'][tier] || '#C8453A';
  const sk = PELES[pele] || PELES[1], f = sexo === 'f', cab = f ? '#5a3a24' : '#4a3220', id = 'av' + Math.random().toString(36).slice(2, 7);
  const hatType = R.chapeu, cobreCabelo = ['astro', 'capacete2', 'dino', 'gorro', 'turbante', 'pirata', 'cartola', 'capacete'].includes(hatType);
  let a = '';
  a += `<defs><linearGradient id="${id}c" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient><radialGradient id="${id}h" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#5a2a00" stop-opacity=".28"/></radialGradient></defs>`;
  a += `<ellipse cx="50" cy="123" rx="28" ry="5" fill="#00281a" opacity=".28"/>`;
  if (R.acess === 'capa') a += `<path d="M30 54 L22 114 Q50 122 78 114 L70 54Z" fill="${R.cam2 === '#ffd23f' ? '#4a1f86' : '#7a1520'}"/><path d="M30 54 L22 114 Q50 122 78 114 L70 54Z" fill="url(#${id}c)"/>`;
  a += `<rect x="34" y="88" width="12" height="28" rx="4" fill="${R.calca}"/><rect x="54" y="88" width="12" height="28" rx="4" fill="${R.calca}"/><rect x="34" y="88" width="32" height="28" rx="4" fill="url(#${id}c)" opacity=".7"/>`;
  a += `<ellipse cx="40" cy="117" rx="9" ry="4.5" fill="#2b1d14"/><ellipse cx="60" cy="117" rx="9" ry="4.5" fill="#2b1d14"/>`;
  a += `<rect x="25" y="56" width="11" height="28" rx="5.5" fill="${cam}"/><rect x="64" y="56" width="11" height="28" rx="5.5" fill="${cam}"/><circle cx="30.5" cy="86" r="5" fill="${sk}"/><circle cx="69.5" cy="86" r="5" fill="${sk}"/>`;
  a += `<path d="M${f ? 31 : 29} 54 Q50 48 ${f ? 69 : 71} 54 L${f ? 67 : 70} 94 Q50 99 ${f ? 33 : 30} 94Z" fill="${cam}"/>`;
  if (R.acess === 'listras') for (let y = 60; y < 94; y += 8) a += `<rect x="31" y="${y}" width="38" height="3.5" fill="${R.cam2}" opacity=".9"/>`;
  if (R.acess === 'xadrez') { for (let y = 58; y < 94; y += 9) a += `<rect x="31" y="${y}" width="38" height="3" fill="${R.cam2}" opacity=".45"/>`; for (let x = 36; x < 68; x += 10) a += `<rect x="${x}" y="54" width="3" height="40" fill="${R.cam2}" opacity=".45"/>`; }
  if (R.acess === 'remendo') a += `<rect x="55" y="68" width="9" height="9" rx="1.5" fill="${R.cam2}"/><path d="M56.5 70h6M56.5 72.5h6M56.5 75h6" stroke="#0003" stroke-width=".8"/>`;
  if (R.acess === 'gravata') a += `<path d="M46 56 L54 56 L52 76 L50 80 L48 76Z" fill="#b3202e"/><path d="M44 53 L50 60 L56 53Z" fill="${R.cam2}"/>`;
  if (R.acess === 'cachecol') a += `<rect x="32" y="52" width="36" height="9" rx="4.5" fill="${R.cam2}"/><rect x="58" y="58" width="9" height="22" rx="3.5" fill="${R.cam2}"/><path d="M58 70h9M58 75h9" stroke="#3a8fe0" stroke-width="2"/>`;
  if (R.acess === 'lenco') a += `<path d="M38 53 L62 53 L50 68Z" fill="${R.cam2}"/><circle cx="50" cy="60" r="1.6" fill="#fff" opacity=".7"/>`;
  if (R.chapeu !== 'astro' && !R.acess) { if (tier >= 2) a += `<rect x="38" y="56" width="5" height="26" fill="#2C5E8C"/><rect x="57" y="56" width="5" height="26" fill="#2C5E8C"/>`; }
  if (rid === 'padrao' && tier >= 4) a += `<rect x="30" y="76" width="40" height="5" fill="#F2C94C"/>`;
  a += `<path d="M${f ? 31 : 29} 54 Q50 48 ${f ? 69 : 71} 54 L${f ? 67 : 70} 94 Q50 99 ${f ? 33 : 30} 94Z" fill="url(#${id}c)"/>`;
  if (f && !cobreCabelo) a += `<path d="M31 32 Q28 56 36 66 Q32 46 36 34Z M69 32 Q72 56 64 66 Q68 46 64 34Z" fill="${cab}"/>`;
  a += `<rect x="45" y="48" width="10" height="8" rx="3" fill="${sk}"/>`;
  a += `<circle cx="50" cy="36" r="16.5" fill="${sk}"/><circle cx="50" cy="36" r="16.5" fill="url(#${id}h)"/><circle cx="33.5" cy="37" r="3" fill="${sk}"/><circle cx="66.5" cy="37" r="3" fill="${sk}"/>`;
  if (!cobreCabelo) a += f ? `<path d="M33 34 Q34 18 50 18 Q66 18 67 34 Q60 24 50 25 Q40 24 33 34Z" fill="${cab}"/>` : `<path d="M34 30 Q36 19 50 19 Q64 19 66 30 Q58 24 50 25 Q42 24 34 30Z" fill="${cab}"/>`;
  a += `<ellipse cx="43.5" cy="37" rx="1.9" ry="2.4" fill="#2b1d14"/><ellipse cx="56.5" cy="37" rx="1.9" ry="2.4" fill="#2b1d14"/><circle cx="44.1" cy="36.2" r=".7" fill="#fff"/><circle cx="57.1" cy="36.2" r=".7" fill="#fff"/>`;
  if (f) a += `<path d="M41.4 35 l-1.7 -.9 M58.6 35 l1.7 -.9" stroke="#2b1d14" stroke-width=".8" stroke-linecap="round"/>`;
  a += `<path d="M45 43 Q50 47.5 55 43" stroke="#8a3a2a" stroke-width="1.7" fill="none" stroke-linecap="round"/><circle cx="39.5" cy="42" r="2.6" fill="#ff7a8a" opacity=".35"/><circle cx="60.5" cy="42" r="2.6" fill="#ff7a8a" opacity=".35"/>`;
  a += chapeuSVG(hatType, R.hc, R.cam2, cam);
  return `<svg class="avsvg" viewBox="0 0 100 128" aria-hidden="true">${a}</svg>`;
}
function palcoPerfil(big) {
  ajustarAvatar(S);
  const id = bichoDestaque(S), p = id && PET_POR_ID[id], o = id && S.pets[id];
  const est = o ? estagio(S, id) : 0;
  const pet = p ? `<div class="avpet" style="--rc:var(--r${p.r})"><span class="avstar">${'★'.repeat(est)}</span><span class="avem">${p.em}</span><small>${esc(nomeDoBicho(S, id))}</small></div>` : '<div class="avpet vazio"><small>Abra um ovo para ganhar um companheiro</small></div>';
  return `<div class="palco ${big ? 'big' : ''}">${avatarSVG(S.avatar.sexo, S.avatar.pele, S.avatar.roupa, { tier: tierDe(S.nivel) })}${pet}</div>`;
}
function fonteRoupa(id) {
  const r = ROUPAS[id];
  return r.fonte === 'nivel' ? 'Nível ' + r.nivel : r.fonte === 'prest' ? 'Fazer o prestígio' : r.fonte === 'evento' ? 'Prêmio final: ' + EVENTOS.find(e => e.id === r.ev).nome : r.fonte === 'corrida' ? 'Prêmio final da corrida' : r.fonte === 'pacote' ? PACOTES_ROUPA[r.pacote].nome : '';
}
function modalPerfil() {
  ajustarAvatar(S);
  const A = S.avatar, tem = id => !!S.roupas[id];
  const roupas = Object.keys(ROUPAS).map(id => {
    const r = ROUPAS[id], ok = tem(id), on = A.roupa === id;
    return `<button class="roupa ${on ? 'on' : ''} ${ok ? '' : 'lock'}" ${ok ? `data-act="vestir" data-arg="${id}"` : 'disabled'} title="${esc(r.nome)}"><span class="mini">${avatarSVG(A.sexo, A.pele, id, { tier: 0 })}</span><b>${r.nome}</b><small>${ok ? (on ? 'Vestindo' : 'Toque para vestir') : fonteRoupa(id)}</small></button>`;
  }).join('');
  const pets = Object.keys(S.pets).sort((a, b) => PET_POR_ID[b].r - PET_POR_ID[a].r).slice(0, 24).map(id => `<button class="chipbicho ${A.bicho === id ? 'on' : ''}" data-act="companheiro" data-arg="${id}" title="${esc(nomeDoBicho(S, id))}" style="--rc:var(--r${PET_POR_ID[id].r})">${PET_POR_ID[id].em}</button>`).join('');
  const pacotes = Object.keys(PACOTES_ROUPA).map(id => {
    const x = PACOTES_ROUPA[id], itens = Object.keys(ROUPAS).filter(k => ROUPAS[k].pacote === id), ja = itens.every(tem);
    return `<div class="card"><div class="between"><h3>${x.nome}</h3><span class="badge ${ja ? 'on' : ''}">${ja ? 'Adquirido' : x.preco}</span></div><p class="muted">${x.desc}</p>${ja ? '' : `<button class="btn primary" data-act="pacoteRoupa" data-arg="${id}">Comprar (simulação)</button>`}</div>`;
  }).join('');
  abrirModal(`<div class="sheet perfil"><div class="between"><h2>${esc(S.nome || tituloDe(S.nivel))}</h2><button class="btn mini ghost" data-act="fechar">Fechar</button></div>
    <p class="muted">${tituloDe(S.nivel)} · nível ${S.nivel} · poder ${fmt(poderJogador(S))}</p>${palcoPerfil(true)}
    <div class="row wrap"><div class="seg n2" style="flex:1">${[['m', 'Fazendeiro'], ['f', 'Fazendeira']].map(x => `<button class="${A.sexo === x[0] ? 'on' : ''}" data-act="perfilSexo" data-arg="${x[0]}">${x[1]}</button>`).join('')}</div></div>
    <div class="peles">${PELES.map((c, i) => `<button class="pele ${A.pele === i ? 'on' : ''}" data-act="perfilPele" data-arg="${i}" style="background:${c}" aria-label="Tom de pele ${i + 1}"></button>`).join('')}</div>
    <h3>Roupas</h3><div class="roupas">${roupas}</div>
    <h3>Companheiro</h3><p class="muted">Por padrão fica o bicho mais evoluído e forte do sítio. Escolha outro se preferir.</p>
    <div class="chipsbicho"><button class="chipbicho ${A.bicho === 'auto' ? 'on' : ''}" data-act="companheiro" data-arg="auto">Auto</button>${pets}</div>
    <h3>Pacotes de roupas <span class="tag" style="background:var(--yolk);color:var(--yolk-ink)">Simulação</span></h3><p class="muted">No app da loja viram compras do Google Play. Roupas de evento só saem jogando: o prêmio final de cada semana temática.</p>${pacotes}</div>`);
}
Object.assign(ACOES, {
  perfil() { modalPerfil(); },
  vestir(id) { const r = equiparRoupa(S, id); if (!r.ok) return; salvar(); modalPerfil(); render(); Som.play('bau'); },
  perfilSexo(v) { mudarAvatar(S, 'sexo', v); salvar(); modalPerfil(); render(); },
  perfilPele(v) { mudarAvatar(S, 'pele', +v); salvar(); modalPerfil(); render(); },
  companheiro(id) { escolherCompanheiro(S, id); salvar(); modalPerfil(); },
  pacoteRoupa(id) { const r = comprarPacoteRoupa(S, id); if (!r.ok) return toast('Você já tem esse pacote'); metrica('compra_simulada'); salvar(); render(); modalPerfil(); toast('Pacote adquirido (simulação): +' + r.gemas + ' gemas'); }
});
