// frontend/src/components/Pagination.jsx
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    onChange(p);
  };

  const prev = () => {
    if (page > 1) onChange(page - 1);
  };

  const next = () => {
    if (page < totalPages) onChange(page + 1);
  };

  // Build an array [1, 2, 3, ..., totalPages]
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-between mt-3 text-sm bg-white rounded-xl border border-slate-200 px-4 py-3">
      {/* Prev button */}
      <button
        onClick={prev}
        disabled={page === 1}
        className="cursor-pointer flex items-center space-x-2 text-xs font-medium text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed hover:text-indigo-800 transition duration-150"
      >
        <FaArrowLeft className="w-3 h-3" />
        <span>Previous</span>
      </button>

      {/* Center: page numbers + current indicator */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-600 font-medium mr-1">
          Page {page} of {totalPages}
        </span>

        {pageNumbers.map((p) => (
          <button
            key={p}
            onClick={() => goToPage(p)}
            className={`cursor-pointer w-8 h-8 text-xs rounded-full flex items-center justify-center border transition duration-150 ${
              p === page
                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Next button */}
      <button
        onClick={next}
        disabled={page === totalPages}
        className="cursor-pointer flex items-center space-x-2 text-xs font-medium text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed hover:text-indigo-800 transition duration-150"
      >
        <span>Next</span>
        <FaArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}
