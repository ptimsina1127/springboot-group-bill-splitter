import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SetupSession from './pages/SetupSession';
import SessionDashboard from './pages/SessionDashboard';
import ShortCodeResolver from './pages/ShortCodeResolver';
import Privacy from './pages/Privacy';
import Features from './pages/Features';
import HowItWorks from './pages/HowItWorks';
import About from './pages/About';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/setup" element={<SetupSession />} />
            <Route path="/session/:sessionId" element={<SessionDashboard />} />
            <Route path="/s/:shortCode" element={<ShortCodeResolver />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/features" element={<Features />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
        <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
          <nav className="flex items-center justify-center gap-4 sm:gap-6">
            <a href="/" className="hover:text-slate-600 transition-colors font-medium">Home</a>
            <span className="text-slate-300">/</span>
            <a href="/features" className="hover:text-slate-600 transition-colors font-medium">Features</a>
            <span className="text-slate-300">/</span>
            <a href="/how-it-works" className="hover:text-slate-600 transition-colors font-medium">How It Works</a>
            <span className="text-slate-300">/</span>
            <a href="/about" className="hover:text-slate-600 transition-colors font-medium">About</a>
            <span className="text-slate-300">/</span>
            <a href="/privacy" className="hover:text-slate-600 transition-colors font-medium">Privacy</a>
          </nav>
        </footer>
      </div>
    </Router>
  );
}

export default App;
