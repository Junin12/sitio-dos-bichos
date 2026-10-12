-- Sítio dos Bichos: presentes entre vizinhos (correio) e novas métricas.
-- Rode UMA vez no SQL Editor do Supabase, depois da migração 6.

create table public.presentes (
  id       bigint generated always as identity primary key,
  de       uuid not null references public.perfis (id) on delete cascade,
  para     uuid not null references public.perfis (id) on delete cascade,
  dia      date not null default priv.hoje(),
  pego_dia date,
  check (de <> para),
  unique (de, para, dia)
);
create index presentes_para_idx on public.presentes (para, pego_dia, dia);
alter table public.presentes enable row level security;

-- Enviar: no máximo 5 por dia, um por vizinho por dia.
create function public.jogo_presente_enviar(p_para uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
begin
  if p_para is null or p_para = v_uid then return jsonb_build_object('ok', false, 'erro', 'valor_invalido'); end if;
  if not exists (select 1 from public.perfis where id = v_uid) then return jsonb_build_object('ok', false, 'erro', 'sem_perfil'); end if;
  if not exists (select 1 from public.perfis where id = p_para) then return jsonb_build_object('ok', false, 'erro', 'alvo_invalido'); end if;
  if not priv.limite('presente_env', 60) then return jsonb_build_object('ok', false, 'erro', 'limite_hora'); end if;
  if (select count(*) from public.presentes where de = v_uid and dia = priv.hoje()) >= 5 then
    return jsonb_build_object('ok', false, 'erro', 'limite_dia');
  end if;
  insert into public.presentes (de, para) values (v_uid, p_para) on conflict (de, para, dia) do nothing;
  if not found then return jsonb_build_object('ok', false, 'erro', 'ja_enviou'); end if;
  return jsonb_build_object('ok', true);
end $$;

-- Caixa: presentes dos últimos 3 dias ainda fechados, respeitando o teto de 5 por dia.
create function public.jogo_presente_caixa() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_n int; v_pegos int;
begin
  if not exists (select 1 from public.perfis where id = v_uid) then return jsonb_build_object('ok', false, 'erro', 'sem_perfil'); end if;
  select count(*) into v_n from public.presentes where para = v_uid and pego_dia is null and dia >= priv.hoje() - 2;
  select count(*) into v_pegos from public.presentes where para = v_uid and pego_dia = priv.hoje();
  return jsonb_build_object('ok', true, 'n', least(v_n, greatest(0, 5 - v_pegos)));
end $$;

create function public.jogo_presente_pegar() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_pegos int; v_k int;
begin
  if not exists (select 1 from public.perfis where id = v_uid) then return jsonb_build_object('ok', false, 'erro', 'sem_perfil'); end if;
  if not priv.limite('presente_pegar', 60) then return jsonb_build_object('ok', false, 'erro', 'limite_hora'); end if;
  select count(*) into v_pegos from public.presentes where para = v_uid and pego_dia = priv.hoje();
  v_k := greatest(0, 5 - v_pegos);
  if v_k = 0 then return jsonb_build_object('ok', false, 'erro', 'limite_dia'); end if;
  with alvo as (
    select id from public.presentes where para = v_uid and pego_dia is null and dia >= priv.hoje() - 2
     order by dia, id limit v_k for update skip locked
  ), up as (
    update public.presentes p set pego_dia = priv.hoje() from alvo where p.id = alvo.id returning 1
  ) select count(*) into v_k from up;
  if v_k = 0 then return jsonb_build_object('ok', false, 'erro', 'nada'); end if;
  return jsonb_build_object('ok', true, 'n', v_k);
end $$;

-- Métricas: acrescenta os nomes novos à lista fixa.
create or replace function public.jogo_evento(p_nome text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
begin
  if p_nome is null or p_nome not in ('sessao','ovo','anuncio','prestigio','convite','tutorial_fim','compra_simulada','pedido','horta','evento_semana',
                                       'oficina','pesquisa','lote','cruzamento','evolucao','chefe','corrida','codigo','conquista',
                                       'passe','expedicao','torre','mapa','calendario','cartao','presente') then
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

revoke all on table public.presentes from public, anon, authenticated;
revoke all on function public.jogo_presente_enviar(uuid), public.jogo_presente_caixa(), public.jogo_presente_pegar(), public.jogo_evento(text)
  from public, anon, authenticated;
grant execute on function public.jogo_presente_enviar(uuid), public.jogo_presente_caixa(), public.jogo_presente_pegar(), public.jogo_evento(text)
  to authenticated;
