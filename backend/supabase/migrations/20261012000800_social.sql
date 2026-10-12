-- Sítio dos Bichos: liga de guildas, troca de bichos, chat por frases prontas, passe de guilda e painel de métricas.
-- Rode UMA vez no SQL Editor do Supabase, depois da migração 7.

----------------------------------------------------------------------------
-- 1. Liga de guildas: bronze (0), prata (1) e ouro (2). Fecha uma vez por semana.
----------------------------------------------------------------------------
alter table public.guildas
  add column liga      smallint    not null default 0 check (liga between 0 and 2),
  add column passe_ate timestamptz;

create table public.liga_semanas (
  semana date primary key,
  fechada_em timestamptz not null default now()
);
create table public.liga_resultados (
  semana     date not null,
  guilda_id  uuid not null references public.guildas (id) on delete cascade,
  liga       smallint not null,
  pos        int not null,
  mov        smallint not null,           -- 1 subiu, -1 desceu, 0 ficou
  primary key (semana, guilda_id)
);
create table public.liga_premios (
  user_id uuid not null references public.perfis (id) on delete cascade,
  semana  date not null,
  primary key (user_id, semana)
);
alter table public.liga_semanas     enable row level security;
alter table public.liga_resultados  enable row level security;
alter table public.liga_premios     enable row level security;

-- Fecha a semana anterior (só a primeira chamada da semana faz o trabalho): os 3 melhores de cada liga sobem,
-- os 3 piores descem (a liga precisa ter pelo menos 4 guildas para subir e 8 para descer).
create function priv.liga_fechar() returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_ant date := priv.semana() - 7;
  v_linhas int;
begin
  insert into public.liga_semanas (semana) values (v_ant) on conflict do nothing;
  get diagnostics v_linhas = row_count;
  if v_linhas = 0 then return; end if;
  insert into public.liga_resultados (semana, guilda_id, liga, pos, mov)
  select v_ant, t.guilda_id, t.liga, t.p, case
           when t.liga < 2 and t.n >= 4 and t.p <= 3 then 1
           when t.liga > 0 and t.n >= 8 and t.p > t.n - 3 then -1
           else 0 end
    from (
      select r.guilda_id, g.liga, row_number() over (partition by g.liga order by r.pontos desc, r.nome)::int as p,
             count(*) over (partition by g.liga)::int as n
        from priv.placar_guildas(v_ant) r join public.guildas g on g.id = r.guilda_id
    ) t;
  update public.guildas g set liga = least(2, greatest(0, g.liga + r.mov))
    from public.liga_resultados r where r.guilda_id = g.id and r.semana = v_ant and r.mov <> 0;
end $$;

create function public.jogo_liga_estado() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_g uuid := priv.guilda_do(v_uid);
  v_gu public.guildas;
  v_ant date := priv.semana() - 7;
  v_top jsonb; v_res jsonb := null; v_pos int; v_total int;
begin
  if v_g is null then return jsonb_build_object('ok', false, 'erro', 'sem_guilda'); end if;
  perform priv.liga_fechar();
  select * into v_gu from public.guildas where id = v_g;
  select coalesce(jsonb_agg(jsonb_build_object('pos', x.p, 'nome', x.nome, 'pontos', x.pontos, 'minha', x.guilda_id = v_g) order by x.p), '[]'::jsonb)
    into v_top
    from (select r.guilda_id, r.nome, r.pontos, row_number() over (order by r.pontos desc, r.nome)::int p
            from priv.placar_guildas(priv.semana()) r join public.guildas g on g.id = r.guilda_id where g.liga = v_gu.liga) x
   where x.p <= 10;
  select x.p, x.n into v_pos, v_total
    from (select r.guilda_id, row_number() over (order by r.pontos desc, r.nome)::int p, count(*) over ()::int n
            from priv.placar_guildas(priv.semana()) r join public.guildas g on g.id = r.guilda_id where g.liga = v_gu.liga) x
   where x.guilda_id = v_g;
  select jsonb_build_object('pos', r.pos, 'mov', r.mov, 'liga', r.liga, 'semana', r.semana,
                            'premio_pendente', r.pos <= 3 and not exists (select 1 from public.liga_premios p where p.user_id = v_uid and p.semana = v_ant)
                              and coalesce((select pontos from public.pontos_semana ps where ps.user_id = v_uid and ps.semana = v_ant), 0) >= 30)
    into v_res from public.liga_resultados r where r.guilda_id = v_g and r.semana = v_ant;
  return jsonb_build_object('ok', true, 'liga', v_gu.liga, 'top', v_top, 'minha_pos', v_pos, 'total', v_total, 'passada', v_res,
    'passe_resta', greatest(0, coalesce(extract(epoch from (v_gu.passe_ate - now()))::int, 0)),
    'termina_em', extract(epoch from (((priv.semana() + 7)::timestamp at time zone 'America/Sao_Paulo') - now()))::int);
end $$;

create function public.jogo_liga_resgatar() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_g uuid := priv.guilda_do(v_uid);
  v_ant date := priv.semana() - 7;
  v_r public.liga_resultados;
  v_linhas int;
