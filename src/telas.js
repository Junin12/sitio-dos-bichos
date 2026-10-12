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
  const seg = segHTML('subO', subO, [['obras', 'Obras'], ['horta', 'Horta'], ['decor', 'Decoração']]);
  return seg + (subO === 'horta' ? viewHorta() : subO === 'decor' ? viewDecor() : viewObras());
}
function viewHorta() {
  if (S.nivel < CULTIVOS.cenoura.nivel) return `<section class="card"><h2>Horta</h2><p class="muted">Plante legumes e frutas, colha e entregue aos clientes por moedas e gemas. Libera no nível ${CULTIVOS.cenoura.nivel}.</p></section>`;
  const now = Date.now();
  const disp = Object.keys(CULTIVOS).filter(id => CULTIVOS[id].nivel <= S.nivel);
  const parcelas = S.horta.map((p, i) => {
    if (!p) return `<div class="card parcela"><div class="between"><h3>Canteiro ${i + 1}</h3><span class="muted">livre</span></div><div class="row wrap">${disp.map(id => { const c = CULTIVOS[id], custo = custoSemente(S, id); return `<button class="btn mini ghost" data-act="plantar" data-arg="${i}:${id}" ${S.coins < custo ? 'disabled' : ''}>${c.em} ${fmt(custo)}</button>`; }).join('')}</div><p class="muted">Escolha o que plantar. ${disp.map(id => CULTIVOS[id].em + ' ' + duracao(CULTIVOS[id].tempo)).join(' · ')}</p></div>`;
    const c = CULTIVOS[p.id], pronto = now >= p.pronto;
    return `<div class="card parcela ${pronto ? 'pronto' : ''}"><div class="between"><h3>${c.em} ${c.nome}</h3><span class="muted num"><span data-hort="${i}" data-ready="${pronto ? 1 : 0}">${pronto ? 'Pronto!' : mmss(p.pronto - now)}</span></span></div>
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
    <section class="card"><h3>Prêmios</h3>${premios}</section>`;
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
    <section class="card"><h2>Lembretes</h2><p class="muted">Avisos de ovo pronto, celeiro cheio, horta e bônus diário. No app instalado pela loja eles chegam com o jogo fechado; no navegador, só enquanto o jogo estiver aberto ou em segundo plano.</p>
      <button class="btn ${S.cfg.notif ? 'ghost' : 'primary'}" data-act="notif" ${nStat === 'denied' || nStat === 'nao' ? 'disabled' : ''}>${S.cfg.notif ? 'Desligar lembretes' : notifTxt}</button></section>
    <section class="card"><h2>Convidar amigos</h2><p class="muted">Quem entra pelo seu link ganha 10 gemas, e você ganha 15 gemas por amigo que chegar ao nível 3 (até 20 amigos).</p>${conv}
      <div class="row"><button class="btn primary" data-act="convidar">Compartilhar convite</button>${on ? '<button class="btn ghost" data-act="convResg">Resgatar prêmios</button>' : ''}</div>
      ${on ? '' : '<p class="muted">Entre no modo online para ter seu código pessoal.</p>'}</section>
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
    try { if (cap()) cap().cancel({ notifications: [1, 2, 3, 4, 5].map(id => ({ id })) }); } catch (e) {}
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
  if (now - ultHort > 4000) { ultHort = now; ajustarTudo(S, now); }
}
function temPendenciaMetas() {
  const now = Date.now();
  return S.pedidos.some(p => p && podeEntregar(S, p) && now <= p.ate) || EVT_METAS.some((m, k) => !S.evt.res[k] && S.evt.pts >= m && S.nivel >= 3);
}
function hortaPronta() { const now = Date.now(); return S.horta.some(p => p && now >= p.pronto); }

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
    receber(r.ups); salvar(); render(); metrica('evento_semana');
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

/* Guilda contra guilda no modo offline: as três guildas simuladas disputam entre si. */
function viewGuildasSim() {
  const now = Date.now();
  const lista = GUILDAS.map(g => { let t = 0; for (let i = 0; i < N_MEMBROS; i++) t += pontosMembro(g.id, i, now); if (S.guilda.id === g.id) t += S.guilda.pontos; return { nome: g.nome, pontos: t, minha: S.guilda.id === g.id }; }).sort((a, b) => b.pontos - a.pontos);
  return `<section class="card"><h2>Guilda contra guilda</h2><p class="muted">No modo online, guildas de jogadores reais disputam o pódio da semana e ganham prêmios. Aqui, as três guildas simuladas mostram como funciona.</p></section>
    <section class="card">${lista.map((x, k) => `<div class="mrow ${x.minha ? 'eu' : ''}"><span class="pos">${k + 1}</span><span class="who"><b>${x.nome}</b></span><span class="pts num">${fmt(x.pontos)}</span><span></span></div>`).join('')}</section>`;
}
