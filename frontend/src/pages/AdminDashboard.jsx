import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import Header from '../components/Header';
import Pagination from '../components/Pagination';
import {
  FaTrashAlt,
  FaSpinner,
  FaUsers,
  FaBox,
} from 'react-icons/fa';

// Toastify
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productSummary, setProductSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const [contentVisible, setContentVisible] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 3;

  // Modal / messages
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const handleError = (err, defaultMsg) => {
    console.error(defaultMsg, err);
    const backendMsg = err?.response?.data?.message || defaultMsg;
    toast.error(backendMsg);
  };

  const handleSuccess = (msg) => {
    toast.success(msg);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data || []);
      setPage(1);
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
      // Optional: toast here if you want
      // toast.error('Failed to load product summary.');
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchProductSummary();
    const timer = setTimeout(() => setContentVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search]);

  // Remove admin accounts from list
  const nonAdminUsers = users.filter((u) => u.role !== 'admin');

  const totalUsers = nonAdminUsers.length;
  // const totalAdmins = users.filter((u) => u.role === 'admin').length;
  const totalProducts = productSummary?.totalProducts || 0;

  // Search filter
  const normalizedSearch = search.trim().toLowerCase();
  const filteredUsers = nonAdminUsers.filter((u) => {
    if (!normalizedSearch) return true;
    const name = (u.name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return name.includes(normalizedSearch) || email.includes(normalizedSearch);
  });

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));

  useEffect(() => {
    setPage((prev) => {
      const maxPage = Math.max(
        1,
        Math.ceil(filteredUsers.length / itemsPerPage),
      );
      if (prev > maxPage) return maxPage;
      if (prev < 1) return 1;
      return prev;
    });
  }, [filteredUsers.length, itemsPerPage]);

  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const usersToShow = filteredUsers.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Delete handlers
  const confirmDeletion = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!userToDelete) return;

    const userToDel = userToDelete;
    setShowDeleteModal(false);

    try {
      setDeletingId(userToDel.id);
      await api.delete(`/api/admin/users/${userToDel.id}`);

      setUsers((prev) => prev.filter((u) => u.id !== userToDel.id));
      handleSuccess(`User "${userToDel.email}" deleted successfully.`);
    } catch (err) {
      handleError(err, 'Failed to delete user.');
    } finally {
      setDeletingId(null);
      setUserToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const cardStyle =
    'flex flex-col p-3 bg-white rounded-xl shadow-lg border-l-4 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]';

  const SummaryCard = ({ title, value, colorClass, Icon }) => (
    <div className={`${cardStyle} ${colorClass.border}`}>
      <div className="flex justify-between items-start">
        <div className="flex flex-col">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-extrabold text-slate-800 mt-1">
            {value}
          </p>
        </div>
        <Icon className={`w-8 h-8 ${colorClass.icon} opacity-70`} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 mt-7">
      <Header />
      <ToastContainer />

      <main
        className={`max-w-7xl mx-auto px-4 py-10 transition-opacity duration-700 ease-out ${
          contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
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
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="px-4 py-2 text-sm rounded-xl border border-slate-300 bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 w-48"
            />
            <button
              onClick={fetchUsers}
              className="cursor-pointer flex items-center justify-center space-x-2 px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white shadow-md hover:bg-indigo-700 active:scale-[0.98] transition duration-200"
            >
              <span>Refresh Data</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
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
            colorClass={{
              border: 'border-emerald-500',
              icon: 'text-emerald-500',
            }}
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
                {filteredUsers.length === 0
                  ? 0
                  : Math.min(endIndex, filteredUsers.length)}
              </span>{' '}
              of{' '}
              <span className="font-bold text-slate-800">
                {filteredUsers.length}
              </span>{' '}
              active users
            </p>
            {search && (
              <p className="text-xs text-slate-400">
                Filtered by:{' '}
                <span className="italic font-medium">"{search}"</span>
              </p>
            )}
          </div>

          {/* Table Container with hidden scrollbar */}
          <div className="overflow-x-auto max-h-[40rem] overflow-y-auto relative no-scrollbar">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 sticky top-0 shadow-md z-10">
                <tr className="text-xs text-slate-600 uppercase tracking-wider">
                  <th className="px-6 py-3 text-left font-bold w-1/4">Name</th>
                  <th className="px-6 py-3 text-left font-bold">Email</th>
                  <th className="px-6 py-3 text-center font-bold">
                    Total Products
                  </th>
                  <th className="px-6 py-3 text-left font-bold">Joined</th>
                  <th className="px-6 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {usersToShow.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-indigo-50/20 transition-colors duration-150 group"
                  >
                    <td className="px-6 py-4 w-1/4 font-medium text-slate-800">
                      {u.name || '—'}
                    </td>

                    <td className="px-6 py-4 text-slate-600 group-hover:text-slate-800 transition">
                      {u.email}
                    </td>

                    <td className="px-6 py-4 text-center font-semibold text-slate-800">
                      {u.productCount || 0}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString()
                        : '—'}
                    </td>

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
        </div>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="mt-4">
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={handlePageChange}
            />
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && userToDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
            aria-modal="true"
            role="dialog"
          >
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm transform transition-all scale-100 animate-slide-up-in">
              <div className="flex items-center space-x-3 mb-5 border-b pb-3 border-rose-100">
                <FaTrashAlt className="text-2xl text-rose-600" />
                <h3 className="text-xl font-bold text-slate-900">
                  Confirm Deletion
                </h3>
              </div>

              <p className="text-sm text-slate-600 mb-8">
                You are about to delete user:{' '}
                <span className="font-semibold text-rose-600">
                  {userToDelete.email}
                </span>
                . This action is permanent and cannot be recovered.
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
      </main>
    </div>
  );
}
