import { useEffect, useState } from 'react';
import api from '../api/axiosClient';

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
  }, [product]);

  if (!product) return null;

  const imgSrc = resolveImageUrl(product.image);

  return (
    <aside className="w-full max-w-xs bg-white border-l shadow-lg flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h3 className="font-semibold text-sm">Product Details</h3>
        <button
          className="text-xs text-slate-500 hover:text-slate-800"
          onClick={onClose}
        >
          Close ✕
        </button>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto flex-1">
        {imgSrc && (
          <div className="w-full">
            <img
              src={imgSrc}
              alt={product.name}
              className="w-full h-40 object-cover rounded border"
            />
          </div>
        )}

        <div>
          <p className="text-[11px] text-slate-500">Name</p>
          <p className="text-sm font-semibold">{product.name}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-[11px]">
          <div>
            <p className="text-slate-500">Category</p>
            <p className="text-sm">{product.category}</p>
          </div>
          <div>
            <p className="text-slate-500">Brand</p>
            <p className="text-sm">{product.brand}</p>
          </div>
          <div>
            <p className="text-slate-500">Unit</p>
            <p className="text-sm">{product.unit}</p>
          </div>
          <div>
            <p className="text-slate-500">Stock</p>
            <p className="text-sm">{product.stock}</p>
          </div>
        </div>

        <div>
          <p className="text-[11px] text-slate-500">Status</p>
          <p className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {product.status}
          </p>
        </div>

        <div>
          <p className="text-[11px] text-slate-500">Description / Notes</p>
          <p className="text-sm whitespace-pre-line">
            {product.description || '—'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 text-[11px] text-slate-500">
          <div>
            <p>Created At</p>
            <p className="text-xs">
              {product.created_at
                ? new Date(product.created_at).toLocaleString()
                : '—'}
            </p>
          </div>
          <div>
            <p>Updated At</p>
            <p className="text-xs">
              {product.updated_at
                ? new Date(product.updated_at).toLocaleString()
                : '—'}
            </p>
          </div>
        </div>

        <button
          className="mt-2 text-xs px-3 py-2 rounded border border-slate-300 hover:bg-slate-50"
          onClick={() => setShowHistory((prev) => !prev)}
        >
          {showHistory ? 'Hide History' : 'Show History'}
        </button>

        {showHistory && (
          <div className="mt-2">
            <p className="text-xs font-semibold mb-1">Inventory History</p>
            {loading && (
              <p className="text-[11px] text-slate-500">
                Loading history...
              </p>
            )}
            {!loading && history.length === 0 && (
              <p className="text-[11px] text-slate-400">No history yet.</p>
            )}
            {!loading && history.length > 0 && (
              <ul className="space-y-1 max-h-40 overflow-y-auto text-[11px]">
                {history.map((h) => (
                  <li
                    key={h.id}
                    className="border rounded px-2 py-1 bg-slate-50"
                  >
                    <p>
                      {h.old_stock} → {h.new_stock}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {h.timestamp
                        ? new Date(h.timestamp).toLocaleString()
                        : ''}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Changed by: {h.changed_by}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
