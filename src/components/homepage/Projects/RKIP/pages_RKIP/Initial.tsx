// Initial.tsx
import React from "react";
import { motion } from "framer-motion";

export interface InitialProps {
  /**
   * Called when the user picks one of the options.
   * @param view  The top-level view key: "chat" | "database" | "trainingData" | etc.
   * @param sub   Optional sub-view, e.g. "patent" or "process" when view==="chat"
   */
  onSelect: (view: string, sub?: string) => void;
}

const Initial: React.FC<InitialProps> = ({ onSelect }) => {
  return (
    <div className="h-screen flex flex-col items-center justify-center space-y-8 bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-black">Welcome to KIP Bot!</h1>
      </motion.div>

      {/* <div className="flex flex-wrap gap-4">
        <button
          className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          onClick={() => onSelect("chat", "patent")}
        >
          Patent Chat
        </button>

        <button
          className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition"
          onClick={() => onSelect("chat", "process")}
        >
          Process Chat
        </button>

        <button
          className="px-6 py-3 bg-purple-500 text-white rounded hover:bg-purple-600 transition"
          onClick={() => onSelect("database")}
        >
          Database
        </button>

        <button
          className="px-6 py-3 bg-teal-500 text-white rounded hover:bg-teal-600 transition"
          onClick={() => onSelect("knowledgeBase")}
        >
          Knowledge Base
        </button>

        <button
          className="px-6 py-3 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
          onClick={() => onSelect("trainingData")}
        >
          Training Data
        </button>

        <button
          className="px-6 py-3 bg-red-500 text-white rounded hover:bg-red-600 transition"
          onClick={() => onSelect("feedback")}
        >
          Feedback
        </button>
      </div> */}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4">
  {/** Patent Chat Card **/}
  <div
    onClick={() => onSelect("chat", "patent")}
    className="cursor-pointer p-6 bg-white rounded-lg shadow hover:shadow-lg transition flex flex-col justify-between"
  >
    <h3 className="text-xl font-semibold mb-2 text-gray-800">
      Patent Chat
    </h3>
    <p className="text-gray-600 flex-grow">
      Ask questions and explore our patent knowledge base in real-time.
    </p>
  </div>

  {/** Process Chat Card **/}
  <div
    onClick={() => onSelect("chat", "process")}
    className="cursor-pointer p-6 bg-white rounded-lg shadow hover:shadow-lg transition flex flex-col justify-between"
  >
    <h3 className="text-xl font-semibold mb-2 text-gray-800">
      Process Chat
    </h3>
    <p className="text-gray-600 flex-grow">
      Get step-by-step AI guidance on patent filing and registration processes. Ideal for resolving process-related queries.
    </p>
  </div>

  {/** Database Card **/}
  <div
    onClick={() => onSelect("database")}
    className="cursor-pointer p-6 bg-white rounded-lg shadow hover:shadow-lg transition flex flex-col justify-between"
  >
    <h3 className="text-xl font-semibold mb-2 text-gray-800">
      Database
    </h3>
    <p className="text-gray-600 flex-grow">
      Upload, manage, and query structured patent data
    </p>
  </div>

  {/** Knowledge Base Card **/}
  <div
    onClick={() => onSelect("knowledgeBase")}
    className="cursor-pointer p-6 bg-white rounded-lg shadow hover:shadow-lg transition flex flex-col justify-between"
  >
    <h3 className="text-xl font-semibold mb-2 text-gray-800">
      Knowledge Base
    </h3>
    <p className="text-gray-600 flex-grow">
      Review and manage datasets for process data
    </p>
  </div>

  {/** Training Data Card **/}
  <div
    onClick={() => onSelect("trainingData")}
    className="cursor-pointer p-6 bg-white rounded-lg shadow hover:shadow-lg transition flex flex-col justify-between"
  >
    <h3 className="text-xl font-semibold mb-2 text-gray-800">
      Training Data
    </h3>
    <p className="text-gray-600 flex-grow">
      Manage and review datasets used to train your AI models.
    </p>
  </div>

  {/** Feedback Card **/}
  <div
    onClick={() => onSelect("feedback")}
    className="cursor-pointer p-6 bg-white rounded-lg shadow hover:shadow-lg transition flex flex-col justify-between"
  >
    <h3 className="text-xl font-semibold mb-2 text-gray-800">
      Feedback
    </h3>
    <p className="text-gray-600 flex-grow">
      Submit feedback to help us improve system performance and enhance user experience.
    </p>
  </div>
</div>

    </div>
  );
};

export default Initial;
