-- Sítio dos Bichos: novidades (prestígio, convites, visitas, reações, guilda x guilda, métricas).
-- Pode ser aplicada por cima das migrações 1 a 3 já rodadas. Idempotente nos pontos que importam.

----------------------------------------------------------------------------
-- 1. Catálogo: só animais reais
----------------------------------------------------------------------------
delete from public.catalogo_pets where id in ('unicornio', 'dragao');
insert into public.catalogo_pets (id, nome, emoji, raridade) values
  ('pintinho','Pintinho','🐥',0), ('coelho','Coelho','🐰',0), ('leitao','Leitão','🐷',0), ('patinho','Patinho','🦆',0),
  ('gato','Gato','🐱',0), ('cachorro','Cachorro','🐶',0), ('peru','Peru','🦃',0), ('sapo','Sapo','🐸',0),
  ('ovelha','Ovelha','🐑',1), ('bezerra','Bezerra','🐮',1), ('cabrito','Cabrito','🐐',1), ('galinha','Galinha Caipira','🐔',1),
  ('hamster','Hamster','🐹',1), ('tartaruga','Tartaruga','🐢',1), ('abelha','Abelha','🐝',1), ('ourico','Ouriço','🦔',1),
  ('raposa','Raposa','🦊',2), ('potro','Potro','🐴',2), ('lhama','Lhama','🦙',2), ('lontra','Lontra','🦦',2),
  ('esquilo','Esquilo','🐿️',2), ('gamba','Gambá','🦨',2), ('texugo','Texugo','🦡',2),
  ('cisne','Cisne','🦢',3), ('pavao','Pavão','🦚',3), ('coruja','Coruja','🦉',3), ('cervo','Cervo','🦌',3),
  ('macaco','Macaco-prego','🐒',3), ('trex','Tiranossauro','🦖',3), ('preguica','Preguiça','🦥',3), ('flamingo','Flamingo','🦩',3), ('canguru','Canguru','🦘',3),
  ('arara','Arara-azul','🦜',4), ('elefante','Elefante','🐘',4), ('onca','Onça-pintada','🐆',4),
  ('panda','Panda','🐼',4), ('leao','Leão','🦁',4), ('zebra','Zebra','🦓',4),
  ('mamute','Mamute-lanoso','🦣',4), ('dino','Braquiossauro','🦕',4),
  ('pinguim','Pinguim','🐧',3), ('girafa','Girafa','🦒',3), ('koala','Coala','🐨',3), ('golfinho','Golfinho','🐬',3),
  ('camelo','Camelo','🐪',3), ('lobo','Lobo-guará','🐺',3), ('urso','Urso-pardo','🐻',3), ('tigre','Tigre','🐅',3)
on conflict (id) do update set nome = excluded.nome, emoji = excluded.emoji, raridade = excluded.raridade;

----------------------------------------------------------------------------
-- 2. Perfil: prestígio, código de convite, curtidas
----------------------------------------------------------------------------
create function priv.novo_codigo() returns text
language sql volatile as $$
  select upper(substr(md5(random()::text || clock_timestamp()::text), 1, 7))
$$;

alter table public.perfis
  add column prestigio     smallint not null default 0 check (prestigio between 0 and 50),
  add column codigo        text not null default priv.novo_codigo(),
  add column curtidas      int not null default 0,
  add column convidado_por uuid references public.perfis (id) on delete set null,
  add column convites_pagos int not null default 0;
create unique index perfis_codigo_idx on public.perfis (codigo);
create index perfis_convidado_idx on public.perfis (convidado_por) where convidado_por is not null;

create table public.curtidas (
  user_id  uuid not null references public.perfis (id) on delete cascade,
  alvo_id  uuid not null references public.perfis (id) on delete cascade,
  dia      date not null,
  primary key (user_id, alvo_id, dia)
);

create table public.premios_guilda (
  user_id  uuid not null references public.perfis (id) on delete cascade,
  semana   date not null,
  posicao  smallint not null,
  primary key (user_id, semana)
);

create table public.eventos_app (
  id         bigint generated always as identity primary key,
  user_id    uuid references public.perfis (id) on delete cascade,
  nome       text not null,
  dia        date not null,
  criado_em  timestamptz not null default now()
);
create index eventos_app_idx on public.eventos_app (nome, dia);

alter table public.mural drop constraint mural_tipo_check;
alter table public.mural add constraint mural_tipo_check
  check (tipo in ('entrada', 'doacao', 'ajuda', 'choque', 'nivel', 'safra', 'reacao'));

