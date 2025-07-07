/* ========================================================================== */
/* Archivo: frontend/src/utils/geoUtils.js (NUEVO)                           */
/* ========================================================================== */
/**
 * Calcula la distancia Haversine entre dos puntos en la Tierra.
 * @param {number} lat1 Latitud del punto 1.
 * @param {number} lon1 Longitud del punto 1.
 * @param {number} lat2 Latitud del punto 2.
 * @param {number} lon2 Longitud del punto 2.
 * @returns {number} La distancia en kilómetros.
 */
export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  if ([lat1, lon1, lat2, lon2].some(coord => isNaN(coord))) {
    return Infinity; // Devuelve infinito si alguna coordenada no es un número válido
  }
  const R = 6371; // Radio de la Tierra en km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distancia en km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}