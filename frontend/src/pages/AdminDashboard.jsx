import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import Header from '../components/Header';
// Updated icon imports for better visuals
import { 
  FaTrashAlt, 
  FaSpinner, 
  FaTimesCircle, 
  FaCheckCircle, 
  FaUsers, // New icon for Total Users
  FaShieldAlt, // New icon for Admins
  FaBox, // New icon for Total Products
  FaArrowLeft, // For pagination
  FaArrowRight // For pagination
} from 'react-icons/fa';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productSummary, setProductSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  
  // State for content visibility to enable fade-in animation
  const [contentVisible, setContentVisible] = useState(false);

  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3; // Using 3 as per your request, usually 10-20 is standard
  // ------------------------
  
  // --- Custom Modal/Error State ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  // --------------------------------

  // Utility function to handle errors
  const handleError = (err, defaultMsg) => {
    console.error(defaultMsg, err);
    setError(err?.response?.data?.message || defaultMsg);
    setTimeout(() => setError(null), 5000);
  };
  
  // Utility function to handle success messages
  const handleSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };


  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data || []);
      // Reset to first page after fresh data fetch
      setCurrentPage(1); 
    } catch (err) {
      handleError(err, 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductSummary = async () => {
    try {
      const res = await api.get('/api/products/summary');
      setProductSummary(res.data || null);
    } catch (err) {
      console.error('Error fetching product summary:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchProductSummary();
    // Start fade-in animation after initial data fetch attempts
    const timer = setTimeout(() => setContentVisible(true), 100); 
    return () => clearTimeout(timer);
  }, []);

  // NEW: Reset page to 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);
  

  // 🚫 Remove admin accounts from the main list
  const nonAdminUsers = users.filter((u) => u.role !== 'admin');

  const totalUsers = nonAdminUsers.length;
  const totalAdmins = users.filter((u) => u.role === 'admin').length;
  const totalProducts = productSummary?.totalProducts || 0;

  // 🔍 Client-side filtering by name or email
  const normalizedSearch = search.trim().toLowerCase();
  const filteredUsers = nonAdminUsers.filter((u) => {
    
    if (!normalizedSearch) return true;
    const name = (u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return (
      name.includes(normalizedSearch) || email.includes(normalizedSearch)
    );
  });

  // --- PAGINATION LOGIC ---
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const clampPage = (page) => Math.min(Math.max(page, 1), totalPages);

  // Effect to re-clamp current page if filtered list size changes (e.g. searching)
  useEffect(() => {
    setCurrentPage((prev) => clampPage(prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredUsers.length, itemsPerPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const usersToShow = filteredUsers.slice(startIndex, endIndex);

  const goToNextPage = () => {
    setCurrentPage((prev) => clampPage(prev + 1));
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => clampPage(prev - 1));
  };

  const goToPage = (page) => {
    setCurrentPage(clampPage(page));
  };
  // ------------------------


  // --- Deletion Handlers ---

  // 1. Show the custom modal
  const confirmDeletion = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  // 2. Execute deletion
  const executeDelete = async () => {
    if (!userToDelete) return;
    
    const userToDel = userToDelete; // Capture user object
    setShowDeleteModal(false); // Close modal before API call

    try {
      setDeletingId(userToDel.id);
      setError(null);
      await api.delete(`/api/admin/users/${userToDel.id}`);
      
      // Remove from local state and show success message
      setUsers((prev) => prev.filter((u) => u.id !== userToDel.id));
      handleSuccess(`User "${userToDel.email}" deleted successfully.`);

    } catch (err) {
      handleError(err, 'Failed to delete user.');
    } finally {
      setDeletingId(null);
      setUserToDelete(null);
    }
  };

  // 3. Close modal and reset state
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  // ---------------------------

  // Reduced padding from p-4 to p-3
  const cardStyle = "flex flex-col p-3 bg-white rounded-xl shadow-lg border-l-4 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]";

  // Function to render Summary Card
  const SummaryCard = ({ title, value, colorClass, Icon }) => (
    <div className={`${cardStyle} ${colorClass.border}`}>
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          {/* Reduced font size slightly for consistency */}
          <p className="text-2xl font-extrabold text-slate-800 mt-1">{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${colorClass.icon} opacity-70`} />
      </div>
    </div>
  );
  
  // Create array of page numbers [1,2,3,...]
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);


  return (
    <div className="min-h-screen bg-slate-100 mt-7"> {/* Lighter, slightly textured background */}
      <Header />

      <main 
        // Applying the fade-in animation
        className={`max-w-7xl mx-auto px-4 py-10 transition-opacity duration-700 ease-out ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      > 
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-5 mb-8 border-b pb-4 border-slate-200">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Centralized management of users and inventory statistics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* 🔍 Search bar - enhanced style */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="px-4 py-2 text-sm rounded-xl border border-slate-300 bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 w-48"
            />
            <button
              onClick={fetchUsers}
              // Added explicit hover effect (already present, ensured definition is clear)
              className="cursor-pointer flex items-center justify-center space-x-2 px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white shadow-md hover:bg-indigo-700 active:scale-[0.98] transition duration-200"
            >
              {/* <FaCheckCircle className="w-4 h-4" /> */}
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {(error || successMessage) && (
            <div className="mb-6">
                {error && (
                    <div className="p-4 bg-rose-100 border border-rose-400 text-rose-800 rounded-xl flex items-center space-x-3 shadow-md">
                        <FaTimesCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}
                {successMessage && (
                    <div className="p-4 bg-emerald-100 border border-emerald-400 text-emerald-800 rounded-xl flex items-center space-x-3 shadow-md">
                        <FaCheckCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{successMessage}</p>
                    </div>
                )}
            </div>
        )}

        {/* Summary Cards - Reduced vertical spacing (mb-8 -> mb-4) and reduced gap (gap-6 -> gap-4) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <SummaryCard 
            title="Total Users" 
            value={totalUsers} 
            Icon={FaUsers}
            colorClass={{ border: 'border-indigo-500', icon: 'text-indigo-500' }}
          />

          {/* <SummaryCard 
            title="Admins" 
            value={totalAdmins} 
            Icon={FaShieldAlt}
            colorClass={{ border: 'border-purple-500', icon: 'text-purple-500' }}
          /> */}

          <SummaryCard 
            title="Total Products" 
            value={totalProducts} 
            Icon={FaBox}
            colorClass={{ border: 'border-emerald-500', icon: 'text-emerald-500' }}
          />
        </div>

        {loading && (
          <p className="text-md text-indigo-500 mb-4 flex items-center space-x-2 font-semibold">
            <FaSpinner className="animate-spin w-5 h-5" />
            <span>Fetching updated user list...</span>
          </p>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200"> 
          
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <p className="text-sm text-slate-600 font-medium">
              Showing{' '}
              <span className="font-bold text-slate-800">
                {filteredUsers.length === 0 ? 0 : startIndex + 1} -{' '}
                {filteredUsers.length === 0 ? 0 : Math.min(endIndex, filteredUsers.length)}
              </span>{' '}
              of{' '}
              <span className="font-bold text-slate-800">
                {filteredUsers.length}
              </span>{' '}
              active users
            </p>
            {search && (
              <p className="text-xs text-slate-400">
                Filtered by: <span className="italic font-medium">"{search}"</span>
              </p>
            )}
          </div>

          {/* Table Container: Increased max-h to 40rem for a bigger table view */}
          <div className="overflow-x-auto max-h-[40rem] overflow-y-auto relative">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 sticky top-0 shadow-md z-10"> {/* sticky top-0 keeps the header fixed during scroll */}
                <tr className="text-xs text-slate-600 uppercase tracking-wider">
                  {/* Name column: Added w-1/4 for more space */}
                  <th className="px-6 py-3 text-left font-bold w-1/4">Name</th>
                  <th className="px-6 py-3 text-left font-bold">Email</th>
                  {/* Total Products column: Changed text-right to text-center */}
                  <th className="px-6 py-3 text-center font-bold">
                    Total Products
                  </th>
                  <th className="px-6 py-3 text-left font-bold">Joined</th>
                  <th className="px-6 py-3 text-right font-bold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {/* Changed filteredUsers.map to usersToShow.map for pagination */}
                {usersToShow.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-indigo-50/20 transition-colors duration-150 group"
                  >
                    {/* Name cell: Added w-1/4 for more space */}
                    <td className="px-6 py-4 w-1/4 font-medium text-slate-800">{u.name || '—'}</td>

                    <td className="px-6 py-4 text-slate-600 group-hover:text-slate-800 transition">{u.email}</td>

                    {/* Total Products cell: Centered text */}
                    <td className="px-6 py-4 text-center font-semibold text-slate-800">
                      {u.productCount || 0}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString()
                        : '—'}
                    </td>

                    {/* 🗑 Delete button - Added stronger shadow on hover */}
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => confirmDeletion(u)}
                        disabled={deletingId === u.id || showDeleteModal}
                        className="cursor-pointer text-xs px-3 py-1.5 rounded-full bg-rose-500 text-white font-semibold shadow-md hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-400/50 active:scale-95 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1 ml-auto"
                      >
                        {deletingId === u.id ? (
                          <>
                            <FaSpinner className="animate-spin w-3 h-3" />
                            <span>Deleting...</span>
                          </>
                        ) : (
                          <>
                            <FaTrashAlt className="w-3 h-3" />
                            <span>Delete</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}

                {usersToShow.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-md text-slate-500"
                    >
                      {search
                        ? 'No users match your current search criteria.'
                        : 'No users found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* --- PAGINATION CONTROLS --- */}
          {filteredUsers.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-white rounded-b-2xl"> {/* Added rounded-b-2xl for styling */}
              <button
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className="cursor-pointer flex items-center space-x-2 text-sm font-medium text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed hover:text-indigo-800 transition duration-150"
              >
                <FaArrowLeft className="w-3 h-3" />
                <span>Previous</span>
              </button>
              
              <div className="flex items-center gap-2">
                 {/* Display current page and total pages */}
                <span className="cursor-pointer text-sm text-slate-600 font-medium mr-2">
                  Page {currentPage} of {totalPages}
                </span>

                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`cursor-pointer w-8 h-8 text-xs rounded-full flex items-center justify-center border ${
                      page === currentPage
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    } transition duration-150`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="cursor-pointer flex items-center space-x-2 text-sm font-medium text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed hover:text-indigo-800 transition duration-150"
              >
                <span>Next</span>
                <FaArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}
          {/* ----------------------------- */}

        </div>

        {/* -------------------- Custom Delete Confirmation Modal -------------------- */}
        {showDeleteModal && userToDelete && (
          <div 
            // Modal remains without background overlay as requested
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in" 
            aria-modal="true" 
            role="dialog"
          >
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm transform transition-all scale-100 animate-slide-up-in">
              <div className="flex items-center space-x-3 mb-5 border-b pb-3 border-rose-100">
                <FaTrashAlt className="text-2xl text-rose-600" />
                <h3 className="text-xl font-bold text-slate-900">Confirm Deletion</h3>
              </div>
              
              <p className="text-sm text-slate-600 mb-8">
                You are about to delete user: <span className="font-semibold text-rose-600">{userToDelete.email}</span>.
                This action is permanent and cannot be recovered.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  className="cursor-pointer px-5 py-2 text-sm font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition duration-150"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="cursor-pointer px-5 py-2 text-sm font-semibold rounded-lg bg-rose-600 text-white shadow-lg shadow-rose-500/50 hover:bg-rose-700 transition duration-150"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
        {/* -------------------------------------------------------------------------- */}
      </main>
    </div>
  );
}