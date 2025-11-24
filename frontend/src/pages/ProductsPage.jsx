// frontend/src/pages/ProductsPage.jsx
import { useEffect, useState } from 'react';
import api from '../api/axiosClient';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import ImportExportBar from '../components/ImportExportBar';
import AddProductModal from '../components/AddProductModal';
import ProductTable from '../components/ProductTable';
import InventoryHistorySidebar from '../components/InventoryHistorySidebar';
import Pagination from '../components/Pagination';

import { FaBox, FaExclamationTriangle, FaTimesCircle, FaTags } from 'react-icons/fa';

const SummaryCard = ({ title, count, colorClass, hoverBg, IconComponent, iconColor }) => (
  <div
    className={`
      bg-white rounded-lg md:rounded-xl shadow-md md:shadow-lg border-l-4 p-3 md:p-4 space-y-1
      transition-all duration-300 transform cursor-default
      ${colorClass} hover:shadow-xl hover:scale-[1.03]
    `}
  >
    <div className="flex items-center justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] md:text-xs font-medium text-slate-500 truncate">{title}</p>
        <p className="text-lg md:text-2xl font-extrabold mt-0.5 md:mt-1" style={{ color: iconColor }}>
          {count || 0}
        </p>
      </div>
      {IconComponent && (
        <div className={`p-1.5 md:p-2 rounded-full ${hoverBg} flex-shrink-0 ml-2`}>
          <IconComponent className="text-base md:text-xl" style={{ color: iconColor }} />
        </div>
      )}
    </div>
  </div>
);

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
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
          category: category || '',
          sortBy,
          sortOrder,
          lowStockOnly,
        },
      });

      const fetchedProducts = res.data.data || [];
      setProducts(fetchedProducts);
      setPage(res.data.page);
      setTotalPages(res.data.totalPages);

      setAllCategories((prev) => {
        const set = new Set(prev || []);
        fetchedProducts.forEach((p) => {
          if (p.category) {
            set.add(p.category.trim());
          }
        });
        return Array.from(set);
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1);
    fetchSummary();
  }, [search, category, sortBy, sortOrder, lowStockOnly]);

  const handlePageChange = (p) => {
    setPage(p);
    fetchProducts(p);
  };

  const handleReload = () => {
    fetchProducts(1);
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
      <main className="w-full mx-auto px-2 md:px-4 py-3 md:py-6 flex flex-col md:flex-row gap-3 md:gap-4 mt-13">
        <section className="flex-1 flex flex-col gap-3 md:gap-4 min-w-0">
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              <SummaryCard
                title="Total Products"
                count={summary.totalProducts}
                colorClass="border-green-500"
                hoverBg="bg-green-50"
                iconColor="#10b981"
                IconComponent={FaBox}
              />

              <SummaryCard
                title="Out of Stock"
                count={summary.outOfStockCount}
                colorClass="border-red-500"
                hoverBg="bg-red-50"
                iconColor="#ef4444"
                IconComponent={FaTimesCircle}
              />

              <SummaryCard
                title="Low Stock"
                count={summary.lowStockCount}
                colorClass="border-orange-500"
                hoverBg="bg-orange-50"
                iconColor="#f97316"
                IconComponent={FaExclamationTriangle}
              />

              <SummaryCard
                title="Categories"
                count={summary.categoryCount}
                colorClass="border-blue-500"
                hoverBg="bg-blue-50"
                iconColor="#3b82f6"
                IconComponent={FaTags}
              />
            </div>
          )}

          <div className="w-full md:hidden">
            <ImportExportBar onImported={handleReload} />
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:hidden">
              <div className="flex-1 min-w-0">
                <SearchBar value={search} onChange={setSearch} />
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                
                <div className="flex-shrink-0"> 
                  <CategoryFilter
                    categories={allCategories}
                    value={category}
                    onChange={setCategory}
                  />
                </div>
                
                <button
                  type="button"
                  onClick={toggleLowStock}
                  className={`cursor-pointer text-[10px] md:text-xs px-2 md:px-2.5 py-1.5 md:py-2 rounded-md md:rounded-lg font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0 ${
                    lowStockOnly
                      ? 'bg-orange-600 text-white border border-orange-600 shadow-sm hover:bg-orange-700 active:scale-[0.97]'
                      : 'bg-orange-50 text-orange-700 border border-orange-300 hover:bg-orange-100 hover:border-orange-400 active:scale-[0.97]'
                  }`}
                >
                  {lowStockOnly ? 'Low Stock ✓' : 'Low Stock'}
                </button>
                
                {/* Add Product Button */}
                <div className="flex-shrink-0 flex-1">
                  <AddProductModal onAdded={handleReload} />
                </div>
              </div>
            </div>


            <div className="hidden md:flex items-center gap-1 flex-1 min-w-0"> 
              
              <div className="flex-1 min-w-0 md:max-w-xs">
                <SearchBar value={search} onChange={setSearch} />
              </div>

              <div className="flex items-center flex-shrink-0 gap-1"> 
                
                <div className="flex-shrink-0">
                  <CategoryFilter
                    categories={allCategories}
                    value={category}
                    onChange={setCategory}
                  />
                </div>

                <button
                  type="button"
                  onClick={toggleLowStock}
                  className={`cursor-pointer text-xs px-2.5 py-2 rounded-lg font-medium transition-all duration-150 whitespace-nowrap flex-shrink-0 border 
                    ${
                      lowStockOnly
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm hover:bg-orange-700 active:scale-[0.97]'
                        : 'bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100 hover:border-orange-400 active:scale-[0.97]'
                    }
                  `}
                >
                  {lowStockOnly ? 'Low Stock ✓' : 'Low Stock'}
                </button>

                <div className="flex-shrink-0">
                  <AddProductModal onAdded={handleReload} />
                </div>
              </div>
            </div>


            <div className="hidden md:block flex-shrink-0">
              <ImportExportBar onImported={handleReload} />
            </div>
            
          </div>

          {loading && <p className="text-xs md:text-sm text-slate-500">Loading products...</p>}

          <div className="overflow-x-auto -mx-2 md:mx-0">
            <div className="inline-block min-w-full align-middle px-2 md:px-0">
              <ProductTable
                products={products}
                onReload={handleReload}
                onSelectProduct={setSelectedProduct}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onChangeSort={handleSortChange}
              />
            </div>
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
        </section>

        <div className="w-full md:w-auto">
          <InventoryHistorySidebar
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        </div>
      </main>
    </div>
  );
}