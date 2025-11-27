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

  const inputFields = [
    { field: 'name', label: 'Product Name', placeholder: 'e.g., Organic Honey' },
    { field: 'unit', label: 'Unit of Measure', placeholder: 'e.g., Kilograms, Pieces' },
    { field: 'category', label: 'Category', placeholder: 'e.g., Food & Beverage, Electronics' },
    { field: 'brand', label: 'Brand', placeholder: 'e.g., Acme Corp, Generic' },
  ];

  return (
    <>
      <ToastContainer />

      <button
        type="button"
        className="cursor-pointer inline-flex items-center gap-2 text-sm bg-green-600 text-white px-4 py-2 rounded-xl shadow-lg hover:bg-green-700 hover:shadow-xl active:scale-[0.98] transition duration-200 font-medium"
        onClick={() => setOpen(true)}
      >
        {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
        </svg> */}
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
                {/* Modern close icon style */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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
                    onChange={(e) => handleChange('description', e.target.value)}
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
                    Image / PDF Attachment
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="cursor-pointer w-full border border-slate-300 rounded-xl text-sm bg-slate-50 hover:bg-slate-100 transition file:cursor-pointer file:h-full file:px-4 file:py-2 file:text-sm file:rounded-l-xl file:border-0 file:bg-indigo-600 file:text-white file:mr-3 file:font-medium"
                    onChange={(e) =>
                      handleChange('image', e.target.files?.[0] || null)
                    }
                  />
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
    </>
  );
}