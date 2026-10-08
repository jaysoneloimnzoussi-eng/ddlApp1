/**
 * Service d'impression vectorielle A4 haute fidélité pour l'administration DDL-PN
 * Garantit l'impression propre dans tous les navigateurs et environnements iframes.
 */

export function printHtmlElement(elementId: string, documentTitle: string = 'Document Officiel DDL-PN'): void {
  const targetElement = document.getElementById(elementId);
  if (!targetElement) {
    console.warn(`Élément #${elementId} introuvable pour l'impression, fallback sur window.print()`);
    window.print();
    return;
  }

  // Clone HTML content
  const contentHtml = targetElement.innerHTML;

  // Création d'une iframe d'impression isolée pour éviter les contraintes d'overflow du layout parent
  const existingFrame = document.getElementById('ddl-print-frame');
  if (existingFrame) {
    existingFrame.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'ddl-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.top = '0';
  iframe.style.width = '210mm';
  iframe.style.minHeight = '297mm';
  iframe.style.border = '0';
  iframe.style.opacity = '0.01';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(`
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>${documentTitle}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600;1,700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 20mm 20mm 20mm 25mm; /* Marges officielles congolaises : G 2.5cm, D 2.0cm, H 2.0cm, B 2.0cm */
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'EB Garamond', Garamond, 'Times New Roman', serif;
            font-size: 13pt;
            line-height: 1.45;
          }
          .font-garamond {
            font-family: 'EB Garamond', Garamond, 'Times New Roman', serif !important;
          }
          .font-cinzel {
            font-family: 'Cinzel', serif !important;
          }
          .font-mono {
            font-family: 'JetBrains Mono', monospace !important;
          }
          .page-a4 {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            page-break-after: always;
          }
          .page-a4:last-child {
            page-break-after: auto;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            border: 1px solid #1e293b;
            padding: 6px 8px;
            font-size: 11.5pt;
          }
          th {
            background-color: #f1f5f9 !important;
            color: #000000 !important;
            font-weight: bold;
          }
          .no-print, button {
            display: none !important;
          }
          p {
            margin-top: 0;
            margin-bottom: 0.75rem;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          ${contentHtml}
        </div>
      </body>
    </html>
  `);
  doc.close();

  // Attendre le chargement des polices et styles avant d'appeler l'impression
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn("Impression iframe bloquée, utilisation de window.print()", e);
      window.print();
    }
  }, 400);
}
