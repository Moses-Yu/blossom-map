"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-cherry-light">
      <div className="text-center">
        <span className="text-4xl">🌸</span>
        <p className="mt-2 text-sm text-cherry-deep">지도 불러오는 중...</p>
      </div>
    </div>
  ),
});

export default function MapLoader() {
  return <Map />;
}
