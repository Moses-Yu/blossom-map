"use client";

import { useCallback, useState } from "react";

interface ShareButtonProps {
  species?: string;
  location?: string;
  lat?: number;
  lng?: number;
}

export default function ShareButton({
  species,
  location,
  lat,
  lng,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const getShareUrl = useCallback(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    if (lat && lng) return `${base}?lat=${lat}&lng=${lng}`;
    return base;
  }, [lat, lng]);

  const getShareTitle = useCallback(() => {
    return species ? `${species} 발견! 🌸` : "전국 벚꽃 지도 🌸";
  }, [species]);

  const getShareText = useCallback(() => {
    return location
      ? `${location}에서 벚꽃이 피었어요`
      : "전국 벚나무 위치와 벚꽃길을 한눈에!";
  }, [location]);

  const handleShare = useCallback(async () => {
    const url = getShareUrl();
    const title = getShareTitle();
    const text = getShareText();

    // Use native Web Share API on mobile (includes KakaoTalk, messages, etc.)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User cancelled — fall through to clipboard
      }
    }

    // Fallback: copy link
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [getShareUrl, getShareTitle, getShareText]);

  return (
    <button
      onClick={handleShare}
      className="bg-white rounded-full w-11 h-11 shadow-lg flex items-center justify-center text-cherry-deep hover:bg-cherry-light transition-colors"
      aria-label="공유하기"
      title="공유하기"
    >
      {copied ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5 text-green-600"
        >
          <path
            fillRule="evenodd"
            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.474l6.733-3.367A2.52 2.52 0 0113 4.5z" />
        </svg>
      )}
    </button>
  );
}
