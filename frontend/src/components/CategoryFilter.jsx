// src/components/CategoryFilter.jsx
export default function CategoryFilter({ categories, value, onChange }) {
  // Deduplicate + remove empty values
  const uniqueCategories = Array.from(
    new Set((categories || []).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const handleChange = (e) => {
    onChange(e.target.value); // "" = All categories
  };

  return (
    <select
      className="cursor-pointer border rounded px-2 py-2 text-xs bg-white"
      value={value}
      onChange={handleChange}
    >
      <option value="">All Categories</option>
      {uniqueCategories.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </select>
  );
}
