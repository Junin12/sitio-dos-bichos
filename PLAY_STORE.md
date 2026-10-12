# Checklist para publicar na Google Play

Este jogo hoje é um site (PWA). Para entrar na loja, ele vai dentro de um app Android (veja "Caminho recomendado"). Esta lista junta o que a Play exige e o que o jogo já cumpre.

## O que já está pronto
- **Política de privacidade**: `docs/privacidade.html` (preencha os campos entre colchetes antes de publicar).
- **Excluir conta e dados**: botão em Ajustes (modo online), implementado no servidor (`jogo_conta_apagar`). A Play exige também um link público para pedir a exclusão: use a página da política (seção "Seus direitos") ou crie uma página só para isso.
- **Instalável e funciona sem internet**: `manifest.webmanifest`, ícones e `sw.js`.
- **Anúncios só com a escolha da pessoa** (anúncio recompensado), nunca no meio de uma ação.
- **Sem conteúdo fantasioso, violento ou adulto**: só animais reais.

## O que você precisa decidir ou fazer
1. **Conta de desenvolvedor Play** (taxa única de US$ 25). Contas pessoais novas precisam de um período de teste fechado com ao menos 12 testadores por 14 dias antes de liberar a produção.
2. **Empacotar o app**: Capacitor (recomendado) ou Trusted Web Activity (Bubblewrap). O Capacitor também dá acesso a lembretes com o jogo fechado e a compras reais.
3. **Anúncios reais**: troque o modal "Anúncio simulado" (`anuncio()` em `src/template.html`) por AdMob (anúncio recompensado). Use os IDs de teste até a aprovação. Exija consentimento (UMP) para usuários da UE/Reino Unido e informe o uso do ID de publicidade na declaração da Play.
4. **Compras reais** (Remover anúncios e Passe da Temporada): hoje são simuladas em Ajustes. Na loja, use o Google Play Billing, valide a compra no servidor e só então ligue `premium.semAnuncios` / `premium.passe`.
5. **Segurança dos dados** (formulário na Play Console). Declare: ID de usuário (anônimo), nome de jogador, atividade no app, métricas, ID de publicidade (se houver anúncios). Os dados são criptografados em trânsito e o jogador pode pedir exclusão.
6. **Classificação indicativa**: responda o questionário (IARC). O jogo não tem violência, apostas com dinheiro nem conteúdo adulto.
7. **Chance dos ovos**: a Play e a lei brasileira recomendam mostrar as chances. Elas estão em Ovos → "Chances de cada ovo". Mantenha essa tela se vender ovos com dinheiro real no futuro.
8. **Anúncios e crianças**: se marcar o app como direcionado a crianças, só use redes de anúncios certificadas para famílias e desligue o ID de publicidade. Hoje o texto da política diz que o jogo não é direcionado a menores de 13 anos.
9. **Material de loja**: ícone 512×512 (`docs/icon-512.png` serve de base), imagem de destaque 1024×500, ao menos 2 capturas de tela, descrição curta e longa.

## Contas falsas e abuso (CAPTCHA)
O login é anônimo, então qualquer pessoa pode criar muitas contas. O servidor já limita ações por hora, valida tudo o que o app informa e só paga convites quando o convidado chega ao nível 3 (máximo de 20 por pessoa). Para ir além:
- No painel do Supabase, em **Authentication → Attack Protection**, ligue o CAPTCHA (hCaptcha ou Cloudflare Turnstile). Depois o app precisa mostrar o desafio e enviar o `captchaToken` em `signInAnonymously({ options: { captchaToken } })`. **Isso ainda não está no app**: exige a chave do site e um componente de CAPTCHA, e não deve ser ligado antes disso, senão ninguém consegue entrar.
- No app publicado, considere o Play Integrity API para barrar versões adulteradas.

## O que o jogo ainda NÃO faz (para ser transparente)
- **Lembretes com o jogo fechado** só funcionam no app empacotado com Capacitor (plugin Local Notifications). No navegador, eles só chegam enquanto a página estiver aberta ou em segundo plano.
- **Idiomas**: o jogo está só em português do Brasil. A tradução para inglês e espanhol exige extrair os textos para um dicionário (cerca de 300 frases) e traduzir bichos, missões e avisos do servidor.
- **Os prêmios são calculados no aparelho.** O servidor limita pontos e confere se os valores fazem sentido, mas não impede quem adultera o app local de se dar moedas. Para ranking competitivo com prêmios de verdade, é preciso mover as regras de ganho para o servidor.
