import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserDataContext } from '../context/UserContext';

const UserSignup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { setUser } = useContext(UserDataContext);
  const navigate = useNavigate();

  const submitHandler = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const newUser = {
      fullname: {
        firstname: firstName,
        lastname: lastName,
      },
      email,
      password,
    };

    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/register`, newUser);
      if (response.status === 201) {
        setUser(response.data.user);
        localStorage.setItem('token', response.data.token);
        navigate('/home');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
      setEmail('');
      setFirstName('');
      setLastName('');
      setPassword('');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-8 font-sans bg-gray-50">
      <Link to="/start" className="mb-10">
        <img
          className="w-auto h-14"
          src="/images/ridezlogo.png"
          alt="Ridez Logo"
        />
      </Link>

      <div className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl">
        <h2 className="mb-8 text-3xl font-extrabold text-center text-gray-900">
          Join Ridez
        </h2>

        <form onSubmit={submitHandler} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                First Name
              </label>
              <div className="relative">
                <i className="absolute text-xl text-gray-400 transform -translate-y-1/2 left-3 top-1/2 ri-user-line"></i>
                <input
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full py-3 pl-12 pr-4 text-gray-800 placeholder-gray-400 transition duration-200 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="text"
                  placeholder="First name"
                />
              </div>
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Last Name
              </label>
              <div className="relative">
                <i className="absolute text-xl text-gray-400 transform -translate-y-1/2 left-3 top-1/2 ri-user-line"></i>
                <input
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full py-3 pl-12 pr-4 text-gray-800 placeholder-gray-400 transition duration-200 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  type="text"
                  placeholder="Last name"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Email
            </label>
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
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Password
            </label>
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
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Log in here
          </Link>
        </p>
      </div>

      <p className="max-w-md mt-6 text-xs text-center text-gray-500">
        This site is protected by reCAPTCHA and the{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">
          Google Privacy Policy
        </a>{' '}
        and{' '}
        <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700">
          Terms of Service
        </a>{' '}
        apply.
      </p>

      <Link
        to="/"
        className="mt-4 text-sm text-gray-500 transition hover:text-gray-700"
      >
        Back to Home
      </Link>
    </div>
  );
};

export default UserSignup;