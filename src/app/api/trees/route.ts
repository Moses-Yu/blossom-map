import { NextRequest, NextResponse } from "next/server";
import { getTreesInBounds, getAllCherryRoads, getTreeStats } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // GET /api/trees?bounds=minLat,maxLat,minLng,maxLng
  const bounds = searchParams.get("bounds");
  if (bounds) {
    const [minLat, maxLat, minLng, maxLng] = bounds.split(",").map(Number);
    if ([minLat, maxLat, minLng, maxLng].some(isNaN)) {
      return NextResponse.json({ error: "Invalid bounds" }, { status: 400 });
    }
    const limit = Math.min(Number(searchParams.get("limit")) || 5000, 10000);
    const trees = await getTreesInBounds(minLat, maxLat, minLng, maxLng, limit);
    return NextResponse.json({ trees, count: trees.length });
  }

  // GET /api/trees?roads=1
  if (searchParams.get("roads")) {
    const roads = await getAllCherryRoads();
    return NextResponse.json({ roads, count: roads.length });
  }

  // GET /api/trees?stats=1
  if (searchParams.get("stats")) {
    const stats = await getTreeStats();
    return NextResponse.json({ stats });
  }

  return NextResponse.json(
    { error: "Provide ?bounds=minLat,maxLat,minLng,maxLng or ?roads=1 or ?stats=1" },
    { status: 400 }
  );
}
