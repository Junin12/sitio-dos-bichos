-- Sítio dos Bichos: regras do servidor.
-- Funções públicas (jogo_*) são chamadas pelo jogo via RPC e retornam jsonb:
--   { "ok": true, ... }  ou  { "ok": false, "erro": "codigo" }
-- Só a falta de login gera exceção (nao_autenticado).
-- Convenções do jogo: moedas, itens e recompensas ficam no cliente. O servidor
-- guarda o que é compartilhado (perfil, guilda, pontos, baús, mural, ranking) e
-- limita o que o cliente consegue declarar.

----------------------------------------------------------------------------
-- Ajudantes internos (schema priv, não expostos pela API)
----------------------------------------------------------------------------
create function priv.uid() returns uuid
language plpgsql stable as $$
declare v uuid := auth.uid();
begin
  if v is null then
    raise exception 'nao_autenticado' using errcode = '28000';
  end if;
  return v;
end $$;

create function priv.semana() returns date
language sql stable as $$
  select date_trunc('week', now() at time zone 'America/Sao_Paulo')::date
$$;

create function priv.hoje() returns date
language sql stable as $$
  select (now() at time zone 'America/Sao_Paulo')::date
$$;

-- Conta uso por hora. Retorna false quando passa do máximo.
create function priv.limite(p_chave text, p_max int, p_inc int default 1) returns boolean
language plpgsql as $$
declare
  v_uid uuid := priv.uid();
  v_qtd int;
begin
  insert into public.limites as l (user_id, chave, janela, qtd)
  values (v_uid, p_chave, date_trunc('hour', now()), p_inc)
  on conflict (user_id, chave, janela) do update set qtd = l.qtd + p_inc
  returning l.qtd into v_qtd;
  if random() < 0.01 then
    delete from public.limites where janela < now() - interval '1 day';
  end if;
  return v_qtd <= p_max;
end $$;

-- Fundo necessário para passar do nível n para n+1 (igual ao jogo).
create function priv.fundo_nivel(n int) returns bigint
language sql immutable as $$
  select round(2500 * power(1.7, n - 1))::bigint
$$;

create function priv.nivel_guilda(f bigint) returns int
language plpgsql immutable as $$
declare n int := 1;
begin
  while n < 20 and f >= priv.fundo_nivel(n) loop
    n := n + 1;
  end loop;
  return n;
end $$;

-- Meta semanal cresce com o número de membros e com o nível da guilda.
create function priv.meta_semana(p_guilda uuid) returns int
language plpgsql stable as $$
declare
  v_membros int;
  v_fundo bigint;
begin
  select count(*) into v_membros from public.membros where guilda_id = p_guilda;
  select fundo into v_fundo from public.guildas where id = p_guilda;
  return round(800 * greatest(5, v_membros) * (1 + 0.1 * (priv.nivel_guilda(coalesce(v_fundo, 0)) - 1)))::int;
end $$;

create function priv.guilda_do(p_user uuid) returns uuid
language sql stable as $$
  select guilda_id from public.membros where user_id = p_user
$$;

create function priv.nome_de(p_user uuid) returns text
language sql stable as $$
  select nome from public.perfis where id = p_user
$$;

create function priv.add_pontos(p_user uuid, p_pontos int) returns int
language plpgsql as $$
declare v int;
begin
  insert into public.pontos_semana as ps (user_id, semana, pontos)
  values (p_user, priv.semana(), p_pontos)
  on conflict (user_id, semana) do update set pontos = ps.pontos + p_pontos
  returning ps.pontos into v;
  return v;
end $$;

create function priv.mural(p_guilda uuid, p_user uuid, p_tipo text, p_texto text) returns void
language sql as $$
  insert into public.mural (guilda_id, user_id, tipo, texto) values (p_guilda, p_user, p_tipo, p_texto)
$$;

create function priv.fmt_num(p bigint) returns text
language sql immutable as $$
  select replace(to_char(p, 'FM999,999,999,999,999'), ',', '.')
