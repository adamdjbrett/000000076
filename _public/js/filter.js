// 76 Awesome Oranges — client-side theme filter
(function () {
  const grid = document.querySelector('[data-theme-grid]');
  if (!grid) return;
  const search = document.querySelector('[data-theme-search]');
  const tagButtons = document.querySelectorAll('[data-tag-filter]');
  const countEl = document.querySelector('[data-visible-count]');
  const cards = Array.from(grid.querySelectorAll('.theme-card'));
  let activeTag = 'all';
  let query = '';

  function apply() {
    let visible = 0;
    const q = query.trim().toLowerCase();
    cards.forEach((card) => {
      const tags = (card.dataset.tags || '').split(' ');
      const name = (card.dataset.name || '').toLowerCase();
      const desc = (card.dataset.desc || '').toLowerCase();
      const tagOk = activeTag === 'all' || tags.includes(activeTag);
      const qOk = !q || name.includes(q) || desc.includes(q) || tags.some((t) => t.includes(q));
      const show = tagOk && qOk;
      card.style.display = show ? '' : 'none';
      if (show) visible += 1;
    });
    if (countEl) countEl.textContent = visible;
    let empty = grid.parentElement.querySelector('.no-results');
    if (visible === 0) {
      if (!empty) {
        empty = document.createElement('div');
        empty.className = 'no-results';
        empty.setAttribute('role', 'status');
        empty.textContent = 'No oranges match that filter. Try a different search or tag.';
        grid.parentElement.appendChild(empty);
      }
    } else if (empty) {
      empty.remove();
    }
  }

  if (search) {
    search.addEventListener('input', (e) => {
      query = e.target.value;
      apply();
    });
  }
  tagButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tagButtons.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      activeTag = btn.dataset.tagFilter;
      apply();
    });
  });
  apply();
})();
