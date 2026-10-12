function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
function simula(intMin,horas,seed){
  const rng=mulberry(seed); const t0=Date.UTC(2026,9,12,12,0,0);
  const S=novoEstado(t0); let agora=t0; const passo=intMin*60000, fim=t0+horas*HORA; const marcos={}; let ult=1; const safM={};
  let ultSaf=1;
  while(agora<fim){
    agora+=passo; avancar(S,agora);
    for(let i=0;i<S.eggs.length;i++) abrirOvo(S,i,agora,rng);
    for(let i=0;i<3;i++) resgatarMissao(S,i,false);
    resgatarDiario(S,diaDe(agora),false);
    // missões 'anuncio'/'melhor' avançam sozinhas via eventos; anuncio: bot assiste se houver
    for(const m of S.missoes) if(m&&m.t==='anuncio'&&!m.feita){anuncioVisto(S,'missao');}
    coletar(S,1);
    if(S.nivel>=5&&S.guilda.id<0) entrarGuilda(S,0,agora);
    if(S.guilda.id>=0){ for(let b=0;b<4;b++) resgatarBau(S,b,agora); for(let i=0;i<N_MEMBROS;i++) ajudar(S,i,agora); }
    let gastou=true,guard=0;
    while(gastou&&guard++<60){
      gastou=false;
      if(comprarPasto(S).ok){gastou=true;continue;}
      let melhor=null,mc=Infinity;
      for(const id in OBRAS){ if(S.nivel>=OBRAS[id].nivel&&S.obras[id]<OBRAS[id].max&&S.nivel>=nivelParaObra(S.obras[id])){const c=custoObra(id,S.obras[id]); if(c<mc){mc=c;melhor=id;}}}
      if(melhor&&S.coins>=mc){melhorarObra(S,melhor);gastou=true;continue;}
      const ce=custoOvo(S,'palha'); const reserva=melhor?Math.min(mc*0.3,ce*4):0;
      if(S.nivel>=5&&S.gems>=5&&S.eggs.some(e=>!e)){ if(comprarOvo(S,'dourado',agora).ok){gastou=true;continue;} }
      if(S.coins>=ce+reserva&&S.eggs.some(e=>!e)){ if(comprarOvo(S,'palha',agora).ok) gastou=true; }
    }
    // doação: com sobra grande
    if(S.guilda.id>=0&&S.coins>200000){ doar(S,Math.floor(S.coins*0.1),agora); }
    while(ult<S.nivel){ult++;marcos[ult]=Math.round((agora-t0)/60000);}
    while(ultSaf<S.safra){ultSaf++; if(ultSaf%10===0) safM[ultSaf]=Math.round((agora-t0)/60000);}
  }
  return {S,marcos,safM,agora};
}
function resumo(intMin,horas){
  const r=simula(intMin,horas,42), S=r.S;
  const mk=n=>r.marcos[n]!==undefined?(r.marcos[n]>=120?(r.marcos[n]/60).toFixed(1)+'h':r.marcos[n]+'min'):'—';
  const rk=rankingSitios(S,r.agora).find(x=>x.voce).pos;
  console.log(`check a cada ${intMin}min por ${horas}h -> nivel ${S.nivel} | Lv3 ${mk(3)} Lv5 ${mk(5)} Lv10 ${mk(10)} Lv15 ${mk(15)} Lv20 ${mk(20)} Lv30 ${mk(30)} | safra ${S.safra} | pets ${Object.keys(S.pets).length}/${PETS.length} | prod ${prodTotal(S).toFixed(1)}/s | obras ${JSON.stringify(S.obras)} | guilda nv ${S.guilda.nivel} doado ${S.guilda.doado} | rank ${rk}/51 | coins ${Math.round(S.coins)}`);
}
resumo(40,72); resumo(180,720); resumo(480,1440);
// sanidade social
{
  const S=novoEstado(Date.UTC(2026,9,12,12)); S.nivel=5; const now=Date.UTC(2026,9,14,9);
  console.log(entrarGuilda(S,1,now).ok, 'meta semana', metaSemana(S), 'total sem player', totalSemana(S,now), 'horasSemana', horasSemana(now).toFixed(1));
  console.log(muralEventos(S,now,3).map(e=>e.txt));
  console.log(membrosOrdenados(S,now).slice(0,4).map(m=>m.nome+':'+m.pontos).join(' | '));
  console.log('rank top3', rankingSitios(S,now).slice(0,3).map(x=>x.nome+':'+x.poder).join(' | '));
  // semana vira: reset
  S.guilda.pontos=500; S.guilda.baus=[1,1,0,0]; atualizarGuilda(S,now+8*DIA); console.log('apos virar semana',S.guilda.pontos,S.guilda.baus);
  console.log('parabenizar', parabenizar(S,123,now).ok, parabenizar(S,123,now).erro);
}