alter table public.curtidas       enable row level security;
alter table public.premios_guilda enable row level security;
alter table public.eventos_app    enable row level security;
revoke all on public.curtidas, public.premios_guilda, public.eventos_app from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

----------------------------------------------------------------------------
-- 3. Perfil: início e atualização (agora com prestígio)
----------------------------------------------------------------------------
create or replace function public.jogo_iniciar(p_nome text) returns jsonb
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
    jsonb_build_object('id', v_p.id, 'nome', v_p.nome, 'nivel', v_p.nivel, 'poder', v_p.poder,
                       'prestigio', v_p.prestigio, 'codigo', v_p.codigo, 'curtidas', v_p.curtidas));
end $$;

drop function public.jogo_perfil_atualizar(text, int, bigint);
create function public.jogo_perfil_atualizar(p_nome text, p_nivel int, p_poder bigint, p_prestigio int default 0) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_p public.perfis;
  v_nome text;
  v_prest int := coalesce(p_prestigio, 0);
begin
  select * into v_p from public.perfis where id = v_uid for update;
  if not found then return jsonb_build_object('ok', false, 'erro', 'sem_perfil'); end if;
  if not priv.limite('perfil', 240) then return jsonb_build_object('ok', false, 'erro', 'limite_hora'); end if;
  if p_nivel is null or p_nivel not between 1 and 30 then
    return jsonb_build_object('ok', false, 'erro', 'nivel_invalido');
  end if;
  if p_nivel > v_p.nivel + 5 then return jsonb_build_object('ok', false, 'erro', 'salto_de_nivel'); end if;
  -- Prestígio só sobe de 1 em 1 e só para quem já tinha chegado ao nível 25.
  if v_prest < v_p.prestigio or v_prest > v_p.prestigio + 1 or v_prest > 50
     or (v_prest > v_p.prestigio and v_p.nivel < 25) then
    return jsonb_build_object('ok', false, 'erro', 'prestigio_invalido');
  end if;
  -- Quem prestigia mantém os bichos, então o poder esperado é maior que o do nível puro.
  if p_poder is null or p_poder < 0
     or p_poder > (400 * power(1.5, p_nivel) * (1 + v_prest) + 4000 * v_prest)::bigint then
    return jsonb_build_object('ok', false, 'erro', 'poder_invalido');
  end if;
  v_nome := coalesce(nullif(btrim(coalesce(p_nome, '')), ''), v_p.nome);
  if char_length(v_nome) not between 2 and 24 or v_nome ~ '[[:cntrl:]]' then
    return jsonb_build_object('ok', false, 'erro', 'nome_invalido');
  end if;
  update public.perfis
     set nome = v_nome, nivel = p_nivel, poder = p_poder, prestigio = v_prest, atualizado_em = now()
   where id = v_uid;
  return jsonb_build_object('ok', true);
end $$;

----------------------------------------------------------------------------
-- 4. Convites por link
----------------------------------------------------------------------------
create function public.jogo_convite_codigo() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_p public.perfis;
begin
  select * into v_p from public.perfis where id = v_uid;
  if not found then return jsonb_build_object('ok', false, 'erro', 'sem_perfil'); end if;
  return jsonb_build_object('ok', true, 'codigo', v_p.codigo,
    'convidados', (select count(*) from public.perfis where convidado_por = v_uid),
    'ativos', (select count(*) from public.perfis where convidado_por = v_uid and nivel >= 3));
end $$;

