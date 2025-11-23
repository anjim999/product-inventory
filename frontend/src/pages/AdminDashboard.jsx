import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import Header from '../components/Header';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching admin users:', err);
      alert(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <button
            onClick={fetchUsers}
            className="text-xs px-3 py-2 rounded border border-slate-300 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <p className="text-sm text-slate-500 mb-2">Loading users...</p>
        )}

        <div className="bg-white rounded-xl shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Role</th>
                <th className="px-3 py-2 text-right">Total Products</th>
                <th className="px-3 py-2 text-left">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-3 py-2">{u.name || '—'}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {u.role || 'user'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {u.productCount || 0}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-500">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-4 text-center text-sm text-slate-500"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
