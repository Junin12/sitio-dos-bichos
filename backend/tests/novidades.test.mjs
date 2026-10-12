import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { criarBanco, removerBanco, jogador, admin, consulta, comoUsuario, cliente } from './ajuda.mjs';

let db;
before(() => { db = criarBanco(); });
after(() => removerBanco(db));

test('catálogo: só animais que existiram (inclui pré-históricos), sem unicórnio e dragão', () => {
  const ids = consulta(db, 'select id from catalogo_pets').map(r => r.id);
  for (const f of ['unicornio', 'dragao']) assert.ok(!ids.includes(f), f);
  for (const v of ['arara', 'elefante', 'onca', 'cisne', 'pinguim', 'tigre', 'mamute', 'dino', 'trex']) assert.ok(ids.includes(v), v);
  assert.equal(ids.length, 48);
});

test('prestígio: só depois do nível 25, de 1 em 1, poder acompanha', async () => {
  const c = await jogador(db, 'Presti', 20);
  assert.equal((await c.rpc('jogo_perfil_atualizar', { p_nome: null, p_nivel: 20, p_poder: 0, p_prestigio: 1 })).data.erro, 'prestigio_invalido');
  await c.rpc('jogo_perfil_atualizar', { p_nome: null, p_nivel: 25, p_poder: 100 });
  await c.rpc('jogo_perfil_atualizar', { p_nome: null, p_nivel: 25, p_poder: 100 });
  assert.equal((await c.rpc('jogo_perfil_atualizar', { p_nome: null, p_nivel: 1, p_poder: 900, p_prestigio: 2 })).data.erro, 'prestigio_invalido');
  assert.equal((await c.rpc('jogo_perfil_atualizar', { p_nome: null, p_nivel: 1, p_poder: 900, p_prestigio: 1 })).data.ok, true);
  assert.equal((await c.rpc('jogo_perfil_atualizar', { p_nome: null, p_nivel: 1, p_poder: 900, p_prestigio: 0 })).data.erro, 'prestigio_invalido');
  assert.equal((await c.rpc('jogo_perfil_atualizar', { p_nome: null, p_nivel: 1, p_poder: 99999999, p_prestigio: 1 })).data.erro, 'poder_invalido');
  // sem prestígio o teto continua o antigo
  const d = await jogador(db, 'SemPresti', 1);
  assert.equal((await d.rpc('jogo_perfil_atualizar', { p_nome: null, p_nivel: 1, p_poder: 900 })).data.erro, 'poder_invalido');
});

test('convites: código, uso único, não o próprio, recompensa só por convidado ativo', async () => {
  const dono = await jogador(db, 'Dono', 1);
  const { codigo } = (await dono.rpc('jogo_convite_codigo')).data;
  assert.match(codigo, /^[0-9A-F]{7}$/);
  const amigo = await jogador(db, 'Amigo', 1);
  assert.equal((await dono.rpc('jogo_convite_usar', { p_codigo: codigo })).data.erro, 'convite_proprio');
  assert.equal((await amigo.rpc('jogo_convite_usar', { p_codigo: 'ZZZZZZZ' })).data.erro, 'convite_invalido');
  assert.equal((await amigo.rpc('jogo_convite_usar', { p_codigo: codigo.toLowerCase() })).data.ok, true);
  assert.equal((await amigo.rpc('jogo_convite_usar', { p_codigo: codigo })).data.erro, 'convite_ja_usado');
  assert.equal((await dono.rpc('jogo_convites_resgatar')).data.erro, 'nada_a_resgatar');   // amigo ainda no nível 1
  await amigo.rpc('jogo_perfil_atualizar', { p_nome: null, p_nivel: 3, p_poder: 10 });
  const r = (await dono.rpc('jogo_convites_resgatar')).data;
  assert.equal(r.ok, true); assert.equal(r.novos, 1);
  assert.equal((await dono.rpc('jogo_convites_resgatar')).data.erro, 'nada_a_resgatar');
  assert.equal((await dono.rpc('jogo_convite_codigo')).data.convidados, 1);
  // quem já é veterano não pode usar convite
  const vet = await jogador(db, 'Veterano', 11);
  assert.equal((await vet.rpc('jogo_convite_usar', { p_codigo: codigo })).data.erro, 'convite_tarde');
});

