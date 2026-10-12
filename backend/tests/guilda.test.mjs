import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { criarBanco, removerBanco, jogador, consulta } from './ajuda.mjs';

let db;
before(() => { db = criarBanco(); });
after(() => removerBanco(db));

test('nível baixo não cria nem entra em guilda', async () => {
  const novato = await jogador(db, 'Novato', 4);
  assert.equal((await novato.rpc('jogo_guilda_criar', { p_nome: 'Qualquer', p_lema: '' })).data.erro, 'nivel_baixo');
  assert.equal((await novato.rpc('jogo_guilda_entrar', { p_guilda: '00000000-0000-0000-0000-000000000000' })).data.erro, 'nivel_baixo');
});

test('criar, nome duplicado (sem diferenciar maiúsculas), nome inválido, já em guilda', async () => {
  const a = await jogador(db, 'Ana', 5);
  const b = await jogador(db, 'Beto', 5);
  assert.equal((await a.rpc('jogo_guilda_criar', { p_nome: 'ab', p_lema: '' })).data.erro, 'nome_invalido');
  const g = await a.rpc('jogo_guilda_criar', { p_nome: 'Porteira Azul', p_lema: 'Uma por todos' });
  assert.equal(g.data.ok, true);
  assert.equal((await a.rpc('jogo_guilda_criar', { p_nome: 'Outra', p_lema: '' })).data.erro, 'ja_em_guilda');
  assert.equal((await b.rpc('jogo_guilda_criar', { p_nome: 'PORTEIRA azul', p_lema: '' })).data.erro, 'nome_em_uso');
  assert.equal((await b.rpc('jogo_guilda_criar', { p_nome: 'Valida', p_lema: 'x'.repeat(61) })).data.erro, 'lema_invalido');
});

test('listar, entrar, estado e sair', async () => {
  const a = await jogador(db, 'Lia', 6);
  const b = await jogador(db, 'Leo', 5);
  assert.equal((await b.rpc('jogo_guilda_estado')).data.guilda, null);
  const { guilda_id } = (await a.rpc('jogo_guilda_criar', { p_nome: 'Celeiro Feliz', p_lema: '' })).data;
  const lista = (await b.rpc('jogo_guildas_listar')).data.guildas;
  assert.ok(lista.some(x => x.id === guilda_id));
  assert.equal((await b.rpc('jogo_guilda_entrar', { p_guilda: '11111111-1111-1111-1111-111111111111' })).data.erro, 'guilda_inexistente');
  assert.equal((await b.rpc('jogo_guilda_entrar', { p_guilda: guilda_id })).data.ok, true);
  const e = (await b.rpc('jogo_guilda_estado')).data;
  assert.equal(e.guilda.nome, 'Celeiro Feliz');
  assert.equal(e.membros.length, 2);
  assert.equal(e.semana.meta, 4000);
  assert.equal((await b.rpc('jogo_guilda_sair')).data.ok, true);
  assert.equal((await b.rpc('jogo_guilda_estado')).data.guilda, null);
  assert.equal((await b.rpc('jogo_guilda_sair')).data.erro, 'sem_guilda');
});

test('líder sai: liderança passa adiante; guilda vazia some', async () => {
  const a = await jogador(db, 'Rui', 5);
  const b = await jogador(db, 'Rita', 5);
  const { guilda_id } = (await a.rpc('jogo_guilda_criar', { p_nome: 'Moinho', p_lema: '' })).data;
  await b.rpc('jogo_guilda_entrar', { p_guilda: guilda_id });
  await a.rpc('jogo_guilda_sair');
  const papel = consulta(db, `select papel from membros where user_id = '${b.uid}'`)[0].papel;
  assert.equal(papel, 'lider');
  assert.equal(consulta(db, `select dono_id from guildas where id = '${guilda_id}'`)[0].dono_id, b.uid);
  await b.rpc('jogo_guilda_sair');
  assert.equal(consulta(db, `select 1 from guildas where id = '${guilda_id}'`).length, 0);
});

test('guilda cheia aceita no máximo 30 membros', async () => {
  const dono = await jogador(db, 'Dono', 5);
  const { guilda_id } = (await dono.rpc('jogo_guilda_criar', { p_nome: 'Lotada', p_lema: '' })).data;
  for (let i = 0; i < 29; i++) {
    const j = await jogador(db, 'Jog' + i, 5);
    assert.equal((await j.rpc('jogo_guilda_entrar', { p_guilda: guilda_id })).data.ok, true, 'jogador ' + i);
  }
  const extra = await jogador(db, 'Extra', 5);
  assert.equal((await extra.rpc('jogo_guilda_entrar', { p_guilda: guilda_id })).data.erro, 'guilda_cheia');
});
