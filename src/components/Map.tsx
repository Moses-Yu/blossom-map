"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  ZoomControl,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import BottomSheet from "./BottomSheet";
import ShareButton from "./ShareButton";

// ── Types ──────────────────────────────────────────────
interface TreeData {
  id: number;
  species: string;
  lat: number;
  lng: number;
  road_section: string | null;
  region: string | null;
  district: string | null;
  road_name: string | null;
}

// ── Constants ──────────────────────────────────────────
const KOREA_CENTER: [number, number] = [36.5, 127.5];
const DEFAULT_ZOOM = 7;
const MIN_ZOOM_FOR_MARKERS = 7;

// ── Cherry blossom SVG marker ──────────────────────────
const CHERRY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
  <circle cx="12" cy="12" r="10" fill="#FFB7C5" stroke="#FF8FA3" stroke-width="1.5" opacity="0.9"/>
  <path d="M12 6 L13.5 10 L12 9 L10.5 10 Z" fill="#FF8FA3" opacity="0.8"/>
  <path d="M12 6 L13.5 10 L12 9 L10.5 10 Z" fill="#FF8FA3" opacity="0.8" transform="rotate(72 12 12)"/>
  <path d="M12 6 L13.5 10 L12 9 L10.5 10 Z" fill="#FF8FA3" opacity="0.8" transform="rotate(144 12 12)"/>
  <path d="M12 6 L13.5 10 L12 9 L10.5 10 Z" fill="#FF8FA3" opacity="0.8" transform="rotate(216 12 12)"/>
  <path d="M12 6 L13.5 10 L12 9 L10.5 10 Z" fill="#FF8FA3" opacity="0.8" transform="rotate(288 12 12)"/>
  <circle cx="12" cy="12" r="2.5" fill="#FFE0E6"/>
</svg>`;

const cherryIcon = L.divIcon({
  html: CHERRY_SVG,
  className: "cherry-marker",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

// Cluster icon factory
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createClusterIcon(cluster: any) {
  const count = cluster.getChildCount();
  let size = "small";
  let dim = 36;
  if (count > 100) {
    size = "large";
    dim = 52;
  } else if (count > 10) {
    size = "medium";
    dim = 44;
  }
  return L.divIcon({
    html: `<div class="cherry-cluster cherry-cluster-${size}"><span>${count >= 1000 ? Math.round(count / 1000) + "k" : count}</span></div>`,
    className: "cherry-cluster-wrapper",
    iconSize: [dim, dim],
  });
}

// ── Map event handler ──────────────────────────────────
function MapEvents({
  onBoundsChange,
}: {
  onBoundsChange: (bounds: L.LatLngBounds, zoom: number) => void;
}) {
  const map = useMapEvents({
    moveend: () => {
      onBoundsChange(map.getBounds(), map.getZoom());
    },
    zoomend: () => {
      onBoundsChange(map.getBounds(), map.getZoom());
    },
  });

  useEffect(() => {
    onBoundsChange(map.getBounds(), map.getZoom());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// ── Main Map component ─────────────────────────────────
export default function Map() {
  const [trees, setTrees] = useState<TreeData[]>([]);
  const [selectedTree, setSelectedTree] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [treeCount, setTreeCount] = useState(0);
  const abortRef = useRef<AbortController | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const fetchTrees = useCallback(
    async (bounds: L.LatLngBounds, currentZoom: number) => {
      setZoom(currentZoom);

      if (currentZoom < MIN_ZOOM_FOR_MARKERS) {
        setTrees([]);
        setTreeCount(0);
        return;
      }

      // Abort previous request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const sw = bounds.getSouthWest();
        const ne = bounds.getNorthEast();
        const limit = currentZoom >= 14 ? 10000 : 5000;
        const res = await fetch(
          `/api/trees?bounds=${sw.lat},${ne.lat},${sw.lng},${ne.lng}&limit=${limit}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error("API error");
        const data = await res.json();
        setTrees(data.trees || []);
        setTreeCount(data.count || 0);
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleLocateMe = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    map.locate({ setView: true, maxZoom: 14 });
  }, []);

  return (
    <>
      <MapContainer
        center={KOREA_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        className="h-full w-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <ZoomControl position="topright" />
        <MapEvents onBoundsChange={fetchTrees} />

        {zoom >= MIN_ZOOM_FOR_MARKERS && trees.length > 0 && (
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={80}
            spiderfyOnMaxZoom
            showCoverageOnHover={false}
            iconCreateFunction={createClusterIcon}
            disableClusteringAtZoom={16}
          >
            {trees.map((tree) => (
              <Marker
                key={tree.id}
                position={[tree.lat, tree.lng]}
                icon={cherryIcon}
                eventHandlers={{
                  click: () => setSelectedTree(tree),
                }}
              />
            ))}
          </MarkerClusterGroup>
        )}
      </MapContainer>

      {/* Zoom hint overlay */}
      {zoom < MIN_ZOOM_FOR_MARKERS && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg text-sm text-cherry-deep font-medium">
            🌸 지도를 확대해서 벚나무를 찾아보세요
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000]">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow text-xs text-cherry-deep">
            불러오는 중...
          </div>
        </div>
      )}

      {/* Tree count badge */}
      {treeCount > 0 && (
        <div className="absolute top-16 left-3 z-[1000]">
          <div className={`bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow text-xs text-cherry-deep font-medium transition-opacity ${loading ? "opacity-50" : "opacity-100"}`}>
            {treeCount.toLocaleString()}그루
          </div>
        </div>
      )}

      {/* Right-side floating buttons */}
      <div className={`absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-3 z-[1000] flex flex-col gap-2 transition-opacity ${selectedTree ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <ShareButton
          species={selectedTree?.species}
          location={
            selectedTree
              ? [selectedTree.region, selectedTree.district].filter(Boolean).join(" ")
              : undefined
          }
          lat={selectedTree?.lat}
          lng={selectedTree?.lng}
        />
        <button
          onClick={handleLocateMe}
          className="bg-white rounded-full w-11 h-11 shadow-lg flex items-center justify-center text-cherry-deep hover:bg-cherry-light transition-colors"
          aria-label="내 주변 벚꽃"
          title="내 주변 벚꽃"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-5 h-5"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          </svg>
        </button>
      </div>

      {/* Bottom Sheet */}
      <BottomSheet tree={selectedTree} onClose={() => setSelectedTree(null)} />
    </>
  );
}
