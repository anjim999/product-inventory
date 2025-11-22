export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const prev = () => {
    if (page > 1) onChange(page - 1);
  };
  const next = () => {
    if (page < totalPages) onChange(page + 1);
  };

  return (
    <div className="flex items-center justify-between mt-3 text-sm">
      <button
        onClick={prev}
        disabled={page === 1}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Prev
      </button>
      <span>
        Page {page} of {totalPages}
      </span>
      <button
        onClick={next}
        disabled={page === totalPages}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
