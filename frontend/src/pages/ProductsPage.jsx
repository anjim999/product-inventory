import { useEffect, useMemo, useState } from 'react';
import api from '../api/axiosClient';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import ImportExportBar from '../components/ImportExportBar';
import AddProductModal from '../components/AddProductModal';
import ProductTable from '../components/ProductTable';
import InventoryHistorySidebar from '../components/InventoryHistorySidebar';
import Pagination from '../components/Pagination';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [summary, setSummary] = useState(null);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return Array.from(set).filter(Boolean);
  }, [products]);

  const fetchSummary = async () => {
    try {
      const res = await api.get('/api/products/summary');
      setSummary(res.data);
    } catch (err) {
      console.error('Summary error:', err);
    }
  };

  const fetchProducts = async (overridePage) => {
    const currentPage = overridePage || page;
    setLoading(true);
    try {
      const res = await api.get('/api/products', {
        params: {
          page: currentPage,
          limit,
          search,
          category,
          sortBy,
          sortOrder,
          lowStockOnly
        }
      });
      setProducts(res.data.data);
      setPage(res.data.page);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, sortBy, sortOrder, lowStockOnly]);

  const handlePageChange = (p) => {
    fetchProducts(p);
  };

  const handleReload = () => {
    fetchProducts();
    fetchSummary();
  };

  const handleSortChange = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
  };

  const toggleLowStock = () => {
    setLowStockOnly((prev) => !prev);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6 flex gap-4">
        <section className="flex-1 flex flex-col gap-4">
          {/* Dashboard Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
              <div className="bg-white rounded-xl shadow px-3 py-3">
                <p className="text-[11px] text-slate-500">Total Products</p>
                <p className="text-xl font-semibold">
                  {summary.totalProducts || 0}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow px-3 py-3">
                <p className="text-[11px] text-slate-500">Total Units</p>
                <p className="text-xl font-semibold">
                  {summary.totalUnits || 0}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow px-3 py-3">
                <p className="text-[11px] text-slate-500">Out of Stock</p>
                <p className="text-xl font-semibold">
                  {summary.outOfStockCount || 0}
                </p>
              </div>
              <div className="bg-white rounded-xl shadow px-3 py-3">
                <p className="text-[11px] text-slate-500">Categories</p>
                <p className="text-xl font-semibold">
                  {summary.categoryCount || 0}
                </p>
                {summary.lowStockCount > 0 && (
                  <p className="text-[11px] text-orange-600 mt-1">
                    {summary.lowStockCount} low stock items
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <SearchBar value={search} onChange={setSearch} />
              <CategoryFilter
                categories={categories}
                value={category}
                onChange={setCategory}
              />
              <button
                type="button"
                onClick={toggleLowStock}
                className={`text-xs px-3 py-2 rounded border ${
                  lowStockOnly
                    ? 'bg-orange-600 text-white border-orange-600'
                    : 'text-orange-700 border-orange-300 bg-orange-50'
                }`}
              >
                {lowStockOnly ? 'Showing Low Stock' : 'Low Stock Only'}
              </button>
              <AddProductModal onAdded={handleReload} />
            </div>
            <ImportExportBar onImported={handleReload} />
          </div>

          {loading && (
            <p className="text-sm text-slate-500">Loading products...</p>
          )}

          <ProductTable
            products={products}
            onReload={handleReload}
            onSelectProduct={setSelectedProduct}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onChangeSort={handleSortChange}
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={handlePageChange}
          />
        </section>

        <InventoryHistorySidebar
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      </main>
    </div>
  );
}
