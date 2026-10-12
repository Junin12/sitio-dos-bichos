// Teste de ponta a ponta no navegador (Playwright + Chromium).
//   node tests/e2e.mjs            (precisa de: python3 build.py --online; Postgres local para a parte online)
// Variáveis: PLAYWRIGHT (caminho do pacote), CHROMIUM (executável), PGHOST/PGPORT/PGUSER (Postgres de teste).
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT || '/opt/npm-tools/node_modules/playwright');
const exe = process.env.CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const raiz = new URL('../', import.meta.url).pathname;
const b = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
let falhas = 0;
const ok = (c, m) => { if (!c) { falhas++; console.log('FALHOU:', m); } else console.log('ok:', m); };

async function abrir(arquivo, init) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 800 } });
  const p = await ctx.newPage(); const erros = [];
  p.on('pageerror', e => erros.push(e.message + ' @ ' + String(e.stack).split('\n').slice(1, 3).join(' <- ')));
  await p.route(/googleapis|gstatic|jsdelivr/, r => r.abort());
  if (init) await init(p);
  await p.goto('file://' + raiz + arquivo); await p.waitForTimeout(400);
  p.erros = erros; return p;
}
const bom = async (p, tag) => ok(p.erros.length === 0, tag + ' sem erros de JS ' + p.erros.join('|'));

/* ---------- offline: saves antigos, regras na tela, tutorial ---------- */
{
  const antigo = JSON.stringify({ v: 1, ts: Date.now() - 3600e3, coins: 500, gems: 7, nivel: 8, xp: 0, slots: 4, visto: true, pets: { dragao: { lvl: 3 }, unicornio: { lvl: 2 }, coelho: { lvl: 1 }, mamute: { lvl: 5 }, bicho_falso: { lvl: 1 } }, eggs: [{ tipo: 'dourado', pronto: 0 }, null, null], obras: { celeiro: 2, chocadeira: 1, moinho: 1, estufa: 0 } });
  const p = await abrir('sitio-dos-bichos.html', pg => pg.addInitScript(s => { localStorage.setItem('sitio-dos-bichos.v1', s); }, antigo));
  const pets = await p.evaluate(() => Object.keys(S.pets).sort());
  ok(JSON.stringify(pets) === JSON.stringify(['arara', 'cisne', 'coelho', 'mamute']), 'unicórnio e dragão migrados para animais reais: ' + pets);
  ok(await p.evaluate(() => S.pets.arara.lvl === 3 && S.pets.mamute.lvl === 5), 'níveis preservados na migração');
  ok(await p.evaluate(() => Array.isArray(S.horta) && S.horta.length === 3 && S.pedidos.every(x => x)), 'horta e pedidos criados no save antigo');
  await p.evaluate(() => { S.tut.fim = true; fecharModal(); });
  // cuidar do bicho pela tela
  await p.evaluate(() => ACOES.aba('sitio')); await p.waitForTimeout(300);
  await p.click('.slot >> nth=0'); await p.waitForTimeout(200);
  ok(await p.isVisible('#petNome'), 'modal do bicho abre ao tocar no pasto');
  await p.fill('#petNome', 'Bolinha'); await p.click('text=Salvar nome');
  ok(await p.evaluate(() => Object.values(S.pets).some(x => x.nome === 'Bolinha')), 'bicho renomeado');
  await p.click('[data-act="carinho"]'); ok(await p.evaluate(() => Object.values(S.pets).some(x => x.carinho)), 'carinho registrado');
  await p.evaluate(() => fecharModal());
  // horta + pedido
  await p.evaluate(() => { S.coins = 1e6; ACOES.aba('obras'); ACOES.subO('horta'); }); await p.waitForTimeout(200);
  await p.click('[data-act="plantar"][data-arg="0:cenoura"]');
  ok(await p.evaluate(() => !!S.horta[0]), 'plantou cenoura pela tela');
  await p.evaluate(() => { S.horta[0].pronto = Date.now() - 1; render(); }); await p.click('[data-act="colher"]');
  ok(await p.evaluate(() => S.colheita.cenoura >= 2), 'colheu');
  await p.evaluate(() => { S.pedidos[0] = { t: 'colheita', id: 'cenoura', qtd: 2, rec: { coins: 777, xp: 3, gems: 1 }, ate: Date.now() + 3600e3, cliente: 'Teste', em: '👵' }; ACOES.aba('metas'); ACOES.subM('pedidos'); });
  await p.waitForTimeout(200); const c0 = await p.evaluate(() => S.coins);
  await p.click('[data-act="entregar"][data-arg="0"]'); ok(await p.evaluate(c => S.coins >= c + 777, c0), 'pedido entregue pela tela');
  // evento + baú + premium sem anúncio
  await p.evaluate(() => { ACOES.aba('sitio'); S.evt.pts = 500; }); await p.waitForTimeout(250);
  await p.evaluate(() => { ACOES.aba('metas'); ACOES.subM('evento'); }); await p.waitForTimeout(150);
  for (let k = 0; k < 4; k++) { await p.evaluate(k => ACOES.evtResg(k), k); await p.evaluate(() => fecharModal()); }
  ok(await p.evaluate(() => { const e = eventoDaSemana(Date.now()); return !!S.pets[e.pet] && S.evt.res.every(x => x); }), 'bicho exclusivo do evento recebido');
  await p.evaluate(() => { S.premium.semAnuncios = true; ACOES.aba('sitio'); }); await p.waitForTimeout(150);
  const g0 = await p.evaluate(() => S.gems); await p.evaluate(() => ACOES.gemasGratis()); await p.waitForTimeout(100);
  ok(await p.evaluate(g => S.gems === g + 2 && MODAL.hidden, g0), 'sem anúncios: recompensa direta, sem modal');
  // prestígio pela tela
  await p.evaluate(() => { S.nivel = 25; ACOES.aba('ajustes'); }); await p.waitForTimeout(200);
  await p.click('[data-act="prestigio"]'); await p.click('[data-act="prestigio"]'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => S.prest === 1 && S.nivel === 1 && Object.keys(S.pets).length >= 4), 'prestígio mantém bichos e zera nível');
  await bom(p, 'offline');
  // tutorial avança sozinho
  await p.evaluate(() => { S.tut = { passo: 0, fim: false }; fecharModal(); ACOES.aba('sitio'); }); await p.waitForTimeout(500);
  ok(await p.isVisible('#tut'), 'tutorial aparece');
  await p.click('#tutOk'); await p.waitForTimeout(500);
  ok(await p.evaluate(() => S.tut.passo >= 1), 'tutorial avança');
  await p.click('[data-act="tutPular"]'); await p.waitForTimeout(300);
  ok(!(await p.isVisible('#tut')), 'tutorial some ao pular');
  await p.evaluate(() => { S.cfg.eco = 'on'; aplicarEco(); });
  ok(await p.evaluate(() => document.body.classList.contains('eco')), 'modo econômico liga');
  await p.close();
}

