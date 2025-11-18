// src/App.js
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/homepage/Projects/SketchSense/protectedRoute';
 
import HomePage from './components/homepage/Homepage';
//import Legal from './components/homepage/Projects/LegalLens/legalMain';   // <— your new page
//import AnalysisPage from './components/homepage/Projects/LegalLens/analysis';
//import ComparisonPage from './components/homepage/Projects/LegalLens/comparison';
//import RiskAnalysisPage from './components/homepage/Projects/LegalLens/risk_analysis';
//import ClauseCheckPage from './components/homepage/Projects/LegalLens/clause_check';
import { BackgroundBoxesDemo } from './components/homepage/Projects/SketchSense/backgroundBoxesDemo';
import Home from './components/homepage/Projects/SketchSense/Home';
//import PersonaPrimeMain from './components/homepage/Projects/PersonaPrime/personaprime_main';
import GloveMain from './components/homepage/Projects/GloveDetection/Glove_main';
//import KnowledgeKingdomMain from './components/homepage/Projects/KnowledgeKingdom/KnowledgeKingdom_main';
import Safelift_Main from './components/homepage/Projects/Safelift/Safelift_main';
import BudgetBeaconMain from './components/homepage/Projects/BudgetBeacon/BudgetBeaconMain';
import RKIPApp from './components/homepage/Projects/RKIP/RKIPApp';
//import DO33Main from './components/homepage/Projects/DO33/do33_main';
import LegalLensRoot from './components/homepage/Projects/LegalLens/root';
import DO33Root from './components/homepage/Projects/DO33/root';
//import KnowledgeRoot from './components/homepage/Projects/KnowledgeKingdom/root';
import TalentAIMain from './components/homepage/Projects/TalentAI/TalentAIMain'
import CVRanker from './components/homepage/Projects/TalentAI/CvRanker';
import JdGenerator from './components/homepage/Projects/TalentAI/JdGenerator';
import JobFitRanker from './components/homepage/Projects/TalentAI/JobFitRanker/JobFitRanker';
import CvRankingResultPage from './components/homepage/Projects/TalentAI/JobFitRanker/CVRankingResultPage';
import InterviewBot from './components/homepage/Projects/TalentAI/InterviewBot/interviewBot.jsx';
// Hr View
import HrView from './components/homepage/Projects/TalentAI/HR-View/HrView.jsx';
import SMPBI from './components/homepage/Projects/SMP_BI/App_SMP_BI.tsx';
//import CapexApp from './components/homepage/Projects/CapexForecasting/CapexApp.tsx';
//import DataViewerPage from './components/homepage/Projects/CapexForecasting/pages_Capex/DataViewerPage.tsx';
//import App_marcom from './components/homepage/Projects/Marcom/App_marcom.jsx';
import KnowledgeRoot from './components/homepage/Projects/Marcom/okta/root.jsx';
import CapexRoot from './components/homepage/Projects/CapexForecasting/okta/root.tsx';
//import App_Yachiyo from './components/homepage/Projects/Yachiyo/App_Yachiyo.tsx';
import YachiyoRoot from './components/homepage/Projects/Yachiyo/components_Yachiyo/yachiyoroot.tsx';
 
function App() {
  return (
    <BrowserRouter>
     <Routes>
        {/* public homepage */}
        <Route path="/" element={<HomePage />} />
 
        {/* LegalLens */}
       {/* <Route path="/legallens" element={<Legal/>} />
 
<Route
  path="legallens/analysis"
  element={
      <AnalysisPage />
  }
/>
 
<Route
  path="legallens/comparison"
  element={
      <ComparisonPage />
  }
/>
*/}
 
 <Route path="/legallens/*" element={<LegalLensRoot/>} />
 
<Route path="/do33/*"        element={<DO33Root/>} />
  <Route path="/knowledgebot/*" element={<KnowledgeRoot/>} />
 
 
 
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
        {/* <Route path="/personaprime" element={<PersonaPrimeMain/>} /> */}
 
 
        {/* Persona Prime */}
        <Route path="/gloveguardian" element={<GloveMain/>} />
 
        {/* Persona Prime */}
        <Route path="/safelift" element={<Safelift_Main/>} />
 
        <Route path="/budgetbeacon" element={<BudgetBeaconMain/>} />
 
        <Route path="/kip" element={<RKIPApp/>} />
 
        <Route path="/talentai" element={<TalentAIMain/>} />
        <Route path="/talentai/CvRanker" element={<CVRanker/>} />
        <Route path="/talentai/jd-generator" element={<JdGenerator/>} />
        <Route path="/talentai/JobFitRanker" element={<JobFitRanker/>} />
        <Route path="/talentai/cv-ranking-result" element={<CvRankingResultPage/>}/>
       
        {/* <Route path="/talentai/interview" element={<InterviewBot/>}/> */}
        {/* Changed by Rohan Singh  */}
        <Route path="/talentai/uuid/interview/:uuid" element={<InterviewBot />} />
        <Route path="/talentai/HrView" element={<HrView/>}/>

        <Route path="/smpbi" element={<SMPBI/>}/>
        <Route path="/capex-forecasting/*" element={<CapexRoot/>} />
        {/* <Route path="/capex-forecasting/*" element={<CapexApp/>}/> */}
        {/* <Route path="/capex-forecasting/data-viewer" element={<DataViewerPage />} /> */}
        <Route path="/yachiyo/*" element={<YachiyoRoot/>}/>
        {/* <Route path="/yachiyo" element={<App_Yachiyo/>}/> */}
      </Routes>
    </BrowserRouter>
  );
}
 
export default App;
 
// Developed By Raj Maurya