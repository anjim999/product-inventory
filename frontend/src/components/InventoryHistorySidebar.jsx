import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import { FaTimes, FaHistory, FaEye, FaChevronDown, FaChevronUp, FaImage } from 'react-icons/fa';

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

const DetailItem = ({ label, value, className = '' }) => (
  <div className="flex flex-col">
    <p className="text-xs font-medium text-slate-500">{label}</p>
    <p className={`text-sm text-slate-800 font-semibold mt-0.5 ${className}`}>
      {value || <span className="text-slate-400 italic">—</span>}
    </p>
  </div>
);

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
      ? { text: 'Out of Stock', bg: 'bg-red-100 text-red-700 ring-red-300' }
      : isLowStock
      ? { text: 'Low Stock', bg: 'bg-orange-100 text-orange-700 ring-orange-300' }
      : { text: 'In Stock', bg: 'bg-green-100 text-green-700 ring-green-300' };

  const formatTimestamp = (ts) =>
    ts ? new Date(ts).toLocaleString() : '—';

  const truncatedId = product.id 
    ? String(product.id).slice(0, 8) + '...'
    : 'N/A';
    
  const renderHistoryItem = (h, index, historyLength) => {
    const change = h.new_stock - h.old_stock;
    const actionType = change > 0 ? 'Stock In' : change < 0 ? 'Stock Out' : 'Update';
    const changeClass =
      change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-slate-600';
    const changeSymbol = change > 0 ? '+' : change < 0 ? '−' : '±'; 

    return (
      <li
        key={h.id || index}
        className="relative pt-0 pb-4 last:pb-0" 
      >
        <div className="absolute top-0 left-0 flex h-full w-6 items-center justify-center">
            
            {index < historyLength - 1 && (
                <div className="w-px h-full bg-slate-300"></div>
            )}
            <div className={`absolute h-2.5 w-2.5 rounded-full ${change > 0 ? 'bg-green-500' : change < 0 ? 'bg-red-500' : 'bg-indigo-500'} ring-4 ring-slate-50`}></div>
        </div>

        <div className="ml-8 flex justify-between items-start space-x-3">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <span
                className={`text-lg font-extrabold ${changeClass}`}
                >
                {changeSymbol}{Math.abs(change)}
                </span>
                <span className="text-sm text-slate-600 font-medium">{product.unit}{Math.abs(change) !== 1 ? 's' : ''}</span>
            </div>
            
            <p className="text-xs text-slate-500 mt-0.5">
              Stock: {h.old_stock} → <span className="font-bold text-slate-700">{h.new_stock}</span>
            </p>
          </div>

          <div className="text-right flex flex-col items-end flex-shrink-0">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                change > 0
                  ? 'bg-green-200 text-green-800'
                  : change < 0
                  ? 'bg-red-200 text-red-800'
                  : 'bg-slate-300 text-slate-700'
              }`}
            >
              {actionType.replace(/\s/g, '-')}
            </span>
            <p className="text-xs text-slate-700 font-medium mt-1" title="Changed By">
              {h.changed_by || 'System'}
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              {formatTimestamp(h.timestamp)}
            </p>
          </div>
        </div>
      </li>
    );
  };

  return (
    <aside
      className="fixed right-0 top-0 mt-16 h-[calc(100vh-4rem)] w-full max-w-sm sm:max-w-md lg:max-w-lg bg-white border-l border-slate-200 shadow-2xl flex flex-col z-40 transform translate-x-0 transition-transform duration-300 rounded-xl"
      style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)' }} 
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white flex-shrink-0 rounded-t-xl">
        <h3 className="font-semibold text-lg text-slate-800 flex items-center gap-3">
          <FaEye className="w-5 h-5 text-indigo-600" />
          Product Details & History
        </h3>
        <button
          className="cursor-pointer p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onClick={onClose}
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>

      <div id="sidebar-content" className="p-5 space-y-6 overflow-y-auto flex-1 bg-slate-50">
        
        <div className="w-full bg-slate-200 rounded-xl shadow-lg border border-slate-300 overflow-hidden aspect-video flex items-center justify-center">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.02]"
            />
          ) : (
            <div className="text-slate-400 p-8 flex flex-col items-center">
                <FaImage className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">No Image Available</span>
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl shadow-lg border border-slate-100">
          <p className="text-sm text-slate-500 mb-1">Product Name</p>
          <p className="text-2xl font-extrabold text-slate-900 leading-tight">
            {product.name}
          </p>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Current Stock: <span className="text-lg font-bold text-slate-800 ml-1">{stockNum} {product.unit}{stockNum !== 1 ? 's' : ''}</span></p>
            
            <span
              className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ring-1 ${statusClasses.bg}`}
            >
              {statusClasses.text}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-xl shadow-md border border-slate-100">
          <DetailItem label="Category" value={product.category} />
          <DetailItem label="Brand" value={product.brand} />
          <DetailItem label="Unit Type" value={product.unit} />
          <DetailItem
            label="Product ID"
            value={truncatedId}
            className="font-mono text-xs"
          />
        </div>

        <div className="bg-white p-5 rounded-xl shadow-md border border-slate-100">
          <p className="text-sm font-bold text-slate-700 mb-2">Description / Notes</p>
          <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
            {product.description || (
              <span className="text-slate-400 italic">— No detailed description provided —</span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-500 border-t border-slate-100 pt-5">
            <DetailItem
                label="Created At"
                value={formatTimestamp(product.created_at)}
            />
            <DetailItem
                label="Last Updated"
                value={formatTimestamp(product.updated_at)}
            />
        </div>


        <div className="pt-4 border-t border-slate-100">
          <button
            className="cursor-pointer w-full text-base px-4 py-3 rounded-xl bg-slate-200 border border-slate-300 text-slate-700 font-semibold hover:bg-slate-300 transition duration-150 flex items-center justify-center gap-3 focus:outline-none focus:ring-2 focus:ring-slate-400 shadow-sm"
            onClick={() => setShowHistory((prev) => !prev)}
          >
            <FaHistory className="w-4 h-4 text-slate-600" />
            <span>{showHistory ? 'Collapse Inventory Log' : 'Show Inventory Log'}</span>
            {showHistory ? (
              <FaChevronUp className="w-3.5 h-3.5 ml-2" />
            ) : (
              <FaChevronDown className="w-3.5 h-3.5 ml-2" />
            )}
          </button>

          {showHistory && (
            <div className="mt-4 p-4 bg-white rounded-xl shadow-inner border border-slate-300">
              <p className="text-sm font-bold mb-3 text-slate-700">
                Inventory History Log (Timeline)
              </p>

              {loading && (
                <p className="text-sm text-slate-500 animate-pulse p-4 text-center">
                  Loading history...
                </p>
              )}

              {!loading && history.length === 0 && (
                <p className="text-sm text-slate-400 italic p-4 text-center">
                  No inventory changes recorded for this product.
                </p>
              )}

              {!loading && history.length > 0 && (
                <ul className="space-y-0 max-h-96 overflow-y-auto pl-1 pr-2 custom-scrollbar">
                  {history.map((h, index) => renderHistoryItem(h, index, history.length))} 
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}