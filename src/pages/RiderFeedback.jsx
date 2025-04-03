import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

const RiderFeedback = () => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const rideId = new URLSearchParams(location.search).get('rideId') || location.state?.rideId;

  useEffect(() => {
    if (!rideId) {
      setError('No ride ID provided. Please complete a ride first.');
      toast.error('No ride ID provided', { position: 'top-right', autoClose: 3000 });
    }
  }, [rideId]);

  const handleRating = (value) => {
    setRating(value);
    console.log('Rating set to:', value); // Debug
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rideId) {
      setError('Cannot submit feedback without a ride ID.');
      return;
    }
    if (rating === 0) {
      toast.error('Please provide a rating before submitting.', { position: 'top-right', autoClose: 3000 });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('userToken');
      console.log('Token for feedback:', token);
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/rides/submit-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rideId, rating, comment }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log('Feedback submitted:', { rating, comment });
        toast.success('Thank you for your feedback!', { position: 'top-right', autoClose: 3000 });
        setTimeout(() => navigate('/home'), 1500);
      } else {
        throw new Error(data.error || 'Failed to submit feedback');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { position: 'top-right', autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="w-full max-w-md p-8 transition-all duration-200 transform bg-white shadow-2xl rounded-t-3xl hover:scale-105">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Ride Completed</h1>
          <p className="mt-2 text-gray-500">We’d love to hear your thoughts!</p>
        </div>

        {error ? (
          <div className="text-center">
            <p className="mb-4 text-red-500">{error}</p>
            <Link
              to="/home"
              className="px-3 py-2 font-semibold text-gray-700 transition duration-200 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300 hover:-translate-y-1"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={loading ? 'opacity-70 pointer-events-none' : ''}>
            {/* Rating Stars */}
            <div className="flex justify-center mb-6" role="radiogroup" aria-label="Rate your ride">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button" // Fix: Prevent form submission
                  onClick={() => handleRating(star)}
                  disabled={loading}
                  className={`text-3xl mx-1 transition-colors duration-200 ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  } hover:text-yellow-500 focus:outline-none ${loading ? 'cursor-not-allowed' : ''}`}
                  aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  aria-checked={star <= rating}
                >
                  ★
                </button>
              ))}
            </div>

            {/* Comment Field */}
            <div className="mb-6">
              <label htmlFor="comment" className="block mb-2 text-sm font-medium text-gray-700">
                Your Feedback
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about your ride experience..."
                className="w-full p-3 transition-all duration-200 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                rows="4"
                disabled={loading}
                aria-label="Feedback comment"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className={`px-3 py-2 text-sm font-semibold text-white transition duration-200 bg-green-600 rounded-lg shadow-md hover:bg-green-700 hover:-translate-y-1 ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </button>
              <Link
                to="/home"
                className="px-3 py-2 text-sm font-semibold text-gray-700 transition duration-200 bg-gray-200 rounded-lg shadow-md hover:bg-gray-300 hover:-translate-y-1"
              >
                Skip
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RiderFeedback;