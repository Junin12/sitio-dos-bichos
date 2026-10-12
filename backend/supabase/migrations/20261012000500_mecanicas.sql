-- Sítio dos Bichos: mecânicas de longo prazo (migração 5)
-- Códigos promocionais, chefe da guilda (praga da semana) e corrida de 48 horas.
-- Rode DEPOIS das migrações 1 a 4, uma vez só, no SQL Editor do Supabase.
-- Segue o mesmo desenho das anteriores: tabelas fechadas (RLS), só funções jogo_* acessíveis.

----------------------------------------------------------------------------
-- 1. Códigos promocionais (para divulgação e influenciadores)
----------------------------------------------------------------------------
create table public.codigos_promo (
  codigo      text primary key check (codigo = upper(codigo) and char_length(codigo) between 4 and 24),
  gemas       int  not null default 0 check (gemas between 0 and 500),
  ingressos   int  not null default 0 check (ingressos between 0 and 50),
  valido_ate  timestamptz,
  max_usos    int check (max_usos is null or max_usos > 0),
  usos        int  not null default 0
);
create table public.codigos_usados (
  user_id   uuid not null references public.perfis (id) on delete cascade,
  codigo    text not null references public.codigos_promo (codigo) on delete cascade,
  usado_em  timestamptz not null default now(),
  primary key (user_id, codigo)
);

----------------------------------------------------------------------------
-- 2. Chefe da guilda: uma praga por semana, todos atacam juntos
----------------------------------------------------------------------------
create table public.chefe_dano (
  guilda_id  uuid not null references public.guildas (id) on delete cascade,
  semana     date not null,
  user_id    uuid not null references public.perfis (id) on delete cascade,
  dano       bigint not null default 0 check (dano >= 0),
  primary key (guilda_id, semana, user_id)
);
create table public.chefe_golpes (
  user_id  uuid not null references public.perfis (id) on delete cascade,
  dia      date not null,
  qtd      int  not null default 0,
  primary key (user_id, dia)
);
create table public.chefe_premios (
  user_id  uuid not null references public.perfis (id) on delete cascade,
  semana   date not null,
  primary key (user_id, semana)
);

----------------------------------------------------------------------------
-- 3. Corrida de 48 horas
----------------------------------------------------------------------------
create table public.corrida_pontos (
  user_id  uuid not null references public.perfis (id) on delete cascade,
  janela   int  not null,
  pontos   int  not null default 0 check (pontos >= 0),
  primary key (user_id, janela)
);
create index corrida_pontos_idx on public.corrida_pontos (janela, pontos desc);
create table public.corrida_premios (
  user_id  uuid not null references public.perfis (id) on delete cascade,
  janela   int  not null,
  posicao  smallint not null,
  primary key (user_id, janela)
);

alter table public.codigos_promo   enable row level security;
alter table public.codigos_usados  enable row level security;
alter table public.chefe_dano      enable row level security;
alter table public.chefe_golpes    enable row level security;
alter table public.chefe_premios   enable row level security;
alter table public.corrida_pontos  enable row level security;
alter table public.corrida_premios enable row level security;
revoke all on public.codigos_promo, public.codigos_usados, public.chefe_dano, public.chefe_golpes,
  public.chefe_premios, public.corrida_pontos, public.corrida_premios from public, anon, authenticated;

----------------------------------------------------------------------------
-- 4. Funções auxiliares (schema priv, fechado)
----------------------------------------------------------------------------
-- Janela de 48 h, em horário de Brasília: o mesmo cálculo do jogo (diaDe/2).
create function priv.janela() returns int
language sql stable as $$
  select floor(extract(epoch from (now() at time zone 'America/Sao_Paulo')) / 172800)::int
$$;
create function priv.janela_resta() returns int
language sql stable as $$
  select ((priv.janela() + 1) * 172800 - floor(extract(epoch from (now() at time zone 'America/Sao_Paulo'))))::int
$$;
-- Vida do chefe: cresce com os membros (mínimo 3) e com o nível da guilda.
create function priv.chefe_hp(p_guilda uuid) returns bigint
language plpgsql stable as $$
declare
  v_membros int; v_fundo bigint;
begin
  select count(*) into v_membros from public.membros where guilda_id = p_guilda;
  select fundo into v_fundo from public.guildas where id = p_guilda;
  return round(30000 * greatest(3, v_membros) * (1 + 0.1 * (priv.nivel_guilda(coalesce(v_fundo, 0)) - 1)))::bigint;
