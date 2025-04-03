/* eslint-disable react/prop-types */
import React, { useContext, useEffect, useState } from 'react';
import { CaptainDataContext } from '../context/CaptainContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CaptainProtectWrapper = ({ children }) => {
  const token = localStorage.getItem('captainToken'); // Use 'captainToken'
  const navigate = useNavigate();
  const { captain, setCaptain } = useContext(CaptainDataContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/captain-login');
      return;
    }

    axios
      .get(`${import.meta.env.VITE_BASE_URL}/captains/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        if (response.status === 200) {
          setCaptain(response.data);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        console.error('AxiosError in CaptainProtectWrapper:', error.response?.data || error.message);
        localStorage.removeItem('captainToken');
        navigate('/captain-login');
      });
  }, [token, navigate, setCaptain]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default CaptainProtectWrapper;