// components/LocationMap.jsx
import React, { useState, useEffect } from 'react';
// Use the mapbox-specific entry exported by react-map-gl v8
import Map, { Marker, Popup } from 'react-map-gl/mapbox';

const LocationMap = ({ location, onLocationSelect }) => {
  const [viewState, setViewState] = useState({
    longitude: 2.3522, // Paris par défaut
    latitude: 48.8566,
    zoom: 10
  });
  
  const [marker, setMarker] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  // Clé Mapbox - Inscrivez-vous sur mapbox.com pour obtenir une clé gratuite
  const MAPBOX_TOKEN = 'pk.your_mapbox_token_here';

  // Géocodage : convertir l'adresse en coordonnées
  useEffect(() => {
    if (location) {
      geocodeLocation(location);
    }
  }, [location]);

  const geocodeLocation = async (address) => {
    if (!address || !MAPBOX_TOKEN || MAPBOX_TOKEN === 'pk.your_mapbox_token_here') return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [longitude, latitude] = data.features[0].center;
        const placeName = data.features[0].place_name;
        
        setViewState({
          longitude,
          latitude,
          zoom: 12
        });
        
        setMarker({
          longitude,
          latitude,
          name: placeName
        });
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (event) => {
    if (onLocationSelect) {
      const { lng, lat } = event.lngLat;
      setMarker({
        longitude: lng,
        latitude: lat,
        name: 'Selected location'
      });
      
      // Reverse geocoding pour obtenir l'adresse
      reverseGeocode(lng, lat);
    }
  };

  const reverseGeocode = async (lng, lat) => {
    if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'pk.your_mapbox_token_here') return;
    
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
      );
      
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const address = data.features[0].place_name;
        if (onLocationSelect) {
          onLocationSelect(address);
        }
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
    }
  };

  if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'pk.your_mapbox_token_here') {
    return (
      <div className="map-container">
        <div className="map-placeholder">
          <p>🌍 Mapbox token required</p>
          <small>
            Get a free token at{' '}
            <a href="https://www.mapbox.com/" target="_blank" rel="noopener noreferrer">
              mapbox.com
            </a>
          </small>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      {loading && (
        <div className="map-loading">
          <p>Loading location...</p>
        </div>
      )}
      
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        style={{ width: '100%', height: '400px' }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        cursor={onLocationSelect ? 'pointer' : 'default'}
      >
        {marker && (
          <Marker
            longitude={marker.longitude}
            latitude={marker.latitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setShowPopup(true);
            }}
          >
            <div className="map-marker">
              📍
            </div>
          </Marker>
        )}
        
        {showPopup && marker && (
          <Popup
            longitude={marker.longitude}
            latitude={marker.latitude}
            anchor="top"
            onClose={() => setShowPopup(false)}
          >
            <div className="map-popup">
              <p>{marker.name}</p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
};

export default LocationMap;