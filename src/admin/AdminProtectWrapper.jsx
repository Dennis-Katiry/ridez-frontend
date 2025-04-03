import React from 'react';
import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';

const AdminProtectWrapper = ({ children }) => {
  const token = localStorage.getItem('adminToken');

  if (!token) {
    return <Navigate to="/admin-login" />;
  }

  return children;
};

AdminProtectWrapper.propTypes = {
  children: PropTypes.node.isRequired, 
};

export default AdminProtectWrapper;
