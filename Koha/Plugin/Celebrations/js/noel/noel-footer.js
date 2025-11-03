/*
  Section : lumière de noel
	Attribution :
      Code inspiré, modifié et adapté pour l'OPAC de Koha à partir du Pen original sur CodePen.io.
      Copyright (c) Matt Blenkinsop - https://codepen.io/mblenk/pen/qBKwNmp
*/
document.addEventListener('DOMContentLoaded', function() {
        const christmasLight = `
             <div id="lightcontainer" class="lightcontainer">
                <ul id="lightrope" class="lightrope">
                    <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
                    <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
                    <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
                </ul>
             </div>
        `
  //
  // Création du footer noel
  //
  const newFooter = document.createElement('footer');
    newFooter.id = 'celebration-footer';
    document.body.appendChild(newFooter);
    newFooter.insertAdjacentHTML('beforeend', christmasLight);
  //
  // Insertion du footer au bon endroit :
  // - Si #changelanguage existe → on insère avant lui
  // - Sinon → on ajoute à la fin du body
  //
  const existingFooter = document.getElementById('changelanguage');
  if (existingFooter) {
    existingFooter.parentNode.insertBefore(newFooter, existingFooter);
  } else {
    document.body.appendChild(newFooter);
  }
});
