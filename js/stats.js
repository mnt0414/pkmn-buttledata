function renderPFBar(){
  const el=document.getElementById('pf-bar');el.innerHTML='';
  const mk=(label,id)=>{
    const b=document.createElement('button');
    b.className='pfbtn'+(statFilter===id?' active':'');
    b.textContent=label;
    b.onclick=()=>{statFilter=id;renderPFBar();renderStats()};
    el.appendChild(b);
  };
  mk('全パーティ','all');
  S.parties.forEach(p=>mk(p.name,p.id));
}

function getFB(){return statFilter==='all'?S.battles:S.battles.filter(b=>b.partyId===statFilter)}

function renderStats(){
  const bs=getFB(),wins=bs.filter(b=>b.result==='win').length,total=bs.length;
  const pct=total?Math.round(wins/total*100):0;
  const wr_color=total===0?'var(--text-3)':pct>=50?'var(--win)':'var(--loss)';
  document.getElementById('stat-sum').innerHTML=`
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-bottom:4px;">
      <div class="card" style="text-align:center;padding:13px;">
        <div class="num" style="font-size:26px;font-weight:800;line-height:1;color:var(--text);">${total}</div>
        <div style="font-size:10px;color:var(--text-3);margin-top:4px;letter-spacing:.06em;">対戦数</div>
      </div>
      <div class="card" style="text-align:center;padding:13px;">
        <div class="num" style="font-size:26px;font-weight:800;line-height:1;color:var(--win);">${wins}</div>
        <div style="font-size:10px;color:var(--text-3);margin-top:4px;letter-spacing:.06em;">勝利数</div>
        <div class="num" style="font-size:10.5px;color:var(--text-2);margin-top:2px;">${wins}/${total}</div>
      </div>
      <div class="card" style="text-align:center;padding:13px;">
        <div class="num" style="font-size:26px;font-weight:800;line-height:1;color:${wr_color};">${pct}%</div>
        <div style="font-size:10px;color:var(--text-3);margin-top:4px;letter-spacing:.06em;">勝率</div>
      </div>
    </div>`;
  renderPickRates(bs);renderComboStats(bs);renderPokeWR();renderHist(bs);
}

function rpRate(id,bs,ex,total,isPair){
  const c={};bs.forEach(b=>ex(b)?.forEach(k=>{c[k]=(c[k]||0)+1}));
  const sorted=Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,isPair?5:12);
  const el=document.getElementById(id);
  if(!el)return;
  if(!sorted.length){el.innerHTML='<div class="empty">データなし</div>';return}
  el.innerHTML='';
  sorted.forEach(([name,cnt])=>{
    const pct=Math.round(cnt/total*100);
    const row=document.createElement('div');
    row.style.cssText='display:flex;align-items:center;gap:10px;margin-bottom:9px;';
    if(!isPair){
      const r=getPoke(name)||{};
      row.innerHTML=`<span style="width:30px;height:30px;border-radius:8px;flex:none;background:var(--raised);display:flex;align-items:center;justify-content:center;overflow:hidden;">${spriteImg(name,30)}</span>
        <span style="font-size:12px;width:84px;flex:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r[1]||name}</span>
        <div style="flex:1;height:6px;background:var(--line);border-radius:6px;overflow:hidden;">
          <div class="bar-fill" style="height:100%;width:${pct}%;background:var(--primary);border-radius:6px;"></div>
        </div>
        <span class="num" style="font-size:12px;color:var(--text-2);width:36px;text-align:right;">${pct}%</span>`;
    }else{
      row.innerHTML=`<span style="font-size:11.5px;flex:1;min-width:0;">${name}</span>
        <div style="width:40%;height:6px;background:var(--line);border-radius:6px;overflow:hidden;">
          <div class="bar-fill" style="height:100%;width:${pct}%;background:var(--primary);border-radius:6px;"></div>
        </div>
        <span class="num" style="font-size:12px;color:var(--text-2);width:36px;text-align:right;">${pct}%</span>`;
    }
    el.appendChild(row);
  });
}

