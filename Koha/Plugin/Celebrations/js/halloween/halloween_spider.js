document.addEventListener('DOMContentLoaded', function() {
  const options = window.halloweenThemeOptions || {};
  const quantite = parseInt(options.quantite_spiders) || 2;
  const navbar = document.querySelector('nav.breadcrumbs');
  if (navbar) {
    const numberOfSpiders = quantite;
    const totalWidthPercent = 60;
    const startPercent = 50 - totalWidthPercent / 2;
    for (let i = 0; i < numberOfSpiders; i++) {
      const spider = document.createElement('div');
      spider.className = `spider spider_${i}`;
      // Yeux
      spider.innerHTML = `
        <div class="eye left"></div>
        <div class="eye right"></div>
      `;
      // Pattes gauche
      for (let j = 0; j < 4; j++) {
        const leg = document.createElement('span');
        leg.className = 'leg left';
        leg.style.top = `${20 + j * 5}px`;
        leg.style.left = `${-8 + j * 1.5}px`;
        spider.appendChild(leg);
      }
      // Pattes droite
      for (let j = 0; j < 4; j++) {
        const leg = document.createElement('span');
        leg.className = 'leg right';
        leg.style.top = `${20 + j * 5}px`;
        leg.style.right = `${-8 + j * 1.5}px`;
        spider.appendChild(leg);
      }
      const leftPercent = numberOfSpiders === 1
        ? 50
        : startPercent + (totalWidthPercent / (numberOfSpiders - 1)) * i;
      spider.style.position = 'absolute';
      spider.style.top = '0';
      spider.style.left = `${leftPercent}%`;
      navbar.appendChild(spider);
    }
  }
});
