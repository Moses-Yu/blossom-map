"use client";

import { useState } from "react";

const TOSS_SEND_URL = process.env.NEXT_PUBLIC_TOSS_SEND_URL || "";

export default function DonateButton() {
  const [showModal, setShowModal] = useState(false);

  if (!TOSS_SEND_URL) return null;

  return (
    <>
      {/* Floating donate button */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-3 z-[1000] bg-cherry-deep text-white rounded-full px-4 py-2.5 shadow-lg flex items-center gap-1.5 text-sm font-medium hover:bg-[#E8627C] transition-colors"
      >
        <span>🌸</span>
        <span>후원하기</span>
      </button>

      {/* Donate modal */}
      {showModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-slide-up">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
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

            <div className="text-center">
              <span className="text-5xl">🌸</span>
              <h2 className="text-xl font-bold text-cherry-deep mt-3">
                벚꽃 후원하기
              </h2>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                벚꽃구경 서비스가 마음에 드셨다면
                <br />
                작은 응원을 보내주세요!
              </p>

              <a
                href={TOSS_SEND_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center justify-center gap-2 bg-[#0064FF] text-white rounded-xl px-6 py-3 font-medium text-base hover:bg-[#0055DD] transition-colors w-full"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5.5h-2.84v1.26c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V18.5h2.84v-1.24c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-4.16-3.35z" />
                </svg>
                토스로 후원하기
              </a>

              <p className="text-xs text-gray-400 mt-3">
                토스 송금으로 연결됩니다
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
