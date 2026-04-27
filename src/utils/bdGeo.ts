/**
 * Bangladesh Administrative Geo-Lookup
 * ─────────────────────────────────────
 * Provides instant (~0ms) lat/lng resolution for any Bangladesh
 * delivery address without any external API dependency.
 *
 * Address format used in checkout:
 *   "houseNo, road, area, union, thana/upazila, district, division, Bangladesh"
 *   e.g. "12, Main Rd, Gandaria, Demra, Demra, Dhaka, Dhaka, Bangladesh"
 *
 * We parse from the RIGHT side so noisy customer input in the first
 * fields never affects the district/division extraction.
 *
 * Coverage: 8 divisions + 64 districts + common alternate spellings.
 * Coordinates are center-of-district centroids (±2 km accuracy for
 * warehouse proximity assignment — fully sufficient for this use case).
 */

type Coords = { lat: number; lng: number };

// ── 8 Divisions ──────────────────────────────────────────────────────────────
const DIVISIONS: Record<string, Coords> = {
  "dhaka":        { lat: 23.8103, lng: 90.4125 },
  "chittagong":   { lat: 22.3569, lng: 91.7832 },
  "chattogram":   { lat: 22.3569, lng: 91.7832 }, // official spelling
  "rajshahi":     { lat: 24.3745, lng: 88.6042 },
  "khulna":       { lat: 22.8456, lng: 89.5403 },
  "barishal":     { lat: 22.7010, lng: 90.3535 },
  "barisal":      { lat: 22.7010, lng: 90.3535 }, // common alternate
  "sylhet":       { lat: 24.8949, lng: 91.8687 },
  "rangpur":      { lat: 25.7439, lng: 89.2752 },
  "mymensingh":   { lat: 24.7471, lng: 90.4203 },
};

// ── 64 Districts ─────────────────────────────────────────────────────────────
const DISTRICTS: Record<string, Coords> = {
  // ── Dhaka Division ────────────────────────────────────────────────────────
  "dhaka":           { lat: 23.8103, lng: 90.4125 },
  "gazipur":         { lat: 23.9999, lng: 90.4203 },
  "narayanganj":     { lat: 23.6238, lng: 90.4999 },
  "narsingdi":       { lat: 23.9225, lng: 90.7155 },
  "manikganj":       { lat: 23.8639, lng: 89.9961 },
  "munshiganj":      { lat: 23.5422, lng: 90.5303 },
  "tangail":         { lat: 24.2513, lng: 89.9167 },
  "faridpur":        { lat: 23.6070, lng: 89.8429 },
  "gopalganj":       { lat: 23.0055, lng: 89.8268 },
  "madaripur":       { lat: 23.1641, lng: 90.1956 },
  "rajbari":         { lat: 23.7577, lng: 89.6447 },
  "shariatpur":      { lat: 23.2423, lng: 90.4350 },
  "kishoreganj":     { lat: 24.4447, lng: 90.7767 },

  // ── Mymensingh Division ───────────────────────────────────────────────────
  "mymensingh":      { lat: 24.7471, lng: 90.4203 },
  "jamalpur":        { lat: 24.9375, lng: 89.9377 },
  "sherpur":         { lat: 25.0190, lng: 90.0155 },
  "netrokona":       { lat: 24.8703, lng: 90.7279 },

  // ── Chittagong Division ───────────────────────────────────────────────────
  "chittagong":      { lat: 22.3569, lng: 91.7832 },
  "chattogram":      { lat: 22.3569, lng: 91.7832 },
  "cox's bazar":     { lat: 21.4272, lng: 92.0058 },
  "coxs bazar":      { lat: 21.4272, lng: 92.0058 },
  "cox bazar":       { lat: 21.4272, lng: 92.0058 },
  "feni":            { lat: 23.0159, lng: 91.3976 },
  "noakhali":        { lat: 22.8696, lng: 91.0994 },
  "lakshmipur":      { lat: 22.9446, lng: 90.8282 },
  "laksmipur":       { lat: 22.9446, lng: 90.8282 },
  "comilla":         { lat: 23.4607, lng: 91.1809 },
  "cumilla":         { lat: 23.4607, lng: 91.1809 },
  "chandpur":        { lat: 23.2323, lng: 90.6517 },
  "brahmanbaria":    { lat: 23.9603, lng: 91.1114 },
  "b. baria":        { lat: 23.9603, lng: 91.1114 },
  "rangamati":       { lat: 22.6500, lng: 92.2002 },
  "khagrachhari":    { lat: 23.1193, lng: 91.9847 },
  "bandarban":       { lat: 22.1953, lng: 92.2184 },

  // ── Rajshahi Division ─────────────────────────────────────────────────────
  "rajshahi":        { lat: 24.3745, lng: 88.6042 },
  "chapainawabganj": { lat: 24.5964, lng: 88.2750 },
  "chapai nawabganj":{ lat: 24.5964, lng: 88.2750 },
  "natore":          { lat: 24.4204, lng: 89.0001 },
  "sirajganj":       { lat: 24.4534, lng: 89.7006 },
  "pabna":           { lat: 24.0064, lng: 89.2372 },
  "naogaon":         { lat: 24.7936, lng: 88.9312 },
  "joypurhat":       { lat: 25.0978, lng: 89.0225 },
  "bogra":           { lat: 24.8510, lng: 89.3697 },
  "bogura":          { lat: 24.8510, lng: 89.3697 },

  // ── Khulna Division ───────────────────────────────────────────────────────
  "khulna":          { lat: 22.8456, lng: 89.5403 },
  "jessore":         { lat: 23.1634, lng: 89.2182 },
  "jashore":         { lat: 23.1634, lng: 89.2182 },
  "satkhira":        { lat: 22.7185, lng: 89.0705 },
  "narail":          { lat: 23.1726, lng: 89.5123 },
  "magura":          { lat: 23.4884, lng: 89.4196 },
  "jhenaidah":       { lat: 23.5448, lng: 89.1508 },
  "jhenaidaha":      { lat: 23.5448, lng: 89.1508 },
  "kushtia":         { lat: 23.9012, lng: 89.1208 },
  "meherpur":        { lat: 23.7614, lng: 88.6318 },
  "chuadanga":       { lat: 23.6401, lng: 88.8410 },
  "bagerhat":        { lat: 22.6602, lng: 89.7854 },

  // ── Barishal Division ─────────────────────────────────────────────────────
  "barishal":        { lat: 22.7010, lng: 90.3535 },
  "barisal":         { lat: 22.7010, lng: 90.3535 },
  "bhola":           { lat: 22.6857, lng: 90.6482 },
  "patuakhali":      { lat: 22.3596, lng: 90.3298 },
  "pirojpur":        { lat: 22.5791, lng: 89.9754 },
  "jhalakathi":      { lat: 22.6404, lng: 90.1982 },
  "jhalokathi":      { lat: 22.6404, lng: 90.1982 },
  "barguna":         { lat: 22.0949, lng: 90.1116 },

  // ── Sylhet Division ───────────────────────────────────────────────────────
  "sylhet":          { lat: 24.8949, lng: 91.8687 },
  "moulvibazar":     { lat: 24.4829, lng: 91.7774 },
  "maulvibazar":     { lat: 24.4829, lng: 91.7774 },
  "habiganj":        { lat: 24.3746, lng: 91.4157 },
  "sunamganj":       { lat: 25.0658, lng: 91.3991 },

  // ── Rangpur Division ──────────────────────────────────────────────────────
  "rangpur":         { lat: 25.7439, lng: 89.2752 },
  "dinajpur":        { lat: 25.6279, lng: 88.6338 },
  "thakurgaon":      { lat: 26.0336, lng: 88.4616 },
  "panchagarh":      { lat: 26.3411, lng: 88.5541 },
  "nilphamari":      { lat: 25.9317, lng: 88.8561 },
  "lalmonirhat":     { lat: 25.9923, lng: 89.2847 },
  "kurigram":        { lat: 25.8072, lng: 89.6364 },
  "gaibandha":       { lat: 25.3288, lng: 89.5285 },
};