$$;

----------------------------------------------------------------------------
-- Perfil e salvamento
----------------------------------------------------------------------------
create function public.jogo_iniciar(p_nome text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_nome text := btrim(coalesce(p_nome, ''));
  v_p public.perfis;
begin
  if char_length(v_nome) not between 2 and 24 or v_nome ~ '[[:cntrl:]]' then
    return jsonb_build_object('ok', false, 'erro', 'nome_invalido');
  end if;
  insert into public.perfis (id, nome) values (v_uid, v_nome) on conflict (id) do nothing;
  select * into v_p from public.perfis where id = v_uid;
  return jsonb_build_object('ok', true, 'perfil',
    jsonb_build_object('id', v_p.id, 'nome', v_p.nome, 'nivel', v_p.nivel, 'poder', v_p.poder));
end $$;

-- O cliente informa nível e poder; o servidor só aceita valores plausíveis.
create function public.jogo_perfil_atualizar(p_nome text, p_nivel int, p_poder bigint) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_p public.perfis;
  v_nome text;
begin
  select * into v_p from public.perfis where id = v_uid for update;
  if not found then
    return jsonb_build_object('ok', false, 'erro', 'sem_perfil');
  end if;
  if not priv.limite('perfil', 240) then
    return jsonb_build_object('ok', false, 'erro', 'limite_hora');
  end if;
  if p_nivel is null or p_nivel not between 1 and 30 then
    return jsonb_build_object('ok', false, 'erro', 'nivel_invalido');
  end if;
  if p_nivel > v_p.nivel + 5 then
    return jsonb_build_object('ok', false, 'erro', 'salto_de_nivel');
  end if;
  if p_poder is null or p_poder < 0 or p_poder > (400 * power(1.5, p_nivel))::bigint then
    return jsonb_build_object('ok', false, 'erro', 'poder_invalido');
  end if;
  v_nome := coalesce(nullif(btrim(coalesce(p_nome, '')), ''), v_p.nome);
  if char_length(v_nome) not between 2 and 24 or v_nome ~ '[[:cntrl:]]' then
    return jsonb_build_object('ok', false, 'erro', 'nome_invalido');
  end if;
  update public.perfis
     set nome = v_nome, nivel = p_nivel, poder = p_poder, atualizado_em = now()
   where id = v_uid;
  return jsonb_build_object('ok', true);
end $$;

create function public.jogo_save_salvar(p_dados jsonb, p_versao int) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_atual public.saves;
begin
  if p_dados is null or jsonb_typeof(p_dados) <> 'object' then
    return jsonb_build_object('ok', false, 'erro', 'dados_invalidos');
  end if;
  if octet_length(p_dados::text) > 200000 then
    return jsonb_build_object('ok', false, 'erro', 'grande_demais');
  end if;
  if not exists (select 1 from public.perfis where id = v_uid) then
    return jsonb_build_object('ok', false, 'erro', 'sem_perfil');
  end if;
  if not priv.limite('save', 240) then
    return jsonb_build_object('ok', false, 'erro', 'limite_hora');
  end if;
  select * into v_atual from public.saves where user_id = v_uid for update;
  if not found then
    if coalesce(p_versao, 0) <> 0 then
      return jsonb_build_object('ok', false, 'erro', 'conflito', 'versao', 0);
    end if;
    insert into public.saves (user_id, dados, versao) values (v_uid, p_dados, 1);
    return jsonb_build_object('ok', true, 'versao', 1);
  end if;
  if coalesce(p_versao, -1) <> v_atual.versao then
    return jsonb_build_object('ok', false, 'erro', 'conflito', 'versao', v_atual.versao);
  end if;
  update public.saves
     set dados = p_dados, versao = v_atual.versao + 1, atualizado_em = now()
   where user_id = v_uid;
  return jsonb_build_object('ok', true, 'versao', v_atual.versao + 1);
end $$;

create function public.jogo_save_carregar() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_s public.saves;
begin
  select * into v_s from public.saves where user_id = v_uid;
  if not found then
    return jsonb_build_object('ok', true, 'existe', false, 'versao', 0);
  end if;
  return jsonb_build_object('ok', true, 'existe', true, 'dados', v_s.dados, 'versao', v_s.versao,
    'segundos_atras', extract(epoch from now() - v_s.atualizado_em)::int);
end $$;

----------------------------------------------------------------------------
-- Guilda
----------------------------------------------------------------------------
create function public.jogo_guildas_listar() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v jsonb;
begin
  perform priv.uid();
  select coalesce(jsonb_agg(t.x order by (t.x ->> 'membros')::int desc, t.x ->> 'nome'), '[]'::jsonb) into v
  from (
    select jsonb_build_object('id', g.id, 'nome', g.nome, 'lema', g.lema,
             'nivel', priv.nivel_guilda(g.fundo), 'membros', count(m.user_id),
             'cheia', count(m.user_id) >= 30) as x
      from public.guildas g
      left join public.membros m on m.guilda_id = g.id
     group by g.id
     order by count(m.user_id) desc, g.nome
     limit 30
  ) t;
  return jsonb_build_object('ok', true, 'guildas', v);
end $$;

create function public.jogo_guilda_criar(p_nome text, p_lema text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_p public.perfis;
  v_nome text := btrim(coalesce(p_nome, ''));
  v_lema text := btrim(coalesce(p_lema, ''));
  v_id uuid;
begin
  select * into v_p from public.perfis where id = v_uid;
  if not found then return jsonb_build_object('ok', false, 'erro', 'sem_perfil'); end if;
  if v_p.nivel < 5 then return jsonb_build_object('ok', false, 'erro', 'nivel_baixo'); end if;
  if priv.guilda_do(v_uid) is not null then return jsonb_build_object('ok', false, 'erro', 'ja_em_guilda'); end if;
  if char_length(v_nome) not between 3 and 24 or v_nome ~ '[[:cntrl:]]' then
    return jsonb_build_object('ok', false, 'erro', 'nome_invalido');
  end if;
  if char_length(v_lema) > 60 or v_lema ~ '[[:cntrl:]]' then
    return jsonb_build_object('ok', false, 'erro', 'lema_invalido');
  end if;
  if not priv.limite('guilda_criar', 3, 1) then
    return jsonb_build_object('ok', false, 'erro', 'limite_hora');
  end if;
  begin
    insert into public.guildas (nome, lema, dono_id) values (v_nome, v_lema, v_uid) returning id into v_id;
  exception when unique_violation then
    return jsonb_build_object('ok', false, 'erro', 'nome_em_uso');
  end;
  insert into public.membros (user_id, guilda_id, papel) values (v_uid, v_id, 'lider');
  perform priv.mural(v_id, v_uid, 'entrada', v_p.nome || ' fundou a guilda.');
  return jsonb_build_object('ok', true, 'guilda_id', v_id);
end $$;

create function public.jogo_guilda_entrar(p_guilda uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_p public.perfis;
  v_g public.guildas;
begin
  select * into v_p from public.perfis where id = v_uid;
  if not found then return jsonb_build_object('ok', false, 'erro', 'sem_perfil'); end if;
  if v_p.nivel < 5 then return jsonb_build_object('ok', false, 'erro', 'nivel_baixo'); end if;
  if priv.guilda_do(v_uid) is not null then return jsonb_build_object('ok', false, 'erro', 'ja_em_guilda'); end if;
  select * into v_g from public.guildas where id = p_guilda for update;
  if not found then return jsonb_build_object('ok', false, 'erro', 'guilda_inexistente'); end if;
  if (select count(*) from public.membros where guilda_id = v_g.id) >= 30 then
    return jsonb_build_object('ok', false, 'erro', 'guilda_cheia');
  end if;
  if not priv.limite('guilda_entrar', 10, 1) then
    return jsonb_build_object('ok', false, 'erro', 'limite_hora');
  end if;
  insert into public.membros (user_id, guilda_id, papel) values (v_uid, v_g.id, 'membro');
  perform priv.mural(v_g.id, v_uid, 'entrada', v_p.nome || ' entrou na guilda.');
  return jsonb_build_object('ok', true, 'guilda_id', v_g.id);
end $$;

create function public.jogo_guilda_sair() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_m public.membros;
  v_resto int;
  v_novo uuid;
begin
  select * into v_m from public.membros where user_id = v_uid for update;
  if not found then return jsonb_build_object('ok', false, 'erro', 'sem_guilda'); end if;
  delete from public.membros where user_id = v_uid;
  -- Pontos da semana ficam com a guilda de origem: quem sai começa do zero.
  delete from public.pontos_semana where user_id = v_uid and semana = priv.semana();
  select count(*) into v_resto from public.membros where guilda_id = v_m.guilda_id;
  if v_resto = 0 then
    delete from public.guildas where id = v_m.guilda_id;
  elsif v_m.papel = 'lider' then
    select user_id into v_novo from public.membros
     where guilda_id = v_m.guilda_id
     order by (papel = 'vice') desc, entrou_em asc
     limit 1;
    update public.membros set papel = 'lider' where user_id = v_novo;
    update public.guildas set dono_id = v_novo where id = v_m.guilda_id;
  end if;
  return jsonb_build_object('ok', true);
end $$;

create function public.jogo_guilda_estado() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_g public.guildas;
  v_sem date := priv.semana();
  v_hoje date := priv.hoje();
  v_nivel int;
  v_meta int;
  v_total bigint;
  v_meus int;
  v_baus jsonb;
  v_membros jsonb;
  v_mural jsonb;
begin
  select g.* into v_g
    from public.guildas g
    join public.membros m on m.guilda_id = g.id
   where m.user_id = v_uid;
  if not found then
    return jsonb_build_object('ok', true, 'guilda', null);
  end if;
  v_nivel := priv.nivel_guilda(v_g.fundo);
  v_meta := priv.meta_semana(v_g.id);

  select coalesce(sum(p.pontos), 0) into v_total
    from public.pontos_semana p
    join public.membros m on m.user_id = p.user_id
   where m.guilda_id = v_g.id and p.semana = v_sem;
  select p.pontos into v_meus from public.pontos_semana p where p.user_id = v_uid and p.semana = v_sem;
  v_meus := coalesce(v_meus, 0);

  select coalesce(jsonb_agg(b.indice order by b.indice), '[]'::jsonb) into v_baus
    from public.baus b where b.user_id = v_uid and b.semana = v_sem;

  select coalesce(jsonb_agg(t.x order by (t.x ->> 'pontos')::int desc, t.x ->> 'nome'), '[]'::jsonb) into v_membros
  from (
    select jsonb_build_object(
             'id', pf.id, 'nome', pf.nome, 'nivel', pf.nivel, 'papel', m.papel,
             'pontos', coalesce(p.pontos, 0), 'voce', pf.id = v_uid,
             'ajudado_hoje', exists (select 1 from public.ajudas a
                                      where a.user_id = v_uid and a.alvo_id = pf.id and a.dia = v_hoje)) as x
      from public.membros m
      join public.perfis pf on pf.id = m.user_id
      left join public.pontos_semana p on p.user_id = m.user_id and p.semana = v_sem
     where m.guilda_id = v_g.id
  ) t;

  select coalesce(jsonb_agg(t.x order by (t.x ->> 'id')::bigint desc), '[]'::jsonb) into v_mural
  from (
    select jsonb_build_object(
             'id', mu.id, 'tipo', mu.tipo, 'texto', mu.texto,
             'segundos', extract(epoch from now() - mu.criado_em)::int,
             'meu', mu.user_id = v_uid,
             'parabenizado', exists (select 1 from public.parabens pb where pb.user_id = v_uid and pb.mural_id = mu.id)) as x
      from public.mural mu
     where mu.guilda_id = v_g.id
     order by mu.id desc
     limit 10
  ) t;

  return jsonb_build_object(
    'ok', true,
    'guilda', jsonb_build_object(
      'id', v_g.id, 'nome', v_g.nome, 'lema', v_g.lema, 'nivel', v_nivel, 'fundo', v_g.fundo,
      'fundo_anterior', case when v_nivel > 1 then priv.fundo_nivel(v_nivel - 1) else 0 end,
      'fundo_proximo', case when v_nivel < 20 then priv.fundo_nivel(v_nivel) else null end,
      'bonus_prod', round(0.04 * (v_nivel - 1), 2)),
    'semana', jsonb_build_object(
      'meta', v_meta, 'total', v_total, 'meus_pontos', v_meus, 'baus', v_baus,
      'termina_em', extract(epoch from (((v_sem + 7)::timestamp at time zone 'America/Sao_Paulo') - now()))::int),
    'membros', v_membros,
    'mural', v_mural);
end $$;

----------------------------------------------------------------------------
-- Grande Colheita, doações, ajuda e baús
----------------------------------------------------------------------------
-- Motivos e teto de pontos por chamada (o cliente deve respeitar o mesmo teto).
create function public.jogo_contribuir(p_pontos int, p_motivo text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_teto int;
  v_total int;
begin
  v_teto := case p_motivo when 'ovo' then 10 when 'coleta' then 60 when 'missao' then 30 when 'safra' then 5 else null end;
  if v_teto is null then return jsonb_build_object('ok', false, 'erro', 'motivo_invalido'); end if;
  if p_pontos is null or p_pontos < 1 or p_pontos > v_teto then
    return jsonb_build_object('ok', false, 'erro', 'pontos_invalidos');
  end if;
  if priv.guilda_do(v_uid) is null then return jsonb_build_object('ok', false, 'erro', 'sem_guilda'); end if;
  if not priv.limite('pontos', 400, p_pontos) then
    return jsonb_build_object('ok', false, 'erro', 'limite_hora');
  end if;
  v_total := priv.add_pontos(v_uid, p_pontos);
  return jsonb_build_object('ok', true, 'pontos_semana', v_total);
end $$;

create function public.jogo_guilda_doar(p_valor bigint) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_g uuid := priv.guilda_do(priv.uid());
  v_fundo bigint;
  v_pontos int;
begin
  if v_g is null then return jsonb_build_object('ok', false, 'erro', 'sem_guilda'); end if;
  if p_valor is null or p_valor < 1 or p_valor > 1000000000000 then
    return jsonb_build_object('ok', false, 'erro', 'valor_invalido');
  end if;
  if not priv.limite('doacao', 30, 1) then
    return jsonb_build_object('ok', false, 'erro', 'limite_hora');
  end if;
  update public.guildas set fundo = fundo + p_valor where id = v_g returning fundo into v_fundo;
  insert into public.doacoes (user_id, guilda_id, valor) values (v_uid, v_g, p_valor);
  v_pontos := least(p_valor / 50, 500)::int;
  if v_pontos > 0 and priv.limite('pontos_doacao', 1000, v_pontos) then
    perform priv.add_pontos(v_uid, v_pontos);
  else
    v_pontos := 0;
  end if;
  if p_valor >= 1000 then
    perform priv.mural(v_g, v_uid, 'doacao',
      priv.nome_de(v_uid) || ' doou ' || priv.fmt_num(p_valor) || ' moedas ao fundo da guilda.');
  end if;
  return jsonb_build_object('ok', true, 'fundo', v_fundo, 'nivel', priv.nivel_guilda(v_fundo), 'pontos', v_pontos);
end $$;

create function public.jogo_guilda_ajudar(p_alvo uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_g uuid := priv.guilda_do(priv.uid());
  v_linhas int;
begin
  if v_g is null then return jsonb_build_object('ok', false, 'erro', 'sem_guilda'); end if;
  if p_alvo is null or p_alvo = v_uid then return jsonb_build_object('ok', false, 'erro', 'alvo_invalido'); end if;
  if priv.guilda_do(p_alvo) is distinct from v_g then
    return jsonb_build_object('ok', false, 'erro', 'alvo_invalido');
  end if;
  insert into public.ajudas (user_id, alvo_id, dia) values (v_uid, p_alvo, priv.hoje()) on conflict do nothing;
  get diagnostics v_linhas = row_count;
  if v_linhas = 0 then return jsonb_build_object('ok', false, 'erro', 'ja_ajudou_hoje'); end if;
  perform priv.add_pontos(v_uid, 15);
  perform priv.mural(v_g, v_uid, 'ajuda', priv.nome_de(v_uid) || ' ajudou ' || priv.nome_de(p_alvo) || ' no sítio.');
  return jsonb_build_object('ok', true, 'pontos', 15);
end $$;

-- Só registra o direito ao baú. O valor da recompensa é calculado pelo jogo.
create function public.jogo_bau_resgatar(p_indice int) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_g uuid := priv.guilda_do(priv.uid());
  v_sem date := priv.semana();
  v_meus int;
  v_total bigint;
  v_meta int;
  v_pct numeric;
begin
  if p_indice is null or p_indice not between 0 and 3 then
    return jsonb_build_object('ok', false, 'erro', 'indice_invalido');
  end if;
  if v_g is null then return jsonb_build_object('ok', false, 'erro', 'sem_guilda'); end if;
  if exists (select 1 from public.baus where user_id = v_uid and semana = v_sem and indice = p_indice) then
    return jsonb_build_object('ok', false, 'erro', 'ja_resgatado');
  end if;
  select pontos into v_meus from public.pontos_semana where user_id = v_uid and semana = v_sem;
  if coalesce(v_meus, 0) < 30 then return jsonb_build_object('ok', false, 'erro', 'pontos_minimos'); end if;
  select coalesce(sum(p.pontos), 0) into v_total
    from public.pontos_semana p join public.membros m on m.user_id = p.user_id
   where m.guilda_id = v_g and p.semana = v_sem;
  v_meta := priv.meta_semana(v_g);
  v_pct := (array[0.25, 0.5, 0.75, 1.0])[p_indice + 1];
  if v_total < v_pct * v_meta then return jsonb_build_object('ok', false, 'erro', 'meta_nao_atingida'); end if;
  insert into public.baus (user_id, semana, indice) values (v_uid, v_sem, p_indice);
  return jsonb_build_object('ok', true, 'indice', p_indice);
end $$;

----------------------------------------------------------------------------
-- Mural
----------------------------------------------------------------------------
-- Eventos de jogador: texto montado no servidor a partir de dados validados.
create function public.jogo_mural_postar(p_tipo text, p_params jsonb) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_g uuid := priv.guilda_do(priv.uid());
  v_p public.perfis;
  v_pet public.catalogo_pets;
  v_n int;
  v_texto text;
begin
  if v_g is null then return jsonb_build_object('ok', false, 'erro', 'sem_guilda'); end if;
  select * into v_p from public.perfis where id = v_uid;
  if p_params is null or jsonb_typeof(p_params) <> 'object' then
    return jsonb_build_object('ok', false, 'erro', 'params_invalidos');
  end if;
  if p_tipo = 'choque' then
    select * into v_pet from public.catalogo_pets where id = p_params ->> 'pet_id' and raridade >= 2;
    if not found then return jsonb_build_object('ok', false, 'erro', 'params_invalidos'); end if;
    v_texto := v_p.nome || ' chocou ' || v_pet.emoji || ' ' || v_pet.nome || ' ('
            || (array['Comum', 'Incomum', 'Raro', 'Épico', 'Lendário'])[v_pet.raridade + 1] || ')!';
  elsif p_tipo = 'nivel' then
    v_n := (p_params ->> 'nivel')::int;
    if v_n is null or v_n < 2 or v_n > v_p.nivel then
      return jsonb_build_object('ok', false, 'erro', 'params_invalidos');
    end if;
    v_texto := v_p.nome || ' subiu para o nível ' || v_n || '.';
  elsif p_tipo = 'safra' then
    v_n := (p_params ->> 'n')::int;
    if v_n is null or v_n < 10 or v_n > 1000 or v_n % 10 <> 0 then
      return jsonb_build_object('ok', false, 'erro', 'params_invalidos');
    end if;
    v_texto := v_p.nome || ' completou a safra ' || v_n || '.';
  else
    return jsonb_build_object('ok', false, 'erro', 'tipo_invalido');
  end if;
  if not priv.limite('mural', 20, 1) then
    return jsonb_build_object('ok', false, 'erro', 'limite_hora');
  end if;
  if exists (select 1 from public.mural where user_id = v_uid and texto = v_texto and criado_em > now() - interval '1 day') then
    return jsonb_build_object('ok', false, 'erro', 'repetido');
  end if;
  perform priv.mural(v_g, v_uid, p_tipo, v_texto);
  return jsonb_build_object('ok', true);
exception when invalid_text_representation or numeric_value_out_of_range then
  return jsonb_build_object('ok', false, 'erro', 'params_invalidos');
end $$;

create function public.jogo_mural_parabenizar(p_mural bigint) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_g uuid := priv.guilda_do(priv.uid());
  v_autor uuid;
  v_linhas int;
begin
  if v_g is null then return jsonb_build_object('ok', false, 'erro', 'sem_guilda'); end if;
  select user_id into v_autor from public.mural where id = p_mural and guilda_id = v_g;
  if not found then return jsonb_build_object('ok', false, 'erro', 'mural_inexistente'); end if;
  if v_autor is not distinct from v_uid then return jsonb_build_object('ok', false, 'erro', 'proprio_evento'); end if;
  if (select count(*) from public.parabens where user_id = v_uid and dia = priv.hoje()) >= 10 then
    return jsonb_build_object('ok', false, 'erro', 'limite_diario');
  end if;
  insert into public.parabens (user_id, mural_id, dia) values (v_uid, p_mural, priv.hoje()) on conflict do nothing;
  get diagnostics v_linhas = row_count;
  if v_linhas = 0 then return jsonb_build_object('ok', false, 'erro', 'ja_parabenizou'); end if;
  return jsonb_build_object('ok', true);
end $$;

----------------------------------------------------------------------------
-- Ranking
----------------------------------------------------------------------------
create function public.jogo_ranking(p_limite int default 50) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_lim int := least(greatest(coalesce(p_limite, 50), 1), 100);
  v_total int;
  v_top jsonb;
  v_eu jsonb;
begin
  select count(*) into v_total from public.perfis where poder > 0;
  select coalesce(jsonb_agg(jsonb_build_object('pos', r.pos, 'nome', r.nome, 'nivel', r.nivel, 'poder', r.poder,
                                               'voce', r.id = v_uid) order by r.pos), '[]'::jsonb) into v_top
    from (select id, nome, nivel, poder,
                 row_number() over (order by poder desc, atualizado_em asc, id) as pos
            from public.perfis where poder > 0) r
   where r.pos <= v_lim;
  select jsonb_build_object('pos', r.pos, 'poder', r.poder) into v_eu
    from (select id, poder, row_number() over (order by poder desc, atualizado_em asc, id) as pos
            from public.perfis where poder > 0) r
   where r.id = v_uid;
  return jsonb_build_object('ok', true, 'total', v_total, 'top', v_top,
                            'eu', coalesce(v_eu, jsonb_build_object('pos', null, 'poder', 0)));
end $$;
