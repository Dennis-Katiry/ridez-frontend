import React, { useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const WaitingForDriver = ({ setWaitingForDriver, ride, vehicleType }) => {
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (!socket || !ride || !ride._id) {
      console.error('No ride data or socket available, navigating to /home');
      navigate('/home');
      return;
    }

    console.log('Vehicle Type in WaitingForDriver:', vehicleType);

    socket.on('ride-cancelled', (data) => {
      if (data.rideId === ride._id && data.initiator !== 'user') {
        toast.error(data.message, {
          position: 'top-right',
          autoClose: 3000,
        });
        setWaitingForDriver(false);
        setTimeout(() => navigate('/home', { replace: true }), 1500);
      }
    });

    socket.on('ride-accepted', async (data) => {
      if (data.rideId === ride._id) {
        console.log('Ride accepted event received:', data);
        try {
          // Fetch the updated ride data to ensure we have the captain information
          const token = localStorage.getItem('userToken');
          const response = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/rides/status`,
            {
              params: { rideId: ride._id },
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const updatedRide = response.data;
          console.log('Updated ride data:', updatedRide);
          setWaitingForDriver(false);
          navigate('/riding', { state: { ride: updatedRide, vehicleType } });
        } catch (error) {
          console.error('Error fetching updated ride data:', error);
          toast.error('Failed to fetch updated ride data. Proceeding with existing data.');
          setWaitingForDriver(false);
          navigate('/riding', { state: { ride, vehicleType } });
        }
      }
    });

    return () => {
      socket.off('ride-cancelled');
      socket.off('ride-accepted');
    };
  }, [socket, ride, navigate, setWaitingForDriver, vehicleType]);

  const cancelRide = async () => {
    if (!ride._id || !/^[0-9a-fA-F]{24}$/.test(ride._id)) {
      console.error('Invalid rideId:', ride._id);
      toast.error('Invalid ride ID. Please try again.', {
        position: 'top-right',
        autoClose: 3000,
      });
      return;
    }
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    setShowCancelModal(false);
    try {
      const token = localStorage.getItem('userToken');
      console.log('Token for cancel (WaitingForDriver):', token);
      if (!token) throw new Error('No user token found.');

      const statusResponse = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/rides/status`,
        {
          params: { rideId: ride._id },
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('Ride status:', statusResponse.data.status);

      const rideStatus = statusResponse.data.status;
      if (rideStatus === 'completed' || rideStatus === 'cancelled') {
        toast.error('This ride cannot be cancelled as it is already completed or cancelled.');
        setWaitingForDriver(false);
        navigate('/home', { replace: true });
        return;
      }
      if (rideStatus !== 'pending' && rideStatus !== 'accepted') {
        toast.error('This ride cannot be cancelled at this stage.');
        setWaitingForDriver(false);
        navigate('/home', { replace: true });
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/cancel`,
        { rideId: ride._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Cancel response:', response.data);
      if (response.status === 200) {
        toast.success('Ride cancelled successfully!');
        setWaitingForDriver(false);
        setTimeout(() => navigate('/home', { replace: true }), 1500);
      } else {
        throw new Error('Unexpected server response');
      }
    } catch (error) {
      console.error('Error canceling ride:', error.response?.data || error.message);
      let errorMessage = 'Failed to cancel ride. Please try again.';
      if (error.response?.data?.error === 'Ride already completed or cancelled') {
        errorMessage = 'This ride cannot be cancelled as it is already completed or cancelled.';
      }
      toast.error(errorMessage);
    }
  };

  const cancelModalClose = () => {
    setShowCancelModal(false);
  };

  return (
    <div className="flex flex-col justify-between p-4 bg-white shadow-2xl rounded-t-3xl" style={{ maxHeight: '60vh', height: 'auto', minHeight: '400px' }}>
      <div>
        <div className="flex justify-center mb-4">
          <button
            onClick={() => setWaitingForDriver(false)}
            className="w-12 h-1 transition duration-200 bg-gray-300 rounded-full cursor-pointer hover:bg-gray-400"
          ></button>
        </div>

        <div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-gray-50">
          <img
            className="object-contain w-16 h-16"
            src={vehicleType ? (vehicleImages[vehicleType] || vehicleImages.car) : vehicleImages.car}
            alt={`${vehicleNames[vehicleType] || "Ride"} Vehicle`}
          />
          <div className="text-right">
            <h2 className="text-sm font-medium text-gray-800 capitalize">
              {ride.captain ? `${ride.captain.fullname?.firstname || 'Unknown'} ${ride.captain.fullname?.lastname || ''}` : 'Waiting for Captain'}
            </h2>
            <h4 className="mt-1 text-base font-semibold text-gray-900">
              {ride.captain?.vehicle?.plate || 'N/A'}
            </h4>
            <p className="text-sm text-gray-600">{vehicleNames[vehicleType] || 'Unknown'}</p>
            <h5 className="px-2 py-1 mt-1 text-base font-semibold text-gray-900 bg-gray-100 rounded-md">
              {ride.otp || 'N/A'}
            </h5>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center p-3 rounded-lg bg-gray-50">
            <div className="flex-shrink-0 mr-3">
              <i className="text-xl text-blue-600 ri-map-pin-user-fill"></i>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900">Pickup</h4>
              <p className="text-sm text-gray-600 truncate">{ride.pickup || 'Not selected'}</p>
            </div>
          </div>

          <div className="flex items-center p-3 rounded-lg bg-gray-50">
            <div className="flex-shrink-0 mr-3">
              <i className="text-xl text-blue-600 ri-map-pin-2-fill"></i>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900">Destination</h4>
              <p className="text-sm text-gray-600 truncate">{ride.destination || 'Not selected'}</p>
            </div>
          </div>

          <div className="flex items-center p-3 rounded-lg bg-gray-50">
            <div className="flex-shrink-0 mr-3">
              <i className="text-xl text-blue-600 ri-money-rupee-circle-line"></i>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900">Fare</h4>
              <p className="text-sm text-gray-600">Cash: ₹{ride.fare ? ride.fare.toFixed(2) : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={cancelRide}
          className="w-full py-2 text-base font-semibold text-white transition duration-200 bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-300"
        >
          Cancel Ride
        </button>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-11/12 max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Confirm Cancellation</h3>
            <p className="mb-6 text-gray-600">Are you sure you want to cancel this ride?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelModalClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                No
              </button>
              <button
                onClick={confirmCancel}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Yes
              </button>
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

WaitingForDriver.propTypes = {
  setWaitingForDriver: PropTypes.func.isRequired,
  vehicleType: PropTypes.string.isRequired,
  ride: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    captain: PropTypes.shape({
      fullname: PropTypes.shape({
        firstname: PropTypes.string,
        lastname: PropTypes.string,
      }),
      vehicle: PropTypes.shape({
        plate: PropTypes.string,
      }),
    }),
    pickup: PropTypes.string,
    destination: PropTypes.string,
    fare: PropTypes.number,
    otp: PropTypes.string,
    vehicleType: PropTypes.string,
  }).isRequired,
};

export default WaitingForDriver;