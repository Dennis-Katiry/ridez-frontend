// CaptainHome.jsx
import React, { useEffect, useRef, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import axios from 'axios';
import CaptainDetails from '../components/CaptainDetails';
import RidePopUp from '../components/RidePopUp';
import ConfirmRidePopUp from '../components/ConfirmRidePopUp';
import { SocketContext } from '../context/SocketContext';
import { CaptainDataContext } from '../context/CaptainContext';
import LiveTracking from '../components/LiveTracking';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PropTypes from 'prop-types';

// Utility function to throttle updates
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

const CaptainHome = ({ mapsLoaded }) => {
  const [ridePopupPanel, setRidePopupPanel] = useState(false);
  const [confirmRidePopupPanel, setConfirmRidePopupPanel] = useState(false);
  const [ride, setRide] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isMapLoading, setIsMapLoading] = useState(!mapsLoaded);
  const [isDeactivated, setIsDeactivated] = useState(false);
  const [locationErrorCount, setLocationErrorCount] = useState(0);

  const ridePopupPanelRef = useRef(null);
  const confirmRidePopupPanelRef = useRef(null);

  const { socket } = useContext(SocketContext);
  const { captain, setCaptain, fetchCaptain, fetchStats } = useContext(CaptainDataContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!captain) {
      fetchCaptain().then(async (fetchedCaptain) => {
        if (!fetchedCaptain.isActive) {
          setIsDeactivated(true);
          toast.error('Your account has been deactivated by an admin.', {
            position: 'top-right',
            autoClose: 3000,
          });
          return;
        }
        await axios.put(
          `${import.meta.env.VITE_BASE_URL}/captains/update-status`,
          { isOnline: true },
          { headers: { Authorization: `Bearer ${localStorage.getItem('captainToken')}` } }
        );
        fetchStats();
      });
    } else {
      if (!captain.isActive) {
        setIsDeactivated(true);
        toast.error('Your account has been deactivated by an admin.', {
          position: 'top-right',
          autoClose: 3000,
        });
      } else {
        fetchStats();
      }
    }
  }, [captain, fetchCaptain, fetchStats]);

  useEffect(() => {
    if (isDeactivated) return;

    const updatePosition = throttle(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('Captain position updated:', latitude, longitude);
          setCurrentPosition({ lat: latitude, lng: longitude });
          setLocationErrorCount(0);
          if (socket && captain) {
            socket.emit('captain-location-update', {
              rideId: ride?._id || null,
              captainLocation: { lat: latitude, lng: longitude },
            });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLocationErrorCount((prev) => prev + 1);
          if (error.code === 3) {
            console.warn('Geolocation timeout, using last known position if available');
            if (captain?.location?.coordinates) {
              const fallbackPosition = {
                lat: captain.location.coordinates[1],
                lng: captain.location.coordinates[0],
              };
              setCurrentPosition(fallbackPosition);
              if (socket && captain) {
                socket.emit('captain-location-update', {
                  rideId: ride?._id || null,
                  captainLocation: fallbackPosition,
                });
              }
            }
          }
          if (locationErrorCount >= 2) {
            toast.warn('Unable to fetch location. Please ensure location services are enabled.', {
              position: 'top-right',
              autoClose: 5000,
            });
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 5000,
        }
      );
    }, 15000);

    updatePosition();
    const intervalId = setInterval(updatePosition, 15000);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('Captain position updated (watch):', latitude, longitude);
        setCurrentPosition({ lat: latitude, lng: longitude });
        setLocationErrorCount(0);
        if (socket && captain) {
          socket.emit('captain-location-update', {
            rideId: ride?._id || null,
            captainLocation: { lat: latitude, lng: longitude },
          });
        }
      },
      (error) => {
        console.error('Watch position error:', error);
        setLocationErrorCount((prev) => prev + 1);
        if (error.code === 3) {
          console.warn('Watch position timeout, using last known position if available');
          if (captain?.location?.coordinates) {
            const fallbackPosition = {
              lat: captain.location.coordinates[1],
              lng: captain.location.coordinates[0],
            };
            setCurrentPosition(fallbackPosition);
            if (socket && captain) {
              socket.emit('captain-location-update', {
                rideId: ride?._id || null,
                captainLocation: fallbackPosition,
              });
            }
          }
        }
        if (locationErrorCount >= 2) {
          toast.warn('Unable to track location. Please ensure location services are enabled.', {
            position: 'top-right',
            autoClose: 5000,
          });
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(intervalId);
    };
  }, [captain, socket, ride, isDeactivated, locationErrorCount]);

  useEffect(() => {
    if (!socket || !captain || isDeactivated) {
      console.log('Socket, captain, or deactivation check:', { captain: !!captain, socket: !!socket, isDeactivated });
      return;
    }

    socket.emit('join', { role: 'captain', userId: captain._id });
    console.log('Captain joined with socketId:', socket.id);

    socket.on('ride-request', (data) => {
      if (!data || !data.rideId) {
        console.error('Invalid ride-request data:', data);
        return;
      }
      const rideData = {
        _id: data.rideId,
        pickup: data.pickup,
        destination: data.destination,
        fare: data.fare,
        userId: data.userId,
        userLocation: data.userLocation,
      };
      setRide(rideData);
      console.log('Ride request received by captain:', rideData);
      setRidePopupPanel(true);
    });

    socket.on('ride-cancelled', (data) => {
      toast.error('Ride cancelled by rider', { position: 'top-right', autoClose: 3000 });
      if (ride && ride._id === data.rideId) {
        setRide(null);
        setConfirmRidePopupPanel(false);
        setRidePopupPanel(false);
        navigate('/captain-home', { replace: true });
      }
    });

    socket.on('ride-accepted', (data) => {
      console.log('Ride accepted confirmation:', data);
      if (ride && ride._id === data.rideId) {
        navigate('/captain-riding', { state: { ride: data } });
      }
    });

    socket.on('status-changed', (data) => {
      if (!data.isActive) {
        setIsDeactivated(true);
        toast.error('Your account has been deactivated by an admin.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    });

    return () => {
      socket.off('ride-request');
      socket.off('ride-cancelled');
      socket.off('ride-accepted');
      socket.off('status-changed');
    };
  }, [captain, socket, ride, navigate, isDeactivated]);

  useEffect(() => {
    if (mapsLoaded) {
      console.log('Maps loaded in CaptainHome');
      setIsMapLoading(false);
    }
  }, [mapsLoaded]);

  const confirmRide = async () => {
    if (isDeactivated) {
      toast.error('Your account is deactivated. You cannot confirm rides.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }
    if (!ride?._id || !captain?._id) {
      console.error('Missing rideId or captainId:', { rideId: ride?._id, captainId: captain?._id });
      toast.error('Invalid ride or captain data', { position: 'top-right', autoClose: 3000 });
      return;
    }
    try {
      const token = localStorage.getItem('captainToken');
      console.log('Token for confirm:', token);
      if (!token) throw new Error('No captain token found');

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/confirm`,
        { rideId: ride._id, captainId: captain._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Ride confirmed:', response.data);
      setRide(response.data);
      setRidePopupPanel(false);
      setConfirmRidePopupPanel(true);
      fetchStats();
    } catch (error) {
      console.error('Error confirming ride:', error);
      toast.error(error.response?.data?.message || 'Failed to confirm ride', { position: 'top-right', autoClose: 3000 });
    }
  };

  const handleLogout = async () => {
    try {
      await axios.get(`${import.meta.env.VITE_BASE_URL}/captains/logout`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('captainToken')}` },
      });
      localStorage.removeItem('captainToken');
      setCaptain(null);
      navigate('/captain-login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout', { position: 'top-right', autoClose: 3000 });
    }
  };

  useGSAP(() => {
    if (ridePopupPanel) {
      gsap.to(ridePopupPanelRef.current, { y: 0, duration: 0.5, ease: 'power3.out' });
    } else {
      gsap.to(ridePopupPanelRef.current, { y: '100%', duration: 0.5, ease: 'power3.in' });
    }
  }, [ridePopupPanel]);

  useGSAP(() => {
    if (confirmRidePopupPanel) {
      gsap.to(confirmRidePopupPanelRef.current, { y: 0, duration: 0.5, ease: 'power3.out' });
    } else {
      gsap.to(confirmRidePopupPanelRef.current, { y: '100%', duration: 0.5, ease: 'power3.in' });
    }
  }, [confirmRidePopupPanel]);

  if (!captain) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <span className="text-xl font-semibold text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden font-sans bg-gray-50">
      <div className="absolute inset-0 z-0">
        {isMapLoading ? (
          <div className="flex items-center justify-center h-full bg-gray-200">
            <span className="text-lg text-gray-600">Loading Map...</span>
          </div>
        ) : (
          <LiveTracking
            currentPosition={currentPosition}
            captainLocation={currentPosition} // Pass captain's location
            ride={ride}
            userType="captain" // Add userType prop
          />
        )}
      </div>

      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-3 shadow-lg bg-gradient-to-r from-gray-900 to-gray-800">
        <Link to="/captain-home" className="flex items-center space-x-2 group">
          <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent transition-all duration-300 group-hover:from-blue-500 group-hover:to-blue-700 group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
            Ridez
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="relative text-sm font-medium text-gray-200 transition-all duration-300 hover:text-blue-400 hover:drop-shadow-[0_0_6px_rgba(59,130,246,0.4)] group">
            Ride Mode
            <span className="absolute left-0 bottom-0 w-0 h-[2px] bg-blue-400 transition-all duration-300 group-hover:w-full"></span>
          </div>
          <Link
            to="/captain-profile"
            className="relative flex items-center justify-center w-10 h-10 transition-all duration-300 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full shadow-md hover:shadow-[0_0_10px_rgba(59,130,246,0.6)] group"
            title="Captain Profile"
          >
            {captain?.profilePic ? (
              <img
                src={captain.profilePic.startsWith('http') ? captain.profilePic : `${import.meta.env.VITE_BASE_URL}${captain.profilePic}`}
                alt="Profile"
                className="object-cover w-full h-full rounded-full"
                onError={() => console.log('Image load error')}
              />
            ) : (
              <span className="text-lg font-semibold text-white">{captain?.fullname?.firstname?.[0] || 'C'}</span>
            )}
            <div className="absolute inset-0 transition-opacity duration-300 border rounded-full opacity-0 border-blue-400/30 group-hover:opacity-100"></div>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex items-center justify-center min-h-screen">
        {isDeactivated ? (
          <div className="fixed inset-0 z-20 flex items-center justify-center bg-gray-900 bg-opacity-50">
            <div className="w-full max-w-md p-6 text-center bg-white shadow-2xl rounded-xl">
              <h2 className="mb-4 text-2xl font-bold text-red-600">Account Deactivated</h2>
              <p className="mb-6 text-gray-700">
                Your account has been deactivated by an admin. You cannot accept rides at this time. Please contact support for assistance.
              </p>
              <button
                onClick={handleLogout}
                className="px-6 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Log Out
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="fixed bottom-0 left-0 right-0 z-20 max-w-md p-6 mx-auto bg-white shadow-xl rounded-t-xl">
              <CaptainDetails />
            </div>

            <div
              ref={ridePopupPanelRef}
              className="fixed bottom-0 left-0 right-0 z-30 max-w-md p-6 mx-auto translate-y-full bg-white shadow-2xl rounded-t-xl"
            >
              {ride && (
                <RidePopUp
                  ride={ride}
                  setRidePopupPanel={setRidePopupPanel}
                  setConfirmRidePopupPanel={setConfirmRidePopupPanel}
                  confirmRide={confirmRide}
                />
              )}
            </div>

            <div
              ref={confirmRidePopupPanelRef}
              className="fixed bottom-0 left-0 right-0 z-30 max-w-md p-6 mx-auto translate-y-full bg-white shadow-2xl rounded-t-xl"
            >
              {confirmRidePopupPanel && ride && ride._id && (
                <ConfirmRidePopUp
                  ride={ride}
                  users={ride.serviceType === 'taxiPool' ? ride.users : null}
                  setRidePopupPanel={setRidePopupPanel}
                  setConfirmRidePopupPanel={setConfirmRidePopupPanel}
                />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

CaptainHome.propTypes = {
  mapsLoaded: PropTypes.bool.isRequired,
};

export default CaptainHome;