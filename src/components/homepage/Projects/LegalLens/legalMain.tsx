import { useNavigate } from "react-router-dom";
import Logo from "./assets_legal/logo.png";
import AnalysisImage from "./assets_legal/analysis_image.jpg";
import ComparisonImage from "./assets_legal/comparison_image.jpg";
// import { CardContainer, CardBody, CardItem } from "../components/ui/3d-card";
import HeroImage from "./assets_legal/Hero Image.svg";
import Navbar from "./Navbar";
import "./LegalLens_custom.css";
 
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
  ];
 
  return (
    <div className="legal-lens">
      {/* Navbar at the top */}
      <Navbar />
      <div
        className="min-h-screen w-full bg-center bg-no-repeat flex flex-col items-center justify-center relative"
        style={{ backgroundImage: `url(${HeroImage})` }}
      >
        {/* Black Overlay */}
        <div className="absolute" />
 
        {/* Logo in top-left */}
        <img src={Logo} alt="Logo" className="absolute top-6 left-6 w-40 z-10" />
 
        {/* Main Content */}
        <main className="p-8 relative z-10 w-full max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-2">LegalLens AI</h1>
          <p className="text-center font-semibold  text-lg text-gray-400 mb-10">
            Contract Intelligence at a Glance...
          </p>
 
          <div className="cards-wrapper">
            {cards.map((card, index) => (
             <div key={index} className="inter-var">
             <div className="card-main">
               
               <div className="card-wrapper-main">
                 <div className="card-wrapper-main-texts">
                  <h3
                    className="text-lg font-medium inner-card"
                    onClick={() => navigate(card.route)}
                  >
                    {card.title}
                  </h3>
            
                  <div className="inner-card">
                    {card.description}
                  </div>
                 </div>
           
                 <div className="card-img w-full mt-4 cursor-pointer">
                   <img
                     src={card.image}
                     alt={card.title}
                     className="rounded-xl"
                     onClick={() => navigate(card.route)}
                   />
                 </div>
               </div>
           
               {/* Bottom-right Visit button */}
               <div className="card-btn mt-auto flex justify-end">
                 <button
                   onClick={() => navigate(card.route)}
                   className="gradient-btn"
                 >
                   Visit
                 </button>
               </div>
             </div>
           </div>
           
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
