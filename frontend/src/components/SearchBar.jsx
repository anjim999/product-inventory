export default function SearchBar({ value, onChange }) {
  return (
    <input
      type="text"
      placeholder="Search by name..."
      className="border rounded px-3 py-2 text-sm w-52"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
