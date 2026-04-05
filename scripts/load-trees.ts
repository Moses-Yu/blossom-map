/**
 * 산림청 도시숲가로수관리 데이터 → SQLite 파이프라인
 *
 * 1. CSV 파싱 (869K건)
 * 2. 벚나무 계열 필터링 (왕벚나무, 벚나무, 겹벚나무 등)
 * 3. 지역좌표계 → WGS84 변환 (proj4)
 * 4. SQLite DB 저장
 * 5. 전국가로수길정보 병합 (벚꽃길 구간)
 *
 * Usage: npx tsx scripts/load-trees.ts
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import Database from "better-sqlite3";
import proj4 from "proj4";

// ── Paths ──────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, "..", "data");
const TREE_CSV = path.join(DATA_DIR, "forest_street_trees.csv");
const ROAD_CSV = path.join(DATA_DIR, "cherry_blossom_roads.csv");
const DB_PATH = path.join(DATA_DIR, "trees.db");

// ── Coordinate systems ─────────────────────────────────
// Korean coordinate systems commonly used in 산림청 data
const COORD_SYSTEMS: Record<string, string> = {
  // EPSG:5186 — Korea 2000 / Central Belt 2010
  "5186": "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs",
  // EPSG:5179 — Korea 2000 / Unified CS
  "5179": "+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs",
  // EPSG:5181 — Korea 2000 / Central Belt
  "5181": "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=GRS80 +units=m +no_defs",
  // EPSG:5185 — Korea 2000 / West Belt 2010
  "5185": "+proj=tmerc +lat_0=38 +lon_0=125 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs",
  // EPSG:5187 — Korea 2000 / East Belt 2010
  "5187": "+proj=tmerc +lat_0=38 +lon_0=129 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs",
  // EPSG:5188 — Korea 2000 / East Sea Belt 2010
  "5188": "+proj=tmerc +lat_0=38 +lon_0=131 +k=1 +x_0=200000 +y_0=600000 +ellps=GRS80 +units=m +no_defs",
  // EPSG:2097 — Korean 1985 / Modified Central (Bessel)
  "2097": "+proj=tmerc +lat_0=38 +lon_0=127 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +towgs84=-146.414,507.337,680.507,0,0,0,0 +units=m +no_defs",
};

const WGS84 = "+proj=longlat +datum=WGS84 +no_defs";

// Default to EPSG:5186 (most common in 산림청 data)
const DEFAULT_EPSG = "5186";

// ── Cherry tree species filter ─────────────────────────
const CHERRY_KEYWORDS = [
  "왕벚나무",
  "벚나무",
  "겹벚나무",
  "올벚나무",
  "산벚나무",
  "잔털벚나무",
  "개벚나무",
  "벚",
];

function isCherryTree(species: string): boolean {
  if (!species) return false;
  const normalized = species.trim();
  return CHERRY_KEYWORDS.some((kw) => normalized.includes(kw));
}

// ── Coordinate conversion ──────────────────────────────
function toWGS84(
  x: number,
  y: number,
  epsgCode: string
): { lat: number; lng: number } | null {
  const srcProj = COORD_SYSTEMS[epsgCode] || COORD_SYSTEMS[DEFAULT_EPSG];
  try {
    const [lng, lat] = proj4(srcProj, WGS84, [x, y]);
    // Validate bounds (Korean peninsula roughly)
    if (lat < 33 || lat > 39 || lng < 124 || lng > 132) return null;
    return { lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 };
  } catch {
    return null;
  }
}

// ── Database setup ─────────────────────────────────────
function initDb(db: Database.Database) {
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS trees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      species TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      road_section TEXT,
      region TEXT,
      district TEXT,
      road_name TEXT,
      tree_id TEXT,
      raw_x REAL,
      raw_y REAL,
      epsg TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_trees_species ON trees(species);
    CREATE INDEX IF NOT EXISTS idx_trees_coords ON trees(lat, lng);

    CREATE TABLE IF NOT EXISTS cherry_roads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      region TEXT,
      start_lat REAL,
      start_lng REAL,
      end_lat REAL,
      end_lng REAL,
      length_km REAL,
      tree_species TEXT,
      description TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_roads_coords ON cherry_roads(start_lat, start_lng);
  `);
}

// ── Load street trees CSV ──────────────────────────────
function loadTreesCsv(db: Database.Database) {
  if (!fs.existsSync(TREE_CSV)) {
    console.error(`\n[ERROR] CSV 파일이 없습니다: ${TREE_CSV}`);
    console.error(
      "  다운로드: https://www.data.go.kr/data/15120900/fileData.do"
    );
    console.error(`  파일명을 forest_street_trees.csv 로 저장해주세요.\n`);
    return 0;
  }

  console.log("CSV 파일 읽는 중...");
  const raw = fs.readFileSync(TREE_CSV, "utf-8");

  console.log("CSV 파싱 중...");
  const records: Record<string, string>[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
  });
  console.log(`  전체 레코드: ${records.length.toLocaleString()}건`);

  // Detect column names (산림청 data can vary)
  const sample = records[0] || {};
  const cols = Object.keys(sample);

  // Find key columns by pattern matching
  const speciesCol =
    cols.find((c) => c.includes("수종")) || cols.find((c) => c.includes("TREE")) || "";
  const xCol =
    cols.find((c) => c.includes("X좌표") || c === "ARA_XCRD") ||
    cols.find((c) => c.toUpperCase().includes("XCRD")) || "";
  const yCol =
    cols.find((c) => c.includes("Y좌표") || c === "ARA_YCRD") ||
    cols.find((c) => c.toUpperCase().includes("YCRD")) || "";
  const epsgCol =
    cols.find((c) => c.includes("좌표계") || c.includes("EPSG") || c.includes("CRD_CD")) || "";
  const roadCol =
    cols.find((c) => c.includes("도로구간") || c.includes("ROAD") || c.includes("노선")) || "";
  const regionCol =
    cols.find((c) => c.includes("시도") || c.includes("CTPV")) ||
    cols.find((c) => c.includes("지역")) || "";
  const districtCol =
    cols.find((c) => c.includes("시군구") || c.includes("SGG")) || "";
  const roadNameCol =
    cols.find((c) => c.includes("도로명") || c.includes("ROAD_NM")) || "";
  const treeIdCol =
    cols.find((c) => c.includes("관리번호") || c.includes("TREE_ID") || c.includes("고유번호")) || "";

  console.log(`  컬럼 감지: 수종=${speciesCol}, X=${xCol}, Y=${yCol}, EPSG=${epsgCol}`);

  if (!speciesCol || !xCol || !yCol) {
    console.error("[ERROR] 필수 컬럼(수종, X좌표, Y좌표)을 찾을 수 없습니다.");
    console.error("  감지된 컬럼:", cols.join(", "));
    return 0;
  }

  // Filter and convert
  const insert = db.prepare(`
    INSERT INTO trees (species, lat, lng, road_section, region, district, road_name, tree_id, raw_x, raw_y, epsg)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let filtered = 0;
  let converted = 0;
  let skipped = 0;

  const insertMany = db.transaction(
    (rows: Array<Record<string, string>>) => {
      for (const row of rows) {
        const species = row[speciesCol] || "";
        if (!isCherryTree(species)) continue;
        filtered++;

        const rawX = parseFloat(row[xCol]);
        const rawY = parseFloat(row[yCol]);
        if (isNaN(rawX) || isNaN(rawY) || rawX === 0 || rawY === 0) {
          skipped++;
          continue;
        }

        // Detect EPSG code
        let epsg = DEFAULT_EPSG;
        if (epsgCol && row[epsgCol]) {
          const code = row[epsgCol].replace(/[^0-9]/g, "");
          if (code && COORD_SYSTEMS[code]) epsg = code;
        }

        const coord = toWGS84(rawX, rawY, epsg);
        if (!coord) {
          skipped++;
          continue;
        }

        insert.run(
          species.trim(),
          coord.lat,
          coord.lng,
          roadCol ? (row[roadCol] || "").trim() : null,
          regionCol ? (row[regionCol] || "").trim() : null,
          districtCol ? (row[districtCol] || "").trim() : null,
          roadNameCol ? (row[roadNameCol] || "").trim() : null,
          treeIdCol ? (row[treeIdCol] || "").trim() : null,
          rawX,
          rawY,
          epsg
        );
        converted++;
      }
    }
  );

  // Process in chunks to avoid memory issues
  const CHUNK = 50000;
  for (let i = 0; i < records.length; i += CHUNK) {
    const chunk = records.slice(i, i + CHUNK);
    insertMany(chunk);
    process.stdout.write(
      `\r  처리 중: ${Math.min(i + CHUNK, records.length).toLocaleString()} / ${records.length.toLocaleString()}`
    );
  }
  console.log();

  console.log(`  벚나무 필터링: ${filtered.toLocaleString()}건`);
  console.log(`  좌표 변환 성공: ${converted.toLocaleString()}건`);
  console.log(`  좌표 변환 실패/무효: ${skipped.toLocaleString()}건`);

  return converted;
}

// ── Load cherry blossom roads CSV ──────────────────────
function loadRoadsCsv(db: Database.Database) {
  if (!fs.existsSync(ROAD_CSV)) {
    console.log(`\n[INFO] 벚꽃길 CSV 없음 (선택사항): ${ROAD_CSV}`);
    console.log(
      "  다운로드: data.go.kr 전국가로수길정보표준데이터 (171건)"
    );
    return 0;
  }

  console.log("\n벚꽃길 데이터 로딩 중...");
  const raw = fs.readFileSync(ROAD_CSV, "utf-8");

  const records: Record<string, string>[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
  });
  console.log(`  전체 레코드: ${records.length}건`);

  const cols = Object.keys(records[0] || {});

  const nameCol = cols.find((c) => c.includes("가로수길") || c.includes("명칭") || c.includes("NAME")) || "";
  const regionCol = cols.find((c) => c.includes("시도") || c.includes("지역")) || "";
  const startLatCol = cols.find((c) => c.includes("시작위도") || c.includes("START_LAT")) || "";
  const startLngCol = cols.find((c) => c.includes("시작경도") || c.includes("START_LNG") || c.includes("START_LON")) || "";
  const endLatCol = cols.find((c) => c.includes("종료위도") || c.includes("END_LAT")) || "";
  const endLngCol = cols.find((c) => c.includes("종료경도") || c.includes("END_LNG") || c.includes("END_LON")) || "";
  const lengthCol = cols.find((c) => c.includes("연장") || c.includes("길이") || c.includes("LENGTH")) || "";
  const speciesCol = cols.find((c) => c.includes("수종") || c.includes("TREE")) || "";
  const descCol = cols.find((c) => c.includes("설명") || c.includes("비고") || c.includes("DESC")) || "";

  console.log(`  컬럼 감지: 명칭=${nameCol}, 시작위도=${startLatCol}`);

  const insert = db.prepare(`
    INSERT INTO cherry_roads (name, region, start_lat, start_lng, end_lat, end_lng, length_km, tree_species, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  const insertMany = db.transaction((rows: Array<Record<string, string>>) => {
    for (const row of rows) {
      // Filter for cherry blossom roads if species column exists
      if (speciesCol && row[speciesCol]) {
        if (!isCherryTree(row[speciesCol])) continue;
      }

      const name = nameCol ? row[nameCol]?.trim() : "알 수 없음";
      if (!name) continue;

      insert.run(
        name,
        regionCol ? (row[regionCol] || "").trim() : null,
        startLatCol ? parseFloat(row[startLatCol]) || null : null,
        startLngCol ? parseFloat(row[startLngCol]) || null : null,
        endLatCol ? parseFloat(row[endLatCol]) || null : null,
        endLngCol ? parseFloat(row[endLngCol]) || null : null,
        lengthCol ? parseFloat(row[lengthCol]) || null : null,
        speciesCol ? (row[speciesCol] || "").trim() : null,
        descCol ? (row[descCol] || "").trim() : null
      );
      count++;
    }
  });

  insertMany(records);
  console.log(`  벚꽃길 저장: ${count}건`);
  return count;
}

// ── Main ───────────────────────────────────────────────
async function main() {
  console.log("=== 벚꽃구경 데이터 파이프라인 ===\n");

  // Ensure data dir exists
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  // Remove old DB
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log("기존 DB 삭제 완료");
  }

  const db = new Database(DB_PATH);
  initDb(db);
  console.log(`DB 생성: ${DB_PATH}\n`);

  // Load trees
  const treeCount = loadTreesCsv(db);

  // Load cherry blossom roads
  const roadCount = loadRoadsCsv(db);

  // Summary
  console.log("\n=== 완료 ===");
  console.log(`  벚나무: ${treeCount.toLocaleString()}건`);
  console.log(`  벚꽃길: ${roadCount}건`);
  console.log(`  DB: ${DB_PATH}`);

  // Print sample data
  if (treeCount > 0) {
    const sample = db
      .prepare("SELECT species, lat, lng, region, district FROM trees LIMIT 5")
      .all();
    console.log("\n  샘플 데이터:");
    for (const row of sample) {
      const r = row as Record<string, unknown>;
      console.log(
        `    ${r.species} @ (${r.lat}, ${r.lng}) ${r.region || ""} ${r.district || ""}`
      );
    }

    const stats = db
      .prepare(
        "SELECT species, COUNT(*) as cnt FROM trees GROUP BY species ORDER BY cnt DESC LIMIT 10"
      )
      .all();
    console.log("\n  수종별 통계:");
    for (const row of stats) {
      const r = row as Record<string, unknown>;
      console.log(`    ${r.species}: ${(r.cnt as number).toLocaleString()}건`);
    }
  }

  db.close();
}

main().catch(console.error);
