// hooks/useGeolocation.js
import { useState, useEffect } from 'react';
import axios from 'axios';

export const useGeolocation = () => {
  const [location, setLocation] = useState({
    country: null,
    countryCode: null,
    city: null,
    region: null,
    latitude: null,
    longitude: null,
    loading: true,
    error: null,
    source: null // 'ip-api', 'browser', etc.
  });

  useEffect(() => {
    const detectLocation = async () => {
      try {
        // 1. D'abord essayer l'API navigateur (précise mais nécessite permission)
        if (navigator.geolocation) {
          try {
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
                maximumAge: 0
              });
            });

            // Reverse geocoding avec les coordonnées
            const response = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
            );

            if (response.data?.address) {
              setLocation({
                country: response.data.address.country,
                countryCode: response.data.address.country_code?.toUpperCase(),
                city: response.data.address.city || response.data.address.town || response.data.address.village,
                region: response.data.address.state,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                loading: false,
                error: null,
                source: 'browser'
              });
              return;
            }
          } catch (browserError) {
            console.log('Browser geolocation failed:', browserError);
            // Fallback à l'API IP
          }
        }

        // 2. Fallback: API IP (gratuite, sans permission)
        const ipResponse = await axios.get('https://ipapi.co/json/');
        
        if (ipResponse.data) {
          setLocation({
            country: ipResponse.data.country_name,
            countryCode: ipResponse.data.country_code,
            city: ipResponse.data.city,
            region: ipResponse.data.region,
            latitude: ipResponse.data.latitude,
            longitude: ipResponse.data.longitude,
            loading: false,
            error: null,
            source: 'ip-api'
          });
        }

      } catch (error) {
        console.error('Geolocation error:', error);
        setLocation({
          country: null,
          countryCode: null,
          city: null,
          region: null,
          latitude: null,
          longitude: null,
          loading: false,
          error: 'Could not detect your location',
          source: null
        });
      }
    };

    detectLocation();
  }, []);

  return location;
};