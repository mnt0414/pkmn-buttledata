function loadSet(){
  const u=getGasUrl();
  document.getElementById('gas-url').value=u;
  updateNBar();
}
function saveSet(){
  const u=document.getElementById('gas-url').value.trim();
  u?localStorage.setItem('gas_url',u):localStorage.removeItem('gas_url');
  save();updateNBar();
}
function updateNBar(){
  const el=document.getElementById('nbar');
  if(getGasUrl()){el.className='nbar ok';el.textContent='設定済み（自動同期）'}
  else{el.className='nbar idle';el.textContent='未設定'}
}
async function testGAS(){
  const url=getGasUrl();
  if(!url){alert('Apps Script URLを入力してください');return}
  const el=document.getElementById('nbar');el.className='nbar idle';el.textContent='テスト中...';
  try{
    const r=await fetch(url+'?action=ping');
    const j=await r.json();
    if(j.ok){el.className='nbar ok';el.textContent='接続成功！'}
    else{el.className='nbar ng';el.textContent='接続失敗：'+j.error}
  }catch(e){el.className='nbar ng';el.textContent='ネットワークエラー'}
}
async function pushGAS(silent=false){
  const url=getGasUrl();if(!url)return;
  try{
    const r=await fetch(url,{method:'POST',body:JSON.stringify({action:'push',data:S})});
    const j=await r.json();
    if(!silent){j.ok?alert('クラウドに保存しました'):alert('失敗：'+j.error)}
  }catch(e){if(!silent)alert('ネットワークエラー')}
}
async function pullGAS(){
  const url=getGasUrl();if(!url){alert('Apps Script URLを設定してください');return}
  if(!confirm('クラウドのデータで上書きしますか？（ローカルの変更は失われます）'))return;
  try{
    const r=await fetch(url+'?action=pull');
    const j=await r.json();
    if(j.ok&&j.data){S=j.data;migrateParties();save();renderPTabs();renderPartySlots();renderStats();alert('取得しました')}
    else alert('失敗：'+(j.error||'データなし'))
  }catch(e){alert('ネットワークエラー')}
}
function importData(){document.getElementById('import-file').click()}
function handleImport(e){
  const f=e.target.files[0];if(!f)return;
  const rd=new FileReader();
  rd.onload=ev=>{
    try{
      const d=JSON.parse(ev.target.result);
      if(!d.battles)throw new Error('形式エラー');
      if(!confirm(`${d.battles.length}件の対戦データをインポートします（現在のデータに追加）`))return;
      const ids=new Set(S.battles.map(b=>b.id));
      d.battles.forEach(b=>{if(!ids.has(b.id))S.battles.push(b)});
      S.battles.sort((a,b)=>b.id-a.id);
      save();renderStats();alert('インポート完了');
    }catch(ex){alert('読み込み失敗：'+ex.message)}
  };
  rd.readAsText(f);e.target.value='';
}
function exportData(){const blob=new Blob([JSON.stringify(S,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='battle_data.json';a.click()}
function clearData(){if(!confirm('対戦データを全削除しますか？'))return;S.battles=[];save();renderStats();alert('削除しました')}
