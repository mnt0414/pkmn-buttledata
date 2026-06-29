const CALC = { ready:false, loading:false, built:false, gen:null, dict:null, overlay:null };
const calcState = { atk:{species:'',mega:'',battleForm:''}, def:{species:'',mega:'',battleForm:''} };
let BATTLE_ITEMS=[];
function itemIconUrl(ja){const en=CALC.dict?.items?.[ja];if(!en)return'';return`https://play.pokemonshowdown.com/sprites/itemicons/${en.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'')}.png`;}
function updateItemIcon(pre){const ja=document.getElementById(pre+'-item')?.value?.trim();const icon=document.getElementById(pre+'-item-icon');if(!icon)return;if(ja&&CALC.dict?.items?.[ja]){icon.src=itemIconUrl(ja);icon.style.display='inline-block';}else{icon.style.display='none';}}
function openItemDD(pre){const input=document.getElementById(pre+'-item');const dd=document.getElementById(pre+'-item-dd');if(!dd||!input||!BATTLE_ITEMS.length)return;const q=input.value.trim();const list=q?BATTLE_ITEMS.filter(ja=>ja.includes(q)):BATTLE_ITEMS;const show=list.slice(0,50);if(!show.length){dd.style.display='none';updateItemIcon(pre);return;}dd.innerHTML=show.map(ja=>`<div class="item-opt" onmousedown="event.preventDefault();selectItemDD('${pre}','${esc(ja)}')" ><img src="${itemIconUrl(ja)}" onerror="this.style.display='none'" loading="lazy"><span>${ja}</span></div>`).join('');dd.style.display='block';updateItemIcon(pre);}
function closeItemDD(pre){const dd=document.getElementById(pre+'-item-dd');if(dd)dd.style.display='none';updateItemIcon(pre);}
function selectItemDD(pre,ja){const input=document.getElementById(pre+'-item');if(input)input.value=ja;closeItemDD(pre);recalc();}
const TYPE_JA_EN={ノーマル:'Normal',ほのお:'Fire',みず:'Water',でんき:'Electric',くさ:'Grass',こおり:'Ice',かくとう:'Fighting',どく:'Poison',じめん:'Ground',ひこう:'Flying',エスパー:'Psychic',むし:'Bug',いわ:'Rock',ゴースト:'Ghost',ドラゴン:'Dragon',あく:'Dark',はがね:'Steel',フェアリー:'Fairy'};
const WEATHER_JA_EN={はれ:'Sun',あめ:'Rain',すなあらし:'Sand',ゆき:'Snow'};
const TERRAIN_JA_EN={エレキ:'Electric',グラス:'Grassy',ミスト:'Misty',サイコ:'Psychic'};
const RESIST_BERRY={Normal:'Chilan Berry',Fire:'Occa Berry',Water:'Passho Berry',Electric:'Wacan Berry',Grass:'Rindo Berry',Ice:'Yache Berry',Fighting:'Chople Berry',Poison:'Kebia Berry',Ground:'Shuca Berry',Flying:'Coba Berry',Psychic:'Payapa Berry',Bug:'Tanga Berry',Rock:'Charti Berry',Ghost:'Kasib Berry',Dragon:'Haban Berry',Dark:'Colbur Berry',Steel:'Babiri Berry',Fairy:'Roseli Berry'};
function whenSmogon(){return new Promise(r=>{if(window.SMOGON)return r(window.SMOGON);addEventListener('smogon-ready',()=>r(window.SMOGON),{once:true})})}
function mapHK(o){const out={};HK.forEach((k,i)=>out[SK[i]]=o[k]);return out}

function natModStats(natureJa){
  const en=CALC.dict.natures[natureJa]; if(!en)return{};
  const n=CALC.gen.natures.get(window.SMOGON.toID(en)); if(!n||n.plus===n.minus)return{};
  return {plus:n.plus,minus:n.minus};
}
function computeChampStats(base, pts, natureJa){
  const {plus,minus}=natModStats(natureJa), out={};
  SK.forEach((s,i)=>{
    const b=base[s], p=pts[HK[i]]||0, core=Math.floor((b*2+31+p*2)*50/100);
    if(s==='hp'){ out[s]= b===1?1: core+60; }
    else { const m=(plus===s)?1.1:(minus===s)?0.9:1; out[s]=Math.floor((core+5)*m); }
  });
  return out;
}
function injBase(f){return {hp:f.hp-75,atk:f.atk-20,def:f.def-20,spa:f.spa-20,spd:f.spd-20,spe:f.spe-20}}

