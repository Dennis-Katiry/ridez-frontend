// Riding.jsx
import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SocketContext } from '../context/SocketContext';
import LiveTracking from '../components/LiveTracking';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Riding = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);
  const { ride, vehicleType: passedVehicleType } = location.state || {};
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [captainLocation, setCaptainLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [rideStatus, setRideStatus] = useState(ride?.status || 'accepted');

  const effectiveVehicleType = passedVehicleType || ride?.vehicleType;

  useEffect(() => {
    if (!socket) {
      console.error('Socket not initialized in Riding.jsx');
      toast.error('Connection issue. Please try again.');
      navigate('/home');
      return;
    }

    if (!ride || !ride._id) {
      console.error('No ride data available, navigating to /home');
      navigate('/home');
      return;
    }

    console.log('Riding ride:', ride);
    console.log('Socket connected:', socket.connected);
    console.log('Passed Vehicle Type from location.state:', passedVehicleType);
    console.log('Ride Vehicle Type from ride object:', ride?.vehicleType);
    console.log('Effective Vehicle Type in Riding:', effectiveVehicleType);

    socket.emit('join', { userType: 'user', userId: ride.user._id });
    console.log('User joined room:', `user:${ride.user._id}`);

    let watchId;
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(location);
          console.log('Initial user location:', location);
        },
        (error) => {
          console.error('Initial user location error:', error);
          // Fallback to pickup coordinates if available
          if (ride?.pickupCoordinates) {
            setUserLocation(ride.pickupCoordinates);
            console.log('Using pickup coordinates as fallback for user location:', ride.pickupCoordinates);
          }
          toast.warn('Unable to fetch your location. Using default map center.', {
            position: 'top-right',
            autoClose: 3000,
          });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(location);
          console.log('User location updated:', location);
        },
        (error) => {
          console.error('User location watch error:', error);
          // Fallback to pickup coordinates if available
          if (!userLocation && ride?.pickupCoordinates) {
            setUserLocation(ride.pickupCoordinates);
            console.log('Using pickup coordinates as fallback for user location on watch error:', ride.pickupCoordinates);
          }
          toast.warn('Unable to track your location.', {
            position: 'top-right',
            autoClose: 3000,
          });
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
      );
    } else {
      console.error('Geolocation not supported');
      // Fallback to pickup coordinates if available
      if (ride?.pickupCoordinates) {
        setUserLocation(ride.pickupCoordinates);
        console.log('Using pickup coordinates as fallback for user location (no geolocation support):', ride.pickupCoordinates);
      }
      toast.error('Geolocation is not supported on this device.');
    }

    socket.on('captain-location-update', (data) => {
      if (data.rideId === ride._id) {
        console.log('Captain location update received:', data.captainLocation);
        setCaptainLocation(data.captainLocation);
      } else {
        console.log('Captain location update ignored (rideId mismatch):', data.rideId, 'vs', ride._id);
      }
    });

    socket.on('ride-status-updated', async (data) => {
      if (data.rideId === ride._id) {
        console.log('Ride status updated:', data.status);
        setRideStatus(data.status);

        try {
          const token = localStorage.getItem('userToken');
          const response = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/rides/status`,
            {
              params: { rideId: ride._id },
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const updatedRide = response.data;
          location.state.ride = { ...ride, ...updatedRide, pickupCoordinates: updatedRide.pickupCoordinates, destinationCoordinates: updatedRide.destinationCoordinates };
        } catch (error) {
          console.error('Error fetching updated ride data:', error);
        }
      }
    });

    socket.on('ride-ended', (data) => {
      console.log('Ride ended event received:', data);
      if (data.rideId === ride._id) {
        navigate(`/rider-feedback?rideId=${ride._id}`);
      }
    });

    socket.on('ride-cancelled', (data) => {
      if (data.rideId === ride._id && data.initiator !== 'user') {
        toast.error(data.message, { position: 'top-right', autoClose: 3000 });
        setTimeout(() => navigate('/home', { replace: true }), 1500);
      }
    });

    socket.on('payment-completed', (data) => {
      if (data.rideId === ride._id) {
        toast.success('Payment completed successfully!', { position: 'top-right', autoClose: 3000 });
        if (ride.status === 'completed') {
          navigate(`/rider-feedback?rideId=${ride._id}`);
        }
      }
    });

    const pollRideStatus = setInterval(async () => {
      try {
        const token = localStorage.getItem('userToken');
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/rides/status`,
          {
            params: { rideId: ride._id },
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const { status, pickupCoordinates, destinationCoordinates } = response.data;
        setRideStatus(status);
        location.state.ride = { ...ride, status, pickupCoordinates, destinationCoordinates };
        if (status === 'completed') {
          console.log('Ride status is completed, navigating to rider-feedback');
          navigate(`/rider-feedback?rideId=${ride._id}`);
          clearInterval(pollRideStatus);
        }
      } catch (error) {
        console.error('Error polling ride status:', error);
      }
    }, 5000);

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
      socket.off('captain-location-update');
      socket.off('ride-status-updated');
      socket.off('ride-ended');
      socket.off('ride-cancelled');
      socket.off('payment-completed');
      clearInterval(pollRideStatus);
    };
  }, [socket, navigate, ride, effectiveVehicleType, passedVehicleType]);

  const handleCancelRide = () => {
    if (!ride?._id) return;
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    setShowCancelModal(false);
    try {
      const token = localStorage.getItem('userToken');
      console.log('Token sent to /rides/cancel:', token);

      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/cancel`,
        { rideId: ride._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Ride cancellation response:', response.data);
      toast.success('Ride cancelled successfully!', { position: 'top-right', autoClose: 3000 });
      setTimeout(() => navigate('/home', { replace: true }), 1500);
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error';
      console.error('Error cancelling ride:', errorMsg, 'Status:', error.response?.status);
      console.log('Full error response:', error.response?.data);
      toast.error(`Failed to cancel ride: ${errorMsg}`, { position: 'top-right', autoClose: 3000 });
    }
  };

  const cancelModalClose = () => {
    setShowCancelModal(false);
  };

  const handlePayment = async () => {
    if (!ride?._id || ride.paymentStatus === 'completed') {
      toast.info(ride.paymentStatus === 'completed' ? 'Payment already completed.' : 'Ride data missing.');
      return;
    }
    if (!window.Razorpay) {
      toast.error('Payment service unavailable.');
      return;
    }

    setIsPaymentProcessing(true);
    try {
      const token = localStorage.getItem('userToken');
      console.log('Token for payment:', token);
      if (!token) throw new Error('Authentication token missing. Please log in again.');

      const orderResponse = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/create-payment-order`,
        { rideId: ride._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { orderId, amount, currency } = orderResponse.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount,
        currency,
        name: 'Ridez',
        description: `Payment for ride ${ride._id}`,
        order_id: orderId,
        handler: async (response) => {
          const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = response;
          try {
            const verifyResponse = await axios.post(
              `${import.meta.env.VITE_BASE_URL}/rides/verify-payment`,
              {
                rideId: ride._id,
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                signature: razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('Payment verification response:', verifyResponse.data);
          } catch (error) {
            toast.error(`Verification failed: ${error.response?.data?.error || 'Unknown error'}`);
          } finally {
            setIsPaymentProcessing(false);
          }
        },
        prefill: { name: ride.user?.fullname?.firstname || 'User', email: ride.user?.email || '' },
        theme: { color: '#3399cc' },
        modal: { ondismiss: () => setIsPaymentProcessing(false) },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response) => {
        toast.error(`Payment failed: ${response.error.description}`);
        setIsPaymentProcessing(false);
      });
      razorpay.open();
    } catch (error) {
      console.error('Payment error:', error.response?.data || error.message);
      toast.error(`Failed to initiate payment: ${error.response?.data?.error || error.message}`);
      setIsPaymentProcessing(false);
    }
  };

  if (!ride || !ride._id) return null;

  console.log('Rendering with effectiveVehicleType:', effectiveVehicleType);
  console.log('Vehicle Image:', vehicleImages[effectiveVehicleType] || vehicleImages.car);
  console.log('Vehicle Name:', vehicleNames[effectiveVehicleType] || 'Unknown');

  return (
    <div className="relative h-screen bg-gray-100">
      <div className="absolute inset-0 z-0">
        <LiveTracking
          currentPosition={userLocation}
          captainLocation={captainLocation}
          pickupCoordinates={ride?.pickupCoordinates}
          destinationCoordinates={ride?.destinationCoordinates}
          ride={ride}
          rideStatus={rideStatus}
          userType="rider"
        />
      </div>

      <Link to="/home" className="fixed flex items-center justify-center w-10 h-10 transition duration-200 bg-white rounded-full shadow-md right-4 top-4 hover:bg-gray-100">
        <i className="text-xl text-gray-600 ri-home-3-line"></i>
      </Link>

      <div className="fixed bottom-0 left-0 right-0 z-10 flex flex-col justify-between w-11/12 max-w-md p-3 mx-auto bg-white shadow-2xl rounded-t-3xl" style={{ maxHeight: '45vh', height: 'auto', minHeight: '300px' }}>
        <div>
          <div className="flex items-center justify-between p-2 mb-2 rounded-lg bg-gray-50">
            <img
              className="object-contain w-14 h-14"
              src={effectiveVehicleType ? vehicleImages[effectiveVehicleType] : vehicleImages.car}
              alt={`${vehicleNames[effectiveVehicleType] || "Ride"} Vehicle`}
            />
            <div className="text-right">
              <h2 className="text-xs font-medium text-gray-800 capitalize">
                {ride.captain?.fullname?.firstname || 'Unknown'} {ride.captain?.fullname?.lastname || ''}
              </h2>
              <h4 className="mt-1 text-sm font-semibold text-gray-900">{ride.captain?.vehicle?.plate || 'N/A'}</h4>
              <p className="text-xs text-gray-600">{effectiveVehicleType ? vehicleNames[effectiveVehicleType] : 'Unknown'}</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center p-2 rounded-lg bg-gray-50">
              <div className="flex-shrink-0 mr-2">
                <i className="text-lg text-blue-600 ri-map-pin-2-fill"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-gray-900">Destination</h4>
                <p className="text-xs text-gray-600 truncate">{ride.destination || 'Not selected'}</p>
              </div>
            </div>
            <div className="flex items-center p-2 rounded-lg bg-gray-50">
              <div className="flex-shrink-0 mr-2">
                <i className="text-lg text-blue-600 ri-money-rupee-circle-line"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-gray-900">Fare</h4>
                <p className="text-xs text-gray-600">Cash: ₹{ride.fare ? ride.fare.toFixed(2) : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={handlePayment}
            className="flex-1 py-2 text-sm font-semibold text-white transition duration-200 bg-blue-600 rounded-md shadow-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            disabled={isPaymentProcessing || ride.paymentStatus === 'completed'}
          >
            {isPaymentProcessing ? 'Processing...' : 'Make a Payment'}
          </button>
          <button
            onClick={handleCancelRide}
            className="flex-1 py-2 text-sm font-semibold text-white transition duration-200 bg-red-600 rounded-md shadow-md hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed"
            disabled={rideStatus === 'completed' || rideStatus === 'cancelled' || ride.paymentStatus === 'completed'}
          >
            Cancel Ride
          </button>
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-11/12 max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Confirm Cancellation</h3>
            <p className="mb-6 text-gray-600">Are you sure you want to cancel this ride?</p>
            <div className="flex justify-end gap-4">
              <button onClick={cancelModalClose} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">No</button>
              <button onClick={confirmCancel} className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700">Yes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const vehicleImages = {
  car: "https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,h_552,w_552/v1555367310/assets/30/51e602-10bb-4e65-b122-e394d80a9c47/original/Final_UberX.png",
  motorcycle: "https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,h_368,w_552/v1649231091/assets/2c/7fa194-c954-49b2-9c6d-a3b8601370f5/original/Uber_Moto_Orange_312x208_pixels_Mobile.png",
  auto: "https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,h_368,w_552/v1648431773/assets/1d/db8c56-0204-4ce4-81ce-56a11a07fe98/original/Uber_Auto_558x372_pixels_Desktop.png",
};

const vehicleNames = {
  car: "RidezGo",
  motorcycle: "Moto",
  auto: "RidezAuto",
};

Riding.propTypes = {
  ride: PropTypes.shape({
    _id: PropTypes.string,
    captain: PropTypes.shape({
      fullname: PropTypes.shape({
        firstname: PropTypes.string,
        lastname: PropTypes.string,
      }),
      vehicle: PropTypes.shape({
        plate: PropTypes.string,
      }),
    }),
    destination: PropTypes.string,
    fare: PropTypes.number,
    status: PropTypes.string,
    paymentStatus: PropTypes.string,
    user: PropTypes.shape({
      fullname: PropTypes.shape({
        firstname: PropTypes.string,
      }),
      email: PropTypes.string,
    }),
    vehicleType: PropTypes.oneOf(['car', 'motorcycle', 'auto']),
  }),
};

export default Riding;