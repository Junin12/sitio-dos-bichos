# Publicar na Google Play (passo a passo)

O jogo é uma página web. O Capacitor a embrulha num app Android e dá acesso a anúncios, avisos e conquistas.
Você precisa de: Node 18+, Android Studio (traz o SDK e o Java) e uma conta de desenvolvedor Google Play (taxa única).

## 1. Preparar
```
cd app
npm install
npm run preparar        # gera app/www a partir do jogo online
npm run android:add     # cria a pasta android/ (só na primeira vez)
npm run android:sync    # copia www e plugins para o projeto Android
npm run android:abrir   # abre no Android Studio
```
Rode `npm run android:sync` de novo sempre que mudar o jogo.

## 2. Anúncios de verdade (AdMob)
1. Crie uma conta no AdMob, registre o app e crie um bloco de anúncio **premiado (rewarded)**.
2. Em `src/som.js`, troque `ADMOB_IDS.recompensado` pelo ID do seu bloco (os IDs atuais são de TESTE, seguros para desenvolver).
3. No `android/app/src/main/AndroidManifest.xml`, dentro de `<application>`, coloque o ID do app AdMob:
   `<meta-data android:name="com.google.android.gms.ads.APPLICATION_ID" android:value="ca-app-pub-XXXX~YYYY"/>`
4. O jogo já mostra a escolha anúncios personalizados / não personalizados na primeira abertura quando roda dentro do app.

## 3. Avisos (lembretes)
O plugin `@capacitor/local-notifications` já está na lista. Em Ajustes o jogador liga os lembretes (ovo pronto, horta, expedição, bônus diário).
Para o ícone do aviso, coloque `ic_stat_icon.png` em `android/app/src/main/res/drawable/`.

## 4. Conquistas e login do Google Play Games
1. No Play Console, abra **Play Games Services**, crie as conquistas e o placar e anote os IDs.
2. Escolha e instale um plugin de Play Games para Capacitor (pesquise no npm e confira se acompanha o Capacitor 6). O adaptador `Plat`, em `src/som.js`, espera um plugin chamado `PlayGames` ou `GamesServices` com os métodos `signIn`, `unlockAchievement` e `submitScore`; se o plugin escolhido usar outros nomes, ajuste só o objeto `Plat`.
3. Preencha `PLAT_IDS` em `src/som.js` ligando o id de cada conquista do jogo ao id do Play, por exemplo `{ 'colheita10': 'CgkI...' }`. O jogo já chama `Plat.conquista(id)` ao resgatar cada conquista.
4. Sem isso o jogo funciona normalmente; só não envia conquistas ao Play.

## 5. Compras
Hoje as compras (Passe da Temporada, pacotes de roupa, oferta de iniciante, passe de guilda) são simuladas.
Para cobrar de verdade, use o Google Play Billing (escolha um plugin de compras para Capacitor no npm) e chame as funções do jogo (`comprarPremium`, `comprarPacoteRoupa`, `comprarOferta`) somente depois da confirmação da loja. No servidor, valide o recibo antes de liberar o passe de guilda.

## 6. Publicar
1. No Android Studio: Build → Generate Signed Bundle (AAB). Guarde a chave de assinatura em lugar seguro.
2. No Play Console: crie o app, envie o AAB em um teste interno, preencha a ficha da loja, classificação indicativa, segurança dos dados e a **política de privacidade** (`https://junin12.github.io/sitio-dos-bichos/privacidade.html`; preencha seus dados de contato nela antes).
3. Declare que o app tem anúncios e compras no app.
