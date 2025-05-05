import Button from "../Button";
 
const KIPBot = () => {
  return (
<div className="bg-[#F5F5F7] p-8 md:p-14 rounded-3xl mb-4 text-left">
      {/* Button */}
<div className="flex justify-center items-center mb-6">
<Button text="Visit KIP Bot" link="http://10.245.146.250:5008/" />
</div>
 
      {/* Title */}
<h2 className="text-2xl font-semibold text-gray-900 mb-4">
        AI-Powered Intellectual Property Assistant – Knowledge IP Bot
</h2>
 
      {/* Purpose */}
<h3 className="text-xl font-bold text-gray-800 mb-4">Purpose</h3>
<p className="text-neutral-800 text-base md:text-lg max-w-6xl mb-6">
        Managing and retrieving patent-related information efficiently can be complex and time-consuming.
        The AI-powered Knowledge IP Bot streamlines the patent process by integrating chatbots, a knowledge base, and real-time user interaction.
        It leverages NLP, Generative AI, and a structured database to provide precise and insightful responses.
</p>
 
      {/* Expected Benefits */}
<h3 className="text-xl font-bold text-gray-800 mb-4">Expected Benefits</h3>
<ul className="text-neutral-700 text-lg text-left max-w-6xl space-y-2">
<li><strong>Efficient Patent Assistance:</strong> Provides step-by-step guidance for patent submission and process understanding.</li>
<li><strong>Real-Time Knowledge Access:</strong> Instantly retrieves patent-related documents and structured data.</li>
<li><strong>Smart Query Resolution:</strong> AI-driven chatbot offers accurate answers to IP-related inquiries.</li>
<li><strong>Data Security & Compliance:</strong> Ensures patent information is handled securely within a structured framework.</li>
</ul>
 
      {/* Key Functionalities */}
<h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">Key Functionalities</h3>
<ul className="text-neutral-800 text-lg text-left max-w-6xl space-y-2">
<li><strong>Chatbots:</strong> Dedicated chatbots for patent process guidance and patent information retrieval.</li>
<li><strong>Knowledge Base:</strong> Admins can upload documents to create a structured patent knowledge repository.</li>
<li><strong>Training Data:</strong> Allows admins to add Q&A pairs for improved AI training and accuracy.</li>
<li><strong>Patent Database:</strong> Stores and manages essential patent-related data for easy access.</li>
<li><strong>Real-Time User Interaction:</strong> Enables users to upload documents and ask queries via chatbots.</li>
<li><strong>Feedback System:</strong> Collects real-time feedback from users to enhance performance and response accuracy.</li>
</ul>
</div>
  );
};
 
export default KIPBot;