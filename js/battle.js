function renderBattleMyParty(){
  const p=getAP();
  const lbl=document.getElementById('battle-party-label');
  if(lbl) lbl.textContent=`使用中のパーティ — ${p.name}`;
  const el=document.getElementById('battle-my-party');
  el.innerHTML='';
  for(let i=0;i<6;i++){
    const en=pname(p.pokemon[i]);
    const r=getPoke(en)||{};
    const slot=document.createElement('div');
    if(en){
      slot.className='pmini-slot';
      slot.innerHTML=spriteImg(en,30)+
        `<span class="pmini-name">${r[1]||en}</span>`+
        `<div class="pmini-types">${typeHtml(r[3])}</div>`;
      slot.title=r[1]||en;
    }else{
      slot.className='pmini-slot empty';
      slot.innerHTML=`<svg width="18" height="18" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="33" stroke="#37414e" stroke-width="4" opacity=".5"/><path d="M17 50h66" stroke="#37414e" stroke-width="4" opacity=".5"/><circle cx="50" cy="50" r="11" fill="#11151c" stroke="#37414e" stroke-width="4"/></svg>`;
    }
    el.appendChild(slot);
  }
  renderSpeedOrder();
}

const BATTLE_FORM_VARIANTS={
  // 対戦中フォルムチェンジ (sprite = PokeAPI numeric ID)
  'Darmanitan':       {form:'Darmanitan-Zen',       sprite:10017},
  'Darmanitan-Galar': {form:'Darmanitan-Galar-Zen', sprite:10178},
  'Wishiwashi':       {form:'Wishiwashi-School',    sprite:10127},
  'Meloetta':         {form:'Meloetta-Pirouette',   sprite:10018},
  // メガシンカ
  'Charizard':        {form:'Charizard-Mega-Y',     sprite:10035},
  'Venusaur':         {form:'Venusaur-Mega',        sprite:10033},
  'Blastoise':        {form:'Blastoise-Mega',       sprite:10036},
  'Pidgeot':          {form:'Pidgeot-Mega',         sprite:10073},
  'Aerodactyl':       {form:'Aerodactyl-Mega',      sprite:10042},
  'Slowbro':          {form:'Slowbro-Mega',         sprite:10071},
  'Pinsir':           {form:'Pinsir-Mega',          sprite:10040},
  'Ampharos':         {form:'Ampharos-Mega',        sprite:10045},
  'Steelix':          {form:'Steelix-Mega',         sprite:10072},
  'Heracross':        {form:'Heracross-Mega',       sprite:10047},
  'Houndoom':         {form:'Houndoom-Mega',        sprite:10048},
  'Aggron':           {form:'Aggron-Mega',          sprite:10053},
  'Mawile':           {form:'Mawile-Mega',          sprite:10052},
  'Sableye':          {form:'Sableye-Mega',         sprite:10066},
  'Altaria':          {form:'Altaria-Mega',         sprite:10067},
  'Absol':            {form:'Absol-Mega',           sprite:10057},
  'Sharpedo':         {form:'Sharpedo-Mega',        sprite:10070},
  'Camerupt':         {form:'Camerupt-Mega',        sprite:10087},
  'Banette':          {form:'Banette-Mega',         sprite:10056},
  'Glalie':           {form:'Glalie-Mega',          sprite:10074},
  'Latias':           {form:'Latias-Mega',          sprite:10062},
  'Latios':           {form:'Latios-Mega',          sprite:10063},
  'Garchomp':         {form:'Garchomp-Mega',        sprite:10058},
  'Metagross':        {form:'Metagross-Mega',       sprite:10076},
  'Salamence':        {form:'Salamence-Mega',       sprite:10089},
  'Kangaskhan':       {form:'Kangaskhan-Mega',      sprite:10039},
  'Gengar':           {form:'Gengar-Mega',          sprite:10038},
  'Alakazam':         {form:'Alakazam-Mega',        sprite:10037},
  'Rayquaza':         {form:'Rayquaza-Mega',        sprite:10079},
  'Blaziken':         {form:'Blaziken-Mega',        sprite:10050},
  'Lopunny':          {form:'Lopunny-Mega',         sprite:10088},
  'Beedrill':         {form:'Beedrill-Mega',        sprite:10090},
  'Scizor':           {form:'Scizor-Mega',          sprite:10046},
  'Gardevoir':        {form:'Gardevoir-Mega',       sprite:10051},
  'Lucario':          {form:'Lucario-Mega',         sprite:10059},
  'Gyarados':         {form:'Gyarados-Mega',        sprite:10041},
  'Tyranitar':        {form:'Tyranitar-Mega',       sprite:10049},
  'Swampert':         {form:'Swampert-Mega',        sprite:10064},
  'Gallade':          {form:'Gallade-Mega',         sprite:10068},
  'Medicham':         {form:'Medicham-Mega',        sprite:10054},
  'Manectric':        {form:'Manectric-Mega',       sprite:10055},
  'Abomasnow':        {form:'Abomasnow-Mega',       sprite:10060},
  'Diancie':          {form:'Diancie-Mega',         sprite:10075},
  'Sceptile':         {form:'Sceptile-Mega',        sprite:10065},
  'Mewtwo':           {form:'Mewtwo-Mega-Y',        sprite:10044},
  // チャンピオンズ(Z-A)新メガ — PokeAPIスプライト無のため 'ball'(モンスターボール)表示
  'Audino':           {form:'Audino-Mega',          sprite:'ball'},
  'Barbaracle':       {form:'Barbaracle-Mega',      sprite:'ball'},
  'Baxcalibur':       {form:'Baxcalibur-Mega',      sprite:'ball'},
  'Chandelure':       {form:'Chandelure-Mega',      sprite:'ball'},
  'Chesnaught':       {form:'Chesnaught-Mega',      sprite:'ball'},
  'Chimecho':         {form:'Chimecho-Mega',        sprite:'ball'},
  'Clefable':         {form:'Clefable-Mega',        sprite:'ball'},
  'Crabominable':     {form:'Crabominable-Mega',    sprite:'ball'},
  'Darkrai':          {form:'Darkrai-Mega',         sprite:'ball'},
  'Delphox':          {form:'Delphox-Mega',         sprite:'ball'},
  'Dragonite':        {form:'Dragonite-Mega',       sprite:'ball'},
  'Drampa':           {form:'Drampa-Mega',          sprite:'ball'},
  'Eelektross':       {form:'Eelektross-Mega',      sprite:'ball'},
  'Emboar':           {form:'Emboar-Mega',          sprite:'ball'},
  'Excadrill':        {form:'Excadrill-Mega',       sprite:'ball'},
  'Falinks':          {form:'Falinks-Mega',         sprite:'ball'},
  'Feraligatr':       {form:'Feraligatr-Mega',      sprite:'ball'},
  'Floette':          {form:'Floette-Mega',         sprite:'ball'},
  'Froslass':         {form:'Froslass-Mega',        sprite:'ball'},
  'Glimmora':         {form:'Glimmora-Mega',        sprite:'ball'},
  'Golisopod':        {form:'Golisopod-Mega',       sprite:'ball'},
  'Golurk':           {form:'Golurk-Mega',          sprite:'ball'},
  'Greninja':         {form:'Greninja-Mega',        sprite:'ball'},
  'Hawlucha':         {form:'Hawlucha-Mega',        sprite:'ball'},
  'Heatran':          {form:'Heatran-Mega',         sprite:'ball'},
  'Magearna':         {form:'Magearna-Mega',        sprite:'ball'},
  'Malamar':          {form:'Malamar-Mega',         sprite:'ball'},
  'Meganium':         {form:'Meganium-Mega',        sprite:'ball'},
  'Meowstic':         {form:'Meowstic-M-Mega',      sprite:'ball'},
  'Pyroar':           {form:'Pyroar-Mega',          sprite:'ball'},
  'Raichu':           {form:'Raichu-Mega-Y',        sprite:'ball'},
  'Scolipede':        {form:'Scolipede-Mega',       sprite:'ball'},
  'Scovillain':       {form:'Scovillain-Mega',      sprite:'ball'},
  'Scrafty':          {form:'Scrafty-Mega',         sprite:'ball'},
  'Skarmory':         {form:'Skarmory-Mega',        sprite:'ball'},
  'Staraptor':        {form:'Staraptor-Mega',       sprite:'ball'},
  'Starmie':          {form:'Starmie-Mega',         sprite:'ball'},
  'Tatsugiri':        {form:'Tatsugiri-Curly-Mega', sprite:'ball'},
  'Victreebel':       {form:'Victreebel-Mega',      sprite:'ball'},
  'Zeraora':          {form:'Zeraora-Mega',         sprite:'ball'},
  'Zygarde':          {form:'Zygarde-Mega',         sprite:'ball'},
  'Dragalge':         {form:'Dragalge-Mega',        sprite:'ball'},
};
// CALC.dict.pokemon に日本語キーが無いポケモンの日本語→英名 補完
const JA_EN_FALLBACK={'ドラミドロ':'Dragalge'};

