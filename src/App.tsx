// src/App.js
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import HomePage from './components/homepage/Homepage';
import Legal from './components/homepage/Projects/LegalLens/legalMain';   // <— your new page
import AnalysisPage from './components/homepage/Projects/LegalLens/analysis';
import ComparisonPage from './components/homepage/Projects/LegalLens/comparison';
import RiskAnalysisPage from './components/homepage/Projects/LegalLens/risk_analysis';
import ClauseCheckPage from './components/homepage/Projects/LegalLens/clause_check';
import { BackgroundBoxesDemo } from './components/homepage/Projects/SketchSense/backgroundBoxesDemo';
import Home from './components/homepage/Projects/SketchSense/Home';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* "/" renders your existing homepage */}
        <Route path="/" element={<HomePage />} />

        {/* "/legallens" renders the LegalLens page */}
        <Route path="/legallens" element={<Legal />} />

        <Route path="/sketchsense" element={<BackgroundBoxesDemo />} />

        {/* 3. Nested pages under /legallens */}
        <Route path="/legallens/analysis" element={<AnalysisPage />} />
        <Route path="/legallens/comparison" element={<ComparisonPage />} />
        <Route path="/legallens/risk_analysis" element={<RiskAnalysisPage />} />
        <Route path="/legallens/clause" element={<ClauseCheckPage />} />

        <Route path="/sketchsense/home" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

// Developed By Raj Maurya
