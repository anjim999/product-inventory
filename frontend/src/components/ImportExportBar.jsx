import api from '../api/axiosClient';

export default function ImportExportBar({ onImported }) {
  const handleExport = () => {
    window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/products/export`;
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/api/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert(`Imported: ${res.data.added}, Skipped: ${res.data.skipped}`);
      onImported();
    } catch (err) {
      alert(err.response?.data?.message || 'Import failed');
    }
  };

  const triggerFile = () => {
    document.getElementById('csvInput').click();
  };

  return (
    <div className="flex items-center gap-2">
      <input
        id="csvInput"
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleImport}
      />
      <button
        onClick={triggerFile}
        className="text-sm bg-slate-200 px-3 py-2 rounded hover:bg-slate-300"
      >
        Import
      </button>
      <button
        onClick={handleExport}
        className="text-sm bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
      >
        Export
      </button>
    </div>
  );
}
