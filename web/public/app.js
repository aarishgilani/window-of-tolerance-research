// Simple client-side filter for the sidebar nav.
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('nav-filter');
  if (!input) return;

  const sections = document.querySelectorAll('.nav-section, .nav-toplevel');

  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase();

    sections.forEach((section) => {
      const items = section.querySelectorAll('li');
      let visibleCount = 0;

      items.forEach((li) => {
        const text = li.textContent.toLowerCase();
        const match = text.includes(query);
        li.style.display = match ? '' : 'none';
        if (match) visibleCount += 1;
      });

      const heading = section.querySelector('h3');
      if (heading) {
        section.style.display = visibleCount === 0 && query ? 'none' : '';
      }
    });
  });
});
