document.addEventListener('DOMContentLoaded', function() {
        // var lightContainer = document.createElement('div');
        // lightContainer.className = 'lightcontainer';
        // var ul = document.createElement('ul');
        // ul.className = 'lightrope';
        // ul.innerHTML = `
        //     <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
        //     <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
        //     <li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li><li></li>
        // `;
        // lightContainer.appendChild(ul);
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
