// src/components/ImportExportBar.jsx
import api from "../api/axiosClient";

export default function ImportExportBar({ onImported }) {
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      // in ImportExportBar.jsx
const res = await api.post("/api/products/import", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});
console.log("Import result:", res.data);  // 👈 add this
alert(
  `Import completed. Added: ${res.data.added}, Skipped: ${res.data.skipped}`
);

      onImported?.(); // refresh product list
    } catch (err) {
      console.error("Import error:", err);
      alert(
        err.response?.data?.message ||
          "Error importing CSV. Please try again."
      );
    } finally {
      e.target.value = "";
    }
  };

  const handleExport = async () => {
    console.log("Export clicked"); // debug
    try {
      const res = await api.get("/api/products/export", {
        responseType: "blob"
      });

      const blob = new Blob([res.data], {
        type: "text/csv;charset=utf-8;"
      });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "products.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert(
        err.response?.data?.message ||
          "Error exporting CSV. Please try again."
      );
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Import CSV */}
      <label className="bg-slate-200 hover:bg-slate-300 text-sm px-3 py-1.5 rounded cursor-pointer">
        Import CSV
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleImport}
        />
      </label>

      {/* Export CSV */}
      <button
        type="button"              // ✅ VERY IMPORTANT
        onClick={handleExport}     // ✅ calls Axios, not navigation
        className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-3 py-1.5 rounded"
      >
        Export CSV
      </button>
    </div>
  );
}
