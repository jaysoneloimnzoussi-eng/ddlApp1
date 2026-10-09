/**
 * Service d'impression vectorielle A4 haute fidélité pour l'administration DDL-PN
 * Conforme aux normes républicaines congolaises : Garamond 13pt, A4 portrait, marges 2.5cm/2.0cm
 * Fonctionne avec fiabilité dans tous les navigateurs et environnements iframes.
 */

export function printHtmlElement(elementId: string, documentTitle: string = 'Document Officiel DDL-PN'): void {
  const targetElement = document.getElementById(elementId);
  if (!targetElement) {
    console.warn(`Élément #${elementId} introuvable pour l'impression, fallback sur window.print()`);
    window.print();
    return;
  }

  // 1. Récupérer ou créer le calque d'impression dédié dans document.body
  let printLayer = document.getElementById('ddl-dedicated-print-layer');
  if (!printLayer) {
    printLayer = document.createElement('div');
    printLayer.id = 'ddl-dedicated-print-layer';
    document.body.appendChild(printLayer);
  }

  // 2. Cloner le nœud à imprimer
  const clone = targetElement.cloneNode(true) as HTMLElement;

  // Retirer les attributs ou styles inline qui doubleraient les marges avec @page
  if (clone.classList.contains('page-a4')) {
    clone.style.padding = '0';
    clone.style.margin = '0';
    clone.style.boxShadow = 'none';
    clone.style.border = 'none';
    clone.style.width = '100%';
    clone.style.maxWidth = '100%';
  }

  const subPages = clone.querySelectorAll('.page-a4');
  subPages.forEach((p) => {
    const el = p as HTMLElement;
    el.style.padding = '0';
    el.style.margin = '0';
    el.style.boxShadow = 'none';
    el.style.border = 'none';
    el.style.width = '100%';
    el.style.maxWidth = '100%';
  });

  // Insérer le contenu dans le calque dédié
  printLayer.innerHTML = '';
  printLayer.appendChild(clone);

  // 3. Sauvegarder le titre original et appliquer le titre officiel du document
  const originalTitle = document.title;
  document.title = documentTitle;

  // 4. Activer le mode impression isolée sur le body
  document.body.classList.add('ddl-printing-active');

  // 5. Nettoyage après impression
  let isCleanedUp = false;
  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    document.body.classList.remove('ddl-printing-active');
    document.title = originalTitle;
    if (printLayer) {
      printLayer.innerHTML = '';
    }
    window.removeEventListener('afterprint', cleanup);
  };

  window.addEventListener('afterprint', cleanup);

  // Fallback de sécurité si afterprint n'est pas déclenché par le navigateur
  setTimeout(() => {
    cleanup();
  }, 4000);

  // 6. Déclencher l'impression native du navigateur
  try {
    window.print();
  } catch (err) {
    console.error("Erreur lors du déclenchement de window.print() :", err);
    cleanup();
  }
}

