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
  ok(JSON.stringify(pets) === JSON.stringify(['arara', 'cisne', 'coelho', 'elefante']), 'bichos fantasiosos migrados para reais: ' + pets);
  ok(await p.evaluate(() => S.pets.arara.lvl === 3 && S.pets.elefante.lvl === 5), 'níveis preservados na migração');
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
  await bom(p, 'online');
  removerBanco(db);
} catch (e) { falhas++; console.log('FALHOU (online):', e.message); }

await b.close();
console.log(falhas ? falhas + ' falha(s)' : 'tudo certo');
process.exit(falhas ? 1 : 0);
