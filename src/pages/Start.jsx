import React from 'react';
import { Link } from 'react-router-dom';
import './Start.css'; // Import a new CSS file for styles

const Start = () => {
  return (
    <div className="relative min-h-screen overflow-hidden font-sans bg-gray-900">
      {/* Background */}
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1658744796948-b11ae1b52f3f?q=80&w=1886&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)',
          filter: 'brightness(60%) blur(2px)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/20 via-gray-900/60 to-gray-900/90"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4">
          <Link to="/start">
            <img
              className="w-auto h-12 filter invert brightness-200"
              src="/images/ridezlogo.png"
              alt="Ridez Logo"
            />
          </Link>
          <div className="flex gap-4">
            <Link
              to="/login"
              className="font-medium text-white transition hover:text-blue-300"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="font-medium text-white transition hover:text-blue-300"
            >
              Sign Up
            </Link>
          </div>
        </header>

        {/* Main Section */}
        <main className="flex flex-col items-center justify-center flex-grow px-6 text-center text-white">
          <h1 className="mb-6 text-5xl font-extrabold leading-tight md:text-6xl lg:text-7xl animate-fade-in">
            Ride with Ease
          </h1>
          <p className="max-w-lg mb-10 text-xl text-gray-200 md:text-2xl animate-fade-in-delay">
            Book your ride in seconds and travel with comfort and style.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-10 py-4 text-lg font-semibold text-white transition duration-300 bg-blue-600 rounded-full shadow-xl hover:bg-blue-700 hover:scale-105 focus:ring-4 focus:ring-blue-300 animate-fade-in-delay"
          >
            Get Started
            <i className="text-2xl ri-arrow-right-line"></i>
          </Link>
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 text-center text-gray-400">
          <p className="text-sm">
            © 2025 Ridez. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Start;