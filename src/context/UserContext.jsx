import React, { createContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types'; // Import PropTypes
import { toast } from 'react-toastify';

export const UserDataContext = createContext();

const UserContext = ({ children }) => {
  const [user, setUser] = useState(null);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      console.log('No user token found, skipping fetch');
      setUser(null);
      return;
    }
    try {
      console.log('Fetching user from:', `${import.meta.env.VITE_BASE_URL}/users/me`);
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        console.log('User fetched:', data);
        setUser(data);
      } else {
        throw new Error(data.message || 'Failed to fetch user data');
      }
    } catch (err) {
      console.error('Fetch error:', err.message);
      setUser(null);
      toast.error(err.message, { position: 'top-right', autoClose: 3000 });
      if (err.message.includes('Unauthorized') || err.message.includes('Invalid token')) {
        localStorage.removeItem('userToken');
        window.location.href = '/login';
      }
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <UserDataContext.Provider value={{ user, setUser, fetchUser }}>
      {children}
    </UserDataContext.Provider>
  );
};

// Add prop type validation
UserContext.propTypes = {
  children: PropTypes.node.isRequired,
};

export default UserContext;
