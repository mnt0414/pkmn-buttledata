const NAV_META = {
  party:    {kicker:'MY PARTY',    title:'パーティ'},
  battle:   {kicker:'BATTLE LOG',  title:'対戦記録'},
  stats:    {kicker:'ANALYTICS',   title:'データ'},
  calc:     {kicker:'DAMAGE CALC', title:'計算'},
  settings: {kicker:'CONFIG',      title:'設定'},
};

function gp(id, _btn) {
  document.querySelectorAll('.view').forEach(p => p.classList.remove('active'));
  const view = document.getElementById('page-' + id);
  if (view) view.classList.add('active');

  document.querySelectorAll('.nav-item, .botnav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.page === id);
  });

  const m = NAV_META[id] || {};
  const kEl = document.getElementById('hdr-kicker');
  const tEl = document.getElementById('hdr-title');
  if (kEl) kEl.textContent = m.kicker || '';
  if (tEl) tEl.textContent = m.title  || '';

  if (id === 'party')    { renderPTabs(); renderPartySlots(); }
  if (id === 'battle')   { renderBattleMyParty(); renderOppSlots(); }
  if (id === 'stats')    { renderPFBar(); renderStats(); }
  if (id === 'calc')     { openCalc(); }
  if (id === 'settings') { loadSet(); }
}
