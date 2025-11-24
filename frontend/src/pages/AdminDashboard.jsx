// frontend/src/pages/AdminDashboard.jsx
import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import Header from '../components/Header';
import Pagination from '../components/Pagination';
import { FaTrashAlt, FaSpinner, FaUsers, FaBox } from 'react-icons/fa';

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
      const maxPage = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
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

  // Card style similar to Products summary cards
  const cardStyle =
    'bg-white rounded-xl shadow-lg border-l-4 p-4 space-y-1 transition-all duration-300 transform cursor-default hover:shadow-xl hover:scale-[1.03]';

  const SummaryCard = ({ title, value, colorClass, Icon }) => (
    <div className={`${cardStyle} ${colorClass.border}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500">{title}</p>
          <p className="text-2xl font-extrabold mt-1 text-slate-800">
            {value}
          </p>
        </div>
        <div className="p-2 rounded-full bg-slate-50">
          <Icon className={`text-xl ${colorClass.icon}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Header />
      <ToastContainer />
{/* {`
          max-w-6xl mx-auto px-4 py-6 mt-13
          flex flex-col gap-4
          transition-opacity duration-700 ease-out
          ${contentVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        `} */}
      <main
       className="max-w-6xl mx-auto px-4 py-6 mt-13"
          
      >
        {/* Top header - similar layout feel to ProductsPage */}
        <section className="flex flex-col gap-4">
          {/* Page Header & Search / Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 border-slate-200">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                Admin Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Manage users and view overall inventory statistics.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 w-48"
              />
              <button
                onClick={fetchUsers}
                className="cursor-pointer flex items-center justify-center space-x-2 px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 text-white shadow-md hover:bg-indigo-700 active:scale-[0.98] transition duration-200"
              >
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Summary Cards - match grid behavior from ProductsPage */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SummaryCard
              title="Total Users"
              value={totalUsers}
              Icon={FaUsers}
              colorClass={{ border: 'border-indigo-500', icon: 'text-indigo-500' }}
            />
            <SummaryCard
              title="Total Products"
              value={totalProducts}
              Icon={FaBox}
              colorClass={{ border: 'border-emerald-500', icon: 'text-emerald-500' }}
            />
          </div>

          {loading && (
            <p className="text-sm text-indigo-500 mb-2 flex items-center gap-2 font-semibold">
              <FaSpinner className="animate-spin w-4 h-4" />
              <span>Fetching updated user list...</span>
            </p>
          )}

          {/* ✅ Users Table - wrapper now matches ProductTable behavior */}
          <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-slate-100">
            {/* Header inside card */}
            <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50">
              <p className="text-xs md:text-sm text-slate-600 font-medium">
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
                  Filtered by{' '}
                  <span className="italic font-medium">"{search}"</span>
                </p>
              )}
            </div>

            {/* Inner scroll only vertical (same as ProductTable) */}
            <div className="max-h-[40rem] overflow-y-auto relative">
              <table className="min-w-full text-xs md:text-sm">
                <thead className="bg-slate-100 sticky top-0 shadow-md z-10">
                  <tr className="text-[11px] md:text-xs text-slate-600 uppercase tracking-wider">
                    <th className="px-4 md:px-6 py-3 text-left font-bold w-1/4">
                      Name
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left font-bold">
                      Email
                    </th>
                    <th className="px-4 md:px-6 py-3 text-center font-bold">
                      Total Products
                    </th>
                    <th className="px-4 md:px-6 py-3 text-left font-bold">
                      Joined
                    </th>
                    <th className="px-4 md:px-6 py-3 text-right font-bold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {usersToShow.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-indigo-50/20 transition-colors duration-150 group"
                    >
                      <td className="px-4 md:px-6 py-3 md:py-4 w-1/4 font-medium text-slate-800">
                        {u.name || '—'}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-slate-600 group-hover:text-slate-800 transition">
                        {u.email}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-center font-semibold text-slate-800">
                        {u.productCount || 0}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-[11px] md:text-xs text-slate-500">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                        <button
                          type="button"
                          onClick={() => confirmDeletion(u)}
                          disabled={deletingId === u.id || showDeleteModal}
                          className="cursor-pointer text-[11px] md:text-xs px-3 py-1.5 rounded-full bg-rose-500 text-white font-semibold shadow-md hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-400/50 active:scale-95 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 ml-auto"
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
                        className="px-4 md:px-6 py-8 md:py-10 text-center text-sm md:text-md text-slate-500"
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

          {/* Pagination (same style as Products) */}
          {filteredUsers.length > 0 && (
            <div className="mt-2">
              <Pagination
                page={page}
                totalPages={totalPages}
                onChange={handlePageChange}
              />
            </div>
          )}
        </section>

        {/* Delete Modal */}
        {showDeleteModal && userToDelete && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30"
            aria-modal="true"
            role="dialog"
          >
            <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 w-full max-w-sm transform transition-all">
              <div className="flex items-center gap-3 mb-4 border-b pb-3 border-rose-100">
                <FaTrashAlt className="text-xl md:text-2xl text-rose-600" />
                <h3 className="text-lg md:text-xl font-bold text-slate-900">
                  Confirm Deletion
                </h3>
              </div>

              <p className="text-sm text-slate-600 mb-6">
                You are about to delete user:{' '}
                <span className="font-semibold text-rose-600">
                  {userToDelete.email}
                </span>
                . This action is permanent and cannot be undone.
              </p>

              <div className="flex justify-end gap-3">
                <button
                  onClick={cancelDelete}
                  className="cursor-pointer px-4 py-2 text-sm font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition duration-150"
                >
                  Cancel
                </button>
                <button
                  onClick={executeDelete}
                  className="cursor-pointer px-4 py-2 text-sm font-semibold rounded-lg bg-rose-600 text-white shadow-lg shadow-rose-500/50 hover:bg-rose-700 transition duration-150"
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
