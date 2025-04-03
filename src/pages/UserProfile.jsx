import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "remixicon/fonts/remixicon.css";
import { UserDataContext } from "../context/UserContext";

const UserProfile = () => {
  const { user, setUser, fetchUser } = useContext(UserDataContext);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ firstname: "", lastname: "", phone: "" });
  const [profilePic, setProfilePic] = useState(null);
  const [preferences, setPreferences] = useState({
    ride: { vehicleType: "car", music: false, quietRide: false },
    notifications: { email: true, sms: false },
    privacy: { shareRideHistory: false },
  });
  const [activeSection, setActiveSection] = useState("profile");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchRides = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("userToken");
        if (!token) {
          setError("Please log in to view your profile.");
          navigate("/login");
          return;
        }

        if (!user) {
          await fetchUser();
        }

        const ridesResponse = await fetch(`${import.meta.env.VITE_BASE_URL}/rides/user-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!ridesResponse.ok) {
          const errorData = await ridesResponse.json();
          throw new Error(errorData.error || `HTTP error ${ridesResponse.status}`);
        }
        const ridesData = await ridesResponse.json();
        const fetchedRides = Array.isArray(ridesData) ? ridesData : [];
        setRides(fetchedRides);
      } catch (err) {
        console.error("Fetch rides error:", err);
        setError(err.message);
        toast.error(err.message, { position: "top-right", autoClose: 3000 });
        if (err.message.includes("Unauthorized")) navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchRides();
  }, [fetchUser, navigate, user]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstname: user.fullname?.firstname || "",
        lastname: user.fullname?.lastname || "",
        phone: user.phoneNumber || "",
      });
      setPreferences({
        ride: user.preferences?.ride || { vehicleType: "car", music: false, quietRide: false },
        notifications: user.preferences?.notifications || { email: true, sms: false },
        privacy: user.preferences?.privacy || { shareRideHistory: false },
      });
    }
  }, [user]);

  const handleEditToggle = () => setIsEditing(!isEditing);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("userToken");
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/users/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullname: { firstname: formData.firstname, lastname: formData.lastname },
          phone: formData.phone,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setUser(data);
        setIsEditing(false);
        toast.success("Profile updated successfully!", { position: "top-right", autoClose: 3000 });
        await fetchUser();
      } else {
        throw new Error(data.message || "Failed to update profile");
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message, { position: "top-right", autoClose: 3000 });
    }
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) setProfilePic(file);
  };

  const handleProfilePicUpload = async () => {
    if (!profilePic) {
      toast.error("Please select an image to upload.", { position: "top-right", autoClose: 3000 });
      return;
    }
    try {
      const token = localStorage.getItem("userToken");
      const formData = new FormData();
      formData.append("profilePic", profilePic);

      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/users/update-profile-pic`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        const fullUrl = `${import.meta.env.VITE_BASE_URL}${data.profilePic}`;
        setUser((prev) => ({ ...prev, profilePic: fullUrl }));
        await fetchUser();
        setProfilePic(null);
        toast.success("Profile picture updated successfully!", { position: "top-right", autoClose: 3000 });
      } else {
        throw new Error(data.message || "Failed to upload profile picture");
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(err.message, { position: "top-right", autoClose: 3000 });
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("userToken");
      setUser(null);
      toast.success("Logged out successfully!", { position: "top-right", autoClose: 2000 });
      navigate("/login");
    } catch (err) {
      toast.error("Error during logout", { position: "top-right", autoClose: 3000 });
      console.error("Logout error:", err);
    }
  };

  const handlePreferenceChange = async (e) => {
    const { name, checked, value, dataset, type } = e.target;
    const category = dataset.category;
    const newValue = type === "checkbox" ? checked : value;
    const newPreferences = {
      ...preferences,
      [category]: {
        ...preferences[category],
        [name]: newValue,
      },
    };
    setPreferences(newPreferences);
    try {
      const token = localStorage.getItem("userToken");
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/users/preferences`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPreferences),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || "Failed to update preferences");
      }
      toast.success("Preferences updated!", { position: "top-right", autoClose: 3000 });
    } catch (err) {
      console.error("Preference update error:", err.message);
      toast.error(err.message, { position: "top-right", autoClose: 3000 });
    }
  };

  const handleNavigate = (section) => {
    setActiveSection(section);
    if (window.innerWidth < 1024) setIsMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
        <div className="flex items-center gap-2 text-xl font-medium text-gray-600 animate-pulse">
          <i className="ri-loader-4-line"></i> Loading...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="p-6 bg-white shadow-2xl rounded-t-3xl">
          <p className="flex items-center gap-2 mb-4 text-lg font-medium text-red-600">
            <i className="ri-error-warning-line"></i> {error}
          </p>
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-2 px-3 py-2 text-white transition-transform transform bg-blue-600 rounded-lg hover:bg-blue-700 hover:scale-105"
            aria-label="Back to Home"
          >
            <i className="ri-home-2-line"></i> Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Sidebar / Drawer */}
      <div
        className={`bg-white shadow-lg border-r border-gray-100 transition-transform duration-300 ease-in-out fixed h-screen z-50 lg:static
          ${isMenuOpen ? "translate-x-0 w-3/4 sm:w-1/2 lg:w-1/4" : "-translate-x-full w-0 lg:w-1/4 lg:translate-x-0"} overflow-y-auto`}
      >
        <div className="flex items-center justify-between p-4 text-white bg-gradient-to-r from-blue-600 to-blue-700">
          <h1 className="text-xl font-bold">User Profile</h1>
          <button
            onClick={() => setIsMenuOpen(false)}
            className="text-2xl text-white lg:hidden"
            aria-label="Close menu"
          >
            <i className="ri-close-line"></i>
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {["profile", "stats", "history", "preferences"].map((section) => (
            <button
              key={section}
              onClick={() => handleNavigate(section)}
              className={`w-full text-left px-4 py-2 rounded-lg flex items-center gap-3 transition-colors duration-200 ${
                activeSection === section
                  ? "bg-blue-100 text-blue-700 font-semibold"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              aria-label={`${section.charAt(0).toUpperCase() + section.slice(1)} section`}
            >
              <i
                className={`ri-${
                  section === "profile"
                    ? "user"
                    : section === "stats"
                    ? "bar-chart"
                    : section === "history"
                    ? "history"
                    : "settings"
                }-line`}
              ></i>
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center w-full gap-3 px-4 py-2 text-left text-red-600 transition-colors duration-200 rounded-lg hover:bg-red-100"
            aria-label="Logout"
          >
            <i className="ri-logout-box-line"></i> Logout
          </button>
        </nav>
      </div>

      {/* Overlay for Mobile */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-4 sm:p-6 lg:p-10">
        <div className="flex items-center justify-between mb-6">
          <div className={`${isMenuOpen ? "hidden" : "block"} lg:hidden`}>
            <button
              onClick={() => setIsMenuOpen(true)}
              className="text-xl text-blue-600"
              aria-label="Open menu"
            >
              <i className="ri-menu-line"></i>
            </button>
          </div>
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-2 px-3 py-2 text-blue-600 transition-colors duration-200 rounded hover:text-blue-800"
            aria-label="Back to Home"
          >
            <i className="ri-arrow-left-line"></i> Back to Home
          </button>
        </div>

        <div className="space-y-8">
          {/* Profile Card */}
          {activeSection === "profile" && (
            <div className="bg-white border border-gray-100 rounded-t-3xl shadow-2xl p-6 sm:p-8 transform hover:scale-[1.01] transition-transform duration-300">
              <h2 className="flex items-center gap-4 pb-4 mb-6 text-xl font-bold text-gray-800 border-b border-gray-200 sm:text-2xl">
                <i className="text-blue-500 ri-user-line"></i> Profile
              </h2>
              <div className="flex flex-col items-center gap-6">
                {/* Profile Picture Section */}
                <div className="relative group">
                  <div className="relative w-32 h-32 overflow-hidden transition-all duration-300 border-4 border-blue-100 rounded-full shadow-lg sm:w-40 sm:h-40 group-hover:border-blue-200">
                    {user.profilePic ? (
                      <img
                        src={
                          user.profilePic.startsWith("http")
                            ? user.profilePic
                            : `${import.meta.env.VITE_BASE_URL}${user.profilePic}`
                        }
                        alt="Profile"
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                        onError={() => console.log("Image load error")}
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-100 to-gray-200">
                        <span className="text-4xl font-medium text-gray-500 sm:text-5xl">
                          {user.fullname?.firstname?.charAt(0) || "P"}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 transition-all duration-300 bg-black bg-opacity-0 rounded-full group-hover:bg-opacity-20"></div>
                  </div>
                  <label
                    htmlFor="profilePicUpload"
                    className="absolute p-2 text-white transition-all duration-200 bg-blue-600 rounded-full cursor-pointer sm:p-3 bottom-2 right-2 hover:bg-blue-700 hover:scale-110"
                    aria-label="Upload profile picture"
                  >
                    <i className="text-base sm:text-lg ri-camera-fill"></i>
                    <input
                      id="profilePicUpload"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePicChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <button
                  onClick={handleProfilePicUpload}
                  disabled={!profilePic}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    profilePic
                      ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 hover:from-blue-100 hover:to-blue-200"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Upload Photo
                </button>

                {/* User Info */}
                <div className="space-y-4 text-center">
                  <h2 className="text-xl font-semibold text-gray-800 sm:text-2xl">
                    {user.fullname?.firstname} {user.fullname?.lastname}
                  </h2>
                  <div className="flex flex-col gap-3">
                    <p className="flex items-center justify-center gap-3 text-gray-600">
                      <i className="text-blue-500 ri-mail-line"></i> {user.email}
                    </p>
                    <p className="flex items-center justify-center gap-3 text-gray-600">
                      <i className="text-blue-500 ri-phone-line"></i> {user.phoneNumber || "Not provided"}
                    </p>
                  </div>
                </div>

                {/* Edit Profile Section */}
                {!isEditing && (
                  <button
                    onClick={handleEditToggle}
                    className="flex items-center gap-2 px-3 py-2 text-white transition-all duration-200 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    aria-label="Edit profile"
                  >
                    <i className="ri-edit-2-line"></i> Edit Profile
                  </button>
                )}
                {isEditing && (
                  <form onSubmit={handleUpdateProfile} className="w-full mt-6 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">First Name</label>
                        <input
                          type="text"
                          name="firstname"
                          value={formData.firstname}
                          onChange={handleInputChange}
                          className="w-full p-3 mt-1 transition-all duration-200 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-50"
                          required
                          aria-label="First name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Last Name</label>
                        <input
                          type="text"
                          name="lastname"
                          value={formData.lastname}
                          onChange={handleInputChange}
                          className="w-full p-3 mt-1 transition-all duration-200 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-50"
                          aria-label="Last name"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Phone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full p-3 mt-1 transition-all duration-200 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-50"
                          aria-label="Phone number"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button
                        type="submit"
                        className="flex-1 px-3 py-2 text-white transition-all duration-200 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                        aria-label="Save profile"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleEditToggle}
                        className="flex-1 px-3 py-2 text-gray-700 transition-all duration-200 bg-gray-200 rounded-lg hover:bg-gray-300"
                        aria-label="Cancel edit"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Ride Stats Card */}
          {activeSection === "stats" && (
            <div className="bg-white border border-gray-100 rounded-t-3xl shadow-2xl p-6 sm:p-8 transform hover:scale-[1.01] transition-transform duration-300">
              <h2 className="flex items-center gap-4 pb-4 mb-6 text-xl font-bold text-gray-800 border-b border-gray-200 sm:text-2xl">
                <i className="text-blue-500 ri-bar-chart-line"></i> Ride Stats
              </h2>
              {rides.length === 0 ? (
                <p className="italic text-center text-gray-600">No ride data available yet. Take a ride to see your stats!</p>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="p-4 transition-shadow duration-200 rounded-lg shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <i className="text-3xl text-blue-500 ri-roadster-line"></i>
                        <div>
                          <p className="text-sm text-gray-600">Total Rides</p>
                          <p className="text-lg font-semibold text-gray-800 sm:text-xl">{rides.length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 transition-shadow duration-200 rounded-lg shadow-sm bg-gradient-to-br from-green-50 to-green-100 hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <i className="text-3xl text-green-500 ri-wallet-line"></i>
                        <div>
                          <p className="text-sm text-gray-600">Total Spent</p>
                          <p className="text-lg font-semibold text-gray-800 sm:text-xl">
                            ₹{rides.reduce((total, ride) => total + (ride.fare || 0), 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 transition-shadow duration-200 rounded-lg shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <i className="text-3xl text-purple-500 ri-calendar-line"></i>
                        <div>
                          <p className="text-sm text-gray-600">Recent Ride</p>
                          <p className="text-lg font-semibold text-gray-800 sm:text-xl">
                            {rides[0]?.createdAt ? new Date(rides[0].createdAt).toLocaleDateString() : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <i className="text-xl text-blue-500 sm:text-2xl ri-line-chart-line"></i>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Average Ride Cost</p>
                        <p className="text-base font-medium text-gray-800 sm:text-lg">
                          ₹{(rides.reduce((total, ride) => total + (ride.fare || 0), 0) / rides.length || 0).toFixed(2)}
                        </p>
                        <div className="w-full h-2 mt-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-blue-500 rounded-full"
                            style={{
                              width: `${Math.min((rides.reduce((total, ride) => total + (ride.fare || 0), 0) / rides.length) / 500 * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <i className="text-xl text-blue-500 sm:text-2xl ri-map-pin-line"></i>
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Total Distance (Mock)</p>
                        <p className="text-base font-medium text-gray-800 sm:text-lg">
                          {(rides.length * 10).toFixed(1)} km
                        </p>
                        <div className="w-full h-2 mt-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-blue-500 rounded-full"
                            style={{
                              width: `${Math.min((rides.length * 10) / 100 * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ride History Card */}
          {activeSection === "history" && (
            <div className="bg-white border border-gray-100 rounded-t-3xl shadow-2xl p-6 sm:p-8 transform hover:scale-[1.01] transition-transform duration-300">
              <h2 className="flex items-center gap-4 pb-4 mb-6 text-xl font-bold text-gray-800 border-b border-gray-200 sm:text-2xl">
                <i className="text-blue-500 ri-history-line"></i> Ride History
              </h2>
              {rides.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 rounded-lg bg-gray-50">
                  <i className="mb-4 text-4xl text-gray-400 ri-car-line"></i>
                  <p className="italic text-center text-gray-600">No rides yet. Start your journey!</p>
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto max-h-80">
                  {rides.slice(0, 5).map((ride) => (
                    <div
                      key={ride._id}
                      className="p-4 transition-all duration-200 border border-gray-200 rounded-lg shadow-sm bg-gradient-to-br from-white to-gray-50 hover:shadow-md"
                    >
                      <div className="flex flex-col mb-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <i className="text-lg text-blue-500 sm:text-xl ri-calendar-line"></i>
                          <span className="text-xs text-gray-600 sm:text-sm">
                            {new Date(ride.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span
                          className={`mt-2 sm:mt-0 px-3 py-1 text-xs font-medium rounded-full ${
                            ride.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {ride.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 sm:text-base">
                        <i className="mr-2 text-blue-500 ri-user-line"></i>
                        <span className="font-medium">Captain:</span>{" "}
                        {ride.captain?.fullname?.firstname || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-700 sm:text-base">
                        <i className="mr-2 text-blue-500 ri-map-pin-line"></i>
                        <span className="font-medium">Destination:</span> {ride.destination}
                      </p>
                      <p className="text-sm text-gray-700 sm:text-base">
                        <i className="mr-2 text-blue-500 ri-money-dollar-circle-line"></i>
                        <span className="font-medium">Fare:</span> ₹{ride.fare.toFixed(2)}
                      </p>
                    </div>
                  ))}
                  {rides.length > 5 && (
                    <p className="text-sm text-center text-blue-500 cursor-pointer hover:underline">
                      View More...
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Preferences Card */}
          {activeSection === "preferences" && (
            <div className="bg-white border border-gray-100 rounded-t-3xl shadow-2xl p-6 sm:p-8 transform hover:scale-[1.01] transition-transform duration-300">
              <h2 className="flex items-center gap-4 pb-4 mb-6 text-xl font-bold text-gray-800 border-b border-gray-200 sm:text-2xl">
                <i className="text-blue-500 ri-settings-2-line"></i> Preferences
              </h2>
              <div className="space-y-6">
                {/* Ride Preferences */}
                <div className="p-4 transition-all duration-200 border border-gray-100 rounded-lg shadow-sm bg-gradient-to-br from-gray-50 to-white hover:shadow-md">
                  <h3 className="flex items-center gap-3 pb-3 mb-4 text-lg font-semibold text-gray-700 border-b border-gray-200">
                    <i className="text-blue-500 ri-car-line"></i> Ride Preferences
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        name="quietRide"
                        data-category="ride"
                        checked={preferences.ride.quietRide}
                        onChange={handlePreferenceChange}
                        className="w-5 h-5 text-blue-600 transition-all duration-200 rounded focus:ring-2 focus:ring-blue-500"
                        aria-label="Quiet ride preference"
                      />
                      <span className="text-gray-700">Quiet Ride</span>
                    </label>
                    <label className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        name="music"
                        data-category="ride"
                        checked={preferences.ride.music}
                        onChange={handlePreferenceChange}
                        className="w-5 h-5 text-blue-600 transition-all duration-200 rounded focus:ring-2 focus:ring-blue-500"
                        aria-label="Music preference"
                      />
                      <span className="text-gray-700">Music</span>
                    </label>
                    <select
                      name="vehicleType"
                      data-category="ride"
                      value={preferences.ride.vehicleType}
                      onChange={handlePreferenceChange}
                      className="w-full p-3 transition-all duration-200 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-50"
                      aria-label="Vehicle type preference"
                    >
                      <option value="car">Car</option>
                      <option value="motorcycle">Motorcycle</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="p-4 transition-all duration-200 border border-gray-100 rounded-lg shadow-sm bg-gradient-to-br from-gray-50 to-white hover:shadow-md">
                  <h3 className="flex items-center gap-3 pb-3 mb-4 text-lg font-semibold text-gray-700 border-b border-gray-200">
                    <i className="text-blue-500 ri-notification-line"></i> Notification Preferences
                  </h3>
                  <div className="space-y-4">
                    <label className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        name="email"
                        data-category="notifications"
                        checked={preferences.notifications.email}
                        onChange={handlePreferenceChange}
                        className="w-5 h-5 text-blue-600 transition-all duration-200 rounded focus:ring-2 focus:ring-blue-500"
                        aria-label="Email notifications"
                      />
                      <span className="text-gray-700">Email Notifications</span>
                    </label>
                    <label className="flex items-center gap-4">
                      <input
                        type="checkbox"
                        name="sms"
                        data-category="notifications"
                        checked={preferences.notifications.sms}
                        onChange={handlePreferenceChange}
                        className="w-5 h-5 text-blue-600 transition-all duration-200 rounded focus:ring-2 focus:ring-blue-500"
                        aria-label="SMS notifications"
                      />
                      <span className="text-gray-700">SMS Notifications</span>
                    </label>
                  </div>
                </div>

                {/* Privacy Preferences */}
                <div className="p-4 transition-all duration-200 border border-gray-100 rounded-lg shadow-sm bg-gradient-to-br from-gray-50 to-white hover:shadow-md">
                  <h3 className="flex items-center gap-3 pb-3 mb-4 text-lg font-semibold text-gray-700 border-b border-gray-200">
                    <i className="text-blue-500 ri-shield-line"></i> Privacy Preferences
                  </h3>
                  <label className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      name="shareRideHistory"
                      data-category="privacy"
                      checked={preferences.privacy.shareRideHistory}
                      onChange={handlePreferenceChange}
                      className="w-5 h-5 text-blue-600 transition-all duration-200 rounded focus:ring-2 focus:ring-blue-500"
                      aria-label="Share ride history"
                    />
                    <span className="text-gray-700">Share Ride History with Others</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;