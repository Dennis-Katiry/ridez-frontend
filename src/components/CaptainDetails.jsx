import React, { useContext } from 'react';
import { CaptainDataContext } from '../context/CaptainContext';

const CaptainDetails = () => {
  const { captain, stats, isLoading, error } = useContext(CaptainDataContext);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!captain) return <div>No captain data available</div>;

  // Base URL for uploaded images (adjust based on your backend setup)
  const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:4000';
  // Construct the profile picture URL or use a fallback
  const profilePicUrl = captain.profilePic
    ? `${baseUrl}${captain.profilePic}` // Assuming profilePic is a path like "/uploads/..."
    : 'https://plus.unsplash.com/premium_photo-1689530775582-83b8abdb5020?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cmFuZG9tJTIwcGVyc29ufGVufDB8fDB8fHww';

  return (
    <div className="max-w-md p-4 mx-auto bg-white rounded-lg shadow-md">
      {/* Captain Info and Earnings */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            className="object-cover w-10 h-10 rounded-full ring-2 ring-green-400"
            src={profilePicUrl}
            alt={`${captain.fullname.firstname} ${captain.fullname.lastname}`}
            loading="lazy"
            onError={(e) => {
              e.target.src = 'https://plus.unsplash.com/premium_photo-1689530775582-83b8abdb5020?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8cmFuZG9tJTIwcGVyc29ufGVufDB8fDB8fHww';
            }} // Fallback if image fails to load
          />
          <h4 className="text-base font-medium text-gray-800 capitalize">
            {captain.fullname.firstname} {captain.fullname.lastname}
          </h4>
        </div>
        <div className="text-right">
          <h4 className="text-lg font-semibold text-gray-900">₹{stats.earningsToday.toFixed(2)}</h4>
          <p className="text-xs text-gray-600">Earned Today</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="flex justify-between gap-4 p-3 mt-4 rounded-lg bg-gray-50">
        <div className="flex-1 text-center">
          <i className="mb-2 text-xl text-gray-500 ri-timer-2-line"></i>
          <h5 className="text-base font-medium text-gray-800">{stats.hoursOnline.toFixed(1)}</h5>
          <p className="text-xs text-gray-600">Hours Online</p>
        </div>
        <div className="flex-1 text-center">
          <i className="mb-2 text-xl text-gray-500 ri-speed-up-line"></i>
          <h5 className="text-base font-medium text-gray-800">{stats.tripsToday}</h5>
          <p className="text-xs text-gray-600">Trips Today</p>
        </div>
        <div className="flex-1 text-center">
          <i className="mb-2 text-xl text-gray-500 ri-booklet-line"></i>
          <h5 className="text-base font-medium text-gray-800">{stats.rating.toFixed(1)}</h5>
          <p className="text-xs text-gray-600">Rating</p>
        </div>
      </div>
    </div>
  );
};

export default CaptainDetails;