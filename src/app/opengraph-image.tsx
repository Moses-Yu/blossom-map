import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "벚꽃구경 — 전국 벚꽃 지도";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #FFF0F3 0%, #FFB7C5 50%, #FF8FA3 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 16, display: "flex" }}>
          🌸
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: "#8B1A3A",
            marginBottom: 8,
            display: "flex",
          }}
        >
          벚꽃구경
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: "#C44569",
            marginBottom: 12,
            display: "flex",
          }}
        >
          전국 벚나무 위치와 벚꽃길을 한눈에!
        </div>
        <div
          style={{
            fontSize: 20,
            color: "#8B5E6B",
            display: "flex",
          }}
        >
          산림청 데이터 기반 벚꽃 명소 지도
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 24,
            fontSize: 16,
            color: "#B8889A",
            display: "flex",
          }}
        >
          전국 벚꽃 지도 서비스
        </div>
      </div>
    ),
    { ...size }
  );
}
