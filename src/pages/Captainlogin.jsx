import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CaptainDataContext } from '../context/CaptainContext';
import { toast } from 'react-toastify';

const CaptainLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { updateCaptain } = useContext(CaptainDataContext);
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const captainData = { email, password };

    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/captains/login`, captainData);
      if (response.status === 200) {
        const { token, captain } = response.data;
        localStorage.setItem('captainToken', token);
        localStorage.removeItem('userToken'); // Clear user token
        updateCaptain(captain);
        toast.success('Login successful!', { position: 'top-right', autoClose: 3000 });
        navigate('/captain-home');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage, { position: 'top-right', autoClose: 3000 });
    } finally {
      setLoading(false);
      setEmail('');
      setPassword('');
    }
  };

  // Rest of the component remains unchanged
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-8 font-sans bg-gray-50">
      <Link to="/start" className="mb-10">
        <img className="w-auto h-14" src="/images/ridezlogo.png" alt="Ridez Logo" />
      </Link>
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl">
        <h2 className="mb-8 text-3xl font-extrabold text-center text-gray-900">Captain Login</h2>
        <form onSubmit={submitHandler} className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Email</label>
            <div className="relative">
              <i className="absolute text-xl text-gray-400 transform -translate-y-1/2 left-3 top-1/2 ri-mail-line"></i>
              <input
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3 pl-12 pr-4 text-gray-800 placeholder-gray-400 transition duration-200 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="email"
                placeholder="email@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <i className="absolute text-xl text-gray-400 transform -translate-y-1/2 left-3 top-1/2 ri-lock-line"></i>
              <input
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3 pl-12 pr-12 text-gray-800 placeholder-gray-400 transition duration-200 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute text-gray-500 transition transform -translate-y-1/2 right-3 top-1/2 hover:text-gray-700"
              >
                <i className={`text-xl ${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}`}></i>
              </button>
            </div>
          </div>
          {error && (
            <p className="py-2 text-sm text-center text-red-600 bg-red-100 rounded-lg">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md transition duration-200 ${
              loading ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700 hover:scale-105 focus:ring-4 focus:ring-blue-300'
            }`}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-600">
          <Link to="/captain-forgot-password" className="text-blue-600 hover:underline">Forgot Password?</Link>
        </p>
        <p className="mt-2 text-sm text-center text-gray-600">
          New captain? <Link to="/captain-signup" className="font-medium text-blue-600 hover:underline">Register here</Link>
        </p>
      </div>
      <div className="w-full max-w-md mt-6">
        <Link
          to="/login"
          className="flex items-center justify-center w-full py-3 font-semibold text-white transition duration-200 bg-green-600 rounded-lg shadow-md hover:bg-green-700 hover:scale-105 focus:ring-4 focus:ring-green-300"
        >
          Sign in as User
          <i className="ml-2 text-xl ri-arrow-right-line"></i>
        </Link>
      </div>
      <Link to="/" className="mt-6 text-sm text-gray-500 transition hover:text-gray-700">Back to Home</Link>
    </div>
  );
};

export default CaptainLogin;