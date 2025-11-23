export default function SearchBar({ value, onChange }) {
  return (
    <input
      type="text"
      placeholder="Search by name..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="
        w-52
        text-sm
        px-3 py-2
        rounded-lg
        border border-slate-300
        bg-white
        shadow-sm
        focus:outline-none
        focus:ring-2
        focus:ring-indigo-500
        focus:border-indigo-500
        hover:border-indigo-400
        transition-all
        duration-150
      "
    />
  );
}
