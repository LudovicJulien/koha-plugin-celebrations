/*
    Section : Spider
    Attribution :
      Code inspiré, modifié et adapté pour l'OPAC de Koha à partir du Pen original sur CodePen.io.
      Copyright (c) Rachel Best - https://codepen.io/rachel_web/pen/MjxzOb
*/
document.addEventListener('DOMContentLoaded', function() {
  const isInIframe = window.self !== window.top;
  const options = window.halloweenThemeOptions || {};
  const quantite = parseInt(options.quantite_spiders) || 2;
  const navbar = document.querySelector('nav.breadcrumbs');
  if (!navbar) return;
  const numberOfSpiders = quantite;
  const totalWidthPercent = 60;
  const startPercent = 50 - totalWidthPercent / 2;
  // Fonction pour créer les araignées
  function createSpiders() {
    // Supprime les anciennes araignées avant de recréer (évite doublons)
    navbar.querySelectorAll('.spider').forEach(s => s.remove());
    const isSmallScreen = window.innerWidth < 700;
    const topBase = isSmallScreen ? 12 : 20;
    const topIncrement = isSmallScreen ? 4 : 5;
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
        leg.style.top = `${topBase + j * topIncrement}px`;
        leg.style.left = `${-8 + j * 1.5}px`;
        spider.appendChild(leg);
      }
      // Pattes droite
      for (let j = 0; j < 4; j++) {
        const leg = document.createElement('span');
        leg.className = 'leg right';
        leg.style.top = `${topBase + j * topIncrement}px`;
        leg.style.right = `${-8 + j * 1.5}px`;
        spider.appendChild(leg);
      }
      const leftPercent =
        numberOfSpiders === 1
          ? 50
          : startPercent + (totalWidthPercent / (numberOfSpiders - 1)) * i;
      spider.style.position = 'absolute';
      spider.style.top = '0';
      spider.style.left = `${leftPercent}%`;
      navbar.appendChild(spider);
    }
  }
  createSpiders();
  window.addEventListener('resize', () => {
    createSpiders();
    adjustLine();
  });
  adjustLine();
});
// gestion du cas où le chargement se fait dnas un Iframe
function adjustLine() {
  const isInIframe = window.self !== window.top;
  const spiders = document.querySelectorAll('.spider');
  if (!spiders.length) return;
  spiders.forEach(spider => {
    spider.classList.remove('thick-line', 'bigthickline');
    if (isInIframe) {
      spider.classList.add('bigthickline');
    }
  });

}