function renderPickRates(bs){
  rpRate('my-pick',bs,b=>[...(b.myLead??[]),...(b.myBack??[])],bs.length,false);
  rpRate('opp-pick',bs,b=>[...(b.oppLead??[]),...(b.oppBack??[])],bs.length,false);
  rpRate('my-lead-r',bs,b=>b.myLead.length>=2?[b.myLead.slice().sort().join('＋')]:[],bs.length,true);
  rpRate('opp-lead-r',bs,b=>b.oppLead.length>=2?[b.oppLead.slice().sort().join('＋')]:[],bs.length,true);
}

function renderComboStats(bs){
  cwRate('my-cw-top',bs,'my',true,5);cwRate('my-cw-bot',bs,'my',false,5);
  cwRate('opp-cw-top',bs,'opp',true,5);cwRate('opp-cw-bot',bs,'opp',false,5);
  renderCross(bs);
}

function cwRate(id,bs,side,top,limit){
  const stats={};
  bs.forEach(b=>{const lead=side==='my'?b.myLead:b.oppLead;if(lead.length<2)return;const k=lead.slice().sort().join('＋');if(!stats[k])stats[k]={w:0,t:0};stats[k].t++;if(b.result==='win')stats[k].w++});
  const sorted=Object.entries(stats).filter(([,v])=>v.t>=1).map(([k,v])=>({key:k,rate:v.w/v.t,t:v.t,w:v.w})).sort((a,b)=>top?b.rate-a.rate:a.rate-b.rate).slice(0,limit);
  const el=document.getElementById(id);if(!sorted.length){el.innerHTML='<div class="empty">データなし</div>';return}
  el.innerHTML='';
  sorted.forEach(item=>{
    const pct=Math.round(item.rate*100);
    const col=pct>=60?'var(--win)':pct<=40?'var(--loss)':'var(--text-2)';
    const div=document.createElement('div');
    div.style.cssText='display:flex;align-items:center;gap:10px;margin-bottom:11px;';
    div.innerHTML=`<span style="font-size:11.5px;flex:1;min-width:0;">${item.key}</span>
      <div style="width:38%;height:6px;background:var(--line);border-radius:6px;overflow:hidden;">
        <div class="bar-fill" style="height:100%;width:${pct}%;background:${col};border-radius:6px;"></div>
      </div>
      <span class="num" style="font-size:12px;color:${col};width:78px;text-align:right;">${pct}% (${item.w}/${item.t})</span>`;
    el.appendChild(div);
  });
}

function renderCross(bs){
  const myLC={},oppLC={};
  bs.forEach(b=>{if(b.myLead.length>=2){const k=b.myLead.slice().sort().join('＋');myLC[k]=(myLC[k]||0)+1}if(b.oppLead.length>=2){const k=b.oppLead.slice().sort().join('＋');oppLC[k]=(oppLC[k]||0)+1}});
  const myTop=Object.entries(myLC).sort((a,b)=>b[1]-a[1]).slice(0,5).map(e=>e[0]);
  const oppTop=Object.entries(oppLC).sort((a,b)=>b[1]-a[1]).slice(0,10).map(e=>e[0]);
  const el=document.getElementById('cross-c');
  if(!myTop.length||!oppTop.length){el.innerHTML='<div class="empty">データなし</div>';return}
  let html=`<table style="border-collapse:collapse;font-size:10px;"><thead><tr><th style="padding:5px 8px;color:var(--text-3);border-bottom:1px solid var(--line);">自分↓ / 相手→</th>`;
  oppTop.forEach(ok=>html+=`<th style="padding:5px 8px;color:var(--text-3);border-bottom:1px solid var(--line);white-space:nowrap;">${ok.replace('＋','<br>')}</th>`);
  html+='</tr></thead><tbody>';
  myTop.forEach(mk=>{
    html+=`<tr><th style="padding:5px 8px;color:var(--text-3);white-space:nowrap;text-align:left;">${mk.replace('＋','<br>')}</th>`;
    oppTop.forEach(ok=>{
      const m=bs.filter(b=>b.myLead.slice().sort().join('＋')===mk&&b.oppLead.slice().sort().join('＋')===ok);
      if(!m.length){html+='<td style="padding:5px 8px;color:var(--text-3);text-align:center;">-</td>';return}
      const w=m.filter(b=>b.result==='win').length,pct=Math.round(w/m.length*100);
      const bg=pct>=60?'rgba(58,208,122,.15)':pct<=40?'rgba(255,122,107,.12)':'';
      const tc=pct>=60?'var(--win)':pct<=40?'var(--loss)':'var(--text)';
      html+=`<td style="padding:5px 8px;background:${bg};color:${tc};font-weight:600;text-align:center;">${pct}%<br><span style="font-size:8px;color:var(--text-3)">${w}/${m.length}</span></td>`;
    });html+='</tr>';
  });
  el.innerHTML=html+'</tbody></table>';
}

