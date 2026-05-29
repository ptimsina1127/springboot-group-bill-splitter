import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SetupSession from './pages/SetupSession';
import SessionDashboard from './pages/SessionDashboard';
import ShortCodeResolver from './pages/ShortCodeResolver';
import Privacy from './pages/Privacy';

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
          </Routes>
        </div>
        <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
          <a href="/privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
        </footer>
      </div>
    </Router>
  );
}

export default App;