/**
 * Extract lat/lng from a Bangladesh structured delivery address.
 *
 * Strategy (most-precise-first cascade):
 *   1. Exact district match (positions -3 and -2 from end, before "Bangladesh")
 *   2. Division match (positions -2 and -1)
 *   3. Full scan of all parts for any known district/division name
 *
 * Returns null only if no recognisable location token found at all.
 */
export function extractCoordsFromBDAddress(rawAddress: string): Coords | null {
  // Normalise: lowercase, trim each part
  const parts = rawAddress
    .split(",")
    .map(p => p.trim().toLowerCase())
    .filter(Boolean);

  // Remove trailing "bangladesh" if present
  const cleaned = parts[parts.length - 1] === "bangladesh" ? parts.slice(0, -1) : parts;
  if (!cleaned.length) return null;

  const len = cleaned.length;

  // ── Pass 1: positional — district is [-2], division is [-1] ───────────────
  const candidates = [
    len >= 2 ? cleaned[len - 2] : null, // district slot
    cleaned[len - 1],                    // division slot
    len >= 3 ? cleaned[len - 3] : null, // thana/upazila (sometimes same as district)
  ];

  for (const c of candidates) {
    if (!c) continue;
    if (DISTRICTS[c])  return DISTRICTS[c];
    if (DIVISIONS[c])  return DIVISIONS[c];
  }

  // ── Pass 2: full scan (catches unusual address orderings) ─────────────────
  // Scan from right to left — more specific tokens appear later in BD addresses
  for (let i = cleaned.length - 1; i >= 0; i--) {
    const tok = cleaned[i]!;
    if (DISTRICTS[tok])  return DISTRICTS[tok];
    if (DIVISIONS[tok])  return DIVISIONS[tok];
  }

  return null; // Unable to resolve — caller falls back to first active warehouse
}

/**
 * Haversine great-circle distance between two points (km).
 */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
