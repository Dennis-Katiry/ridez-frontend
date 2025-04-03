import React from 'react';
import PropTypes from 'prop-types';

const LookingForDriver = ({
  setVehicleFound,
  setVehiclePanel,
  createRide,
  pickup,
  destination,
  fare,
  vehicleType,
}) => {
  const handleClose = () => {
    setVehicleFound(false);
    setTimeout(() => setVehiclePanel(true), 300);
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

  return (
    <div className="flex flex-col justify-between p-4 bg-white shadow-2xl rounded-t-3xl" style={{ maxHeight: '60vh', height: 'auto', minHeight: '400px' }}>
      <div>
        <div className="flex justify-center mb-4">
          <button
            onClick={handleClose}
            className="w-12 h-1 transition duration-200 bg-gray-300 rounded-full cursor-pointer hover:bg-gray-400"
          ></button>
        </div>

        <h3 className="mb-4 text-xl font-bold text-center text-gray-900">Looking for Driver</h3>

        <div className="flex justify-center mb-4">
          <img
            className="object-contain w-16 h-16"
            src={vehicleImages[vehicleType] || vehicleImages.car}
            alt={`${vehicleNames[vehicleType] || "Ride"} Vehicle`}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center p-3 rounded-lg bg-gray-50">
            <div className="flex-shrink-0 mr-3">
              <i className="text-xl text-blue-600 ri-map-pin-user-fill"></i>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900">Pickup</h4>
              <p className="text-sm text-gray-600 truncate">{pickup || "Not selected"}</p>
            </div>
          </div>

          <div className="flex items-center p-3 rounded-lg bg-gray-50">
            <div className="flex-shrink-0 mr-3">
              <i className="text-xl text-blue-600 ri-map-pin-2-fill"></i>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900">Destination</h4>
              <p className="text-sm text-gray-600 truncate">{destination || "Not selected"}</p>
            </div>
          </div>

          <div className="flex items-center p-3 rounded-lg bg-gray-50">
            <div className="flex-shrink-0 mr-3">
              <i className="text-xl text-blue-600 ri-money-rupee-circle-line"></i>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900">Fare</h4>
              <p className="text-sm text-gray-600">Cash: ₹{fare && fare[vehicleType] ? fare[vehicleType] : "Loading..."}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={createRide}
          className="w-full py-2 text-base font-semibold text-white transition duration-200 bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:ring-4 focus:ring-blue-300"
        >
          Retry Finding Driver
        </button>
      </div>
    </div>
  );
};

LookingForDriver.propTypes = {
  setVehicleFound: PropTypes.func.isRequired,
  setVehiclePanel: PropTypes.func.isRequired,
  createRide: PropTypes.func.isRequired,
  pickup: PropTypes.string.isRequired,
  destination: PropTypes.string.isRequired,
  vehicleType: PropTypes.oneOf(['car', 'motorcycle', 'auto']).isRequired, // Updated to use "motorcycle"
  fare: PropTypes.shape({
    car: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    motorcycle: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired, // Changed "moto" to "motorcycle"
    auto: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
};

export default LookingForDriver;