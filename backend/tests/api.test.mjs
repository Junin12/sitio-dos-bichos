// Testa o módulo src/api.js do jogo contra o banco real (cliente psql no lugar do supabase-js).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { criarBanco, removerBanco, jogador } from './ajuda.mjs';
import { criarApi, TETOS } from '../../src/api.js';

let db;
before(() => { db = criarBanco(); });
after(() => removerBanco(db));

test('api normaliza erros e respeita os tetos', async () => {
  const c = await jogador(db, 'Api', 5);
  const api = criarApi(c);
  const g = await api.guilda.criar('Api Clube', '');
  assert.equal(g.ok, true);
  assert.equal((await api.guilda.criar('Outra', '')).erro, 'ja_em_guilda');
  assert.match((await api.guilda.criar('Outra', '')).mensagem, /já está/);
  assert.equal((await api.guilda.contribuir(1000, 'ovo')).pontos_semana, TETOS.ovo);
  assert.equal((await api.guilda.contribuir(5, 'hack')).erro, 'motivo_invalido');
  assert.equal((await api.guilda.contribuir(0, 'ovo')).erro, 'pontos_invalidos');
  const s = await api.save.salvar({ moedas: 1 }, 0);
  assert.equal(s.versao, 1);
  const conflito = await api.save.salvar({ moedas: 2 }, 0);
  assert.deepEqual([conflito.erro, conflito.versao], ['conflito', 1]);
  assert.equal((await api.ranking()).ok, true);
});

test('api: sem login vira nao_autenticado e falha de rede vira rede', async () => {
  const sem = criarApi(await (await import('./ajuda.mjs')).cliente(db, null));
  assert.equal((await sem.ranking()).erro, 'nao_autenticado');
  const quebrado = criarApi({ rpc: async () => { throw new Error('boom'); } });
  assert.equal((await quebrado.ranking()).erro, 'rede');
});

test('api.entrar cria sessão anônima quando não há uma', async () => {
  let logou = false;
  const fake = {
    auth: { getSession: async () => ({ data: { session: null } }), signInAnonymously: async () => { logou = true; return { error: null }; } },
    rpc: async (n, a) => ({ data: { ok: true, perfil: { nome: a.p_nome } }, error: null }),
  };
  const r = await criarApi(fake).entrar('  Zé  ');
  assert.equal(logou, true);
  assert.equal(r.perfil.nome, 'Zé');
});

test('api: convites, visitas, reações e guildas', async () => {
  const a = criarApi(await jogador(db, 'ApiA', 6)), b = criarApi(await jogador(db, 'ApiB', 1));
  const { codigo } = await a.convite.codigo();
  assert.equal((await b.convite.usar(codigo)).ok, true);
  assert.equal((await b.convite.usar(codigo)).mensagem, 'Você já usou um convite.');
  assert.equal((await a.guilda.criar('Api Reage', '')).ok, true);
  assert.equal((await a.mural.reagir('uau')).ok, true);
  assert.equal((await a.guildas.ranking()).ok, true);
  assert.equal((await a.evento('sessao')).ok, true);
  const rk = await b.ranking(); assert.equal(rk.ok, true);
  assert.equal((await b.curtir('00000000-0000-0000-0000-000000000000')).erro, 'alvo_invalido');
  assert.equal((await a.perfilAtualizar({ nivel: 6, poder: 10, prestigio: 0 })).ok, true);
});
