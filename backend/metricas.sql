-- Sítio dos Bichos: consultas de métricas. Rode no editor SQL do Supabase (ele acessa as tabelas direto;
-- os jogadores não). Os dados vêm da tabela eventos_app, que só recebe nomes de uma lista fixa, sem dados pessoais.
-- Datas no fuso America/Sao_Paulo.

-- 1) Jogadores ativos por dia (DAU), últimos 30 dias
select dia, count(distinct user_id) as dau
  from eventos_app
 where nome = 'sessao' and dia >= (now() at time zone 'America/Sao_Paulo')::date - 30
 group by dia order by dia desc;

-- 2) Retenção por coorte: % de quem criou a conta no dia X que voltou no D1, D7 e D30
with coorte as (
  select id, (criado_em at time zone 'America/Sao_Paulo')::date as dia0 from perfis
),
volta as (
  select c.dia0, c.id,
         bool_or(e.dia = c.dia0 + 1)  as d1,
         bool_or(e.dia = c.dia0 + 7)  as d7,
         bool_or(e.dia = c.dia0 + 30) as d30
    from coorte c left join eventos_app e on e.user_id = c.id and e.nome = 'sessao'
   group by c.dia0, c.id
)
select dia0 as dia_de_entrada, count(*) as novos,
       round(100.0 * count(*) filter (where d1)  / count(*), 1) as d1_pct,
       round(100.0 * count(*) filter (where d7)  / count(*), 1) as d7_pct,
       round(100.0 * count(*) filter (where d30) / count(*), 1) as d30_pct
  from volta group by dia0 order by dia0 desc limit 60;

-- 3) Anúncios recompensados assistidos por dia e por jogador ativo
select a.dia, a.anuncios, d.dau, round(a.anuncios::numeric / nullif(d.dau, 0), 2) as anuncios_por_jogador
  from (select dia, count(*) as anuncios from eventos_app where nome = 'anuncio' group by dia) a
  join (select dia, count(distinct user_id) as dau from eventos_app where nome = 'sessao' group by dia) d using (dia)
 order by a.dia desc limit 30;

-- 4) Funil de entrada: criou perfil, terminou o tutorial, chegou ao nível 5, entrou numa guilda
select (select count(*) from perfis) as perfis,
       (select count(distinct user_id) from eventos_app where nome = 'tutorial_fim') as tutorial_feito,
       (select count(*) from perfis where nivel >= 5) as nivel_5_ou_mais,
       (select count(*) from membros) as em_guilda;

-- 5) Uso das novidades (total e por dia nos últimos 14 dias)
select nome, count(*) as total, count(*) filter (where dia >= (now() at time zone 'America/Sao_Paulo')::date - 14) as ultimos_14_dias
  from eventos_app where nome in ('pedido', 'horta', 'evento_semana', 'prestigio', 'convite', 'compra_simulada')
 group by nome order by total desc;

-- 6) Convites: quantos jogadores chegaram por convite e quantos passaram do nível 3
select count(*) filter (where convidado_por is not null) as por_convite,
       count(*) filter (where convidado_por is not null and nivel >= 3) as por_convite_nivel_3
  from perfis;