async function calcSpeForDisplay(it){
  const en=pname(it);
  if(!en) return null;
  try{
    if(!CALC.ready) await initCalc();
  }catch(e){ return null; }
  if(!CALC.ready||!CALC.gen||!CALC.dict) return null;
  const speciesEng=CALC.dict.pokemon[en]||JA_EN_FALLBACK[en];
  if(!speciesEng) return null;
  const sp=CALC.gen.species.get(window.SMOGON.toID(speciesEng));
  if(!sp?.baseStats) return null;
  const base={};
  SK.forEach(s=>base[s]=sp.baseStats[s]);
  const pts=it.points||{H:0,A:0,B:0,C:0,D:0,S:0};
  const spe=computeChampStats(base,pts,it.nature||'まじめ').spe;
  const variant=BATTLE_FORM_VARIANTS[speciesEng];
  if(variant){
    const fsp=CALC.gen.species.get(window.SMOGON.toID(variant.form));
    if(fsp?.baseStats){
      const fbase={};SK.forEach(s=>fbase[s]=fsp.baseStats[s]);
      const formSpe=computeChampStats(fbase,pts,it.nature||'まじめ').spe;
      return{spe,formSpe,formLabel:variant.label,formSprite:variant.sprite};
    }
  }
  return{spe};
}

