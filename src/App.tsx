// src/App.js
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/homepage/Projects/SketchSense/protectedRoute';

import HomePage from './components/homepage/Homepage';
import Legal from './components/homepage/Projects/LegalLens/legalMain';   // <— your new page
import AnalysisPage from './components/homepage/Projects/LegalLens/analysis';
import ComparisonPage from './components/homepage/Projects/LegalLens/comparison';
import RiskAnalysisPage from './components/homepage/Projects/LegalLens/risk_analysis';
import ClauseCheckPage from './components/homepage/Projects/LegalLens/clause_check';
import { BackgroundBoxesDemo } from './components/homepage/Projects/SketchSense/backgroundBoxesDemo';
import Home from './components/homepage/Projects/SketchSense/Home';
import PersonaPrimeMain from './components/homepage/Projects/PersonaPrime/personaprime_main';
import GloveMain from './components/homepage/Projects/GloveDetection/Glove_main';

function App() {
  return (
    <BrowserRouter>
     <Routes>
        {/* public homepage */}
        <Route path="/" element={<HomePage />} />

        {/* LegalLens */}
        <Route path="/legallens"           element={<Legal />} />
        <Route path="/legallens/analysis"  element={<AnalysisPage />} />
        <Route path="/legallens/comparison" element={<ComparisonPage />} />
        <Route path="/legallens/risk_analysis" element={<RiskAnalysisPage />} />
        <Route path="/legallens/clause"    element={<ClauseCheckPage />} />

        {/* SketchSense login */}
        <Route path="/sketchsense" element={<BackgroundBoxesDemo />} />

        {/* SketchSense post-login “home” */}
        <Route path="/sketchsense/home" element={<ProtectedRoute> <Home /> </ProtectedRoute> }/>
        {/* <Route path="/sketchsense/home" element={<Home />} /> */}

        {/* Persona Prime */}
        <Route path="/personaprime" element={<PersonaPrimeMain/>} />

        {/* Persona Prime */}
        <Route path="/gloveguardian" element={<GloveMain/>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;

// Developed By Raj Maurya
