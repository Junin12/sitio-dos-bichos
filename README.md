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
src/template.html          interface (HTML, CSS e JS)
build.py                   junta template e regras no HTML final
tests/simulacao.js         simulação de ritmo de progressão
src/api.js                 cliente do backend (Supabase), pronto para o jogo usar
backend/                   banco, regras do servidor e testes (veja backend/README.md)
versoes/pet-da-roca-v1.html   primeira versão (gacha + fazenda, sem progressão)
```

## Desenvolvimento

Depois de editar `src/`, gere o arquivo final:

```
python3 build.py
```

Simulação de ritmo (jogador que abre o app a cada 40 min, 3 h e 8 h):

```
cat src/logic.js tests/simulacao.js | node
```

Os números de balanceamento (custos, XP, metas) ficam no começo de `src/logic.js`.

## Próximos passos

1. Ligar o jogo ao backend (já pronto em `backend/` e `src/api.js`): trocar os jogadores simulados pelas chamadas reais.
2. Empacotar com Capacitor e trocar os anúncios simulados por AdMob recompensado.
3. Revisar as exigências da Play Store (divulgação de chances, política de anúncios, classificação indicativa).
