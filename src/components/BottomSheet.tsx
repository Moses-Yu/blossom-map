"use client";

import { useEffect, useRef } from "react";

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

const SPECIES_EMOJI: Record<string, string> = {
  왕벚나무: "🌸",
  벚나무: "🌸",
  겹벚나무: "💮",
  산벚나무: "🏔️",
  올벚나무: "🌷",
};

export default function BottomSheet({
  tree,
  onClose,
}: {
  tree: TreeData | null;
  onClose: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tree) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [tree, onClose]);

  if (!tree) return null;

  const emoji = SPECIES_EMOJI[tree.species] || "🌸";
  const location = [tree.region, tree.district].filter(Boolean).join(" ");

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-[1001] animate-slide-up"
      ref={sheetRef}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/10 z-[-1]"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="bg-white rounded-t-2xl shadow-2xl px-5 pt-3 pb-6 max-w-lg mx-auto">
        {/* Handle */}
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Content */}
        <div className="flex items-start gap-3">
          <span className="text-3xl mt-0.5">{emoji}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-cherry-deep">
              {tree.species}
            </h3>
            {location && (
              <p className="text-sm text-gray-600 mt-0.5">{location}</p>
            )}
            {tree.road_name && (
              <p className="text-sm text-gray-500 mt-0.5">
                📍 {tree.road_name}
              </p>
            )}
            {tree.road_section && (
              <p className="text-sm text-gray-500 mt-0.5">
                🛣️ {tree.road_section}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="닫기"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* 길찾기 CTA */}
        <a
          href={`https://map.naver.com/?lng=${tree.lng}&lat=${tree.lat}&title=${encodeURIComponent(tree.species)}`}
          target="_blank"
          rel="noopener"
          className="bg-cherry-deep text-white rounded-xl py-3 font-semibold mt-4 w-full block text-center"
        >
          길찾기
        </a>
      </div>
    </div>
  );
}
