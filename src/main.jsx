import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import SocketProvider from './context/SocketContext.jsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <SocketProvider>
      <ToastContainer position="top-right" autoClose={3000} />
      <App />
    </SocketProvider>
  </BrowserRouter>
);