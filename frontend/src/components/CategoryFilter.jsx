// frontend/src/components/CategoryFilter.jsx
export default function CategoryFilter({ categories, value, onChange }) {
  const normalized = (categories || [])
    .filter(Boolean)
    .map((c) => c.trim());

  const uniqueCategories = Array.from(new Set(normalized)).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  const toTitleCase = (str) =>
    str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
    });

  const handleChange = (e) => {
    onChange(e.target.value); 
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
