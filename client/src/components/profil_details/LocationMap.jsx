import React from 'react';

const LocationMap = ({ profile, coordinates, loading, error, onRetry }) => {
  const GOOGLE_MAPS_API_KEY = 'AIzaSyB6OybZljv13kKFEh-aBAisJogu91RnHmg'; //AIzaSyB6OybZljv13kKFEh-aBAisJogu91RnHmg

  const hasAddressData = profile.address || profile.city || profile.state || profile.zip_code || profile.country || profile.location;

  if (!hasAddressData) {
    return (
      <div className="map-placeholder">
        <p>📍 No address information available</p>
        <small>Please add location details to see the map</small>
      </div>
    );
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="map-placeholder">
        <p>🗺️ Map Configuration</p>
        <small>Add Google Maps API key for better maps</small>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="map-placeholder">
        <div className="loading-spinner"></div>
        <p>Loading map...</p>
      </div>
    );
  }

  if (error || !coordinates) {
    return (
      <div className="map-placeholder">
        <p>📍 Unable to load map</p>
        <small>{error || 'Please check your address'}</small>
        <button onClick={onRetry} className="retry-button">
          🔄 Retry
        </button>
      </div>
    );
  }

 const mapUrl = `https://www.google.com/maps/embed/v1/view?key=${GOOGLE_MAPS_API_KEY}&center=${coordinates.lat},${coordinates.lng}&zoom=15&maptype=roadmap`;
  return (
    <div className="google-map-container">
      <div className="map-header">
        <h4>📍 Location</h4>
      </div>
      <iframe
        title="google-map"
        width="100%"
        height="300"
        frameBorder="0"
        style={{ 
          border: '2px solid #4285f4', 
          borderRadius: '8px'
        }}
        src={mapUrl}
        allowFullScreen
      />
    </div>
  );
};

export default LocationMap;