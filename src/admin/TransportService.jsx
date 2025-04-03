import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import axios from 'axios';
import { toast } from 'react-toastify';
import AdminDrawer from './AdminDrawer';
import {
  BuildingOfficeIcon,
  CalendarIcon,
  UserGroupIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { FaBicycle, FaCar, FaTaxi } from 'react-icons/fa';
import { SocketContext } from '../context/SocketContext';

const TransportService = () => {
  const statsRef = useRef(null);
  const tableRef = useRef(null);
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);

  const [services, setServices] = useState([
    { name: 'Bike Ride', bookings: 0, revenue: 0, activeDrivers: 0, isActive: true, icon: <FaBicycle /> },
    { name: 'Car', bookings: 0, revenue: 0, activeDrivers: 0, isActive: true, icon: <FaCar /> },
    { name: 'Taxi Ride', bookings: 0, revenue: 0, activeDrivers: 0, isActive: true, icon: <FaTaxi /> },
    { name: 'Intercity', bookings: 0, revenue: 0, activeDrivers: 0, isActive: true, icon: <BuildingOfficeIcon /> },
    { name: 'Taxi Booking', bookings: 0, revenue: 0, activeDrivers: 0, isActive: true, icon: <CalendarIcon /> },
    { name: 'Taxi Pool', bookings: 0, revenue: 0, activeDrivers: 0, isActive: true, icon: <UserGroupIcon /> },
  ]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data (unchanged)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) throw new Error('No admin token found.');

        const statsResponse = await axios.get(`${import.meta.env.VITE_BASE_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const fetchedServices = statsResponse.data.services;

        setServices((prevServices) =>
          prevServices.map((service) => {
            const serviceData = {
              'Bike Ride': fetchedServices.bikeRide,
              'Car': fetchedServices.car,
              'Taxi Ride': fetchedServices.taxiRide,
              'Intercity': fetchedServices.intercity,
              'Taxi Booking': fetchedServices.taxiBooking,
              'Taxi Pool': fetchedServices.taxiPool,
            }[service.name] || {};

            return {
              ...service,
              bookings: typeof serviceData.bookings === 'number' ? serviceData.bookings : 0,
              revenue: typeof serviceData.revenue === 'number' ? serviceData.revenue : 0,
              activeDrivers: typeof serviceData.activeDrivers === 'number' ? serviceData.activeDrivers : 0,
              isActive: typeof serviceData.isActive === 'boolean' ? serviceData.isActive : true,
            };
          })
        );

        const bookingsResponse = await axios.get(`${import.meta.env.VITE_BASE_URL}/admin/recent-bookings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecentBookings(bookingsResponse.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching initial data:', error.response?.data || error.message);
        if (error.response?.status === 401) {
          localStorage.removeItem('adminToken');
          toast.error('Session expired. Please log in again.', { position: 'top-right', autoClose: 3000 });
          navigate('/admin-login');
        } else {
          toast.error('Failed to fetch transport service data', { position: 'top-right', autoClose: 3000 });
        }
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate]);

  // Socket.IO listeners (unchanged)
  useEffect(() => {
    if (!socket) return;

    socket.on('service-stats-update', (updatedStats) => {
      setServices((prevServices) =>
        prevServices.map((service) => {
          const serviceData = {
            'Bike Ride': updatedStats.bikeRide,
            'Car': updatedStats.car,
            'Taxi Ride': updatedStats.taxiRide,
            'Intercity': updatedStats.intercity,
            'Taxi Booking': updatedStats.taxiBooking,
            'Taxi Pool': updatedStats.taxiPool,
          }[service.name] || {};

          return {
            ...service,
            bookings: typeof serviceData.bookings === 'number' ? serviceData.bookings : service.bookings,
            revenue: typeof serviceData.revenue === 'number' ? serviceData.revenue : service.revenue,
            activeDrivers: typeof serviceData.activeDrivers === 'number' ? serviceData.activeDrivers : service.activeDrivers,
            isActive: typeof serviceData.isActive === 'boolean' ? serviceData.isActive : service.isActive,
          };
        })
      );
      toast.info('Service stats updated!', { position: 'top-right', autoClose: 2000 });
    });

    socket.on('new-booking', (newBooking) => {
      setRecentBookings((prevBookings) => [newBooking, ...prevBookings].slice(0, 5));
      toast.success(`New booking received: ${newBooking.id}`, { position: 'top-right', autoClose: 2000 });
    });

    socket.on('service-status-changed', ({ serviceName, isActive }) => {
      setServices((prevServices) =>
        prevServices.map((service) =>
          service.name === serviceName ? { ...service, isActive } : service
        )
      );
      toast.info(`${serviceName} is now ${isActive ? 'active' : 'inactive'}`, { position: 'top-right', autoClose: 2000 });
    });

    return () => {
      socket.off('service-stats-update');
      socket.off('new-booking');
      socket.off('service-status-changed');
    };
  }, [socket]);

  useGSAP(() => {
    if (!isLoading) {
      gsap.fromTo(statsRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' });
      gsap.fromTo(tableRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.2 });
    }
  }, [isLoading]);

  const toggleServiceStatus = async (index) => {
    const updatedServices = [...services];
    const service = updatedServices[index];
    const newStatus = !service.isActive;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/admin/toggle-service`,
        { serviceName: service.name, isActive: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      updatedServices[index].isActive = newStatus;
      setServices(updatedServices);
      const affectedCaptains = response.data.affectedCaptains || 0;
      toast.info(
        `${service.name} is now ${newStatus ? 'active' : 'inactive'}. ${newStatus ? '' : `${affectedCaptains} captain(s) have been taken offline.`}`,
        { position: 'top-right', autoClose: 3000 }
      );
    } catch (error) {
      console.error('Error toggling service status:', error.response?.data || error.message);
      toast.error('Failed to update service status', { position: 'top-right', autoClose: 3000 });
    }
  };

  const generateReport = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/admin/generate-report`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { reportType: 'transport-service' }, // Add reportType
        responseType: 'blob',
      });
  
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `transport-service-report-${new Date().toISOString()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
  
      toast.success('Report generated successfully! Check your downloads.', { position: 'top-right', autoClose: 3000 });
    } catch (error) {
      console.error('Error generating report:', error.response?.data || error.message);
      toast.error('Failed to generate report', { position: 'top-right', autoClose: 3000 });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <span className="text-xl font-semibold text-gray-600">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 md:flex-row">
      <AdminDrawer activeRoute="/transport-service" />

      <main className="flex-1 p-4 pt-12 sm:p-6 sm:pt-14 md:ml-64 md:pt-6">
        <header className="flex flex-col items-start justify-between mb-4 sm:flex-row sm:items-center sm:mb-6">
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">Transport Service</h1>
          <div className="flex items-center mt-2 space-x-2 sm:mt-0 sm:space-x-4">
            <span className="text-sm text-gray-600 sm:text-base">Super Admin</span>
            <UserIcon className="w-5 h-5 text-gray-600 sm:w-6 sm:h-6" />
          </div>
        </header>

        <section className="mb-6 sm:mb-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-700 sm:text-xl">Service Overview</h2>
          <div
            ref={statsRef}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
          >
            {services.map((service, index) => (
              <div
                key={service.name}
                className={`p-3 bg-white rounded-lg shadow-md flex flex-col items-start sm:p-4 sm:flex-row sm:items-center sm:justify-between ${
                  !service.isActive ? 'opacity-50' : ''
                }`}
              >
                <div>
                  <h3 className="text-base font-semibold text-gray-700 sm:text-lg">{service.name}</h3>
                  <p className="text-xs text-gray-600 sm:text-sm">Bookings: {service.bookings}</p>
                  <p className="text-xs text-gray-600 sm:text-sm">Revenue: ₹{service.revenue}</p>
                  <p className="text-xs text-gray-600 sm:text-sm">Active Drivers: {service.activeDrivers}</p>
                  <button
                    onClick={() => toggleServiceStatus(index)}
                    className={`mt-2 px-2 py-1 text-xs font-semibold rounded-md sm:px-3 sm:py-1 sm:text-sm ${
                      service.isActive
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {service.isActive ? 'Disable' : 'Enable'}
                  </button>
                </div>
                <div className="w-6 h-6 mt-2 text-gray-600 sm:mt-0 sm:w-8 sm:h-8">{service.icon}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-6 sm:mb-8">
          <div className="flex flex-col items-start justify-between mb-3 sm:flex-row sm:items-center sm:mb-4">
            <h2 className="text-lg font-semibold text-gray-700 sm:text-xl">Recent Bookings</h2>
            <button
              onClick={generateReport}
              className="px-3 py-1 mt-2 text-sm font-semibold text-white bg-blue-600 rounded-md sm:mt-0 sm:px-4 sm:py-2 hover:bg-blue-700"
            >
              Generate Report
            </button>
          </div>
          <div ref={tableRef} className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-xs font-semibold text-gray-700 sm:p-4 sm:text-sm">Booking ID</th>
                  <th className="p-2 text-xs font-semibold text-gray-700 sm:p-4 sm:text-sm">Service</th>
                  <th className="p-2 text-xs font-semibold text-gray-700 sm:p-4 sm:text-sm">Customer</th>
                  <th className="p-2 text-xs font-semibold text-gray-700 sm:p-4 sm:text-sm">Driver</th>
                  <th className="p-2 text-xs font-semibold text-gray-700 sm:p-4 sm:text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="border-b">
                    <td className="p-2 text-xs text-gray-600 sm:p-4 sm:text-sm">{booking.id}</td>
                    <td className="p-2 text-xs text-gray-600 sm:p-4 sm:text-sm">{booking.service}</td>
                    <td className="p-2 text-xs text-gray-600 sm:p-4 sm:text-sm">{booking.customer}</td>
                    <td className="p-2 text-xs text-gray-600 sm:p-4 sm:text-sm">{booking.driver}</td>
                    <td className="p-2 text-xs sm:p-4 sm:text-sm">
                      <span
                        className={`px-1 py-0.5 rounded-full text-xs font-semibold inline-block ${
                          booking.status === 'Completed'
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'Ongoing' || booking.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : booking.status === 'Cancelled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TransportService;