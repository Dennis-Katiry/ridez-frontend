import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { SocketContext } from './SocketContext';

export const CaptainDataContext = createContext();

const CaptainContext = ({ children }) => {
  const [captain, setCaptain] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    earningsToday: 0,
    hoursOnline: 0,
    tripsToday: 0,
    rating: 0,
  });

  const { socket } = useContext(SocketContext);

  const fetchCaptain = useCallback(async () => {
    const token = localStorage.getItem('captainToken');
    console.log('Token:', token);
    if (!token) {
      console.log('No captain token found');
      setCaptain(null);
      return;
    }
  
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/captains/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      if (response.ok) {
        setCaptain(data);
      } else {
        throw new Error(data.message || 'Failed to fetch captain');
      }
    } catch (err) {
      console.error('Fetch error:', err.message);
      setError(err.message);
      setCaptain(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    const token = localStorage.getItem('captainToken');
    if (!token || !captain) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/captains/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setStats({
          earningsToday: data.earningsToday || 0,
          hoursOnline: data.hoursOnline || 0,
          tripsToday: data.tripsToday || 0,
          rating: data.rating || 0,
        });
      } else {
        throw new Error(data.message || 'Failed to fetch stats');
      }
    } catch (err) {
      setError(err.message);
    }
  }, [captain]);

  const updateCaptain = (captainData) => {
    setCaptain(captainData);
  };

  useEffect(() => {
    fetchCaptain();
  }, [fetchCaptain]);

  useEffect(() => {
    if (captain) {
      fetchStats();
    }
  }, [captain, fetchStats]);

  useEffect(() => {
    if (!socket || !captain) return;

    socket.on('stats-update', (updatedStats) => {
      console.log('Received stats update:', updatedStats);
      setStats((prevStats) => ({
        ...prevStats,
        earningsToday: updatedStats.earningsToday || prevStats.earningsToday,
        hoursOnline: updatedStats.hoursOnline || prevStats.hoursOnline,
        tripsToday: updatedStats.tripsToday || prevStats.tripsToday,
        rating: updatedStats.rating || prevStats.rating,
      }));
    });

    return () => {
      socket.off('stats-update');
    };
  }, [socket, captain]);

  const value = {
    captain,
    setCaptain,
    fetchCaptain,
    updateCaptain,
    isLoading,
    setIsLoading,
    error,
    setError,
    stats,
    fetchStats,
  };

  return (
    <CaptainDataContext.Provider value={value}>
      {children}
    </CaptainDataContext.Provider>
  );
};

CaptainContext.propTypes = {
  children: PropTypes.node.isRequired,
};

export default CaptainContext;