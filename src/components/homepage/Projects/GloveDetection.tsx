// import Lottie from "lottie-react";
// import animationData from "../../../assets/animations/Glove-animation.json"; 
import Button from "../Button"// Update path to your Lottie JSON file

const Glove = () => {
  return (
    <div className="bg-[#F5F5F7] p-8 md:p-14 rounded-3xl mb-4 text-left">

        {/* Button */}
      <div className="flex justify-center items-center mb-6">
      <Button text="See Demo" link="http://10.245.146.250:5006/" />
</div>

      {/* Title */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        AI-Based Foolproofing System - Ensuring SOP Compliance and Safe Machine Operation
      </h2>

      {/* Description */}
      <p className="text-neutral-800 text-base md:text-lg max-w-6xl mb-6">
        Workplace safety is paramount. Our AI-powered foolproofing system ensures operators follow safety protocols before machine activation, reducing risks and improving compliance.
        By verifying procedural steps, the system minimizes human errors and maintains standardized processes across operations, ensuring consistent performance and adherence to industry best practices.
        </p>

      {/* Key Features & Benefits */}
      <h3 className="text-xl font-bold text-gray-800 mb-4">Key Features & Benefits</h3>
      <ul className="text-neutral-700 text-lg text-left max-w-6xl space-y-2">
        <li><strong>Workplace Safety:</strong> Ensures operators follow safety protocols before machine activation.</li>
        <li><strong>Error Prevention:</strong> Verifies procedural steps to reduce human errors.</li>
        <li><strong>Standardized Processes:</strong> Maintains consistency across operations.</li>
        <li><strong>Real-Time Monitoring and Alerts:</strong> Detects and reports SOP deviations instantly.</li>
        <li><strong>Reduced Downtime:</strong> Prevents machine failures caused by improper handling.</li>
        <li><strong>Seamless Integration:</strong> Works with IoT-enabled machines, PLCs, and MES for intelligent automation.</li>
      </ul>

      {/* Why It Matters */}
      <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">Why It Matters</h3>
      <p className="text-neutral-800 text-base md:text-lg max-w-6xl mb-3">
        Non-compliance with standard operating procedures can lead to safety risks and operational inefficiencies. Our AI-powered foolproofing system ensures compliance, minimizes errors, and enhances productivity, fostering a safer and more efficient work environment.
      </p>

<div className="flex justify-center items-center mt-6">
      
</div>
{/* <div className="w-full md:w-1/3 mx-auto">
        <Lottie animationData={animationData} loop autoplay />
      </div> */}
    </div>
  );
};

export default Glove;