function renderPokeWR(){
  pokeWR('my-pwr',S.battles,'my');pokeWR('opp-pwr',S.battles,'opp');
}

function pokeWR(id,bs,side){
  const stats={};
  bs.forEach(b=>{
    const pokes=side==='my'?[...(b.myLead??[]),...(b.myBack??[])]:[...(b.oppLead??[]),...(b.oppBack??[])];
    pokes.forEach(en=>{if(!stats[en])stats[en]={w:0,t:0};stats[en].t++;if(b.result==='win')stats[en].w++});
  });
  const sorted=Object.entries(stats).map(([k,v])=>({en:k,rate:v.w/v.t,t:v.t,w:v.w})).sort((a,b)=>b.rate-a.rate);
  const el=document.getElementById(id);if(!sorted.length){el.innerHTML='<div class="empty">データなし</div>';return}
  el.innerHTML='';
  sorted.forEach(item=>{
    const r=getPoke(item.en)||{};
    const pct=Math.round(item.rate*100);
    const col=pct>=60?'var(--win)':pct<=40?'var(--loss)':'var(--text-2)';
    const div=document.createElement('div');
    div.style.cssText='display:flex;align-items:center;gap:10px;margin-bottom:9px;';
    div.innerHTML=`<span style="width:30px;height:30px;border-radius:8px;flex:none;background:var(--raised);display:flex;align-items:center;justify-content:center;overflow:hidden;">${spriteImg(item.en,30)}</span>
      <span style="font-size:12px;width:84px;flex:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r[1]||item.en}</span>
      <div style="flex:1;height:6px;background:var(--line);border-radius:6px;overflow:hidden;">
        <div class="bar-fill" style="height:100%;width:${pct}%;background:${col};border-radius:6px;"></div>
      </div>
      <span class="num" style="font-size:12px;color:${col};width:72px;text-align:right;">${pct}% (${item.w}/${item.t})</span>`;
    el.appendChild(div);
  });
}

function renderHist(bs){
  const el=document.getElementById('hist-list');
  if(!bs.length){el.innerHTML='<div class="empty">対戦記録なし</div>';return}
  el.innerHTML='';
  bs.slice(0,40).forEach(b=>{
    const d=new Date(b.date);
    const ds=`${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
    const isWin=b.result==='win';
    const badgeCls=isWin?'hist-badge win':'hist-badge loss';
    const badgeTxt=isWin?'W':'L';
    const row=document.createElement('div');
    row.style.cssText='display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #1a212b;';
    let mChips='',oChips='';
    [...(b.myLead??[]),...(b.myBack??[])].forEach(()=>{mChips+=`<span style="width:20px;height:20px;border-radius:5px;background:var(--raised);border:1px solid var(--line);flex:none;"></span>`});
    [...(b.oppLead??[]),...(b.oppBack??[])].forEach(()=>{oChips+=`<span style="width:20px;height:20px;border-radius:5px;background:var(--raised);border:1px solid var(--line);flex:none;"></span>`});
    row.innerHTML=`<span class="num" style="font-size:10px;color:var(--text-3);width:42px;flex:none;">${ds}</span>
      <span class="${badgeCls}">${badgeTxt}</span>
      <div style="display:flex;gap:2px;flex:1;min-width:0;">${mChips}</div>
      <span style="font-size:10px;color:var(--text-3);">vs</span>
      <div style="display:flex;gap:2px;flex:1;min-width:0;justify-content:flex-end;">${oChips}</div>`;
    el.appendChild(row);
  });
}

function showST(tab,btn){
  ['pickrate','combo','winrate','history'].forEach(t=>{document.getElementById('st-'+t).style.display=t===tab?'block':'none'});
  document.querySelectorAll('.stab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}
