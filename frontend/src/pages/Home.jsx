import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Users, ArrowRight } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 bg-gradient-to-br from-slate-50 via-white to-brand-50">
      <div className="max-w-5xl w-full text-center px-4">
        <div className="flex justify-center mb-10 animate-bounce">
          <div className="bg-brand-500 p-5 sm:p-6 md:p-8 rounded-3xl shadow-2xl shadow-brand-300/50">
            <Users className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 text-white" />
          </div>
        </div>
        
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 mb-6 tracking-tighter leading-none">
          Split bills <span className="text-brand-500">effortlessly.</span>
        </h1>
        
        <p className="text-lg sm:text-xl md:text-2xl text-slate-600 mb-10 sm:mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
          The modern way to manage shared expenses. No spreadsheets, no awkward conversations, just simple splitting.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-stretch sm:items-center">
          <button 
            onClick={() => navigate('/setup')}
            className="group flex items-center justify-center gap-3 bg-brand-500 hover:bg-brand-600 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-2xl font-black text-lg sm:text-xl transition-all shadow-xl shadow-brand-200 hover:-translate-y-1 active:scale-95 hover:shadow-2xl"
          >
            <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:rotate-90" />
            Start New Session
          </button>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const id = e.target.sessionId.value;
            if(id) navigate(`/session/${id}`);
          }} className="flex flex-col sm:flex-row gap-3 p-2 bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 focus:ring-brand-400 transition-all">
            <input 
              name="sessionId"
              type="text" 
              placeholder="Enter Session ID" 
              className="px-4 py-3 outline-none text-base sm:text-lg w-full sm:w-64 bg-transparent placeholder:text-slate-400"
            />
            <button 
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-base sm:text-lg transition-all active:scale-95 whitespace-nowrap"
            >
              Join <ArrowRight className="inline w-4 h-4 ml-1" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
