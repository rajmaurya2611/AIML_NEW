// import Lottie from "lottie-react";
// import animationData from "../../../assets/animations/clause-animation.json"; 
import Button from "../../Button"; // Update path to your Lottie JSON file

const MNA = () => {
  return (
    <div className="bg-[#F5F5F7] p-8 md:p-14 rounded-3xl mb-4 text-left">

      {/* Button */}
      <div className="flex justify-center items-center mb-6">
      <Button text="Visit LegalLens AI" link="/legallens" />
    </div>

      {/* Title */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        AI-Powered Legal Contract Analysis – Legal Lens AI
      </h2>

      {/* Purpose */}
      <h3 className="text-xl font-bold text-gray-800 mb-4">Purpose</h3>
      <p className="text-neutral-800 text-base md:text-lg max-w-6xl mb-6">
        Extracting insights and comparing terms from lengthy merger and acquisition contracts (100+ pages) is time-consuming and prone to human error.
        Our AI-powered Legal Lens solution leverages Retrieval-Augmented Generation (RAG) and LLMs to enable fast, accurate querying and automatic comparison of contracts, highlighting key differences and favorable terms.
      </p>

      {/* Expected Benefits */}
      <h3 className="text-xl font-bold text-gray-800 mb-4">Expected Benefits</h3>
      <ul className="text-neutral-700 text-lg text-left max-w-6xl space-y-2">
        <li><strong>Time Efficiency & Cost Savings:</strong> Rapidly locate and extract critical contract clauses, reducing manual review efforts.</li>
        <li><strong>Enhanced Accuracy & Clarity:</strong> Leverage advanced AI to identify risks, flag non-standard provisions, and objectively compare terms.</li>
        <li><strong>Improved Decision-Making:</strong> Support due diligence, negotiation, and compliance through data-driven insights and visual side-by-side comparisons.</li>
      </ul>

      {/* Key Use Cases */}
      <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">Key Use Cases</h3>
      <ul className="text-neutral-800 text-lg text-left max-w-6xl space-y-2">
        <li><strong>Due Diligence Analysis:</strong> Quickly retrieve and summarize key clauses (e.g., warranties, liabilities).</li>
        <li><strong>Risk Assessment:</strong> Identify high-risk terms and compliance issues across contracts.</li>
        <li><strong>Negotiation Support:</strong> Prepare effective negotiation strategies based on clear comparisons.</li>
        <li><strong>Contract Standardization:</strong> Ensure adherence to internal and industry standards by highlighting deviations.</li>
        <li><strong>Executive Reporting:</strong> Generate concise summary reports for informed decision-making.</li>
      </ul>

      

      {/* Lottie Animation */}
      {/* <div className="w-full md:w-1/3 mx-auto mt-20">
        <Lottie animationData={animationData} loop autoplay />
      </div> */}
    </div>
  );
};

export default MNA;
