import Button from "../Button";

const PulseHR = () => {
  return (
    <div className="bg-[#F5F5F7] p-8 md:p-14 rounded-3xl mb-4 text-left">
      
      {/* Button */}
      <div className="flex justify-center items-center mb-6">
        <Button text="See Demo" link="http://10.245.146.250:8796/" />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        AI-Powered HR Assistant Bot
      </h2>

      {/* Purpose */}
      <h3 className="text-xl font-bold text-gray-800 mb-4">Purpose</h3>
      <p className="text-neutral-800 text-base md:text-lg max-w-6xl mb-6">
        Modern HR departments face increasing demands for real-time responses and efficient handling of employee queries.
        Traditional systems often fall short due to limited scalability and manual workload. The HR Bot leverages advanced AI and NLP
        to automate query resolution, streamline HR processes, and enhance employee experience—without the need for constant manual oversight.
      </p>

      {/* Expected Benefits */}
      <h3 className="text-xl font-bold text-gray-800 mb-4">Expected Benefits</h3>
      <ul className="text-neutral-700 text-lg text-left max-w-6xl space-y-2">
        <li><strong>24/7 Availability:</strong> Responds to employee queries round-the-clock.</li>
        <li><strong>Reduced Workload:</strong> Automates repetitive HR tasks, saving valuable HR bandwidth.</li>
        <li><strong>Consistency:</strong> Ensures uniform and accurate responses to all employees.</li>
        <li><strong>Scalable Support:</strong> Easily adapts to growing workforce needs.</li>
      </ul>

      {/* Key Use Cases */}
      <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">Key Use Cases</h3>
      <ul className="text-neutral-800 text-lg text-left max-w-6xl space-y-2">
        <li><strong>Automated Query Resolution:</strong> Answers FAQs on leave, payroll, policy, etc.</li>
        <li><strong>Onboarding Assistance:</strong> Guides new employees through onboarding steps.</li>
        <li><strong>Policy Retrieval:</strong> Instantly fetches HR documents or guidelines on demand.</li>
      </ul>
    </div>
  );
};

export default PulseHR;
