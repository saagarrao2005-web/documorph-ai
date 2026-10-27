'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');

  const handleConvert = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    setDownloadUrl('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Conversion failed');
      }

      setDownloadUrl(data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-700">
        <h1 className="text-2xl font-bold text-center mb-6 text-blue-400">
          DocuMorph Converter
        </h1>

        <form onSubmit={handleConvert} className="space-y-4">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
            required
          />

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 rounded-md font-semibold transition"
          >
            {loading ? 'Processing...' : 'Upload & Convert'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-900/50 border border-red-500 text-red-300 rounded text-sm text-center">
            {error}
          </div>
        )}

        {downloadUrl && (
          <div className="mt-6 text-center">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-md transition"
            >
              Download Converted File
            </a>
          </div>
        )}
      </div>
    </main>
  );
}