import React, { useRef, useState, useContext, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import FinishRide from '../components/FinishRide';
import LiveTracking from '../components/LiveTracking';
import { SocketContext } from '../context/SocketContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';

const throttle = (func, limit) => {
  let lastFunc;
  let lastRan;
  return (...args) => {
    if (!lastRan) {
      func(...args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
};

const hasLocationChanged = (prevLocation, newLocation, threshold = 0.0001) => {
  if (!prevLocation || !newLocation) return true;
  const latDiff = Math.abs(prevLocation.lat - newLocation.lat);
  const lngDiff = Math.abs(prevLocation.lng - newLocation.lng);
  return latDiff > threshold || lngDiff > threshold;
};

const CaptainRiding = () => {
  const [finishRidePanel, setFinishRidePanel] = useState(false);
  const [captainLocation, setCaptainLocation] = useState(null);
  const [lastSentLocation, setLastSentLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Fetching location...');
  const [rideStatus, setRideStatus] = useState(null); // Track ride status
  const finishRidePanelRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);
  const rideData = location.state?.ride;

  useGSAP(() => {
    if (finishRidePanel) {
      gsap.fromTo(
        finishRidePanelRef.current,
        { y: '100%' },
        { y: 0, duration: 0.3, ease: 'power3.out' }
      );
    } else {
      gsap.to(finishRidePanelRef.current, { y: '100%', duration: 0.3, ease: 'power3.in' });
    }
  }, [finishRidePanel]);

  useEffect(() => {
    if (!socket) {
      console.error('Socket not initialized');
      toast.error('Connection issue. Please try again.');
      navigate('/captain-home');
      return;
    }

    if (!rideData || !rideData._id) {
      console.error('No rideData available, navigating to /captain-home');
      navigate('/captain-home');
      return;
    }

    // Set initial ride status
    setRideStatus(rideData.status);

    console.log('CaptainRiding rideData:', rideData);
    console.log('Socket connected:', socket.connected);
    socket.emit('join', { userId: rideData.captain?._id, role: 'captain' });
    console.log('Captain joined with socketId:', socket.id);

    if (!socket.connected) {
      console.error('Socket not connected, attempting reconnect');
      socket.connect();
    }

    socket.onAny((event, ...args) => {
      console.log('Socket event received:', event, args);
    });

    const handlePaymentCompleted = (data) => {
      console.log('Received payment-completed:', data, 'Expected rideId:', rideData._id);
      if (data.rideId === rideData._id) {
        console.log('Payment completed matched ride ID:', data);
        toast.success(data.message, {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        console.error('Ride ID mismatch in payment-completed:', data.rideId, 'vs', rideData._id);
      }
    };

    const handleRideCancelled = (data) => {
      console.log('Received ride-cancelled event:', data, 'Current socketId:', socket.id);
      if (data.rideId === rideData._id) {
        toast.error('Ride cancelled by rider', {
          position: 'top-right',
          autoClose: 3000,
        });
        setTimeout(() => navigate('/captain-home', { replace: true }), 1500);
      }
    };

    const handleRideEnded = (data) => {
      if (data.rideId === rideData._id) {
        console.log('Ride ended:', data);
        navigate(`/captain-home`);
      }
    };

    const handleRideStatusUpdated = async (data) => {
      if (data.rideId === rideData._id) {
        console.log('Ride status updated:', data.status);
        setRideStatus(data.status);

        // Fetch updated ride data to ensure coordinates are available
        try {
          const token = localStorage.getItem('captainToken');
          const response = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/rides/status`,
            {
              params: { rideId: rideData._id },
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const updatedRide = response.data;
          location.state.ride = { ...rideData, ...updatedRide, pickupCoordinates: updatedRide.pickupCoordinates, destinationCoordinates: updatedRide.destinationCoordinates };
        } catch (error) {
          console.error('Error fetching updated ride data:', error);
        }
      }
    };

    socket.on('payment-completed', handlePaymentCompleted);
    socket.on('ride-cancelled', handleRideCancelled);
    socket.on('ride-ended', handleRideEnded);
    socket.on('ride-status-updated', handleRideStatusUpdated);

    socket.on('connect', () => {
      console.log('Socket reconnected:', socket.id);
      socket.emit('join', { userId: rideData.captain?._id, role: 'captain' });
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    return () => {
      console.log('Cleaning up socket listeners for CaptainRiding.jsx');
      socket.off('payment-completed', handlePaymentCompleted);
      socket.off('ride-cancelled', handleRideCancelled);
      socket.off('ride-ended', handleRideEnded);
      socket.off('ride-status-updated', handleRideStatusUpdated);
      socket.offAny();
      socket.off('connect');
      socket.off('disconnect');
    };
  }, [socket, rideData, navigate]);

  useEffect(() => {
    if (!socket || !rideData || !rideData._id) return;

    let watchId;
    let locationCheckInterval;

    const updateLocation = (location) => {
      setCaptainLocation(location);
      setLocationStatus('Tracking active');
      socket.emit('captain-location-update', { rideId: rideData._id, captainLocation: location });
      setLastSentLocation(location);
      console.log('Captain location updated:', location);
    };

    const handleLocationError = (error, isInitial = false) => {
      console.error(`${isInitial ? 'Initial' : 'Geolocation watch'} geolocation error:`, error);
      setLocationStatus('Location unavailable');
      toast.warn(
        `${isInitial ? 'Initial location fetch' : 'Tracking'} failed: ${error.message}.`,
        {
          position: 'top-right',
          autoClose: 5000,
        }
      );
      if (rideData.captain?.location?.coordinates) {
        const fallbackLocation = {
          lat: rideData.captain.location.coordinates[1],
          lng: rideData.captain.location.coordinates[0],
        };
        setCaptainLocation(fallbackLocation);
        setLocationStatus('Using last known location');
        socket.emit('captain-location-update', { rideId: rideData._id, captainLocation: fallbackLocation });
        setLastSentLocation(fallbackLocation);
        console.log(`Using fallback captain location${isInitial ? '' : ' on watch error'}:`, fallbackLocation);
      }
    };

    const requestLocationPermission = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = { lat: position.coords.latitude, lng: position.coords.longitude };
            updateLocation(location);
          },
          (error) => handleLocationError(error, true),
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
        );

        const throttledUpdate = throttle((position) => {
          const location = { lat: position.coords.latitude, lng: position.coords.longitude };
          if (hasLocationChanged(lastSentLocation, location)) {
            updateLocation(location);
          } else {
            console.log('Captain location unchanged, skipping update:', location);
          }
        }, 10000);

        watchId = navigator.geolocation.watchPosition(
          throttledUpdate,
          (error) => handleLocationError(error),
          { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
        );

        locationCheckInterval = setInterval(() => {
          if (!captainLocation) {
            console.warn('Captain location not updated, retrying...');
            navigator.geolocation.getCurrentPosition(
              (position) => {
                const location = { lat: position.coords.latitude, lng: position.coords.longitude };
                updateLocation(location);
              },
              (error) => handleLocationError(error, true),
              { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
            );
          }
        }, 30000);
      } else {
        console.error('Geolocation not supported');
        setLocationStatus('Geolocation not supported');
        toast.error('Geolocation is not supported on this device.');
        if (rideData.captain?.location?.coordinates) {
          const fallbackLocation = {
            lat: rideData.captain.location.coordinates[1],
            lng: rideData.captain.location.coordinates[0],
          };
          setCaptainLocation(fallbackLocation);
          setLocationStatus('Using last known location');
          socket.emit('captain-location-update', { rideId: rideData._id, captainLocation: fallbackLocation });
          setLastSentLocation(fallbackLocation);
          console.log('Using fallback captain location (no geolocation support):', fallbackLocation);
        }
      }
    };

    requestLocationPermission();

    return () => {
      console.log('Cleaning up geolocation for CaptainRiding.jsx');
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (locationCheckInterval) {
        clearInterval(locationCheckInterval);
      }
    };
  }, [socket, rideData]);

  const handleCompleteRide = () => {
    setFinishRidePanel(true);
  };

  if (!rideData || !rideData._id) {
    return null;
  }

  return (
    <div className="relative h-screen overflow-hidden bg-gray-100">
      <div className="absolute inset-0 z-0">
        <LiveTracking
          currentPosition={null} // Don't pass rider's position for captain
          captainLocation={captainLocation}
          pickupCoordinates={rideData?.pickupCoordinates}
          destinationCoordinates={rideData?.destinationCoordinates}
          ride={rideData}
          rideStatus={rideStatus}
          userType="captain" // Pass userType as captain
        />
      </div>

      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3">
        <img
          className="w-16 sm:w-20 filter invert"
          src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png"
          alt="Ridez Logo"
        />
        <Link
          to="/captain-home"
          className="flex items-center justify-center w-10 h-10 transition duration-200 bg-white rounded-full shadow-md hover:bg-gray-100"
        >
          <i className="text-xl text-gray-600 ri-logout-box-r-line"></i>
        </Link>
      </header>

      {!finishRidePanel && (
        <div className="fixed bottom-0 left-0 right-0 z-10 mx-auto w-11/12 max-w-md p-4 bg-white border-t border-gray-200 min-h-[100px] max-h-[150px] overflow-hidden rounded-t-3xl shadow-2xl">
          <div className="flex justify-center">
            <button
              onClick={() => setFinishRidePanel(false)}
              className="w-10 h-1 transition duration-200 bg-gray-300 rounded-full cursor-pointer hover:bg-gray-400"
            ></button>
          </div>
          <div className="flex items-center justify-between mt-3">
            <h4 className="text-sm font-semibold text-gray-800">{locationStatus}</h4>
            <div className="flex gap-2">
              {/* Removed the Start Ride button; show Complete Ride button directly */}
              <button
                onClick={handleCompleteRide}
                className="px-3 py-2 text-sm font-semibold text-white transition duration-200 bg-green-600 rounded-lg shadow-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={!captainLocation}
              >
                Complete Ride
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        ref={finishRidePanelRef}
        className="fixed bottom-0 left-0 right-0 z-30 mx-auto w-11/12 max-w-md rounded-t-3xl shadow-2xl max-h-[70vh] overflow-y-auto translate-y-full"
      >
        <FinishRide ride={rideData} setFinishRidePanel={setFinishRidePanel} />
      </div>
    </div>
  );
};

export default CaptainRiding;