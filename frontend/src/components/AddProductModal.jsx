import { useState, useRef, useEffect } from 'react';
import api from '../api/axiosClient';
import { toast, ToastContainer } from 'react-toastify';
import { FaCamera, FaUpload, FaTimes, FaTrashAlt } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';

export default function AddProductModal({ onAdded }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    unit: '',
    category: '',
    brand: '',
    stock: 0,
    image: null,
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // For previewing selected image
  const [imagePreview, setImagePreview] = useState(null);

  // Camera modal state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const fileInputRef = useRef(null);

  const handleChange = (field, value) => {
    if (field === 'image') {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      if (value) {
        const previewUrl = URL.createObjectURL(value);
        setImagePreview(previewUrl);
      } else {
        setImagePreview(null);
      }
    }

    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('unit', form.unit);
      formData.append('category', form.category);
      formData.append('brand', form.brand);
      formData.append('stock', form.stock);
      formData.append('description', form.description || '');
      if (form.image) {
        formData.append('image', form.image);
      }

      await api.post('/api/products', formData);

      toast.success('Product added successfully!', { autoClose: 1500 });

      onAdded();
      setOpen(false);

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(null);

      setForm({
        name: '',
        unit: '',
        category: '',
        brand: '',
        stock: 0,
        image: null,
        description: '',
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Error adding product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setOpen(false);
  };

  const inputFields = [
    { field: 'name', label: 'Product Name', placeholder: 'e.g., Organic Honey' },
    { field: 'unit', label: 'Unit of Measure', placeholder: 'e.g., Kilograms, Pieces' },
    { field: 'category', label: 'Category', placeholder: 'e.g., Food & Beverage, Electronics' },
    { field: 'brand', label: 'Brand', placeholder: 'e.g., Acme Corp, Generic' },
  ];

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const openCamera = () => {
    setCameraError('');
    setShowCamera(true);
  };

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
          const file = new File([blob], `product-${Date.now()}.png`, {
            type: 'image/png',
          });
          handleChange('image', file);
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

  const handleClearImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setForm((prev) => ({ ...prev, image: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <ToastContainer />

      <button
        type="button"
        className="cursor-pointer inline-flex items-center gap-2 text-sm bg-green-600 text-white px-4 py-2 rounded-xl shadow-lg hover:bg-green-700 hover:shadow-xl active:scale-[0.98] transition duration-200 font-medium"
        onClick={() => setOpen(true)}
      >
        <span>Add New Product</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-300"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-3xl shadow-3xl border border-slate-100 w-full max-h-[90vh] overflow-y-auto max-w-lg lg:max-w-2xl transform transition-all duration-300 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-800">
                Create New Product
              </h2>
              <button
                type="button"
                className="cursor-pointer text-slate-500 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onClick={handleClose}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-6">
                {inputFields.map(({ field, label, placeholder }) => (
                  <div key={field} className="col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {label}
                    </label>
                    <input
                      className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-base text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition shadow-sm hover:border-slate-400"
                      value={form[field]}
                      onChange={(e) => handleChange(field, e.target.value)}
                      placeholder={placeholder}
                      required
                    />
                  </div>
                ))}

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description / Notes
                  </label>
                  <textarea
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-base text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition shadow-sm resize-y"
                    rows={4}
                    value={form.description}
                    onChange={(e) =>
                      handleChange('description', e.target.value)
                    }
                    placeholder="Enter a detailed description of the product and any relevant notes..."
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-base text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 transition shadow-sm"
                    value={form.stock}
                    onChange={(e) =>
                      handleChange('stock', Number(e.target.value) || 0)
                    }
                    placeholder="Minimum 0"
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Product Image
                  </label>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border border-indigo-500 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white shadow-sm transition"
                      onClick={openCamera}
                    >
                      <FaCamera className="w-3.5 h-3.5" />
                      <span>Camera</span>
                    </button>

                    <button
                      type="button"
                      className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100 shadow-sm transition"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FaUpload className="w-3.5 h-3.5" />
                      <span>Choose File</span>
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) =>
                      handleChange('image', e.target.files?.[0] || null)
                    }
                  />

                  {form.image && (
                    <div className="mt-3 flex items-center gap-3 p-2 rounded-xl border border-slate-200 bg-slate-50">
                      {imagePreview &&
                        form.image.type &&
                        form.image.type.startsWith('image/') && (
                          <img
                            src={imagePreview}
                            alt="Selected preview"
                            className="w-12 h-12 rounded-lg object-cover border border-slate-300"
                          />
                        )}

                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-600 truncate">
                          Selected:{' '}
                          <span className="font-medium">
                            {form.image.name}
                          </span>
                        </p>
                        <button
                          type="button"
                          className="cursor-pointer mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700"
                          onClick={handleClearImage}
                        >
                          <FaTrashAlt className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="mt-1 text-[11px] text-slate-400">
                    Use <span className="font-semibold">Camera</span> to capture a photo using your webcam,
                    or <span className="font-semibold">Choose File</span> to upload from gallery / files.
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-slate-200 mt-6">
                <button
                  type="button"
                  className="cursor-pointer px-6 py-2.5 text-base rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 active:scale-[0.98] transition shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  onClick={handleClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer px-6 py-2.5 text-base rounded-xl bg-indigo-600 text-white font-semibold shadow-lg hover:bg-indigo-700 hover:shadow-xl active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  disabled={submitting}
                >
                  {submitting ? 'Saving Product...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}
    </>
  );
}