begin
  if v_g is null then return jsonb_build_object('ok', false, 'erro', 'sem_guilda'); end if;
  perform priv.liga_fechar();
  select * into v_r from public.liga_resultados where guilda_id = v_g and semana = v_ant;
  if not found or v_r.pos > 3 then return jsonb_build_object('ok', false, 'erro', 'sem_premio'); end if;
  if coalesce((select pontos from public.pontos_semana where user_id = v_uid and semana = v_ant), 0) < 30 then
    return jsonb_build_object('ok', false, 'erro', 'pontos_minimos');
  end if;
  insert into public.liga_premios (user_id, semana) values (v_uid, v_ant) on conflict do nothing;
  get diagnostics v_linhas = row_count;
  if v_linhas = 0 then return jsonb_build_object('ok', false, 'erro', 'ja_resgatado'); end if;
  return jsonb_build_object('ok', true, 'liga', v_r.liga, 'pos', v_r.pos);
end $$;

----------------------------------------------------------------------------
-- 2. Passe de guilda (compra simulada no protótipo; no app vira compra do Google Play): +7 dias de bônus para todos
----------------------------------------------------------------------------
create function public.jogo_guilda_passe() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_g uuid := priv.guilda_do(v_uid);
  v_ate timestamptz;
begin
  if v_g is null then return jsonb_build_object('ok', false, 'erro', 'sem_guilda'); end if;
  if not priv.limite('guilda_passe', 6) then return jsonb_build_object('ok', false, 'erro', 'limite_hora'); end if;
  select passe_ate into v_ate from public.guildas where id = v_g for update;
  if v_ate is not null and v_ate > now() + interval '28 days' then return jsonb_build_object('ok', false, 'erro', 'max'); end if;
  update public.guildas set passe_ate = greatest(coalesce(passe_ate, now()), now()) + interval '7 days' where id = v_g returning passe_ate into v_ate;
  perform priv.mural(v_g, v_uid, 'reacao', priv.nome_de(v_uid) || ' ativou o Passe da guilda!');
  return jsonb_build_object('ok', true, 'passe_resta', extract(epoch from (v_ate - now()))::int);
end $$;

----------------------------------------------------------------------------
-- 3. Troca de bichos: 1 envio e 1 recebimento por dia, só bichos até raridade 3 do catálogo
----------------------------------------------------------------------------
create table public.trocas_bicho (
  id       bigint generated always as identity primary key,
  de       uuid not null references public.perfis (id) on delete cascade,
  para     uuid not null references public.perfis (id) on delete cascade,
  pet      text not null references public.catalogo_pets (id),
  dia      date not null default priv.hoje(),
  pego_em  timestamptz,
  check (de <> para),
  unique (de, dia),
  unique (para, dia)
);
create index trocas_para_idx on public.trocas_bicho (para, pego_em, dia);
alter table public.trocas_bicho enable row level security;

