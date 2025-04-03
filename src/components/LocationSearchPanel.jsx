import React from 'react';
import PropTypes from 'prop-types';

const LocationSearchPanel = ({
  suggestions = [],
  setVehiclePanel,
  setPanelOpen,
  setPickup,
  setDestination,
  activeField,
}) => {
  if (!Array.isArray(suggestions)) {
    console.error("Error: 'suggestions' is not an array. Received:", suggestions);
    return (
      <div className="p-4 text-center shadow-md bg-red-50 rounded-xl">
        <p className="text-sm font-medium text-red-600">Error loading suggestions. Please try again.</p>
      </div>
    );
  }

  const handleSuggestionClick = (suggestion) => {
    const description = suggestion?.description || 'Unknown Location';
    if (activeField === 'pickup') {
      setPickup(description);
    } else if (activeField === 'destination') {
      setDestination(description);
    }
    setVehiclePanel(false); 
    setPanelOpen(true); 
  };

  const parseSuggestion = (description) => {
    if (!description) return { name: 'Unknown Location', address: '' };
    const parts = description.split(', ');
    const name = parts[0];
    const address = parts.slice(1).join(', ');
    return { name, address };
  };

  return (
    <div className="p-4 bg-white shadow-xl rounded-xl max-h-[50vh] overflow-y-auto">
      {suggestions.length > 0 ? (
        suggestions.map((elem, idx) => {
          const { name, address } = parseSuggestion(elem?.description);
          return (
            <div
              key={idx}
              onClick={() => handleSuggestionClick(elem)}
              className="flex items-start gap-3 p-3 mb-2 transition duration-200 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-500"
            >
              <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full">
                <i className="text-xl text-blue-600 ri-map-pin-2-fill"></i>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate">{name}</h4>
                <p className="text-xs text-gray-600 truncate">{address || 'No address available'}</p>
              </div>
            </div>
          );
        })
      ) : (
        <p className="p-4 text-sm text-center text-gray-500">
          No suggestions found. Try typing a location.
        </p>
      )}
    </div>
  );
};

LocationSearchPanel.propTypes = {
  suggestions: PropTypes.arrayOf(
    PropTypes.shape({
      description: PropTypes.string.isRequired,
    })
  ),
  setVehiclePanel: PropTypes.func.isRequired,
  setPanelOpen: PropTypes.func.isRequired,
  setPickup: PropTypes.func.isRequired,
  setDestination: PropTypes.func.isRequired,
  activeField: PropTypes.oneOf(['pickup', 'destination']).isRequired,
};

export default LocationSearchPanel;