import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import { FaTimes, FaHistory, FaEye, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function resolveImageUrl(image) {
  if (!image) return null;
  if (
    image.startsWith('http://') ||
    image.startsWith('https://') ||
    image.startsWith('data:')
  ) {
    return image;
  }
  if (image.startsWith('/')) {
    return `${API_BASE_URL}${image}`;
  }
  return `${API_BASE_URL}/${image}`;
}

export default function InventoryHistorySidebar({ product, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  useEffect(() => {
    if (!product) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/products/${product.id}/history`);
        setHistory(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    const sidebarContent = document.getElementById('sidebar-content');
    if (sidebarContent) sidebarContent.scrollTop = 0;
  }, [product]);

  if (!product) return null;

  const imgSrc = resolveImageUrl(product.image);
  const stockNum = Number(product.stock ?? 0) || 0;
  const LOW_STOCK_THRESHOLD = 5;
  const isLowStock = stockNum > 0 && stockNum <= LOW_STOCK_THRESHOLD;

  const statusClasses =
    stockNum === 0
      ? { text: 'Out of Stock', bg: 'bg-red-100 text-red-700 border-red-200' }
      : isLowStock
      ? { text: 'Low Stock', bg: 'bg-orange-100 text-orange-700 border-orange-200' }
      : { text: 'In Stock', bg: 'bg-green-100 text-green-700 border-green-200' };

  const formatTimestamp = (ts) =>
    ts ? new Date(ts).toLocaleString() : '—';

  return (
    <aside
      className="fixed right-0 top-0 mt-16 h-[calc(100vh-4rem)] w-full max-w-md bg-slate-50 border-l border-slate-200 shadow-2xl flex flex-col z-40 transform translate-x-0 transition-transform duration-300"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white shadow-sm flex-shrink-0">
        <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
          <FaEye className="w-4 h-4 text-indigo-500" />
          Product Details
        </h3>
        <button
          className="cursor-pointer p-1 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition duration-150"
          onClick={onClose}
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>

      <div id="sidebar-content" className="p-4 space-y-5 overflow-y-auto flex-1">
        {imgSrc && (
          <div className="w-full">
            <img
              src={imgSrc}
              alt={product.name}
              className="w-full h-40 object-cover rounded-lg shadow-md border border-slate-200"
            />
          </div>
        )}

        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 mb-0.5">Name</p>
          <p className="text-lg font-extrabold text-slate-900">{product.name}</p>
          <div className="mt-2">
            <p className="text-xs text-slate-500 mb-0.5">Current Status</p>
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${statusClasses.bg}`}
            >
              {statusClasses.text} ({stockNum} {product.unit}s)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-lg shadow-sm border border-slate-100">
          <DetailItem label="Category" value={product.category} />
          <DetailItem label="Brand" value={product.brand} />
          <DetailItem label="Unit Type" value={product.unit} />
          <DetailItem
            label="Current Stock"
            value={stockNum}
            className="font-semibold text-base"
          />
        </div>

        <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Description / Notes</p>
          <p className="text-sm text-slate-700 whitespace-pre-line">
            {product.description || (
              <span className="text-slate-400 italic">— No description —</span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-1 text-[11px] text-slate-500 border-t pt-3">
          <DetailItem
            label="Created At"
            value={formatTimestamp(product.created_at)}
          />
          <DetailItem
            label="Last Updated"
            value={formatTimestamp(product.updated_at)}
          />
        </div>

        <div className="mt-4 pt-3 border-t">
          <button
            className="w-full text-sm px-3 py-2 rounded-lg bg-slate-100 border border-slate-300 text-slate-700 font-semibold hover:bg-slate-200 transition duration-150 flex items-center justify-center gap-2"
            onClick={() => setShowHistory((prev) => !prev)}
          >
            <FaHistory className="w-3.5 h-3.5" />
            <span>{showHistory ? 'Hide History' : 'Show Inventory History'}</span>
            {showHistory ? (
              <FaChevronUp className="w-3 h-3 ml-2" />
            ) : (
              <FaChevronDown className="w-3 h-3 ml-2" />
            )}
          </button>

          {showHistory && (
            <div className="mt-3 p-3 bg-white rounded-lg shadow-inner border border-slate-200">
              <p className="text-xs font-semibold mb-2 text-slate-600">
                Inventory Log
              </p>

              {loading && (
                <p className="text-xs text-slate-500 animate-pulse">
                  Loading history...
                </p>
              )}

              {!loading && history.length === 0 && (
                <p className="text-xs text-slate-400 italic">
                  No inventory changes recorded.
                </p>
              )}

              {!loading && history.length > 0 && (
                <ul className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {history.map((h, index) => {
                    const change = h.new_stock - h.old_stock;
                    const actionType =
                      change > 0 ? 'Added' : change < 0 ? 'Removed' : 'Updated';
                    const changeClass =
                      change > 0
                        ? 'text-green-600'
                        : change < 0
                        ? 'text-red-600'
                        : 'text-slate-600';
                    const changeIcon = change > 0 ? '↑' : change < 0 ? '↓' : '=';

                    return (
                      <li
                        key={h.id || index}
                        className="p-2 border border-slate-100 rounded-md bg-white hover:bg-slate-50 transition duration-100 flex justify-between items-center"
                      >
                        <div className="flex flex-col">
                          <p className="text-xs font-medium text-slate-800">
                            Stock: {h.old_stock} → {h.new_stock}
                            <span
                              className={`ml-2 text-sm font-bold ${changeClass}`}
                            >
                              ({changeIcon} {Math.abs(change)})
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {formatTimestamp(h.timestamp)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-700 font-medium">
                            {h.changed_by || 'System'}
                          </p>
                          <span
                            className={`text-[10px] font-semibold px-1.5 rounded ${
                              change > 0
                                ? 'bg-green-200 text-green-800'
                                : change < 0
                                ? 'bg-red-200 text-red-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {actionType}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

const DetailItem = ({ label, value, className = '' }) => (
  <div className="flex flex-col">
    <p className="text-xs text-slate-500">{label}</p>
    <p className={`text-sm text-slate-800 ${className}`}>
      {value || <span className="text-slate-400 italic">—</span>}
    </p>
  </div>
);
