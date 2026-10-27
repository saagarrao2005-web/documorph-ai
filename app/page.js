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
    <main style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
      <div style={{ backgroundColor: '#1e293b', padding: '2rem', borderRadius: '12px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h1 style={{ color: '#60a5fa', marginBottom: '1.5rem' }}>DocuMorph Converter</h1>
        <form onSubmit={handleConvert} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            required
            style={{ color: '#cbd5e1' }}
          />
          <button
            type="submit"
            disabled={loading || !file}
            style={{ padding: '0.75rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            {loading ? 'Processing...' : 'Upload & Convert'}
          </button>
        </form>

        {error && (
          <p style={{ color: '#f87171', marginTop: '1rem', fontSize: '0.875rem' }}>{error}</p>
        )}

        {downloadUrl && (
          <div style={{ marginTop: '1.5rem' }}>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-block', padding: '0.5rem 1rem', backgroundColor: '#10b981', color: '#fff', borderRadius: '6px', textDecoration: 'none' }}
            >
              Download Converted File
            </a>
          </div>
        )}
      </div>
    </main>
  );
}