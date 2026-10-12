# Backend do Sítio dos Bichos (Supabase)

Contas, salvamento na nuvem, guilda real, Grande Colheita, ajuda entre colegas, mural e ranking.
Tudo vive no Postgres do Supabase; o jogo conversa só com funções `jogo_*` (RPC). Não há servidor próprio para manter.

## Como funciona

- **Conta:** login anônimo do Supabase (sem e-mail). O `auth.uid()` identifica o jogador.
- **Segurança:** todas as tabelas têm RLS ligado e **nenhuma permissão** para `anon`/`authenticated`. O único caminho são as 16 funções `jogo_*` (`security definer`, `search_path` fixo), que validam tudo. Os ajudantes internos ficam no schema `priv`, inacessível pela API.
- **Respostas:** `{ "ok": true, ... }` ou `{ "ok": false, "erro": "codigo" }`. Só a falta de login levanta exceção (`nao_autenticado`).
- **Semana:** começa na segunda-feira, fuso `America/Sao_Paulo`.
- **Antiabuso:** limites por hora/dia (tabela `limites`), tetos de pontos por ação (ovo 10, coleta 60, missão 30, safra 5), salto de nível ≤ +5, poder máximo plausível por nível, save ≤ 200 KB com controle de versão.

## Publicar

1. Crie um projeto em <https://supabase.com>.
2. **Authentication → Sign In / Providers → Anonymous sign-ins: ligar.** (Recomendado: ativar captcha para limitar contas falsas.)
3. Aplique as migrações, nesta ordem (`supabase/migrations/`):
   - com a CLI: `supabase link --project-ref SEU_REF && supabase db push`
   - ou colando cada arquivo no **SQL Editor**.
   - A migração 4 (`20261012000400_novidades.sql`) traz prestígio, convites, visitas e curtidas, reações no mural, ranking e prêmio de guilda contra guilda, métricas e exclusão de conta. Quem já aplicou as migrações 1 a 3 só precisa colar e rodar a 4 (uma vez; ela não é repetível).
   - A migração 5 (`20261012000500_mecanicas.sql`) traz o chefe da guilda, a corrida de 48 horas e os códigos promocionais. Rode depois da 4, uma vez só.

   Para criar um código promocional (ex.: para divulgação), rode no SQL Editor:

   ```sql
   insert into public.codigos_promo (codigo, gemas, ingressos, max_usos, valido_ate)
   values ('BEMVINDO', 20, 2, 500, now() + interval '30 days');  -- código em MAIÚSCULAS; max_usos e valido_ate são opcionais
   ```
4. Copie a **Project URL** e a **anon key** (Settings → API) para o jogo:

```js
import { createClient } from '@supabase/supabase-js';
import { criarApi } from './src/api.js';

const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const api = criarApi(sb);

await api.entrar('Joana');                       // login anônimo + perfil
await api.save.salvar(estado, versaoAtual);      // nuvem
await api.guilda.contribuir(8, 'ovo');           // Grande Colheita
const r = await api.ranking();
if (!r.ok) mostrar(r.mensagem);                  // textos em português prontos
```

Outras chamadas disponíveis: `api.convite.codigo/usar/resgatar`, `api.visitar`, `api.curtir`, `api.mural.reagir`, `api.guildas.ranking/premio`, `api.evento('sessao')` (métricas) e `api.conta.apagar()`. Consultas de retenção e anúncios por dia: `metricas.sql`.

A anon key é pública por desenho; quem protege os dados são as permissões acima.

## Testes

Os testes aplicam as migrações reais em um Postgres comum (15+) e chamam as funções como o Supabase faria, incluindo os papéis `anon` e `authenticated`. Cada arquivo cria e apaga o próprio banco.

```
cd backend
export PGHOST=/tmp PGPORT=5432 PGUSER=postgres   # um Postgres local acessível por psql
npm test
```

Precisa de `psql`, `createdb` e `dropdb` no PATH e Node 20+. Não há dependências npm.
Cobertura: segurança (sem login, anon, tabelas e `priv` bloqueados, RLS), perfil e save, guilda (criar, entrar, sair, líder, lotação), pontos, doação, ajuda, baús, mural, ranking e o módulo `src/api.js`.

## Limitações conhecidas

- **Recompensas e moedas são decididas pelo aparelho.** O servidor só aceita pontos dentro dos tetos e dos limites por hora, e é dono do estado compartilhado (guilda, pontos, baús, mural, ranking). Um jogador determinado ainda pode inflar o próprio save; para um jogo cooperativo e sem dinheiro real isso é um risco aceitável. Se um dia houver compra com dinheiro, valide no servidor.
- **Sem tempo real:** o jogo deve consultar `jogo_guilda_estado` de tempos em tempos (por exemplo, a cada 30–60 s com a guilda aberta), não manter conexão.
- **Limpeza:** as tabelas `pontos_semana`, `baus`, `ajudas`, `parabens` e `limites` crescem com o tempo. Opcional: agendar com `pg_cron` a remoção de linhas com mais de 8 semanas.
- O artefato publicado do jogo no claude.ai não consegue chamar o Supabase (política de segurança do navegador). A integração vale para a versão própria/Capacitor.