test('visitas e curtidas: mostra só o necessário, 1 curtida por dia, não a si mesmo', async () => {
  const a = await jogador(db, 'Anfitriao', 3), v = await jogador(db, 'Visitante', 2);
  const dados = { pets: { coelho: { lvl: 3, nome: 'Bolinha' }, fantasma: { lvl: 9 }, leao: { lvl: 99 } }, decor: { girassol: 1, lixo: 1 }, obras: { celeiro: 4, moinho: 99 }, tema: 'inverno', coins: 123456, segredo: 'x' };
  assert.equal((await a.rpc('jogo_save_salvar', { p_dados: dados, p_versao: 0 })).data.ok, true);
  const s = (await v.rpc('jogo_visitar', { p_alvo: a.uid })).data.sitio;
  assert.equal(s.nome, 'Anfitriao');
  assert.deepEqual(Object.keys(s.pets).sort(), ['coelho', 'leao']);
  assert.equal(s.pets.leao.lvl, 10); assert.equal(s.pets.coelho.nome, 'Bolinha');
  assert.deepEqual(Object.keys(s.decor), ['girassol']);
  assert.equal(s.obras.moinho, 10); assert.equal(s.tema, 'inverno');
  assert.equal(JSON.stringify(s).includes('123456'), false);
  assert.equal((await v.rpc('jogo_visitar', { p_alvo: '00000000-0000-0000-0000-000000000000' })).data.erro, 'alvo_invalido');
  assert.equal((await v.rpc('jogo_curtir', { p_alvo: v.uid })).data.erro, 'alvo_invalido');
  assert.equal((await v.rpc('jogo_curtir', { p_alvo: a.uid })).data.ok, true);
  assert.equal((await v.rpc('jogo_curtir', { p_alvo: a.uid })).data.erro, 'ja_curtiu');
  assert.equal((await v.rpc('jogo_visitar', { p_alvo: a.uid })).data.sitio.curtidas, 1);
  assert.equal((await v.rpc('jogo_visitar', { p_alvo: a.uid })).data.sitio.curtiu_hoje, true);
  // save com lixo não derruba a visita
  const b = await jogador(db, 'Quebrado', 2);
  await b.rpc('jogo_save_salvar', { p_dados: { pets: { coelho: { lvl: 'abc' } } }, p_versao: 0 });
  assert.equal((await v.rpc('jogo_visitar', { p_alvo: b.uid })).data.ok, true);
  // ranking agora traz o id
  admin(db, `update perfis set poder = 50 where id = '${a.uid}'`);
  assert.ok((await v.rpc('jogo_ranking', { p_limite: 5 })).data.top.every(x => x.id));
});

test('reações: só frases prontas, precisa de guilda, limite por hora', async () => {
  const a = await jogador(db, 'ReaA', 6);
  assert.equal((await a.rpc('jogo_mural_reagir', { p_reacao: 'oi' })).data.erro, 'sem_guilda');
  await a.rpc('jogo_guilda_criar', { p_nome: 'Reativos', p_lema: '' });
  assert.equal((await a.rpc('jogo_mural_reagir', { p_reacao: 'xingamento' })).data.erro, 'tipo_invalido');
  assert.equal((await a.rpc('jogo_mural_reagir', { p_reacao: 'bora' })).data.ok, true);
  assert.equal((await a.rpc('jogo_mural_reagir', { p_reacao: 'bora' })).data.ok, true);   // sem bloqueio de repetição
  const m = (await a.rpc('jogo_guilda_estado')).data.mural.find(x => x.tipo === 'reacao');
  assert.match(m.texto, /ReaA: 💪 Bora bater a meta!/);
  let erro; for (let i = 0; i < 12; i++) erro = (await a.rpc('jogo_mural_reagir', { p_reacao: 'oi' })).data.erro;
  assert.equal(erro, 'limite_hora');
});