/* ===== regras novas ===== */
(function () {
  const assert = (c, m) => { if (!c) { console.log('FALHOU:', m); process.exitCode = 1; } };
  const t0 = Date.UTC(2026, 9, 12, 12, 0, 0), rng = mulberry(7);
  // catálogo só com animais reais e ids únicos
  const todos = PETS.concat(PETS_EVENTO), ids = new Set(todos.map(p => p.id));
  assert(ids.size === todos.length, 'ids únicos');
  for (const f of ['unicornio', 'dragao']) assert(!ids.has(f), 'sem bicho fantasioso ' + f);
  for (const k in PET_MIGRA) assert(PET_POR_ID[PET_MIGRA[k]], 'migração ' + k);
  for (let r = 0; r < 5; r++) assert(PETS.filter(p => p.r === r).length >= 6, 'raridade ' + r + ' com opções');
  assert(ids.has('dino') && ids.has('mamute') && ids.has('trex'), 'pré-históricos reais presentes'); assert(PETS.length >= 35 && PETS_EVENTO.length === EVENTOS.length, 'tamanho do catálogo');
  EVENTOS.forEach(e => assert(PETS_EVENTO.some(p => p.id === e.pet), 'pet do evento ' + e.id));
  // cuidar
  let S = novoEstado(t0); aplicarPet(S, 'coelho'); S.ts = t0;
  assert(felicidade(S, 'coelho') === 0, 'sem carinho = 0');
  const p0 = prodTotal(S);
  assert(cuidar(S, 'coelho', t0, 'carinho').ok, 'carinho ok');
  assert(prodTotal(S) > p0, 'bicho feliz produz mais');
  assert(cuidar(S, 'coelho', t0 + 1000, 'carinho').erro === 'espera', 'carinho tem espera');
  assert(cuidar(S, 'coelho', t0 + 5 * HORA, 'carinho').ok, 'carinho depois de 5h');
  S.ts = t0 + 60 * HORA; assert(felicidade(S, 'coelho') === 0, 'felicidade decai');
  assert(renomear(S, 'coelho', '  Bolinha<script> ').nome === 'Bolinhascript', 'nome limpo');
  assert(renomear(S, 'coelho', 'Nome muito muito comprido demais').nome.length <= 14, 'nome curto');
  assert(renomear(S, 'coelho', '').nome === 'Coelho', 'nome volta ao padrão');
  assert(renomear(S, 'leao', 'x').erro === 'sem', 'não renomeia o que não tem');
  // horta e pedidos
  S = novoEstado(t0); S.nivel = 4; S.coins = 1e6; ajustarTudo(S, t0, rng);
  assert(S.horta.length === 2, 'duas parcelas no nível 4');
  assert(plantar(S, 0, 'tomate', t0).erro === 'nivel', 'tomate exige nível');
  assert(plantar(S, 0, 'cenoura', t0).ok, 'planta cenoura');
  assert(plantar(S, 0, 'cenoura', t0).erro === 'ocupada', 'parcela ocupada');
  assert(colherHorta(S, 0, t0 + 1000).erro === 'cedo', 'ainda não deu');
  assert(adubar(S, 0, t0).ok && S.horta[0].pronto - t0 === 60000, 'adubo corta metade');
  const c = colherHorta(S, 0, t0 + 61000); assert(c.ok && S.colheita.cenoura === c.qtd, 'colheu');
  assert(S.pedidos.every(p => p && p.ate > t0), 'três pedidos criados');
  S.pedidos[0] = { t: 'colheita', id: 'cenoura', qtd: 2, rec: { coins: 500, xp: 5, gems: 1 }, ate: t0 + HORA, cliente: 'X', em: '👵' };
  const antes = S.coins; assert(entregarPedido(S, 0, t0 + 62000).ok && S.coins > antes && S.colheita.cenoura === c.qtd - 2, 'entrega pedido');
  S.pedidos[1] = { t: 'colheita', id: 'milho', qtd: 9, rec: { coins: 1, xp: 1, gems: 0 }, ate: t0 + HORA, cliente: 'X', em: '👵' };
  assert(entregarPedido(S, 1, t0 + 62000).erro === 'falta', 'falta mercadoria');
  assert(entregarPedido(S, 1, t0 + 2 * HORA).erro === 'expirou', 'pedido vencido');
  ajustarPedidos(S, t0 + 2 * HORA, rng); assert(S.pedidos[1].ate > t0 + 2 * HORA, 'pedido vencido é trocado');
  aplicarPet(S, 'cachorro'); aplicarPet(S, 'cachorro');
  S.pedidos[2] = { t: 'bicho', r: 0, lvl: 2, rec: { coins: 700, xp: 5, gems: 1 }, ate: t0 + 3 * HORA, cliente: 'Y', em: '🧓' };
  assert(entregarPedido(S, 2, t0 + 2 * HORA).ok && S.pets.cachorro, 'pedido de bicho não consome o bicho');
  // evento semanal
  S = novoEstado(t0); S.nivel = 5; ajustarEvento(S, t0);
  const ev = eventoDaSemana(t0); assert(ev && PET_POR_ID[ev.pet], 'evento da semana');
  assert(eventoDaSemana(t0 + 7 * DIA).id !== ev.id, 'evento muda na semana seguinte');
  assert(resgatarEvento(S, 0, t0).erro === 'meta', 'sem pontos');
  S.evt.pts = EVT_METAS[3]; for (let k = 0; k < 4; k++) assert(resgatarEvento(S, k, t0).ok, 'marco ' + k);
  assert(S.pets[ev.pet], 'ganhou o bicho do evento'); assert(resgatarEvento(S, 3, t0).erro === 'ja', 'marco só uma vez');
  ajustarEvento(S, t0 + 7 * DIA); assert(S.evt.pts === 0 && S.evt.res.every(x => !x), 'zera na semana nova');
  S = novoEstado(t0); S.nivel = 5; ajustarEvento(S, t0);
  for (let i = 0; i < 3; i++) { S.eggs[0] = { tipo: 'palha', pronto: t0 }; abrirOvo(S, 0, t0, rng); }
  assert(S.evt.pts >= 9, 'chocar dá ponto de evento');
  // baú e ovo brilhante
  S = novoEstado(t0); const hoje = diaDe(t0);
  assert(!bauPrecisaAnuncio(S, hoje), 'primeiro baú é de graça');
  assert(abrirBau(S, hoje, rng).ok && bauPrecisaAnuncio(S, hoje), 'segundo exige anúncio');
  abrirBau(S, hoje, rng); abrirBau(S, hoje, rng); assert(abrirBau(S, hoje, rng).erro === 'limite', 'limite diário do baú');
  assert(abrirBau(S, hoje + 1, rng).ok, 'baú volta no outro dia');
  assert(ganharOvoBrilho(S, hoje, t0).erro === 'nivel', 'ovo brilhante exige nível');
  S.nivel = 3; ajustarIncubadoras(S); S.eggs = [null, null];
  assert(ganharOvoBrilho(S, hoje, t0).ok && S.eggs[0].tipo === 'brilhante', 'ganha ovo brilhante');
  assert(ganharOvoBrilho(S, hoje, t0).erro === 'ja', 'um por dia');
  const o = abrirOvo(S, 0, t0 + 60000, rng); assert(o && o.r >= 1, 'ovo brilhante nunca vem comum');
  // premium, decoração, temas
  S = novoEstado(t0); aplicarPet(S, 'coelho'); const pb = prodTotal(S);
  comprarPremium(S, 'passe'); assert(Math.abs(prodTotal(S) / pb - 1.25) < 1e-9, 'passe +25%');
  S.nivel = 2; S.coins = 1000; assert(comprarDecor(S, 'girassol').ok && bonusDecor(S) === 0.01, 'decoração dá bônus');
  assert(comprarDecor(S, 'girassol').erro === 'ja', 'decoração única');
  assert(comprarDecor(S, 'lago').erro === 'nivel', 'decoração exige nível');
  assert(estacaoDe(Date.UTC(2026, 0, 15)) === 'verao' && estacaoDe(Date.UTC(2026, 6, 15)) === 'inverno' && estacaoDe(Date.UTC(2026, 9, 12)) === 'primavera', 'estações do hemisfério sul');
  S.tema = 'outono'; assert(temaAtual(S, t0) === 'outono', 'tema manual');
  // prestígio
  S = novoEstado(t0); aplicarPet(S, 'leao'); S.nivel = 24; S.coins = 99;
  assert(prestigiar(S, t0).erro === 'nivel', 'prestígio exige nível');
  S.nome = 'Ana'; S.visto = true; S.nivel = NIVEL_PRESTIGIO; S.obras.celeiro = 5; S.gems = 10; comprarPremium(S, 'semAnuncios'); S.decor.girassol = 1;
  const r = prestigiar(S, t0); assert(r.ok && S.prest === 1, 'prestigiou');
  assert(S.nivel === 1 && S.obras.celeiro === 0 && S.coins === 240, 'reinicia progresso');
  assert(S.pets.leao && S.premium.semAnuncios && S.decor.girassol, 'mantém álbum, premium e decoração'); assert(S.nome === 'Ana' && S.visto, 'mantém nome e sinal de visto');
  assert(S.gems === 10 + r.gems + 5 - 5 || S.gems >= 10 + r.gems - 5, 'ganha gemas');
  assert(Math.abs(multProd(S) / multMoinho(0) / (1 + bonusSets(S)) / (1 + bonusDecor(S)) - 1.25) < 1e-9, 'multiplicador permanente');
  console.log('regras novas: ok');
})();