end $$;

-- Estado do chefe da guilda do jogador (usado pelas três chamadas).
create function priv.chefe_estado(p_uid uuid) returns jsonb
language plpgsql stable as $$
declare
  v_g uuid := priv.guilda_do(p_uid);
  v_sem date := priv.semana();
  v_hp bigint; v_total bigint; v_meu bigint; v_golpes int; v_top jsonb;
  v_ja_atual boolean; v_ja_ant boolean; v_hp_ant bigint; v_tot_ant bigint; v_meu_ant bigint;
begin
  if v_g is null then return jsonb_build_object('ok', false, 'erro', 'sem_guilda'); end if;
  v_hp := priv.chefe_hp(v_g);
  select coalesce(sum(dano), 0) into v_total from public.chefe_dano where guilda_id = v_g and semana = v_sem;
  select coalesce(max(dano), 0) into v_meu from public.chefe_dano where guilda_id = v_g and semana = v_sem and user_id = p_uid;
  select coalesce(max(qtd), 0) into v_golpes from public.chefe_golpes where user_id = p_uid and dia = priv.hoje();
  select coalesce(jsonb_agg(t order by (t->>'dano')::bigint desc), '[]'::jsonb) into v_top from (
    select jsonb_build_object('nome', priv.nome_de(d.user_id), 'dano', d.dano, 'voce', d.user_id = p_uid) as t
      from public.chefe_dano d where d.guilda_id = v_g and d.semana = v_sem order by d.dano desc limit 8) x;
  v_ja_atual := exists (select 1 from public.chefe_premios where user_id = p_uid and semana = v_sem);
  -- semana passada: derrotado e ainda não resgatado?
  v_hp_ant := v_hp;
  select coalesce(sum(dano), 0) into v_tot_ant from public.chefe_dano where guilda_id = v_g and semana = v_sem - 7;
  select coalesce(max(dano), 0) into v_meu_ant from public.chefe_dano where guilda_id = v_g and semana = v_sem - 7 and user_id = p_uid;
  v_ja_ant := exists (select 1 from public.chefe_premios where user_id = p_uid and semana = v_sem - 7);
  return jsonb_build_object('ok', true,
    'semana', ((v_sem - date '1970-01-01') + 3) / 7,
    'hp', v_hp, 'dano_total', v_total, 'meu_dano', v_meu,
    'golpes_hoje', v_golpes, 'golpes_max', 6,
    'termina_em', extract(epoch from ((v_sem + 7)::timestamp - (now() at time zone 'America/Sao_Paulo')))::int,
    'derrotado', v_total >= v_hp,
    'premio_resgatado', v_ja_atual,
    'premio_anterior', (v_tot_ant >= v_hp_ant and v_meu_ant > 0 and not v_ja_ant),
    'top', v_top);
end $$;

