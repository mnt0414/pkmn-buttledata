let ppPre=null;
function pickFromParty(pre){
  ppPre=pre;
  const body=document.getElementById('pp-body');
  const rows=[];
  (S.parties||[]).forEach(p=>(p.pokemon||[]).forEach(x=>{ if(pname(x))rows.push({party:p.name,it:pbuild(x)}); }));
  document.getElementById('pp-title').textContent=(pre==='atk'?'攻撃':'防御')+'側 — パーティから選ぶ';
  if(!rows.length){ body.innerHTML='<div class="mloading">パーティにポケモンが登録されていません</div>'; }
  else{
    body.innerHTML='';
    rows.forEach(({party,it})=>{
      const r=getPoke(it.name)||{};
      const div=document.createElement('div');
      div.className='mitem';
      const badge=hasBuild(it)?'<span style="color:var(--accent2);font-size:9px">● 育成済</span>':'<span style="color:var(--text3);font-size:9px">未設定→ぶっぱ</span>';
      div.innerHTML=`<img src="${r[4]||''}" onerror="this.style.opacity=0" loading="lazy">
        <div class="mitem-info">
          <div class="mitem-name">${r[1]||it.name} ${badge}</div>
          <div class="mitem-types" style="color:var(--text3);font-size:9px">${esc(party)}</div>
        </div>`;
      div.onclick=()=>{ const it2=it; applyBuildToSide(ppPre,it2); closePartyPick(); };
      body.appendChild(div);
    });
  }
  document.getElementById('party-pick-modal').style.display='flex';
}
function closePartyPick(){ document.getElementById('party-pick-modal').style.display='none'; ppPre=null; }
async function applyBuildToSide(pre,it){
  try{ await loadCalcDicts(); }catch(e){ alert('辞書の読み込みに失敗しました（'+e.message+'）'); return; }
  if(!document.getElementById(pre+'-nature').options.length)populateCalcLists();
  calcState[pre].species=it.name; calcState[pre].mega=''; calcState[pre].battleForm='';
  updateCalcPokeBtn(pre); updateFormRows(pre); fillAbilityDL(pre);
  const buppa=pre==='atk'?{H:2,A:32,B:0,C:0,D:0,S:32}:{H:2,A:0,B:32,C:0,D:32,S:0};
  const hasPts=it.points&&HK.some(k=>(it.points[k]||0)>0);
  const pts=hasPts?it.points:buppa;
  HK.forEach(k=>{const e=document.getElementById(`${pre}-pt-${k}`);if(e)e.value=clampInt(pts[k],0,32)});
  const setV=(id,v)=>{const e=document.getElementById(id);if(e)e.value=v};
  setV(`${pre}-nature`,it.nature||'まじめ');
  setV(`${pre}-ability`,it.ability||'');
  setV(`${pre}-item`,it.item||'');
  setV(`${pre}-tera`,it.tera||'');
  const teraOn=document.getElementById(`${pre}-tera-on`); if(teraOn)teraOn.checked=false;
  {const mv=it.moves||[];[0,1,2,3].forEach(j=>setV(pre+'-move-'+j,mv[j]||''))}
  console.log('[calc] party→'+pre+': '+it.name+(hasPts?' 育成データ':' ぶっぱ既定'));
  updateTot(pre); updateItemIcon(pre); recalc();
}

