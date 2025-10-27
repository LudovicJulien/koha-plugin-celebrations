document.addEventListener('DOMContentLoaded', function() {

    var options = window.HalloweenThemeOptions || {};
    var activation = options.activation_spiders || "on";
    var quantite = parseInt(options.quantite_spiders) || 2;
    var ghostEnabled = options.activation_ghost || "on";
    var navbarCollapse = document.querySelector('nav.breadcrumbs');
    const footer = document.querySelector('footer#changelanguage');



  //
  //  SECTION : Ghost,  suivie du curseur
  //
   if (ghostEnabled === 'on' && window.innerWidth > 768) {
       const ghostHtml = `
        <div id="ghost" class="ghost">
            <div class="ghost__head">
                <div class="ghost__eyes"></div>
                <div class="ghost__mouth"></div>
            </div>
            <div class="ghost__tail">
                <div class="ghost__rip"></div>
            </div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" id="ghost-filter"
            style="position: absolute; width: 0; height: 0; overflow: hidden; z-index: -1; pointer-events: none;">
            <defs>
                <filter id="goo">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="ghost-blur" />
                    <feColorMatrix in="ghost-blur" mode="matrix"
                        values="1 0 0 0 0
                                0 1 0 0 0
                                0 0 1 0 0
                                0 0 0 16 -7"
                        result="ghost-gooey" />
                </filter>
            </defs>
        </svg>
      `;
        document.body.insertAdjacentHTML('beforeend', ghostHtml);
        loadGhostCursor();
    }

    function loadGhostCursor() {
        let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2, dir: '' };
        let clicked = false;

          const getMouse = (e) => {
            const clientX = e.clientX || e.pageX || e.touches?.[0]?.pageX || window.innerWidth / 2;
            const clientY = e.clientY || e.pageY || e.touches?.[0]?.pageY || window.innerHeight / 2;

            mouse = {
                x: clientX,
                y: clientY + window.scrollY,
                dir: (getMouse.x > clientX) ? 'left' : 'right'
            };
        };
        ['mousemove', 'touchstart', 'touchmove'].forEach(e => {
            window.addEventListener(e, getMouse);
        });
        window.addEventListener('mousedown', (e) => {
            // e.preventDefault();
            clicked = true;
        });
        window.addEventListener('mouseup', () => {
            clicked = false;
        });

        class GhostFollow {
            constructor(options) {
                Object.assign(this, options);
                this.el = document.querySelector('#ghost');
                this.mouth = document.querySelector('.ghost__mouth');
                this.eyes = document.querySelector('.ghost__eyes');
                this.pos = { x: 0, y: 0 };
            }

            follow() {
                this.distX = mouse.x - this.pos.x;
                this.distY = mouse.y - this.pos.y;

                this.velX = this.distX / 8;
                this.velY = this.distY / 8;

                this.pos.x += this.distX / 10;
                this.pos.y += this.distY / 10;

                this.skewX = map(this.velX, 0, 100, 0, -50);
                this.scaleY = map(this.velY, 0, 100, 1, 2.0);
                this.scaleEyeX = map(Math.abs(this.velX), 0, 100, 1, 1.2);
                this.scaleEyeY = map(Math.abs(this.velX * 2), 0, 100, 1, 0.1);
                this.scaleMouth = Math.min(
                    Math.max(map(Math.abs(this.velX * 1.5), 0, 100, 0, 10),
                    map(Math.abs(this.velY * 1.2), 0, 100, 0, 5)),
                    2
                );

                if (clicked) {
                    this.scaleEyeY = 0.4;
                    this.scaleMouth = -this.scaleMouth;
                }

                this.el.style.transform = `translate(${this.pos.x}px, ${this.pos.y}px) scale(.7) skew(${this.skewX}deg) rotate(${-this.skewX}deg) scaleY(${this.scaleY})`;
                this.eyes.style.transform = `translateX(-50%) scale(${this.scaleEyeX}, ${this.scaleEyeY})`;
                this.mouth.style.transform = `translate(${(-this.skewX * 0.5 - 10)}px) scale(${this.scaleMouth})`;
            }
        }

        function map(num, in_min, in_max, out_min, out_max) {
            return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
        }

        const ghostCursor = new GhostFollow();

        const render = () => {
            requestAnimationFrame(render);
            ghostCursor.follow();
        };
        render();
    }
});
