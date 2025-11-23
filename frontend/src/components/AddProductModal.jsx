import { useState } from 'react';
import api from '../api/axiosClient';

export default function AddProductModal({ onAdded }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    unit: '',
    category: '',
    brand: '',
    stock: 0,
    status: 'In Stock',
    image: null
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('unit', form.unit);
      formData.append('category', form.category);
      formData.append('brand', form.brand);
      formData.append('stock', form.stock);
      formData.append('status', form.status);
      if (form.image) {
        formData.append('image', form.image);
      }

      await api.post('/api/products', formData);
      onAdded();
      setOpen(false);
      setForm({
        name: '',
        unit: '',
        category: '',
        brand: '',
        stock: 0,
        status: 'In Stock',
        image: null
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding product');
    }
  };

  return (
    <>
      <button
        className="text-sm bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
        onClick={() => setOpen(true)}
      >
        Add New Product
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow p-5 w-full max-w-lg">
            <h2 className="text-lg font-semibold mb-4">Add Product</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
              {['name', 'unit', 'category', 'brand'].map((field) => (
                <div key={field} className="col-span-1">
                  <label className="block text-xs mb-1 capitalize">{field}</label>
                  <input
                    className="w-full border rounded px-2 py-1 text-sm"
                    value={form[field]}
                    onChange={(e) => handleChange(field, e.target.value)}
                    required
                  />
                </div>
              ))}

              <div className="col-span-2">
                <label className="block text-xs mb-1">Image / PDF</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="w-full border rounded px-2 py-1 text-sm"
                  onChange={(e) =>
                    handleChange('image', e.target.files?.[0] || null)
                  }
                />
              </div>

              <div>
                <label className="block text-xs mb-1">Stock</label>
                <input
                  type="number"
                  min="0"
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={form.stock}
                  onChange={(e) => handleChange('stock', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Status</label>
                <select
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option>In Stock</option>
                  <option>Out of Stock</option>
                </select>
              </div>
              <div className="col-span-2 flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="px-3 py-1 text-sm rounded border"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button className="px-3 py-1 text-sm rounded bg-blue-600 text-white">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
