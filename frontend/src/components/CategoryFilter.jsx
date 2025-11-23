// frontend/src/components/CategoryFilter.jsx
export default function CategoryFilter({ categories, value, onChange }) {
  // Normalize categories: trimmed, remove empty/null/undefined
  const normalized = (categories || [])
    .filter(Boolean)
    .map((c) => c.trim());

  // Deduplicate, sort alphabetically (case-insensitive sort)
  const uniqueCategories = Array.from(new Set(normalized)).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  // Convert "shoe" → "Shoe", “men clothes” → “Men Clothes” (for label only)
  const toTitleCase = (str) =>
    str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
    });

  const handleChange = (e) => {
    onChange(e.target.value); // send ORIGINAL value (no forced lowercase)
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      className="
        cursor-pointer
        text-xs
        px-3 py-2
        rounded-lg
        bg-white
        border border-slate-300
        shadow-sm
        hover:border-indigo-500
        hover:shadow-md
        focus:outline-none
        focus:ring-2
        focus:ring-indigo-500
        focus:border-indigo-500
        transition-all
        duration-150
      "
    >
      <option value="">All Categories</option>

      {uniqueCategories.map((cat) => (
        <option key={cat} value={cat}>
          {toTitleCase(cat)}
        </option>
      ))}
    </select>
  );
}
