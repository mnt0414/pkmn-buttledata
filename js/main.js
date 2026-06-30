(async () => {
  initTheme();
  await loadPokeCSV();
  migrateParties();
  renderPTabs();
  renderPartySlots();
})();