create function public.jogo_troca_enviar(p_para uuid, p_pet text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
begin
  if p_para is null or p_para = v_uid or p_pet is null or p_pet !~ '^[a-z0-9_]{2,24}$' then
    return jsonb_build_object('ok', false, 'erro', 'valor_invalido');
  end if;
  if not exists (select 1 from public.perfis where id = v_uid) then return jsonb_build_object('ok', false, 'erro', 'sem_perfil'); end if;
  if not exists (select 1 from public.perfis where id = p_para) then return jsonb_build_object('ok', false, 'erro', 'alvo_invalido'); end if;
  if not exists (select 1 from public.catalogo_pets where id = p_pet and raridade <= 3) then return jsonb_build_object('ok', false, 'erro', 'bicho_invalido'); end if;
  if not priv.limite('troca_env', 20) then return jsonb_build_object('ok', false, 'erro', 'limite_hora'); end if;
  if exists (select 1 from public.trocas_bicho where de = v_uid and dia = priv.hoje()) then return jsonb_build_object('ok', false, 'erro', 'limite_dia'); end if;
  if exists (select 1 from public.trocas_bicho where para = p_para and dia = priv.hoje()) then return jsonb_build_object('ok', false, 'erro', 'destino_ocupado'); end if;
  insert into public.trocas_bicho (de, para, pet) values (v_uid, p_para, p_pet);
  return jsonb_build_object('ok', true);
end $$;

create function public.jogo_troca_caixa() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
begin
  return jsonb_build_object('ok', true, 'itens', coalesce((
    select jsonb_agg(jsonb_build_object('id', t.id, 'pet', t.pet, 'de', priv.nome_de(t.de)) order by t.id)
      from public.trocas_bicho t where t.para = v_uid and t.pego_em is null and t.dia >= priv.hoje() - 2), '[]'::jsonb));
end $$;

create function public.jogo_troca_pegar(p_id bigint) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_pet text;
begin
  if not priv.limite('troca_pegar', 20) then return jsonb_build_object('ok', false, 'erro', 'limite_hora'); end if;
  update public.trocas_bicho set pego_em = now()
   where id = p_id and para = v_uid and pego_em is null and dia >= priv.hoje() - 2 returning pet into v_pet;
  if v_pet is null then return jsonb_build_object('ok', false, 'erro', 'nada'); end if;
  return jsonb_build_object('ok', true, 'pet', v_pet);
end $$;

----------------------------------------------------------------------------
-- 4. Chat da guilda por frases prontas (nada de texto livre)
----------------------------------------------------------------------------
create table public.guilda_chat (
  id        bigint generated always as identity primary key,
  guilda_id uuid not null references public.guildas (id) on delete cascade,
  user_id   uuid not null references public.perfis (id) on delete cascade,
  cod       smallint not null check (cod between 0 and 15),
  criado_em timestamptz not null default now()
);
create index guilda_chat_idx on public.guilda_chat (guilda_id, id desc);
alter table public.guilda_chat enable row level security;

create function public.jogo_chat_enviar(p_cod int) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_g uuid := priv.guilda_do(v_uid);
begin
  if v_g is null then return jsonb_build_object('ok', false, 'erro', 'sem_guilda'); end if;
  if p_cod is null or p_cod not between 0 and 15 then return jsonb_build_object('ok', false, 'erro', 'valor_invalido'); end if;
  if not priv.limite('chat', 40) then return jsonb_build_object('ok', false, 'erro', 'limite_hora'); end if;
  insert into public.guilda_chat (guilda_id, user_id, cod) values (v_g, v_uid, p_cod);
  delete from public.guilda_chat where guilda_id = v_g and criado_em < now() - interval '3 days';
  return jsonb_build_object('ok', true);
end $$;

create function public.jogo_chat_listar() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_g uuid := priv.guilda_do(v_uid);
begin
  if v_g is null then return jsonb_build_object('ok', false, 'erro', 'sem_guilda'); end if;
  return jsonb_build_object('ok', true, 'msgs', coalesce((
    select jsonb_agg(x.j order by x.id) from (
      select c.id, jsonb_build_object('id', c.id, 'cod', c.cod, 'nome', priv.nome_de(c.user_id), 'meu', c.user_id = v_uid,
                                      'segundos', extract(epoch from now() - c.criado_em)::int) j
        from public.guilda_chat c where c.guilda_id = v_g order by c.id desc limit 30) x), '[]'::jsonb));
end $$;

----------------------------------------------------------------------------
-- 5. Painel de métricas (só para você, no SQL Editor; nada disso fica exposto ao app)
----------------------------------------------------------------------------
create view priv.painel_diario as
select dia,
       count(distinct user_id) filter (where nome = 'sessao')        as jogadores_ativos,
       count(*) filter (where nome = 'tutorial_fim')                 as tutoriais_concluidos,
       count(*) filter (where nome = 'ovo')                          as ovos_abertos,
       count(*) filter (where nome = 'anuncio')                      as anuncios_vistos,
       count(*) filter (where nome = 'compra_simulada')              as compras_simuladas,
       count(*) filter (where nome = 'prestigio')                    as prestigios
  from public.eventos_app group by dia order by dia desc;

create view priv.painel_retencao as
select p.criado_em::date as dia_entrada, count(*) as novos,
       count(*) filter (where exists (select 1 from public.eventos_app e where e.user_id = p.id and e.nome = 'sessao' and e.dia = p.criado_em::date + 1)) as voltou_d1,
       count(*) filter (where exists (select 1 from public.eventos_app e where e.user_id = p.id and e.nome = 'sessao' and e.dia = p.criado_em::date + 7)) as voltou_d7
  from public.perfis p group by 1 order by 1 desc;

create view priv.painel_niveis as
select nivel, count(*) as jogadores from public.perfis group by nivel order by nivel;

create view priv.painel_recursos as
select nome, count(*) as usos, count(distinct user_id) as jogadores
  from public.eventos_app where dia >= current_date - 7 group by nome order by usos desc;

----------------------------------------------------------------------------
-- 6. Permissões
----------------------------------------------------------------------------
revoke all on table public.liga_semanas, public.liga_resultados, public.liga_premios, public.trocas_bicho, public.guilda_chat from public, anon, authenticated;
revoke all on priv.painel_diario, priv.painel_retencao, priv.painel_niveis, priv.painel_recursos from public, anon, authenticated;
revoke all on function priv.liga_fechar() from public, anon, authenticated;
revoke all on function
  public.jogo_liga_estado(), public.jogo_liga_resgatar(), public.jogo_guilda_passe(),
  public.jogo_troca_enviar(uuid, text), public.jogo_troca_caixa(), public.jogo_troca_pegar(bigint),
  public.jogo_chat_enviar(int), public.jogo_chat_listar()
from public, anon, authenticated;
grant execute on function
  public.jogo_liga_estado(), public.jogo_liga_resgatar(), public.jogo_guilda_passe(),
  public.jogo_troca_enviar(uuid, text), public.jogo_troca_caixa(), public.jogo_troca_pegar(bigint),
  public.jogo_chat_enviar(int), public.jogo_chat_listar()
to authenticated;
