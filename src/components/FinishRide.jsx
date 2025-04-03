import React, { useContext } from 'react'; 
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { SocketContext } from '../context/SocketContext';

const FinishRide = ({ ride, setFinishRidePanel }) => {
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext); 

  async function endRide() {
    try {
      const token = localStorage.getItem('captainToken');
      console.log('Token for end-ride:', token);
      if (!token) throw new Error('No captain token found');

      if (!socket) {
        throw new Error('Socket not initialized');
      }
      socket.emit('end-ride', { rideId: ride._id }, (response) => {
        if (response?.error) {
          console.error('Error ending ride via socket:', response.error);
          toast.error(response.error, { position: 'top-right', autoClose: 3000 });
        } else {
          console.log('Ride ended successfully via socket');
          toast.success('Ride ended successfully!', { position: 'top-right', autoClose: 3000 });
          setFinishRidePanel(false);

        }
      });
    } catch (error) {
      console.error('Error ending ride:', error.message);
      let errorMessage = 'Failed to end ride. Please try again.';
      if (error.message === 'Socket not initialized') {
        errorMessage = 'Connection issue. Please try again.';
      }
      toast.error(errorMessage, { position: 'top-right', autoClose: 3000 });
    }
  }

  return (
    <div className="p-4 bg-white rounded-t-3xl shadow-2xl max-h-[50vh] min-h-[300px] overflow-y-auto w-11/12 max-w-md mx-auto">
      <div className="flex justify-center mb-3">
        <button
          onClick={() => setFinishRidePanel(false)}
          className="w-10 h-1 transition duration-200 bg-gray-300 rounded-full cursor-pointer hover:bg-gray-400"
        ></button>
      </div>

      <h3 className="mb-3 text-lg font-bold text-center text-gray-800">Finish This Ride</h3>

      <div className="flex items-center justify-between p-2 mb-2 bg-yellow-100 border border-yellow-300 rounded-lg">
        <div className="flex items-center gap-2">
          <img
            className="object-cover w-8 h-8 rounded-full ring-2 ring-yellow-400"
            src="https://i.pinimg.com/236x/af/26/28/af26280b0ca305be47df0b799ed1b12b.jpg"
            alt="User"
            loading="lazy"
          />
          <h2 className="text-sm font-medium text-gray-800 capitalize">
            {ride?.user?.fullname?.firstname || 'Unknown'}
          </h2>
        </div>
        <h5 className="text-xs font-semibold text-gray-700">2.2 KM</h5>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
          <i className="text-base text-gray-500 ri-map-pin-user-fill"></i>
          <div>
            <h4 className="text-xs font-semibold text-gray-800">Pickup</h4>
            <p className="text-xs text-gray-600">{ride?.pickup || 'Unknown Pickup'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
          <i className="text-base text-gray-500 ri-map-pin-2-fill"></i>
          <div>
            <h4 className="text-xs font-semibold text-gray-800">Destination</h4>
            <p className="text-xs text-gray-600">{ride?.destination || 'Unknown Destination'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
          <i className="text-base text-gray-500 ri-money-rupee-circle-line"></i>
          <div>
            <h4 className="text-xs font-semibold text-gray-800">Fare</h4>
            <p className="text-xs text-gray-600">Cash: ₹{ride?.fare || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <button
          onClick={endRide}
          className="w-full py-2 text-sm font-semibold text-white transition duration-200 bg-green-600 rounded-lg shadow-md hover:bg-green-700"
        >
          Finish Ride
        </button>
      </div>
    </div>
  );
};

FinishRide.propTypes = {
  setFinishRidePanel: PropTypes.func.isRequired,
  ride: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    user: PropTypes.shape({
      fullname: PropTypes.shape({
        firstname: PropTypes.string,
      }),
    }),
    pickup: PropTypes.string,
    destination: PropTypes.string,
    fare: PropTypes.number,
  }).isRequired,
};

export default FinishRide;