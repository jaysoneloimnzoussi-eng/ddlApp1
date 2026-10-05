import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  UploadCloud,
  FileSpreadsheet,
  Code,
  Globe,
  Database,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ChevronRight,
  Layers,
  Key,
  Download,
  FileText,
  Cloud,
  Trash2,
} from 'lucide-react';
import {
  ImportTargetCollection,
  ImportPreviewItem,
  parseCsv,
  parseJson,
  fetchFromSupabaseApi,
  generateAutoMapping,
  mapAndValidateRecord,
  executeFirestoreImport,
} from '../../services/dataImportService';

export const SupabaseDataImportModule: React.FC = () => {
  const { theme, showNotification, addAuditLog, setActiveModule, establishments } = useApp();

  // Selected Target Collection in Firestore
  const [targetCollection, setTargetCollection] = useState<ImportTargetCollection>('establishments');

  // Input Mode: Direct API (default), File CSV/JSON, or Paste JSON
  const [inputMode, setInputMode] = useState<'supabase_api' | 'file' | 'json_paste'>('supabase_api');

  // Raw inputs
  const [rawText, setRawText] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');

  // Supabase Direct API inputs
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>('');
  const [supabaseTableName, setSupabaseTableName] = useState<string>('');
  const [isFetchingFromApi, setIsFetchingFromApi] = useState<boolean>(false);

  // Parsed records - empty by default (no demo data)
  const [parsedRows, setParsedRows] = useState<Record<string, any>[]>([]);

  // Column mapping: sourceKey -> targetField
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // Import State
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [importResult, setImportResult] = useState<any>(null);

  // Detect source columns
  const sourceColumns = useMemo(() => {
    if (parsedRows.length === 0) return [];
    const keys = new Set<string>();
    parsedRows.slice(0, 10).forEach((r) => {
      Object.keys(r).forEach((k) => keys.add(k));
    });
    return Array.from(keys);
  }, [parsedRows]);

  // Available Target Fields per collection
  const availableTargetFields = useMemo(() => {
    if (targetCollection === 'establishments') {
      return [
        { key: 'nomCommercial', label: 'Nom Commercial (Obligatoire)', required: true },
        { key: 'promoteurNom', label: 'Nom du Promoteur / Gérant', required: false },
        { key: 'promoteurTelephone', label: 'Téléphone Promoteur', required: false },
        { key: 'promoteurEmail', label: 'Email Promoteur', required: false },
        { key: 'arrondissement', label: 'Arrondissement (Lumumba, Mvou-Mvou...)', required: true },
        { key: 'quartier', label: 'Quartier', required: false },
        { key: 'adresseExacte', label: 'Adresse exacte', required: false },
        { key: 'categorie', label: 'Catégorie de loisirs', required: false },
        { key: 'surfaceM2', label: 'Surface (m²)', required: false },
        { key: 'montantRedevanceAnnuelle', label: 'Redevance Annuelle (FCFA)', required: true },
        { key: 'montantEncaisse', label: 'Montant Encaissé (FCFA)', required: false },
        { key: 'soldeRestantDu', label: 'Solde Restant Dû (FCFA)', required: false },
        { key: 'statut', label: 'Statut de Conformité', required: false },
        { key: 'latitude', label: 'Latitude GPS', required: false },
        { key: 'longitude', label: 'Longitude GPS', required: false },
        { key: 'niveauDecibelsMoyen', label: 'Niveau sonore dB(A)', required: false },
        { key: 'limiteurInstalle', label: 'Limiteur sonore installé (booléen)', required: false },
        { key: 'agentAssigneId', label: 'ID Agent Assigné', required: false },
        { key: 'codeDossier', label: 'Code Dossier Officiel', required: false },
      ];
    } else if (targetCollection === 'receipts') {
      return [
        { key: 'numeroQuittance', label: 'Numéro Quittance', required: true },
        { key: 'datePaiement', label: 'Date Paiement', required: true },
        { key: 'etablissementNom', label: 'Nom Établissement', required: true },
        { key: 'promoteurNom', label: 'Nom Promoteur', required: false },
        { key: 'arrondissement', label: 'Arrondissement', required: false },
        { key: 'montantVerse', label: 'Montant Versé (FCFA)', required: true },
        { key: 'resteAPayer', label: 'Reste à Payer (FCFA)', required: false },
        { key: 'modePaiement', label: 'Mode de Paiement', required: false },
      ];
    } else if (targetCollection === 'schedules') {
      return [
        { key: 'dateTournee', label: 'Date Tournée', required: true },
        { key: 'heure', label: 'Heure', required: true },
        { key: 'etablissementNom', label: 'Établissement', required: true },
        { key: 'arrondissement', label: 'Arrondissement', required: false },
        { key: 'brigadeAssignee', label: 'Brigade Assignée', required: false },
        { key: 'inspecteurChef', label: 'Inspecteur Chef', required: false },
        { key: 'typeMission', label: 'Type de Mission', required: false },
        { key: 'statut', label: 'Statut', required: false },
      ];
    } else {
      return [
        { key: 'referenceNumero', label: 'Numéro Référence', required: true },
        { key: 'type', label: 'Type Acte', required: true },
        { key: 'dateEmission', label: 'Date Émission', required: true },
        { key: 'etablissementNom', label: 'Établissement', required: true },
        { key: 'motifs', label: 'Motifs Légaux', required: true },
        { key: 'delaiHeures', label: 'Délai d\'exécution (heures)', required: false },
      ];
    }
  }, [targetCollection]);

  // Preview Items
  const previewItems: ImportPreviewItem[] = useMemo(() => {
    return parsedRows.map((row, idx) =>
      mapAndValidateRecord(row, columnMapping, targetCollection, idx)
    );
  }, [parsedRows, columnMapping, targetCollection]);

  const validCount = previewItems.filter((i) => i.isValid).length;
  const invalidCount = previewItems.length - validCount;

  // Target Collection switch
  const handleTargetChange = (target: ImportTargetCollection) => {
    setTargetCollection(target);
    if (sourceColumns.length > 0) {
      setColumnMapping(generateAutoMapping(sourceColumns, target));
    }
    setImportResult(null);
  };

  // File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    if (file.name.endsWith('.csv')) {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        try {
          const rows = parseCsv(text);
          if (rows.length === 0) {
            showNotification('warning', 'Le fichier CSV semble vide ou non formaté.');
            return;
          }
          setParsedRows(rows);
          const cols = Object.keys(rows[0] || {});
          setColumnMapping(generateAutoMapping(cols, targetCollection));
          showNotification('success', `${rows.length} lignes extraites du fichier CSV avec succès !`);
        } catch (err: any) {
          showNotification('error', `Erreur lecture CSV : ${err.message}`);
        }
      };
      reader.readAsText(file);
    } else {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        try {
          const rows = parseJson(text);
          if (rows.length === 0) {
            showNotification('warning', 'Le fichier JSON ne contient aucun tableau valide.');
            return;
          }
          setParsedRows(rows);
          const cols = Object.keys(rows[0] || {});
          setColumnMapping(generateAutoMapping(cols, targetCollection));
          showNotification('success', `${rows.length} enregistrements JSON extraits avec succès !`);
        } catch (err: any) {
          showNotification('error', `Erreur JSON invalide : ${err.message}`);
        }
      };
      reader.readAsText(file);
    }
  };

  // Parse Pasted Text
  const handleParsePastedText = () => {
    if (!rawText.trim()) {
      showNotification('warning', 'Veuillez coller du texte JSON ou CSV.');
      return;
    }

    try {
      if (rawText.trim().startsWith('[') || rawText.trim().startsWith('{')) {
        const rows = parseJson(rawText);
        setParsedRows(rows);
        const cols = Object.keys(rows[0] || {});
        setColumnMapping(generateAutoMapping(cols, targetCollection));
        showNotification('success', `${rows.length} enregistrements JSON parsés avec succès !`);
      } else {
        const rows = parseCsv(rawText);
        setParsedRows(rows);
        const cols = Object.keys(rows[0] || {});
        setColumnMapping(generateAutoMapping(cols, targetCollection));
        showNotification('success', `${rows.length} lignes CSV parsées avec succès !`);
      }
    } catch (err: any) {
      showNotification('error', `Erreur de traitement : ${err.message}`);
    }
  };

  // Fetch Supabase API
  const handleFetchSupabaseApi = async () => {
    if (!supabaseUrl.trim() || !supabaseAnonKey.trim() || !supabaseTableName.trim()) {
      showNotification('warning', 'Veuillez renseigner l\'URL Supabase, la clé API et le nom de table.');
      return;
    }

    setIsFetchingFromApi(true);
    try {
      const data = await fetchFromSupabaseApi(supabaseUrl, supabaseAnonKey, supabaseTableName);
      setParsedRows(data);
      const cols = Object.keys(data[0] || {});
      setColumnMapping(generateAutoMapping(cols, targetCollection));
      showNotification('success', `Connexion API Supabase réussie ! ${data.length} enregistrements reçus.`);
    } catch (err: any) {
      showNotification('error', `Erreur API Supabase : ${err.message}`);
    } finally {
      setIsFetchingFromApi(false);
    }
  };

  // Clear loaded data
  const handleClearData = () => {
    setParsedRows([]);
    setColumnMapping({});
    setFileName('');
    setRawText('');
    setImportResult(null);
    showNotification('info', 'Données nettoyées.');
  };

  // Update specific column mapping
  const handleUpdateMapping = (sourceCol: string, targetField: string) => {
    setColumnMapping((prev) => ({
      ...prev,
      [sourceCol]: targetField,
    }));
  };

  // Execute Firestore Migration
  const handleExecuteImport = async () => {
    if (previewItems.length === 0) {
      showNotification('warning', 'Aucune donnée à importer.');
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: previewItems.length });
    setImportResult(null);

    try {
      const payloadList = previewItems.map((p) => p.mappedData);

      const result = await executeFirestoreImport(
        targetCollection,
        payloadList,
        (current, total) => {
          setImportProgress({ current, total });
        }
      );

      setImportResult(result);

      // Audit log entry
      await addAuditLog(
        'MIGRATION_SUPABASE_FIRESTORE',
        targetCollection.toUpperCase(),
        `BATCH-${Date.now()}`,
        `Importation réelle de ${result.successCount}/${result.total} documents Supabase vers Firestore (${targetCollection}). Durée: ${result.durationMs}ms.`
      );

      showNotification(
        result.errorCount === 0 ? 'success' : 'warning',
        `Importation terminée : ${result.successCount} enregistrements réels transférés dans Firestore !`
      );
    } catch (err: any) {
      showNotification('error', `Erreur lors de la migration Firestore : ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className={`p-6 max-w-7xl mx-auto space-y-6 ${
      theme === 'light' ? 'text-slate-900' : 'text-slate-100'
    }`}>
      {/* Top Banner */}
      <div className={`p-6 rounded-2xl border transition-all ${
        theme === 'light'
          ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 border-emerald-200 shadow-sm'
          : 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-sky-950/30 border-emerald-500/30 shadow-xl'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border ${
              theme === 'light'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
            }`}>
              <Database className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  theme === 'light'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                }`}>
                  Passerelle de Migration Réelle
                </span>
                <span className={`text-xs font-mono ${
                  theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  Supabase ➔ Google Firebase Firestore
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold font-cinzel mt-1">
                Importation de vos Données Supabase dans Firestore
              </h1>
              <p className={`text-xs md:text-sm mt-0.5 ${
                theme === 'light' ? 'text-slate-600' : 'text-slate-300'
              }`}>
                Toutes les données de démonstration ont été purgées. Connectez directement votre base Supabase ou chargez votre export pour peupler votre base Firestore.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <div className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-2 ${
              theme === 'light'
                ? 'bg-white border-slate-200 text-slate-700 shadow-xs'
                : 'bg-slate-900/80 border-slate-800 text-slate-300'
            }`}>
              <Cloud className="w-3.5 h-3.5 text-emerald-500" />
              <span>Base Firestore : <strong>ai-studio-ddlpnsovereignen</strong></span>
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>{establishments.length} établissement(s) réel(s) dans Firestore</span>
            </div>
          </div>
        </div>
      </div>

      {/* Target Collection Selection */}
      <div className={`p-5 rounded-xl border ${
        theme === 'light' ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4" />
          Étape 1 : Choisir la Collection Firestore de Destination
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              id: 'establishments',
              title: 'Établissements de loisirs',
              desc: 'Recensement, coordonnées GPS, promoteur, redevance annuelle',
              collection: '/establishments',
            },
            {
              id: 'receipts',
              title: 'Quittances SAF Trésor',
              desc: 'Paiements, reçus officiels, acomptes et solde restant',
              collection: '/receipts',
            },
            {
              id: 'schedules',
              title: 'Planning & Tournées',
              desc: 'Visites de contrôle, brigades SAA, RDV de recouvrement',
              collection: '/schedules',
            },
            {
              id: 'legalActs',
              title: 'Actes Administratifs',
              desc: 'Mises en demeure 72h, procès-verbaux, arrêtés de fermeture',
              collection: '/legalActs',
            },
          ].map((col) => (
            <button
              key={col.id}
              onClick={() => handleTargetChange(col.id as ImportTargetCollection)}
              className={`p-3.5 rounded-lg border text-left transition-all relative ${
                targetCollection === col.id
                  ? theme === 'light'
                    ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                    : 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/40'
                  : theme === 'light'
                    ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-emerald-600">{col.title}</span>
                {targetCollection === col.id && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                )}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{col.desc}</div>
              <div className="text-[10px] font-mono text-slate-400 mt-2">{col.collection}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Source Method Selection Tabs */}
      <div className={`p-5 rounded-xl border ${
        theme === 'light' ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-3 flex items-center gap-2">
          <UploadCloud className="w-4 h-4" />
          Étape 2 : Connecter ou Charger vos Données Supabase
        </div>

        <div className="flex flex-wrap gap-2 mb-4 border-b pb-3 border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setInputMode('supabase_api')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              inputMode === 'supabase_api'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Connexion Directe API Supabase (URL + Clé)
          </button>
          <button
            onClick={() => setInputMode('file')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              inputMode === 'file'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Charger un Fichier Export Supabase (.CSV ou .JSON)
          </button>
          <button
            onClick={() => setInputMode('json_paste')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all ${
              inputMode === 'json_paste'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Coller le JSON / SQL Supabase
          </button>
        </div>

        {/* Tab 1: Direct Supabase API */}
        {inputMode === 'supabase_api' && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border text-xs ${
              theme === 'light' ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
            }`}>
              <strong>Connexion directe à votre projet Supabase :</strong> Entrez l'URL de votre instance Supabase, votre clé API (clé <code>anon</code> ou <code>service_role</code>) et le nom de votre table. Les données seront directement interrogées via l'API REST PostgREST.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  URL du Projet Supabase
                </label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://votre-projet.supabase.co"
                    className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs ${
                      theme === 'light' ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Clé API Supabase (anon ou service_role)
                </label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="password"
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs ${
                      theme === 'light' ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Nom de votre table Supabase
                </label>
                <div className="relative">
                  <Database className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={supabaseTableName}
                    onChange={(e) => setSupabaseTableName(e.target.value)}
                    placeholder="ex: etablissements, recenses, bars..."
                    className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs ${
                      theme === 'light' ? 'bg-slate-50 border-slate-300' : 'bg-slate-950 border-slate-700'
                    }`}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              {parsedRows.length > 0 && (
                <button
                  onClick={handleClearData}
                  className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Effacer
                </button>
              )}
              <button
                onClick={handleFetchSupabaseApi}
                disabled={isFetchingFromApi}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium transition-all shadow-xs flex items-center gap-2"
              >
                {isFetchingFromApi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Récupération de vos données Supabase...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Extraire les données de Supabase
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: File Upload */}
        {inputMode === 'file' && (
          <div className="space-y-3">
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              theme === 'light'
                ? 'border-slate-300 hover:border-emerald-500 bg-slate-50/50'
                : 'border-slate-700 hover:border-emerald-500 bg-slate-950/40'
            }`}>
              <UploadCloud className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
              <div className="text-sm font-semibold mb-1">
                Glissez-déposez votre export Supabase (.csv ou .json)
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                Exportez votre table depuis Supabase via <strong>Table Editor ➔ Export to CSV</strong> ou via SQL Editor.
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium cursor-pointer shadow-sm transition-all">
                <FileText className="w-4 h-4" />
                <span>Sélectionner le fichier exporté...</span>
                <input
                  type="file"
                  accept=".csv,.json,application/json,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {fileName && (
                <div className="mt-3 text-xs font-mono text-emerald-600 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Fichier chargé : <strong>{fileName}</strong> ({parsedRows.length} enregistrements extraits)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Paste JSON */}
        {inputMode === 'json_paste' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-500">
              Collez ci-dessous le résultat de votre export Supabase (ex: tableau d'objets JSON ou <code>SELECT json_agg(t) FROM ...</code>) :
            </div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder='[ { "nom_commercial": "Mon Etablissement", "arrondissement": "Lumumba", "redevance": 350000 } ]'
              rows={6}
              className={`w-full p-3 rounded-lg border font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden ${
                theme === 'light'
                  ? 'bg-slate-50 border-slate-300 text-slate-800'
                  : 'bg-slate-950 border-slate-700 text-slate-200'
              }`}
            />
            <div className="flex justify-end gap-2">
              {parsedRows.length > 0 && (
                <button
                  onClick={handleClearData}
                  className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Effacer
                </button>
              )}
              <button
                onClick={handleParsePastedText}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-xs flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Analyser et Préparer les Données
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Column Mapping (Only shown when user loaded data) */}
      {sourceColumns.length > 0 && (
        <div className={`p-5 rounded-xl border ${
          theme === 'light' ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Étape 3 : Correspondance des Colonnes ({sourceColumns.length} colonnes trouvées dans votre table Supabase)
            </div>
            <button
              onClick={() => setColumnMapping(generateAutoMapping(sourceColumns, targetCollection))}
              className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Auto-détecter les champs
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sourceColumns.map((col) => (
              <div
                key={col}
                className={`p-2.5 rounded-lg border text-xs ${
                  columnMapping[col] && columnMapping[col] !== '__ignore__'
                    ? theme === 'light'
                      ? 'bg-emerald-50/60 border-emerald-300'
                      : 'bg-emerald-950/20 border-emerald-500/40'
                    : theme === 'light'
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-medium text-[11px] truncate" title={col}>
                    {col}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                </div>
                <select
                  value={columnMapping[col] || '__ignore__'}
                  onChange={(e) => handleUpdateMapping(col, e.target.value)}
                  className={`w-full py-1 px-2 rounded text-[11px] border font-medium ${
                    theme === 'light'
                      ? 'bg-white border-slate-300 text-slate-800'
                      : 'bg-slate-900 border-slate-700 text-slate-200'
                  }`}
                >
                  <option value="__ignore__">-- Ignorer cette colonne --</option>
                  {availableTargetFields.map((field) => (
                    <option key={field.key} value={field.key}>
                      ➔ {field.label} {field.required ? '(*)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Preview Table & Migration Button */}
      {previewItems.length > 0 && (
        <div className={`p-5 rounded-xl border ${
          theme === 'light' ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Étape 4 : Prévisualisation de vos Données Supabase ({previewItems.length} lignes)
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Vérifiez les données prêtes à être écrites dans la collection <code>/{targetCollection}</code> de Firestore.
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                validCount === previewItems.length
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
              }`}>
                {validCount} valides • {invalidCount} anomalies
              </span>

              <button
                onClick={handleExecuteImport}
                disabled={isImporting || previewItems.length === 0}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Écriture dans Firestore ({importProgress.current}/{importProgress.total})...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    Transférer dans Firebase Firestore
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress bar during import */}
          {isImporting && (
            <div className="mb-4 space-y-1.5">
              <div className="flex justify-between text-xs font-mono text-emerald-600">
                <span>Écriture dans Firebase Firestore en cours...</span>
                <span>{Math.round((importProgress.current / (importProgress.total || 1)) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full transition-all duration-150"
                  style={{ width: `${(importProgress.current / (importProgress.total || 1)) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Success summary message */}
          {importResult && (
            <div className={`p-4 rounded-xl border mb-4 ${
              importResult.errorCount === 0
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                : 'bg-amber-500/10 border-amber-500 text-amber-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-sm font-bold text-white">
                      Migration terminée avec succès ({importResult.successCount} documents insérés dans Firestore)
                    </div>
                    <div className="text-xs text-slate-300">
                      Temps d'exécution : {importResult.durationMs}ms • Piste d'audit enregistrée
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {targetCollection === 'establishments' && (
                    <button
                      onClick={() => setActiveModule('MOD-02')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <span>Voir le Recensement</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {targetCollection === 'establishments' && (
                    <button
                      onClick={() => setActiveModule('MOD-07')}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <span>Voir la Carte SIG</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {targetCollection === 'receipts' && (
                    <button
                      onClick={() => setActiveModule('MOD-10')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <span>Voir la Régie SAF</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Table Preview */}
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 max-h-96">
            <table className="w-full text-xs text-left">
              <thead className={`uppercase text-[10px] font-bold tracking-wider sticky top-0 ${
                theme === 'light' ? 'bg-slate-100 text-slate-700' : 'bg-slate-950 text-slate-300'
              }`}>
                <tr>
                  <th className="px-3 py-2.5">Statut</th>
                  {targetCollection === 'establishments' && (
                    <>
                      <th className="px-3 py-2.5">Nom Commercial</th>
                      <th className="px-3 py-2.5">Promoteur</th>
                      <th className="px-3 py-2.5">Arrondissement</th>
                      <th className="px-3 py-2.5">Catégorie</th>
                      <th className="px-3 py-2.5">Redevance</th>
                      <th className="px-3 py-2.5">Encaissé</th>
                      <th className="px-3 py-2.5">Solde</th>
                      <th className="px-3 py-2.5">GPS / Décibels</th>
                    </>
                  )}
                  {targetCollection === 'receipts' && (
                    <>
                      <th className="px-3 py-2.5">N° Quittance</th>
                      <th className="px-3 py-2.5">Date</th>
                      <th className="px-3 py-2.5">Établissement</th>
                      <th className="px-3 py-2.5">Montant Versé</th>
                      <th className="px-3 py-2.5">Mode</th>
                    </>
                  )}
                  {targetCollection === 'schedules' && (
                    <>
                      <th className="px-3 py-2.5">Date Tournée</th>
                      <th className="px-3 py-2.5">Heure</th>
                      <th className="px-3 py-2.5">Établissement</th>
                      <th className="px-3 py-2.5">Arrondissement</th>
                      <th className="px-3 py-2.5">Mission</th>
                    </>
                  )}
                  {targetCollection === 'legalActs' && (
                    <>
                      <th className="px-3 py-2.5">Référence</th>
                      <th className="px-3 py-2.5">Type</th>
                      <th className="px-3 py-2.5">Établissement</th>
                      <th className="px-3 py-2.5">Motifs</th>
                      <th className="px-3 py-2.5">Délai</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[11px]">
                {previewItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      !item.isValid ? 'bg-red-500/10' : ''
                    }`}
                  >
                    <td className="px-3 py-2 shrink-0">
                      {item.isValid ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 font-sans font-semibold">
                          Prêt
                        </span>
                      ) : (
                        <span
                          className="px-2 py-0.5 rounded text-[10px] bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 font-sans font-semibold cursor-help"
                          title={item.validationErrors.join(', ')}
                        >
                          Erreur
                        </span>
                      )}
                    </td>

                    {targetCollection === 'establishments' && (
                      <>
                        <td className="px-3 py-2 font-sans font-semibold text-slate-900 dark:text-white">
                          {item.mappedData.nomCommercial}
                        </td>
                        <td className="px-3 py-2 font-sans text-slate-600 dark:text-slate-300">
                          {item.mappedData.promoteurNom}
                        </td>
                        <td className="px-3 py-2 font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {item.mappedData.arrondissement}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-sans text-slate-500 text-[10px]">
                          {item.mappedData.categorie}
                        </td>
                        <td className="px-3 py-2 text-emerald-600 font-semibold">
                          {Number(item.mappedData.montantRedevanceAnnuelle).toLocaleString()} FCFA
                        </td>
                        <td className="px-3 py-2 text-sky-600">
                          {Number(item.mappedData.montantEncaisse || 0).toLocaleString()} FCFA
                        </td>
                        <td className="px-3 py-2 text-amber-600 font-semibold">
                          {Number(item.mappedData.soldeRestantDu || 0).toLocaleString()} FCFA
                        </td>
                        <td className="px-3 py-2 text-slate-400 text-[10px]">
                          {Number(item.mappedData.latitude).toFixed(3)}, {Number(item.mappedData.longitude).toFixed(3)}
                        </td>
                      </>
                    )}

                    {targetCollection === 'receipts' && (
                      <>
                        <td className="px-3 py-2 font-semibold text-emerald-600">
                          {item.mappedData.numeroQuittance}
                        </td>
                        <td className="px-3 py-2">{item.mappedData.datePaiement}</td>
                        <td className="px-3 py-2 font-sans">{item.mappedData.etablissementNom}</td>
                        <td className="px-3 py-2 font-semibold text-emerald-500">
                          {Number(item.mappedData.montantVerse).toLocaleString()} FCFA
                        </td>
                        <td className="px-3 py-2 uppercase">{item.mappedData.modePaiement}</td>
                      </>
                    )}

                    {targetCollection === 'schedules' && (
                      <>
                        <td className="px-3 py-2 font-semibold">{item.mappedData.dateTournee}</td>
                        <td className="px-3 py-2">{item.mappedData.heure}</td>
                        <td className="px-3 py-2 font-sans">{item.mappedData.etablissementNom}</td>
                        <td className="px-3 py-2 font-sans">{item.mappedData.arrondissement}</td>
                        <td className="px-3 py-2 text-[10px]">{item.mappedData.typeMission}</td>
                      </>
                    )}

                    {targetCollection === 'legalActs' && (
                      <>
                        <td className="px-3 py-2 font-semibold text-amber-500">{item.mappedData.referenceNumero}</td>
                        <td className="px-3 py-2 uppercase">{item.mappedData.type}</td>
                        <td className="px-3 py-2 font-sans">{item.mappedData.etablissementNom}</td>
                        <td className="px-3 py-2 text-slate-400 text-[10px] truncate max-w-xs">{item.mappedData.motifs}</td>
                        <td className="px-3 py-2">{item.mappedData.delaiHeures}h</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
