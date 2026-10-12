import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { criarBanco, removerBanco, jogador, admin, consulta, comoUsuario } from './ajuda.mjs';

let db;
before(() => { db = criarBanco(); });
after(() => removerBanco(db));

const passada = `((select date_trunc('week', now() at time zone 'America/Sao_Paulo')::date) - 7)`;
const atual = `(select date_trunc('week', now() at time zone 'America/Sao_Paulo')::date)`;
async function guilda(nome, n) {
  const l = await jogador(db, nome + '0', 5);
  const { guilda_id } = (await l.rpc('jogo_guilda_criar', { p_nome: nome, p_lema: '' })).data;
  const todos = [l];
  for (let i = 1; i < n; i++) { const m = await jogador(db, nome + i, 5); await m.rpc('jogo_guilda_entrar', { p_guilda: guilda_id }); todos.push(m); }
  return { membros: todos, id: guilda_id };
}
const pontos = (js, p, sem) => js.forEach(j => admin(db, `insert into pontos_semana (user_id, semana, pontos) values ('${j.uid}', ${sem}, ${p}) on conflict (user_id, semana) do update set pontos = excluded.pontos`));

test('liga: fecha a semana uma vez, os 3 melhores sobem e o prêmio sai uma vez', async () => {
  const gs = [];
  for (let i = 0; i < 4; i++) gs.push(await guilda('Liga' + i, 3));
  gs.forEach((g, i) => pontos(g.membros, 100 - i * 10, passada));
  const e = (await gs[0].membros[0].rpc('jogo_liga_estado')).data;
  assert.equal(e.ok, true); assert.equal(e.liga, 1, 'primeira guilda subiu para prata');
  assert.equal(e.passada.pos, 1); assert.equal(e.passada.mov, 1); assert.equal(e.passada.premio_pendente, true);
  const lig = consulta(db, `select nome, liga from guildas where nome like 'Liga%' order by nome`);
  assert.deepEqual(lig.map(x => x.liga), [1, 1, 1, 0], 'três subiram, a quarta ficou');
  assert.equal(consulta(db, `select count(*)::int n from liga_resultados`)[0].n, 4);
  assert.equal((await gs[1].membros[0].rpc('jogo_liga_estado')).data.liga, 1, 'não fecha de novo');
  assert.equal(consulta(db, `select count(*)::int n from liga_semanas`)[0].n, 1);
  const r = (await gs[0].membros[0].rpc('jogo_liga_resgatar')).data; assert.equal(r.ok, true); assert.equal(r.pos, 1);
  assert.equal((await gs[0].membros[0].rpc('jogo_liga_resgatar')).data.erro, 'ja_resgatado');
  assert.equal((await gs[3].membros[0].rpc('jogo_liga_resgatar')).data.erro, 'sem_premio');
  const solo = await jogador(db, 'SemGuilda', 5); assert.equal((await solo.rpc('jogo_liga_estado')).data.erro, 'sem_guilda');
});

test('passe de guilda: soma 7 dias, vale para a guilda e tem teto', async () => {
  const g = await guilda('Passeio', 2);
  assert.equal((await g.membros[1].rpc('jogo_liga_estado')).data.passe_resta, 0);
  const r = (await g.membros[1].rpc('jogo_guilda_passe')).data; assert.equal(r.ok, true);
  assert.ok(r.passe_resta > 6 * 86400 && r.passe_resta <= 7 * 86400 + 5);
  assert.ok((await g.membros[0].rpc('jogo_liga_estado')).data.passe_resta > 6 * 86400, 'vale para todos');
  for (let i = 0; i < 4; i++) await g.membros[0].rpc('jogo_guilda_passe');
  assert.equal((await g.membros[0].rpc('jogo_guilda_passe')).data.erro, 'max');
  const solo = await jogador(db, 'PasseSolo', 5); assert.equal((await solo.rpc('jogo_guilda_passe')).data.erro, 'sem_guilda');
});

