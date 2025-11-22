import { useEffect, useState } from 'react';
import api from '../api/axiosClient';

export default function InventoryHistorySidebar({ product, onClose }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!product) return;
    const fetchLogs = async () => {
      try {
        const res = await api.get(`/api/products/${product.id}/history`);
        setLogs(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLogs();
  }, [product]);

  return (
    <div
      className={`fixed top-16 right-0 bottom-0 w-80 bg-white shadow-xl border-l transform transition-transform ${
        product ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b flex justify-between items-center">
          <h3 className="font-semibold text-sm">Inventory History</h3>
          <button className="text-xs text-slate-600" onClick={onClose}>
            Close
          </button>
        </div>
        {product && (
          <div className="px-4 py-2 border-b">
            <p className="text-sm font-medium">{product.name}</p>
            <p className="text-xs text-slate-500">
              Current stock: {product.stock}
            </p>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 text-xs">
          {logs.map((log) => (
            <div key={log.id} className="border rounded p-2">
              <p>
                <span className="font-semibold">Old:</span> {log.old_stock}{' '}
                <span className="font-semibold">New:</span> {log.new_stock}
              </p>
              <p>
                <span className="font-semibold">By:</span> {log.changed_by}
              </p>
              <p className="text-slate-500">
                {new Date(log.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-slate-500 mt-2">No history yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