async function renderSpeedOrder(){
  const el=document.getElementById('speed-order');
  if(!el) return;
  const p=getAP();
  const myList=p.pokemon.filter(x=>pname(x)).map(x=>({it:pbuild(x),side:'my'}));
  const oppList=oppParty.filter(Boolean).map(en=>({
    it:{name:en,points:{H:0,A:0,B:0,C:0,D:0,S:32},nature:'おくびょう'},
    side:'opp'
  }));
  const all=[...myList,...oppList];
  if(!all.length){el.innerHTML='';return}
  el.innerHTML='<span style="color:var(--text3);font-size:10px">すばやさ計算中...</span>';
  if(!CALC.ready){
    try{initCalc();}catch(e){}
    await new Promise(r=>{const t=setInterval(()=>{if(CALC.ready){clearInterval(t);r()}},150);setTimeout(()=>{clearInterval(t);r()},8000);});
  }
  const groups=await Promise.all(all.map(async({it,side})=>{
    const res=await calcSpeForDisplay(it);
    const en=pname(it);
    const r=getPoke(en)||{};
    return{en,name:r[1]||en,spe:res?.spe??null,formSpe:res?.formSpe??null,formLabel:res?.formLabel??null,formSprite:res?.formSprite??null,side};
  }));
  groups.sort((a,b)=>(b.spe??-1)-(a.spe??-1));
  el.innerHTML='';
  const row=document.createElement('div');
  row.className='speed-order';
  const SPRITE_BASE='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
  const BALL_URL='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
  const entries=[];
  groups.forEach(({en,spe,formSpe,formSprite,side})=>{
    if(spe!=null) entries.push({en,spe,sprite:null,side});
    if(formSpe!=null) entries.push({en,spe:formSpe,sprite:formSprite,side});
  });
  entries.sort((a,b)=>(b.spe??-1)-(a.spe??-1));
  const mkChip=(en,spe,side,spriteId)=>{
    const col=side==='my'?'var(--text)':'var(--text3)';
    const chip=document.createElement('span');
    chip.className='speed-chip';
    chip.title=`${en} ${spe??'?'}`;
    let imgHtml;
    if(spriteId==='ball')
      imgHtml=`<img src="${BALL_URL}" width="18" height="18" style="object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none'" loading="lazy">`;
    else if(spriteId)
      imgHtml=`<img src="${SPRITE_BASE}${spriteId}.png" width="18" height="18" style="object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none'" loading="lazy">`;
    else
      imgHtml=spriteImg(en,18);
    chip.innerHTML=imgHtml+
      `<span class="num" style="font-size:11px;color:${col};">${spe??'?'}</span>`;
    return chip;
  };
  entries.forEach(({en,spe,sprite,side},i)=>{
    if(i>0){const gt=document.createElement('span');gt.className='speed-gt';gt.textContent='>';row.appendChild(gt)}
    row.appendChild(mkChip(en,spe,side,sprite));
  });
  el.appendChild(row);
}

