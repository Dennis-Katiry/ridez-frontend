import React, { createContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export const SocketContext = createContext();

const SocketProvider = ({ children }) => {
    const socketRef = useRef(null);
    const [socket, setSocket] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!socketRef.current) {
            const socketUrl = import.meta.env.VITE_BASE_URL || 'https://rt5gcc3t-5173.inc1.devtunnels.ms';
            console.log('Connecting to Socket.IO server at:', socketUrl);

            // Get the admin token from localStorage
            const token = localStorage.getItem('adminToken') || localStorage.getItem('captainToken');

            const newSocket = io(socketUrl, {
                transports: ['websocket', 'polling'],
                withCredentials: true,
                reconnection: true,
                reconnectionAttempts: Infinity,
                reconnectionDelay: 1000,
                auth: { token }, // Add the auth token
            });

            socketRef.current = newSocket;

            newSocket.on('connect', () => {
                console.log('Connected to server:', newSocket.id);
                setSocket(newSocket);
                // Join the admin room if adminToken exists
                if (localStorage.getItem('adminToken')) {
                    newSocket.emit('join', { role: 'admin' });
                }
            });

            newSocket.on('disconnect', (reason) => {
                console.log('Disconnected from server:', reason);
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket connection error:', err.message);
                if (err.message === 'Authentication error') {
                    localStorage.removeItem('adminToken');
                    localStorage.removeItem('captainToken');
                    toast.error('Session expired. Please log in again.', {
                        position: 'top-right',
                        autoClose: 3000,
                    });
                    navigate('/admin-login');
                }
            });

            newSocket.on('reconnect', (attempt) => {
                console.log('Reconnected to server:', newSocket.id, 'Attempt:', attempt);
            });

            newSocket.on('reconnect_failed', () => {
                console.error('Socket reconnection failed');
                toast.error('Lost connection to server. Please refresh.', {
                    position: 'top-right',
                    autoClose: 3000,
                });
            });

            newSocket.on('ride-cancelled', (data) => {
                console.log('Global ride-cancelled event:', data, 'SocketId:', newSocket.id);
                const token = localStorage.getItem('captainToken');
                if (token) {
                    toast.error('Ride cancelled by rider', { position: 'top-right', autoClose: 3000 });
                    setTimeout(() => navigate('/captain-home', { replace: true }), 1500);
                }
            });

            return () => {
                newSocket.disconnect();
                socketRef.current = null;
            };
        }
    }, [navigate]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};

SocketProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export default SocketProvider;