import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { criarBanco, removerBanco, jogador, admin, consulta, comoUsuario, cliente } from './ajuda.mjs';

let db;
before(() => { db = criarBanco(); });
after(() => removerBanco(db));

const extra = (j, o = {}) => j.rpc('jogo_perfil_extra', Object.assign({ p_moedas: 1000, p_bichos: 3, p_roupas: 2, p_sexo: 'm', p_pele: 1, p_roupa: 'padrao', p_bicho: 'coelho', p_est: 1 }, o));

test('servidores: novos jogadores enchem o servidor 1 até 300 e depois vão para o 2', async () => {
  const a = await jogador(db, 'SrvA', 1);
  assert.equal(consulta(db, `select servidor from perfis where id = '${a.uid}'`)[0].servidor, 1);
  admin(db, `insert into auth.users (id) select gen_random_uuid() from generate_series(1, 299);
             insert into perfis (id, nome) select id, 'Bot' || substr(id::text, 1, 6) from auth.users where id <> '${a.uid}'
               and id not in (select id from perfis) limit 299`);
  const lotado = consulta(db, `select count(*)::int n from perfis where servidor = 1`)[0].n;
  assert.ok(lotado >= 300, 'servidor 1 lotado: ' + lotado);
  const b = await jogador(db, 'SrvB', 1);
  assert.equal(consulta(db, `select servidor from perfis where id = '${b.uid}'`)[0].servidor, 2);
});

test('perfil_extra valida valores e a fortuna só cresce, com teto por envio', async () => {
  const j = await jogador(db, 'Extra', 1);
  assert.equal((await extra(j, { p_sexo: 'x' })).data.erro, 'valor_invalido');
  assert.equal((await extra(j, { p_roupa: 'DROP TABLE' })).data.erro, 'valor_invalido');
  assert.equal((await extra(j, { p_bicho: "a'b" })).data.erro, 'valor_invalido');
  assert.equal((await extra(j, { p_bichos: 9999 })).data.erro, 'valor_invalido');
  assert.equal((await extra(j, { p_moedas: -5 })).data.erro, 'valor_invalido');
  assert.equal((await extra(j, { p_moedas: 1000 })).data.ok, true);
  assert.equal((await extra(j, { p_moedas: 10, p_roupa: 'evt:mar' })).data.ok, true);
  assert.equal(consulta(db, `select moedas_total::int m from perfis where id = '${j.uid}'`)[0].m, 1000);   // não diminui
  assert.equal((await extra(j, { p_moedas: 9e15 })).data.ok, true);
  assert.equal(consulta(db, `select moedas_total::int m from perfis where id = '${j.uid}'`)[0].m, 1000 + 5000);   // teto por envio (poder 0)
  const sem = cliente(db, null, 'anon'); assert.ok((await sem.rpc('jogo_classificacao')).error);
});

test('classificação por categoria e servidor, com aparência', async () => {
  const x = await jogador(db, 'ClsX', 1), y = await jogador(db, 'ClsY', 1), z = await jogador(db, 'ClsZ', 1);
  admin(db, `update perfis set servidor = 7 where id in ('${x.uid}','${y.uid}','${z.uid}'); update perfis set poder = 500, prestigio = 0 where id = '${x.uid}'; update perfis set poder = 900 where id = '${y.uid}'`);
  await extra(x, { p_moedas: 4000, p_bichos: 9, p_roupas: 5, p_roupa: 'evt:polar' }); await extra(y, { p_moedas: 2000, p_bichos: 12, p_roupas: 2, p_sexo: 'f' });
  const poder = (await x.rpc('jogo_classificacao', { p_cat: 'poder' })).data;
  assert.equal(poder.ok, true); assert.equal(poder.servidor, 7); assert.deepEqual(poder.top.map(t => t.nome), ['ClsY', 'ClsX']);
  assert.equal(poder.eu.pos, 2); assert.equal(poder.top[1].voce, true);
  assert.deepEqual(poder.servidores.map(s => s.n).sort(), [1, 2, 7]);
  const bichos = (await x.rpc('jogo_classificacao', { p_cat: 'bichos' })).data; assert.deepEqual(bichos.top.map(t => t.nome), ['ClsY', 'ClsX']); assert.equal(bichos.top[0].valor, 12);
  const fant = (await x.rpc('jogo_classificacao', { p_cat: 'fantasias' })).data; assert.equal(fant.top[0].nome, 'ClsX'); assert.equal(fant.top[0].avatar.roupa, 'evt:polar');
  const moedas = (await x.rpc('jogo_classificacao', { p_cat: 'moedas' })).data; assert.equal(moedas.top[0].nome, 'ClsX');
  assert.equal(moedas.top[0].avatar.sexo, 'm'); assert.equal(moedas.top[1].avatar.sexo, 'f');
  assert.equal((await z.rpc('jogo_classificacao', { p_cat: 'bichos' })).data.eu.pos, null);   // sem bichos informados: sem posição
  assert.equal((await x.rpc('jogo_classificacao', { p_cat: 'outra' })).data.erro, 'categoria_invalida');
  const outro = (await x.rpc('jogo_classificacao', { p_cat: 'poder', p_servidor: 1 })).data; assert.equal(outro.servidor, 1); assert.ok(!outro.top.some(t => t.nome === 'ClsX'));
  assert.equal(comoUsuario(db, x.uid, 'select * from priv.classif(\'poder\', 7);').ok, false);
});
