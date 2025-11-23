// src/components/ProductTable.jsx
import { useState } from 'react';
import api from '../api/axiosClient';
import {
  FaTrashAlt,
  FaEdit,
  FaSave,
  FaTimes,
  FaCamera,
  FaSpinner,
  FaSort,
} from 'react-icons/fa';

// ✅ Toastify: only use `toast` here (container is global in App.jsx)
import { toast } from 'react-toastify';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const LOW_STOCK_THRESHOLD = 5;

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

export default function ProductTable({
  products,
  onReload,
  onSelectProduct,
  sortBy,
  sortOrder,
  onChangeSort,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const startEdit = (product) => {
    setEditingId(product.id);
    setEditForm({
      ...product,
      stock: String(product.stock ?? 0),
      imageFile: null,
    });
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
      const formData = new FormData();
      formData.append('name', editForm.name);
      formData.append('unit', editForm.unit);
      formData.append('category', editForm.category);
      formData.append('brand', editForm.brand);

      const stockNum = Number(editForm.stock) || 0;
      formData.append('stock', stockNum);
      formData.append('description', editForm.description || '');

      if (editForm.imageFile) {
        formData.append('image', editForm.imageFile);
      }

      await api.put(`/api/products/${editingId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // ✅ Toast autoClose handled by global ToastContainer
      toast.success('Product updated successfully!');

      setEditingId(null);
      onReload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating product');
    }
  };

  const openDeletePopup = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    const id = productToDelete.id;

    setShowDeleteModal(false);

    try {
      setDeletingId(id);
      await api.delete(`/api/products/${id}`);

      toast.success(`Product "${productToDelete.name}" deleted successfully!`);

      onReload();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
      setProductToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const handleRowClick = (product) => {
    if (editingId === product.id) return;
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
    if (sortBy !== field) {
      return <FaSort className="w-3 h-3 text-slate-400" />;
    }
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  return (
    <>
      {/* ❌ Removed <ToastContainer /> from here */}

      <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-slate-100">
        <div className="max-h-[30rem] overflow-y-auto no-scrollbar">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 sticky top-0 shadow-md">
              <tr className="text-xs text-slate-600 uppercase tracking-wider">
                <th className="px-3 py-3 text-left font-bold">Image</th>

                <th
                  className="px-3 py-3 text-left font-bold cursor-pointer"
                  onClick={() => toggleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Name</span>
                    {renderSortIcon('name')}
                  </div>
                </th>

                <th className="px-3 py-3 text-left font-bold">Unit</th>

                <th
                  className="px-3 py-3 text-left font-bold cursor-pointer"
                  onClick={() => toggleSort('category')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Category</span>
                    {renderSortIcon('category')}
                  </div>
                </th>

                <th
                  className="px-3 py-3 text-left font-bold cursor-pointer"
                  onClick={() => toggleSort('brand')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Brand</span>
                    {renderSortIcon('brand')}
                  </div>
                </th>

                <th
                  className="px-3 py-3 text-left font-bold cursor-pointer"
                  onClick={() => toggleSort('stock')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Stock</span>
                    {renderSortIcon('stock')}
                  </div>
                </th>

                <th className="px-3 py-3 text-left font-bold">Status</th>
                <th className="px-3 py-3 text-left font-bold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {products.map((p) => {
                const isEditing = editingId === p.id;
                const data = isEditing ? editForm : p;

                const stockNum = Number(data.stock ?? 0) || 0;
                const isLowStock =
                  stockNum > 0 && stockNum <= LOW_STOCK_THRESHOLD;

                const statusLabel =
                  stockNum === 0 || data.status === 'Out of Stock'
                    ? {
                        text: 'Out of Stock',
                        className:
                          'bg-red-100 text-red-700 border border-red-200',
                      }
                    : isLowStock
                    ? {
                        text: 'Low Stock',
                        className:
                          'bg-orange-100 text-orange-700 border border-orange-200',
                      }
                    : {
                        text: 'In Stock',
                        className:
                          'bg-green-100 text-green-700 border border-green-200',
                      };

                const imgSrc = resolveImageUrl(data.image);

                return (
                  <tr
                    key={p.id}
                    className={`border-t hover:bg-slate-50 transition-colors duration-150 ${
                      isLowStock ? 'bg-orange-50 hover:bg-orange-100' : ''
                    } cursor-pointer`}
                    onClick={() => handleRowClick(p)}
                  >
                    {/* Image */}
                    <td className="px-3 py-2">
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt={data.name}
                          className="w-10 h-10 object-cover rounded-md border border-slate-200 shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-slate-200 rounded-md flex items-center justify-center text-[10px] text-slate-500">
                          No Image
                        </div>
                      )}
                    </td>

                    {/* Name */}
                    <td
                      className="px-3 py-2 font-medium text-slate-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isEditing ? (
                        <input
                          className="border border-blue-300 rounded px-2 py-1 text-xs w-full"
                          value={data.name}
                          onChange={(e) =>
                            handleChange('name', e.target.value)
                          }
                        />
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{data.name}</span>
                          {isLowStock && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-300 text-orange-900 font-bold">
                              LOW
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Unit */}
                    <td
                      className="px-3 py-2 text-slate-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isEditing ? (
                        <input
                          className="border border-blue-300 rounded px-2 py-1 text-xs w-full"
                          value={data.unit}
                          onChange={(e) =>
                            handleChange('unit', e.target.value)
                          }
                        />
                      ) : (
                        data.unit
                      )}
                    </td>

                    {/* Category */}
                    <td
                      className="px-3 py-2 text-slate-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isEditing ? (
                        <input
                          className="border border-blue-300 rounded px-2 py-1 text-xs w-full"
                          value={data.category}
                          onChange={(e) =>
                            handleChange('category', e.target.value)
                          }
                        />
                      ) : (
                        data.category
                      )}
                    </td>

                    {/* Brand */}
                    <td
                      className="px-3 py-2 text-slate-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isEditing ? (
                        <input
                          className="border border-blue-300 rounded px-2 py-1 text-xs w-full"
                          value={data.brand}
                          onChange={(e) =>
                            handleChange('brand', e.target.value)
                          }
                        />
                      ) : (
                        data.brand
                      )}
                    </td>

                    {/* Stock */}
                    <td
                      className="px-3 py-2 font-semibold text-slate-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          className="border border-blue-300 rounded px-2 py-1 text-xs w-20"
                          value={editForm.stock}
                          onChange={(e) =>
                            handleChange('stock', e.target.value)
                          }
                        />
                      ) : (
                        stockNum
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${statusLabel.className}`}
                      >
                        {statusLabel.text}
                      </span>
                    </td>

                    {/* Actions */}
                    <td
                      className="px-3 py-2 w-[140px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!isEditing ? (
                        <div className="flex flex-col sm:flex-row gap-1">
                          <button
                            className="cursor-pointer text-xs px-2 py-1 rounded border border-blue-500 text-blue-600 hover:bg-blue-50 transition duration-150 flex items-center space-x-1"
                            onClick={() => startEdit(p)}
                          >
                            <FaEdit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            className="cursor-pointer text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 transition duration-150 flex items-center space-x-1 disabled:opacity-50"
                            onClick={() => openDeletePopup(p)}
                            disabled={deletingId === p.id || showDeleteModal}
                          >
                            {deletingId === p.id ? (
                              <FaSpinner className="animate-spin w-3 h-3" />
                            ) : (
                              <FaTrashAlt className="w-3 h-3" />
                            )}
                            <span>
                              {deletingId === p.id ? 'Deleting' : 'Delete'}
                            </span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button
                            className="cursor-pointer text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition duration-150 w-full flex items-center justify-center space-x-1"
                            onClick={saveEdit}
                          >
                            <FaSave className="w-3 h-3" />
                            <span>Save</span>
                          </button>

                          <button
                            className="cursor-pointer text-xs px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-200 transition duration-150 w-full flex items-center justify-center space-x-1"
                            onClick={cancelEdit}
                          >
                            <FaTimes className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>

                          <div className="mt-2 pt-1 border-t border-slate-100">
                            <label className="cursor-pointer block text-[10px] mb-0.5 text-slate-600">
                              Change Image
                            </label>
                            <div className="flex items-center space-x-1 text-slate-500">
                              <FaCamera className="w-3 h-3" />
                              <input
                                type="file"
                                accept="image/*"
                                className="cursor-pointer w-full border border-slate-300 rounded px-1 py-0.5 text-[10px]"
                                onChange={(e) =>
                                  handleChange(
                                    'imageFile',
                                    e.target.files?.[0] || null
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
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
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          aria-modal="true"
          role="dialog"
        >
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm">
            <div className="flex items-center space-x-3 mb-5 border-b pb-3 border-rose-100">
              <FaTrashAlt className="text-2xl text-rose-600" />
              <h3 className="text-xl font-bold text-slate-900">
                Confirm Deletion
              </h3>
            </div>

            <p className="text-sm text-slate-600 mb-8">
              You are about to delete product{' '}
              <span className="font-semibold text-rose-600">
                {productToDelete.name}
              </span>
              . This action is permanent and cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="cursor-pointer px-5 py-2 text-sm font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="cursor-pointer px-5 py-2 text-sm font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
