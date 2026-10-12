-- Sítio dos Bichos: tabelas.
-- Todo acesso do jogo passa pelas funções jogo_* (migração 2). As tabelas ficam
-- fechadas para leitura e escrita direta (migração 3).

create schema if not exists priv;

-- Catálogo dos bichos, usado para validar eventos do mural.
create table public.catalogo_pets (
  id        text primary key,
  nome      text not null,
  emoji     text not null,
  raridade  smallint not null check (raridade between 0 and 4)
);
insert into public.catalogo_pets (id, nome, emoji, raridade) values
  ('pintinho',  'Pintinho',           '🐥', 0), ('coelho',  'Coelho',   '🐰', 0),
  ('leitao',    'Leitão',             '🐷', 0), ('patinho', 'Patinho',  '🦆', 0),
  ('ovelha',    'Ovelha',             '🐑', 1), ('bezerra', 'Bezerra',  '🐮', 1),
  ('cabrito',   'Cabrito',            '🐐', 1), ('galinha', 'Galinha Caipira', '🐔', 1),
  ('raposa',    'Raposa',             '🦊', 2), ('potro',   'Potro',    '🐴', 2),
  ('lhama',     'Lhama',              '🦙', 2), ('lontra',  'Lontra',   '🦦', 2),
  ('unicornio', 'Unicórnio',          '🦄', 3), ('pavao',   'Pavão',    '🦚', 3),
  ('coruja',    'Coruja',             '🦉', 3), ('cervo',   'Cervo',    '🦌', 3),
  ('dragao',    'Dragão do Milharal', '🐲', 4), ('mamute',  'Mamute Lanoso', '🦣', 4),
  ('dino',      'Dino de Palha',      '🦕', 4);

create table public.perfis (
  id             uuid primary key references auth.users (id) on delete cascade,
  nome           text not null check (char_length(nome) between 2 and 24),
  nivel          int  not null default 1 check (nivel between 1 and 30),
  poder          bigint not null default 0 check (poder >= 0),
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now()
);
create index perfis_poder_idx on public.perfis (poder desc, atualizado_em);

-- Salvamento na nuvem: um documento por jogador, com versão para evitar sobrescrita.
create table public.saves (
  user_id        uuid primary key references public.perfis (id) on delete cascade,
  dados          jsonb not null,
  versao         int not null default 1,
  atualizado_em  timestamptz not null default now()
);

create table public.guildas (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null check (char_length(nome) between 3 and 24),
  lema       text not null default '' check (char_length(lema) <= 60),
  dono_id    uuid references public.perfis (id) on delete set null,
  fundo      bigint not null default 0 check (fundo >= 0),
  criada_em  timestamptz not null default now()
);
create unique index guildas_nome_idx on public.guildas (lower(nome));

-- Um jogador pertence a no máximo uma guilda.
create table public.membros (
  user_id    uuid primary key references public.perfis (id) on delete cascade,
  guilda_id  uuid not null references public.guildas (id) on delete cascade,
  papel      text not null default 'membro' check (papel in ('lider', 'vice', 'membro')),
  entrou_em  timestamptz not null default now()
);
create index membros_guilda_idx on public.membros (guilda_id);

-- Pontos da Grande Colheita. A semana começa na segunda (America/Sao_Paulo).
create table public.pontos_semana (
  user_id  uuid not null references public.perfis (id) on delete cascade,
  semana   date not null,
  pontos   int  not null default 0 check (pontos >= 0),
  primary key (user_id, semana)
);

create table public.baus (
  user_id    uuid not null references public.perfis (id) on delete cascade,
  semana     date not null,
  indice     smallint not null check (indice between 0 and 3),
  criado_em  timestamptz not null default now(),
  primary key (user_id, semana, indice)
);

create table public.ajudas (
  user_id  uuid not null references public.perfis (id) on delete cascade,
  alvo_id  uuid not null references public.perfis (id) on delete cascade,
  dia      date not null,
  primary key (user_id, alvo_id, dia)
);

create table public.mural (
  id         bigint generated always as identity primary key,
  guilda_id  uuid not null references public.guildas (id) on delete cascade,
  user_id    uuid references public.perfis (id) on delete set null,
  tipo       text not null check (tipo in ('entrada', 'doacao', 'ajuda', 'choque', 'nivel', 'safra')),
  texto      text not null check (char_length(texto) <= 140),
  criado_em  timestamptz not null default now()
);
create index mural_guilda_idx on public.mural (guilda_id, id desc);

create table public.parabens (
  user_id   uuid not null references public.perfis (id) on delete cascade,
  mural_id  bigint not null references public.mural (id) on delete cascade,
  dia       date not null,
  primary key (user_id, mural_id)
);

create table public.doacoes (
  id         bigint generated always as identity primary key,
  user_id    uuid references public.perfis (id) on delete set null,
  guilda_id  uuid not null references public.guildas (id) on delete cascade,
  valor      bigint not null check (valor > 0),
  criado_em  timestamptz not null default now()
);

-- Contadores por hora para limitar abuso.
create table public.limites (
  user_id  uuid not null references public.perfis (id) on delete cascade,
  chave    text not null,
  janela   timestamptz not null,
  qtd      int not null default 0,
  primary key (user_id, chave, janela)
);
