-- Sítio dos Bichos: permissões.
-- Nenhuma tabela é acessível direto pela API. O jogo só chama as funções jogo_*,
-- que rodam com os direitos do dono (security definer) e validam tudo.

alter table public.catalogo_pets  enable row level security;
alter table public.perfis         enable row level security;
alter table public.saves          enable row level security;
alter table public.guildas        enable row level security;
alter table public.membros        enable row level security;
alter table public.pontos_semana  enable row level security;
alter table public.baus           enable row level security;
alter table public.ajudas         enable row level security;
alter table public.mural          enable row level security;
alter table public.parabens       enable row level security;
alter table public.doacoes        enable row level security;
alter table public.limites        enable row level security;

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

-- O schema priv guarda ajudantes internos: ninguém de fora o enxerga.
revoke all on schema priv from public, anon, authenticated;
revoke all on all functions in schema priv from public, anon, authenticated;

-- Usuários anônimos do Supabase usam o papel authenticated.
grant execute on function
  public.jogo_iniciar(text),
  public.jogo_perfil_atualizar(text, int, bigint),
  public.jogo_save_salvar(jsonb, int),
  public.jogo_save_carregar(),
  public.jogo_guildas_listar(),
  public.jogo_guilda_criar(text, text),
  public.jogo_guilda_entrar(uuid),
  public.jogo_guilda_sair(),
  public.jogo_guilda_estado(),
  public.jogo_contribuir(int, text),
  public.jogo_guilda_doar(bigint),
  public.jogo_guilda_ajudar(uuid),
  public.jogo_bau_resgatar(int),
  public.jogo_mural_postar(text, jsonb),
  public.jogo_mural_parabenizar(bigint),
  public.jogo_ranking(int)
to authenticated;
