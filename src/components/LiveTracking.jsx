// LiveTracking.jsx
import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'react-toastify';
import PropTypes from 'prop-types';

const mapContainerStyle = {
  width: '100vw',
  height: '100vh',
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 1,
};

const defaultCenter = {
  lat: 12.9716,
  lng: 77.5946,
};

const LiveTracking = ({
  currentPosition,
  captainLocation,
  pickupCoordinates,
  destinationCoordinates,
  ride,
  rideStatus: propRideStatus,
  userType,
}) => {
  const [map, setMap] = useState(null);
  const [distanceETA, setDistanceETA] = useState({ distance: '', duration: '' });
  const [directions, setDirections] = useState(null);
  const [derivedPickupCoordinates, setDerivedPickupCoordinates] = useState(null);

  useEffect(() => {
    console.log('LiveTracking useEffect triggered with:', {
      currentPosition,
      captainLocation,
      pickupCoordinates,
      destinationCoordinates,
      rideStatus: propRideStatus || ride?.status,
      userType,
    });

    if (!ride || !ride.status) {
      console.log('LiveTracking: Missing ride or status', { ride });
      return;
    }

    const effectiveRideStatus = propRideStatus || ride.status;

    const geocodePickup = async (address) => {
      if (!window.google || !window.google.maps) {
        console.log('LiveTracking: Google Maps API not loaded yet');
        return;
      }
      const geocoder = new window.google.maps.Geocoder();
      try {
        const response = await new Promise((resolve, reject) => {
          geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK') {
              resolve(results);
            } else {
              reject(status);
            }
          });
        });
        const location = response[0].geometry.location;
        const coords = { lat: location.lat(), lng: location.lng() };
        console.log('LiveTracking: Geocoded pickup address', { address, coords });
        setDerivedPickupCoordinates(coords);
        return coords;
      } catch (error) {
        console.error('LiveTracking: Geocoding failed', error);
        return null;
      }
    };

    const fetchDistanceAndETA = async (origin, destination) => {
      if (!origin || !destination) {
        console.log('LiveTracking: Invalid origin/destination', { origin, destination });
        return;
      }
      try {
        let token = localStorage.getItem('userToken');
        let decoded = token ? jwtDecode(token) : null;

        if (!token || decoded?.role !== 'user') {
          token = localStorage.getItem('captainToken');
          decoded = token ? jwtDecode(token) : null;
        }

        if (!token) throw new Error('No token found');

        if (!decoded || (decoded.role !== 'user' && decoded.role !== 'captain')) {
          throw new Error('Invalid role in token');
        }

        console.log('LiveTracking: Fetching distance/ETA', { origin, destination });
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/maps/get-distance-eta`,
          {
            params: {
              originLat: origin.lat,
              originLng: origin.lng,
              destLat: destination.lat,
              destLng: destination.lng,
            },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log('LiveTracking: Distance/ETA received', response.data);
        setDistanceETA({
          distance: response.data.distance,
          duration: response.data.duration,
        });

        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
          {
            origin,
            destination,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              setDirections(result);
            } else {
              console.error('LiveTracking: Directions failed:', status);
            }
          }
        );
      } catch (error) {
        console.error('LiveTracking: Error fetching distance/ETA:', error.response?.data || error.message);
      }
    };

    const effectivePickupCoordinates = pickupCoordinates || derivedPickupCoordinates;

    if (effectiveRideStatus === 'accepted') {
      if (currentPosition && captainLocation) {
        console.log('LiveTracking: Calculating user to captain with captainLocation:', captainLocation);
        fetchDistanceAndETA(currentPosition, captainLocation);
      } else if (currentPosition && !captainLocation) {
        if (effectivePickupCoordinates) {
          console.log('LiveTracking: Calculating captain to rider (using effective coordinates)', effectivePickupCoordinates);
          fetchDistanceAndETA(currentPosition, effectivePickupCoordinates);
        } else if (ride.pickup && !pickupCoordinates) {
          console.log('LiveTracking: Pickup coordinates missing, attempting to geocode', ride.pickup);
          geocodePickup(ride.pickup).then((coords) => {
            if (coords) {
              fetchDistanceAndETA(currentPosition, coords);
            }
          });
        } else {
          console.log('LiveTracking: No pickup coordinates available');
        }
      } else {
        console.log('LiveTracking: Conditions not met for distance calculation');
      }
    } else if (effectiveRideStatus === 'ongoing') {
      if (effectivePickupCoordinates && destinationCoordinates) {
        console.log('LiveTracking: Setting route from pickup to destination', { effectivePickupCoordinates, destinationCoordinates });
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
          {
            origin: effectivePickupCoordinates,
            destination: destinationCoordinates,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              setDirections(result);
            } else {
              console.error('LiveTracking: Directions failed:', status);
            }
          }
        );

        if (captainLocation) {
          console.log('LiveTracking: Calculating remaining distance from captain to destination', { captainLocation, destinationCoordinates });
          fetchDistanceAndETA(captainLocation, destinationCoordinates);
        } else {
          console.log('LiveTracking: Captain location not available, falling back to pickup to destination');
          fetchDistanceAndETA(effectivePickupCoordinates, destinationCoordinates);
        }
      } else if (ride.pickup && !effectivePickupCoordinates) {
        console.log('LiveTracking: Pickup coordinates missing, attempting to geocode', ride.pickup);
        geocodePickup(ride.pickup).then((coords) => {
          if (coords && destinationCoordinates) {
            const directionsService = new window.google.maps.DirectionsService();
            directionsService.route(
              {
                origin: coords,
                destination: destinationCoordinates,
                travelMode: window.google.maps.TravelMode.DRIVING,
              },
              (result, status) => {
                if (status === window.google.maps.DirectionsStatus.OK) {
                  setDirections(result);
                } else {
                  console.error('LiveTracking: Directions failed:', status);
                }
              }
            );

            if (captainLocation) {
              fetchDistanceAndETA(captainLocation, destinationCoordinates);
            } else {
              fetchDistanceAndETA(coords, destinationCoordinates);
            }
          }
        });
      } else {
        console.log('LiveTracking: Missing pickup or destination coordinates for ongoing ride');
      }
    }
  }, [currentPosition, captainLocation, pickupCoordinates, destinationCoordinates, ride, propRideStatus, derivedPickupCoordinates, userType]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={currentPosition || captainLocation || defaultCenter}
        zoom={15}
        onLoad={(map) => setMap(map)}
      >
        {/* Rider's current position with custom marker (only for rider view) */}
        {userType === 'rider' && currentPosition && (
          <Marker
            position={currentPosition}
            icon={{
              url: '/icons/user-marker.png',
              scaledSize: new window.google.maps.Size(40, 40),
            }}
            title="Rider"
          />
        )}

        {/* Captain's live position with custom marker (for both views) */}
        {captainLocation && (
          <Marker
            position={captainLocation}
            icon={{
              url: '/icons/captain-marker.png',
              scaledSize: new window.google.maps.Size(40, 40),
            }}
            title="Captain"
          />
        )}

        {/* Pickup and Destination Markers */}
        {(pickupCoordinates || derivedPickupCoordinates) && (
          <Marker
            position={pickupCoordinates || derivedPickupCoordinates}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
            }}
            title="Pickup"
          />
        )}
        {destinationCoordinates && (
          <Marker
            position={destinationCoordinates}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
            }}
            title="Destination"
          />
        )}

        {/* Directions (route) */}
        {directions && <DirectionsRenderer directions={directions} />}
      </GoogleMap>

      {/* Display Distance and ETA on top of the map */}
      {distanceETA.distance && distanceETA.duration && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '10px',
            borderRadius: '8px',
            zIndex: 10,
            textAlign: 'center',
          }}
        >
          <p>Distance: {distanceETA.distance}</p>
          <p>ETA: {distanceETA.duration}</p>
        </div>
      )}
    </div>
  );
};

// PropTypes validation
LiveTracking.propTypes = {
  currentPosition: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
  captainLocation: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
  pickupCoordinates: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
  destinationCoordinates: PropTypes.shape({
    lat: PropTypes.number,
    lng: PropTypes.number,
  }),
  ride: PropTypes.shape({
    status: PropTypes.string,
    pickup: PropTypes.string,
  }),
  rideStatus: PropTypes.string,
  userType: PropTypes.oneOf(['rider', 'captain']).isRequired,
};

export default LiveTracking;