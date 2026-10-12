import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { criarBanco, removerBanco, jogador, admin, consulta, comoUsuario, cliente } from './ajuda.mjs';

let db;
before(() => { db = criarBanco(); });
after(() => removerBanco(db));

const atual = `(select date_trunc('week', now() at time zone 'America/Sao_Paulo')::date)`;
const janela = `(select floor(extract(epoch from (now() at time zone 'America/Sao_Paulo')) / 172800)::int)`;

test('códigos promocionais: válido, uso único, vencido, esgotado, inexistente', async () => {
  admin(db, `insert into codigos_promo (codigo, gemas, ingressos, max_usos) values ('BEMVINDO', 20, 2, 2);
             insert into codigos_promo (codigo, gemas, valido_ate) values ('ANTIGO', 5, now() - interval '1 day');`);
  const a = await jogador(db, 'Cod1', 1), b = await jogador(db, 'Cod2', 1), c = await jogador(db, 'Cod3', 1);
  assert.equal((await a.rpc('jogo_codigo_resgatar', { p_codigo: 'nao existe' })).data.erro, 'codigo_invalido');
  assert.equal((await a.rpc('jogo_codigo_resgatar', { p_codigo: 'ANTIGO' })).data.erro, 'codigo_invalido');
  const r = (await a.rpc('jogo_codigo_resgatar', { p_codigo: ' bemvindo ' })).data;
  assert.equal(r.ok, true); assert.equal(r.gemas, 20); assert.equal(r.ingressos, 2);
  assert.equal((await a.rpc('jogo_codigo_resgatar', { p_codigo: 'BEMVINDO' })).data.erro, 'codigo_ja_usado');
  assert.equal((await b.rpc('jogo_codigo_resgatar', { p_codigo: 'BEMVINDO' })).data.ok, true);
  assert.equal((await c.rpc('jogo_codigo_resgatar', { p_codigo: 'BEMVINDO' })).data.erro, 'codigo_esgotado');
  assert.equal(consulta(db, `select usos from codigos_promo where codigo = 'BEMVINDO'`)[0].usos, 2);
  // tabela fechada e limite por hora
  assert.equal(comoUsuario(db, a.uid, 'select * from public.codigos_promo;').ok, false);
  const d = await jogador(db, 'Cod4', 1);
  for (let i = 0; i < 8; i++) await d.rpc('jogo_codigo_resgatar', { p_codigo: 'X' + i + 'ZZZ' });
  assert.equal((await d.rpc('jogo_codigo_resgatar', { p_codigo: 'BEMVINDO' })).data.erro, 'limite_hora');
});

test('chefe da guilda: precisa de guilda e nível, limita golpes, acumula, premia uma vez', async () => {
  const lider = await jogador(db, 'Lider', 5), m1 = await jogador(db, 'Membro1', 5), m2 = await jogador(db, 'Membro2', 5), fora = await jogador(db, 'Fora', 5);
  assert.equal((await fora.rpc('jogo_chefe_estado')).data.erro, 'sem_guilda');
  assert.equal((await fora.rpc('jogo_chefe_golpear', { p_dano: 100 })).data.erro, 'sem_guilda');
  const { guilda_id } = (await lider.rpc('jogo_guilda_criar', { p_nome: 'Caçadores', p_lema: '' })).data;
  await m1.rpc('jogo_guilda_entrar', { p_guilda: guilda_id }); await m2.rpc('jogo_guilda_entrar', { p_guilda: guilda_id });
  const e = (await lider.rpc('jogo_chefe_estado')).data;
  assert.equal(e.ok, true); assert.equal(e.hp, 90000); assert.equal(e.dano_total, 0); assert.equal(e.golpes_max, 6);
  assert.ok(Number.isInteger(e.semana) && e.termina_em > 0 && e.termina_em <= 7 * 86400);
  assert.equal((await lider.rpc('jogo_chefe_golpear', { p_dano: 0 })).data.erro, 'valor_invalido');
  // dano é limitado pelo nível e pelo poder do perfil (aqui poder 0: 300 + 5*50 = 550)
  const g = (await lider.rpc('jogo_chefe_golpear', { p_dano: 999999 })).data;
  assert.equal(g.ok, true); assert.equal(g.dano_golpe, 550); assert.equal(g.dano_total, 550); assert.equal(g.meu_dano, 550); assert.equal(g.golpes_hoje, 1);
  for (let i = 0; i < 5; i++) assert.equal((await lider.rpc('jogo_chefe_golpear', { p_dano: 100 })).data.ok, true);
  assert.equal((await lider.rpc('jogo_chefe_golpear', { p_dano: 100 })).data.erro, 'limite_diario');
  const s = (await m1.rpc('jogo_chefe_estado')).data;
  assert.equal(s.golpes_hoje, 0); assert.equal(s.dano_total, 550 + 500); assert.equal(s.top[0].nome, 'Lider');
  // sem derrotar, não há prêmio
  assert.equal((await lider.rpc('jogo_chefe_resgatar')).data.erro, 'sem_premio');
  // derrota o chefe: a guilda soma o necessário
  admin(db, `insert into chefe_dano (guilda_id, semana, user_id, dano) values ('${guilda_id}', ${atual}, '${m1.uid}', 90000)
             on conflict (guilda_id, semana, user_id) do update set dano = 90000`);
  assert.equal((await lider.rpc('jogo_chefe_estado')).data.derrotado, true);
  assert.equal((await lider.rpc('jogo_chefe_resgatar')).data.ok, true);
  assert.equal((await lider.rpc('jogo_chefe_resgatar')).data.erro, 'sem_premio');
  assert.equal((await lider.rpc('jogo_chefe_estado')).data.premio_resgatado, true);
  assert.equal((await m2.rpc('jogo_chefe_resgatar')).data.erro, 'sem_premio');   // não deu nenhum golpe: não participou
  // semana passada derrotada e não resgatada ainda aparece como pendente
  admin(db, `insert into chefe_dano (guilda_id, semana, user_id, dano) values ('${guilda_id}', ${atual} - 7, '${m2.uid}', 95000)`);
  assert.equal((await m2.rpc('jogo_chefe_estado')).data.premio_anterior, true);
  assert.equal((await m2.rpc('jogo_chefe_resgatar')).data.ok, true);
  assert.equal((await m2.rpc('jogo_chefe_estado')).data.premio_anterior, false);
  const baixo = await jogador(db, 'Baixo', 1);
  assert.equal(comoUsuario(db, baixo.uid, 'select * from public.chefe_dano;').ok, false);
});

