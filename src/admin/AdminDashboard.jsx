import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminDrawer from './AdminDrawer';
import PropTypes from 'prop-types';
import {
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentListIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import { FaBicycle, FaCar } from 'react-icons/fa';
import { io } from 'socket.io-client';

const AdminDashboard = () => {
  const statsRef = useRef(null);
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    completeRides: 0,
    cancelledRides: 0,
    totalRides: 0,
    totalCaptains: 0,
    totalUsers: 0,
    activeRides: 0,
    services: {
      bikeRide: { bookings: 0, revenue: 0, activeDrivers: 0, isActive: true },
      car: { bookings: 0, revenue: 0, activeDrivers: 0, isActive: true },
      taxiRide: { bookings: 0, revenue: 0, activeDrivers: 0, isActive: true },
      intercity: { bookings: 0, revenue: 0, activeDrivers: 0, isActive: true },
      taxiBooking: { bookings: 0, revenue: 0, activeDrivers: 0, isActive: true },
      taxiPool: { bookings: 0, revenue: 0, activeDrivers: 0, isActive: true },
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [scheduledRides, setScheduledRides] = useState([]);
  const [availableCaptains, setAvailableCaptains] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [selectedCaptain, setSelectedCaptain] = useState('');
  const [vehicle, setVehicle] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin-login');
    }
  }, [navigate]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_BASE_URL, {
      auth: { token: localStorage.getItem('adminToken') },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Admin connected to Socket.IO:', socket.id);
      socket.emit('join', { role: 'admin' });
    });

    socket.on('new-scheduled-ride', (data) => {
      console.log('New scheduled ride received:', data);
      setScheduledRides((prev) => [...prev, data]);
      toast.info('New scheduled ride request received!', { position: 'top-right', autoClose: 3000 });
    });

    socket.on('scheduled-ride-cancelled', (data) => {
      console.log('Scheduled ride cancelled:', data);
      setScheduledRides((prev) => prev.filter((ride) => ride.rideId !== data.rideId));
      toast.info('A scheduled ride has been cancelled.', { position: 'top-right', autoClose: 3000 });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      if (error.message === 'Authentication error') {
        localStorage.removeItem('adminToken');
        navigate('/admin-login');
      }
    });

    return () => socket.disconnect();
  }, [navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStats({
          totalRevenue: response.data.totalRevenue || 0,
          completeRides: response.data.completeRides || 0,
          cancelledRides: response.data.cancelledRides || 0,
          totalRides: response.data.totalRides || 0,
          totalCaptains: response.data.totalCaptains || 0,
          totalUsers: response.data.totalUsers || 0,
          activeRides: response.data.activeRides || 0,
          services: {
            bikeRide: response.data.services?.bikeRide || { bookings: 0, revenue: 0, activeDrivers: 0, isActive: true },
            car: response.data.services?.car || { bookings: 0, revenue: 0, activeDrivers: 0, isActive: true },
            taxiRide: response.data.services?.taxiRide || { bookings: 0, revenue: 0, activeDrivers: 0, isActive: true },
            intercity: response.data.services?.intercity || { bookings: 0, revenue: 0, activeDrivers: 0, isActive: true },
            taxiBooking: response.data.services?.taxiBooking || { bookings: 0, revenue: 0, activeDrivers: 0, isActive: true },
            taxiPool: response.data.services?.taxiPool || { bookings: 0, revenue: 0, activeDrivers: 0, isActive: true },
          },
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('adminToken');
          toast.error('Session expired. Please log in again.', { position: 'top-right', autoClose: 3000 });
          navigate('/admin-login');
        } else {
          toast.error('Failed to fetch dashboard stats', { position: 'top-right', autoClose: 3000 });
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [navigate]);


  useEffect(() => {
    const fetchScheduledRides = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/admin/scheduled-rides`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setScheduledRides(response.data);
      } catch (error) {
        console.error('Error fetching scheduled rides:', error);
        toast.error('Failed to fetch scheduled rides', { position: 'top-right', autoClose: 3000 });
      }
    };
    fetchScheduledRides();
  }, []);

  // Fetch available captains
  const fetchAvailableCaptains = async (scheduledTime) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/admin/available-captains`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { scheduledTime },
      });
      setAvailableCaptains(response.data);
    } catch (error) {
      console.error('Error fetching available captains:', error);
      toast.error('Failed to fetch available captains', { position: 'top-right', autoClose: 3000 });
      setAvailableCaptains([]);
    }
  };

  // Handle captain assignment
  const handleAssignCaptain = async (e) => {
    e.preventDefault();
    if (!selectedRide || !selectedCaptain || !vehicle) {
      toast.error('Please select a captain and enter a vehicle', { position: 'top-right', autoClose: 3000 });
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/admin/assign-captain`,
        {
          rideId: selectedRide._id || selectedRide.rideId,
          captainId: selectedCaptain,
          vehicle,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Captain assigned successfully!', { position: 'top-right', autoClose: 3000 });
      setScheduledRides(scheduledRides.filter((ride) => (ride._id || ride.rideId) !== (selectedRide._id || selectedRide.rideId)));
      setSelectedRide(null);
      setSelectedCaptain('');
      setVehicle('');
      setAvailableCaptains([]);
    } catch (error) {
      console.error('Error assigning captain:', error);
      toast.error(error.response?.data?.message || 'Failed to assign captain', { position: 'top-right', autoClose: 3000 });
    }
  };

  // GSAP animation
  useGSAP(() => {
    if (!isLoading && statsRef.current) {
      gsap.fromTo(
        statsRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
    }
  }, [isLoading]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <span className="text-xl font-semibold text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen font-sans bg-gray-100">
      <AdminDrawer activeRoute="/admin-dashboard" />
      <main className="flex-1 p-4 pt-12 sm:p-6 sm:pt-14 md:ml-64 md:pt-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Super Admin</span>
              <UserIcon className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </header>

        {/* Today's Summary */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-700">Today&apos;s Summary</h2>
          <div ref={statsRef} className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toFixed(2)}`} Icon={CurrencyDollarIcon} bgColor="bg-blue-500" />
            <StatCard title="Complete Rides" value={stats.completeRides} Icon={CheckCircleIcon} bgColor="bg-teal-500" />
            <StatCard title="Cancelled Rides" value={stats.cancelledRides} Icon={XCircleIcon} bgColor="bg-red-500" />
            <StatCard title="Total Rides" value={stats.totalRides} Icon={ClipboardDocumentListIcon} bgColor="bg-orange-500" />
          </div>
        </section>

        {/* Total of Services */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-700">Total of Services</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-6">
            <ServiceCard title="Bike Ride" value={stats.services.bikeRide.bookings} Icon={FaBicycle} />
            <ServiceCard title="Car" value={stats.services.car.bookings} Icon={FaCar} />
            <ServiceCard title="Auto Ride" value={stats.services.taxiRide.bookings} Icon={FaCar} />
            <ServiceCard title="Intercity" value={stats.services.intercity.bookings} Icon={BuildingOfficeIcon} />
            <ServiceCard title="Taxi Booking" value={stats.services.taxiBooking.bookings} Icon={CalendarIcon} />
            <ServiceCard title="Taxi Pool" value={stats.services.taxiPool.bookings} Icon={UserGroupIcon} />
          </div>
        </section>

        {/* Scheduled Rides */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-700">Scheduled Rides (Taxi Booking)</h2>
          {scheduledRides.length === 0 ? (
            <p className="text-gray-600">No pending scheduled rides.</p>
          ) : (
            <div className="space-y-4">
              {scheduledRides.map((ride) => (
                <ScheduledRideCard
                  key={ride._id || ride.rideId}
                  ride={ride}
                  onAssign={() => {
                    setSelectedRide(ride);
                    fetchAvailableCaptains(ride.scheduledTime);
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Assign Captain Modal */}
        {selectedRide && (
          <AssignCaptainModal
            ride={selectedRide}
            captains={availableCaptains}
            selectedCaptain={selectedCaptain}
            setSelectedCaptain={setSelectedCaptain}
            vehicle={vehicle}
            setVehicle={setVehicle}
            onAssign={handleAssignCaptain}
            onClose={() => {
              setSelectedRide(null);
              setSelectedCaptain('');
              setVehicle('');
              setAvailableCaptains([]);
            }}
          />
        )}
      </main>
    </div>
  );
};

// Reusable Stat Card Component
const StatCard = ({ title, value, Icon, bgColor }) => (
  <div className={`flex items-center justify-between rounded-lg p-6 text-white shadow-lg ${bgColor}`}>
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
    <Icon className="w-8 h-8" />
  </div>
);

StatCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  Icon: PropTypes.elementType.isRequired,
  bgColor: PropTypes.string.isRequired,
};

// Reusable Service Card Component
const ServiceCard = ({ title, value, Icon }) => (
  <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-lg">
    <div>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className="text-2xl font-bold text-gray-800">{value || 0}</p>
    </div>
    <Icon className="w-8 h-8 text-gray-600" />
  </div>
);

ServiceCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  Icon: PropTypes.elementType.isRequired,
};

// Reusable Scheduled Ride Card Component
const ScheduledRideCard = ({ ride, onAssign }) => (
  <div className="p-4 bg-white rounded-lg shadow-lg">
    <div className="flex items-center justify-between">
      <div>
        <p>
          <strong>User:</strong> {ride.user?.fullname?.firstname || ride.userId || 'Unknown'}{' '}
          {ride.user?.fullname?.lastname || ''}
        </p>
        <p><strong>Pickup:</strong> {ride.users?.[0]?.pickup || ride.pickup || 'N/A'}</p>
        <p><strong>Destination:</strong> {ride.users?.[0]?.destination || ride.destination || 'N/A'}</p>
        <p><strong>Fare:</strong> ₹{ride.fare?.toFixed(2) || 'N/A'}</p>
        <p><strong>Scheduled Time:</strong> {new Date(ride.scheduledTime).toLocaleString()}</p>
        <p><strong>Service Type:</strong> {ride.serviceType || 'taxiBooking'}</p>
      </div>
      <button
        onClick={onAssign}
        className="px-4 py-2 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
      >
        Assign Captain
      </button>
    </div>
  </div>
);

ScheduledRideCard.propTypes = {
  ride: PropTypes.shape({
    _id: PropTypes.string,
    rideId: PropTypes.string,
    user: PropTypes.shape({
      fullname: PropTypes.shape({
        firstname: PropTypes.string,
        lastname: PropTypes.string,
      }),
    }),
    userId: PropTypes.string,
    users: PropTypes.arrayOf(
      PropTypes.shape({
        pickup: PropTypes.string,
        destination: PropTypes.string,
      })
    ),
    pickup: PropTypes.string,
    destination: PropTypes.string,
    fare: PropTypes.number,
    scheduledTime: PropTypes.string.isRequired,
    serviceType: PropTypes.string,
  }).isRequired,
  onAssign: PropTypes.func.isRequired,
};

// Reusable Assign Captain Modal Component
const AssignCaptainModal = ({ ride, captains, selectedCaptain, setSelectedCaptain, vehicle, setVehicle, onAssign, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="w-11/12 max-w-md p-6 bg-white rounded-lg shadow-2xl">
      <h3 className="mb-4 text-lg font-semibold text-gray-800">Assign Captain to Ride</h3>
      <form onSubmit={onAssign} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Captain</label>
          {captains.length === 0 ? (
            <p className="text-sm text-gray-600">No available captains for this time slot.</p>
          ) : (
            <select
              value={selectedCaptain}
              onChange={(e) => setSelectedCaptain(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a captain</option>
              {captains.map((captain) => (
                <option key={captain._id} value={captain._id}>
                  {captain.fullname?.firstname || 'Unknown'} {captain.fullname?.lastname || ''} (ID: {captain._id})
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Vehicle (e.g., Registration Number)</label>
          <input
            type="text"
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter vehicle details"
            required
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            disabled={captains.length === 0}
          >
            Assign
          </button>
        </div>
      </form>
    </div>
  </div>
);

AssignCaptainModal.propTypes = {
  ride: PropTypes.shape({
    _id: PropTypes.string,
    rideId: PropTypes.string,
    scheduledTime: PropTypes.string,
  }).isRequired,
  captains: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      fullname: PropTypes.shape({
        firstname: PropTypes.string,
        lastname: PropTypes.string,
      }),
    })
  ).isRequired,
  selectedCaptain: PropTypes.string.isRequired,
  setSelectedCaptain: PropTypes.func.isRequired,
  vehicle: PropTypes.string.isRequired,
  setVehicle: PropTypes.func.isRequired,
  onAssign: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AdminDashboard;