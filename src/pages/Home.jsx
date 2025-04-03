// Home.jsx
import React, { useEffect, useRef, useState, useContext } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import axios from "axios";
import "remixicon/fonts/remixicon.css";
import LocationSearchPanel from "../components/LocationSearchPanel";
import VehiclePanel from "../components/VehiclePanel";
import ConfirmRide from "../components/ConfirmRide";
import LookingForDriver from "../components/LookingForDriver";
import WaitingForDriver from "../components/WaitingForDriver";
import { SocketContext } from "../context/SocketContext";
import { UserDataContext } from "../context/UserContext";
import { Link, useNavigate } from "react-router-dom";
import LiveTracking from "../components/LiveTracking";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PropTypes from 'prop-types';

const Home = ({ mapsLoaded }) => {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const vehiclePanelRef = useRef(null);
  const confirmRidePanelRef = useRef(null);
  const vehicleFoundRef = useRef(null);
  const panelRef = useRef(null);
  const waitingForDriverRef = useRef(null);
  const [vehiclePanel, setVehiclePanel] = useState(false);
  const [vehicleFound, setVehicleFound] = useState(false);
  const [confirmRidePanel, setConfirmRidePanel] = useState(false);
  const [waitingForDriver, setWaitingForDriver] = useState(false);
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null);
  const [vehicleType, setVehicleType] = useState("");
  const [ride, setRide] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapLoading, setIsMapLoading] = useState(!mapsLoaded);
  const timerRef = useRef(null);
  const vehicleFoundStateRef = useRef(false);
  const waitingForDriverStateRef = useRef(false);
  const [captainLocation, setCaptainLocation] = useState(null);
  const [isDeactivated, setIsDeactivated] = useState(false);

  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);
  const { user, fetchUser } = useContext(UserDataContext);

  const [fare, setFare] = useState({ car: "", motorcycle: "", auto: "" });

  useEffect(() => {
    vehicleFoundStateRef.current = vehicleFound;
  }, [vehicleFound]);

  useEffect(() => {
    waitingForDriverStateRef.current = waitingForDriver;
  }, [waitingForDriver]);

  useEffect(() => {
    if (!user) fetchUser();

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("Position updated:", latitude, longitude);
        setCurrentPosition({ lat: latitude, lng: longitude });
        setIsLoading(false);
      },
      (error) => {
        console.error("Watch position error:", error);
        setIsLoading(false);
        toast.error("Geolocation failed. Using default location.", {
          position: "top-right",
          autoClose: 3000,
        });
        setCurrentPosition({ lat: -3.745, lng: -38.523 });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [fetchUser, user]);

  useEffect(() => {
    if (mapsLoaded) {
      console.log('Maps loaded in Home');
      setIsMapLoading(false);
    }
  }, [mapsLoaded]);

  useEffect(() => {
    if (!socket || !user) {
      console.log('Socket or user not ready:', { user: !!user, socket: !!socket });
      return;
    }

    socket.emit("join", { role: "user", userId: user._id });
    console.log('User joining with ID:', user._id, 'Socket ID:', socket.id);

    socket.on("ride-confirmed", (ride) => {
      console.log("Ride confirmed:", ride);
      if (timerRef.current) clearTimeout(timerRef.current);
      setRide(ride);
      setVehicleFound(false);
      setWaitingForDriver(true);
    });

    socket.on("ride-started", (ride) => {
      console.log("Ride started:", ride);
      setWaitingForDriver(false);
      navigate("/riding", { state: { ride, vehicleType } });
    });

    socket.on('ride-cancelled', (data) => {
      if (ride && ride._id === data.rideId) {
        console.log("Ride cancelled:", data);
        if (timerRef.current) clearTimeout(timerRef.current);
        setRide(null);
        setWaitingForDriver(false);
        setVehicleFound(false);
        navigate('/home');
        toast.info('Ride cancelled.', { position: 'top-right', autoClose: 3000 });
      }
    });

    socket.on('captain-location-update', (data) => {
      if (ride && ride._id === data.rideId) {
        console.log('Captain location update received:', data.captainLocation);
        setCaptainLocation(data.captainLocation);
      }
    });

    socket.on('no-captains-available', (data) => {
      if (ride && ride._id === data.rideId) {
        console.log('No captains available:', data);
        setRide(null);
        setVehicleFound(false);
        setWaitingForDriver(false);
        toast.error('No captains available nearby.', { position: 'top-right', autoClose: 3000 });
        navigate('/home');
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
      socket.off("ride-confirmed");
      socket.off("ride-started");
      socket.off("ride-cancelled");
      socket.off("captain-location-update");
      socket.off("no-captains-available");
      socket.off("status-changed");
    };
  }, [user, socket, navigate, ride, vehicleType]);

  useEffect(() => {
    if (!ride || !vehicleFound || timerRef.current) return;
    timerRef.current = setTimeout(async () => {
      if (vehicleFoundStateRef.current && !waitingForDriverStateRef.current) {
        try {
          const cancelResponse = await axios.post(
            `${import.meta.env.VITE_BASE_URL}/rides/cancel`,
            { rideId: ride._id },
            { headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` } }
          );
          console.log('Ride cancelled:', cancelResponse.data);
          setRide(null);
          setVehicleFound(false);
          toast.info('No captains available. Ride cancelled.', {
            position: 'top-right',
            autoClose: 3000,
          });
          navigate('/home');
        } catch (error) {
          console.error('Error cancelling ride:', error);
          toast.error('Failed to cancel ride.', { position: 'top-right', autoClose: 3000 });
        }
      }
      timerRef.current = null;
    }, 10000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [ride, vehicleFound, navigate]);

  const handlePickupChange = async (e) => {
    if (!panelOpen) return;
    setPickup(e.target.value);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`,
        {
          params: { input: e.target.value },
          headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
        }
      );
      setPickupSuggestions(response.data.suggestions);
      setActiveField("pickup");
    } catch (error) {
      console.error('Error fetching pickup suggestions:', error);
    }
  };

  const handleDestinationChange = async (e) => {
    if (!panelOpen) return;
    setDestination(e.target.value);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`,
        {
          params: { input: e.target.value },
          headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
        }
      );
      setDestinationSuggestions(response.data.suggestions);
      setActiveField("destination");
    } catch (error) {
      console.error('Error fetching destination suggestions:', error);
    }
  };

  useGSAP(() => {
    if (panelOpen) {
      gsap.fromTo(panelRef.current, { y: '100%' }, { y: 0, duration: 0.5, ease: 'power3.out' });
    } else {
      gsap.to(panelRef.current, {
        y: '100%', duration: 0.5, ease: 'power3.in', onComplete: () => {
          if (vehiclePanel) setVehiclePanel(true);
        }
      });
    }
  }, [panelOpen, vehiclePanel]);

  useGSAP(() => {
    if (vehiclePanel) {
      gsap.fromTo(vehiclePanelRef.current, { y: '100%' }, { y: 0, duration: 0.5, ease: 'power3.out' });
    } else {
      gsap.to(vehiclePanelRef.current, { y: '100%', duration: 0.5, ease: 'power3.in' });
    }
  }, [vehiclePanel]);

  useGSAP(() => {
    if (confirmRidePanel) {
      gsap.fromTo(confirmRidePanelRef.current, { y: '100%' }, { y: 0, duration: 0.5, ease: 'power3.out' });
    } else {
      gsap.to(confirmRidePanelRef.current, { y: '100%', duration: 0.5, ease: 'power3.in' });
    }
  }, [confirmRidePanel]);

  useGSAP(() => {
    if (vehicleFound) {
      gsap.fromTo(vehicleFoundRef.current, { y: '100%' }, { y: 0, duration: 0.5, ease: 'power3.out' });
    } else {
      gsap.to(vehicleFoundRef.current, { y: '100%', duration: 0.5, ease: 'power3.in' });
    }
  }, [vehicleFound]);

  useGSAP(() => {
    if (waitingForDriver) {
      gsap.fromTo(waitingForDriverRef.current, { y: '100%' }, { y: 0, duration: 0.5, ease: 'power3.out' });
    } else {
      gsap.to(waitingForDriverRef.current, { y: '100%', duration: 0.5, ease: 'power3.in' });
    }
  }, [waitingForDriver]);

  const findTrip = async () => {
    if (!pickup || !destination) {
      toast.error('Please select both pickup and destination.', { position: 'top-right', autoClose: 3000 });
      return;
    }
    setVehiclePanel(true);
    setPanelOpen(false);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/rides/get-fare`,
        {
          params: { pickup, destination },
          headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` },
        }
      );
      if (
        typeof response.data.car !== 'number' ||
        typeof response.data.motorcycle !== 'number' ||
        typeof response.data.auto !== 'number'
      ) {
        throw new Error('Invalid fare data received from server');
      }
      setFare({
        car: response.data.car.toString(),
        motorcycle: response.data.motorcycle.toString(),
        auto: response.data.auto.toString(),
      });
    } catch (error) {
      console.error("Error fetching fare:", error);
      toast.error('Failed to fetch fare. Please try again.', { position: 'top-right', autoClose: 3000 });
      setFare({ car: "", motorcycle: "", auto: "" });
      setVehiclePanel(false);
      setPanelOpen(true);
    }
  };

  const createRide = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/create`,
        { pickup, destination, vehicleType },
        { headers: { Authorization: `Bearer ${localStorage.getItem('userToken')}` } }
      );
      const rideData = response.data.ride;
      setRide(rideData);
      setConfirmRidePanel(false);
      setVehicleFound(true);
      console.log("Ride Created:", rideData);
      toast.success('Ride created successfully!', { position: 'top-right', autoClose: 3000 });
    } catch (error) {
      console.error("Full error object:", error);
      console.error("Error response:", error.response);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create ride';
      if (errorMessage === 'Your account is deactivated. You cannot create rides.') {
        toast.error('Your account is deactivated. You cannot create rides.', {
          position: 'top-right',
          autoClose: 3000,
        });
        setIsDeactivated(true);
        setConfirmRidePanel(false);
        setVehiclePanel(false);
        setPanelOpen(false);
      } else {
        toast.error(errorMessage, { position: 'top-right', autoClose: 3000 });
        setConfirmRidePanel(false);
        setVehiclePanel(true);
      }
    }
  };

  const handlePanelClose = () => {
    setPanelOpen(false);
    setIsFullScreen(false);
    setPickup("");
    setDestination("");
    setActiveField(null);
    setPickupSuggestions([]);
    setDestinationSuggestions([]);
  };

  const handleBookRideClick = () => {
    setPanelOpen(true);
    setIsFullScreen(false);
    setActiveField(null);
  };

  const handleProfileClick = (e) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      e.preventDefault();
      toast.error('Please log in to view your profile.', { position: 'top-right', autoClose: 3000 });
      navigate('/login');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <span className="text-xl font-semibold text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen font-sans bg-gray-50">
      <div className="absolute inset-0 z-0">
        {isMapLoading ? (
          <div className="flex items-center justify-center h-full bg-gray-200">
            <span className="text-lg text-gray-600">Loading Map...</span>
          </div>
        ) : (
          <LiveTracking
            currentPosition={currentPosition}
            ride={ride}
            captainLocation={captainLocation}
            userType="rider" // Add userType prop
          />
        )}
      </div>

      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-3 shadow-lg bg-gradient-to-r from-gray-900 to-gray-800">
        <Link to="/home" className="flex items-center space-x-2 group">
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
            to="/user-profile"
            onClick={handleProfileClick}
            className="relative flex items-center justify-center w-10 h-10 transition-all duration-300 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full shadow-md hover:shadow-[0_0_10px_rgba(59,130,246,0.6)] group"
            title="User Profile"
          >
            {user?.profilePic ? (
              <img
                src={user.profilePic.startsWith('http') ? user.profilePic : `${import.meta.env.VITE_BASE_URL}${user.profilePic}`}
                alt="Profile"
                className="object-cover w-full h-full rounded-full"
                onError={() => console.log('Image load error')}
              />
            ) : (
              <span className="text-lg font-semibold text-white">{user?.name?.[0] || 'U'}</span>
            )}
            <div className="absolute inset-0 transition-opacity duration-300 border rounded-full opacity-0 border-blue-400/30 group-hover:opacity-100"></div>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex items-center justify-center min-h-screen pt-20 pb-24">
        {isDeactivated ? (
          <div className="w-full max-w-md p-6 mx-4 text-center bg-white shadow-2xl rounded-xl">
            <h2 className="mb-4 text-2xl font-bold text-red-600">Account Deactivated</h2>
            <p className="text-gray-700">
              Your account has been deactivated by an admin. You cannot book rides at this time. Please contact support for assistance.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('userToken');
                navigate('/login');
              }}
              className="px-6 py-2 mt-6 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Log Out
            </button>
          </div>
        ) : (
          <>
            {panelOpen && (
              <div
                ref={panelRef}
                className="w-full max-w-md p-6 mx-4 transform translate-y-full bg-white shadow-2xl rounded-xl"
              >
                <div className="flex justify-center mb-4">
                  <div
                    onClick={handlePanelClose}
                    className="w-16 h-1 transition bg-gray-300 rounded-full cursor-pointer hover:bg-gray-400"
                  ></div>
                </div>
                <h2 className="mb-6 text-3xl font-bold text-center text-gray-900">Plan Your Ride</h2>
                <div className="space-y-5">
                  <div className="relative">
                    <i className="absolute text-xl text-gray-500 transform -translate-y-1/2 left-3 top-1/2 ri-map-pin-user-fill"></i>
                    <input
                      value={pickup}
                      onChange={handlePickupChange}
                      className="w-full py-3 pl-12 pr-4 text-gray-800 placeholder-gray-400 transition bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      type="text"
                      placeholder="Pickup Location"
                    />
                  </div>
                  <div className="relative">
                    <i className="absolute text-xl text-gray-500 transform -translate-y-1/2 left-3 top-1/2 ri-map-pin-2-fill"></i>
                    <input
                      value={destination}
                      onChange={handleDestinationChange}
                      className="w-full py-3 pl-12 pr-4 text-gray-800 placeholder-gray-400 transition bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      type="text"
                      placeholder="Destination"
                    />
                  </div>
                  <button
                    onClick={findTrip}
                    className="w-full py-3 font-semibold text-white transition bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300"
                  >
                    Find a Ride
                  </button>
                </div>
                {activeField && (
                  <LocationSearchPanel
                    suggestions={
                      Array.isArray(activeField === "pickup" ? pickupSuggestions : destinationSuggestions)
                        ? activeField === "pickup" ? pickupSuggestions : destinationSuggestions
                        : []
                    }
                    setPanelOpen={setPanelOpen}
                    setVehiclePanel={setVehiclePanel}
                    setPickup={setPickup}
                    setDestination={setDestination}
                    activeField={activeField}
                  />
                )}
              </div>
            )}

            <div
              ref={vehiclePanelRef}
              className="fixed bottom-0 left-0 right-0 z-20 max-w-md p-6 mx-auto translate-y-full bg-white shadow-lg rounded-t-xl"
            >
              <VehiclePanel
                setVehicleType={setVehicleType}
                selectVehicle={setVehicleType}
                setConfirmRidePanel={setConfirmRidePanel}
                pickup={pickup}
                destination={destination}
                fare={fare}
                setVehiclePanel={setVehiclePanel}
                setVehicle={createRide}
                vehicleType={vehicleType}
              />
            </div>

            {vehicleType && confirmRidePanel && (
              <div
                ref={confirmRidePanelRef}
                className="fixed bottom-0 left-0 right-0 z-20 max-w-md p-6 mx-auto translate-y-full bg-white shadow-lg rounded-t-xl"
              >
                <ConfirmRide
                  createRide={createRide}
                  pickup={pickup}
                  destination={destination}
                  fare={fare}
                  vehicleType={vehicleType}
                  setVehicleFound={setVehicleFound}
                  setConfirmRidePanel={setConfirmRidePanel}
                />
              </div>
            )}

            {vehicleType && vehicleFound && (
              <div
                ref={vehicleFoundRef}
                className="fixed bottom-0 left-0 right-0 z-20 max-w-md p-6 mx-auto translate-y-full bg-white shadow-lg rounded-t-xl"
              >
                <LookingForDriver
                  createRide={createRide}
                  pickup={pickup}
                  destination={destination}
                  fare={fare}
                  vehicleType={vehicleType}
                  setConfirmRidePanel={setConfirmRidePanel}
                  setVehicleFound={setVehicleFound}
                  setVehiclePanel={setVehiclePanel}
                />
              </div>
            )}
            <div
              ref={waitingForDriverRef}
              className="fixed bottom-0 left-0 right-0 z-20 max-w-md p-6 mx-auto translate-y-full bg-white shadow-lg rounded-t-xl"
            >
              {waitingForDriver && ride && ride._id && (
                <WaitingForDriver
                  ride={ride}
                  setWaitingForDriver={setWaitingForDriver}
                  setVehicleFound={setVehicleFound}
                  vehicleType={vehicleType}
                />
              )}
            </div>

            {!panelOpen && !vehiclePanel && !confirmRidePanel && !vehicleFound && !waitingForDriver && (
              <button
                onClick={handleBookRideClick}
                className="fixed z-30 flex items-center gap-2 px-8 py-4 text-lg font-semibold text-white transition transform -translate-x-1/2 bg-blue-600 rounded-full shadow-xl bottom-8 left-1/2 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300"
              >
                <i className="text-2xl ri-search-line"></i>
                <span>Book a Ride</span>
              </button>
            )}
          </>
        )}
      </main>
    </div>
  );
};

Home.propTypes = {
  mapsLoaded: PropTypes.bool.isRequired,
};

export default Home;