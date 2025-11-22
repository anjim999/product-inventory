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

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return Array.from(set).filter(Boolean);
  }, [products]);

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
          sortOrder
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, sortBy, sortOrder]);

  const handlePageChange = (p) => {
    fetchProducts(p);
  };

  const handleReload = () => {
    fetchProducts();
  };

  const handleSortChange = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6 flex gap-4">
        <section className="flex-1 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <SearchBar value={search} onChange={setSearch} />
              <CategoryFilter
                categories={categories}
                value={category}
                onChange={setCategory}
              />
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

          <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
        </section>

        <InventoryHistorySidebar
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      </main>
    </div>
  );
}
