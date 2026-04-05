import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "trees.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH, { readonly: true });
    _db.pragma("journal_mode = WAL");
  }
  return _db;
}

export interface TreeRow {
  id: number;
  species: string;
  lat: number;
  lng: number;
  road_section: string | null;
  region: string | null;
  district: string | null;
  road_name: string | null;
}

export interface CherryRoadRow {
  id: number;
  name: string;
  region: string | null;
  start_lat: number | null;
  start_lng: number | null;
  end_lat: number | null;
  end_lng: number | null;
  length_km: number | null;
  tree_species: string | null;
  description: string | null;
}

export function getTreesInBounds(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
  limit = 5000
): TreeRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT id, species, lat, lng, road_section, region, district, road_name
       FROM trees
       WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?
       LIMIT ?`
    )
    .all(minLat, maxLat, minLng, maxLng, limit) as TreeRow[];
}

export function getAllCherryRoads(): CherryRoadRow[] {
  const db = getDb();
  return db.prepare("SELECT * FROM cherry_roads").all() as CherryRoadRow[];
}

export function getTreeStats(): { species: string; count: number }[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT species, COUNT(*) as count FROM trees GROUP BY species ORDER BY count DESC"
    )
    .all() as { species: string; count: number }[];
}