/* ---------- offline: mecânicas de longo prazo pela tela ---------- */
{
  const save = JSON.stringify({ v: 2, ts: Date.now() - 600e3, coins: 5e7, gems: 100, nivel: 22, xp: 0, slots: 5, visto: true, tut: { passo: 9, fim: true }, ing: 12,
    pets: { coelho: { lvl: 10, frag: 3 }, gato: { lvl: 5 }, leao: { lvl: 4 }, trex: { lvl: 3 }, dino: { lvl: 2 } }, obras: { celeiro: 3, chocadeira: 2, moinho: 3, estufa: 2 }, guilda: { id: 0, entrou: Date.now() - 5 * 86400e3, doado: 0, nivel: 1, pontos: 40, semana: -1, baus: [0, 0, 0, 0], ajudou: {}, parab: {}, parabDia: { dia: -1, qtd: 0 } } });
  const p = await abrir('sitio-dos-bichos.html', pg => pg.addInitScript(s => { localStorage.setItem('sitio-dos-bichos.v1', s); }, save));
  await p.evaluate(() => fecharModal()); await p.waitForTimeout(200);
  ok(await p.isVisible('#chipIng'), 'ficha de ingressos aparece no topo');
  // sorteio em lote
  await p.evaluate(() => ACOES.aba('ovos')); await p.waitForTimeout(200);
  await p.click('[data-act="lote"][data-arg="ingresso"]'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => S.ing === 2 && S.stats.chocados >= 10), 'sorteio em lote gasta 10 ingressos');
  ok((await p.locator('.cgrid .cell').count()) === 10, 'lote mostra 10 bichos'); await p.evaluate(() => fecharModal());
  // cruzamento
  await p.evaluate(() => { S.coins = 5e7; ACOES.aba('ovos'); }); await p.waitForTimeout(200);
  await p.selectOption('#cruzA', 'gato'); await p.selectOption('#cruzB', 'leao'); await p.click('[data-act="cruzar"]'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => !!S.cruz && S.cruz.a === 'gato'), 'cruzamento iniciado pela tela');
  await p.evaluate(() => { S.cruz.pronto = Date.now() - 1; render(); }); await p.click('[data-act="cruzAbrir"]'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => !S.cruz && S.stats.cruzados === 1), 'filhote do cruzamento entregue'); await p.evaluate(() => fecharModal());
  // evolução pelo modal do bicho
  await p.evaluate(() => { S.pets.coelho.lvl = 10; S.pets.coelho.frag = 3; modalBicho('coelho'); }); await p.waitForTimeout(200);
  await p.click('[data-act="evoluir"]'); await p.waitForTimeout(250);
  ok(await p.evaluate(() => S.pets.coelho.est === 1), 'bicho evoluiu pela tela'); await p.evaluate(() => fecharModal());
  // oficina e pesquisa
  await p.evaluate(() => { ACOES.aba('obras'); ACOES.subO('oficina'); }); await p.waitForTimeout(200);
  await p.click('[data-act="receita"][data-arg^="0:queijo"]'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => !!S.oficina[0]), 'receita na bancada');
  await p.evaluate(() => { S.oficina[0].fim = Date.now() - 1; render(); }); await p.waitForTimeout(300);
  await p.click('[data-act="colherRec"]'); ok(await p.evaluate(() => S.oficina[0] === null && S.stats.receitas === 1), 'receita colhida');
  await p.evaluate(() => ACOES.subO('pesq')); await p.waitForTimeout(200);
  await p.click('[data-act="pesquisar"][data-arg="prod"]'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => !!S.pesq.at), 'pesquisa iniciada');
  await p.evaluate(() => { S.pesq.at.fim = Date.now() - 1; }); await p.waitForTimeout(4600);
  ok(await p.evaluate(() => pq(S, 'prod') === 1), 'pesquisa concluída sozinha');
  // conquistas, combos, eventos/corrida
  await p.evaluate(() => { S.stats.chocados = 60; ACOES.aba('metas'); ACOES.subM('missoes'); }); await p.waitForTimeout(250);
  await p.click('[data-act="conqResg"][data-arg="ovos"]'); ok(await p.evaluate(() => S.conq.ovos === 1), 'conquista resgatada pela tela');
  await p.evaluate(() => ACOES.subM('album')); await p.waitForTimeout(200); ok(await p.isVisible('text=Pré-história'), 'combos listados no álbum');
  await p.evaluate(() => { S.corrida.pts = 130; ACOES.subM('evento'); }); await p.waitForTimeout(250);
  ok(await p.isVisible('text=Corrida de 48 h'), 'corrida aparece em Eventos');
  await p.click('[data-act="corrResg"][data-arg="1"]'); ok(await p.evaluate(() => S.corrida.res[1] === 1), 'meta da corrida resgatada');
  // chefe da guilda
  await p.evaluate(() => { ACOES.aba('guilda'); ACOES.subG('chefe'); }); await p.waitForTimeout(250);
  await p.click('[data-act="chefeGolpe"]'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => S.chefe.dano > 0 && S.chefe.hoje === 1), 'golpe no chefe');
  for (let i = 0; i < 2; i++) await p.click('[data-act="chefeGolpe"]');
  await p.click('[data-act="chefeGolpe"]'); await p.waitForTimeout(150); ok(await p.isVisible('#adOk') || await p.isVisible('text=Anúncio simulado'), 'golpe extra pede anúncio');
  await p.evaluate(() => fecharModal());
  // o jogo segue sem erros em todas as abas
  for (const [a, f] of [['sitio'], ['ovos'], ['obras', 'horta'], ['obras', 'decor'], ['guilda'], ['metas'], ['ajustes']]) { await p.evaluate(([a, f]) => { ACOES.aba(a); if (f) ACOES.subO(f); }, [a, f]); await p.waitForTimeout(120); }
  // perfil do fazendeiro
  await p.evaluate(() => { fecharModal(); ACOES.aba('sitio'); }); await p.click('#hudRing'); await p.waitForTimeout(200);
  ok(await p.isVisible('.sheet.perfil .palco svg.avsvg'), 'perfil abre com o fazendeiro desenhado');
  await p.evaluate(() => { ganharRoupa(S, 'evt:mar'); modalPerfil(); }); await p.click('[data-act="vestir"][data-arg="evt:mar"]');
  ok(await p.evaluate(() => S.avatar.roupa === 'evt:mar'), 'vestir roupa do evento');
  await p.click('[data-act="pacoteRoupa"][data-arg="realeza"]'); ok(await p.evaluate(() => !!S.roupas.dino), 'pacote de roupas (simulado)');
  await p.click('[data-act="perfilSexo"][data-arg="f"]'); ok(await p.evaluate(() => S.avatar.sexo === 'f'), 'trocar para fazendeira');
  await p.evaluate(() => fecharModal());
  await bom(p, 'mecânicas novas offline');
  await p.close();
}


