import React, { useState } from 'react';
import PropTypes from 'prop-types';

const VehiclePanel = ({
  setVehiclePanel,
  setConfirmRidePanel,
  fare,
  setVehicleType,
  vehicleType,
  pickup,
  destination,
}) => {
  const [selectedType, setSelectedType] = useState(vehicleType);

  const handleVehicleSelect = (type) => {
    setSelectedType(type);
    setVehicleType(type);
    setTimeout(() => {
      setVehiclePanel(false);
      setConfirmRidePanel(true);
    }, 200); // Slight delay for smoother transition
  };

  return (
    <div className="p-6 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto">
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setVehiclePanel(false)}
          className="w-16 h-1 transition duration-200 bg-gray-300 rounded-full cursor-pointer hover:bg-gray-400"
        ></button>
      </div>

      <h3 className="mb-6 text-2xl font-bold text-center text-gray-900">Choose Your Ride</h3>

      <div className="space-y-4">
        {/* RidezGo (Car) */}
        <div
          onClick={() => handleVehicleSelect("car")}
          className={`flex items-center p-4 transition-all duration-200 border rounded-xl cursor-pointer hover:bg-gray-50 hover:border-blue-500 ${
            selectedType === "car" ? "border-blue-500 bg-blue-50" : "border-gray-200"
          }`}
        >
          <div className="flex-shrink-0">
            <img
              className="object-contain w-16 h-16"
              src="https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,h_552,w_552/v1555367538/assets/31/ad21b7-595c-42e8-ac53-53966b4a5fee/original/Final_Black.png"
              alt="RidezGo"
            />
          </div>
          <div className="flex-1 min-w-0 ml-4">
            <h4 className="flex items-center text-lg font-semibold text-gray-900 truncate">
              RidezGo
              <span className="flex items-center ml-2 text-sm text-gray-600">
                <i className="ri-user-3-fill"></i>
                <span className="ml-1">4</span>
              </span>
            </h4>
            <p className="text-sm text-gray-600">2 mins away</p>
            <p className="text-sm text-gray-500 truncate">Affordable compact rides</p>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">₹{fare.car || "Loading..."}</h2>
        </div>

        {/* Moto */}
        <div
          onClick={() => handleVehicleSelect("motorcycle")} // Changed "moto" to "motorcycle"
          className={`flex items-center p-4 transition-all duration-200 border rounded-xl cursor-pointer hover:bg-gray-50 hover:border-blue-500 ${
            selectedType === "motorcycle" ? "border-blue-500 bg-blue-50" : "border-gray-200" // Changed "moto" to "motorcycle"
          }`}
        >
          <div className="flex-shrink-0">
            <img
              className="object-contain w-16 h-16"
              src="https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,h_368,w_552/v1649231091/assets/2c/7fa194-c954-49b2-9c6d-a3b8601370f5/original/Uber_Moto_Orange_312x208_pixels_Mobile.png"
              alt="Moto"
            />
          </div>
          <div className="flex-1 min-w-0 ml-4">
            <h4 className="flex items-center text-lg font-semibold text-gray-900 truncate">
              Moto
              <span className="flex items-center ml-2 text-sm text-gray-600">
                <i className="ri-user-3-fill"></i>
                <span className="ml-1">1</span>
              </span>
            </h4>
            <p className="text-sm text-gray-600">3 mins away</p>
            <p className="text-sm text-gray-500 truncate">Affordable motorcycle rides</p>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">₹{fare.motorcycle || "Loading..."}</h2>
        </div>

        {/* RidezAuto */}
        <div
          onClick={() => handleVehicleSelect("auto")}
          className={`flex items-center p-4 transition-all duration-200 border rounded-xl cursor-pointer hover:bg-gray-50 hover:border-blue-500 ${
            selectedType === "auto" ? "border-blue-500 bg-blue-50" : "border-gray-200"
          }`}
        >
          <div className="flex-shrink-0">
            <img
              className="object-contain w-16 h-16"
              src="https://www.uber-assets.com/image/upload/f_auto,q_auto:eco,c_fill,h_368,w_552/v1648431773/assets/1d/db8c56-0204-4ce4-81ce-56a11a07fe98/original/Uber_Auto_558x372_pixels_Desktop.png"
              alt="RidezAuto"
            />
          </div>
          <div className="flex-1 min-w-0 ml-4">
            <h4 className="flex items-center text-lg font-semibold text-gray-900 truncate">
              RidezAuto
              <span className="flex items-center ml-2 text-sm text-gray-600">
                <i className="ri-user-3-fill"></i>
                <span className="ml-1">2</span>
              </span>
            </h4>
            <p className="text-sm text-gray-600">3 mins away</p>
            <p className="text-sm text-gray-500 truncate">Affordable auto rides</p>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">₹{fare.auto || "Loading..."}</h2>
        </div>
      </div>
    </div>
  );
};

VehiclePanel.propTypes = {
  setVehiclePanel: PropTypes.func.isRequired,
  setConfirmRidePanel: PropTypes.func.isRequired,
  setVehicleType: PropTypes.func.isRequired,
  pickup: PropTypes.string.isRequired,
  destination: PropTypes.string.isRequired,
  vehicleType: PropTypes.string.isRequired,
  fare: PropTypes.shape({
    car: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    motorcycle: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    auto: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
};

export default VehiclePanel;