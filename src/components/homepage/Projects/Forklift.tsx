import Button from "../Button";
 
const Forklift = () => {
  return (
<div className="bg-[#F5F5F7] p-8 md:p-14 rounded-3xl mb-4 text-left">
      {/* Button */}
<div className="flex justify-center items-center mb-6">
<Button text="See Demo" link="http://10.245.146.250:5009/" />
</div>
 
      {/* Title */}
<h2 className="text-2xl font-semibold text-gray-900 mb-4">
         Forklift Safety Monitoring System – Smart AI surveillance for safer, faster, and more compliant warehouse operations.
</h2>
 
      {/* Overview */}
<h3 className="text-xl font-bold text-gray-800 mb-4"> Overview</h3>
<p className="text-neutral-800 text-base md:text-lg max-w-6xl mb-6">
        Our Forklift Safety Monitoring System is an AI-powered real-time video analytics solution designed to enhance industrial safety by monitoring forklift activity, detecting license plates, estimating speed, and enforcing zone-based rules. The system leverages cutting-edge computer vision, OCR, and embedded optimization techniques for seamless deployment in constrained environments like the Jetson Nano.
</p>
 
      {/* Key Features */}
<h3 className="text-xl font-bold text-gray-800 mb-4">Key Features</h3>
<ul className="text-neutral-700 text-lg text-left max-w-6xl space-y-2">
<li><strong>Real-time Detection:</strong> Forklift detection using YOLO models.</li>
<li><strong>License Plate Recognition:</strong> Custom OCR pipeline for accurate results.</li>
<li><strong>Speed Estimation:</strong> Tracks motion and calculates real-time speed.</li>
<li><strong>Zone-Based Monitoring:</strong> Only triggers OCR inside designated areas.</li>
<li><strong>Edge-Optimized:</strong> Runs efficiently on Jetson Nano and similar devices.</li>
</ul>
 
      {/* Benefits */}
<h3 className="text-xl font-bold text-gray-800 mt-8 mb-4"> Benefits</h3>
<ul className="text-neutral-700 text-lg text-left max-w-6xl space-y-2">
<li><strong>Enhanced Safety:</strong> Detects unsafe speed or unauthorized forklift usage.</li>
<li><strong>Compliance Monitoring:</strong> Enforces SOPs and safety zones.</li>
<li><strong>Offline Capable:</strong> Low-latency edge performance without cloud dependency.</li>
<li><strong>Easy Integration:</strong> Connects with existing warehouse camera systems.</li>
</ul>
 
      {/* Closing */}
<h3 className="text-xl font-bold text-gray-800 mt-8 mb-4"> Why It Matters</h3>
<p className="text-neutral-800 text-base md:text-lg max-w-6xl mb-3">
        Empower your warehouse with AI — ensure forklift safety before accidents happen.
</p>
</div>
  );
};
 
export default Forklift;