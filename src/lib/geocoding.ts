interface GeocodingResult {
  lat: number;
  lon: number;
  displayName: string;
}

const LOCATIONIQ_API_KEY = "pk.742e1297fcb9f1fe85ed5563c8940e59";

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (!address) return null;

  if (!LOCATIONIQ_API_KEY) {
    console.warn(
      "[Geocoding] LocationIQ API Key não está definida. A geocodificação não funcionará."
    );
    return null;
  }

  try {
    const response = await fetch(
      `https://us1.locationiq.com/v1/search?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(address)}&format=json&countrycodes=br&limit=1&addressdetails=1`
    );

    if (!response.ok) {
      console.warn("[Geocoding] Erro na resposta:", response.status);
      return null;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      console.warn("[Geocoding] Nenhum resultado encontrado para:", address);
      return null;
    }

    const result = data[0];

    return {
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      displayName: result.display_name,
    };
  } catch (error) {
    console.error("[Geocoding] Erro na geocodificação:", error);
    return null;
  }
}