/* ===== mecânicas de longo prazo ===== */
(function () {
  const assert = (c, m) => { if (!c) { console.log('FALHOU:', m); process.exitCode = 1; } };
  const t0 = Date.UTC(2026, 9, 12, 12, 0, 0), rng = mulberry(11);
  let S = novoEstado(t0); S.ts = t0;
  // ingressos e lote
  S.nivel = 4; S.ing = 10; assert(sortearLote(S, 'ingresso', rng).erro === 'nivel', 'lote exige nível');
  S.nivel = 5; ganharIng(S, 0); S.ing = 9; assert(sortearLote(S, 'ingresso', rng).erro === 'ingressos', 'faltam ingressos');
  S.ing = 10; const l = sortearLote(S, 'ingresso', rng);
  assert(l.ok && l.lista.length === 10 && S.ing === 0 && S.summons === 10, 'lote de 10');
  assert(l.lista.some(x => x.r >= 2), 'lote garante Raro'); assert(Object.keys(S.pets).length >= 3, 'lote entrega bichos');
  S.gems = 34; assert(sortearLote(S, 'gemas', rng).erro === 'gemas', 'lote por gemas'); S.gems = 35; const gl = sortearLote(S, 'gemas', rng); assert(gl.ok && S.gems === 0 + gl.ups.reduce((a, u) => a + u.gems, 0), 'lote paga gemas');
  let raros = 0, n = 0; for (let i = 0; i < 300; i++) { const T = novoEstado(t0); T.nivel = 5; T.ing = 10; const r = sortearLote(T, 'ingresso', rng); n += 10; raros += r.lista.filter(x => x.r >= 3).length; }
  assert(raros / n > 0.04 && raros / n < 0.2, 'taxa de Épico+ do lote plausível: ' + (raros / n).toFixed(3));
  // ingressos vêm de missão, diário e baú
  S = novoEstado(t0); S.ts = t0; S.missoes[0].feita = true; resgatarMissao(S, 0, false); assert(S.ing === 1, 'missão dá ingresso');
  S = novoEstado(t0); S.diario = { ultimo: diaDe(t0) - 1, seq: 6 }; resgatarDiario(S, diaDe(t0), false); assert(S.ing === 3, 'dia 7 dá 3 ingressos');
  // oficina
  S = novoEstado(t0); S.ts = t0; S.nivel = 6; S.coins = 1e6; aplicarPet(S, 'leao'); ajustarTudo(S, t0, rng);
  assert(S.oficina.length === 1, 'uma vaga na oficina'); assert(iniciarReceita(S, 0, 'pao', t0).erro === 'nivel', 'receita exige nível');
  const c0 = S.coins, custo = custoReceita(S, 'queijo'); assert(iniciarReceita(S, 0, 'queijo', t0).ok && S.coins === c0 - custo, 'inicia receita');
  assert(iniciarReceita(S, 0, 'queijo', t0).erro === 'ocupada', 'vaga ocupada'); assert(colherReceita(S, 0, t0 + 1000).erro === 'cedo', 'receita no forno');
  assert(acelerarReceita(S, 0, t0).ok && S.oficina[0].fim - t0 === 150000, 'anúncio corta pela metade');
  const cr = colherReceita(S, 0, t0 + 150000); assert(cr.ok && cr.coins > custo, 'receita dá lucro'); assert(S.oficina[0] === null, 'vaga livre');
  S.nivel = 14; ajustarTudo(S, t0, rng); assert(S.oficina.length === 2, 'segunda vaga no nível 14');
  S.nivel = 20; ajustarTudo(S, t0, rng); assert(S.oficina.length === 3, 'terceira vaga no nível 20');
  // pesquisa
  S = novoEstado(t0); S.ts = t0; S.nivel = 8; S.coins = 1e7; aplicarPet(S, 'leao'); const prod0 = prodTotal(S), cap0 = capCeleiro(S);
  assert(iniciarPesquisa(S, 'prod', t0).ok, 'inicia pesquisa'); assert(iniciarPesquisa(S, 'silo', t0).erro === 'ocupada', 'uma pesquisa por vez');
  assert(ajustarPesquisa(S, t0 + 1000) === null, 'ainda pesquisando');
  assert(acelerarPesquisa(S, t0).ok && S.pesq.at.fim - t0 === 300000, 'anúncio acelera pesquisa');
  assert(ajustarPesquisa(S, t0 + 300000) === 'prod' && pq(S, 'prod') === 1, 'conclui pesquisa'); assert(Math.abs(prodTotal(S) / prod0 - 1.05) < 1e-9, 'pesquisa dá +5%');
  assert(iniciarPesquisa(S, 'prod', t0 + 4e5).erro === 'cap', 'nível limita a pesquisa'); S.pesq.n.silo = 2; assert(capCeleiro(S) > cap0, 'silo aumenta o celeiro');
  const co = custoOvo(S, 'palha'); S.pesq.n.ovos = 4; assert(custoOvo(S, 'palha') < co, 'ovos mais baratos');
  // combos
  S = novoEstado(t0); ['trex', 'dino'].forEach(id => aplicarPet(S, id)); assert(bonusCombos(S) === 0, 'combo incompleto');
  aplicarPet(S, 'mamute'); assert(Math.abs(bonusCombos(S) - 0.2) < 1e-9, 'combo pré-história +20%');
  for (const c of COMBOS) for (const id of c.ids) assert(PET_POR_ID[id], 'combo ' + c.id + ' usa bicho real ' + id);
  // cruzamento
  S = novoEstado(t0); S.ts = t0; S.nivel = 10; S.coins = 1e7; aplicarPet(S, 'coelho'); aplicarPet(S, 'gato');
  assert(iniciarCruz(S, 'coelho', 'gato', t0).erro === 'lvl', 'pais precisam de nível 3');
  S.pets.coelho.lvl = 3; S.pets.gato.lvl = 3; assert(iniciarCruz(S, 'coelho', 'coelho', t0).erro === 'par', 'precisa de dois bichos');
  assert(iniciarCruz(S, 'coelho', 'gato', t0).ok && S.cruz, 'inicia cruzamento'); assert(abrirCruz(S, t0 + 1000, rng).erro === 'cedo', 'ainda não nasceu');
  assert(acelerarCruz(S, t0).ok && S.cruz.pronto - t0 === 1800000, 'anúncio acelera cruzamento');
  const ab = abrirCruz(S, t0 + 1800000, rng); assert(ab.ok && ab.r >= 0 && S.pets[ab.pet.id] && !S.cruz, 'cruzamento entrega bicho');
  let sobe = 0; for (let i = 0; i < 400; i++) { const T = novoEstado(t0); T.nivel = 10; aplicarPet(T, 'coelho'); aplicarPet(T, 'gato'); T.cruz = { a: 'coelho', b: 'gato', pronto: t0 }; if (abrirCruz(T, t0, rng).r > 0) sobe++; }
  assert(sobe > 20 && sobe < 120, 'chance de subir de raridade plausível: ' + sobe + '/400');
  // evolução
  S = novoEstado(t0); S.ts = t0; S.coins = 1e9; aplicarPet(S, 'leao'); assert(evoluir(S, 'leao').erro === 'lvl', 'evolução exige nível máximo');
  S.pets.leao.lvl = LVL_MAX; assert(evoluir(S, 'leao').erro === 'frag', 'faltam fragmentos');
  const p1 = prodTotal(S); for (let i = 0; i < 3; i++) assert(aplicarPet(S, 'leao').frag, 'repetido no máximo dá fragmento');
  assert(S.pets.leao.frag === 3, 'fragmentos acumulam'); assert(evoluir(S, 'leao').ok && estagio(S, 'leao') === 1, 'evolui'); assert(Math.abs(prodTotal(S) / p1 - 1.5) < 1e-9, 'estágio 1 dá +50%');
  S.pets.leao.frag = 99; evoluir(S, 'leao'); evoluir(S, 'leao'); assert(estagio(S, 'leao') === 3 && evoluir(S, 'leao').erro === 'max', 'estágio máximo 3');
  // conquistas
  S = novoEstado(t0); S.ts = t0; S.stats.chocados = 60; assert(conqProntas(S) >= 1, 'conquista pronta');
  const g0 = S.gems; assert(resgatarConq(S, 'ovos').ok && S.conq.ovos === 1 && S.gems === g0 + 3, 'resgata a faixa 1'); assert(conqEstado(S, CONQS[0]).pronta, 'faixa 2 também (60 ≥ 50)');
  assert(resgatarConq(S, 'ovos').ok && S.ing === 1, 'faixa 2 dá ingresso'); assert(resgatarConq(S, 'ovos').erro === 'meta', 'faixa 3 ainda não');
  // chefe da guilda (offline)
  S = novoEstado(t0); S.ts = t0; S.nivel = 8; ajustarTudo(S, t0, rng); assert(golpearChefeSim(S, t0).erro === 'sem_guilda', 'sem guilda sem chefe');
  entrarGuilda(S, 0, t0); S.guilda.nivel = 1; aplicarPet(S, 'leao'); const e0 = chefeEstadoSim(S, t0);
  assert(e0.hp === 250000 && e0.golpes_hoje === 0, 'estado do chefe'); assert(chefeGratisRest(S, t0) === 3, '3 golpes grátis');
  for (let i = 0; i < 6; i++) assert(golpearChefeSim(S, t0).ok, 'golpe ' + i); assert(golpearChefeSim(S, t0).erro === 'limite_diario', 'limite de 6 golpes');
  assert(golpearChefeSim(S, t0 + DIA).ok, 'golpes voltam no dia seguinte'); assert(chefeEstadoSim(S, t0).meu_dano === S.chefe.dano, 'dano acumulado');
  S.chefe.dano = 300000; assert(chefeEstadoSim(S, t0).derrotado, 'derrotado'); const rc = resgatarChefeSim(S, t0); assert(rc.ok && S.gems >= 8, 'prêmio do chefe'); assert(resgatarChefeSim(S, t0).erro === 'ja', 'prêmio só uma vez');
  ajustarExtras(S, t0 + 8 * DIA); assert(S.chefe.dano === 0 && !S.chefe.res, 'chefe novo na semana seguinte'); assert(chefeDaSemana(semanaDe(t0)).nome !== chefeDaSemana(semanaDe(t0) + 1).nome, 'chefe muda');
  // corrida de 48 h
  S = novoEstado(t0); S.ts = t0; S.nivel = 3; ajustarExtras(S, t0); pontoCorrida(S, 50); assert(S.corrida.pts === 50, 'pontos da corrida');
  assert(resgatarCorrida(S, 0, t0).ok && resgatarCorrida(S, 0, t0).erro === 'ja' && resgatarCorrida(S, 1, t0).erro === 'meta', 'metas da corrida');
  assert(corridaResta(t0) > 0 && corridaResta(t0) <= 2 * 86400, 'tempo restante da corrida'); ajustarExtras(S, t0 + 2 * DIA); assert(S.corrida.pts === 0, 'corrida zera a cada 48 h');
  const rk = corridaSim(S, t0 + DIA); assert(rk.length === 13 && rk.some(x => x.voce), 'ranking simulado da corrida');
  S.nivel = 2; S.ts = t0; pontoCorrida(S, 10); assert(S.corrida.pts === 0, 'corrida exige nível 3');
  // pontos de evento e corrida andam juntos; prestígio mantém pesquisa e conquistas
  S = novoEstado(t0); S.ts = t0; S.nivel = 25; S.pesq.n.prod = 3; S.conq.ovos = 2; S.ing = 4; const pr = prestigiar(S, t0);
  assert(pr.ok && S.pesq.n.prod === 3 && S.conq.ovos === 2 && S.ing === 4, 'prestígio mantém pesquisa, conquistas e ingressos');
  // save antigo ganha os campos novos
  S = novoEstado(t0); delete S.oficina; delete S.pesq; delete S.conq; delete S.chefe; delete S.corrida; ajustarTudo(S, t0, rng);
  assert(Array.isArray(S.oficina) && S.pesq.n && S.conq && S.chefe && S.corrida, 'ajustarTudo completa saves antigos');
  console.log('mecânicas de longo prazo: ok');
  // perfil: roupas, pacotes, companheiro
  S = novoEstado(t0); S.ts = t0; ajustarTudo(S, t0, rng);
  assert(S.roupas.padrao && !S.roupas.gala && bichoDestaque(S) === null, 'perfil novo: só a roupa padrão e sem companheiro');
  S.nivel = 20; ajustarAvatar(S); assert(S.roupas.gala && S.roupas.junina, 'roupas de nível liberam sozinhas');
  assert(equiparRoupa(S, 'astro').erro === 'nao_tem' && equiparRoupa(S, 'gala').ok && S.avatar.roupa === 'gala', 'só veste o que tem');
  const gA = S.gems; assert(comprarPacoteRoupa(S, 'aventura').ok && S.roupas.astro && S.roupas.pirata && S.gems === gA + 30, 'pacote dá as roupas e gemas');
  assert(comprarPacoteRoupa(S, 'aventura').erro === 'ja' && comprarPacoteRoupa(S, 'x').erro === 'tipo', 'pacote não repete');
  aplicarPet(S, 'coelho'); aplicarPet(S, 'leao'); S.pets.coelho.est = 2;
  assert(bichoDestaque(S) === 'coelho', 'companheiro automático é o mais evoluído');
  assert(escolherCompanheiro(S, 'leao').ok && bichoDestaque(S) === 'leao' && escolherCompanheiro(S, 'dragao').erro === 'sem', 'escolher companheiro');
  assert(mudarAvatar(S, 'sexo', 'f').ok && mudarAvatar(S, 'pele', 9).erro === 'valor', 'aparência');
  S.evt = { sem: semanaDe(t0), pts: 999, res: [1, 1, 1, 0] }; const rv = resgatarEvento(S, 3, t0);
  assert(rv.ok && rv.roupa === 'evt:' + eventoDaSemana(t0).id && S.roupas[rv.roupa], 'prêmio final do evento dá a roupa do tema');
  S.nivel = 25; S.avatar.roupa = 'astro'; const rp = prestigiar(S, t0); assert(rp.ok && S.roupas.astro && S.avatar.roupa === 'astro' && S.roupas.lenda, 'prestígio mantém roupas e libera o manto');
  S = novoEstado(t0); delete S.avatar; delete S.roupas; ajustarTudo(S, t0, rng); assert(S.avatar.sexo === 'm' && S.roupas.padrao, 'save antigo ganha perfil');
  console.log('perfil e roupas: ok');
})();
