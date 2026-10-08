import React from 'react';

interface OfficialDocumentHeaderProps {
  numeroActe?: string; // Ex: N°035/MCAPNIT/DGL/DPN/DDL-PN ou N°033/MCAPNIT/DGL/DPN/DDL-PN
  dateLieu?: string;   // Ex: Pointe-Noire, le 06 octobre 2026
  destinataireTitre?: string; // Ex: Madame la Directrice Générale des Loisirs
  destinataireVille?: string; // Ex: Brazzaville
  emetteurTitre?: string;    // Ex: Le Directeur Départemental des Loisirs de Pointe-Noire
  showDestinataire?: boolean;
  objet?: string;
  reference?: string;
  className?: string;
}

export const OfficialDocumentHeader: React.FC<OfficialDocumentHeaderProps> = ({
  numeroActe = 'N°035/MCAPNIT/DGL/DPN/DDL-PN',
  dateLieu,
  destinataireTitre,
  destinataireVille,
  emetteurTitre = 'Le Directeur Départemental des Loisirs de Pointe-Noire',
  showDestinataire = false,
  objet,
  reference,
  className = '',
}) => {
  return (
    <div className={`font-garamond text-slate-900 select-text ${className}`}>
      {/* Top 2 Columns Header */}
      <div className="flex justify-between items-start gap-4">
        {/* Left Column : Direction & Ministère Hierarchy */}
        <div className="w-[58%] text-left text-[11pt] sm:text-[11.5pt] leading-snug">
          <p className="font-bold tracking-tight">
            MINISTÈRE DE LA CULTURE, DES ARTS,
            <br />
            DU PATRIMOINE NATIONAL ET DE
            <br />
            L&apos;INDUSTRIE TOURISTIQUE
          </p>
          <p className="text-[10pt] font-semibold tracking-widest my-0.5 text-slate-700">———</p>
          <p className="font-bold">DIRECTION GÉNÉRALE DES LOISIRS</p>
          <p className="text-[10pt] font-semibold tracking-widest my-0.5 text-slate-700">———</p>
          <p className="font-bold">DÉPARTEMENT DE POINTE-NOIRE</p>
          <p className="text-[10pt] font-semibold tracking-widest my-0.5 text-slate-700">———</p>
          <p className="font-bold">
            DIRECTION DÉPARTEMENTALE DES LOISIRS
            <br />
            DE POINTE-NOIRE
          </p>
          <p className="text-[10pt] font-semibold tracking-widest my-0.5 text-slate-700">———</p>
          <p className="font-bold text-[11.5pt] tracking-tight text-slate-950 mt-1">
            {numeroActe}
          </p>
        </div>

        {/* Right Column : Devise République du Congo + Suscription si courrier */}
        <div className="w-[42%] text-center flex flex-col items-center">
          <p className="font-bold text-[12pt] tracking-wide uppercase text-slate-950">
            RÉPUBLIQUE DU CONGO
          </p>
          <p className="italic text-[11pt] text-slate-800 font-medium">
            Unité – Travail – Progrès
          </p>
          <div className="w-24 h-[1px] bg-slate-400 my-1 mx-auto" />

          {/* Destinataire / Suscription si activé */}
          {showDestinataire && (
            <div className="mt-5 text-center text-[12pt] leading-snug space-y-1">
              <p className="italic font-medium">{emetteurTitre}</p>
              <p className="font-bold text-[13pt] my-0.5">À</p>
              <p className="font-bold leading-tight">
                {destinataireTitre || 'Madame la Directrice Générale des Loisirs'}
              </p>
              <p className="italic font-medium">
                {destinataireVille || 'Brazzaville'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Date et lieu aligné à droite */}
      {dateLieu && (
        <div className="text-right mt-4 text-[12pt] italic font-medium">
          {dateLieu}
        </div>
      )}

      {/* Objet et Référence */}
      {(objet || reference) && (
        <div className="mt-5 text-[12.5pt] space-y-1 leading-snug">
          {objet && (
            <p>
              <span className="font-bold">Objet : </span>
              <span className="font-medium">{objet}</span>
            </p>
          )}
          {reference && (
            <p className="italic">
              <span className="font-bold not-italic">Référence : </span>
              <span>{reference}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
