import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { LoadScript } from '@react-google-maps/api';
import { BounceLoader, PulseLoader, ClipLoader } from 'react-spinners'; 
import Start from './pages/Start';
import UserLogin from './pages/UserLogin';
import UserSignup from './pages/UserSignup';
import CaptainLogin from './pages/Captainlogin';
import CaptainSignup from './pages/CaptainSignup';
import Home from './pages/Home';
import UserLogout from './pages/UserLogout';
import UserProtectWrapper from './pages/UserProtectWrapper';
import CaptainHome from './pages/CaptainHome';
import CaptainProtectWrapper from './pages/CaptainProtectWrapperContext';
import CaptainDetails from './components/CaptainDetails.jsx';
import Riding from './pages/Riding';
import CaptainRiding from './pages/CaptainRiding';
import RiderFeedback from './pages/RiderFeedback.jsx';
import UserProfile from './pages/UserProfile';
import CaptainProfile from './pages/CaptainProfile';
import CaptainContext from './context/CaptainContext';
import UserContext from './context/UserContext';
import AdminLogin from './admin/AdminLogin.jsx';
import AdminDashboard from './admin/AdminDashboard.jsx';
import TransportService from './admin/TransportService.jsx';
import Customers from './admin/Customers.jsx';
import Drivers from './admin/Drivers.jsx';
import AdminProtectWrapper from './admin/AdminProtectWrapper';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';

const googleMapsLibraries = ['places'];

const App = () => {
  const navigate = useNavigate();
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [appLoaded, setAppLoaded] = useState(false); 

  useEffect(() => {
    const userToken = localStorage.getItem('userToken');
    const captainToken = localStorage.getItem('captainToken');
    const adminToken = localStorage.getItem('adminToken');

    if (!userToken && !captainToken && !adminToken) {
      const protectedPaths = [
        '/home', '/captain-home', '/user-profile', '/captain-profile', '/Riding',
        '/captain-riding', '/admin-dashboard', '/transport-service', '/customers',
        '/drivers', '/admin-captain-details',
      ];
      if (protectedPaths.includes(window.location.pathname)) {
        navigate('/');
      }
    }

  
    if (mapsLoaded) {
      setTimeout(() => setAppLoaded(true), 1000); 
    }
  }, [navigate, mapsLoaded]);


  const loaderStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0)',
    zIndex: 9999,
  };

  return (
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      libraries={googleMapsLibraries}
      onLoad={() => {
        console.log('Google Maps API loaded');
        setMapsLoaded(true);
      }}
      onError={() => {
        console.error('Failed to load Google Maps API');
        setMapsLoaded(false);
        toast.error('Failed to load Google Maps API.', { position: 'top-right', autoClose: 3000 });
      }}
    >
      {!appLoaded ? (
        <div style={loaderStyle}>
          <BounceLoader color="#36d7b7" size={60} /> 
        </div>
      ) : (
        <UserContext>
          <CaptainContext>
            <Routes>
              <Route path="/" element={<Start />} />
              <Route path="/login" element={<UserLogin />} />
              <Route path="/signup" element={<UserSignup />} />
              <Route path="/captain-login" element={<CaptainLogin />} />
              <Route path="/captain-signup" element={<CaptainSignup />} />
              <Route path="/home" element={<UserProtectWrapper><Home mapsLoaded={mapsLoaded} /></UserProtectWrapper>} />
              <Route path="/user/logout" element={<UserProtectWrapper><UserLogout /></UserProtectWrapper>} />
              <Route path="/user-profile" element={<UserProtectWrapper><UserProfile /></UserProtectWrapper>} />
              <Route path="/Riding" element={<Riding />} />
              <Route path="/rider-feedback" element={<RiderFeedback />} />
              <Route path="/captain-home" element={<CaptainProtectWrapper><CaptainHome mapsLoaded={mapsLoaded} /></CaptainProtectWrapper>} />
              <Route path="/captain-details" element={<CaptainProtectWrapper><CaptainDetails /></CaptainProtectWrapper>} />
              <Route path="/captain-profile" element={<CaptainProtectWrapper><CaptainProfile /></CaptainProtectWrapper>} />
              <Route path="/captain-riding" element={<CaptainRiding />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/admin-dashboard" element={<AdminProtectWrapper><AdminDashboard /></AdminProtectWrapper>} />
              <Route path="/transport-service" element={<AdminProtectWrapper><TransportService /></AdminProtectWrapper>} />
              <Route path="/customers" element={<AdminProtectWrapper><Customers /></AdminProtectWrapper>} />
              <Route path="/drivers" element={<AdminProtectWrapper><Drivers /></AdminProtectWrapper>} />
            </Routes>
          </CaptainContext>
        </UserContext>
      )}
    </LoadScript>
  );
};

export default App;