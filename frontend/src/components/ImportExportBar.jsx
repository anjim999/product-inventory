// src/components/ImportExportBar.jsx
import api from "../api/axiosClient";
import { toast } from "react-toastify";

export default function ImportExportBar({ onImported }) {
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/api/products/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Import result:", res.data);

      // ✅ Toast instead of alert
      toast.success(
        `Import completed. Added: ${res.data.added}, Skipped: ${res.data.skipped}`
      );

      // refresh product list
      onImported?.();
    } catch (err) {
      console.error("Import error:", err);

      // ✅ Toast error
      toast.error(
        err.response?.data?.message ||
          "Error importing CSV. Please try again."
      );
    } finally {
      // reset file input so same file can be selected again if needed
      e.target.value = "";
    }
  };

  const handleExport = async () => {
    console.log("Export clicked");
    try {
      const res = await api.get("/api/products/export", {
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "products.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      // ✅ Optional success toast
      toast.success("Products exported as CSV.");
    } catch (err) {
      console.error("Export error:", err);

      // ✅ Toast error
      toast.error(
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
        type="button"
        onClick={handleExport}
        className="cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-3 py-1.5 rounded"
      >
        Export CSV
      </button>
    </div>
  );
}