-- Quem chega pelo link informa o código uma única vez (e só nos primeiros níveis).
create function public.jogo_convite_usar(p_codigo text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_p public.perfis;
  v_dono public.perfis;
begin
  select * into v_p from public.perfis where id = v_uid for update;
  if not found then return jsonb_build_object('ok', false, 'erro', 'sem_perfil'); end if;
  if v_p.convidado_por is not null then return jsonb_build_object('ok', false, 'erro', 'convite_ja_usado'); end if;
  if v_p.nivel > 10 or v_p.criado_em < now() - interval '3 days' then
    return jsonb_build_object('ok', false, 'erro', 'convite_tarde');
  end if;
  if not priv.limite('convite_usar', 5) then return jsonb_build_object('ok', false, 'erro', 'limite_hora'); end if;
  select * into v_dono from public.perfis where codigo = upper(btrim(coalesce(p_codigo, '')));
  if not found then return jsonb_build_object('ok', false, 'erro', 'convite_invalido'); end if;
  if v_dono.id = v_uid then return jsonb_build_object('ok', false, 'erro', 'convite_proprio'); end if;
  update public.perfis set convidado_por = v_dono.id where id = v_uid;
  return jsonb_build_object('ok', true, 'convidante', v_dono.nome);
end $$;

-- O convidante recebe por convidado que chegou ao nível 3 (máximo de 20 convites premiados).
create function public.jogo_convites_resgatar() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_p public.perfis;
  v_ativos int;
  v_novos int;
begin
  select * into v_p from public.perfis where id = v_uid for update;
  if not found then return jsonb_build_object('ok', false, 'erro', 'sem_perfil'); end if;
  select count(*) into v_ativos from public.perfis where convidado_por = v_uid and nivel >= 3;
  v_ativos := least(v_ativos, 20);
  v_novos := greatest(0, v_ativos - v_p.convites_pagos);
  if v_novos = 0 then return jsonb_build_object('ok', false, 'erro', 'nada_a_resgatar'); end if;
  update public.perfis set convites_pagos = v_ativos where id = v_uid;
  return jsonb_build_object('ok', true, 'novos', v_novos);
end $$;

----------------------------------------------------------------------------
-- 5. Visitas e curtidas
----------------------------------------------------------------------------
-- Devolve só o que serve para desenhar o sítio de outro jogador.
create function public.jogo_visitar(p_alvo uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_p public.perfis;
  v_s public.saves;
  v_pets jsonb;
  v_decor jsonb;
  v_obras jsonb;
begin
  if p_alvo is null then return jsonb_build_object('ok', false, 'erro', 'alvo_invalido'); end if;
  select * into v_p from public.perfis where id = p_alvo;
  if not found then return jsonb_build_object('ok', false, 'erro', 'alvo_invalido'); end if;
  if not priv.limite('visita', 60) then return jsonb_build_object('ok', false, 'erro', 'limite_hora'); end if;
  select * into v_s from public.saves where user_id = p_alvo;
  if found then
    begin
      select coalesce(jsonb_object_agg(k, jsonb_build_object('lvl', least(greatest((v ->> 'lvl')::int, 1), 10),
                                                              'nome', left(coalesce(v ->> 'nome', ''), 14))), '{}'::jsonb)
        into v_pets
        from (select e.key as k, e.value as v from jsonb_each(coalesce(v_s.dados -> 'pets', '{}'::jsonb)) e
               where exists (select 1 from public.catalogo_pets c where c.id = e.key) limit 60) x;
      select coalesce(jsonb_object_agg(e.key, 1), '{}'::jsonb) into v_decor
        from jsonb_each(coalesce(v_s.dados -> 'decor', '{}'::jsonb)) e
       where e.key in ('girassol','banco','espantalho','colmeia','lago','balanco','fogueira','estandarte');
      select jsonb_build_object('celeiro', least(greatest(coalesce((v_s.dados -> 'obras' ->> 'celeiro')::int, 0), 0), 10),
                                'chocadeira', least(greatest(coalesce((v_s.dados -> 'obras' ->> 'chocadeira')::int, 0), 0), 8),
                                'moinho', least(greatest(coalesce((v_s.dados -> 'obras' ->> 'moinho')::int, 0), 0), 10),
                                'estufa', least(greatest(coalesce((v_s.dados -> 'obras' ->> 'estufa')::int, 0), 0), 10)) into v_obras;
    exception when others then
      v_pets := '{}'::jsonb; v_decor := '{}'::jsonb; v_obras := '{}'::jsonb;
    end;
  else
    v_pets := '{}'::jsonb; v_decor := '{}'::jsonb; v_obras := '{}'::jsonb;
  end if;
  return jsonb_build_object('ok', true, 'sitio', jsonb_build_object(
    'id', v_p.id, 'nome', v_p.nome, 'nivel', v_p.nivel, 'poder', v_p.poder, 'prestigio', v_p.prestigio,
    'curtidas', v_p.curtidas, 'pets', v_pets, 'decor', v_decor, 'obras', v_obras,
    'tema', case when v_s.dados ->> 'tema' in ('auto','primavera','verao','outono','inverno') then v_s.dados ->> 'tema' else 'auto' end,
    'curtiu_hoje', exists (select 1 from public.curtidas c where c.user_id = v_uid and c.alvo_id = p_alvo and c.dia = priv.hoje())));
end $$;

create function public.jogo_curtir(p_alvo uuid) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_linhas int;
begin
  if p_alvo is null or p_alvo = v_uid or not exists (select 1 from public.perfis where id = p_alvo) then
    return jsonb_build_object('ok', false, 'erro', 'alvo_invalido');
  end if;
  if not exists (select 1 from public.perfis where id = v_uid) then
    return jsonb_build_object('ok', false, 'erro', 'sem_perfil');
  end if;
  if (select count(*) from public.curtidas where user_id = v_uid and dia = priv.hoje()) >= 20 then
    return jsonb_build_object('ok', false, 'erro', 'limite_diario');
  end if;
  insert into public.curtidas (user_id, alvo_id, dia) values (v_uid, p_alvo, priv.hoje()) on conflict do nothing;
  get diagnostics v_linhas = row_count;
  if v_linhas = 0 then return jsonb_build_object('ok', false, 'erro', 'ja_curtiu'); end if;
  update public.perfis set curtidas = curtidas + 1 where id = p_alvo;
  return jsonb_build_object('ok', true);
end $$;

-- O ranking passa a informar o id, para o jogador poder visitar o sítio.
create or replace function public.jogo_ranking(p_limite int default 50) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_lim int := least(greatest(coalesce(p_limite, 50), 1), 100);
  v_total int;
  v_top jsonb;
  v_eu jsonb;
begin
  select count(*) into v_total from public.perfis where poder > 0;
  select coalesce(jsonb_agg(jsonb_build_object('pos', r.pos, 'id', r.id, 'nome', r.nome, 'nivel', r.nivel, 'poder', r.poder,
                                               'prestigio', r.prestigio, 'voce', r.id = v_uid) order by r.pos), '[]'::jsonb) into v_top
    from (select id, nome, nivel, poder, prestigio,
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

----------------------------------------------------------------------------
-- 6. Reações rápidas no mural (frases prontas, sem texto livre)
----------------------------------------------------------------------------
create function public.jogo_mural_reagir(p_reacao text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_g uuid := priv.guilda_do(priv.uid());
  v_frase text;
begin
  if v_g is null then return jsonb_build_object('ok', false, 'erro', 'sem_guilda'); end if;
  v_frase := case p_reacao
    when 'oi'       then '👋 Oi, pessoal!'
    when 'parabens' then '👏 Parabéns, pessoal!'
    when 'bora'     then '💪 Bora bater a meta!'
    when 'valeu'    then '🙏 Valeu pela ajuda!'
    when 'uau'      then '😮 Que sítio bonito!'
    else null end;
  if v_frase is null then return jsonb_build_object('ok', false, 'erro', 'tipo_invalido'); end if;
  if not priv.limite('reacao', 12) then return jsonb_build_object('ok', false, 'erro', 'limite_hora'); end if;
  perform priv.mural(v_g, v_uid, 'reacao', priv.nome_de(v_uid) || ': ' || v_frase);
  return jsonb_build_object('ok', true);
end $$;

----------------------------------------------------------------------------
-- 7. Guilda contra guilda (ranking semanal e prêmio)
----------------------------------------------------------------------------
-- Uma guilda só entra na disputa com 3 ou mais membros pontuando na semana.
create function priv.placar_guildas(p_semana date) returns table (guilda_id uuid, nome text, nivel int, pontos bigint, ativos int, pos int)
language sql stable as $$
  select t.*, row_number() over (order by t.pontos desc, t.nome)::int as pos
    from (
      select g.id as guilda_id, g.nome, priv.nivel_guilda(g.fundo) as nivel,
             sum(p.pontos)::bigint as pontos, count(*)::int as ativos
        from public.guildas g
        join public.membros m on m.guilda_id = g.id
        join public.pontos_semana p on p.user_id = m.user_id and p.semana = p_semana and p.pontos > 0
       group by g.id
      having count(*) >= 3
    ) t
$$;

create function public.jogo_ranking_guildas(p_limite int default 20) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_g uuid := priv.guilda_do(priv.uid());
  v_lim int := least(greatest(coalesce(p_limite, 20), 1), 50);
  v_top jsonb;
  v_minha jsonb;
  v_anterior date := priv.semana() - 7;
  v_premio jsonb := null;
  v_pos int;
begin
  select coalesce(jsonb_agg(jsonb_build_object('pos', r.pos, 'nome', r.nome, 'nivel', r.nivel, 'pontos', r.pontos,
                                               'ativos', r.ativos, 'minha', r.guilda_id = v_g) order by r.pos), '[]'::jsonb) into v_top
    from priv.placar_guildas(priv.semana()) r where r.pos <= v_lim;
  select jsonb_build_object('pos', r.pos, 'pontos', r.pontos) into v_minha
    from priv.placar_guildas(priv.semana()) r where r.guilda_id = v_g;
  -- Prêmio da semana passada: top 3, para quem fez 30 pontos ou mais e ainda não pegou.
  if v_g is not null
     and not exists (select 1 from public.premios_guilda where user_id = v_uid and semana = v_anterior)
     and coalesce((select pontos from public.pontos_semana where user_id = v_uid and semana = v_anterior), 0) >= 30 then
    select r.pos into v_pos from priv.placar_guildas(v_anterior) r where r.guilda_id = v_g;
    if v_pos is not null and v_pos <= 3 then
      v_premio := jsonb_build_object('posicao', v_pos, 'semana', v_anterior);
    end if;
  end if;
  return jsonb_build_object('ok', true, 'top', v_top, 'minha', v_minha, 'premio', v_premio,
    'termina_em', extract(epoch from (((priv.semana() + 7)::timestamp at time zone 'America/Sao_Paulo') - now()))::int);
end $$;

create function public.jogo_premio_guilda_resgatar() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_g uuid := priv.guilda_do(priv.uid());
  v_anterior date := priv.semana() - 7;
  v_pos int;
  v_linhas int;
begin
  if v_g is null then return jsonb_build_object('ok', false, 'erro', 'sem_guilda'); end if;
  if coalesce((select pontos from public.pontos_semana where user_id = v_uid and semana = v_anterior), 0) < 30 then
    return jsonb_build_object('ok', false, 'erro', 'pontos_minimos');
  end if;
  select r.pos into v_pos from priv.placar_guildas(v_anterior) r where r.guilda_id = v_g;
  if v_pos is null or v_pos > 3 then return jsonb_build_object('ok', false, 'erro', 'sem_premio'); end if;
  insert into public.premios_guilda (user_id, semana, posicao) values (v_uid, v_anterior, v_pos) on conflict do nothing;
  get diagnostics v_linhas = row_count;
  if v_linhas = 0 then return jsonb_build_object('ok', false, 'erro', 'ja_resgatado'); end if;
  return jsonb_build_object('ok', true, 'posicao', v_pos);
end $$;

----------------------------------------------------------------------------
-- 8. Métricas do app (só nomes de uma lista fixa; nada de dados pessoais)
----------------------------------------------------------------------------
create function public.jogo_evento(p_nome text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
begin
  if p_nome is null or p_nome not in ('sessao','ovo','anuncio','prestigio','convite','tutorial_fim','compra_simulada','pedido','horta','evento_semana') then
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
-- 8b. Apagar a conta (exigência das lojas de apps: o jogador pode pedir a exclusão dos dados)
----------------------------------------------------------------------------
create function public.jogo_conta_apagar() returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
begin
  perform public.jogo_guilda_sair();               -- passa a liderança adiante ou fecha a guilda vazia
  delete from auth.users where id = v_uid;         -- apaga em cascata perfil, save, pontos, baús, curtidas, métricas
  return jsonb_build_object('ok', true);
end $$;

----------------------------------------------------------------------------
-- 9. Permissões das peças novas
----------------------------------------------------------------------------
revoke all on function
  public.jogo_perfil_atualizar(text, int, bigint, int),
  public.jogo_convite_codigo(), public.jogo_convite_usar(text), public.jogo_convites_resgatar(),
  public.jogo_visitar(uuid), public.jogo_curtir(uuid), public.jogo_mural_reagir(text),
  public.jogo_ranking_guildas(int), public.jogo_premio_guilda_resgatar(), public.jogo_evento(text), public.jogo_conta_apagar()
from public, anon, authenticated;
revoke all on function priv.novo_codigo(), priv.placar_guildas(date) from public, anon, authenticated;

grant execute on function
  public.jogo_perfil_atualizar(text, int, bigint, int),
  public.jogo_convite_codigo(), public.jogo_convite_usar(text), public.jogo_convites_resgatar(),
  public.jogo_visitar(uuid), public.jogo_curtir(uuid), public.jogo_mural_reagir(text),
  public.jogo_ranking_guildas(int), public.jogo_premio_guilda_resgatar(), public.jogo_evento(text), public.jogo_conta_apagar()
to authenticated;
