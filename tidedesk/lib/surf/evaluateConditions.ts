/**
 * Evaluates surf lesson conditions from wind, swell, and precipitation.
 */
export type SurfRating = "Excellent" | "Good" | "Average" | "Poor";

export function evaluateSurfConditions(params: {
  windSpeed: number; // knots
  swellHeight: number; // metres
  precipitation?: number; // mm/h
}): SurfRating {
  const { windSpeed, swellHeight, precipitation = 0 } = params;

  if (windSpeed < 8 && swellHeight < 1.2 && precipitation < 0.2) {
    return "Excellent";
  }
  if (windSpeed < 12 && swellHeight < 1.5) {
    return "Good";
  }
  if (windSpeed < 18) {
    return "Average";
  }
  return "Poor";
}