function renderOppSlots(){
  const el=document.getElementById('opp-party-slots');
  el.innerHTML='';
  for(let i=0;i<6;i++){
    const en=oppParty[i];
    const slot=document.createElement('div');
    slot.className='opp-slot';
    const numSpan=`<span class="opp-slot-num num">${String(i+1).padStart(2,'0')}</span>`;
    if(en){
      const r=getPoke(en)||{};
      slot.innerHTML=numSpan+
        `<span style="width:50px;height:50px;border-radius:10px;background:var(--raised);display:flex;align-items:center;justify-content:center;overflow:hidden;">${spriteImg(en,46)}</span>`+
        `<span class="opp-slot-name">${r[1]||en}</span>`+
        `<button style="position:absolute;top:4px;right:6px;background:none;border:none;color:var(--text3);font-size:13px;cursor:pointer;padding:2px 4px;" onclick="rmOpp(event,${i})">×</button>`;
      slot.onclick=(e)=>{if(e.target.tagName==='BUTTON')return;openModal(`スロット${i+1}(相手)`,n=>setOppSlot(i,n))};
    }else{
      slot.innerHTML=numSpan+`<span style="font-size:20px;color:#37414e;margin:6px 0;">＋</span>`;
      slot.onclick=()=>openModal(`スロット${i+1}(相手)`,n=>setOppSlot(i,n));
    }
    el.appendChild(slot);
  }
}

function setOppSlot(i,en){
  if(oppParty.includes(en)){alert(`${getPoke(en)?.[1]||en}はすでに登録されています`);return}
  oppParty[i]=en;renderOppSlots();renderSpeedOrder();
}
function rmOpp(e,i){e.stopPropagation();oppParty.splice(i,1);renderOppSlots();renderSpeedOrder();}

