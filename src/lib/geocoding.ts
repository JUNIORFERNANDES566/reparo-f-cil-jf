interface GeocodingResult {
  lat: number;
  lon: number;
  displayName: string;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (!address) return null;

  if (!GOOGLE_MAPS_API_KEY) {
    console.warn(
      "[Geocoding] VITE_GOOGLE_MAPS_API_KEY não está definida. A geocodificação não funcionará. " +
      "Adicione a variável no seu arquivo .env ou nas variáveis de ambiente do projeto."
    );
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}&region=br&language=pt-BR`
    );

    if (!response.ok) return null;

    const data = await response.json();

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      console.warn("[Geocoding] Nenhum resultado encontrado para:", address, "Status:", data.status);
      return null;
    }

    const result = data.results[0];

    return {
      lat: result.geometry.location.lat,
      lon: result.geometry.location.lng,
      displayName: result.formatted_address,
    };
  } catch (error) {
    console.error("[Geocoding] Erro na geocodificação:", error);
    return null;
  }
}