----------------------------------------------------------------------------
-- 5. Funções públicas
----------------------------------------------------------------------------
create function public.jogo_codigo_resgatar(p_codigo text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_cod text := upper(btrim(coalesce(p_codigo, '')));
  v_c public.codigos_promo%rowtype;
  v_n int;
begin
  if not exists (select 1 from public.perfis where id = v_uid) then return jsonb_build_object('ok', false, 'erro', 'sem_perfil'); end if;
  if not priv.limite('codigo', 8) then return jsonb_build_object('ok', false, 'erro', 'limite_hora'); end if;
  select * into v_c from public.codigos_promo where codigo = v_cod;
  if not found or (v_c.valido_ate is not null and v_c.valido_ate < now()) then
    return jsonb_build_object('ok', false, 'erro', 'codigo_invalido');
  end if;
  if exists (select 1 from public.codigos_usados where user_id = v_uid and codigo = v_cod) then
    return jsonb_build_object('ok', false, 'erro', 'codigo_ja_usado');
  end if;
  update public.codigos_promo set usos = usos + 1 where codigo = v_cod and (max_usos is null or usos < max_usos);
  get diagnostics v_n = row_count;
  if v_n = 0 then return jsonb_build_object('ok', false, 'erro', 'codigo_esgotado'); end if;
  insert into public.codigos_usados (user_id, codigo) values (v_uid, v_cod);
  return jsonb_build_object('ok', true, 'gemas', v_c.gemas, 'ingressos', v_c.ingressos);
end $$;

create function public.jogo_chefe_estado() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  return priv.chefe_estado(priv.uid());
end $$;

-- O cliente calcula o dano do golpe; o servidor limita pelo nível e pelo poder do perfil e
-- aceita no máximo 6 golpes por dia.
create function public.jogo_chefe_golpear(p_dano int) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_g uuid := priv.guilda_do(priv.uid());
  v_p public.perfis%rowtype;
  v_cap int; v_dano int; v_qtd int;
begin
  if v_g is null then return jsonb_build_object('ok', false, 'erro', 'sem_guilda'); end if;
  select * into v_p from public.perfis where id = v_uid;
  if v_p.nivel < 5 then return jsonb_build_object('ok', false, 'erro', 'nivel_baixo'); end if;
  if p_dano is null or p_dano < 1 then return jsonb_build_object('ok', false, 'erro', 'valor_invalido'); end if;
  v_cap := 300 + v_p.nivel * 50 + least(v_p.poder * 35 / 100, 30000)::int;
  v_dano := least(p_dano, v_cap);
  insert into public.chefe_golpes as g (user_id, dia, qtd) values (v_uid, priv.hoje(), 1)
    on conflict (user_id, dia) do update set qtd = g.qtd + 1 returning g.qtd into v_qtd;
  if v_qtd > 6 then
    update public.chefe_golpes set qtd = 6 where user_id = v_uid and dia = priv.hoje();
    return jsonb_build_object('ok', false, 'erro', 'limite_diario');
  end if;
  insert into public.chefe_dano as d (guilda_id, semana, user_id, dano) values (v_g, priv.semana(), v_uid, v_dano)
    on conflict (guilda_id, semana, user_id) do update set dano = d.dano + v_dano;
  return priv.chefe_estado(v_uid) || jsonb_build_object('dano_golpe', v_dano);
end $$;

create function public.jogo_chefe_resgatar() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_g uuid := priv.guilda_do(priv.uid());
  v_sem date; v_hp bigint; v_n int;
begin
  if v_g is null then return jsonb_build_object('ok', false, 'erro', 'sem_guilda'); end if;
  v_hp := priv.chefe_hp(v_g);
  foreach v_sem in array array[priv.semana(), priv.semana() - 7] loop
    if (select coalesce(sum(dano), 0) from public.chefe_dano where guilda_id = v_g and semana = v_sem) >= v_hp
       and coalesce((select max(dano) from public.chefe_dano where guilda_id = v_g and semana = v_sem and user_id = v_uid), 0) > 0
       and not exists (select 1 from public.chefe_premios where user_id = v_uid and semana = v_sem) then
      insert into public.chefe_premios (user_id, semana) values (v_uid, v_sem) on conflict do nothing;
      get diagnostics v_n = row_count;
      if v_n = 1 then return jsonb_build_object('ok', true); end if;
    end if;
  end loop;
  return jsonb_build_object('ok', false, 'erro', 'sem_premio');
end $$;

create function public.jogo_corrida_enviar(p_pontos int) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_p int := least(greatest(coalesce(p_pontos, 0), 0), 60);
  v_tot int;
begin
  if not exists (select 1 from public.perfis where id = v_uid) then return jsonb_build_object('ok', false, 'erro', 'sem_perfil'); end if;
  if v_p < 1 then return jsonb_build_object('ok', false, 'erro', 'pontos_invalidos'); end if;
  if not priv.limite('corrida', 150, v_p) then return jsonb_build_object('ok', false, 'erro', 'limite_hora'); end if;
  insert into public.corrida_pontos as c (user_id, janela, pontos) values (v_uid, priv.janela(), v_p)
    on conflict (user_id, janela) do update set pontos = c.pontos + v_p returning c.pontos into v_tot;
  return jsonb_build_object('ok', true, 'pontos', v_tot);
end $$;

create function public.jogo_corrida_ranking(p_limite int default 20) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_j int := priv.janela();
  v_top jsonb; v_meus int; v_pos int; v_pos_ant int; v_pts_ant int; v_ja boolean;
begin
  select coalesce(jsonb_agg(t order by (t->>'pos')::int), '[]'::jsonb) into v_top from (
    select jsonb_build_object('pos', row_number() over (order by c.pontos desc, c.user_id), 'nome', p.nome, 'nivel', p.nivel,
                              'pontos', c.pontos, 'voce', c.user_id = v_uid) as t
      from public.corrida_pontos c join public.perfis p on p.id = c.user_id
     where c.janela = v_j order by c.pontos desc, c.user_id limit least(greatest(coalesce(p_limite, 20), 1), 50)) x;
  select coalesce(pontos, 0) into v_meus from public.corrida_pontos where user_id = v_uid and janela = v_j;
  v_meus := coalesce(v_meus, 0);
  select 1 + count(*) into v_pos from public.corrida_pontos where janela = v_j and (pontos > v_meus);
  -- janela anterior: posição final e prêmio
  select coalesce(max(pontos), 0) into v_pts_ant from public.corrida_pontos where user_id = v_uid and janela = v_j - 1;
  select 1 + count(*) into v_pos_ant from public.corrida_pontos where janela = v_j - 1 and pontos > v_pts_ant;
  v_ja := exists (select 1 from public.corrida_premios where user_id = v_uid and janela = v_j - 1);
  return jsonb_build_object('ok', true, 'top', v_top, 'meus', v_meus, 'pos', case when v_meus > 0 then v_pos else null end,
    'termina_em', priv.janela_resta(),
    'premio', case when v_pts_ant >= 40 and v_pos_ant <= 10 and not v_ja then v_pos_ant else null end);
end $$;

create function public.jogo_corrida_premio() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_j int := priv.janela() - 1;
  v_pts int; v_pos int; v_n int;
begin
  select coalesce(max(pontos), 0) into v_pts from public.corrida_pontos where user_id = v_uid and janela = v_j;
  if v_pts < 40 then return jsonb_build_object('ok', false, 'erro', 'pontos_minimos'); end if;
  select 1 + count(*) into v_pos from public.corrida_pontos where janela = v_j and pontos > v_pts;
  if v_pos > 10 then return jsonb_build_object('ok', false, 'erro', 'sem_premio'); end if;
  insert into public.corrida_premios (user_id, janela, posicao) values (v_uid, v_j, v_pos) on conflict do nothing;
  get diagnostics v_n = row_count;
  if v_n = 0 then return jsonb_build_object('ok', false, 'erro', 'ja_resgatado'); end if;
  return jsonb_build_object('ok', true, 'posicao', v_pos);
end $$;

-- Métricas: acrescenta os nomes novos à lista fixa.
create or replace function public.jogo_evento(p_nome text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
begin
  if p_nome is null or p_nome not in ('sessao','ovo','anuncio','prestigio','convite','tutorial_fim','compra_simulada','pedido','horta','evento_semana',
                                       'oficina','pesquisa','lote','cruzamento','evolucao','chefe','corrida','codigo','conquista') then
    return jsonb_build_object('ok', false, 'erro', 'tipo_invalido');
  end if;
  if not exists (select 1 from public.perfis where id = v_uid) then
    return jsonb_build_object('ok', false, 'erro', 'sem_perfil');
  end if;
  if not priv.limite('evento', 120) then return jsonb_build_object('ok', false, 'erro', 'limite_hora'); end if;
  if p_nome = 'sessao' and exists (select 1 from public.eventos_app where user_id = v_uid and nome = 'sessao' and dia = priv.hoje()) then
    return jsonb_build_object('ok', true);
  end if;
  insert into public.eventos_app (user_id, nome, dia) values (v_uid, p_nome, priv.hoje());
  return jsonb_build_object('ok', true);
end $$;

----------------------------------------------------------------------------
-- 6. Permissões
----------------------------------------------------------------------------
revoke all on function
  public.jogo_codigo_resgatar(text), public.jogo_chefe_estado(), public.jogo_chefe_golpear(int), public.jogo_chefe_resgatar(),
  public.jogo_corrida_enviar(int), public.jogo_corrida_ranking(int), public.jogo_corrida_premio(), public.jogo_evento(text)
from public, anon, authenticated;
revoke all on function priv.janela(), priv.janela_resta(), priv.chefe_hp(uuid), priv.chefe_estado(uuid) from public, anon, authenticated;

grant execute on function
  public.jogo_codigo_resgatar(text), public.jogo_chefe_estado(), public.jogo_chefe_golpear(int), public.jogo_chefe_resgatar(),
  public.jogo_corrida_enviar(int), public.jogo_corrida_ranking(int), public.jogo_corrida_premio(), public.jogo_evento(text)
to authenticated;
