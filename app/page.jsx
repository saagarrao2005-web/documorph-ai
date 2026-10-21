'use client';

import { useState } from 'react';

export default function Home() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(Array.from(e.target.files));
      setDownloadUrl(null);
    }
  };

  const handleConvert = async () => {
    if (files.length === 0) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setDownloadUrl(data.url);
      } else {
        alert(data.error || 'Conversion failed');
      }
    } catch (err) {
      alert('An error occurred during conversion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>documorph-ai</h1>

      <input type="file" onChange={handleFileChange} />

      {files.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <p>File: {files[0].name}</p>
          <button onClick={handleConvert} disabled={loading}>
            {loading ? 'Processing...' : 'Convert all'}
          </button>
        </div>
      )}

      {downloadUrl && (
        <div style={{ marginTop: '1.5rem' }}>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#10b981',
              color: '#fff',
              borderRadius: '5px',
              textDecoration: 'none',
              fontWeight: 'bold',
            }}
          >
            Download Processed File
          </a>
        </div>
      )}
    </main>
  );
}