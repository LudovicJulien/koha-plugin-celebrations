/*
  Section : panier d'oeufs
	Attribution :
      Code inspiré, modifié et adapté pour l'OPAC de Koha à partir du Pen original sur CodePen.io.
      Copyright (c) Nate Wiley - https://codepen.io/natewiley/pen/wGeejw
*/
document.addEventListener('DOMContentLoaded', function () {
  const options = window.paqueThemeOptions || {};
  const apiNamespace = options.api_namespace
  if (window.innerWidth > 768) {
    // Trouve l'élément de référence
    const navbarCollapse = document.querySelector('nav.breadcrumbs');
    if (!navbarCollapse) return;
    // Crée dynamiquement le canvas et l'insère juste après le breadcrumb
    const canvas = document.createElement('canvas');
    canvas.id = 'eggCanvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '10000';
    // L'ajouter à la fin du <body> pour le rendre global
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
    const maxEggs = 2;
    const eggWidth = 75;
    const eggHeight = 102;
    const eggs = [];
    const mouse = { x: null, y: null };
    const eggImages = [
          '/api/v1/contrib/'+apiNamespace+'/static/images/gold-easter-egg.png',
          '/api/v1/contrib/'+apiNamespace+'/static/images/purple-easter-egg.png',
          '/api/v1/contrib/'+apiNamespace+'/static/images/pink-easter-egg.png',
          '/api/v1/contrib/'+apiNamespace+'/static/images/blue-easter-egg.png'
    ];
    const loadedImages = [];
    function random(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function loadImages(urls, callback) {
      let loaded = 0;
      urls.forEach((url, i) => {
        const img = new Image();
        img.onload = () => {
          loadedImages[i] = img;
          loaded++;
          if (loaded === urls.length) callback();
        };
        img.src = url;
      });
    }
    function createEgg() {
      const img = loadedImages[random(0, loadedImages.length - 1)];
      const scale = random(5, 9) * 0.1;
      return {
        img,
        x: mouse.x ?? w / 2,
        y: mouse.y ?? h / 2,
        vx: random(-2, 2),
        vy: random(-2, 2),
        vr: Math.random() > 0.5 ? Math.random() * -0.01 : Math.random() * 0.01,
        rotation: 0,
        scale,
        life: 0,
        maxLife: random(50, 100),
        inView: false
      };
    }
    function resetEgg(egg) {
      const newEgg = createEgg();
      Object.assign(egg, newEgg);
    }
    function animate() {
      ctx.clearRect(0, 0, w, h);
      eggs.forEach((egg) => {
        egg.x += egg.vx;
        egg.y += egg.vy;
        egg.rotation += egg.vr;
        egg.vy += 0.01; // gravity
        egg.scale *= 0.98;
        egg.life++;
        if (
          egg.x + eggWidth / 2 < 0 ||
          egg.x - eggWidth / 2 > w ||
          egg.y + eggHeight / 2 < 0 ||
          egg.y - eggHeight / 2 > h ||
          egg.life > egg.maxLife
        ) {
          if (egg.inView) {
            resetEgg(egg);
          }
        } else {
          egg.inView = true;
          // Draw with rotation
          ctx.save();
          ctx.translate(egg.x, egg.y);
          ctx.rotate(egg.rotation);
          ctx.scale(egg.scale, egg.scale);
          ctx.drawImage(egg.img, -eggWidth / 2, -eggHeight / 2, eggWidth, eggHeight);
          ctx.restore();
        }
      });
      requestAnimationFrame(animate);
    }
    function setup() {
      for (let i = 0; i < maxEggs; i++) {
        setTimeout(() => {
          const egg = createEgg();
          eggs.push(egg);
        }, i * 80);
      }
      animate();
    }
    function onTouchOrMouseMove(e) {
      if (e.touches) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
      } else {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      }
    }
    function noMouse() {
      mouse.x = null;
      mouse.y = null;
    }
    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    }
    window.addEventListener('mousemove', onTouchOrMouseMove);
    window.addEventListener('touchstart', onTouchOrMouseMove);
    window.addEventListener('touchmove', onTouchOrMouseMove);
    window.addEventListener('mouseout', noMouse);
    window.addEventListener('resize', resize);
    loadImages(eggImages, setup);
  }
});