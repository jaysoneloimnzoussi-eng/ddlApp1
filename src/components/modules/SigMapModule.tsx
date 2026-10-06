import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import L from 'leaflet';
import {
  Map as MapIcon,
  Volume2,
  Filter,
  Layers,
  MapPin,
  Building,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Navigation,
  Compass,
  Car,
} from 'lucide-react';
import { ComplianceStatus, Arrondissement, Establishment, QUARTIERS_PAR_ARRONDISSEMENT } from '../../types';

export const SigMapModule: React.FC = () => {
  const { visibleEstablishments, establishments, openPrintModal, setActiveModule, currentUserRole, authenticatedUser } = useApp();

  const isFieldAgent = currentUserRole !== 'directeur' && currentUserRole !== 'administrateur';
  const scopedEstablishments = isFieldAgent ? visibleEstablishments : establishments;

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const circlesLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedArr, setSelectedArr] = useState<string>('all');
  const [selectedQuartier, setSelectedQuartier] = useState<string>('all');
  const [showAcousticHeatmap, setShowAcousticHeatmap] = useState<boolean>(true);

  // Itinerary calculation state
  const [isItineraryMode, setIsItineraryMode] = useState<boolean>(false);
  const [selectedWaypoints, setSelectedWaypoints] = useState<string[]>([
    scopedEstablishments[0]?.id || '',
    scopedEstablishments[1]?.id || '',
    scopedEstablishments[2]?.id || '',
  ]);
  const [itineraryStats, setItineraryStats] = useState<{ distanceKm: number; etaMinutes: number } | null>(null);

  // Status colors
  const statusColors: Record<ComplianceStatus, string> = {
    en_regle: '#10b981',              // Vert
    attestation_provisoire: '#3b82f6',// Bleu
    mise_en_demeure: '#f59e0b',       // Orange
    ferme_contentieux: '#ef4444',     // Rouge
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center of Pointe-Noire (Grand Marché / Lumumba)
      const map = L.map(mapContainerRef.current, {
        center: [-4.795, 11.854],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | DDL-PN SIG',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      circlesLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }
  }, []);

  // Update Markers, Heatmap & Route
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !circlesLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    circlesLayerRef.current.clearLayers();
    if (routeLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    const filtered = scopedEstablishments.filter((est) => {
      const matchStatus = selectedStatus === 'all' || est.statut === selectedStatus;
      const matchArr = selectedArr === 'all' || est.arrondissement === selectedArr;
      const matchQuartier =
        selectedQuartier === 'all' ||
        (est.quartier && est.quartier.toLowerCase().includes(selectedQuartier.toLowerCase()));
      return matchStatus && matchArr && matchQuartier;
    });

    filtered.forEach((est) => {
      const color = statusColors[est.statut] || '#94a3b8';

      // 1. Acoustic Heatmap circle
      if (showAcousticHeatmap) {
        const dB = est.niveauDecibelsMoyen || 60;
        let circleColor = '#10b981';
        let circleRadius = 150;
        let fillOpacity = 0.2;

        if (dB > 90) {
          circleColor = '#dc2626';
          circleRadius = 400;
          fillOpacity = 0.45;
        } else if (dB > 75) {
          circleColor = '#f59e0b';
          circleRadius = 280;
          fillOpacity = 0.35;
        } else if (dB > 70) {
          circleColor = '#3b82f6';
          circleRadius = 200;
          fillOpacity = 0.25;
        }

        const circle = L.circle([est.latitude, est.longitude], {
          color: circleColor,
          fillColor: circleColor,
          fillOpacity: fillOpacity,
          radius: circleRadius,
          weight: 1,
        });

        circle.bindTooltip(
          `<strong>${est.nomCommercial}</strong><br/>Zone sonore: ${dB} dB(A)`,
          { sticky: true }
        );
        circlesLayerRef.current?.addLayer(circle);
      }

      // Check if establishment is in active brigade itinerary
      const waypointIndex = selectedWaypoints.indexOf(est.id);
      const isInItinerary = isItineraryMode && waypointIndex !== -1;

      // 2. Custom Pin Marker
      const customIcon = L.divIcon({
        className: 'custom-pin',
        html: `
          <div style="
            background-color: ${isInItinerary ? '#f59e0b' : color};
            width: ${isInItinerary ? '32px' : '28px'};
            height: ${isInItinerary ? '32px' : '28px'};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #0f172a;
            font-weight: bold;
            font-size: 11px;
          ">
            ${isInItinerary ? `#${waypointIndex + 1}` : est.niveauDecibelsMoyen > 80 ? '🔊' : '★'}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([est.latitude, est.longitude], { icon: customIcon });

      // Popup Content
      const popupHtml = `
        <div style="font-family: sans-serif; font-size: 12px; min-width: 220px; color: #0f172a;">
          <h4 style="margin: 0 0 4px 0; font-weight: bold; font-size: 13px; color: #047857;">${est.nomCommercial}</h4>
          <p style="margin: 0 0 4px 0; font-size: 11px; color: #475569;">
            ${est.arrondissement} • ${est.quartier}
          </p>
          <div style="margin: 6px 0; padding: 6px 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px;">
            <strong>Promoteur :</strong> ${est.promoteurNom}<br/>
            <strong>Tél :</strong> ${est.promoteurTelephone}<br/>
            <strong>Décibels :</strong> <span style="font-weight:bold; color: ${est.niveauDecibelsMoyen > 80 ? '#dc2626' : '#047857'};">${est.niveauDecibelsMoyen} dB(A)</span><br/>
            <strong>Limiteur :</strong> ${est.limiteurInstalle ? 'Homologué Présent' : 'Non détecté'}<br/>
            <strong>Statut :</strong> <span style="font-weight:bold; text-transform:uppercase;">${est.statut.replace('_', ' ')}</span>
          </div>
          <div style="font-size: 10px; color: #64748b; font-family: monospace;">Réf: ${est.codeDossier}</div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      markersLayerRef.current?.addLayer(marker);
    });

    // 3. Draw Itinerary Route if active
    if (isItineraryMode && selectedWaypoints.length >= 2) {
      const points: [number, number][] = [];
      selectedWaypoints.forEach((id) => {
        const item = scopedEstablishments.find((e) => e.id === id);
        if (item) points.push([item.latitude, item.longitude]);
      });

      if (points.length >= 2) {
        const polyline = L.polyline(points, {
          color: '#f59e0b',
          weight: 4,
          dashArray: '8, 8',
          opacity: 0.9,
        }).addTo(mapInstanceRef.current);
        routeLayerRef.current = polyline;

        // Calculate rough distance
        let totalDist = 0;
        for (let i = 0; i < points.length - 1; i++) {
          const latDiff = (points[i + 1][0] - points[i][0]) * 111;
          const lngDiff = (points[i + 1][1] - points[i][1]) * 111 * Math.cos((points[i][0] * Math.PI) / 180);
          totalDist += Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
        }
        const distKm = Number(totalDist.toFixed(1));
        const eta = Math.round(distKm * 4 + points.length * 20); // 4 min/km + 20 min inspection per point
        setItineraryStats({ distanceKm: distKm, etaMinutes: eta });
      }
    } else {
      setItineraryStats(null);
    }
  }, [scopedEstablishments, selectedStatus, selectedArr, showAcousticHeatmap, isItineraryMode, selectedWaypoints]);

  const handleToggleWaypoint = (id: string) => {
    setSelectedWaypoints((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              MOD-07
            </span>
            <h1 className="font-cinzel text-xl md:text-2xl font-bold text-slate-100">
              SIG & Cartographie Territoriale Interactive
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualisation géospatiale des 6 arrondissements de Pointe-Noire, Heatmap Acoustique nocturne & calcul d'itinéraires des brigades
          </p>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsItineraryMode(!isItineraryMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
              isItineraryMode
                ? 'bg-amber-600/30 text-amber-300 border-amber-500 shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-slate-100'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Itinéraires Brigades SAA : {isItineraryMode ? 'ACTIF' : 'INACTIF'}</span>
          </button>

          <button
            onClick={() => setShowAcousticHeatmap(!showAcousticHeatmap)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
              showAcousticHeatmap
                ? 'bg-rose-950/40 text-rose-300 border-rose-800'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Heatmap Acoustique : {showAcousticHeatmap ? 'ACTIF' : 'INACTIF'}</span>
          </button>
        </div>
      </div>

      {/* Control Filters & Itinerary Planner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Statut Régalien :
          </span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
          >
            <option value="all">Tous les Statuts</option>
            <option value="en_regle">En Règle (Vert)</option>
            <option value="attestation_provisoire">Attestation Provisoire (Bleu)</option>
            <option value="mise_en_demeure">Mise en Demeure 72h (Orange)</option>
            <option value="ferme_contentieux">Fermé Contentieux (Rouge)</option>
          </select>

          <span className="text-slate-400 font-semibold ml-2">Arrondissement :</span>
          <select
            value={selectedArr}
            onChange={(e) => {
              setSelectedArr(e.target.value);
              setSelectedQuartier('all');
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
          >
            <option value="all">Tous les 6 Arrondissements</option>
            <option value="Lumumba">1. Lumumba</option>
            <option value="Mvou-Mvou">2. Mvou-Mvou</option>
            <option value="Tié-Tié">3. Tié-Tié</option>
            <option value="Loandjili">4. Loandjili</option>
            <option value="Mongo-Mpoukou">5. Mongo-Mpoukou</option>
            <option value="Ngoyo">6. Ngoyo</option>
          </select>

          <span className="text-slate-400 font-semibold ml-2">Quartier :</span>
          <select
            value={selectedQuartier}
            onChange={(e) => setSelectedQuartier(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-slate-200"
          >
            <option value="all">
              {selectedArr === 'all' ? 'Tous les Quartiers' : `Quartiers (${selectedArr})`}
            </option>
            {(selectedArr !== 'all'
              ? QUARTIERS_PAR_ARRONDISSEMENT[selectedArr as Arrondissement] || []
              : Array.from(new Set(Object.values(QUARTIERS_PAR_ARRONDISSEMENT).flat()))
            ).map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </div>

        {/* Itinerary info pill */}
        {isItineraryMode && itineraryStats && (
          <div className="flex items-center gap-3 px-3 py-1 bg-amber-950/40 border border-amber-800 rounded-lg text-amber-200 font-mono text-[11px]">
            <span className="flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-amber-400" />
              Circuit Brigade : <strong>{itineraryStats.distanceKm} km</strong>
            </span>
            <span>•</span>
            <span>Durée estimée : <strong>{itineraryStats.etaMinutes} min</strong></span>
          </div>
        )}
      </div>

      {/* Itinerary Selection Strip (if itinerary mode is active) */}
      {isItineraryMode && (
        <div className="bg-slate-900 border border-amber-800/60 rounded-xl p-3 text-xs space-y-2 shrink-0">
          <div className="flex justify-between items-center">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Navigation className="w-4 h-4" />
              Sélectionnez les étapes de la brigade pour calculer le tracé optimal :
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {selectedWaypoints.length} établissements choisis
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {scopedEstablishments.map((est) => {
              const isChecked = selectedWaypoints.includes(est.id);
              const orderIdx = selectedWaypoints.indexOf(est.id);
              return (
                <button
                  key={est.id}
                  onClick={() => handleToggleWaypoint(est.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap transition border flex items-center gap-1.5 ${
                    isChecked
                      ? 'bg-amber-600/30 text-amber-300 border-amber-500 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {isChecked && (
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] flex items-center justify-center font-bold">
                      {orderIdx + 1}
                    </span>
                  )}
                  <span>{est.nomCommercial}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 rounded-xl overflow-hidden border border-slate-800 shadow-2xl relative min-h-[450px]">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};
