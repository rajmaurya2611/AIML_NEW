import { useNavigate } from "react-router-dom";
import Logo from "./assets_legal/logo.png";
import AnalysisImage from "./assets_legal/analysis_image.jpg";
import ComparisonImage from "./assets_legal/comparison_image.jpg";
import RiskAnalysisImage from "./assets_legal/risk_analysis_image.jpg";
import ClauseCheckImage from "./assets_legal/clause_check_image.jpg";
import { CardContainer, CardBody, CardItem } from "./3d-card";
import HeroImage from "./assets_legal/Hero Image.png";
 
export default function HomePage() {
  const navigate = useNavigate();
 
  const cards = [
    {
      title: "Analysis",
      image: AnalysisImage,
      description: "Smart contract content and structure analysis.",
      route: "/legallens/analysis",
    },
    {
      title: "Comparison",
      image: ComparisonImage,
      description: "Compare across multiple contracts and versions.",
      route: "/legallens/comparison",
    },
    {
      title: "Risk Analysis",
      image: RiskAnalysisImage,
      description: "Comprehensive analysis of potential risks associated with the document.",
      route: "/legallens/risk_analysis",
    },
    {
      title: "Clause Check",
      image: ClauseCheckImage,
      description: "Check for missing and incomplete clauses.",
      route: "/legallens/clause",
    },
  ];
 
  return (
    <div
      className="min-h-screen w-full bg-cover bg-center flex flex-col items-center justify-center relative"
      style={{ backgroundImage: `url(${HeroImage})` }}
    >
      {/* Black Overlay */}
      <div className="absolute inset-0 bg-black opacity-50 z-0" />
 
      {/* Logo in top-left */}
      <img src={Logo} alt="Logo" className="absolute top-6 left-6 w-40 z-10" />
 
      {/* Main Content */}
      <main className="p-8 relative z-10">
        <h1 className="text-4xl font-bold text-center text-gray-100 mb-2">Legallens AI</h1>
        <p className="text-center font-semibold  text-lg text-gray-400 mb-10">
          Contract Intelligence at a Glance...
        </p>
 
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 max-w-7xl mx-auto">
          {cards.map((card, index) => (
           <CardContainer key={index} className="inter-var">
           <CardBody className="flex flex-col justify-between bg-gray-800 border border-white/[0.2] dark:border-white/[0.2] w-full rounded-xl p-6 transition-shadow duration-300 hover:shadow-[0_0_20px_rgba(23,236,236,0.8)] h-full">
             
             <div>
               <CardItem
                 translateZ="50"
                 className="text-xl font-bold text-white cursor-pointer"
                 onClick={() => navigate(card.route)}
               >
                 {card.title}
               </CardItem>
         
               <CardItem
                 as="p"
                 translateZ="60"
                 className="text-gray-300 text-sm mt-2"
               >
                 {card.description}
               </CardItem>
         
               <CardItem translateZ="100" className="w-full mt-4 cursor-pointer">
                 <img
                   src={card.image}
                   alt={card.title}
                   className="h-48 w-full object-cover rounded-xl"
                   onClick={() => navigate(card.route)}
                 />
               </CardItem>
             </div>
         
             {/* Bottom-right Visit button */}
             <div className="mt-auto flex justify-end pt-6">
               <button
                 onClick={() => navigate(card.route)}
                 className="text-white bg-gradient-to-r from-red-500 via-pink-500 to-blue-500  px-4 py-2 rounded-md text-sm font-semibold transition"
               >
                 Visit
               </button>
             </div>
           </CardBody>
         </CardContainer>
         
          ))}
        </div>
      </main>
    </div>
  );
 
}