// src/components/ProductTable.jsx

import { useState, useRef, useEffect } from 'react';
import api from '../api/axiosClient';
import {
  FaTrashAlt,
  FaEdit,
  FaSave,
  FaTimes,
  FaCamera,
  FaSpinner,
  FaSort,
  FaHistory,
  FaUpload,
} from 'react-icons/fa';

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

  // Image preview for edit image
  const [editImagePreview, setEditImagePreview] = useState(null);

  // Camera modal state (shared, but only used when editing a row)
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Hidden file input for "Choose File" in edit mode
  const fileInputRef = useRef(null);

  const startEdit = (product) => {
    // Clear previous preview if any
    if (editImagePreview) {
      URL.revokeObjectURL(editImagePreview);
      setEditImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setEditingId(product.id);
    setEditForm({
      ...product,
      stock: String(product.stock ?? 0),
      imageFile: null, // new file (if user selects/captures)
    });
  };

  const cancelEdit = () => {
    if (editImagePreview) {
      URL.revokeObjectURL(editImagePreview);
      setEditImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setEditingId(null);
    setEditForm({});
  };

  const handleChange = (field, value) => {
    // Manage preview for imageFile
    if (field === 'imageFile') {
      if (editImagePreview) {
        URL.revokeObjectURL(editImagePreview);
      }
      if (value) {
        const previewUrl = URL.createObjectURL(value);
        setEditImagePreview(previewUrl);
      } else {
        setEditImagePreview(null);
      }
    }

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

      toast.success('Product updated successfully!');

      if (editImagePreview) {
        URL.revokeObjectURL(editImagePreview);
        setEditImagePreview(null);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setEditingId(null);
      setEditForm({});
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

  // 🛠️ Tailwind CSS Class for stylish buttons
  const actionButtonBase = `
    cursor-pointer text-[10px] px-2 py-0.5 h-6 rounded-md font-medium
    inline-flex items-center justify-center gap-1
    transition-all duration-200 shadow-sm
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1
    w-full
  `;

  // 🔴 Stop camera stream helper
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // 🎥 Open camera modal (only makes sense while editing)
  const openCamera = () => {
    if (!editingId) return;
    setCameraError('');
    setShowCamera(true);
  };

  // Setup camera when showCamera = true
  useEffect(() => {
    if (!showCamera) {
      stopCameraStream();
      return;
    }

    let cancelled = false;

    const setupCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError('Camera not supported in this browser.');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error('Camera error:', err);
        setCameraError(
          'Unable to access camera. Please check permissions or try another browser.'
        );
      }
    };

    setupCamera();

    return () => {
      cancelled = true;
      stopCameraStream();
    };
  }, [showCamera]);

  // 📸 Capture photo from video for edit image
  const handleCapturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setCameraError('Camera not ready. Please wait a moment and try again.');
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `product-edit-${Date.now()}.png`, {
            type: 'image/png',
          });
          handleChange('imageFile', file);
          setShowCamera(false);
        } else {
          setCameraError('Failed to capture image. Please try again.');
        }
      },
      'image/png',
      0.92
    );
  };

  const handleCameraClose = () => {
    setShowCamera(false);
  };

  // 🗑️ Clear edit image (camera or file)
  const handleClearEditImage = () => {
    if (editImagePreview) {
      URL.revokeObjectURL(editImagePreview);
    }
    setEditImagePreview(null);
    setEditForm((prev) => ({ ...prev, imageFile: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (editImagePreview) {
        URL.revokeObjectURL(editImagePreview);
      }
      stopCameraStream();
    };
  }, [editImagePreview]);

  return (
    <>
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

                // Base image from product (server)
                const baseImgSrc = resolveImageUrl(p.image);
                // If editing and user selected new image, show preview instead
                const imgSrc =
                  isEditing && editImagePreview ? editImagePreview : baseImgSrc;

                return (
                  <tr
                    key={p.id}
                    className={`border-t hover:bg-slate-50 transition-colors duration-150 ${
                      isLowStock ? 'bg-orange-50 hover:bg-orange-100' : ''
                    } cursor-pointer text-xs`}
                    onClick={() => handleRowClick(p)}
                  >
                    {/* 🔹 Image */}
                    <td className="px-3 py-1.5">
                      {imgSrc ? (
                        <div className="inline-flex items-center justify-center">
                          <img
                            src={imgSrc}
                            alt={data.name}
                            className="w-10 h-10 object-cover rounded-md border border-slate-200 shadow-sm cursor-pointer
                            transform transition-transform duration-200 hover:scale-110 hover:shadow-md"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-slate-200 rounded-md flex items-center justify-center text-[8px] text-slate-500 border border-slate-300">
                          No Image
                        </div>
                      )}
                    </td>

                    <td
                      className="px-3 py-1.5 font-medium text-slate-800"
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

                    <td
                      className="px-3 py-1.5 text-slate-600"
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

                    <td
                      className="px-3 py-1.5 text-slate-600"
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

                    <td
                      className="px-3 py-1.5 text-slate-600"
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

                    <td
                      className="px-3 py-1.5 font-semibold text-slate-800"
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

                    <td className="px-3 py-1.5">
                      <span
                        className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${statusLabel.className}
                          cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-opacity-50 transition-all duration-150`}
                      >
                        {statusLabel.text}
                      </span>
                    </td>

                    <td
                      className="px-3 py-1.5 w-[140px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!isEditing ? (
                        <div className="flex flex-col gap-1.5">
                          <button
                            type="button"
                            className={`${actionButtonBase}
                              border border-slate-300
                              text-slate-600 bg-white
                              hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400
                              focus-visible:ring-slate-300
                            `}
                            onClick={() => handleRowClick(p)}
                          >
                            <FaHistory className="w-3 h-3" />
                            <span>History</span>
                          </button>

                          <button
                            type="button"
                            className={`${actionButtonBase}
                              border border-blue-500
                              text-blue-600 bg-blue-50
                              hover:bg-blue-600 hover:text-white
                              focus-visible:ring-blue-500
                            `}
                            onClick={() => startEdit(p)}
                          >
                            <FaEdit className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            className={`
                              ${actionButtonBase} !font-bold
                              border border-transparent
                              bg-rose-500 text-white
                              hover:bg-rose-600
                              focus-visible:ring-rose-500
                              disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none
                            `}
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
                        <div className="space-y-1.5">
                          <button
                            className={`${actionButtonBase} !text-[11px] !h-6 !rounded-md !py-0.5
                              bg-green-600 text-white
                              hover:bg-green-700 hover:shadow-md
                              focus-visible:ring-green-600
                            `}
                            onClick={saveEdit}
                          >
                            <FaSave className="w-3 h-3" />
                            <span>Save</span>
                          </button>

                          <button
                            className={`${actionButtonBase} !text-[11px] !h-6 !rounded-md !py-0.5
                              border border-slate-300 text-slate-700 bg-slate-50
                              hover:bg-slate-200
                              focus-visible:ring-slate-400
                            `}
                            onClick={cancelEdit}
                          >
                            <FaTimes className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>

                          <div className="pt-1.5 border-t border-slate-200">
                            <label className="cursor-pointer block text-[10px] mb-1 text-slate-600 font-semibold">
                              Change Image
                            </label>

                            {/* Camera + Choose File buttons */}
                            <div className="flex items-center gap-2 mb-2">
                              <button
                                type="button"
                                className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold rounded-lg border border-indigo-500 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white shadow-sm transition"
                                onClick={openCamera}
                              >
                                <FaCamera className="w-3 h-3" />
                                <span>Camera</span>
                              </button>

                              <button
                                type="button"
                                className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-semibold rounded-lg border border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100 shadow-sm transition"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <FaUpload className="w-3 h-3" />
                                <span>Choose File</span>
                              </button>
                            </div>

                            {/* Hidden file input */}
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*,application/pdf"
                              className="hidden"
                              onChange={(e) =>
                                handleChange(
                                  'imageFile',
                                  e.target.files?.[0] || null
                                )
                              }
                            />

                            {/* Preview + remove for edit image */}
                            {editForm.imageFile && (
                              <div className="mt-2 flex items-center gap-2 p-1.5 rounded-lg border border-slate-200 bg-slate-50">
                                {editImagePreview &&
                                  editForm.imageFile.type &&
                                  editForm.imageFile.type.startsWith(
                                    'image/'
                                  ) && (
                                    <img
                                      src={editImagePreview}
                                      alt="New image preview"
                                      className="w-9 h-9 rounded-md object-cover border border-slate-300"
                                    />
                                  )}

                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] text-slate-600 truncate">
                                    Selected:{' '}
                                    <span className="font-medium">
                                      {editForm.imageFile.name}
                                    </span>
                                  </p>
                                  <button
                                    type="button"
                                    className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold text-rose-600 hover:text-rose-700"
                                    onClick={handleClearEditImage}
                                  >
                                    <FaTrashAlt className="w-3 h-3" />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              </div>
                            )}

                            <p className="mt-1 text-[10px] text-slate-400">
                              Use <span className="font-semibold">Camera</span>{' '}
                              to capture via webcam / phone, or{' '}
                              <span className="font-semibold">Choose File</span>{' '}
                              to upload from device.
                            </p>
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
                className="cursor-pointer px-5 py-2 text-sm font-semibold rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="cursor-pointer px-5 py-2 text-sm font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition shadow-md hover:shadow-lg hover:shadow-rose-500/50"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎥 Camera Modal for editing product image */}
      {showCamera && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 rounded-3xl shadow-3xl w-full max-w-md relative overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <FaCamera className="w-4 h-4" />
                Capture Product Image
              </h3>
              <button
                type="button"
                className="p-2 rounded-full text-slate-300 hover:bg-slate-800 hover:text-white transition"
                onClick={handleCameraClose}
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3">
              {cameraError ? (
                <p className="text-xs text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">
                  {cameraError}
                </p>
              ) : (
                <>
                  <div className="bg-black rounded-2xl overflow-hidden border border-slate-700">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full max-h-72 object-contain bg-black"
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 text-center">
                    Position the product in the frame and click{' '}
                    <span className="font-semibold text-slate-200">Capture</span>.
                  </p>

                  <div className="flex justify-center gap-3 pt-2 pb-1">
                    <button
                      type="button"
                      className="cursor-pointer px-5 py-2 text-xs rounded-full bg-slate-700 text-slate-100 font-semibold hover:bg-slate-600 transition"
                      onClick={handleCameraClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="cursor-pointer px-5 py-2 text-xs rounded-full bg-emerald-500 text-white font-semibold hover:bg-emerald-600 shadow-md transition"
                      onClick={handleCapturePhoto}
                    >
                      Capture
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Hidden canvas for capturing frame */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </>
  );
}