/* ---------- novidades III: sítio, vizinhos, selos, consentimento e bateria ---------- */
{
  const save = JSON.stringify({ v: 2, ts: Date.now() - 600e3, coins: 5e5, gems: 500, nivel: 14, xp: 0, slots: 6, visto: true, tut: { passo: 9, fim: true }, ing: 3,
    pets: { coelho: { lvl: 10 }, gato: { lvl: 5 }, leao: { lvl: 4 }, trex: { lvl: 3 }, ovelha: { lvl: 6 }, galinha: { lvl: 6 }, pintinho: { lvl: 6 }, arara: { lvl: 2 } }, obras: { celeiro: 3, chocadeira: 2, moinho: 3, estufa: 2 } });
  const p = await abrir('sitio-dos-bichos.html', async pg => {
    await pg.addInitScript(s => { localStorage.setItem('sitio-dos-bichos.v1', s);
      window.Capacitor = { Plugins: { AdMob: { initialize: async () => {}, prepareRewardVideoAd: async () => {}, showRewardVideoAd: async () => ({ amount: 1, type: 'x' }) } } };
      navigator.getBattery = async () => ({ charging: false, level: 0.1, addEventListener() {} }); }, save);
  });
  await p.waitForTimeout(600); await p.evaluate(() => fecharModal()); await p.waitForTimeout(200);
  ok(await p.isVisible('text=Como quer ver anúncios?'), 'consentimento aparece no app com AdMob');
  await p.click('[data-act="consentSet"][data-arg="np"]'); ok(await p.evaluate(() => S.cfg.consent === 'np' && MODAL.hidden), 'escolha de anúncios não personalizados salva');
  ok(await p.evaluate(() => document.body.classList.contains('eco')), 'bateria baixa liga o modo econômico no automático');
  // anúncio de verdade (adaptador) entrega a recompensa e conta no baú
  const n0 = await p.evaluate(() => S.bauAd.n); await p.evaluate(() => ACOES.coletar2x && ACOES.coletar2x()); await p.waitForTimeout(400);
  ok(await p.evaluate(n => S.bauAd.n === n + 1, n0), 'anúncio do adaptador conta no baú do dia');
  await p.evaluate(() => { aba = 'sitio'; render(); }); await p.waitForTimeout(200);
  ok(await p.isVisible('text=Baú dos anúncios') && await p.isVisible('text=no sítio'), 'cartões de estação e baú aparecem no sítio');
  const c0 = await p.evaluate(() => S.coins); await p.click('[data-act="cesta"]'); ok(await p.evaluate(c => S.coins > c && !cestaPronta(S, Date.now()), c0), 'cesta da estação pega pela tela');
  // oferta de iniciante
  ok(await p.isVisible('text=Oferta de iniciante'), 'oferta de iniciante visível'); await p.click('[data-act="oferta"]'); await p.click('[data-act="ofertaOk"]');
  ok(await p.evaluate(() => S.oferta.comprou && !!S.roupas.aprendiz), 'oferta comprada (simulação)');
  // selos: polir bicho no nível máximo
  const g0 = await p.evaluate(() => S.gems); await p.evaluate(() => modalBicho('coelho')); await p.click('[data-act="polir"]');
  ok(await p.evaluate(g => S.pets.coelho.dourado && S.gems < g, g0), 'bicho polido vira dourado pela tela'); await p.evaluate(() => fecharModal());
  // vizinhos
  await p.evaluate(() => { ACOES.aba('metas'); ACOES.subM('missoes'); }); await p.waitForTimeout(250);
  ok(await p.isVisible('text=Vizinhos pedem'), 'cartão dos vizinhos');
  await p.evaluate(() => { PETS.forEach(x => { S.pets[x.id] = { lvl: 9 }; }); S.eggs = [null, null]; render(); }); await p.waitForTimeout(150);
  await p.click('[data-act="npcEntregar"][data-arg="0"]'); ok(await p.evaluate(() => S.npc.feitos.includes(0)), 'pedido de vizinho entregue pela tela');
  await p.evaluate(() => ACOES.subM('album')); await p.waitForTimeout(200); ok(await p.isVisible('text=Selos do álbum'), 'selos no álbum');
  await bom(p, 'novidades III');
}

