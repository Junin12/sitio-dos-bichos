function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}}
function simula(intMin,horas,seed){
  const rng=mulberry(seed); const t0=Date.UTC(2026,9,12,12,0,0);
  const S=novoEstado(t0); let agora=t0; const passo=intMin*60000, fim=t0+horas*HORA; const marcos={}; let ult=1; const safM={};
  let ultSaf=1;
  while(agora<fim){
    agora+=passo; avancar(S,agora);
    for(let i=0;i<S.eggs.length;i++) abrirOvo(S,i,agora,rng);
    for(let i=0;i<3;i++) resgatarMissao(S,i,false);
    resgatarDiario(S,diaDe(agora),false);
    // missões 'anuncio'/'melhor' avançam sozinhas via eventos; anuncio: bot assiste se houver
    for(const m of S.missoes) if(m&&m.t==='anuncio'&&!m.feita){anuncioVisto(S,'missao');}
    coletar(S,1);
    if(S.nivel>=5&&S.guilda.id<0) entrarGuilda(S,0,agora);
    if(S.guilda.id>=0){ for(let b=0;b<4;b++) resgatarBau(S,b,agora); for(let i=0;i<N_MEMBROS;i++) ajudar(S,i,agora); }
    let gastou=true,guard=0;
    while(gastou&&guard++<60){
      gastou=false;
      if(comprarPasto(S).ok){gastou=true;continue;}
      let melhor=null,mc=Infinity;
      for(const id in OBRAS){ if(S.nivel>=OBRAS[id].nivel&&S.obras[id]<OBRAS[id].max&&S.nivel>=nivelParaObra(S.obras[id])){const c=custoObra(id,S.obras[id]); if(c<mc){mc=c;melhor=id;}}}
      if(melhor&&S.coins>=mc){melhorarObra(S,melhor);gastou=true;continue;}
      const ce=custoOvo(S,'palha'); const reserva=melhor?Math.min(mc*0.3,ce*4):0;
      if(S.nivel>=5&&S.gems>=5&&S.eggs.some(e=>!e)){ if(comprarOvo(S,'dourado',agora).ok){gastou=true;continue;} }
      if(S.coins>=ce+reserva&&S.eggs.some(e=>!e)){ if(comprarOvo(S,'palha',agora).ok) gastou=true; }
    }
    // doação: com sobra grande
    if(S.guilda.id>=0&&S.coins>200000){ doar(S,Math.floor(S.coins*0.1),agora); }
    while(ult<S.nivel){ult++;marcos[ult]=Math.round((agora-t0)/60000);}
    while(ultSaf<S.safra){ultSaf++; if(ultSaf%10===0) safM[ultSaf]=Math.round((agora-t0)/60000);}
  }
  return {S,marcos,safM,agora};
}
function resumo(intMin,horas){
  const r=simula(intMin,horas,42), S=r.S;
  const mk=n=>r.marcos[n]!==undefined?(r.marcos[n]>=120?(r.marcos[n]/60).toFixed(1)+'h':r.marcos[n]+'min'):'—';
  const rk=rankingSitios(S,r.agora).find(x=>x.voce).pos;
  console.log(`check a cada ${intMin}min por ${horas}h -> nivel ${S.nivel} | Lv3 ${mk(3)} Lv5 ${mk(5)} Lv10 ${mk(10)} Lv15 ${mk(15)} Lv20 ${mk(20)} Lv30 ${mk(30)} | safra ${S.safra} | pets ${Object.keys(S.pets).length}/19 | prod ${prodTotal(S).toFixed(1)}/s | obras ${JSON.stringify(S.obras)} | guilda nv ${S.guilda.nivel} doado ${S.guilda.doado} | rank ${rk}/51 | coins ${Math.round(S.coins)}`);
}
resumo(40,72); resumo(180,720); resumo(480,1440);
// sanidade social
{
  const S=novoEstado(Date.UTC(2026,9,12,12)); S.nivel=5; const now=Date.UTC(2026,9,14,9);
  console.log(entrarGuilda(S,1,now).ok, 'meta semana', metaSemana(S), 'total sem player', totalSemana(S,now), 'horasSemana', horasSemana(now).toFixed(1));
  console.log(muralEventos(S,now,3).map(e=>e.txt));
  console.log(membrosOrdenados(S,now).slice(0,4).map(m=>m.nome+':'+m.pontos).join(' | '));
  console.log('rank top3', rankingSitios(S,now).slice(0,3).map(x=>x.nome+':'+x.poder).join(' | '));
  // semana vira: reset
  S.guilda.pontos=500; S.guilda.baus=[1,1,0,0]; atualizarGuilda(S,now+8*DIA); console.log('apos virar semana',S.guilda.pontos,S.guilda.baus);
  console.log('parabenizar', parabenizar(S,123,now).ok, parabenizar(S,123,now).erro);
}
