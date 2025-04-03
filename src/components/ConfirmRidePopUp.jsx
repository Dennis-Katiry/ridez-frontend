import React, { useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ConfirmRidePopUp = ({ setRidePopupPanel, setConfirmRidePopupPanel, ride, users }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);

  useEffect(() => {
    if (!socket || !ride || !ride._id) {
      console.error('No ride data or socket available, navigating to /captain-home');
      navigate('/captain-home');
      return;
    }

    socket.on('ride-cancelled', (data) => {
      if (data.rideId === ride._id && data.initiator !== 'captain') {
        toast.error(data.message, { position: 'top-right', autoClose: 3000 });
        setConfirmRidePopupPanel(false);
        setRidePopupPanel(false);
        setTimeout(() => navigate('/captain-home', { replace: true }), 1500);
      }
    });

    return () => {
      socket.off('ride-cancelled');
    };
  }, [socket, ride, navigate, setConfirmRidePopupPanel, setRidePopupPanel]);

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('captainToken');
      console.log('Token for start-ride:', token);
      if (!token) throw new Error('No captain token found');

      console.log('Submitting OTP:', { rideId: ride._id, otp });
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/rides/start-ride`, {
        params: { rideId: ride._id, otp: otp },
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Start ride response:', response.status, response.data);
      if (response.status === 200) {
        // Emit the start-ride event via socket to update the ride status to "ongoing"
        socket.emit('start-ride', { rideId: ride._id });
        console.log('Emitted start-ride event for rideId:', ride._id);

        setConfirmRidePopupPanel(false);
        setRidePopupPanel(false);
        setError('');
        // Navigate to CaptainRiding with the updated ride data
        navigate('/captain-riding', { state: { ride: response.data } });
      } else {
        console.log('Unexpected status:', response.status);
        setError('Unexpected server response. Please try again.');
      }
    } catch (error) {
      console.error('Error starting ride:', error.response?.status, error.response?.data || error.message);
      if (error.response?.status === 400) {
        setError('Invalid OTP. Please try again.');
      } else if (error.response?.status === 401) {
        setError('Unauthorized: Invalid or missing token.');
      } else {
        setError('Failed to start ride. Please check your connection and try again.');
      }
    }
  };

  const handleCancelRide = () => {
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    setShowCancelModal(false);
    try {
      const token = localStorage.getItem('captainToken');
      console.log('Token for cancel (ConfirmRidePopup):', token);
      if (!token) throw new Error('No captain token found');

      console.log('Attempting to cancel ride with rideId:', ride._id);
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/cancel`,
        { rideId: ride._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Cancel ride response:', response.status, response.data);
      if (response.status === 200) {
        toast.success('Ride cancelled successfully!', { position: 'top-right', autoClose: 3000 });
        setConfirmRidePopupPanel(false);
        setRidePopupPanel(false);
        setTimeout(() => navigate('/captain-home', { replace: true }), 1500);
      } else {
        throw new Error('Unexpected server response');
      }
    } catch (error) {
      console.error('Error canceling ride:', error.response?.status, error.response?.data || error.message);
      let errorMessage = 'Failed to cancel ride. Please try again or check your connection.';
      if (error.response?.status === 400) {
        errorMessage = error.response?.data?.error || 'Invalid cancellation request.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Unauthorized: Invalid or missing token.';
      }
      toast.error(errorMessage, { position: 'top-right', autoClose: 3000 });
    }
  };

  const cancelModalClose = () => {
    setShowCancelModal(false);
    console.log('Captain chose not to cancel the ride');
  };

  if (!ride) {
    return null;
  }

  return (
    <div className="p-4 bg-white rounded-t-3xl shadow-2xl max-h-[70vh] overflow-y-auto">
      <div className="flex justify-center mb-3">
        <button
          onClick={() => setConfirmRidePopupPanel(false)}
          className="w-10 h-1 transition duration-200 bg-gray-300 rounded-full cursor-pointer hover:bg-gray-400"
        ></button>
      </div>

      <h3 className="mb-3 text-lg font-bold text-center text-gray-800">Confirm Ride to Start</h3>

      {ride.serviceType === 'taxiPool' ? (
        // Display multiple passengers for taxiPool rides
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-800">Passengers:</h4>
          {users && users.length > 0 ? (
            users.map((userEntry, index) => (
              <div key={index} className="flex items-center justify-between p-2 mb-2 bg-yellow-100 border border-yellow-300 rounded-lg">
                <div className="flex items-center gap-2">
                  <img
                    className="object-cover w-8 h-8 rounded-full ring-2 ring-yellow-400"
                    src="https://plus.unsplash.com/premium_photo-1689551670902-19b441a6afde?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cmFuZG9tJTIwcGVvcGxlfGVufDB8fDB8fHww"
                    alt="User"
                    loading="lazy"
                  />
                  <h2 className="text-sm font-medium text-gray-800 capitalize">
                    {userEntry.userId?.fullname?.firstname || 'Unknown'} {userEntry.userId?.fullname?.lastname || ''}
                  </h2>
                </div>
                <h5 className="text-xs font-semibold text-gray-700">
                  2.2km {/* Calculate distance if needed */}
                </h5>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-600">No passengers found.</p>
          )}

          {users && users.length > 0 && users.map((userEntry, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                <i className="text-base text-gray-500 ri-map-pin-user-fill"></i>
                <div>
                  <h4 className="text-xs font-semibold text-gray-800">Pickup (Passenger {index + 1})</h4>
                  <p className="text-xs text-gray-600">{userEntry.pickup || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                <i className="text-base text-gray-500 ri-map-pin-2-fill"></i>
                <div>
                  <h4 className="text-xs font-semibold text-gray-800">Destination (Passenger {index + 1})</h4>
                  <p className="text-xs text-gray-600">{userEntry.destination || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                <i className="text-base text-gray-500 ri-money-rupee-circle-line"></i>
                <div>
                  <h4 className="text-xs font-semibold text-gray-800">Fare (Passenger {index + 1})</h4>
                  <p className="text-xs text-gray-600">Cash: ₹{userEntry.fareShare ? userEntry.fareShare.toFixed(2) : 'Loading...'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Display single user for solo/intercity rides
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 mb-2 bg-yellow-100 border border-yellow-300 rounded-lg">
            <div className="flex items-center gap-2">
              <img
                className="object-cover w-8 h-8 rounded-full ring-2 ring-yellow-400"
                src="https://plus.unsplash.com/premium_photo-1689551670902-19b441a6afde?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cmFuZG9tJTIwcGVvcGxlfGVufDB8fDB8fHww"
                alt="User"
                loading="lazy"
              />
              <h2 className="text-sm font-medium text-gray-800 capitalize">
                {ride.user?.fullname?.firstname || 'Unknown'} {ride.user?.fullname?.lastname || ''}
              </h2>
            </div>
            <h5 className="text-xs font-semibold text-gray-700">
              2.2km {/* Calculate distance if needed */}
            </h5>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
            <i className="text-base text-gray-500 ri-map-pin-user-fill"></i>
            <div>
              <h4 className="text-xs font-semibold text-gray-800">Pickup</h4>
              <p className="text-xs text-gray-600">{ride.pickup || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
            <i className="text-base text-gray-500 ri-map-pin-2-fill"></i>
            <div>
              <h4 className="text-xs font-semibold text-gray-800">Destination</h4>
              <p className="text-xs text-gray-600">{ride.destination || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
            <i className="text-base text-gray-500 ri-money-rupee-circle-line"></i>
            <div>
              <h4 className="text-xs font-semibold text-gray-800">Fare</h4>
              <p className="text-xs text-gray-600">Cash: ₹{ride.fare ? ride.fare.toFixed(2) : 'Loading...'}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3">
        <form onSubmit={submitHandler} className="space-y-2">
          <div>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full px-3 py-2 font-mono text-sm placeholder-gray-400 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter OTP"
              autoComplete="off"
            />
            {error && (
              <p className="mt-1 text-xs text-red-600">{error}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 text-sm font-semibold text-white transition duration-200 bg-green-600 rounded-lg shadow-md hover:bg-green-700"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={handleCancelRide}
              className="flex-1 py-2 text-sm font-semibold text-white transition duration-200 bg-red-600 rounded-lg shadow-md hover:bg-red-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-11/12 max-w-sm p-4 bg-white rounded-lg shadow-2xl">
            <h3 className="mb-3 text-base font-semibold text-gray-800">Confirm Cancellation</h3>
            <p className="mb-4 text-sm text-gray-600">Are you sure you want to cancel this ride?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelModalClose}
                className="px-3 py-1.5 text-sm text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                No
              </button>
              <button
                onClick={confirmCancel}
                className="px-3 py-1.5 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
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

ConfirmRidePopUp.propTypes = {
  setRidePopupPanel: PropTypes.func.isRequired,
  setConfirmRidePopupPanel: PropTypes.func.isRequired,
  ride: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    user: PropTypes.shape({
      fullname: PropTypes.shape({
        firstname: PropTypes.string,
        lastname: PropTypes.string,
      }),
    }), // Optional for taxiPool rides
    users: PropTypes.array, // For taxiPool rides
    serviceType: PropTypes.string.isRequired,
    pickup: PropTypes.string,
    destination: PropTypes.string,
    fare: PropTypes.number,
  }).isRequired,
  users: PropTypes.array, // Add users prop for taxiPool rides
};

export default ConfirmRidePopUp;