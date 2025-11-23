import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
// Assuming you have 'react-icons' installed: npm install react-icons
import { FaBoxOpen, FaUserCircle, FaSignOutAlt } from 'react-icons/fa'; // Added FaSignOutAlt for the button

export default function Header() {
  const { user, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false); // State to control the dropdown visibility

  const toggleLogout = () => {
    setShowLogout(!showLogout);
  };

  // --- FIX: Ensure the dropdown closes after logout and apply new styling ---
  const handleLogout = () => {
    logout();
    setShowLogout(false); // Close dropdown immediately after action
  };
  // --------------------------------------------------------------------------

  return (
    <header className="bg-white shadow fixed top-0 left-0 right-0 z-50">
      {/* 1. Full Width Container */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between relative"> 
        {/* App Icon and Name - Left End */}
        <div className="flex items-center space-x-2">
          <FaBoxOpen className="text-2xl text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Inventory Management</h1>
        </div>

        {/* Profile Icon and Dropdown Container - Right End */}
        <div className="relative">
          {/* Profile Icon Button */}
          <button
            onClick={toggleLogout}
            className="flex items-center gap-2 focus:outline-none"
            aria-expanded={showLogout}
            aria-controls="profile-menu"
          >
            {/* Display user's email */}
            <span className="text-sm font-medium text-slate-600 hidden sm:inline truncate max-w-xs">{user?.email}</span>
            {/* Profile Icon */}
            <FaUserCircle className="text-3xl text-indigo-500 hover:text-indigo-600 cursor-pointer transition duration-150" />
          </button>

          {/* Logout Dropdown */}
          {showLogout && (
            <div 
              id="profile-menu"
              className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-100 z-10 animate-fade-in-down"
            >
              <div className="p-2">
                {/* 2. Enhanced Logout Button Styling with Gradient and Stronger Shadow */}
                <button
                  onClick={handleLogout} // Using the new handler
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-lg 
                             bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-700/50 
                             hover:from-red-700 hover:to-red-800 hover:shadow-xl hover:shadow-red-800/70 
                             active:scale-[0.98] transition duration-200"
                >
                  <span>Logout</span>
                  <FaSignOutAlt className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}