import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { criarBanco, removerBanco, jogador, admin } from './ajuda.mjs';

let db;
before(() => { db = criarBanco(); });
after(() => removerBanco(db));

async function dupla(nomeGuilda) {
  const a = await jogador(db, 'A' + nomeGuilda, 5);
  const b = await jogador(db, 'B' + nomeGuilda, 5);
  const { guilda_id } = (await a.rpc('jogo_guilda_criar', { p_nome: nomeGuilda, p_lema: '' })).data;
  await b.rpc('jogo_guilda_entrar', { p_guilda: guilda_id });
  return { a, b, guilda_id };
}

test('contribuir: motivo, teto por motivo, sem guilda, acumulado', async () => {
  const { a } = await dupla('Pontos1');
  const solo = await jogador(db, 'Solo', 5);
  assert.equal((await solo.rpc('jogo_contribuir', { p_pontos: 5, p_motivo: 'ovo' })).data.erro, 'sem_guilda');
  assert.equal((await a.rpc('jogo_contribuir', { p_pontos: 5, p_motivo: 'hack' })).data.erro, 'motivo_invalido');
  assert.equal((await a.rpc('jogo_contribuir', { p_pontos: 11, p_motivo: 'ovo' })).data.erro, 'pontos_invalidos');
  assert.equal((await a.rpc('jogo_contribuir', { p_pontos: 0, p_motivo: 'ovo' })).data.erro, 'pontos_invalidos');
  assert.equal((await a.rpc('jogo_contribuir', { p_pontos: 6, p_motivo: 'safra' })).data.erro, 'pontos_invalidos');
  assert.equal((await a.rpc('jogo_contribuir', { p_pontos: 60, p_motivo: 'coleta' })).data.pontos_semana, 60);
  assert.equal((await a.rpc('jogo_contribuir', { p_pontos: 30, p_motivo: 'missao' })).data.pontos_semana, 90);
});

test('contribuir tem limite por hora (400 pontos)', async () => {
  const { a } = await dupla('Pontos2');
  for (let i = 0; i < 6; i++) assert.equal((await a.rpc('jogo_contribuir', { p_pontos: 60, p_motivo: 'coleta' })).data.ok, true);
  assert.equal((await a.rpc('jogo_contribuir', { p_pontos: 60, p_motivo: 'coleta' })).data.erro, 'limite_hora');
});

test('doar: valida, soma ao fundo, gera pontos e mural', async () => {
  const { a, b } = await dupla('Doacao');
  assert.equal((await a.rpc('jogo_guilda_doar', { p_valor: 0 })).data.erro, 'valor_invalido');
  assert.equal((await a.rpc('jogo_guilda_doar', { p_valor: -5 })).data.erro, 'valor_invalido');
  const d = (await a.rpc('jogo_guilda_doar', { p_valor: 5000 })).data;
  assert.deepEqual([d.ok, d.fundo, d.pontos], [true, 5000, 100]);
  assert.equal(d.nivel, 3); // degraus: 2500 (nível 2), 4250 (nível 3), 7225 (nível 4)
  const e = (await b.rpc('jogo_guilda_estado')).data;
  assert.equal(e.guilda.fundo, 5000);
  assert.equal(e.semana.total, 100);
  assert.ok(e.mural.some(m => m.tipo === 'doacao'));
  const solo = await jogador(db, 'SemGuilda', 5);
  assert.equal((await solo.rpc('jogo_guilda_doar', { p_valor: 100 })).data.erro, 'sem_guilda');
});

test('ajudar: uma vez por dia por alvo, não a si, só colega', async () => {
  const { a, b } = await dupla('Ajuda');
  const fora = await jogador(db, 'Forasteiro', 5);
  assert.equal((await a.rpc('jogo_guilda_ajudar', { p_alvo: a.uid })).data.erro, 'alvo_invalido');
  assert.equal((await a.rpc('jogo_guilda_ajudar', { p_alvo: fora.uid })).data.erro, 'alvo_invalido');
  const r = (await a.rpc('jogo_guilda_ajudar', { p_alvo: b.uid })).data;
  assert.deepEqual([r.ok, r.pontos], [true, 15]);
  assert.equal((await a.rpc('jogo_guilda_ajudar', { p_alvo: b.uid })).data.erro, 'ja_ajudou_hoje');
  const m = (await a.rpc('jogo_guilda_estado')).data.membros.find(x => x.id === b.uid);
  assert.equal(m.ajudado_hoje, true);
});

test('baús: índice, pontos mínimos, meta e resgate único', async () => {
  const { a, b } = await dupla('Baus');
  assert.equal((await a.rpc('jogo_bau_resgatar', { p_indice: 4 })).data.erro, 'indice_invalido');
  assert.equal((await a.rpc('jogo_bau_resgatar', { p_indice: 0 })).data.erro, 'pontos_minimos');
  for (let i = 0; i < 3; i++) await a.rpc('jogo_contribuir', { p_pontos: 30, p_motivo: 'missao' });
  // 90 pontos do jogador, mas total do grupo ainda é bem menor que a meta (4000)
  assert.equal((await a.rpc('jogo_bau_resgatar', { p_indice: 0 })).data.erro, 'meta_nao_atingida');
  // Dá ao grupo pontos suficientes por fora (simula uma semana cheia) e testa cada baú.
  admin(db, `update pontos_semana set pontos = 1000 where user_id = '${b.uid}';
             insert into pontos_semana (user_id, semana, pontos) select '${b.uid}', priv.semana(), 1000 on conflict do nothing;`);
  const total = (await a.rpc('jogo_guilda_estado')).data.semana;
  assert.ok(total.total >= 1000, JSON.stringify(total));
  assert.equal((await a.rpc('jogo_bau_resgatar', { p_indice: 0 })).data.ok, true);
  assert.equal((await a.rpc('jogo_bau_resgatar', { p_indice: 0 })).data.erro, 'ja_resgatado');
  assert.deepEqual((await a.rpc('jogo_guilda_estado')).data.semana.baus, [0]);
  assert.equal((await a.rpc('jogo_bau_resgatar', { p_indice: 3 })).data.erro, 'meta_nao_atingida');
  admin(db, `update pontos_semana set pontos = 4000 where user_id = '${b.uid}' and semana = priv.semana();`);
  assert.equal((await a.rpc('jogo_bau_resgatar', { p_indice: 3 })).data.ok, true);
});

test('pontos de semanas anteriores não contam', async () => {
  const { a } = await dupla('Passado');
  admin(db, `insert into pontos_semana (user_id, semana, pontos) values ('${a.uid}', priv.semana() - 7, 9999);`);
  const s = (await a.rpc('jogo_guilda_estado')).data.semana;
  assert.equal(s.total, 0);
  assert.equal(s.meus_pontos, 0);
});

test('sair da guilda zera os pontos da semana atual de quem saiu', async () => {
  const { a, b } = await dupla('Saida');
  await b.rpc('jogo_contribuir', { p_pontos: 50, p_motivo: 'coleta' });
  assert.equal((await a.rpc('jogo_guilda_estado')).data.semana.total, 50);
  await b.rpc('jogo_guilda_sair');
  assert.equal((await a.rpc('jogo_guilda_estado')).data.semana.total, 0);
});