/* ---------- online: a página real falando com o Postgres de verdade ---------- */
try {
  const { criarBanco, removerBanco, cliente, admin, consulta } = await import('../backend/tests/ajuda.mjs');
  const db = criarBanco();
  const uid = admin(db, 'insert into auth.users default values returning id;');
  const outro = admin(db, 'insert into auth.users default values returning id;');
  const eu = cliente(db, uid), ele = cliente(db, outro);
  await ele.rpc('jogo_iniciar', { p_nome: 'Vizinha' });
  await ele.rpc('jogo_perfil_atualizar', { p_nome: null, p_nivel: 4, p_poder: 500 });
  await ele.rpc('jogo_save_salvar', { p_dados: { pets: { leao: { lvl: 4, nome: '<b>Rex</b>' } }, decor: { girassol: 1 }, obras: {}, tema: 'outono' }, p_versao: 0 });
  const p = await abrir('docs/index.html', async pg => {
    await pg.exposeFunction('__rpc', async (n, a) => eu.rpc(n, a));
    await pg.addInitScript(() => {
      localStorage.setItem('sitio-dos-bichos.v1', JSON.stringify({ nome: 'Joana', visto: true, tut: { passo: 9, fim: true }, nivel: 6, convitePend: 'ZZZZZZZ' }));
      window.supabase = { createClient: () => ({ auth: { getSession: async () => ({ data: { session: {} } }), signInAnonymously: async () => ({ error: null }) }, rpc: (n, a) => window.__rpc(n, a).then(r => r) }) };
    });
  });
  await p.waitForTimeout(2500);
  ok(await p.evaluate(() => ON.ativo), 'modo online ativo');
  ok(consulta(db, `select count(*)::int n from eventos_app where user_id='${uid}' and nome='sessao'`)[0].n === 1, 'métrica de sessão enviada');
  await p.evaluate(() => { ACOES.aba('guilda'); ACOES.subG('ranking'); }); await p.waitForTimeout(1500);
  ok(await p.isVisible('[data-act="rkCat"][data-arg="moedas"]'), 'abas da classificação aparecem');
  await p.evaluate(() => enviarExtra()); await p.waitForTimeout(500);
  ok(consulta(db, `select n_roupas::int n from perfis where id='${uid}'`)[0].n >= 1, 'fantasias e aparência enviadas ao servidor');
  await p.click('[data-act="rkCat"][data-arg="fantasias"]'); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => ON.rank && ON.rank.categoria === 'fantasias' && ON.rank.servidor >= 1 && ON.rank.top.some(x => x.voce && x.avatar && x.avatar.roupa)), 'classificação de fantasias por servidor, com aparência');
  await p.click('[data-act="rkCat"][data-arg="poder"]'); await p.waitForTimeout(1500);
  await p.click('text=Visitar'); await p.waitForTimeout(800);
  ok(await p.isVisible('text=Visita ao sítio'), 'visita abre');
  ok(!(await p.content()).includes('<b>Rex</b>'), 'nome do bicho do outro jogador sai escapado');
  await p.click('text=Curtir'); await p.waitForTimeout(800);
  ok(consulta(db, `select curtidas from perfis where id='${outro}'`)[0].curtidas === 1, 'curtida gravada no servidor');
  await p.evaluate(() => { S.nivel = 6; ACOES.aba('guilda'); ACOES.subG('guilda'); }); await p.waitForTimeout(400);
  admin(db, `update perfis set nivel = 6 where id = '${uid}'`);
  await p.evaluate(() => api.guilda.criar('Equipe E2E', '')); await p.evaluate(() => visitar(true)); await p.waitForTimeout(1200);
  await p.click('text=👏 Parabéns'); await p.waitForTimeout(800);
  ok(consulta(db, `select count(*)::int n from mural where tipo='reacao'`)[0].n === 1, 'reação no mural');
  await p.evaluate(() => { ACOES.aba('guilda'); ACOES.subG('guildas'); }); await p.waitForTimeout(1200);
  ok(await p.isVisible('text=Guilda contra guilda'), 'tela guilda x guilda');
  await p.evaluate(() => { ACOES.aba('ajustes'); }); await p.waitForTimeout(1200);
  ok(await p.evaluate(() => !!ON.convite && /^[0-9A-F]{7}$/.test(ON.convite.codigo)), 'código de convite carregado');
  // código promocional, corrida e chefe falando com o servidor de verdade
  admin(db, `insert into codigos_promo (codigo, gemas, ingressos) values ('TESTE10', 10, 2)`);
  await p.evaluate(() => { ACOES.aba('ajustes'); }); await p.waitForTimeout(300);
  const gemasAntes = await p.evaluate(() => S.gems);
  await p.fill('#codigoIn', 'teste10'); await p.click('[data-act="codigoUsar"]'); await p.waitForTimeout(1200);
  ok(await p.evaluate(g => S.gems === g + 10 && S.ing === 2, gemasAntes), 'código promocional resgatado online');
  await p.evaluate(() => { S.nivel = 6; pontoCorrida(S, 25); }); await p.waitForTimeout(9500);
  ok(consulta(db, `select coalesce(sum(pontos),0)::int n from corrida_pontos where user_id='${uid}'`)[0].n >= 25, 'pontos da corrida enviados ao servidor');
  await p.evaluate(() => { ACOES.aba('metas'); ACOES.subM('evento'); }); await p.waitForTimeout(1500);
  ok(await p.isVisible('text=Ranking'), 'ranking da corrida online');
  await p.evaluate(() => { ACOES.aba('guilda'); ACOES.subG('chefe'); }); await p.waitForTimeout(1500);
  await p.click('[data-act="chefeGolpe"]'); await p.waitForTimeout(1500);
  ok(consulta(db, `select coalesce(sum(dano),0)::int n from chefe_dano where user_id='${uid}'`)[0].n > 0, 'golpe no chefe gravado no servidor');
  // liga, papo, passe de guilda e troca de bichos
  await p.evaluate(() => { ACOES.aba('guilda'); ACOES.subG('liga'); }); await p.waitForTimeout(1500);
  ok(await p.isVisible('text=Liga Bronze'), 'tela da liga online');
  await p.click('[data-act="guildaPasse"]'); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => S.guilda.passeAte > Date.now() + 6 * 86400e3) && consulta(db, `select count(*)::int n from guildas where passe_ate > now()`)[0].n === 1, 'passe da guilda ativo e valendo bônus');
  ok(await p.evaluate(() => { const a = multProd(S); S.guilda.passeAte = 0; const b = multProd(S); S.guilda.passeAte = Date.now() + 1e9; return Math.abs(a / b - (1 + 0.04 * (S.guilda.nivel - 1) + 0.10) / (1 + 0.04 * (S.guilda.nivel - 1))) < 1e-9; }), 'bônus de +10% entra na produção');
  await p.evaluate(() => { ACOES.subG('papo'); }); await p.waitForTimeout(1500);
  await p.click('[data-act="chatEnviar"][data-arg="2"]'); await p.waitForTimeout(1500);
  ok(await p.isVisible('text=Bora, guilda!') && consulta(db, `select count(*)::int n from guilda_chat`)[0].n === 1, 'frase enviada e exibida no papo');
  const viz2 = consulta(db, `select id from perfis where id <> '${uid}' limit 1`)[0];
  await p.evaluate(() => { S.pets.coelho = { lvl: 4 }; });
  await p.evaluate(id => { ACOES.trocaMenu(id + '|Vizinho'); }, viz2 && viz2.id); await p.waitForTimeout(300);
  if (viz2) { await p.click('[data-act="trocaEnviar"]'); await p.waitForTimeout(1500);
    ok(await p.evaluate(() => S.pets.coelho.lvl === 3) && consulta(db, `select count(*)::int n from trocas_bicho`)[0].n === 1, 'troca enviada: perde 1 nível e grava no servidor'); }
  await p.evaluate(() => { fecharModal(); ACOES.aba('guilda'); ACOES.subG('ranking'); }); await p.waitForTimeout(1000);
  await bom(p, 'liga/papo/troca');
  await bom(p, 'online');
  removerBanco(db);
} catch (e) { falhas++; console.log('FALHOU (online):', e.message); }

await b.close();
console.log(falhas ? falhas + ' falha(s)' : 'tudo certo');
process.exit(falhas ? 1 : 0);
