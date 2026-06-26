(async () => {
  await loadPokeCSV();
  migrateParties();
  renderPTabs();
  renderPartySlots();
})();
