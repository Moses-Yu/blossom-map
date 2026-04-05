import MapLoader from "@/components/MapLoader";
import DonateButton from "@/components/DonateButton";

export default function Home() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-cherry-pink/20 z-10">
        <h1 className="text-lg font-bold text-cherry-deep">
          🌸 벚꽃구경
        </h1>
        <button
          className="rounded-full bg-cherry-pink/20 px-3 py-1.5 text-sm font-medium text-cherry-deep transition-colors hover:bg-cherry-pink/30"
          aria-label="내 주변 벚꽃 찾기"
        >
          내 주변
        </button>
      </header>

      {/* Map */}
      <main className="flex-1 relative">
        <MapLoader />
        <DonateButton />
      </main>
    </div>
  );
}
