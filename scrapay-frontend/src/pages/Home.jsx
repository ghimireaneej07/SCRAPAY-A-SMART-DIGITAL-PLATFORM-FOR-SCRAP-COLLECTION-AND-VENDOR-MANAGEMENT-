import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import scrapHero from "/assets/scrap-hero.png";
import { FaRecycle, FaHandshake, FaTruck } from "react-icons/fa";

const Home = () => {
  return (
    <>
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#8B5E3C] to-[#3E2C1C] min-h-screen text-white px-6 md:px-20 py-20 flex flex-col md:flex-row items-center justify-between gap-10 overflow-hidden">
        {/* Left Section */}
        <motion.div
          className="max-w-2xl text-center md:text-left"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight drop-shadow">
            <span className="text-orange-300">Got Scrap?</span> <br />
            We'll Take It With Care!
          </h1>

          <motion.p
            className="text-lg md:text-xl text-gray-200 mb-10 leading-relaxed"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
          >
            Welcome to <span className="font-bold text-orange-400">Scrapay</span>, your ultimate scrap selling partner. Instantly connect with local vendors, schedule pickups, and earn from your waste.
          </motion.p>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <Link
              to="/login"
              className="backdrop-blur-sm bg-orange-500/80 hover:bg-orange-600 text-white font-bold text-lg py-3 px-7 rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
            >
              Get Started Now
            </Link>
          </motion.div>
        </motion.div>

        {/* Right Section */}
        <motion.div
          className="flex justify-center md:justify-end"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="relative w-[280px] md:w-[500px]">
            <div className="absolute inset-0 bg-orange-300 rounded-full blur-3xl opacity-30 scale-110 z-0" />
            <img
              src={scrapHero}
              alt="Scrap delivery vehicle"
              className="relative z-10 w-full rounded-xl object-contain transition duration-500 hover:scale-105"
            />
          </div>
        </motion.div>
      </div>

      {/* Wave Transition */}
      <div className="relative bg-[#3E2C1C] overflow-hidden">
        <svg className="absolute -top-1 w-full h-12 text-[#3E2C1C]" viewBox="0 0 1440 100" preserveAspectRatio="none">
          <path
            fill="currentColor"
            d="M0,96L48,90.7C96,85,192,75,288,58.7C384,43,480,21,576,21.3C672,21,768,43,864,48C960,53,1056,43,1152,48C1248,53,1344,75,1392,85.3L1440,96L1440,160L1392,160C1344,160,1248,160,1152,160C1056,160,960,160,864,160C768,160,672,160,576,160C480,160,384,160,288,160C192,160,96,160,48,160L0,160Z"
          />
        </svg>

        {/* About Section */}
        <section id="about" className="relative z-10 bg-[#3E2C1C] text-gray-200 px-6 md:px-20 py-20">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-orange-400 mb-4 drop-shadow">
              Why Choose Scrapay?
            </h2>
            <p className="text-lg text-gray-300 max-w-3xl mx-auto">
              Scrapay bridges the gap between waste and worth — giving you a reliable, rewarding, and responsible way to dispose of scrap.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Card 1 */}
            <motion.div
              className="bg-[#4A2F20] p-6 rounded-xl shadow-lg hover:shadow-orange-500/30 transition-all duration-300 hover:scale-105"
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <FaRecycle className="text-4xl text-yellow-100 mb-4 drop-shadow-lg" />
              <h3 className="font-bold text-xl mb-2 text-orange-300">Eco-Friendly</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Recycle your scrap responsibly and contribute to a cleaner tomorrow. Let’s protect the planet together.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              className="bg-[#4A2F20] p-6 rounded-xl shadow-lg hover:shadow-orange-500/30 transition-all duration-300 hover:scale-105"
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <FaHandshake className="text-4xl text-yellow-100 mb-4 drop-shadow-lg" />
              <h3 className="font-bold text-xl mb-2 text-orange-300">Trusted Vendors</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                All vendors are verified and rated. Expect transparency, timely pickups, and honest payouts.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              className="bg-[#4A2F20] p-6 rounded-xl shadow-lg hover:shadow-orange-500/30 transition-all duration-300 hover:scale-105"
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              viewport={{ once: true }}
            >
              <FaTruck className="text-4xl text-yellow-100 mb-4 drop-shadow-lg" />
              <h3 className="font-bold text-xl mb-2 text-orange-300">Doorstep Pickup</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Book pickups from the comfort of your home. No hassle, no delay — just efficient scrap removal.
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;
