"use client";
import { Carousel, Card } from "../../components/homepage/ui/apple-cards-carousel";
import smt_small from "../../assets/images/projects/Smart Extract/Smt_small.png";
import DrawingComparison from "./Projects/SketchSense/DrawingComparison";
import InvoiceInformationRetrieval from "./Projects/InvoiceInformationRetrieval";
import MNA from "./Projects/LegalLens/M&A";
import FinancialBot from "./Projects/BudgetBeacon/FinancialBot";
import ClauseLens from "../../assets/images/projects/MNA/ClauseLens_Small.png"
import Fin_small from "../../assets/images/projects/Finallytics/Fin_small.png"
import CrimpCrossSection from "./Projects/CrimpCrossSection";
import quali from "../../assets/images/projects/CrimpCrossSection/crimp_small.png"
import GloveDetection from "./Projects/GloveDetection/GloveDetection";
import DS from "./Projects/DataScience";
import Dwg from "../../assets/images/projects/DrawingComparison/Dwg_sm.png"
import Glove from "../../assets/images/projects/Glove Detection/Glove_sm.png"
import Raw from "../../assets/images/projects/Raw Material/Raw_sm.png"
import Mbimg from "../../assets/images/projects/MothersonBot/Motherson Bot.png"
import Pbimg from "../../assets/images/projects/PersonaBot/Persona small.png"
import MothersonBot from "./Projects/KnowledgeKingdom/MothersonBot";
import PersonaBot from "./Projects/PersonaPrime/PersonaBot";
import KIPimage from "../../assets/images/projects/KIPBot/KIPBot.png"
import KIPBot from "./Projects/KIPBot";
import Forklift from "./Projects/Safelift/Forklift";
import Forkliftimg from "../../assets/images/projects/Forklift/forklift_small.png"
import PulseHR from "./Projects/PulseHR";
import PulseHR_small from "../../assets/images/projects/PulseHR/PulseHR_small.png";

//import Forkliftcard from "./Projects/Forklift"
// import M_Translate from "../../assets/images/homepage/M translate.jpg"
// import DummyContent from "./Projects/DummyContent";
//import Glove from "../../assets/images/homepage/Glove.jpg"
// import Forklift from "../../assets/images/homepage/Forklift1.png"


export function AppleCardsCarouselDemo() {
  const cards = data.map((card, index) => (
    <Card key={card.src} card={card} index={index} layout={true} />
  ));

  return (
    <div className="w-full h-full pt-8 pb-20 bg-black flex flex-col items-center text-center">
  <h2 className="text-xl md:text-5xl font-poppins font-light text-white">
    Motherson Intelligence
  </h2>
  <Carousel items={cards} />
</div>

  );
}


const data = [
  {
    category: "",
    title: "SketchSense",
    src: Dwg, // Direct reference to imported image
    content: <DrawingComparison/>,
  },
  {
    category: "",
    title: "LegalLens",
    src: ClauseLens, // Direct reference to imported image
    content: <MNA />,
  },
  {
    category: "",
    title: "ProfitPulse",
    src: Raw, // Direct reference to imported image
    content: <DS/>
  },
  {
    category: "",
    title: "BudgetBeacon",
    src: Fin_small, // Direct reference to imported image
    content: <FinancialBot/>,
  },
  {
    category: "",
    title: "PulseHR",
    src: PulseHR_small, // Direct reference to imported image
    content: <PulseHR/>,
  },
  {
    category: "",
    title: "QualiSure",
    src: quali, // Direct reference to imported image
    content: <CrimpCrossSection/>
  },
  {
    category: "",
    title: "GloveGuardian",
    src: Glove, // Direct reference to imported image
    content: <GloveDetection/>
  },
  {
    category: "",
    title: "Safelift",
    src: Forkliftimg, // Direct reference to imported image
    content: <Forklift/>
  },
  {
    category: "",
    title: "KnowledgeKingdom",
    src: Mbimg, // Direct reference to imported image
    content: <MothersonBot/>
  },
  {
    category: "",
    title: "ExtractEdge",
    src: smt_small, // Direct reference to imported image
    content: <InvoiceInformationRetrieval />,
  },
  {
    category: "",
    title: "KIPBot",
    src: KIPimage, // Direct reference to imported image
    content: <KIPBot/>
  },
  {
    category: "",
    title: "PersonaPrime",
    src: Pbimg, // Direct reference to imported image
    content: <PersonaBot/>
  },
  
  
  // {
  //   category: "",
  //   title: "Translate Titan",
  //   src: M_Translate, // Direct reference to imported image
  //   content: <DummyContent />,
  // },
];