const CHAMP_ABIL_ENGINE={'うなぎのぼり':'Levitate'};
const BATTLE_FORMS={
  'ヒヒダルマ':[{ja:'ダルマモード',dexId:'darmanitanzen'}],
  'ヒヒダルマ(ガラルのすがた)':[{ja:'ガラルダルマモード',dexId:'darmanitangalarzen'}],
  'ヨワシ':[{ja:'むれたすがた',dexId:'wishiwashischool'}],
  'イルカマン':[{ja:'エレガントのすがた',dexId:'palafinhero'}],
  'ギルガルド':[{ja:'ブレードフォルム',dexId:'aegislashblade'}],
  'コオリッポ':[{ja:'ノーアイスフェイス',dexId:'eiscuenoice'}],
  'メロエッタ':[{ja:'ステップフォルム',dexId:'meloettapirouette'}],
  'テラパゴス':[{ja:'テラスタルフォルム',dexId:'terapagosterastal'},{ja:'ステラフォルム',dexId:'terapagosstellar'}],
  'ジガルデ':[{ja:'10%フォルム',dexId:'zygarde10'},{ja:'パーフェクトフォルム',dexId:'zygardecomplete'}],
  'メテノ':[{ja:'メテオフォルム',dexId:'miniormeteor'}],
  'ディアルガ':[{ja:'オリジンフォルム',dexId:'dialgaorigin'}],
  'パルキア':[{ja:'オリジンフォルム',dexId:'palkiaorigin'}],
  'ギラティナ':[{ja:'オリジンフォルム',dexId:'giratinaorigin'}],
};
let ABIL_EN_JA={};
function whenPkmnDex(){return new Promise(r=>{if(window.PKMN_DEX)return r(window.PKMN_DEX);addEventListener('pkmndex-ready',()=>r(window.PKMN_DEX),{once:true})})}
function whenCalcReady(){return new Promise(r=>{if(CALC.ready)return r();addEventListener('calc-ready',()=>r(),{once:true})})}
function buildSide(inp){
  const G=window.SMOGON, gen=CALC.gen, notes=[];
  let speciesEng=CALC.dict.pokemon[inp.species], baseStats=null, typesOverride=null, abilityEng;
  if(!speciesEng) return {error:'種族不明: '+inp.species};
  const mega=inp.mega&&CALC.overlay.megas[inp.mega];
  if(mega){
    baseStats=mapHK(mega.baseStats);
    typesOverride=(mega.types||[]).map(t=>TYPE_JA_EN[t]).filter(Boolean);
    abilityEng=(mega.abilities&&mega.abilities[0])?CALC.dict.abilities[mega.abilities[0]]:undefined;
    notes.push('メガ: '+inp.mega+(mega.new?'(新)':'')+(mega.abilities&&mega.abilities.length?'':' ※特性未確定'));
  }else if(inp.battleForm&&window.PKMN_DEX){
    const bfs=BATTLE_FORMS[inp.species]||[];
    const formInfo=bfs.find(f=>f.ja===inp.battleForm);
    if(formInfo){const dsp=window.PKMN_DEX.species.get(formInfo.dexId);if(dsp&&dsp.baseStats){baseStats={};SK.forEach(s=>baseStats[s]=dsp.baseStats[s]);}}
    if(!baseStats){const dsp=gen.species.get(G.toID(speciesEng));if(dsp&&dsp.baseStats){baseStats={};SK.forEach(s=>baseStats[s]=dsp.baseStats[s])}}
    abilityEng=inp.ability?(CALC.dict.abilities[inp.ability]||CHAMP_ABIL_ENGINE[inp.ability]):undefined;
  }else{
    const sp=gen.species.get(G.toID(speciesEng));
    if(sp&&sp.baseStats){baseStats={};SK.forEach(s=>baseStats[s]=sp.baseStats[s])}
    abilityEng=inp.ability?(CALC.dict.abilities[inp.ability]||CHAMP_ABIL_ENGINE[inp.ability]):undefined;
  }
  if(!baseStats) return {error:'種族値取得失敗: '+inp.species};
  const finalStats=computeChampStats(baseStats,inp.points,inp.nature);
  const opt={ level:50, nature:'Hardy',
    ivs:{hp:31,atk:31,def:31,spa:31,spd:31,spe:31}, evs:{hp:0,atk:0,def:0,spa:0,spd:0,spe:0},
    item: inp.item?CALC.dict.items[inp.item]:undefined, ability: abilityEng,
    boosts: inp.boosts, overrides:{ baseStats: injBase(finalStats) } };
  if(typesOverride&&typesOverride.length) opt.overrides.types=typesOverride;
  if(inp.teraOn&&inp.tera&&TYPE_JA_EN[inp.tera]) opt.teraType=TYPE_JA_EN[inp.tera];
  return { pokemon:new G.Pokemon(gen,speciesEng,opt), finalStats, notes };
}
function prepMove(moveJa, atk){
  const G=window.SMOGON, gen=CALC.gen, notes=[];
  const eng=CALC.dict.moves[moveJa]; if(!eng) return {error:'技不明: '+moveJa};
  const ov=CALC.overlay.moves[moveJa]||{}, overrides={};
  if(ov.basePower!=null){overrides.basePower=ov.basePower;notes.push('威力変更('+(ov.note||'')+')')}
  if(ov.accuracy!=null) overrides.accuracy=ov.accuracy;
  let move=new G.Move(gen,eng,Object.keys(overrides).length?{overrides}:undefined);
  const origType=move.type; let mult=1;
  const ab=atk.ability&&CALC.overlay.abilities[atk.ability];
  if(ab){
    if(ab.fromType&&ab.toType&&origType===TYPE_JA_EN[ab.fromType]){
      move=new G.Move(gen,eng,{overrides:Object.assign({},overrides,{type:TYPE_JA_EN[ab.toType]})});
      if(ab.mult)mult*=ab.mult;
      notes.push('特性 '+atk.ability+'：'+ab.fromType+'→'+ab.toType+(ab.mult?' ×'+ab.mult:''));
    }else if(ab.type&&ab.mult&&origType===TYPE_JA_EN[ab.type]){
      mult*=ab.mult; notes.push('特性 '+atk.ability+' ×'+ab.mult);
    }
  }
  return {move,mult,notes};
}
function buildField(f, atkAbility){
  const G=window.SMOGON, opt={gameType:f.gameType};
  if(WEATHER_JA_EN[f.weather]) opt.weather=WEATHER_JA_EN[f.weather];
  if(TERRAIN_JA_EN[f.terrain]) opt.terrain=TERRAIN_JA_EN[f.terrain];
  const ab=atkAbility&&CALC.overlay.abilities[atkAbility];
  if(ab&&ab.weather==='sun'&&!opt.weather) opt.weather='Sun';
  const field=new G.Field(opt);
  field.defenderSide=new G.Side({isReflect:f.reflect,isLightScreen:f.lightScreen});
  field.attackerSide=new G.Side({isHelpingHand:f.helpingHand});
  return field;
}
function pct(x,hp){return Math.round(x/hp*1000)/10}
function simpleKO(min,max,hp){
  if(min>=hp)return'確定1発';
  const g=Math.ceil(hp/min), b=Math.ceil(hp/max);
  return g===b?'確定'+g+'発':'乱数'+b+'〜'+g+'発';
}
function getRolls(res,mult){
  let d=res.damage; if(typeof d==='number')d=[d];
  if(Array.isArray(d)&&Array.isArray(d[0]))d=d[0];
  return (d||[]).map(x=>mult!==1?Math.floor(x*mult):x);
}
function hitsToKO(perHit,hp,heal){
  if(perHit<=0)return 99;
  let cur=hp,hits=0,used=false;
  while(cur>0&&hits<20){
    cur-=perHit; hits++;
    if(cur<=0)break;
    if(heal&&!used&&cur<=Math.floor(hp/2)){cur=Math.min(hp,cur+heal);used=true}
  }
  return hits;
}
function berryKO(rolls,hp,heal){
  if(!rolls.length)return'';
  const best=hitsToKO(Math.max(...rolls),hp,heal), worst=hitsToKO(Math.min(...rolls),hp,heal);
  return best===worst?'確定'+best+'発':best+'〜'+worst+'発';
}
function koResidualNote(res,defHP,dItem,mult){
  const out=[];
  if(mult===1){
    let ko=null; try{ko=res.kochance()}catch(e){}
    if(ko&&ko.n&&/recovery|residual/i.test(ko.text||''))
      out.push('残飯/残留込み '+(ko.chance>=1?'確定'+ko.n+'発':ko.n+'発'+(ko.chance*100).toFixed(1)+'%'));
  }
  if(dItem==='オボンのみ'||dItem==='オレンのみ'){
    const heal=dItem==='オボンのみ'?Math.floor(defHP/4):10;
    const n=berryKO(getRolls(res,mult),defHP,heal);
    if(n)out.push((dItem==='オボンのみ'?'オボン':'オレン')+'込み '+n);
  }
  return out.join(' / ');
}
function calcOnce(a,d,moveJa,f){
  const G=window.SMOGON;
  const A=buildSide(a); if(A.error)return{error:A.error};
  const D=buildSide(d); if(D.error)return{error:D.error};
  const pm=prepMove(moveJa,a); if(pm.error)return{error:pm.error};
  if(f.crit)pm.move.isCrit=true;
  if(f.halfBerry&&!D.pokemon.item){const rb=RESIST_BERRY[pm.move.type];if(rb){D.pokemon.item=rb;D.notes.push('半減実: '+rb);}}
  const field=buildField(f,a.ability);
  let res; try{res=G.calculate(CALC.gen,A.pokemon,D.pokemon,pm.move,field)}catch(e){return{error:'計算失敗: '+e.message}}
  let [min,max]=res.range(); const defHP=D.finalStats.hp;
  let engineDesc=''; try{engineDesc=res.desc()}catch(e){}
  const mult=pm.mult||1;
  if(mult!==1){min=Math.floor(min*mult);max=Math.floor(max*mult)}
  const koText=max<=0?'効果なし':simpleKO(min,max,defHP);
  const koNote=max<=0?'':koResidualNote(res,defHP,d.item,mult);
  return {ok:true,moveJa,minDmg:min,maxDmg:max,defHP,minPct:pct(min,defHP),maxPct:pct(max,defHP),koText,koNote,engineDesc,notes:[...A.notes,...D.notes,...pm.notes]};
}

