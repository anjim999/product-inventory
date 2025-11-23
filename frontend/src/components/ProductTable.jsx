import { useState } from 'react';
import api from '../api/axiosClient';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function resolveImageUrl(image) {
  if (!image) return null;

  // If it's already an absolute URL or data URL, just use it
  if (
    image.startsWith('http://') ||
    image.startsWith('https://') ||
    image.startsWith('data:')
  ) {
    return image;
  }

  // If backend stores like "/uploads/xyz.png"
  if (image.startsWith('/')) {
    return `${API_BASE_URL}${image}`;
  }

  // Fallback: no leading slash
  return `${API_BASE_URL}/${image}`;
}

export default function ProductTable({
  products,
  onReload,
  onSelectProduct,
  sortBy,
  sortOrder,
  onChangeSort
}) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const startEdit = (product) => {
    setEditingId(product.id);
    setEditForm(product);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveEdit = async () => {
    try {
      await api.put(`/api/products/${editingId}`, editForm);
      setEditingId(null);
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/api/products/${id}`);
      onReload();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleRowClick = (product) => {
    if (editingId === product.id) return; // avoid conflict
    onSelectProduct(product);
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      onChangeSort(field, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onChangeSort(field, 'asc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortBy !== field) return '↕';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left">Image</th>
            <th
              className="px-3 py-2 text-left cursor-pointer"
              onClick={() => toggleSort('name')}
            >
              Name {renderSortIcon('name')}
            </th>
            <th className="px-3 py-2 text-left">Unit</th>
            <th
              className="px-3 py-2 text-left cursor-pointer"
              onClick={() => toggleSort('category')}
            >
              Category {renderSortIcon('category')}
            </th>
            <th
              className="px-3 py-2 text-left cursor-pointer"
              onClick={() => toggleSort('brand')}
            >
              Brand {renderSortIcon('brand')}
            </th>
            <th
              className="px-3 py-2 text-left cursor-pointer"
              onClick={() => toggleSort('stock')}
            >
              Stock {renderSortIcon('stock')}
            </th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const isEditing = editingId === p.id;
            const data = isEditing ? editForm : p;
            const statusLabel =
              data.stock === 0 || data.status === 'Out of Stock'
                ? { text: 'Out of Stock', className: 'bg-red-100 text-red-700' }
                : { text: 'In Stock', className: 'bg-green-100 text-green-700' };

            const imgSrc = resolveImageUrl(data.image);

            return (
              <tr
                key={p.id}
                className="border-t hover:bg-slate-50"
                onClick={() => handleRowClick(p)}
              >
                <td className="px-3 py-2">
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={data.name}
                      className="w-10 h-10 object-cover rounded border"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-slate-200 rounded" />
                  )}
                </td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <input
                      className="border rounded px-2 py-1 text-xs w-full"
                      value={data.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                    />
                  ) : (
                    data.name
                  )}
                </td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <input
                      className="border rounded px-2 py-1 text-xs w-full"
                      value={data.unit}
                      onChange={(e) => handleChange('unit', e.target.value)}
                    />
                  ) : (
                    data.unit
                  )}
                </td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <input
                      className="border rounded px-2 py-1 text-xs w-full"
                      value={data.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                    />
                  ) : (
                    data.category
                  )}
                </td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <input
                      className="border rounded px-2 py-1 text-xs w-full"
                      value={data.brand}
                      onChange={(e) => handleChange('brand', e.target.value)}
                    />
                  ) : (
                    data.brand
                  )}
                </td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      className="border rounded px-2 py-1 text-xs w-20"
                      value={data.stock}
                      onChange={(e) =>
                        handleChange('stock', Number(e.target.value) || 0)
                      }
                    />
                  ) : (
                    data.stock
                  )}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${statusLabel.className}`}
                  >
                    {statusLabel.text}
                  </span>
                </td>
                <td
                  className="px-3 py-2 space-x-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!isEditing ? (
                    <>
                      <button
                        className="text-xs px-2 py-1 rounded border border-blue-500 text-blue-600"
                        onClick={() => startEdit(p)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-xs px-2 py-1 rounded border border-red-500 text-red-600"
                        onClick={() => handleDelete(p.id)}
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="text-xs px-2 py-1 rounded bg-green-600 text-white"
                        onClick={saveEdit}
                      >
                        Save
                      </button>
                      <button
                        className="text-xs px-2 py-1 rounded border"
                        onClick={cancelEdit}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
          {products.length === 0 && (
            <tr>
              <td
                colSpan={8}
                className="px-3 py-4 text-center text-sm text-slate-500"
              >
                No products found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
