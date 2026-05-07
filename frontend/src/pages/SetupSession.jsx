import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import apiClient from '../api/client';

export default function SetupSession() {
  const [name, setName] = useState('');
  const [countInput, setCountInput] = useState('2');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const participantCount = Math.max(2, parseInt(countInput) || 2);

  const handleCountChange = (e) => {
    const raw = e.target.value;
    if (raw === '' || /^\d+$/.test(raw)) setCountInput(raw);
  };

  const handleCountBlur = () => {
    const num = parseInt(countInput);
    if (isNaN(num) || num < 2) setCountInput('2');
    else if (num > 50) setCountInput('50');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const participantNames = Array.from({ length: participantCount }, (_, i) => `Person ${i + 1}`);
      const response = await apiClient.post('/sessions', {
        name,
        participantNames
      });
      navigate(`/session/${response.data.id}`);
    } catch (error) {
      alert('Error creating session. Please check your backend!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-10 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 lg:p-12 border border-slate-100 transition-smooth">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center text-slate-400 hover:text-brand-500 mb-6 sm:mb-8 transition-colors font-semibold text-base"
        >
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to home
        </button>

        <div className="mb-8 sm:mb-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-3 tracking-tight leading-tight">Create a session</h2>
          <p className="text-base sm:text-lg text-slate-500 font-medium">Set up a space for your shared expenses.</p>
        </div>

        <form onSubmit={handleCreate} className="space-y-6 sm:space-y-8">
          <div className="space-y-3">
            <label className="block text-xs sm:text-sm font-black text-slate-700 uppercase tracking-widest px-1">Session Name</label>
            <input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tokyo Summer Trip 2024"
              className="w-full px-5 py-4 sm:py-5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-brand-100 focus:border-brand-400 outline-none transition-all text-base sm:text-lg font-medium placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs sm:text-sm font-black text-slate-700 uppercase tracking-widest px-1">Number of People</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Users className="w-5 h-5" />
              </div>
              <input 
                type="number"
                required
                min={2}
                max={50}
                value={countInput}
                onChange={handleCountChange}
                onBlur={handleCountBlur}
                className="w-full px-5 py-4 sm:py-5 pl-12 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-brand-100 focus:border-brand-400 outline-none transition-all text-base sm:text-lg font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium px-1">You can edit names once the session starts.</p>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white py-5 sm:py-6 rounded-2xl font-black text-lg sm:text-xl transition-all shadow-xl shadow-brand-200 hover:shadow-2xl active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Session'}
          </button>
        </form>
      </div>
    </div>
  );
}
