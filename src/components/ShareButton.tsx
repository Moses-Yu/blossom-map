"use client";

import { useCallback, useState } from "react";

interface ShareButtonProps {
  species?: string;
  location?: string;
  lat?: number;
  lng?: number;
}

declare global {
  interface Window {
    Kakao?: {
      init: (appKey: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: Record<string, unknown>) => void;
      };
    };
  }
}

export default function ShareButton({
  species,
  location,
  lat,
  lng,
}: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);

  const getShareUrl = useCallback(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    if (lat && lng) return `${base}?lat=${lat}&lng=${lng}`;
    return base;
  }, [lat, lng]);

  const shareKakao = useCallback(() => {
    const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
    if (!kakaoKey) {
      // Fallback to clipboard share
      shareCopy();
      return;
    }

    if (window.Kakao && !window.Kakao.isInitialized()) {
      window.Kakao.init(kakaoKey);
    }

    const shareUrl = getShareUrl();
    const title = species
      ? `${species} 발견! 🌸`
      : "전국 벚꽃 지도 🌸";
    const description = location
      ? `${location}에서 벚꽃이 피었어요`
      : "전국 벚나무 위치와 벚꽃길을 한눈에!";

    window.Kakao?.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description,
        imageUrl: `${shareUrl}/api/og?species=${encodeURIComponent(species || "벚나무")}&location=${encodeURIComponent(location || "전국 벚꽃 명소")}`,
        link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
      },
      buttons: [
        {
          title: "벚꽃 구경하기",
          link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
        },
      ],
    });
    setShowMenu(false);
  }, [species, location, getShareUrl]);

  const shareCopy = useCallback(async () => {
    const url = getShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      // Could show a toast, but keep it simple
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    setShowMenu(false);
  }, [getShareUrl]);

  const shareNative = useCallback(async () => {
    const url = getShareUrl();
    const title = species ? `${species} 발견! 🌸` : "전국 벚꽃 지도 🌸";
    try {
      await navigator.share({ title, url });
    } catch {
      // User cancelled or not supported
    }
    setShowMenu(false);
  }, [species, getShareUrl]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="bg-white rounded-full w-11 h-11 shadow-lg flex items-center justify-center text-cherry-deep hover:bg-cherry-light transition-colors"
        aria-label="공유하기"
        title="공유하기"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.474l6.733-3.367A2.52 2.52 0 0113 4.5z" />
        </svg>
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-[-1]" onClick={() => setShowMenu(false)} />
          <div className="absolute bottom-14 right-0 bg-white rounded-xl shadow-xl py-2 min-w-[160px] animate-slide-up">
            <button
              onClick={shareKakao}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-cherry-light/50 flex items-center gap-2"
            >
              💬 카카오톡 공유
            </button>
            {"share" in navigator && (
              <button
                onClick={shareNative}
                className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-cherry-light/50 flex items-center gap-2"
              >
                📤 공유하기
              </button>
            )}
            <button
              onClick={shareCopy}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-cherry-light/50 flex items-center gap-2"
            >
              🔗 링크 복사
            </button>
          </div>
        </>
      )}
    </div>
  );
}
