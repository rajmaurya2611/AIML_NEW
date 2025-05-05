import Button from "../Button";

const DS = () => {
  return (
    <div className="bg-[#F5F5F7] p-8 md:p-14 rounded-3xl mb-4 text-left">

      {/* Button */}
      <div className="flex justify-center items-center mb-6">
        <Button text="Visit ProfitPulse" link="http://10.245.146.250:8795/" />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        Profit Pulse Dashboard
      </h2>

      {/* Description */}
      <p className="text-neutral-800 text-base md:text-lg max-w-6xl mb-6">
        Our Prototype Profit Pulse Dashboard of a business is designed to provide key insights into financial efficiency, helping businesses make data-driven decisions on driving profitability. This dashboard presents a structured analysis of critical performance indicators of driving plant profitability across various dimensions such as customers, programs, FG (finished goods) family, and parts.
      </p>

      {/* Features */}
      <h3 className="text-xl font-bold text-gray-800 mb-4">Features</h3>
      <ul className="text-neutral-800 text-lg text-left max-w-6xl space-y-2 list-disc pl-6 mb-6">
        <li>
          <strong>Holistic Financial Analysis:</strong> Enables businesses to track revenue, raw material percentage, contribution amount, and benchmark gap effectively.
        </li>
        <li>
          <strong>Benchmarking & Performance Tracking:</strong> Enables users to choose their benchmark percentage and highlights gaps between contribution amount and benchmark for strategic adjustments.
        </li>
        <li>
          <strong>Multi-Dimensional Drill-Downs:</strong> Provides granular insights by plant, customer, program, FG family, and part, allowing targeted decision-making.
        </li>
        <li>
          <strong>Data-Driven Decision Making:</strong> Supports leadership in identifying cost-saving opportunities and optimizing profitability.
        </li>
      </ul>

      {/* Summary Line at the Bottom */}
      <p className="text-neutral-800 text-base md:text-lg max-w-6xl">
        This dashboard serves as a valuable tool for finance, operations, and supply chain teams, fostering efficiency and profitability through performance tracking and data analytics.
      </p>

      {/* Optional: Lottie Animation Placeholder */}
      {/* <div className="w-full md:w-1/3 mx-auto mt-12">
        <Lottie animationData={animationData} loop autoplay />
      </div> */}
    </div>
  );
};

export default DS;
