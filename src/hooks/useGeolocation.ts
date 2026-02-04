import { useState, useEffect } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  city: string;
  loading: boolean;
  error: string | null;
}

const DEFAULT_CITY = "Pelotas, RS";
const DEFAULT_LAT = -31.7649;
const DEFAULT_LON = -52.3371;

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    city: DEFAULT_CITY,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        latitude: DEFAULT_LAT,
        longitude: DEFAULT_LON,
        city: DEFAULT_CITY,
        loading: false,
        error: "Geolocalização não suportada",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode to get city name
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt-BR`,
            {
              headers: {
                "User-Agent": "ReparoPro/1.0",
              },
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            const city = data.address?.city || 
                        data.address?.town || 
                        data.address?.municipality ||
                        data.address?.village ||
                        DEFAULT_CITY;
            const state = data.address?.state || "";
            const cityWithState = state ? `${city}, ${state}` : city;
            
            setState({
              latitude,
              longitude,
              city: cityWithState,
              loading: false,
              error: null,
            });
          } else {
            setState({
              latitude,
              longitude,
              city: DEFAULT_CITY,
              loading: false,
              error: null,
            });
          }
        } catch {
          setState({
            latitude,
            longitude,
            city: DEFAULT_CITY,
            loading: false,
            error: null,
          });
        }
      },
      (error) => {
        console.warn("Geolocation error:", error.message);
        setState({
          latitude: DEFAULT_LAT,
          longitude: DEFAULT_LON,
          city: DEFAULT_CITY,
          loading: false,
          error: error.message,
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes cache
      }
    );
  }, []);

  return state;
}
