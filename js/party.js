function renderPTabs(){
  const el=document.getElementById('ptab-list');
  el.innerHTML='';
  S.parties.forEach(p=>{
    const b=document.createElement('button');
    b.className='ptab'+(p.id===S.activeParty?' active':'');
    b.textContent=p.name;
    b.ondblclick=()=>{const n=prompt('パーティ名',p.name);if(n){p.name=n;save();renderPTabs();renderPartySlots()}};
    b.onclick=()=>{S.activeParty=p.id;save();renderPTabs();renderPartySlots();renderBattleMyParty()};
    el.appendChild(b);
  });
}

function _ballSvg(color='#37414e'){
  return `<svg width="34" height="34" viewBox="0 0 100 100" fill="none">
    <circle cx="50" cy="50" r="33" stroke="${color}" stroke-width="3" opacity=".6"/>
    <path d="M17 50h66" stroke="${color}" stroke-width="3" opacity=".6"/>
    <circle cx="50" cy="50" r="10" fill="#11151c" stroke="${color}" stroke-width="3"/>
  </svg>`;
}

function renderPartySlots(){
  const p=getAP();
  const title=document.getElementById('party-edit-title');
  if(title) title.textContent=p.name+' を編集';
  const el=document.getElementById('party-slots');
  el.innerHTML='';
  for(let i=0;i<6;i++){
    const it=p.pokemon[i];
    const en=pname(it);
    const btn=document.createElement('button');
    btn.className='slot-btn';
    const numSpan=`<span class="slot-num num">${String(i+1).padStart(2,'0')}</span>`;
    if(en){
      const r=getPoke(en)||{};
      const jaName=r[1]||en;
      btn.innerHTML=numSpan+
        `<span class="slot-ball" style="background:transparent;">${spriteImg(en,44)}</span>`+
        `<span class="slot-name">${jaName}</span>`+
        `<span class="slot-types">${typeHtml(r[3])}</span>`+
        `<button class="rx" style="position:absolute;top:4px;right:6px;background:none;border:none;color:var(--text-3);font-size:14px;cursor:pointer;line-height:1;padding:2px 4px;" onclick="rmParty(event,${i})">×</button>`+
        (hasBuild(it)?'<span class="slot-build-dot" title="育成データあり"></span>':'');
      btn.onclick=(e)=>{if(e.target.closest('.rx'))return;openBuildEditor(i)};
    }else{
      btn.innerHTML=numSpan+
        `<span class="slot-empty-plus">＋</span>`+
        `<span class="slot-empty-label">追加</span>`;
      btn.onclick=()=>openModal(`スロット${i+1}`,n=>setPartySlot(i,n));
    }
    el.appendChild(btn);
  }
}

function setPartySlot(i,en){
  const p=getAP();
  if(p.pokemon.some(x=>pname(x)===en)){alert(`${getPoke(en)?.[1]||en}はすでに登録されています`);return}
  p.pokemon[i]={name:en};
  while(p.pokemon.length>0&&!p.pokemon[p.pokemon.length-1])p.pokemon.pop();
  save();renderPartySlots();renderBattleMyParty();
}
function rmParty(e,i){
  e.stopPropagation();const p=getAP();p.pokemon.splice(i,1);save();renderPartySlots();renderBattleMyParty();
}
function addParty(){
  const n=prompt('新しいパーティ名',`パーティ${S.parties.length+1}`);if(!n)return;
  const id='p'+Date.now();S.parties.push({id,name:n,pokemon:[]});S.activeParty=id;save();renderPTabs();renderPartySlots();
}
function delParty(){
  if(S.parties.length<=1){alert('最後のパーティは削除できません');return}
  if(!confirm(`「${getAP().name}」を削除しますか？（対戦データも削除）`))return;
  S.battles=S.battles.filter(b=>b.partyId!==S.activeParty);
  S.parties=S.parties.filter(p=>p.id!==S.activeParty);
  S.activeParty=S.parties[0].id;save();renderPTabs();renderPartySlots();
}
window.addEventListener('engnames-ready',()=>{ renderPartySlots(); renderBattleMyParty(); });
