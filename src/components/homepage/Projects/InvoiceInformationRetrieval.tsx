// import Lottie from "lottie-react";
// import animationData from "../../../assets/animations/clause-animation.json"; 
import Button from "../Button"; // Update path to your Lottie JSON file

const  InvoiceInformationRetrieval = () => {
  return (
    <div className="bg-[#F5F5F7] p-8 md:p-14 rounded-3xl mb-4 text-left">

      {/* Button */}
      <div className="flex justify-center items-center mb-6">
        <Button text="Visit ExtractEdge" link="http://10.245.146.250:8785/" />
      </div>


      {/* Title */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
       AI-Powered Invoice Extraction System
      </h2>

      {/* Purpose */}
      <h3 className="text-xl font-bold text-gray-800 mb-4">Purpose</h3>
      <p className="text-neutral-800 text-base md:text-lg max-w-6xl mb-6">
      Many organizations use OCR technology to extract key details from invoices. OCR works on various documents but requires a proper pre-training and compromises in accuracy. ExtractEdge enhances data extraction from even the most complex invoices, ensuring greater accuracy and efficiency without any pre-training.
      </p>

      {/* Expected Benefits */}
      <h3 className="text-xl font-bold text-gray-800 mb-4">Expected Benefits</h3>
      <ul className="text-neutral-700 text-lg text-left max-w-6xl space-y-2">
        <li><strong>Scalability:</strong> Handles increasing invoice volumes effortlessly.</li>
        <li><strong>Faster Processing Time:</strong> Accelerates invoice data extraction.</li>
        {/* <li><strong>Seamless Integration:</strong> Easily connects with financial systems.</li> */}
        <li><strong>Reduced Manual Errors:</strong> Minimizes human data entry mistakes.</li>
        <li><strong>Real-Time Data Access:</strong> Provides instant access to extracted data.</li>
      </ul>

      {/* Key Use Cases */}
      <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">Key Use Cases</h3>
      <ul className="text-neutral-800 text-lg text-left max-w-6xl space-y-2">
        <li><strong>Automated Invoice Processing:</strong> Streamlines invoice data extraction.</li>
        <li><strong>Multi-Format Compatibility:</strong> Supports diverse invoice formats.</li>
        {/* <li><strong>Tax & Compliance Validation:</strong> Ensures regulatory adherence.</li>
        <li><strong>Accounts Payable Automation:</strong> Optimizes payment and approval workflows.</li>
        <li><strong>Financial Reporting & Audit:</strong> Enhances data accuracy for reporting.</li> */}
      </ul>


      {/* Lottie Animation */}
      {/* <div className="w-full md:w-1/3 mx-auto mt-20">
        <Lottie animationData={animationData} loop autoplay />
      </div> */}
    </div>
  );
};

export default  InvoiceInformationRetrieval;
