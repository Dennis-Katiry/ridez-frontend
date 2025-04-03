import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import axios from 'axios';
import { toast } from 'react-toastify';
import AdminDrawer from './AdminDrawer';
import { UserIcon } from '@heroicons/react/24/outline';

const Customers = () => {
  const tableRef = useRef(null);
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState(customers);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin-login');
    }
  }, [navigate]);

  // Fetch customers data from the API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const fetchedCustomers = response.data.users.map((user, index) => ({
          id: user._id || `C${String(index + 1).padStart(3, '0')}`,
          name: `${user.fullname?.firstname || 'Unknown'} ${user.fullname?.lastname || ''}`.trim(),
          email: user.email || 'N/A',
          totalRides: user.totalRides || 0,
          isActive: user.isActive !== undefined ? user.isActive : true,
        }));

        setCustomers(fetchedCustomers);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching customers:', error);
        if (error.response?.status === 401) {
          localStorage.removeItem('adminToken');
          toast.error('Session expired. Please log in again.', { position: 'top-right', autoClose: 3000 });
          navigate('/admin-login');
        } else {
          toast.error('Failed to fetch customers data', { position: 'top-right', autoClose: 3000 });
        }
        setIsLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  // Filter customers based on search query
  useEffect(() => {
    setFilteredCustomers(
      customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [searchQuery, customers]);

  // GSAP animations
  useGSAP(() => {
    if (!isLoading) {
      gsap.fromTo(
        tableRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
      );
    }
  }, [isLoading]);

  const toggleCustomerStatus = async (index) => {
    const customer = customers[index];
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/admin/users/${customer.id}/toggle-status`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedCustomers = [...customers];
      updatedCustomers[index] = response.data.user;
      setCustomers(updatedCustomers);
      toast.info(response.data.message, { position: 'top-right', autoClose: 3000 });
    } catch (error) {
      console.error('Error toggling customer status:', error);
      toast.error('Failed to toggle customer status', { position: 'top-right', autoClose: 3000 });
    }
  };

  const generateReport = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/admin/generate-report`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { reportType: 'customers' }, // Add reportType
        responseType: 'blob',
      });
  
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customers-report-${new Date().toISOString()}.pdf`);
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
        <span className="text-lg font-semibold text-gray-600 sm:text-xl">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 md:flex-row">
      <AdminDrawer activeRoute="/customers" />
      <main className="flex-1 p-4 pt-12 sm:p-6 sm:pt-14 md:ml-64 md:pt-6">
        <header className="flex flex-col items-start justify-between mb-4 sm:flex-row sm:items-center sm:mb-6">
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">Customers</h1>
          <div className="flex items-center mt-2 space-x-2 sm:mt-0 sm:space-x-4">
            <span className="text-sm text-gray-600 sm:text-base">Super Admin</span>
            <UserIcon className="w-5 h-5 text-gray-600 sm:w-6 sm:h-6" />
          </div>
        </header>

        <section className="mb-6 sm:mb-8">
          <div className="flex flex-col items-start justify-between mb-3 sm:flex-row sm:items-center sm:mb-4">
            <h2 className="text-lg font-semibold text-gray-700 sm:text-xl">Customer List</h2>
            <div className="flex flex-col items-start w-full mt-2 sm:flex-row sm:items-center sm:mt-0 sm:space-x-4 sm:w-auto">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={generateReport}
                className="w-full px-3 py-2 mt-2 text-sm font-semibold text-white bg-blue-600 rounded-md sm:w-auto sm:mt-0 sm:px-4 hover:bg-blue-700"
              >
                Generate Report
              </button>
            </div>
          </div>
          <div ref={tableRef} className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 text-xs font-semibold text-gray-700 sm:p-4 sm:text-sm">Customer ID</th>
                  <th className="p-2 text-xs font-semibold text-gray-700 sm:p-4 sm:text-sm">Name</th>
                  <th className="p-2 text-xs font-semibold text-gray-700 sm:p-4 sm:text-sm">Email</th>
                  <th className="p-2 text-xs font-semibold text-gray-700 sm:p-4 sm:text-sm">Total Rides</th>
                  <th className="p-2 text-xs font-semibold text-gray-700 sm:p-4 sm:text-sm">Status</th>
                  <th className="p-2 text-xs font-semibold text-gray-700 sm:p-4 sm:text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer.id} className="border-b">
                    <td className="p-2 text-xs text-gray-600 sm:p-4 sm:text-sm">{customer.id}</td>
                    <td className="p-2 text-xs text-gray-600 sm:p-4 sm:text-sm">{customer.name}</td>
                    <td className="p-2 text-xs text-gray-600 sm:p-4 sm:text-sm">{customer.email}</td>
                    <td className="p-2 text-xs text-gray-600 sm:p-4 sm:text-sm">{customer.totalRides}</td>
                    <td className="p-2 text-xs sm:p-4 sm:text-sm">
                      <span
                        className={`px-1 py-0.5 rounded-full text-xs font-semibold inline-block ${
                          customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {customer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-2 text-xs sm:p-4 sm:text-sm">
                      <button
                        onClick={() => toggleCustomerStatus(index)}
                        className={`w-full px-2 py-1 text-xs font-semibold rounded-md sm:w-auto sm:px-3 sm:text-sm ${
                          customer.isActive
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {customer.isActive ? 'Deactivate' : 'Activate'}
                      </button>
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

export default Customers;