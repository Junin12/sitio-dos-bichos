import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { json, criarBanco, removerBanco, jogador, cliente, admin } from './ajuda.mjs';

let db;
before(() => { db = criarBanco(); });
after(() => removerBanco(db));

test('iniciar cria perfil e é idempotente', async () => {
  const id = admin(db, 'insert into auth.users default values returning id;');
  const c = cliente(db, id);
  const a = await c.rpc('jogo_iniciar', { p_nome: 'Joana' });
  assert.equal(a.data.ok, true);
  assert.equal(a.data.perfil.nome, 'Joana');
  assert.equal(a.data.perfil.nivel, 1);
  const b = await c.rpc('jogo_iniciar', { p_nome: 'Outro' });
  assert.equal(b.data.ok, true);
  assert.equal(b.data.perfil.nome, 'Joana');
});

test('nomes inválidos são recusados', async () => {
  for (const n of ['', 'A', 'x'.repeat(25), '   ', null]) {
    const id = admin(db, 'insert into auth.users default values returning id;');
    const r = await cliente(db, id).rpc('jogo_iniciar', { p_nome: n });
    assert.equal(r.data?.erro, 'nome_invalido', String(n));
  }
});

test('atualizar perfil: sem perfil, nível, salto e poder', async () => {
  const id = admin(db, 'insert into auth.users default values returning id;');
  const sem = await cliente(db, id).rpc('jogo_perfil_atualizar', { p_nome: null, p_nivel: 2, p_poder: 0 });
  assert.equal(sem.data.erro, 'sem_perfil');
  const c = await jogador(db, 'Caio');
  assert.equal((await c.rpc('jogo_perfil_atualizar', { p_nome: null, p_nivel: 0, p_poder: 0 })).data.erro, 'nivel_invalido');
  assert.equal((await c.rpc('jogo_perfil_atualizar', { p_nome: null, p_nivel: 31, p_poder: 0 })).data.erro, 'nivel_invalido');
  assert.equal((await c.rpc('jogo_perfil_atualizar', { p_nome: null, p_nivel: 20, p_poder: 0 })).data.erro, 'salto_de_nivel');
  assert.equal((await c.rpc('jogo_perfil_atualizar', { p_nome: null, p_nivel: 3, p_poder: -1 })).data.erro, 'poder_invalido');
  // nível 1 permite no máximo 400*1.5 = 600 de poder
  assert.equal((await c.rpc('jogo_perfil_atualizar', { p_nome: null, p_nivel: 1, p_poder: 10000000 })).data.erro, 'poder_invalido');
  const ok = await c.rpc('jogo_perfil_atualizar', { p_nome: 'Caio2', p_nivel: 4, p_poder: 500 });
  assert.equal(ok.data.ok, true);
});

test('save: criar, versionar, conflito, tamanho e formato', async () => {
  const c = await jogador(db, 'Dani');
  const vazio = await c.rpc('jogo_save_carregar');
  assert.deepEqual([vazio.data.ok, vazio.data.existe], [true, false]);
  const s1 = await c.rpc('jogo_save_salvar', { p_dados: { moedas: 10 }, p_versao: 0 });
  assert.deepEqual([s1.data.ok, s1.data.versao], [true, 1]);
  const s2 = await c.rpc('jogo_save_salvar', { p_dados: { moedas: 20 }, p_versao: 1 });
  assert.equal(s2.data.versao, 2);
  const velho = await c.rpc('jogo_save_salvar', { p_dados: { moedas: 5 }, p_versao: 1 });
  assert.deepEqual([velho.data.erro, velho.data.versao], ['conflito', 2]);
  const zero = await c.rpc('jogo_save_salvar', { p_dados: { moedas: 5 }, p_versao: 0 });
  assert.equal(zero.data.erro, 'conflito');
  const l = await c.rpc('jogo_save_carregar');
  assert.deepEqual([l.data.existe, l.data.versao, l.data.dados.moedas], [true, 2, 20]);
  assert.equal((await c.rpc('jogo_save_salvar', { p_dados: [1, 2], p_versao: 2 })).data.erro, 'dados_invalidos');
  assert.equal((await c.rpc('jogo_save_salvar', { p_dados: json('texto'), p_versao: 2 })).data.erro, 'dados_invalidos');
  const grande = await c.rpc('jogo_save_salvar', { p_dados: { lixo: 'x'.repeat(210000) }, p_versao: 2 });
  assert.equal(grande.data.erro, 'grande_demais');
});

test('saves são isolados por jogador', async () => {
  const a = await jogador(db, 'Eva');
  const b = await jogador(db, 'Fábio');
  await a.rpc('jogo_save_salvar', { p_dados: { segredo: 1 }, p_versao: 0 });
  const r = await b.rpc('jogo_save_carregar');
  assert.equal(r.data.existe, false);
});