test('guilda x guilda: mínimo de 3 ativos, ranking semanal e prêmio da semana passada', async () => {
  const mk = async (nome, n) => {
    const l = await jogador(db, nome + '0', 5);
    const { guilda_id } = (await l.rpc('jogo_guilda_criar', { p_nome: nome, p_lema: '' })).data;
    const todos = [l];
    for (let i = 1; i < n; i++) { const m = await jogador(db, nome + i, 5); await m.rpc('jogo_guilda_entrar', { p_guilda: guilda_id }); todos.push(m); }
    return todos;
  };
  const alfa = await mk('Alfa', 3), beta = await mk('Beta', 3), gama = await mk('Gama', 2);
  const pontos = (js, p, sem) => js.forEach(j => admin(db, `insert into pontos_semana (user_id, semana, pontos) values ('${j.uid}', ${sem}, ${p}) on conflict (user_id, semana) do update set pontos = excluded.pontos`));
  const atual = `(select date_trunc('week', now() at time zone 'America/Sao_Paulo')::date)`;
  const passada = `((select date_trunc('week', now() at time zone 'America/Sao_Paulo')::date) - 7)`;
  pontos(alfa, 100, atual); pontos(beta, 200, atual); pontos(gama, 900, atual);   // Gama tem só 2: fora
  let r = (await alfa[0].rpc('jogo_ranking_guildas')).data;
  assert.deepEqual(r.top.map(x => x.nome), ['Beta', 'Alfa']);
  assert.equal(r.minha.pos, 2); assert.equal(r.premio, null);
  assert.equal((await gama[0].rpc('jogo_ranking_guildas')).data.minha, null);
  // semana passada: Alfa ganhou
  pontos(alfa, 300, passada); pontos(beta, 100, passada);
  r = (await alfa[1].rpc('jogo_ranking_guildas')).data;
  assert.equal(r.premio.posicao, 1);
  assert.equal((await beta[1].rpc('jogo_ranking_guildas')).data.premio.posicao, 2);
  assert.equal((await alfa[1].rpc('jogo_premio_guilda_resgatar')).data.posicao, 1);
  assert.equal((await alfa[1].rpc('jogo_premio_guilda_resgatar')).data.erro, 'ja_resgatado');
  assert.equal((await alfa[1].rpc('jogo_ranking_guildas')).data.premio, null);
  assert.equal((await gama[0].rpc('jogo_premio_guilda_resgatar')).data.erro, 'pontos_minimos');
  // quem fez menos de 30 pontos na semana não leva
  admin(db, `update pontos_semana set pontos = 10 where user_id = '${alfa[2].uid}' and semana = ${passada}`);
  assert.equal((await alfa[2].rpc('jogo_premio_guilda_resgatar')).data.erro, 'pontos_minimos');
});

test('métricas: lista fixa de nomes, sessão uma vez por dia, tabelas fechadas', async () => {
  const j = await jogador(db, 'Metrica', 1);
  assert.equal((await j.rpc('jogo_evento', { p_nome: 'hack' })).data.erro, 'tipo_invalido');
  await j.rpc('jogo_evento', { p_nome: 'sessao' }); await j.rpc('jogo_evento', { p_nome: 'sessao' });
  await j.rpc('jogo_evento', { p_nome: 'anuncio' }); await j.rpc('jogo_evento', { p_nome: 'anuncio' });
  const q = consulta(db, `select nome, count(*)::int n from eventos_app where user_id = '${j.uid}' group by nome order by nome`);
  assert.deepEqual(q, [{ nome: 'anuncio', n: 2 }, { nome: 'sessao', n: 1 }]);
  for (const t of ['eventos_app', 'curtidas', 'premios_guilda', 'perfis']) {
    const r = comoUsuario(db, j.uid, `select * from public.${t};`);
    assert.equal(r.ok, false, t);
  }
  const anon = cliente(db, null, 'anon');
  assert.ok((await anon.rpc('jogo_evento', { p_nome: 'sessao' })).error);
  assert.ok((await anon.rpc('jogo_visitar', { p_alvo: j.uid })).error);
});

test('apagar conta: some tudo do jogador, guilda passa para o vizinho, anônimo não apaga', async () => {
  const a = await jogador(db, 'Lider', 6), b = await jogador(db, 'Vice', 5);
  const g = (await a.rpc('jogo_guilda_criar', { p_nome: 'Saideira', p_lema: '' })).data.guilda_id;
  await b.rpc('jogo_guilda_entrar', { p_guilda: g });
  await a.rpc('jogo_save_salvar', { p_dados: { x: 1 }, p_versao: 0 });
  await a.rpc('jogo_evento', { p_nome: 'sessao' });
  assert.equal((await cliente(db, null, 'anon').rpc('jogo_conta_apagar')).error ? true : false, true);
  assert.equal((await a.rpc('jogo_conta_apagar')).data.ok, true);
  for (const t of ['perfis', 'saves', 'membros', 'eventos_app']) {
    const col = t === 'perfis' ? 'id' : 'user_id';
    assert.equal(consulta(db, `select count(*)::int n from ${t} where ${col} = '${a.uid}'`)[0].n, 0, t);
  }
  assert.equal(consulta(db, `select dono_id from guildas where id = '${g}'`)[0].dono_id, b.uid);
  assert.equal((await b.rpc('jogo_guilda_estado')).data.guilda.nome, 'Saideira');
  // a última pessoa a apagar a conta fecha a guilda
  assert.equal((await b.rpc('jogo_conta_apagar')).data.ok, true);
  assert.equal(consulta(db, `select count(*)::int n from guildas where id = '${g}'`)[0].n, 0);
});
