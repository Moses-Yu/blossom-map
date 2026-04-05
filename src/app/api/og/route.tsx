import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const species = searchParams.get("species") || "벚나무";
  const location = searchParams.get("location") || "전국 벚꽃 명소";

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
          background: "linear-gradient(135deg, #FFF0F3 0%, #FFB7C5 50%, #FF8FA3 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 16 }}>🌸</div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: "#8B1A3A",
            marginBottom: 8,
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
          }}
        >
          {species}
        </div>
        <div
          style={{
            fontSize: 22,
            color: "#8B5E6B",
            maxWidth: 500,
            textAlign: "center",
          }}
        >
          {location}
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 24,
            fontSize: 16,
            color: "#B8889A",
          }}
        >
          전국 벚꽃 지도 서비스
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
