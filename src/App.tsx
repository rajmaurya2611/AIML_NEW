// src/App.js
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/homepage/Projects/SketchSense/protectedRoute';

import HomePage from './components/homepage/Homepage';
import LoginLegallens from './components/homepage/Projects/LegalLens/LoginLegalLens';
import LegalAuthRoute from './components/homepage/Projects/LegalLens/legalAuthRoute';
import Legal from './components/homepage/Projects/LegalLens/legalMain';   // <— your new page
import AnalysisPage from './components/homepage/Projects/LegalLens/analysis';
import ComparisonPage from './components/homepage/Projects/LegalLens/comparison';
//import RiskAnalysisPage from './components/homepage/Projects/LegalLens/risk_analysis';
//import ClauseCheckPage from './components/homepage/Projects/LegalLens/clause_check';
import { BackgroundBoxesDemo } from './components/homepage/Projects/SketchSense/backgroundBoxesDemo';
import Home from './components/homepage/Projects/SketchSense/Home';
import PersonaPrimeMain from './components/homepage/Projects/PersonaPrime/personaprime_main';
import GloveMain from './components/homepage/Projects/GloveDetection/Glove_main';
import KnowledgeKingdomMain from './components/homepage/Projects/KnowledgeKingdom/KnowledgeKingdom_main';
import Safelift_Main from './components/homepage/Projects/Safelift/Safelift_main';
import BudgetBeaconMain from './components/homepage/Projects/BudgetBeacon/BudgetBeaconMain';

function App() {
  return (
    <BrowserRouter>
     <Routes>
        {/* public homepage */}
        <Route path="/" element={<HomePage />} />

        {/* LegalLens */}
       <Route path="/legallens/login" element={<LoginLegallens />} />

<Route
  path="/legallens"
  element={
    <LegalAuthRoute>
      <Legal />
    </LegalAuthRoute>
  }
/>

<Route
  path="/legallens/analysis"
  element={
    <LegalAuthRoute>
      <AnalysisPage />
    </LegalAuthRoute>
  }
/>

<Route
  path="/legallens/comparison"
  element={
    <LegalAuthRoute>
      <ComparisonPage />
    </LegalAuthRoute>
  }
/>

{/* <Route
  path="/legallens/risk_analysis"
  element={
    <LegalAuthRoute>
      <RiskAnalysisPage />
    </LegalAuthRoute>
  }
/>

<Route
  path="/legallens/clause"
  element={
    <LegalAuthRoute>
      <ClauseCheckPage />
    </LegalAuthRoute>
  }
/> */}

        {/* SketchSense login */}
        <Route path="/sketchsense" element={<BackgroundBoxesDemo />} />

        {/* SketchSense post-login “home” */}
        <Route path="/sketchsense/home" element={<ProtectedRoute> <Home /> </ProtectedRoute> }/>
        {/* <Route path="/sketchsense/home" element={<Home />} /> */}

        {/* Persona Prime */}
        <Route path="/personaprime" element={<PersonaPrimeMain/>} />

        <Route path="/knowledgekingdom" element={<KnowledgeKingdomMain/>} />

        {/* Persona Prime */}
        <Route path="/gloveguardian" element={<GloveMain/>} />

        {/* Persona Prime */}
        <Route path="/safelift" element={<Safelift_Main/>} />

        <Route path="/budgetbeacon" element={<BudgetBeaconMain/>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;

// Developed By Raj Maurya