function renderSelGrid(party,elId,sel){
  const el=document.getElementById(elId);el.innerHTML='';
  party.filter(Boolean).forEach(en=>{
    const r=getPoke(en)||{};
    const isL=sel.lead.includes(en),isB=sel.back.includes(en);
    const btn=document.createElement('button');
    btn.className='sel-cell'+(isL?' lead':isB?' back':'');
    const tagColor=isL?'var(--lead)':isB?'var(--win)':'var(--text3)';
    const tag=isL?'先発':isB?'後発':'';
    const borderCol=isL?'#3d9bff':isB?'#3ad07a':'transparent';
    btn.innerHTML=
      `<span style="width:44px;height:44px;border-radius:9px;background:var(--raised);border:2px solid ${borderCol};display:flex;align-items:center;justify-content:center;overflow:hidden;">${spriteImg(en,40)}</span>`+
      `<span class="sel-tag num" style="color:${tagColor}">${tag||r[1]||en}</span>`;
    btn.title=r[1]||en;
    btn.onclick=()=>{toggleSel(en,party,elId,sel)};
    el.appendChild(btn);
  });
}
function toggleSel(en,party,elId,sel){
  if(sel.lead.includes(en))sel.lead=sel.lead.filter(x=>x!==en);
  else if(sel.back.includes(en))sel.back=sel.back.filter(x=>x!==en);
  else if(sel.lead.length<2)sel.lead.push(en);
  else if(sel.back.length<2)sel.back.push(en);
  renderSelGrid(party,elId,sel);
}

function renderConfirm(){
  [['my-confirm',mySel],['opp-confirm',oppSel]].forEach(([id,sel])=>{
    const el=document.getElementById(id);
    if(!el)return;
    el.innerHTML='';
    el.style.cssText='display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px;';
    [['先発',sel.lead,'var(--lead)'],['後発',sel.back,'var(--win)']].forEach(([pos,arr,color])=>{
      arr.forEach(en=>{
        const r=getPoke(en)||{};
        const chip=document.createElement('span');
        chip.style.cssText=`padding:4px 9px;border-radius:7px;background:var(--raised);border:1px solid ${color};font-size:11px;color:${color};`;
        chip.textContent=`${pos} ${r[1]||en}`;
        el.appendChild(chip);
      });
    });
  });
}

function goStep(n){
  if(n===2&&oppParty.filter(Boolean).length<1){alert('相手のポケモンを最低1匹入力してください');return}
  if(n===3){
    if(mySel.lead.length+mySel.back.length<4){alert('自分の選出を4匹選んでください（先発2→後発2）');return}
    if(oppSel.lead.length+oppSel.back.length<4){alert('相手の選出を4匹選んでください（先発2→後発2）');return}
    renderConfirm();
  }
  curStep=n;
  ['bs1','bs2','bs3'].forEach((id,i)=>{document.getElementById(id).style.display=i===n-1?'block':'none'});
  const dots=document.querySelectorAll('#sbar .step-dot');
  dots.forEach((d,i)=>{d.style.background=i<n-1?'#5d6b7a':i===n-1?'var(--red)':'var(--line)';});
  document.getElementById('slabel').textContent=['ステップ 1：相手のパーティを記録','ステップ 2：選出を選ぶ','ステップ 3：結果を記録'][n-1];
  if(n===2){
    const myP=getAP().pokemon.filter(Boolean).map(pname);
    renderSelGrid(myP,'my-sel-grid',mySel);
    renderSelGrid(oppParty.filter(Boolean),'opp-sel-grid',oppSel);
  }
}

function setRes(r){
  battleRes=r;
  const bw=document.getElementById('rbw'),bl=document.getElementById('rbl');
  if(bw) bw.classList.toggle('active',r==='win');
  if(bl) bl.classList.toggle('active',r==='loss');
}

function saveBattle(){
  if(!battleRes){alert('勝敗を選択してください');return}
  const p=getAP();
  const b={id:Date.now(),date:new Date().toISOString(),partyId:p.id,partyName:p.name,result:battleRes,myLead:[...mySel.lead],myBack:[...mySel.back],oppLead:[...oppSel.lead],oppBack:[...oppSel.back],oppParty:[...oppParty.filter(Boolean)]};
  S.battles.unshift(b);save();
  if(getGasUrl())pushGAS(true);
  alert('記録しました！');resetBattle();
}
function resetBattle(){oppParty=[];mySel={lead:[],back:[]};oppSel={lead:[],back:[]};battleRes=null;renderOppSlots();goStep(1)}
