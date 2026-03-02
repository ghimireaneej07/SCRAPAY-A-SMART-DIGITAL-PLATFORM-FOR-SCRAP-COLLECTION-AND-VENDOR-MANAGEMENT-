import React from "react";
import { motion } from "framer-motion";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8B5E3C] to-[#A1623C] text-white font-serif px-6 py-10">
      {/* Page Header */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-extrabold text-orange-300 mb-10 text-center tracking-wide"
      >
        ♻️ About Scrapay
      </motion.h1>

      <div className="space-y-10 max-w-4xl mx-auto">
        {/* Mission Section */}
        <motion.section
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-[#C48C59] bg-opacity-20 p-6 rounded-xl shadow-lg backdrop-blur-md hover:scale-[1.01] transition"
        >
          <h2 className="text-2xl font-bold mb-2 text-orange-100">🌍 Our Mission</h2>
          <p className="text-md leading-relaxed">
            Scrapay is a smart waste management platform that connects users with trusted vendors for
            efficient scrap collection and recycling. Our mission is to promote eco-friendly practices
            through seamless scrap selling.
          </p>
        </motion.section>

        {/* How It Works */}
        <motion.section
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-[#C48C59] bg-opacity-20 p-6 rounded-xl shadow-lg backdrop-blur-md hover:scale-[1.01] transition"
        >
          <h2 className="text-2xl font-bold mb-2 text-orange-100">🔧 How Scrapay Works</h2>
          <ol className="list-decimal ml-6 space-y-1 text-md">
            <li><span className="font-semibold">Select Your Scrap</span> – Choose from plastic, paper, metal, etc.</li>
            <li><span className="font-semibold">Find a Vendor</span> – Nearby vendors with ratings & reviews.</li>
            <li><span className="font-semibold">Schedule Pickup</span> – Choose your preferred time.</li>
            <li><span className="font-semibold">Get Paid</span> – Instant payment based on live market rates.</li>
          </ol>
        </motion.section>

        {/* Who Can Use */}
        <motion.section
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-[#C48C59] bg-opacity-20 p-6 rounded-xl shadow-lg backdrop-blur-md hover:scale-[1.01] transition"
        >
          <h2 className="text-2xl font-bold mb-2 text-orange-100">💼 Who Can Use Scrapay?</h2>
          <ul className="list-disc ml-6 space-y-1 text-md">
            <li>Households looking to sell waste responsibly</li>
            <li>Offices, schools & colleges with recurring scrap</li>
            <li>Industries producing recyclable waste</li>
          </ul>
        </motion.section>

        {/* Why Choose */}
        <motion.section
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="bg-[#C48C59] bg-opacity-20 p-6 rounded-xl shadow-lg backdrop-blur-md hover:scale-[1.01] transition"
        >
          <h2 className="text-2xl font-bold mb-2 text-orange-100">📈 Why Choose Scrapay?</h2>
          <ul className="list-disc ml-6 space-y-1 text-md">
            <li>Live scrap market pricing via real-time API</li>
            <li>User-friendly experience & attractive UI</li>
            <li>Vendor ratings, maps & smart selection</li>
            <li>Eco-conscious initiative with impact</li>
          </ul>
        </motion.section>
      </div>
    </div>
  );
};

export default About;
