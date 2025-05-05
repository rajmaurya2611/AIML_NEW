// import Lottie from "lottie-react";
// import animationData from "../../../assets/animations/Drawing-animation.json"; 
import Button from "../Button"; // Update path to your Lottie JSON file

const DrawingComparison = () => {
  return (
    <div className="bg-[#F5F5F7] p-8 md:p-14 rounded-3xl mb-4 text-left">

       {/* Button */}
       <div className="flex justify-center items-center mb-6">
        <Button text="Visit SketchSense" link="http://10.245.146.250:5001/" />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        AI-Based Engineering CAD Drawing Comparison
      </h2>

      {/* Description */}
      <p className="text-neutral-800 text-base md:text-lg max-w-6xl mb-6">
        Enhancing design accuracy and efficiency with AI-driven automated drawing comparison. Our solution instantly detects changes between CAD design versions, ensuring precision, reducing errors, and streamlining the review process.
      </p>

      {/* Key Features & Benefits */}
      <h3 className="text-xl font-bold text-gray-800 mb-4">Key Features & Benefits</h3>
      <ul className="text-neutral-700 text-lg text-left max-w-6xl space-y-2">
        <li><strong>Automated Change Detection:</strong> Instantly highlights modifications between design versions.</li>
        <li><strong>Precision and Accuracy:</strong> Ensures consistency and minimizes errors.</li>
        <li><strong>Time and Cost Savings:</strong> Reduces manual effort and rework.</li>
        <li><strong>Seamless Collaboration:</strong> Improves communication between design, engineering, and manufacturing teams.</li>
        <li><strong>Compliance and Quality Assurance:</strong> Validates design changes against industry standards.</li>
        <li><strong>Integration with CAD & PLM Systems:</strong> Connects with existing workflows for efficient automation.</li>
      </ul>

      {/* Why It Matters */}
      <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">Why It Matters</h3>
      <p className="text-neutral-800 text-base md:text-lg max-w-6xl mb-3">
        Manual comparison of engineering drawings is time-consuming and prone to errors. Our AI-powered solution improves accuracy, reduces risk, and accelerates design validation, making it an essential tool for modern engineering workflows.
      </p>


      {/* Lottie Animation */}
      {/* <div className="w-full md:w-1/3 mx-auto mt-20">
        <Lottie animationData={animationData} loop autoplay />
      </div> */}
    </div>
  );
};

export default DrawingComparison;
