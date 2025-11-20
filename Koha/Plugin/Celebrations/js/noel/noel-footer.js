/*
  Section : lumière de noel
	Attribution :
      Code inspiré, modifié et adapté pour l'OPAC de Koha à partir du Pen original sur CodePen.io.
      Copyright (c) Matt Blenkinsop - https://codepen.io/mblenk/pen/qBKwNmp
*/
document.addEventListener('DOMContentLoaded', function() {
   if (document.getElementById('lightcontainer')) return;
  const lightContainer = document.createElement('div');
  lightContainer.id = 'lightcontainer';
  lightContainer.className = 'lightcontainer';
  const lightRope = document.createElement('ul');
  lightRope.id = 'lightrope';
  lightRope.className = 'lightrope';
  const screenWidth = window.innerWidth;
  const bulbSpacing = 30;
  const bulbCount = Math.ceil(screenWidth / bulbSpacing);
  for (let i = 0; i < bulbCount; i++) {
    const li = document.createElement('li');
    lightRope.appendChild(li);
  }
  lightContainer.appendChild(lightRope);
  const newFooter = document.createElement('footer');
  newFooter.id = 'celebration-footer';
  newFooter.appendChild(lightContainer);
  const existingFooter = document.getElementById('changelanguage');
  if (existingFooter) {
    existingFooter.parentNode.insertBefore(newFooter, existingFooter);
  } else {
    document.body.appendChild(newFooter);
  }
  // newFooter.style.height = '60px';
});
window.addEventListener('resize', () => {
  const rope = document.getElementById('lightrope');
  if (!rope) return;
  const screenWidth = window.innerWidth;
  const bulbSpacing = 30;
  const bulbCount = Math.ceil(screenWidth / bulbSpacing);
  const currentCount = rope.children.length;
  if (bulbCount > currentCount) {
    for (let i = currentCount; i < bulbCount; i++) {
      rope.appendChild(document.createElement('li'));
    }
  } else if (bulbCount < currentCount) {
    for (let i = currentCount; i > bulbCount; i--) {
      rope.removeChild(rope.lastChild);
    }
  }
});