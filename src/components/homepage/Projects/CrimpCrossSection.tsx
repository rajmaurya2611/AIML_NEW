// import Lottie from "lottie-react";
// import animationData from "../../../assets/animations/Drawing-animation.json"; 
import Button from "../Button"; // Update path to your Lottie JSON file

const CrimpCrossSection = () => {
  return (
    <div className="bg-[#F5F5F7] p-8 md:p-14 rounded-3xl mb-4 text-left">

    {/* Button */}
    <div className="flex justify-center items-center mb-6">
        <Button text="Visit QualiSure" link="http://10.245.146.250:5004/" />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        AI-Based Inspection System
      </h2>

      {/* Description */}
      <p className="text-neutral-800 text-base md:text-lg max-w-6xl mb-6">
        Revolutionizing defect detection in manufacturing with AI-powered high-precision quality control. Our system ensures accurate, real-time defect detection, reducing costs and improving production efficiency.
      </p>

      {/* Key Features & Benefits */}
      <h3 className="text-xl font-bold text-gray-800 mb-4">Key Features & Benefits</h3>
      <ul className="text-neutral-700 text-lg text-left max-w-6xl space-y-2">
        <li><strong>High-Precision Quality Control:</strong> Detects defects such as cracks, misalignments, and surface irregularities.</li>
        <li><strong>Automated Inspections:</strong> Reduces dependency on manual checks and accelerates production.</li>
        <li><strong>Cost Reduction:</strong> Minimizes waste and rework by identifying defects early.</li>
        <li><strong>Real-Time Defect Analysis:</strong> Provides instant feedback for proactive decision-making.</li>
        <li><strong>Scalability and Consistency:</strong> Ensures standardized inspections across manufacturing operations.</li>
        <li><strong>Seamless Integration:</strong> Works with robotics, conveyor systems, and MES for automation.</li>
      </ul>

      {/* Why It Matters */}
      <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">Why It Matters</h3>
      <p className="text-neutral-800 text-base md:text-lg max-w-6xl mb-3">
        Traditional inspection methods are slow and inconsistent. AI-driven defect detection ensures higher quality, lower costs, and improved manufacturing efficiency, making it a crucial advancement for modern production lines.
      </p>

      {/* Lottie Animation */}
      {/* <div className="w-full md:w-1/3 mx-auto mt-20">
        <Lottie animationData={animationData} loop autoplay />
      </div> */}
    </div>
  );
};

export default CrimpCrossSection;