function cval(id){const e=document.getElementById(id);return e?e.value:''}
function cchk(id){const e=document.getElementById(id);return e?e.checked:false}
function clampInt(v,lo,hi){v=parseInt(v);if(isNaN(v))return lo;return Math.max(lo,Math.min(hi,v))}
function sideCardHtml(pre,label,withMoves){
  return `<div class="ct">${label}</div>
  <div class="brow" style="align-items:center;margin-bottom:6px">
    <button class="btn" id="${pre}-poke-btn" data-role="${pre}-poke" style="flex:1;justify-content:center">＋ ポケモン選択</button>
    <button class="btn" id="${pre}-party-btn" data-role="${pre}-party">パーティから</button>
  </div>
  <div id="${pre}-mega-row" class="brow" style="display:none;gap:8px;flex-wrap:wrap;margin-bottom:6px"></div>
  <div id="${pre}-bf-row" class="brow" style="display:none;gap:8px;flex-wrap:wrap;margin-bottom:6px"></div>
  <div class="cpts">
    ${HK.map(k=>`<label class="cpt"><span>${k}</span><span id="${pre}-sv-${k}" class="bm-sv">-</span><input type="number" min="0" max="32" value="0" id="${pre}-pt-${k}" class="cnum"></label>`).join('')}
    <button class="btn" id="${pre}-pts-max" style="align-self:flex-end;padding:5px 11px">ぶっぱ</button>
    <span class="ctot" id="${pre}-pts-tot">合計 0/66</span>
  </div>
  <div class="cranks">
    ${HK.map((k,i)=>k==='H'?`<span style="width:42px;flex:none"></span>`:`<select id="${pre}-rk-${SK[i]}" class="crksel"></select>`).join('')}
  </div>
  <div class="cgrid2">
    <label class="cf"><span class="slbl">性格</span><select id="${pre}-nature" class="cinput"></select></label>
    <label class="cf"><span class="slbl">テラスタル</span><span style="display:flex;gap:5px;align-items:center"><select id="${pre}-tera" class="cinput"></select><input type="checkbox" id="${pre}-tera-on" title="テラス有効"></span></label>
    <label class="cf"><span class="slbl">とくせい</span><input list="dl-ability-${pre}" id="${pre}-ability" class="cinput" autocomplete="off"></label>
    <label class="cf" style="position:relative"><span class="slbl">もちもの</span><div class="item-picker"><img class="item-icon" id="${pre}-item-icon" style="display:none"><input id="${pre}-item" class="cinput" autocomplete="off" oninput="openItemDD('${pre}')" onfocus="openItemDD('${pre}')" onblur="setTimeout(()=>closeItemDD('${pre}'),200)"><div class="item-dd" id="${pre}-item-dd"></div></div></label>
  </div>
  ${withMoves?`<div class="cmoves"><span class="slbl">技（最大4・複数まとめて計算）</span>${[0,1,2,3].map(i=>`<input list="dl-move" id="${pre}-move-${i}" class="cinput" placeholder="技${i+1}" autocomplete="off">`).join('')}</div>`:''}`;
}
function buildCalcUI(){
  document.getElementById('calc-atk').innerHTML=sideCardHtml('atk','攻撃側',true);
  document.getElementById('calc-def').innerHTML=sideCardHtml('def','防御側',true);
  document.getElementById('atk-poke-btn').onclick=()=>pickCalcPoke('atk');
  document.getElementById('def-poke-btn').onclick=()=>pickCalcPoke('def');
  document.getElementById('atk-party-btn').onclick=()=>pickFromParty('atk');
  document.getElementById('def-party-btn').onclick=()=>pickFromParty('def');
  document.getElementById('atk-pts-max').onclick=()=>setBuppa('atk');
  document.getElementById('def-pts-max').onclick=()=>setBuppa('def');
  ['atk','def'].forEach(pre=>{
    document.getElementById(pre+'-mega-row').addEventListener('click',e=>{
      const b=e.target.closest('.btn[data-mega]'); if(!b)return;
      calcState[pre].mega=b.dataset.mega; calcState[pre].battleForm='';
      document.getElementById(pre+'-mega-row').querySelectorAll('.btn[data-mega]').forEach(btn=>btn.classList.toggle('s',btn.dataset.mega===b.dataset.mega));
      const bfRow=document.getElementById(pre+'-bf-row');
      if(bfRow) bfRow.querySelectorAll('.btn[data-bf]').forEach(btn=>btn.classList.toggle('s',btn.dataset.bf===''));
      fillAbilityDL(pre); recalc();
    });
    document.getElementById(pre+'-bf-row').addEventListener('click',e=>{
      const b=e.target.closest('.btn[data-bf]'); if(!b)return;
      calcState[pre].battleForm=b.dataset.bf; calcState[pre].mega='';
      document.getElementById(pre+'-bf-row').querySelectorAll('.btn[data-bf]').forEach(btn=>btn.classList.toggle('s',btn.dataset.bf===b.dataset.bf));
      const megaRow=document.getElementById(pre+'-mega-row');
      if(megaRow) megaRow.querySelectorAll('.btn[data-mega]').forEach(btn=>btn.classList.toggle('s',btn.dataset.mega===''));
      fillAbilityDL(pre); recalc();
    });
  });
  const page=document.getElementById('page-calc');
  page.addEventListener('input',e=>{ if(e.target.classList.contains('cnum'))updateTot(e.target.id.slice(0,3)); recalc(); });
  page.addEventListener('change',recalc);
}
function esc(s){return String(s||'').replace(/"/g,'&quot;')}
function natureOptionsHtml(sel){return Object.keys(CALC.dict.natures).map(n=>`<option${n===(sel||'まじめ')?' selected':''}>${n}</option>`).join('')}
function teraOptionsHtml(sel){return '<option value="">なし</option>'+Object.keys(TYPE_JA_EN).map(t=>`<option${t===sel?' selected':''}>${t}</option>`).join('')}
function fillDatalists(){
  const fillDL=(id,keys)=>{const e=document.getElementById(id);if(e)e.innerHTML=keys.map(k=>`<option value="${esc(k)}"></option>`).join('')};
  fillDL('dl-ability',[...new Set([...Object.keys(CALC.dict.abilities),...Object.keys(CALC.overlay.abilities)])].sort());
  const BALL_KEEP = new Set(['Light Ball','Iron Ball']);
  const EVO_STONES = new Set(['Sun Stone','Moon Stone','Fire Stone','Thunder Stone','Water Stone','Leaf Stone','Shiny Stone','Dusk Stone','Dawn Stone','Ice Stone','Oval Stone']);
  const HP_BERRIES = new Set(['Sitrus Berry','Figy Berry','Wiki Berry','Mago Berry','Aguav Berry','Iapapa Berry']);
  const ITEM_EXCLUDE_EXACT = new Set(['Rare Bone','Berry Juice','Old Amber','Reaper Cloth','Electirizer','Magmarizer','Protector','Big Nugget','Dubious Disc','Whipped Dream','Sachet','Galarica Wreath','Galarica Cuff','Up-Grade','Auspicious Armor','Malicious Armor','Prism Scale','Deep Sea Scale','Deep Sea Tooth']);
  const battleItems = Object.entries(CALC.dict.items)
    .filter(([,en])=>{
      if(/Ball$/.test(en)&&!BALL_KEEP.has(en))return false;
      if(EVO_STONES.has(en))return false;
      if(/Fossil$|^Fossilized /.test(en))return false;
      if(/^TR\d+$/.test(en))return false;
      if(/Apple$/.test(en))return false;
      if(en.endsWith('Berry')&&!HP_BERRIES.has(en))return false;
      if(ITEM_EXCLUDE_EXACT.has(en))return false;
      return true;
    })
    .map(([ja])=>ja);
  BATTLE_ITEMS=battleItems;
  fillDL('dl-item',battleItems);
  fillDL('dl-move',[...new Set([...Object.keys(CALC.dict.moves),...Object.keys(CALC.overlay.moves)])]);
}
function fillAbilityDL(pre){
  const el=document.getElementById('dl-ability-'+pre); if(!el)return;
  const sp=calcState[pre].species, mg=calcState[pre].mega;
  if(!sp){el.innerHTML='';return;}
  const jaNames=[];
  if(mg&&CALC.overlay&&CALC.overlay.megas[mg]){
    (CALC.overlay.megas[mg].abilities||[]).forEach(a=>{if(a)jaNames.push(a);});
  }else if(window.PKMN_DEX&&CALC.dict){
    const en=CALC.dict.pokemon[sp];
    if(en){
      const dexSp=window.PKMN_DEX.species.get(en);
      if(dexSp&&dexSp.abilities){
        for(const k of['0','1','H']){
          const eng=dexSp.abilities[k]; if(!eng)continue;
          const ja=ABIL_EN_JA[eng]; if(ja)jaNames.push(ja);
        }
      }
    }
  }
  el.innerHTML=jaNames.map(k=>`<option value="${esc(k)}"></option>`).join('');
}
function populateCalcLists(){
  const rankOpts=[6,5,4,3,2,1,0,-1,-2,-3,-4,-5,-6].map(n=>`<option value="${n}"${n===0?' selected':''}>${n>0?'+'+n:n}</option>`).join('');
  ['atk','def'].forEach(pre=>{
    const nat=document.getElementById(pre+'-nature');if(nat)nat.innerHTML=natureOptionsHtml('まじめ');
    const ter=document.getElementById(pre+'-tera');if(ter)ter.innerHTML=teraOptionsHtml('');
    ['atk','def','spa','spd','spe'].forEach(s=>{const e=document.getElementById(`${pre}-rk-${s}`);if(e)e.innerHTML=rankOpts});
  });
  fillDatalists();
}
function setBuppa(pre){
  const v=pre==='atk'?{H:2,A:32,B:0,C:0,D:0,S:32}:{H:2,A:0,B:32,C:0,D:32,S:0};
  HK.forEach(k=>document.getElementById(`${pre}-pt-${k}`).value=v[k]);
  updateTot(pre); recalc();
}
function updateTot(pre){
  let t=0; HK.forEach(k=>t+=clampInt(cval(`${pre}-pt-${k}`),0,32));
  const el=document.getElementById(pre+'-pts-tot'); el.textContent='合計 '+t+'/66'; el.classList.toggle('over',t>66);
}
function pickCalcPoke(pre){
  openModal((pre==='atk'?'攻撃':'防御')+'側のポケモン',name=>{
    calcState[pre].species=name; calcState[pre].mega=''; calcState[pre].battleForm='';
    updateCalcPokeBtn(pre); updateFormRows(pre); fillAbilityDL(pre); recalc();
  });
}
function updateCalcPokeBtn(pre){
  const sp=calcState[pre].species, btn=document.getElementById(pre+'-poke-btn');
  if(!sp){btn.innerHTML='＋ ポケモン選択';return}
  const r=getPoke(sp)||{};
  btn.innerHTML=`<img src="${r[4]||''}" style="width:24px;height:24px;object-fit:contain;image-rendering:pixelated;vertical-align:middle" onerror="this.style.display='none'"> ${r[1]||sp}`;
}
function stripMega(m){return m.replace(/^(メガ|ゲンシ)/,'').replace(/[XYZ]$/,'')}
function updateFormRows(pre){
  const sp=calcState[pre].species;
  const megaRow=document.getElementById(pre+'-mega-row');
  if(megaRow){
    const opts=sp&&CALC.overlay?Object.keys(CALC.overlay.megas).filter(m=>stripMega(m)===sp):[];
    if(!opts.length){megaRow.style.display='none';megaRow.innerHTML='';calcState[pre].mega='';}
    else{megaRow.style.display='flex';megaRow.innerHTML=`<button class="btn s" data-mega="">通常</button>`+opts.map(m=>`<button class="btn" data-mega="${esc(m)}">${m}</button>`).join('');}
  }
  const bfRow=document.getElementById(pre+'-bf-row');
  if(bfRow){
    const bfs=sp?(BATTLE_FORMS[sp]||[]):[];
    if(!bfs.length){bfRow.style.display='none';bfRow.innerHTML='';calcState[pre].battleForm='';}
    else{bfRow.style.display='flex';bfRow.innerHTML=`<button class="btn s" data-bf="">通常</button>`+bfs.map(f=>`<button class="btn" data-bf="${esc(f.ja)}">${f.ja}</button>`).join('');}
  }
}
function readSide(pre){
  const pts={}; HK.forEach(k=>pts[k]=clampInt(cval(`${pre}-pt-${k}`),0,32));
  const boosts={}; ['atk','def','spa','spd','spe'].forEach(s=>boosts[s]=parseInt(cval(`${pre}-rk-${s}`))||0);
  return {species:calcState[pre].species,mega:calcState[pre].mega,battleForm:calcState[pre].battleForm,points:pts,nature:cval(`${pre}-nature`),
    ability:cval(`${pre}-ability`).trim(),item:cval(`${pre}-item`).trim(),
    tera:cval(`${pre}-tera`),teraOn:cchk(`${pre}-tera-on`),boosts};
}
function readField(){return {gameType:cval('cf-gametype'),weather:cval('cf-weather'),terrain:cval('cf-terrain'),
  reflect:cchk('cf-reflect'),lightScreen:cchk('cf-lightscreen'),helpingHand:cchk('cf-hh'),crit:cchk('cf-crit'),halfBerry:cchk('cf-half-berry')}}
function resCardHtml(r,mj,critR){
  if(r.error)return `<div class="cres err">${mj}: ${r.error}</div>`;
  const col=r.maxPct>=100?'var(--win)':r.minPct>=50?'var(--accent)':'var(--text)';
  const solidPct=Math.min(100,r.minPct);
  const bandLeft=solidPct;
  const bandWidth=Math.min(100-bandLeft,r.maxPct-r.minPct);
  const maxLabelLeft=Math.min(98,r.maxPct);
  const minLabelLeft=Math.max(3,Math.min(solidPct,maxLabelLeft-12));
  const markers=[];
  for(const[pct,label]of[[100,'確1'],[50,'確2'],[33,'確3'],[25,'確4']]){
    if(r.maxPct>=pct){markers.push({left:Math.min(99,pct),label,sure:r.minPct>=pct});if(r.minPct>=pct)break;}
  }
  const dmgRange=r.minDmg===r.maxDmg?`${r.minDmg}`:`${r.minDmg}〜${r.maxDmg}`;
  const pctRange=r.minPct===r.maxPct?`${r.minPct}%`:`${r.minPct}〜${r.maxPct}%`;
  let critHtml='';
  if(critR&&!critR.error){
    const cd=critR.minDmg===critR.maxDmg?`${critR.minDmg}`:`${critR.minDmg}〜${critR.maxDmg}`;
    const cp=critR.minPct===critR.maxPct?`${critR.minPct}%`:`${critR.minPct}〜${critR.maxPct}%`;
    critHtml=`<div class="cres-row" style="margin-top:4px"><span class="cres-lbl">急所</span><span class="cres-val" style="font-size:13px">${cd}</span><span class="cres-pct" style="color:#ff7a6b">${cp}</span><span style="margin-left:auto;font-size:11px;font-weight:700;color:var(--text-2)">${critR.koText}</span></div>`;
  }
  return `<div class="cres">
    <div class="cres-head"><span class="cres-mv">${mj}</span><span class="cres-ko-badge" style="color:${col}">${r.koText}</span></div>
    <div class="cres-labels"><span class="cres-minlbl" style="left:${minLabelLeft}%">最小</span><span class="cres-maxlbl" style="left:${maxLabelLeft}%">最大</span></div>
    <div class="cres-bar">
      <div class="cres-fill bar-fill" style="width:${solidPct}%"></div>
      <div class="cres-band" style="left:${bandLeft}%;width:${bandWidth}%"></div>
      <div class="cres-tick" style="left:25%"></div><div class="cres-tick" style="left:50%"></div><div class="cres-tick" style="left:75%"></div>
    </div>
    <div class="cres-markers">${markers.map(m=>`<span class="cres-marker${m.sure?' sure':''}" style="left:${m.left}%">${m.label}</span>`).join('')}</div>
    <div class="cres-row"><span class="cres-lbl">ダメージ</span><span class="cres-val">${dmgRange}</span><span class="cres-pct" style="color:${col}">${pctRange}</span><span style="margin-left:auto;font-size:10px;color:var(--text-3)">HP ${r.defHP}</span></div>
    ${critHtml}
    ${r.koNote?`<div class="cres-note">${r.koNote}</div>`:''}
    ${r.notes.length?`<div class="cres-note">${r.notes.join(' / ')}</div>`:''}
  </div>`;
}
function dirSection(att,def,moves,f){
  if(!moves.length)return '';
  const an=(getPoke(att.species)||[])[1]||att.species, dn=(getPoke(def.species)||[])[1]||def.species;
  let h=`<div class="cdir">${an} <span style="opacity:.55">→</span> ${dn}</div>`;
  moves.forEach(mj=>{
    const r=calcOnce(att,def,mj,f);
    const critR=(!r.error&&!f.crit)?calcOnce(att,def,mj,{...f,crit:true}):null;
    h+=resCardHtml(r,mj,critR);
  });
  return h;
}
function updateCalcStats(pre){
  if(!CALC.ready||!calcState[pre].species)return;
  const A=buildSide(readSide(pre)); if(A.error||!A.finalStats)return;
  HK.forEach((k,i)=>{const el=document.getElementById(pre+'-sv-'+k);if(el)el.textContent=A.finalStats[SK[i]]??'-';});
}
function recalc(){
  ['atk','def'].forEach(pre=>updateCalcStats(pre));
  const el=document.getElementById('calc-result'); if(!el)return;
  if(!CALC.ready){el.innerHTML='<div class="empty">計算エンジンを読み込み中...</div>';return}
  const a=readSide('atk'), d=readSide('def'), f=readField();
  if(!a.species||!d.species){el.innerHTML='<div class="empty">攻撃側・防御側のポケモンを選択してください</div>';return}
  const am=[0,1,2,3].map(i=>cval('atk-move-'+i).trim()).filter(Boolean);
  const dm=[0,1,2,3].map(i=>cval('def-move-'+i).trim()).filter(Boolean);
  if(!am.length&&!dm.length){el.innerHTML='<div class="empty">どちらかのポケモンの技を入力してください</div>';return}
  el.innerHTML=dirSection(a,d,am,f)+dirSection(d,a,dm,f);
}
async function loadCalcDicts(){
  if(CALC.dict)return;
  console.log('[calc] loading dicts/overlay');
  const jf=n=>fetch('./data/'+n+'.json?v='+Date.now()).then(r=>{if(!r.ok)throw new Error(n+' HTTP '+r.status);return r.json()});
  const [pk,mv,ab,it,na,ov]=await Promise.all([jf('dict_pokemon'),jf('dict_moves'),jf('dict_abilities'),jf('dict_items'),jf('dict_natures'),jf('champions_overlay')]);
  CALC.dict={pokemon:pk.map,moves:mv.map,abilities:ab.map,items:it.map,natures:na.map};
  CALC.overlay=ov;
  fillDatalists();
  console.log('[calc] dicts ready: pokemon',Object.keys(pk.map).length,'moves',Object.keys(mv.map).length,'megas',Object.keys(ov.megas).length);
}
async function initCalc(){
  if(CALC.ready||CALC.loading)return;
  CALC.loading=true;
  console.log('[calc] init: waiting for engine + dicts');
  try{
    const G=await whenSmogon();
    await Promise.all([loadCalcDicts(), whenPkmnDex()]);
    CALC.gen=G.Generations.get(9); CALC.ready=true; window.dispatchEvent(new Event('calc-ready'));
    for(const ja in CALC.dict.abilities){ ABIL_EN_JA[CALC.dict.abilities[ja]]=ja; }
    console.log('[calc] ABIL_EN_JA built:', Object.keys(ABIL_EN_JA).length);
    populateCalcLists();
    recalc();
  }catch(e){
    console.error('[calc] init failed',e);
    const el=document.getElementById('calc-result');
    if(el)el.innerHTML='<div class="cres err">計算エンジン／辞書の読み込みに失敗しました。オンライン環境で再読み込みしてください（'+e.message+'）</div>';
  }finally{CALC.loading=false}
}
function openCalc(){
  if(!CALC.built){buildCalcUI();CALC.built=true}
  initCalc();
}
