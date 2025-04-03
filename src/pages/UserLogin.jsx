import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setError(null);

    const userData = { email, password };

    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/login`, userData);
      if (response.status === 200) {
        const data = response.data;
        localStorage.setItem('userToken', data.token);
        localStorage.removeItem('captainToken'); // Clear captain token
        navigate('/home'); // Redirect to home, where UserContext will fetch user
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }

    setEmail('');
    setPassword('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-8 font-sans bg-gray-50">
      <Link to="/start" className="mb-10">
        <img className="w-auto h-14" src="/images/ridezlogo.png" alt="Ridez Logo" />
      </Link>
      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl">
        <h2 className="mb-8 text-3xl font-extrabold text-center text-gray-900">Welcome Back</h2>
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
            className="w-full py-3 font-semibold text-white transition duration-200 bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 hover:scale-105 focus:ring-4 focus:ring-blue-300"
          >
            Log In
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-600">
          <Link to="/request-password-reset" className="text-blue-600 hover:underline">Forgot Password?</Link>
        </p>
        <p className="mt-2 text-sm text-center text-gray-600">
          New here? <Link to="/signup" className="font-medium text-blue-600 hover:underline">Create an Account</Link>
        </p>
      </div>
      <div className="w-full max-w-md mt-6">
        <Link
          to="/captain-login"
          className="flex items-center justify-center w-full py-3 font-semibold text-white transition duration-200 bg-green-600 rounded-lg shadow-md hover:bg-green-700 hover:scale-105 focus:ring-4 focus:ring-green-300"
        >
          Sign in as Captain
          <i className="ml-2 text-xl ri-arrow-right-line"></i>
        </Link>
      </div>
      <Link to="/" className="mt-6 text-sm text-gray-500 transition hover:text-gray-700">Back to Home</Link>
    </div>
  );
};

export default UserLogin;