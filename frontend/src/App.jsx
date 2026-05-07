import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SetupSession from './pages/SetupSession';
import SessionDashboard from './pages/SessionDashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/setup" element={<SetupSession />} />
          <Route path="/session/:sessionId" element={<SessionDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
