import Button from "../Button"; // Update path to your Lottie JSON file

const PersonaBot = () => {
  return (
    <div className="bg-[#F5F5F7] p-8 md:p-14 rounded-3xl mb-4 text-left">
      {/* Button */}
      <div className="flex justify-center items-center mb-6">
        <Button text="Visit PersonaPrime" link="http://10.245.146.157:8795/" />
      </div>

      {/* Title */}
      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
        AI-Powered Persona Bot – Personalized Communication AI
      </h2>

      {/* Purpose */}
      <h3 className="text-xl font-bold text-gray-800 mb-4">Purpose</h3>
      <p className="text-neutral-800 text-base md:text-lg max-w-6xl mb-6">
        Creating personalized content that matches an individual’s unique communication style can be challenging and time-intensive. 
        The AI-powered Persona Bot leverages NLP, Generative AI (LLM), and Emotional AI to analyze personal data and generate tailored outputs. 
        By mimicking the tone, style, and vocabulary of an individual, the bot ensures seamless and authentic content creation for various communication needs.
      </p>

      {/* Expected Benefits */}
      <h3 className="text-xl font-bold text-gray-800 mb-4">Expected Benefits</h3>
      <ul className="text-neutral-700 text-lg text-left max-w-6xl space-y-2">
        <li><strong>Authentic & Personalized Communication:</strong> Generates content that aligns with an individual’s unique style, tone, and emotional patterns.</li>
        <li><strong>Enhanced Efficiency & Consistency:</strong> Automates the creation of posts, press releases, articles, speeches, and social media updates while maintaining consistency.</li>
        <li><strong>Privacy & Security:</strong> Operates exclusively on trained personal data with strict adherence to data privacy and security measures.</li>
        <li><strong>Scalable & Versatile:</strong> Supports multiple content formats and communication channels, enabling efficient, high-quality output.</li>
      </ul>

      {/* Key Use Cases */}
      <h3 className="text-xl font-bold text-gray-800 mt-8 mb-4">Key Use Cases</h3>
      <ul className="text-neutral-800 text-lg text-left max-w-6xl space-y-2">
        <li><strong>Personalized Content Generation:</strong> Creates blog posts, press releases, and articles in the individual’s writing style.</li>
        <li><strong>Speech & Meeting Assistance:</strong> Generates speeches, meeting notes, and responses that reflect personal communication patterns.</li>
        <li><strong>Social Media Automation:</strong> Crafts posts and updates tailored to the user’s voice for platforms like LinkedIn and Twitter.</li>
        <li><strong>Brand & Executive Communication:</strong> Ensures leaders and influencers maintain a consistent and impactful public presence.</li>
      </ul>
    </div>
  );
};

export default PersonaBot;
