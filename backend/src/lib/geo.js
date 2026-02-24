import maxmind from "maxmind"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let lookup = null

const dbPath = path.join(
  __dirname,
  "../../geo/GeoLite2-City.mmdb"
)

export const initGeo = async () => {
  lookup = await maxmind.open(dbPath)
  console.log("🌍 MaxMind Geo initialized")
}

export const getGeoFromIP = (ip) => {
  if (!lookup || !ip) return null

  const result = lookup.get(ip)
console.log("RAW GEO RESULT:", result)
  if (!result) return null

  return {
    countryCode: result.country?.iso_code || null,
    regionCode:
      result.subdivisions?.[0]?.iso_code || null,
    city: result.city?.names?.en || null,
  }
}
