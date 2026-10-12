import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { criarBanco, removerBanco, cliente, comoUsuario, consulta, jogador } from './ajuda.mjs';

let db;
before(() => { db = criarBanco(); });
after(() => removerBanco(db));

const FUNCOES = ['jogo_save_carregar', 'jogo_guildas_listar', 'jogo_guilda_estado', 'jogo_guilda_sair', 'jogo_ranking'];

test('sem login, toda função falha com nao_autenticado', async () => {
  const c = cliente(db, null);
  for (const f of FUNCOES) {
    const r = await c.rpc(f);
    assert.match(r.error?.message ?? '', /nao_autenticado/, f);
  }
  const r = await c.rpc('jogo_iniciar', { p_nome: 'Ana' });
  assert.match(r.error?.message ?? '', /nao_autenticado/);
});

test('anon não pode executar as funções', async () => {
  const u = (await jogador(db, 'Ana')).uid;
  const r = await cliente(db, u, 'anon').rpc('jogo_ranking');
  assert.match(r.error?.message ?? '', /permission denied/);
});

test('usuário logado não lê nem escreve tabelas direto', async () => {
  const u = (await jogador(db, 'Bia')).uid;
  for (const t of ['perfis', 'saves', 'guildas', 'membros', 'pontos_semana', 'mural', 'limites', 'catalogo_pets']) {
    const r = comoUsuario(db, u, `select * from public.${t};`);
    assert.equal(r.ok, false, t);
    assert.match(r.erro, /permission denied/, t);
  }
  const w = comoUsuario(db, u, `update public.perfis set poder = 999999 where id = '${u}';`);
  assert.equal(w.ok, false);
});

test('schema priv é inacessível', () => {
  const u = consulta(db, 'select id from auth.users limit 1')[0].id;
  const r = comoUsuario(db, u, 'select priv.semana();');
  assert.equal(r.ok, false);
  assert.match(r.erro, /permission denied/);
});

test('RLS ligado em todas as tabelas de public', () => {
  const sem = consulta(db, `select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relkind='r' and not c.relrowsecurity`);
  assert.deepEqual(sem, []);
});

test('funções jogo_* são security definer com search_path fixo', () => {
  const r = consulta(db, `select proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and proname like 'jogo\\_%' and (not prosecdef or proconfig is null)`);
  assert.deepEqual(r, []);
});
