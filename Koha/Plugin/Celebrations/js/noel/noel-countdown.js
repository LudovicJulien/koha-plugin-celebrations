/*
    Section : compte à reboure de Noël
	Attribution :
      Code inspiré, modifié et adapté pour l'OPAC de Koha à partir du Pen original sur CodePen.io.
      Copyright (c) Matt Blenkinsop - https://codepen.io/mblenk/pen/vYrMOpJ
*/
window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('days')) return;
  const htmlLang = document.documentElement.lang || "en";
  const langue = htmlLang.slice(0, 2).toLowerCase();
  const isFr = langue === "fr";
  const main = document.querySelector('.main');
  if (!main) return;
  main.insertAdjacentHTML('afterbegin', `
    <div class="container_countdown">
      <p id="days"></p>
    </div>
  `);
  const daysTextLine = document.getElementById('days');
  if (!daysTextLine) return;
  const today = new Date();
  const xmas = new Date(`Dec 25, ${today.getFullYear()}`);
  const daysToChristmas = Math.round((xmas - today) / (1000 * 60 * 60 * 24));
  const messages = {
    en: {
      today: "It's Christmas!! Merry Christmas!",
      past: (n) => `Christmas was ${n} days ago.`,
      future: (n) => `${n} days to Christmas!`
    },
    fr: {
      today: "C’est Noël !! Joyeux Noël !",
      past: (n) => `Noël était il y a ${n} jour${n > 1 ? 's' : ''}.`,
      future: (n) => `Plus que ${n} jour${n > 1 ? 's' : ''} avant Noël !`
    }
  };
  const msg = isFr ? messages.fr : messages.en;
  if (daysToChristmas === 0)
    daysTextLine.textContent = msg.today;
  else if (daysToChristmas < 0)
    daysTextLine.textContent = msg.past(-daysToChristmas);
  else
    daysTextLine.textContent = msg.future(daysToChristmas);
});
