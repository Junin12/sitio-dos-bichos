-- Sítio dos Bichos: servidores e classificações (poder, fortuna, bichos, fantasias, prestígio).
-- Rode UMA vez no SQL Editor do Supabase, depois da migração 5.

----------------------------------------------------------------------------
-- 1. Perfil: servidor, aparência e números para as classificações
----------------------------------------------------------------------------
alter table public.perfis
  add column servidor     int    not null default 1 check (servidor between 1 and 999),
  add column avatar       jsonb  not null default '{}'::jsonb,
  add column moedas_total bigint not null default 0 check (moedas_total >= 0),
  add column n_bichos     int    not null default 0 check (n_bichos between 0 and 500),
  add column n_roupas     int    not null default 0 check (n_roupas between 0 and 100);
create index perfis_servidor_idx on public.perfis (servidor);

-- Cada servidor comporta 300 jogadores. Quem já existe fica no servidor 1; quem chega vai para o primeiro com vaga.
create function priv.servidor_novo() returns int
language sql stable security definer set search_path = public, pg_temp as $$
  select min(s)
    from generate_series(1, coalesce((select max(servidor) from public.perfis), 0) + 1) s
   where (select count(*) from public.perfis p where p.servidor = s) < 300
$$;
alter table public.perfis alter column servidor set default priv.servidor_novo();

----------------------------------------------------------------------------
-- 2. O cliente informa os números e a aparência; o servidor só aceita valores plausíveis
----------------------------------------------------------------------------
create function public.jogo_perfil_extra(
  p_moedas bigint, p_bichos int, p_roupas int, p_sexo text, p_pele int, p_roupa text, p_bicho text, p_est int
) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_p public.perfis;
  v_moedas bigint;
begin
  select * into v_p from public.perfis where id = v_uid for update;
  if not found then return jsonb_build_object('ok', false, 'erro', 'sem_perfil'); end if;
  if not priv.limite('perfil_extra', 120) then return jsonb_build_object('ok', false, 'erro', 'limite_hora'); end if;
  if p_moedas is null or p_moedas < 0 or p_bichos is null or p_bichos not between 0 and 500
     or p_roupas is null or p_roupas not between 0 and 100 or p_sexo not in ('m', 'f')
     or p_pele is null or p_pele not between 0 and 3 or p_est is null or p_est not between 0 and 3
     or p_roupa is null or p_roupa !~ '^[a-z]{2,12}(:[a-z]{2,12})?$'
     or (p_bicho is not null and p_bicho !~ '^[a-z0-9_]{2,24}$') then
    return jsonb_build_object('ok', false, 'erro', 'valor_invalido');
  end if;
  -- A fortuna só cresce, e cada envio sobe no máximo cerca de uma hora de produção.
  v_moedas := greatest(v_p.moedas_total, least(p_moedas, v_p.moedas_total + v_p.poder * 400 + 5000));
  update public.perfis
     set moedas_total = v_moedas, n_bichos = p_bichos, n_roupas = p_roupas,
         avatar = jsonb_build_object('sexo', p_sexo, 'pele', p_pele, 'roupa', p_roupa, 'bicho', p_bicho, 'est', p_est)
   where id = v_uid;
  return jsonb_build_object('ok', true);
end $$;

----------------------------------------------------------------------------
-- 3. Classificação por categoria e servidor
----------------------------------------------------------------------------
create function priv.classif(p_cat text, p_srv int)
returns table (pos int, id uuid, nome text, nivel int, prestigio int, valor bigint, avatar jsonb)
language sql stable security definer set search_path = public, pg_temp as $$
  select (row_number() over (order by t.valor desc, t.atualizado_em asc, t.id))::int, t.id, t.nome, t.nivel, t.prestigio, t.valor, t.avatar
    from (select p.id, p.nome, p.nivel, p.prestigio, p.avatar, p.atualizado_em,
                 case p_cat when 'poder' then p.poder when 'moedas' then p.moedas_total when 'bichos' then p.n_bichos::bigint
                            when 'fantasias' then p.n_roupas::bigint else p.prestigio::bigint end as valor
            from public.perfis p where p.servidor = p_srv) t
   where t.valor > 0
$$;

create function public.jogo_classificacao(p_cat text default 'poder', p_servidor int default null, p_limite int default 30)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := priv.uid();
  v_meu int;
  v_srv int;
  v_lim int := least(greatest(coalesce(p_limite, 30), 1), 100);
  v_top jsonb;
  v_eu jsonb;
  v_total int;
  v_servs jsonb;
begin
  if p_cat is null or p_cat not in ('poder', 'moedas', 'bichos', 'fantasias', 'prestigio') then
    return jsonb_build_object('ok', false, 'erro', 'categoria_invalida');
  end if;
  select servidor into v_meu from public.perfis where id = v_uid;
  if v_meu is null then return jsonb_build_object('ok', false, 'erro', 'sem_perfil'); end if;
  v_srv := coalesce(p_servidor, v_meu);
  select count(*) into v_total from priv.classif(p_cat, v_srv);
  select coalesce(jsonb_agg(jsonb_build_object('pos', c.pos, 'id', c.id, 'nome', c.nome, 'nivel', c.nivel, 'prestigio', c.prestigio,
                                               'valor', c.valor, 'avatar', c.avatar, 'voce', c.id = v_uid) order by c.pos), '[]'::jsonb)
    into v_top from priv.classif(p_cat, v_srv) c where c.pos <= v_lim;
  select jsonb_build_object('pos', c.pos, 'valor', c.valor) into v_eu from priv.classif(p_cat, v_srv) c where c.id = v_uid;
  select coalesce(jsonb_agg(jsonb_build_object('n', s.servidor, 'total', s.n) order by s.servidor), '[]'::jsonb) into v_servs
    from (select servidor, count(*)::int n from public.perfis group by servidor order by servidor limit 30) s;
  return jsonb_build_object('ok', true, 'categoria', p_cat, 'servidor', v_srv, 'meu_servidor', v_meu, 'total', v_total,
                            'servidores', v_servs, 'top', v_top, 'eu', coalesce(v_eu, jsonb_build_object('pos', null, 'valor', 0)));
end $$;

----------------------------------------------------------------------------
-- 4. Permissões
----------------------------------------------------------------------------
revoke all on function public.jogo_perfil_extra(bigint, int, int, text, int, text, text, int), public.jogo_classificacao(text, int, int)
  from public, anon, authenticated;
revoke all on function priv.servidor_novo(), priv.classif(text, int) from public, anon, authenticated;
grant execute on function public.jogo_perfil_extra(bigint, int, int, text, int, text, text, int), public.jogo_classificacao(text, int, int)
  to authenticated;
