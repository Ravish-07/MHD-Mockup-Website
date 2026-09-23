if (sessionStorage.getItem('coastAuthed') !== 'true') {
  window.location.replace('index.html');
}

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const pills = document.querySelectorAll('.pill');
  const cards = document.querySelectorAll('.product-card');
  const resultsCount = document.getElementById('resultsCount');
  const noResults = document.getElementById('noResults');

  let activeFilter = 'all';

  function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    cards.forEach(card => {
      const category = card.dataset.category;
      const name = card.dataset.name.toLowerCase();

      const matchesFilter = activeFilter === 'all' || category === activeFilter;
      const matchesSearch = query === '' || name.includes(query);

      const isVisible = matchesFilter && matchesSearch;
      card.style.display = isVisible ? '' : 'none';
      if (isVisible) visibleCount++;
    });

    resultsCount.textContent = `${visibleCount} plan${visibleCount !== 1 ? 's' : ''} · Page 1 of 1`;
    noResults.style.display = visibleCount === 0 ? 'block' : 'none';
  }

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilter = pill.dataset.filter;
      applyFilters();
    });
  });

  searchBtn.addEventListener('click', applyFilters);
  searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') applyFilters();
    applyFilters(); // live filter as you type
  });

  // Optional: click a card to log which plan was selected (placeholder for routing later)
  cards.forEach(card => {
    card.addEventListener('click', () => {
      console.log('Selected plan:', card.dataset.name);
    });
  });
});