test('troca de bichos: 1 por dia, só raridade até 3, e o destino pega uma vez', async () => {
  const a = await jogador(db, 'TrocaA', 3), b = await jogador(db, 'TrocaB', 3), c = await jogador(db, 'TrocaC', 3);
  assert.equal((await a.rpc('jogo_troca_enviar', { p_para: a.uid, p_pet: 'coelho' })).data.erro, 'valor_invalido');
  assert.equal((await a.rpc('jogo_troca_enviar', { p_para: b.uid, p_pet: 'DROP' })).data.erro, 'valor_invalido');
  assert.equal((await a.rpc('jogo_troca_enviar', { p_para: b.uid, p_pet: 'inexistente' })).data.erro, 'bicho_invalido');
  const lend = consulta(db, `select id from catalogo_pets where raridade = 4 limit 1`)[0].id;
  assert.equal((await a.rpc('jogo_troca_enviar', { p_para: b.uid, p_pet: lend })).data.erro, 'bicho_invalido', 'lendário não troca');
  assert.equal((await a.rpc('jogo_troca_enviar', { p_para: b.uid, p_pet: 'coelho' })).data.ok, true);
  assert.equal((await a.rpc('jogo_troca_enviar', { p_para: c.uid, p_pet: 'coelho' })).data.erro, 'limite_dia');
  assert.equal((await c.rpc('jogo_troca_enviar', { p_para: b.uid, p_pet: 'coelho' })).data.erro, 'destino_ocupado');
  const cx = (await b.rpc('jogo_troca_caixa')).data; assert.equal(cx.itens.length, 1); assert.equal(cx.itens[0].pet, 'coelho');
  assert.equal((await a.rpc('jogo_troca_pegar', { p_id: cx.itens[0].id })).data.erro, 'nada', 'só o destinatário pega');
  assert.equal((await b.rpc('jogo_troca_pegar', { p_id: cx.itens[0].id })).data.pet, 'coelho');
  assert.equal((await b.rpc('jogo_troca_pegar', { p_id: cx.itens[0].id })).data.erro, 'nada');
  assert.equal((await b.rpc('jogo_troca_caixa')).data.itens.length, 0);
});

test('chat: só frases prontas, só para quem está na guilda, e a lista vem em ordem', async () => {
  const g = await guilda('Papo', 2), fora = await jogador(db, 'ForaChat', 5);
  assert.equal((await fora.rpc('jogo_chat_enviar', { p_cod: 1 })).data.erro, 'sem_guilda');
  assert.equal((await g.membros[0].rpc('jogo_chat_enviar', { p_cod: 99 })).data.erro, 'valor_invalido');
  assert.equal((await g.membros[0].rpc('jogo_chat_enviar', { p_cod: 3 })).data.ok, true);
  assert.equal((await g.membros[1].rpc('jogo_chat_enviar', { p_cod: 7 })).data.ok, true);
  const l = (await g.membros[0].rpc('jogo_chat_listar')).data.msgs;
  assert.deepEqual(l.map(m => m.cod), [3, 7]); assert.equal(l[0].meu, true); assert.equal(l[1].meu, false);
  assert.equal((await fora.rpc('jogo_chat_listar')).data.erro, 'sem_guilda');
  const outra = await guilda('Outra', 1); assert.equal((await outra.membros[0].rpc('jogo_chat_listar')).data.msgs.length, 0, 'não vaza para outra guilda');
});

test('painel e tabelas novas ficam fechados para o app', async () => {
  const u = await jogador(db, 'Curioso', 3);
  for (const t of ['liga_resultados', 'trocas_bicho', 'guilda_chat', 'liga_premios', 'priv.painel_diario', 'priv.painel_retencao']) {
    assert.equal(comoUsuario(db, u.uid, `select * from ${t.includes('.') ? t : 'public.' + t};`).ok, false, t);
  }
  assert.equal(consulta(db, `select count(*)::int n from priv.painel_niveis`).length, 1);
  assert.ok(consulta(db, `select * from priv.painel_retencao`).length >= 1);
});
