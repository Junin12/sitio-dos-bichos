import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { criarBanco, removerBanco, jogador, admin } from './ajuda.mjs';

let db;
before(() => { db = criarBanco(); });
after(() => removerBanco(db));

async function dupla(nome) {
  const a = await jogador(db, 'A' + nome, 12);
  const b = await jogador(db, 'B' + nome, 5);
  const { guilda_id } = (await a.rpc('jogo_guilda_criar', { p_nome: nome, p_lema: '' })).data;
  await b.rpc('jogo_guilda_entrar', { p_guilda: guilda_id });
  return { a, b };
}

test('mural: choque só de raro+ do catálogo, nível, safra, repetido', async () => {
  const { a } = await dupla('Mural1');
  assert.equal((await a.rpc('jogo_mural_postar', { p_tipo: 'choque', p_params: { pet_id: 'pintinho' } })).data.erro, 'params_invalidos');
  assert.equal((await a.rpc('jogo_mural_postar', { p_tipo: 'choque', p_params: { pet_id: 'naoexiste' } })).data.erro, 'params_invalidos');
  assert.equal((await a.rpc('jogo_mural_postar', { p_tipo: 'choque', p_params: { pet_id: 'dragao' } })).data.ok, true);
  assert.equal((await a.rpc('jogo_mural_postar', { p_tipo: 'choque', p_params: { pet_id: 'dragao' } })).data.erro, 'repetido');
  assert.equal((await a.rpc('jogo_mural_postar', { p_tipo: 'nivel', p_params: { nivel: 13 } })).data.erro, 'params_invalidos');
  assert.equal((await a.rpc('jogo_mural_postar', { p_tipo: 'nivel', p_params: { nivel: 12 } })).data.ok, true);
  assert.equal((await a.rpc('jogo_mural_postar', { p_tipo: 'safra', p_params: { n: 15 } })).data.erro, 'params_invalidos');
  assert.equal((await a.rpc('jogo_mural_postar', { p_tipo: 'safra', p_params: { n: 20 } })).data.ok, true);
  assert.equal((await a.rpc('jogo_mural_postar', { p_tipo: 'nivel', p_params: { nivel: 'abc' } })).data.erro, 'params_invalidos');
  assert.equal((await a.rpc('jogo_mural_postar', { p_tipo: 'xingamento', p_params: {} })).data.erro, 'tipo_invalido');
  const solo = await jogador(db, 'SoloM', 5);
  assert.equal((await solo.rpc('jogo_mural_postar', { p_tipo: 'safra', p_params: { n: 10 } })).data.erro, 'sem_guilda');
  const mural = (await a.rpc('jogo_guilda_estado')).data.mural;
  assert.ok(mural.some(m => m.texto.includes('Dragão do Milharal') && m.texto.includes('Lendário')));
});

test('parabenizar: uma vez, não o próprio, inexistente, limite diário', async () => {
  const { a, b } = await dupla('Mural2');
  await a.rpc('jogo_mural_postar', { p_tipo: 'safra', p_params: { n: 10 } });
  const post = (await b.rpc('jogo_guilda_estado')).data.mural.find(m => m.tipo === 'safra');
  assert.equal((await a.rpc('jogo_mural_parabenizar', { p_mural: post.id })).data.erro, 'proprio_evento');
  assert.equal((await b.rpc('jogo_mural_parabenizar', { p_mural: 999999 })).data.erro, 'mural_inexistente');
  assert.equal((await b.rpc('jogo_mural_parabenizar', { p_mural: post.id })).data.ok, true);
  assert.equal((await b.rpc('jogo_mural_parabenizar', { p_mural: post.id })).data.erro, 'ja_parabenizou');
  const marcado = (await b.rpc('jogo_guilda_estado')).data.mural.find(m => m.id === post.id);
  assert.equal(marcado.parabenizado, true);
  // limite diário: 10 parabéns por dia
  for (let n = 1; n <= 11; n++) admin(db, `insert into mural (guilda_id, user_id, tipo, texto) select guilda_id, user_id, 'safra', 'x${n}' from membros where user_id = '${a.uid}'`);
  const ids = (await b.rpc('jogo_guilda_estado')).data.mural.filter(m => m.id !== post.id).map(m => m.id);
  const r = [];
  for (const id of ids) r.push((await b.rpc('jogo_mural_parabenizar', { p_mural: id })).data.erro ?? 'ok');
  assert.ok(r.includes('limite_diario'), r.join());
});

test('mural de outra guilda não aparece nem pode ser parabenizado', async () => {
  const { a } = await dupla('Mural3');
  const { b: outro } = await dupla('Mural4');
  await a.rpc('jogo_mural_postar', { p_tipo: 'safra', p_params: { n: 30 } });
  const id = (await a.rpc('jogo_guilda_estado')).data.mural.find(m => m.tipo === 'safra').id;
  assert.notEqual((await outro.rpc('jogo_mural_parabenizar', { p_mural: id })).data.ok, true);
  assert.ok(!(await outro.rpc('jogo_guilda_estado')).data.mural.some(m => m.id === id));
});

test('ranking: ordem por poder, posição própria, poder 0 fora, limite', async () => {
  const db2 = criarBanco();
  try {
    const ja = async (n, poder) => {
      const c = await jogador(db2, n, 5);
      if (poder) assert.equal((await c.rpc('jogo_perfil_atualizar', { p_nome: null, p_nivel: 5, p_poder: poder })).data.ok, true);
      return c;
    };
    const zero = await ja('Zero', 0);
    await ja('Alto', 3000);
    const meio = await ja('Meio', 2000);
    await ja('Baixo', 1000);
    const r = (await meio.rpc('jogo_ranking')).data;
    assert.deepEqual(r.top.map(x => x.nome), ['Alto', 'Meio', 'Baixo']);
    assert.equal(r.total, 3);
    assert.deepEqual([r.eu.pos, r.eu.poder], [2, 2000]);
    assert.equal(r.top[1].voce, true);
    const rz = (await zero.rpc('jogo_ranking')).data;
    assert.equal(rz.eu.pos, null);
    assert.equal((await meio.rpc('jogo_ranking', { p_limite: 2 })).data.top.length, 2);
  } finally { removerBanco(db2); }
});
