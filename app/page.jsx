'use client';

import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleConvert = async () => {
    if (!file) {
      alert('Please select a file to convert!');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setDownloadUrl(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

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
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0d0e12] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full bg-[#16181d] border border-gray-800 rounded-2xl p-8 shadow-2xl text-center">
        <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          DocuMorph AI
        </h1>
        <p className="text-gray-400 mb-8 text-sm">
          Convert your documents instantly to PDF.
        </p>

        <div className="border-2 border-dashed border-gray-700 hover:border-purple-500 transition-colors rounded-xl p-6 bg-[#0f1015] mb-6 cursor-pointer relative">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
          <div className="flex flex-col items-center">
            <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-300 font-medium">
              {file ? file.name : 'Click or drop your file here'}
            </p>
          </div>
        </div>

        <button
          onClick={handleConvert}
          disabled={loading || !file}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg mb-4"
        >
          {loading ? 'Converting Document...' : 'Convert File'}
        </button>

        {errorMessage && (
          <p className="text-red-400 text-sm mb-4 bg-red-950/40 border border-red-800 p-3 rounded-lg">
            {errorMessage}
          </p>
        )}

        {downloadUrl && (
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="inline-block w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg"
          >
            Download Processed File
          </a>
        )}
      </div>
    </main>
  );
}