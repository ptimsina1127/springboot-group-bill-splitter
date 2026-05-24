import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

export default function ShortCodeResolver() {
  const { shortCode } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get(`/sessions/by-short-code/${shortCode}`);
        navigate(`/session/${res.data.id}`, { replace: true });
      } catch (e) {
        setError(true);
      }
    })();
  }, [shortCode, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-8">
        <h1 className="text-2xl font-black text-slate-900 mb-2">Session not found</h1>
        <p className="text-slate-500 mb-6">No session matches code <strong>{shortCode}</strong>.</p>
        <button onClick={() => navigate('/')} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-500 border-t-transparent"></div>
    </div>
  );
}