let bmIdx=-1, bmSpecies='', bmMega='', bmBattleForm='';
function getBmMegas(){
  if(!CALC.overlay||!bmSpecies)return[];
  return Object.keys(CALC.overlay.megas).filter(m=>stripMega(m)===bmSpecies);
}
function getBmBattleForms(){
  return BATTLE_FORMS[bmSpecies]||[];
}
function setBmMega(mega){
  bmMega=mega; bmBattleForm='';
  const row=document.getElementById('bm-mega-row'); if(!row)return;
  row.querySelectorAll('.btn[data-mega]').forEach(b=>b.classList.toggle('s',b.dataset.mega===mega));
  updateBmStats();
}
function setBmBattleForm(form){
  bmBattleForm=form; bmMega='';
  const megaRow=document.getElementById('bm-mega-row');
  if(megaRow) megaRow.querySelectorAll('.btn[data-mega]').forEach(b=>b.classList.toggle('s',b.dataset.mega===''));
  const bfRow=document.getElementById('bm-bf-row'); if(!bfRow)return;
  bfRow.querySelectorAll('.btn[data-bf]').forEach(b=>b.classList.toggle('s',b.dataset.bf===form));
  updateBmStats();
}
async function openBuildEditor(i){
  const p=getAP(), it=pbuild(p.pokemon[i]);
  if(!it||!it.name)return;
  bmIdx=i; bmSpecies=it.name;
  const r=getPoke(it.name)||{};
  document.getElementById('bm-title').textContent=`育成データ — ${r[1]||it.name}`;
  const body=document.getElementById('bm-body');
  body.innerHTML='<div class="mloading">辞書を読み込み中...</div>';
  document.getElementById('build-modal').style.display='flex';
  try{ initCalc(); await whenCalcReady(); renderBuildForm(it); }
  catch(e){ body.innerHTML='<div class="cres err">辞書の読み込みに失敗しました（'+e.message+'）</div>'; }
}
function renderBuildForm(it){
  bmMega=''; bmBattleForm='';
  const pts=it.points||{H:0,A:0,B:0,C:0,D:0,S:0}, moves=it.moves||['','','',''];
  const megas=getBmMegas();
  const megaRowHtml=megas.length?`
    <div id="bm-mega-row" class="brow" style="gap:6px;flex-wrap:wrap;margin-bottom:6px">
      <button class="btn s" data-mega="">通常</button>
      ${megas.map(m=>`<button class="btn" data-mega="${esc(m)}">${m}</button>`).join('')}
    </div>`:'';
  const bfs=getBmBattleForms();
  const bfRowHtml=bfs.length?`
    <div id="bm-bf-row" class="brow" style="gap:6px;flex-wrap:wrap;margin-bottom:6px">
      <button class="btn s" data-bf="">通常</button>
      ${bfs.map(f=>`<button class="btn" data-bf="${esc(f.ja)}">${f.ja}</button>`).join('')}
    </div>`:'';
  const body=document.getElementById('bm-body');
  body.innerHTML=`
    <div class="brow" style="margin-bottom:10px">
      <button class="btn" id="bm-change" style="font-size:11px">ポケモンを変更</button>
    </div>
    ${megaRowHtml}
    ${bfRowHtml}
    <div class="cpts">
      ${HK.map(k=>`<label class="cpt"><span>${k}</span><span id="bm-sv-${k}" class="bm-sv">-</span><input type="number" min="0" max="32" value="${clampInt(pts[k],0,32)}" id="bm-pt-${k}" class="cnum"></label>`).join('')}
      <button class="btn" id="bm-buppa" style="align-self:flex-end;padding:4px 9px;font-size:13px">ぶっぱ</button>
      <span class="ctot" id="bm-tot">合計 0/66</span>
    </div>
    <div class="cgrid2">
      <label class="cf"><span class="slbl">性格</span><select id="bm-nature" class="cinput">${natureOptionsHtml(it.nature)}</select></label>
      <label class="cf"><span class="slbl">テラスタル</span><select id="bm-tera" class="cinput">${teraOptionsHtml(it.tera||'')}</select></label>
      <label class="cf"><span class="slbl">とくせい</span><input list="dl-ability" id="bm-ability" class="cinput" autocomplete="off" value="${esc(it.ability)}"></label>
      <label class="cf"><span class="slbl">もちもの</span><input list="dl-item" id="bm-item" class="cinput" autocomplete="off" value="${esc(it.item)}"></label>
    </div>
    <div class="cmoves"><span class="slbl">技（最大4）</span>${[0,1,2,3].map(j=>`<input list="dl-move" id="bm-move-${j}" class="cinput" placeholder="技${j+1}" autocomplete="off" value="${esc(moves[j])}">`).join('')}</div>`;
  document.getElementById('bm-change').onclick=()=>{
    const idx=bmIdx; closeBuildEditor();
    openModal('ポケモンを変更',name=>{
      const p=getAP();
      if(p.pokemon.some((x,j)=>j!==idx&&pname(x)===name)){alert((getPoke(name)?.[1]||name)+'はすでに登録されています');return}
      p.pokemon[idx]={name}; save(); renderPartySlots(); renderBattleMyParty();
    });
  };
  document.getElementById('bm-buppa').onclick=()=>{ const v={H:2,A:32,B:0,C:0,D:0,S:32}; HK.forEach(k=>document.getElementById('bm-pt-'+k).value=v[k]); updateBmTot(); updateBmStats(); };
  const megaRow=document.getElementById('bm-mega-row');
  if(megaRow) megaRow.addEventListener('click',e=>{ const b=e.target.closest('.btn[data-mega]'); if(b)setBmMega(b.dataset.mega); });
  const bfRow=document.getElementById('bm-bf-row');
  if(bfRow) bfRow.addEventListener('click',e=>{ const b=e.target.closest('.btn[data-bf]'); if(b)setBmBattleForm(b.dataset.bf); });
  if(!renderBuildForm._wired){
    const bd=document.getElementById('bm-body');
    bd.addEventListener('input',e=>{ if(e.target.classList.contains('cnum')){updateBmTot();updateBmStats();} });
    bd.addEventListener('change',e=>{ if(e.target.id==='bm-nature')updateBmStats(); });
    renderBuildForm._wired=true;
  }
  updateBmTot(); updateBmStats();
}
function updateBmStats(){
  if(!CALC.ready||!bmSpecies)return;
  let base;
  if(bmMega&&CALC.overlay&&CALC.overlay.megas[bmMega]){
    base=mapHK(CALC.overlay.megas[bmMega].baseStats);
  }else if(bmBattleForm&&window.PKMN_DEX){
    const bfs=BATTLE_FORMS[bmSpecies]||[];
    const formInfo=bfs.find(f=>f.ja===bmBattleForm);
    if(formInfo){
      const sp=window.PKMN_DEX.species.get(formInfo.dexId);
      if(sp&&sp.baseStats){base={}; SK.forEach(s=>base[s]=sp.baseStats[s]);}
    }
  }
  if(!base){
    const en=CALC.dict.pokemon[bmSpecies]; if(!en)return;
    const sp=CALC.gen.species.get(window.SMOGON.toID(en)); if(!sp||!sp.baseStats)return;
    base={}; SK.forEach(s=>base[s]=sp.baseStats[s]);
  }
  const pts={}; HK.forEach(k=>pts[k]=clampInt(cval('bm-pt-'+k),0,32));
  const stats=computeChampStats(base,pts,cval('bm-nature'));
  HK.forEach((k,i)=>{ const el=document.getElementById('bm-sv-'+k); if(el)el.textContent=stats[SK[i]]??'-'; });
}
function updateBmTot(){
  let t=0; HK.forEach(k=>t+=clampInt(cval('bm-pt-'+k),0,32));
  const el=document.getElementById('bm-tot'); if(!el)return;
  el.textContent='合計 '+t+'/66'; el.classList.toggle('over',t>66);
}
function saveBuild(){
  if(bmIdx<0)return;
  const p=getAP();
  const pts={}; HK.forEach(k=>pts[k]=clampInt(cval('bm-pt-'+k),0,32));
  const tot=HK.reduce((s,k)=>s+pts[k],0);
  if(tot>66&&!confirm('能力ポイント合計が66を超えています（'+tot+'）。このまま保存しますか？'))return;
  const moves=[0,1,2,3].map(j=>cval('bm-move-'+j).trim());
  p.pokemon[bmIdx]={name:bmSpecies,points:pts,nature:cval('bm-nature'),
    ability:cval('bm-ability').trim(),item:cval('bm-item').trim(),tera:cval('bm-tera'),moves};
  console.log('[party] saved build slot '+bmIdx+': '+bmSpecies+' pts='+tot);
  save(); renderPartySlots(); renderBattleMyParty(); closeBuildEditor();
}
function closeBuildEditor(){ document.getElementById('build-modal').style.display='none'; bmIdx=-1; }
