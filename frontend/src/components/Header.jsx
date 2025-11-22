import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Inventory Management</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">{user?.email}</span>
          <button
            onClick={logout}
            className="text-sm bg-slate-800 text-white px-3 py-1 rounded hover:bg-slate-900"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
