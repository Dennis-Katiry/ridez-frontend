import React from 'react';
import PropTypes from 'prop-types';

const RidePopUp = ({ setRidePopupPanel, setConfirmRidePopupPanel, ride, confirmRide }) => {
  if (!ride) {
    return null;
  }

  return (
    <div className="p-4 bg-white rounded-t-3xl shadow-2xl max-h-[70vh] overflow-y-auto">
      <div className="flex justify-center mb-3">
        <button
          onClick={() => setRidePopupPanel(false)}
          className="w-10 h-1 transition duration-200 bg-gray-300 rounded-full cursor-pointer hover:bg-gray-400"
        ></button>
      </div>

      <h3 className="mb-3 text-lg font-bold text-center text-gray-800">New Ride Available!</h3>

      <div className="flex items-center justify-between p-2 mb-2 bg-yellow-100 border border-yellow-300 rounded-lg">
        <div className="flex items-center gap-2">
          <img
            className="object-cover w-8 h-8 rounded-full ring-2 ring-yellow-400"
            src="https://plus.unsplash.com/premium_photo-1689551670902-19b441a6afde?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cmFuZG9tJTIwcGVvcGxlfGVufDB8fDB8fHww"
            alt="User"
            loading="lazy"
          />
          <h2 className="text-sm font-medium text-gray-800">
            {ride.user?.fullname?.firstname || 'Unknown'} {ride.user?.fullname?.lastname || ''}
          </h2>
        </div>
        <h5 className="text-xs font-semibold text-gray-700">2.2KM</h5>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
          <i className="text-base text-gray-500 ri-map-pin-user-fill"></i>
          <div>
            <h4 className="text-xs font-semibold text-gray-800">Pickup</h4>
            <p className="text-xs text-gray-600">{ride?.pickup || 'N/A'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
          <i className="text-base text-gray-500 ri-map-pin-2-fill"></i>
          <div>
            <h4 className="text-xs font-semibold text-gray-800">Destination</h4>
            <p className="text-xs text-gray-600">{ride?.destination || 'N/A'}</p>
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

      <div className="flex justify-between gap-2 mt-3">
        <button
          onClick={() => {
            setConfirmRidePopupPanel(true);
            confirmRide();
          }}
          className="flex-1 py-2 text-sm font-semibold text-white transition duration-200 bg-green-600 rounded-lg shadow-md hover:bg-green-700"
        >
          Accept
        </button>
        <button
          onClick={() => setRidePopupPanel(false)}
          className="flex-1 py-2 text-sm font-semibold text-white transition duration-200 bg-red-600 rounded-lg shadow-md hover:bg-red-700"
        >
          Ignore
        </button>
      </div>
    </div>
  );
};

RidePopUp.propTypes = {
  setRidePopupPanel: PropTypes.func.isRequired,
  setConfirmRidePopupPanel: PropTypes.func.isRequired,
  ride: PropTypes.object.isRequired,
  confirmRide: PropTypes.func.isRequired,
};

export default RidePopUp;