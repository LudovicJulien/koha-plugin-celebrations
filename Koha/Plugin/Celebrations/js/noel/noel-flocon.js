/*
    Section : flocons de neige
	Attribution :
      Code inspiré, modifié et adapté pour l'OPAC de Koha à partir du Pen original sur CodePen.io.
      Copyright (c) Matt Blenkinsop - https://codepen.io/mblenk/pen/rNKbVab
*/
document.addEventListener('DOMContentLoaded', function() {
    const isInIframe = window.self !== window.top;
    var options = window["noelThemeOptions"] || {};
    if (!options || Object.keys(options).length === 0) {
        console.error("Les options de thème Noël n'ont pas été trouvées ou sont vides. Les valeurs par défaut seront utilisées. (vitesse:normale, taille:normale, vent:off, quantite:10)");
        options = {};
    }
    var vitesse = options.vitesse_flocons || 'vitesse_normal';
    var taille = options.taille_flocons || 'taille_normal';
    var vent = options.vent_flocons || 'vent_null';
    var quantite = parseInt(options.quantite_flocons) || 10;
    var vitesseCoeff = 0.1;
    switch(vitesse) {
        case 'vitesse_lent': vitesseCoeff = 0.05; break;
        case 'vitesse_rapide': vitesseCoeff = 0.2; break;
    }
    var tailleCoeff = 10;
    switch(taille) {
        case 'taille_petit': tailleCoeff = 5; break;
        case 'taille_grand': tailleCoeff = 20; break;
    }
    var ventCoeff = 0;
    switch(vent) {
        case 'vent_normale': ventCoeff = 1; break;
        case 'vent_fort': ventCoeff = 3; break;
    }
    var quantite_flocons = (function() {
        var flakes;
        var flakesTotal = quantite;
        var wind = ventCoeff;
        var mouseX = -500;
        var mouseY = -500;
        function quantite_flocons(size, x, y, vx, vy) {
            this.size = size;
            this.x = x;
            this.y = y;
            this.vx = vx;
            this.vy = vy;
            this.hit = false;
            this.melt = false;
            this.div = document.createElement('div');
            this.div.classList.add('quantite_flocons');
            this.div.style.width = this.size + 'px';
            this.div.style.height = this.size + 'px';
            this.div.style.position = 'fixed';
            this.div.style.top = '0';
            this.div.style.left = '0';
            this.div.style.pointerEvents = 'none';
            this.div.style.zIndex = '9999';
            this.div.style.background = 'white';
            this.div.style.borderRadius = '50%';
            this.div.style.opacity = '0.8';
        }
        quantite_flocons.prototype.move = function() {
            if (this.hit) {
                if (Math.random() > 0.995) this.melt = true;
            } else {
                this.x += this.vx + Math.min(Math.max(wind, -10), 10);
                this.y += this.vy;
            }
            if (this.x > window.innerWidth) {
                this.x = 0;
            }
            if (this.x < 0) {
                this.x = window.innerWidth;
            }
            if (this.y > window.innerHeight + this.size) {
                this.x = Math.random() * window.innerWidth;
                this.y = -this.size;
                this.melt = false;
            }
            var dx = mouseX - this.x;
            var dy = mouseY - this.y;
            this.hit = !this.melt && this.y < mouseY && dx * dx + dy * dy < 2400;
        };
        quantite_flocons.prototype.draw = function() {
            this.div.style.transform =
            this.div.style.MozTransform =
            this.div.style.webkitTransform =
                'translate3d(' + this.x + 'px,' + this.y + 'px,0)';
        };
        function update() {
            for (var i = flakes.length; i--;) {
                var flake = flakes[i];
                flake.move();
                flake.draw();
            }
            requestAnimationFrame(update);
        }
        quantite_flocons.init = function(container) {
            flakes = [];
            for (var i = flakesTotal; i--;) {
                var size = (Math.random() + 0.2) * tailleCoeff + 1;
                var flake = new quantite_flocons(
                    size,
                    Math.random() * window.innerWidth,
                    Math.random() * window.innerHeight,
                    Math.random() - 0.5,
                    Math.max(size * vitesseCoeff, 1)
                );
                container.appendChild(flake.div);
                flakes.push(flake);
            }
            window.ondeviceorientation = function(event) {
                if (event) {
                    wind = event.gamma / 10;
                }
            };
            update();
        };
        return quantite_flocons;
    }());
    // gestion du cas où le chargement se fait dnas un Iframe
    if (isInIframe) {
       setTimeout(() => {
        quantite_flocons.init(document.body);
    }, 1000);
    } else {
       quantite_flocons.init(document.body);
    }
});
