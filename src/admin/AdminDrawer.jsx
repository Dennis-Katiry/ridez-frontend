import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  HomeIcon,
  TruckIcon,
  UsersIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

const AdminDrawer = ({ activeRoute }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    toast.success('Logged out successfully!', { position: 'top-right', autoClose: 3000 });
    navigate('/admin-login');
  };

  const navItems = [
    { path: '/admin-dashboard', label: 'Dashboard', icon: <HomeIcon className="w-5 h-5 mr-2" /> },
    { path: '/transport-service', label: 'Transport Service', icon: <TruckIcon className="w-5 h-5 mr-2" /> },
    { path: '/customers', label: 'Customers', icon: <UsersIcon className="w-5 h-5 mr-2" /> },
    { path: '/drivers', label: 'Drivers', icon: <UserIcon className="w-5 h-5 mr-2" /> },
  ];

  return (
    <>
      <button
        className="fixed z-50 p-1.5 text-white bg-gray-900 rounded-md top-3 left-3 sm:p-2 sm:top-4 sm:left-4 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
          />
        </svg>
      </button>

      <aside
        className={`fixed top-0 left-0 z-40 h-screen p-3 text-white bg-gray-900 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 w-56 sm:w-64`}
      >
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl font-extrabold text-white sm:text-2xl">Ridez Admin</h2>
        </div>
        <nav className="space-y-1 sm:space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center p-2 text-sm rounded-md sm:p-3 sm:text-base ${
                activeRoute === item.path ? 'bg-gray-700' : 'hover:bg-gray-700'
              }`}
              onClick={() => setIsOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="absolute bottom-3 w-[calc(100%-1.5rem)] py-1.5 text-sm font-semibold text-white bg-red-600 rounded-md sm:bottom-4 sm:w-[calc(100%-2rem)] sm:py-2 sm:text-base hover:bg-red-700"
        >
          Logout
        </button>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

AdminDrawer.propTypes = {
  activeRoute: PropTypes.string.isRequired,
};

export default AdminDrawer;