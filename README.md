# Sítio dos Bichos

Protótipo de jogo mobile gacha de pets com fazenda idle, feito para virar app na Google Play com receita de anúncios recompensados.

Roda direto no navegador: abra `sitio-dos-bichos.html`. O progresso fica salvo no `localStorage`.

## O que tem

- **Gacha:** ovos de Palha (moedas), Dourado (gemas) e Brilhante (1 por dia, com anúncio). 40 animais (reais e pré-históricos) em 5 raridades, mais 8 animais exclusivos de evento. Garantia de Épico a cada 30 invocações, chances visíveis no jogo.
- **Fazenda idle:** os bichos produzem moedas no celeiro, mesmo com o app fechado.
- **Fazendeiro:** nível 1 a 30, títulos e visual que evoluem.
- **Obras:** Celeiro, Chocadeira, Moinho e Estufa, que aparecem no cenário e dependem do nível do fazendeiro.
- **Safras:** estágios que avançam sozinhos com a produção.
- **Metas:** missões, bônus diário com sequência de 7 dias, álbum com bônus por coleção completa.
- **Guilda:** doações, Grande Colheita semanal com baús, ajuda entre membros, mural e ranking dos sítios.
- **Cuidar dos bichos:** carinho, ração e nome próprio; bicho feliz produz até 15% mais.
- **Horta e pedidos:** cinco cultivos com tempo de crescimento; clientes pedem colheitas ou querem ver um bicho, com prazo.
- **Evento semanal:** tema e bicho exclusivo novos toda semana, com 4 prêmios por pontos.
- **Presentes do dia:** baú grátis e baús extras com anúncio; ovo brilhante diário.
- **Decoração e estações:** 8 itens que aparecem no sítio (+1% de moedas cada); primavera, verão, outono e inverno mudam a cena.
- **Prestígio:** no nível 25, recomeça mantendo bichos, álbum e decoração, com +25% de moedas permanente.
- **Social (online):** convite por link, visitar o sítio de outros jogadores e curtir, reações rápidas no mural, ranking e prêmio de guilda contra guilda.
- **Tutorial guiado**, modo econômico automático para aparelhos fracos, lembretes e instalação como app (PWA).
- **Loja (simulada):** Sem anúncios e Passe da Temporada, só para testar o fluxo. Sem cobrança.
- **Anúncios recompensados (simulados):** coletar em dobro, chocar agora, ovo grátis, gemas, missão em dobro e bônus diário em dobro. A aba de anúncios tem uma calculadora de receita.

Os outros jogadores (guilda, mural, ranking) são **simulados** e seguem o relógio real. Na versão publicada, isso precisa de um servidor com contas e salvamento na nuvem.

## Estrutura

```
sitio-dos-bichos.html      jogo completo em um arquivo (gerado por build.py)
src/logic.js               regras do jogo, sem DOM
src/template.html          interface (HTML e JS da tela)
src/estilo.css             visual (tema, botões 3D, cartões, modais)
src/cena.js                cena do sítio em canvas: céu pela hora real, estações, decoração, construções, bichos, fazendeiro
src/telas.js               telas novas: horta, pedidos, evento, ajustes, visitas, tutorial, lembretes, prestígio
src/fx.js                  partículas: moedas voando até o saldo, confete, brilhos
src/som.js                 sons sintetizados (WebAudio) e vibração
build.py                   junta template, regras, estilo e efeitos no HTML final
tests/simulacao.js         simulação de ritmo e testes das regras
tests/e2e.mjs              teste no navegador (Playwright), inclusive o modo online contra um Postgres local
docs/privacidade.html      política de privacidade (modelo para revisar)
PLAY_STORE.md              checklist de publicação e o que o jogo ainda não faz
backend/metricas.sql       consultas de retenção, anúncios por dia e funil
src/api.js                 cliente do backend (Supabase)
src/online.js              modo online do jogo: save na nuvem, guilda, mural e ranking reais
docs/index.html            versão online (gerada), publicada no GitHub Pages
config.online.json         URL e chave pública do projeto Supabase
backend/                   banco, regras do servidor e testes (veja backend/README.md)
versoes/pet-da-roca-v1.html   primeira versão (gacha + fazenda, sem progressão)
```

## Desenvolvimento

Depois de editar `src/`, gere o arquivo final:

```
python3 build.py            # sitio-dos-bichos.html (offline, jogadores simulados)
python3 build.py --online   # também docs/index.html (conectado ao Supabase)
```

A versão online cai sozinha para o modo offline se o servidor não responder.

Simulação de ritmo (jogador que abre o app a cada 40 min, 3 h e 8 h):

```
cat src/logic.js tests/simulacao.js | node
```

Testes: `cat src/logic.js tests/simulacao.js | node` (regras), `cd backend && npm test` (servidor) e `node tests/e2e.mjs` (navegador).

Os números de balanceamento (custos, XP, metas) ficam no começo de `src/logic.js`.

## Mecânicas de longo prazo

Inspiradas em jogos idle com coleção: sorteio em lote com ingressos, oficina (fila de produção com tempo real), pesquisa com bônus permanentes, combos de bichos, cruzamento, evolução dos bichos (fragmentos de repetidos), conquistas, chefe da guilda (praga da semana), corrida de 48 horas e códigos promocionais (só online). Tudo funciona offline, exceto os códigos; online, chefe e corrida usam o servidor.

## Próximos passos

1. Rodar as migrações `20261012000400_novidades.sql` e `20261012000500_mecanicas.sql` no projeto Supabase, nessa ordem (veja backend/README.md).
2. Empacotar com Capacitor e trocar os anúncios e as compras simulados por AdMob e Google Play Billing.
3. Seguir o `PLAY_STORE.md`.

## Visual 2.5D e perfil do fazendeiro
- Cena com luz do sol, sombras macias, névoa de distância, volume nas construções e árvores, bichos com sombra de contato e base brilhante por raridade. Botões, cartões, barra de navegação, ovos e revelação com relevo. Tudo desenhado por código (canvas/SVG/CSS), sem imagens.
- Toque no círculo de nível para abrir o perfil: fazendeiro ou fazendeira, tom de pele, roupa e o bicho companheiro (por padrão o mais evoluído e forte). Roupas vêm do nível, do prestígio, do prêmio final de cada evento semanal, da corrida de 48 h e de pacotes da loja (compra simulada até entrar o Google Play). O perfil fica só no aparelho por enquanto; ainda não aparece no ranking online.
