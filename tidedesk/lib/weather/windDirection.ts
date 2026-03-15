/**
 * Converts wind direction in degrees (0 = North) to cardinal abbreviation.
 */
const DIRECTIONS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "E",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSW",
  "SW",
  "WSW",
  "W",
  "WNW",
  "NW",
  "NNW",
];

export function degreesToCardinal(degrees: number): string {
  const idx = Math.round(((degrees % 360) + 360) / 22.5) % 16;
  return DIRECTIONS[idx] ?? "N";
}
