# Sítio dos Bichos

Protótipo de jogo mobile gacha de pets com fazenda idle, feito para virar app na Google Play com receita de anúncios recompensados.

Roda direto no navegador: abra `sitio-dos-bichos.html`. O progresso fica salvo no `localStorage`.

## O que tem

- **Gacha:** ovos de Palha (moedas) e Dourado (gemas), 19 bichos em 5 raridades, garantia de Épico a cada 30 invocações, chances visíveis no jogo.
- **Fazenda idle:** os bichos produzem moedas no celeiro, mesmo com o app fechado.
- **Fazendeiro:** nível 1 a 30, títulos e visual que evoluem.
- **Obras:** Celeiro, Chocadeira, Moinho e Estufa, que aparecem no cenário e dependem do nível do fazendeiro.
- **Safras:** estágios que avançam sozinhos com a produção.
- **Metas:** missões, bônus diário com sequência de 7 dias, álbum com bônus por coleção completa.
- **Guilda:** doações, Grande Colheita semanal com baús, ajuda entre membros, mural e ranking dos sítios.
- **Anúncios recompensados (simulados):** coletar em dobro, chocar agora, ovo grátis, gemas, missão em dobro e bônus diário em dobro. A aba de anúncios tem uma calculadora de receita.

Os outros jogadores (guilda, mural, ranking) são **simulados** e seguem o relógio real. Na versão publicada, isso precisa de um servidor com contas e salvamento na nuvem.

## Estrutura

```
sitio-dos-bichos.html      jogo completo em um arquivo (gerado por build.py)
src/logic.js               regras do jogo, sem DOM
src/template.html          interface (HTML e JS da tela)
src/estilo.css             visual (tema, botões 3D, cartões, modais)
src/cena.js                cena do sítio em canvas: céu pela hora real, construções, bichos, fazendeiro
src/fx.js                  partículas: moedas voando até o saldo, confete, brilhos
src/som.js                 sons sintetizados (WebAudio) e vibração
build.py                   junta template, regras, estilo e efeitos no HTML final
tests/simulacao.js         simulação de ritmo de progressão
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

Os números de balanceamento (custos, XP, metas) ficam no começo de `src/logic.js`.

## Próximos passos

1. Ativar o GitHub Pages (Settings → Pages → branch `main`, pasta `/docs`) para jogar a versão online.
2. Empacotar com Capacitor e trocar os anúncios simulados por AdMob recompensado.
3. Revisar as exigências da Play Store (divulgação de chances, política de anúncios, classificação indicativa).
