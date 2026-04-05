"use client";

import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";

const KOREA_CENTER: [number, number] = [36.5, 127.5];
const DEFAULT_ZOOM = 7;

export default function Map() {
  return (
    <MapContainer
      center={KOREA_CENTER}
      zoom={DEFAULT_ZOOM}
      zoomControl={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="topright" />
      <MarkerClusterGroup chunkedLoading>
        {/* Markers will be populated from DB data */}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
