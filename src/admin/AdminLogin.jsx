import React, { useState, useRef, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SocketContext } from '../context/SocketContext'; // Import SocketContext

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef(null);
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext); // Access socket from context

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      navigate('/admin-dashboard');
    }
  }, [navigate]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/admin/login`, {
        email,
        password,
      });
      const { token, admin } = response.data;
      localStorage.setItem('adminToken', token);

      // Connect admin to socket
      if (socket) {
        socket.emit('admin-connect', admin._id);
        console.log(`Admin ${admin._id} connected to socket`);
      } else {
        console.error('Socket not available during admin login');
      }

      toast.success('Login successful!', { position: 'top-right', autoClose: 3000 });
      navigate('/admin-dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Invalid email or password', {
        position: 'top-right',
        autoClose: 3000,
      });
      setIsLoading(false);
    }
  };

  useGSAP(() => {
    gsap.fromTo(
      formRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
  }, []);

  return (
    <div className="relative flex items-center justify-center min-h-screen font-sans bg-gray-50">
      <div className="absolute inset-0 z-0 opacity-50 bg-gradient-to-br from-gray-900 to-gray-800"></div>

      <div ref={formRef} className="relative z-10 w-full max-w-md p-8 bg-white shadow-2xl rounded-xl">
        <h1 className="mb-6 text-3xl font-extrabold text-center text-transparent bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text">
          Admin Login - Ridez
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block mb-1 text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-1 text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 font-semibold text-white rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 focus:ring-4 focus:ring-blue-300 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="mt-4 text-sm text-center text-gray-600">
          Back to{' '}
          <Link to="/" className="text-blue-600 hover:underline">
            Home
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;