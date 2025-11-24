import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaBoxOpen, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';

export default function Header() {
  const { user, logout } = useAuth();
  const [showLogout, setShowLogout] = useState(false);

  const dropdownRef = useRef(null);
  
  const timeoutRef = useRef(null); 

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShowLogout(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowLogout(false);
    }, 200); 
  };

  const handleLogout = () => {
    logout();
    setShowLogout(false);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowLogout(false);
      }
    }
    
    // Clear timeout on component unmount
    return () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white shadow fixed top-0 left-0 right-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between relative">

        <div className="flex items-center space-x-2">
          <FaBoxOpen className="text-2xl text-indigo-600" />
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Inventory Management
          </h1>
        </div>

        <div 
          className="relative" 
          ref={dropdownRef}
          onMouseEnter={handleMouseEnter} 
          onMouseLeave={handleMouseLeave} 
        >
          <button
            onClick={() => setShowLogout(prev => !prev)} 
            className="flex items-center gap-2 focus:outline-none"
            aria-expanded={showLogout}
            aria-controls="profile-menu"
          >
            <span className="text-sm font-medium text-slate-600 hidden sm:inline truncate max-w-xs">
              {user?.email}
            </span>
            <FaUserCircle className="text-3xl text-indigo-500 hover:text-indigo-600 cursor-pointer transition duration-150" />
          </button>

          {showLogout && (
            <div
              id="profile-menu"
              className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-100 z-10 animate-fade-in-down"
            >
              <div className="p-2">
                <button
                  onClick={handleLogout}
                  className="
                    cursor-pointer w-full flex items-center justify-between
                    px-6 py-3.5 rounded-2xl
                    font-extrabold text-base tracking-wider
                    bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600
                    text-white
                    shadow-xl shadow-violet-500/50
                    hover:from-indigo-700 hover:via-violet-700 hover:to-fuchsia-700
                    hover:shadow-2xl hover:shadow-violet-600/70
                    hover:-translate-y-1
                    active:translate-y-0 active:scale-[0.97]
                    transition-all duration-300 ease-in-out
                  "
                >
                  <span className="text-base">Logout</span>
                  <FaSignOutAlt className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}