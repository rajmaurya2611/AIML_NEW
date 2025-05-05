import Button from "../Button"; // Update path to your Lottie JSON file

const MothersonBot = () => {
  return (
    <div className="bg-[#F5F5F7] p-8 md:p-14 rounded-3xl mb-4 text-left">
      {/* Button */}
      <div className="flex justify-center items-center mb-6">
        <Button text="Visit KnowledgeKingdom" link="http://10.245.146.250:8794/" />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        AI-Powered Knowledge-Based Bot – Motherson Knowledge AI
      </h2>

      {/* Purpose */}
      <h3 className="text-xl font-bold text-gray-800 mb-4">Purpose</h3>
      <p className="text-neutral-800 text-base md:text-lg max-w-6xl mb-6">
        Accessing and retrieving relevant organizational knowledge from vast marketing data, historical records, and global policies is often inefficient and time-consuming.
        The AI-powered Motherson Knowledge AI bot leverages NLP, Generative AI (LLM), and Vector Databases to provide precise, context-aware responses while maintaining data security and compliance.
      </p>

      {/* Expected Benefits */}
      <h3 className="text-xl font-bold text-gray-800 mb-4">Expected Benefits</h3>
      <ul className="text-neutral-700 text-lg text-left max-w-6xl space-y-2">
        <li><strong>Time Efficiency & Productivity:</strong> Enables quick and accurate access to organizational knowledge, reducing manual effort.</li>
        <li><strong>Enhanced Accuracy & Relevance:</strong> Provides intelligent, context-specific responses using Motherson’s marketing data and policies.</li>
        <li><strong>Secure & Compliant:</strong> Operates within Motherson’s data framework, ensuring strict adherence to security and compliance standards.</li>
        <li><strong>Improved Decision-Making:</strong> Supports teams by delivering well-structured, reliable insights tailored to business needs.</li>
      </ul>

      {/* Key Use Cases */}
      <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">Key Use Cases</h3>
      <ul className="text-neutral-800 text-lg text-left max-w-6xl space-y-2">
        <li><strong>Knowledge Retrieval:</strong> Provides instant, data-driven answers based on marketing records, global policies, and historical data.</li>
        <li><strong>Compliance & Policy Guidance:</strong> Ensures responses align with internal guidelines and regulatory standards.</li>
        <li><strong>Decision Support:</strong> Assists teams in making informed business decisions with AI-driven insights.</li>
        <li><strong>Marketing & Communication Efficiency:</strong> Streamlines access to organizational data, enhancing content creation and strategy development.</li>
      </ul>
    </div>
  );
};

export default MothersonBot;

