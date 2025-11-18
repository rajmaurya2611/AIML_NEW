import Button from "../../Button";
 
const Yachiyo = () => {
  return (
<div className="bg-[#F5F5F7] p-8 md:p-14 rounded-3xl mb-4 text-left">
      {/* Button */}
<div className="flex justify-center items-center mb-6">
<Button text="Visit Yachiyo" link="/yachiyo" />
</div>
 
      {/* Title */}
<h2 className="text-2xl font-semibold text-gray-900 mb-4">
        AI-Powered HR & Compliance Assistant
</h2>
 
      {/* Purpose */}
<h3 className="text-xl font-bold text-gray-800 mb-4">Purpose</h3>
<p className="text-neutral-800 text-base md:text-lg max-w-6xl mb-6">
       Employees often face difficulty finding the correct internal HR procedures and
        policy details buried in lengthy company documents. The Yachiyo Bot leverages 
        Retrieval Augmented Generation and Large Language Models to deliver instant, 
        accurate, and bilingual (English & Japanese) answers to company policy and 
        HR-related queries ensuring consistent and compliant communication across the organization.
</p>
 
      {/* Expected Benefits */}
<h3 className="text-xl font-bold text-gray-800 mb-4">Expected Benefits</h3>
<ul className="text-neutral-700 text-lg text-left max-w-6xl space-y-2">
<li><strong>Improved Efficiency & Accessibility: </strong> Employees can instantly retrieve answers to HR or internal regulation queries without searching through lengthy manuals.</li>
<li><strong>Policy Compliance & Consistency: </strong> Ensures that responses are fully aligned with official company regulations, reducing misinformation risk.</li>
<li><strong>Smart Query Understanding: </strong> Handles a range of question types from simple to complex and recognizes when information is not available in the document.</li>
<li><strong>Scalable & Secure Integration: </strong> Easily extended to other departments or document types while maintaining internal data security.</li>
</ul>
 
      {/* Key Functionalities */}
<h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">Key Use Cases</h3>
<ul className="text-neutral-800 text-lg text-left max-w-6xl space-y-2">
<li><strong>HR Policy Inquiry: </strong> Employees can ask about leave rules, resignation processes, benefits, or company procedures.</li>
<li><strong>Compliance Guidance: </strong> Provides regulation-based responses to ensure internal and legal adherence.</li>
<li><strong>Bilingual Communication: </strong> Seamlessly supports both English and Japanese, enabling smooth interaction for a diverse workforce.</li>
<li><strong>Employee Support: </strong> Answers everyday workplace questions in natural language, improving employee experience.</li>
</ul>
</div>
  );
};
 
export default Yachiyo;