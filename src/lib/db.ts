import initSqlJs, { Database, SqlValue } from "sql.js";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "trees.db");

let _db: Database | null = null;
let _initPromise: Promise<Database> | null = null;

async function getDb(): Promise<Database> {
  if (_db) return _db;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const SQL = await initSqlJs();
    const buffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(buffer);
    return _db;
  })();

  return _initPromise;
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

function queryAll<T>(db: Database, sql: string, params: SqlValue[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export async function getTreesInBounds(
  minLat: number,
  maxLat: number,
  minLng: number,
  maxLng: number,
  limit = 5000
): Promise<TreeRow[]> {
  const db = await getDb();
  return queryAll<TreeRow>(
    db,
    `SELECT id, species, lat, lng, road_section, region, district, road_name
     FROM trees
     WHERE lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?
     LIMIT ?`,
    [minLat, maxLat, minLng, maxLng, limit]
  );
}

export async function getAllCherryRoads(): Promise<CherryRoadRow[]> {
  const db = await getDb();
  return queryAll<CherryRoadRow>(db, "SELECT * FROM cherry_roads");
}

export async function getTreeStats(): Promise<{ species: string; count: number }[]> {
  const db = await getDb();
  return queryAll<{ species: string; count: number }>(
    db,
    "SELECT species, COUNT(*) as count FROM trees GROUP BY species ORDER BY count DESC"
  );
}
