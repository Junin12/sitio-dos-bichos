import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { criarBanco, removerBanco, jogador, consulta, comoUsuario } from './ajuda.mjs';

let db;
before(() => { db = criarBanco(); });
after(() => removerBanco(db));

test('presentes: enviar, caixa e pegar respeitam os limites', async () => {
  const a = await jogador(db, 'PresA', 1), b = await jogador(db, 'PresB', 1);
  assert.equal((await a.rpc('jogo_presente_enviar', { p_para: a.uid })).data.erro, 'valor_invalido');
  assert.equal((await a.rpc('jogo_presente_enviar', { p_para: '00000000-0000-0000-0000-000000000000' })).data.erro, 'alvo_invalido');
  assert.equal((await a.rpc('jogo_presente_enviar', { p_para: b.uid })).data.ok, true);
  assert.equal((await a.rpc('jogo_presente_enviar', { p_para: b.uid })).data.erro, 'ja_enviou');
  assert.equal((await b.rpc('jogo_presente_caixa')).data.n, 1);
  assert.equal((await a.rpc('jogo_presente_caixa')).data.n, 0);
  assert.equal((await a.rpc('jogo_presente_pegar')).data.erro, 'nada');
  const r = (await b.rpc('jogo_presente_pegar')).data; assert.equal(r.ok, true); assert.equal(r.n, 1);
  assert.equal((await b.rpc('jogo_presente_pegar')).data.erro, 'nada');
});

test('presentes: no máximo 5 por dia de envio e de recebimento', async () => {
  const a = await jogador(db, 'PresC', 1), alvo = [];
  for (let i = 0; i < 6; i++) alvo.push(await jogador(db, 'Viz' + i, 1));
  for (let i = 0; i < 5; i++) assert.equal((await a.rpc('jogo_presente_enviar', { p_para: alvo[i].uid })).data.ok, true);
  assert.equal((await a.rpc('jogo_presente_enviar', { p_para: alvo[5].uid })).data.erro, 'limite_dia');
  const rec = await jogador(db, 'Recebe', 1), env = [];
  for (let i = 0; i < 6; i++) env.push(await jogador(db, 'Env' + i, 1));
  for (const e of env) await e.rpc('jogo_presente_enviar', { p_para: rec.uid });
  assert.equal((await rec.rpc('jogo_presente_caixa')).data.n, 5);
  assert.equal((await rec.rpc('jogo_presente_pegar')).data.n, 5);
  assert.equal((await rec.rpc('jogo_presente_pegar')).data.erro, 'limite_dia');
  assert.equal(consulta(db, `select count(*)::int n from presentes where para = '${rec.uid}' and pego_dia is not null`)[0].n, 5);
});

test('presentes: tabela fechada e métricas novas aceitas', async () => {
  const a = await jogador(db, 'PresD', 1);
  for (const n of ['passe', 'expedicao', 'torre', 'mapa', 'calendario', 'cartao', 'presente']) assert.equal((await a.rpc('jogo_evento', { p_nome: n })).data.ok, true, n);
  assert.equal((await a.rpc('jogo_evento', { p_nome: 'hack' })).data.erro, 'tipo_invalido');
  assert.equal(comoUsuario(db, a.uid, 'select * from public.presentes;').ok, false, 'sem acesso direto');
});