test('corrida de 48 h: pontos acumulam com teto, ranking, prêmio da janela anterior', async () => {
  const a = await jogador(db, 'CorrA', 1), b = await jogador(db, 'CorrB', 1), c = await jogador(db, 'CorrC', 1);
  assert.equal((await a.rpc('jogo_corrida_enviar', { p_pontos: 0 })).data.erro, 'pontos_invalidos');
  assert.equal((await a.rpc('jogo_corrida_enviar', { p_pontos: 500 })).data.pontos, 60);   // teto por chamada
  assert.equal((await a.rpc('jogo_corrida_enviar', { p_pontos: 10 })).data.pontos, 70);
  await b.rpc('jogo_corrida_enviar', { p_pontos: 30 });
  const r = (await c.rpc('jogo_corrida_ranking', { p_limite: 10 })).data;
  assert.deepEqual(r.top.map(x => x.nome), ['CorrA', 'CorrB']);
  assert.equal(r.pos, null); assert.equal(r.meus, 0); assert.ok(r.termina_em > 0 && r.termina_em <= 172800);
  const rb = (await b.rpc('jogo_corrida_ranking')).data;
  assert.equal(rb.pos, 2); assert.equal(rb.top[1].voce, true);
  // limite por hora: 150 pontos
  for (let i = 0; i < 3; i++) await a.rpc('jogo_corrida_enviar', { p_pontos: 60 });
  assert.equal((await a.rpc('jogo_corrida_enviar', { p_pontos: 60 })).data.erro, 'limite_hora');
  // janela anterior
  admin(db, `insert into corrida_pontos (user_id, janela, pontos) values ('${b.uid}', ${janela} - 1, 100), ('${c.uid}', ${janela} - 1, 20)`);
  assert.equal((await b.rpc('jogo_corrida_ranking')).data.premio, 1);
  assert.equal((await c.rpc('jogo_corrida_premio')).data.erro, 'pontos_minimos');   // menos de 40 pontos
  assert.equal((await b.rpc('jogo_corrida_premio')).data.posicao, 1);
  assert.equal((await b.rpc('jogo_corrida_premio')).data.erro, 'ja_resgatado');
  assert.equal((await b.rpc('jogo_corrida_ranking')).data.premio, null);
  assert.equal(comoUsuario(db, a.uid, 'select * from public.corrida_pontos;').ok, false);
  const anon = cliente(db, null, 'anon');
  assert.ok((await anon.rpc('jogo_corrida_ranking')).error);
});

test('apagar a conta leva junto os dados das mecânicas novas; métricas novas são aceitas', async () => {
  const j = await jogador(db, 'Descartavel', 1);
  assert.equal((await j.rpc('jogo_evento', { p_nome: 'oficina' })).data.ok, true);
  assert.equal((await j.rpc('jogo_evento', { p_nome: 'invalido' })).data.erro, 'tipo_invalido');
  await j.rpc('jogo_corrida_enviar', { p_pontos: 5 });
  admin(db, `insert into codigos_promo (codigo, gemas) values ('APAGAR', 1)`);
  await j.rpc('jogo_codigo_resgatar', { p_codigo: 'APAGAR' });
  assert.equal((await j.rpc('jogo_conta_apagar')).data.ok, true);
  for (const t of ['corrida_pontos', 'codigos_usados', 'chefe_golpes']) {
    assert.equal(consulta(db, `select count(*)::int n from ${t} where user_id = '${j.uid}'`)[0].n, 0, t);
  }
});
