const SK=['hp','atk','def','spa','spd','spe'], HK=['H','A','B','C','D','S'];

async function loadPokeCSV() {
  const loading = document.getElementById('csv-loading');
  const errBanner = document.getElementById('csv-error');
  if (loading) loading.style.display = 'flex';
  try {
    const res = await fetch('./pokemon_list.csv?v=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const text = await res.text();

    POKE_DB = parseCSVtoDB(text);

    for (const k in BY_EN) delete BY_EN[k];
    for (const k in BY_JA) delete BY_JA[k];
    POKE_DB.forEach(r => {
      BY_JA[r[1]] = r;
    });

    console.log('pokemon_list.csv loaded:', POKE_DB.length, 'entries');
    applyEngNames();
  } catch (e) {
    console.error('pokemon_list.csv load failed:', e);
    if (errBanner) errBanner.style.display = 'block';
  } finally {
    if (loading) loading.style.display = 'none';
  }
}

function parseCSVtoDB(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/\r/g, ''));
  return lines.slice(1).map(line => {
    const cols = [];
    let cur = '', inQ = false;
    for (const ch of (line.replace(/\r/g, ''))) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { cols.push(cur); cur = ''; }
      else cur += ch;
    }
    cols.push(cur);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (cols[i] || '').trim(); });

    const no = parseInt(obj.no);
    if (isNaN(no)) return null;
    const types = [obj.type1, obj.type2].filter(Boolean);
    const sid = obj.sprite_override || String(no);
    const spriteUrl = obj.sprite_url ||
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${sid}.png`;
    const yakkunUrl = obj.yakkun_url || `https://yakkun.com/sv/zukan/n${no}`;
    return [no, obj.name, '', types, spriteUrl, yakkunUrl];
  }).filter(Boolean);
}

const TC={ノーマル:'#9FA19F',ほのお:'#E62829',みず:'#2980EF',でんき:'#FAC000',くさ:'#3FA129',こおり:'#3DCEF3',かくとう:'#FF8000',どく:'#9141CB',じめん:'#915121',ひこう:'#81B9EF',エスパー:'#EF4179',むし:'#91A119',いわ:'#AFA981',ゴースト:'#704170',ドラゴン:'#5060E1',あく:'#624D4E',はがね:'#60A1B8',フェアリー:'#EF70EF'};

let POKE_DB = [];
const BY_EN={}, BY_JA={};

function applyEngNames(){
  if(!window.PKMN_DEX||!POKE_DB.length)return;
  try{
    const byNum={};
    window.PKMN_DEX.species.all().forEach(sp=>{ if(sp.num>0&&!byNum[sp.num]) byNum[sp.num]=sp.name; });
    POKE_DB.forEach(r=>{ if(byNum[r[0]]) r[2]=byNum[r[0]]; });
    for(const k in BY_EN) delete BY_EN[k];
    POKE_DB.forEach(r=>{ if(r[2]) BY_EN[r[2]]=r; });
    console.log('[state] English names applied');
    window.dispatchEvent(new Event('engnames-ready'));
  }catch(e){ console.warn('[state] applyEngNames failed',e); }
}
window.addEventListener('pkmndex-ready',applyEngNames);
function getPoke(name_en){ return BY_EN[name_en]||null; }
function typeHtml(types){
  return (types||[]).map(t=>`<span class="tbadge" style="background:${TC[t]}22;color:${TC[t]};box-shadow:inset 0 0 0 1px ${TC[t]}55">${t}</span>`).join('');
}
function imgUrl(name_en){
  const r=getPoke(name_en); return r?r[4]:'';
}
function spriteImg(name_en, size=40){
  const url=imgUrl(name_en);
  if(!url) return '';
  return `<img src="${url}" width="${size}" height="${size}" style="object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none'" loading="lazy">`;
}

let S = (()=>{try{return JSON.parse(localStorage.getItem('pb3')||'null')}catch{return null}})() || {
  parties:[{id:'p1',name:'パーティ1',pokemon:[]}],
  activeParty:'p1',
  battles:[]
};
function getGasUrl(){return localStorage.getItem('gas_url')||''}
function save(){localStorage.setItem('pb3',JSON.stringify(S))}
function getAP(){return S.parties.find(p=>p.id===S.activeParty)||S.parties[0]}

function pname(x){return x&&typeof x==='object'?x.name:x}
function pbuild(x){return x&&typeof x==='object'?x:{name:x}}
function hasBuild(it){
  if(!it||typeof it!=='object')return false;
  const ptOn=it.points&&HK.some(k=>(it.points[k]||0)>0);
  return !!(ptOn||it.ability||it.item||(it.tera)||(it.moves&&it.moves.some(Boolean))||(it.nature&&it.nature!=='まじめ'));
}
function migrateParties(){
  let changed=0;
  (S.parties||[]).forEach(p=>{
    if(!Array.isArray(p.pokemon))return;
    p.pokemon=p.pokemon.map(x=>{ if(x&&typeof x==='object')return x; changed++; return {name:x}; });
  });
  if(changed){console.log('[party] migrated '+changed+' pokemon to object form');save()}
}

let oppParty=[], mySel={lead:[],back:[]}, oppSel={lead:[],back:[]}, battleRes=null, curStep=1, statFilter='all';
let modalCB=null;

function openModal(title,cb){
  modalCB=cb;
  document.getElementById('m-title').textContent=title;
  document.getElementById('m-input').value='';
  document.getElementById('modal').style.display='flex';
  setTimeout(()=>document.getElementById('m-input').focus(),100);
  filterM('');
}
function cm(){document.getElementById('modal').style.display='none'}
document.getElementById('m-input').addEventListener('input',function(){filterM(this.value)});
function filterM(q){
  q=q.trim().toLowerCase();
  const qk=q.replace(/[ぁ-ゖ]/g,c=>String.fromCharCode(c.charCodeAt(0)+0x60));
  const el=document.getElementById('m-list');
  let matches;
  if(!q) matches=POKE_DB.slice(0,60);
  else matches=POKE_DB.filter(r=>
    r[1].includes(q)||r[1].includes(qk)||(r[2]&&r[2].toLowerCase().includes(q))||String(r[0]).includes(q)
  ).slice(0,50);
  if(!matches.length){el.innerHTML='<div class="mloading">見つかりません</div>';return}
  el.innerHTML='';
  matches.forEach(r=>{
    const [no,ja,en,types,url,yakkun]=r;
    const div=document.createElement('div');
    div.className='mitem';
    div.innerHTML=`<img src="${url}" onerror="this.style.opacity=0" loading="lazy">
      <div class="mitem-info">
        <div class="mitem-name">${ja} <span style="color:var(--text-3);font-size:9px">No.${no} ${en}</span></div>
        <div class="mitem-types">${typeHtml(types)}</div>
      </div>
      <a href="${yakkun}" target="_blank" onclick="event.stopPropagation()">ポケ徹で確認↗</a>`;
    div.onclick=()=>{modalCB&&modalCB(en);cm()};
    el.appendChild(div);
  });
}
