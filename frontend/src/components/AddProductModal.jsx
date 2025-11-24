import { useState } from 'react';
import api from '../api/axiosClient';
import { toast, ToastContainer } from 'react-toastify';
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

  const handleChange = (field, value) => {
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
      setForm({
        name: '',
        unit: '',
        category: '',
        brand: '',
        stock: 0,
        image: null,
        description: '',
      });
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

  return (
    <>
      <ToastContainer />

      {/* Trigger button */}
      <button
        type="button"
        className="cursor-pointer inline-flex items-center gap-2 text-sm bg-green-600 text-white px-3 py-2 rounded-lg shadow-sm hover:bg-green-700 hover:shadow-md active:scale-95 transition duration-150"
        onClick={() => setOpen(true)}
      >
        <span>Add New Product</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 w-full max-w-lg transform transition-all duration-200 scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">
                Add Product
              </h2>
              <button
                type="button"
                className="cursor-pointer text-slate-400 hover:text-slate-600 text-xl leading-none px-2 py-1 rounded-full hover:bg-slate-100 transition"
                onClick={handleClose}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              {['name', 'unit', 'category', 'brand'].map((field) => (
                <div key={field} className="col-span-1">
                  <label className="block text-xs font-medium text-slate-600 mb-1 capitalize">
                    {field}
                  </label>
                  <input
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                    value={form[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                    required
                  />
                </div>
              ))}

              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Description / Notes
                </label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition resize-y"
                  rows={3}
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Image / PDF
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="cursor-pointer w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm bg-slate-50 hover:bg-slate-100 transition file:cursor-pointer file:px-3 file:py-1 file:text-xs file:rounded-md file:border-0 file:bg-indigo-600 file:text-white file:mr-3"
                  onChange={(e) =>
                    handleChange('image', e.target.files?.[0] || null)
                  }
                />
              </div>

              <div className="col-span-1">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Stock
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition"
                  value={form.stock}
                  onChange={(e) =>
                    handleChange('stock', Number(e.target.value) || 0)
                  }
                />
              </div>

              <div className="col-span-2 flex justify-end gap-2 mt-3">
                <button
                  type="button"
                  className="cursor-pointer px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 active:scale-95 transition"
                  onClick={handleClose}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cursor-pointer px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white font-medium shadow-sm hover:bg-indigo-700 hover:shadow-md active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
