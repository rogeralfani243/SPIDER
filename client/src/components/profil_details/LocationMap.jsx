import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa'; // Icône de localisation
import { FaCar, FaExternalLinkAlt } from 'react-icons/fa'; // Autres icônes

const LocationMap = ({ profile, onRetry }) => {
  const GOOGLE_MAPS_API_KEY = 'AIzaSyCzc9uaNAsJagUNINL441z9p-_K6vViQ28';
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Construire l'adresse complète à partir du profil
  const buildFullAddress = () => {
    const parts = [];
    
    if (profile.address) parts.push(profile.address);
    if (profile.city) parts.push(profile.city);
    if (profile.state) parts.push(profile.state);
    if (profile.zip_code) parts.push(profile.zip_code);
    if (profile.country) parts.push(profile.country);
    if (profile.location) parts.push(profile.location);
    
    return parts.join(', ');
  };

  // Fonction pour géocoder l'adresse
  const geocodeAddress = async (address) => {
    if (!address || !GOOGLE_MAPS_API_KEY) {
      setError('Address or API key missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('📍 [DEBUG] Geocoding address:', address);
      
      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📍 [DEBUG] Geocoding response:', {
        status: data.status,
        results: data.results?.length || 0
      });

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        console.log('📍 [DEBUG] Coordinates found:', location);
        setCoordinates({
          lat: location.lat,
          lng: location.lng
        });
      } else {
        throw new Error(`Geocoding failed: ${data.status} - ${data.error_message || 'No results found'}`);
      }
    } catch (err) {
      console.error('❌ [DEBUG] Geocoding error:', err);
      setError(err.message || 'Failed to geocode address');
    } finally {
      setLoading(false);
    }
  };

  // Effect pour géocoder quand le profil change
  useEffect(() => {
    const fullAddress = buildFullAddress();
    console.log('📍 [DEBUG] Full address:', fullAddress);
    
    if (fullAddress && fullAddress.trim().length > 0) {
      geocodeAddress(fullAddress);
    } else {
      setError('No address information available');
      setLoading(false);
    }
  }, [profile]);

  // Vérifier si on a une adresse
  const fullAddress = buildFullAddress();
  const hasAddressData = fullAddress && fullAddress.trim().length > 0;

  if (!hasAddressData) {
    return (
      <div className="map-placeholder">
        <FaMapMarkerAlt className="placeholder-icon" />
        <p>No address information available</p>
        <small>Please add location details to see the map</small>
      </div>
    );
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="map-placeholder">
        <p>Map Configuration</p>
        <small>Add Google Maps API key for better maps</small>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="map-placeholder">
        <div className="loading-spinner"></div>
        <p>Geocoding address...</p>
        <small>{fullAddress}</small>
      </div>
    );
  }

  if (error || !coordinates) {
    return (
      <div className="map-placeholder">
        <FaMapMarkerAlt className="error-icon" />
        <p>Unable to load map</p>
        <small className="error-message">{error || 'Geocoding failed'}</small>
        <div className="address-preview">
          <strong>Address used:</strong>
          <p>{fullAddress}</p>
        </div>
        {onRetry && (
          <button onClick={() => geocodeAddress(fullAddress)} className="retry-button">
            <FaMapMarkerAlt /> Retry Geocoding
          </button>
        )}
      </div>
    );
  }

  // ✅ URL Google Maps avec marqueur
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(fullAddress)}&center=${coordinates.lat},${coordinates.lng}&zoom=16&maptype=roadmap`;

  return (
    <div className="google-map-container">
      <div className="map-header">
        <h4>
          <FaMapMarkerAlt className="location-icon" /> Location
        </h4>
        <div className="address-info-map">
          <small>{fullAddress}</small>
      </div>
      </div>
      <iframe
        title="google-map"
        width="100%"
        height="300"
        frameBorder="0"
        style={{ 
          border: '2px solid #970d0dff', 
          borderRadius: '8px'
        }}
        src={mapUrl}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="map-footer">
        <small>Powered by Google Maps</small>
        <div className="map-links">
          <a 
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="open-in-maps"
          >
            <FaExternalLinkAlt /> Open in Google Maps
          </a>
          <a 
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fullAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="get-directions"
          >
            <FaCar /> Get Directions
          </a>
        </div>
      </div>
    </div>
  );
};

export default LocationMap;