import { useState, useEffect } from "react";

interface GeolocationState {
  loading: boolean;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  error: string | null;
}

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    loading: true,
    latitude: null,
    longitude: null,
    city: null,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Geolocalização não suportada",
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Try to get city name from coordinates using reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.municipality || "Localização atual";
          const stateAbbr = data.address?.state;
          
          setState({
            loading: false,
            latitude,
            longitude,
            city: stateAbbr ? `${city}, ${stateAbbr}` : city,
            error: null,
          });
        } catch {
          setState({
            loading: false,
            latitude,
            longitude,
            city: "Localização atual",
            error: null,
          });
        }
      },
      (error) => {
        setState({
          loading: false,
          latitude: null,
          longitude: null,
          city: null,
          error: error.message,
        });
      }
    );
  }, []);

  return state;
}
