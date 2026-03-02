import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { authService } from "../services/authService.js";

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay },
  }),
};

const VendorRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    name: "",
    phone: "",
    email: "",
    password: "",
    location: "",
  });
  const [status, setStatus] = useState({ error: "", success: "" });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ error: "", success: "" });
    try {
      await authService.registerVendor({
        username: form.username,
        email: form.email,
        phone: form.phone,
        password: form.password,
        full_name: form.name,
        business_name: form.name,
        address: form.location,
      });
      setStatus({ error: "", success: "Registration successful. Please sign in." });
      navigate("/login");
    } catch (err) {
      setStatus({ error: err.message || "Registration failed.", success: "" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#8B5E3C] to-[#3E2C1C] text-white flex items-center justify-center px-6 py-10">
      <motion.div
        className="bg-[#4A2F20] w-full max-w-3xl rounded-2xl p-8 shadow-xl"
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <motion.div
          className="flex justify-between items-center mb-6"
          variants={fadeIn}
          initial="hidden"
          animate="show"
        >
          <h2 className="text-2xl font-bold text-orange-300">Register as Vendor</h2>
        </motion.div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Input Fields */}
          <motion.div variants={fadeIn} initial="hidden" animate="show" custom={0.1}>
            <label className="block mb-1 text-orange-200">Username:</label>
            <input
              type="text"
              name="username"
              required
              value={form.username}
              onChange={handleChange}
              className="w-full bg-yellow-100 text-black px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 hover:shadow-md transition"
            />
          </motion.div>

          <motion.div variants={fadeIn} initial="hidden" animate="show" custom={0.1}>
            <label className="block mb-1 text-orange-200">Name:</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full bg-yellow-100 text-black px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 hover:shadow-md transition"
            />
          </motion.div>

          <motion.div variants={fadeIn} initial="hidden" animate="show" custom={0.2}>
            <label className="block mb-1 text-orange-200">Phone:</label>
            <input
              type="tel"
              name="phone"
              required
              value={form.phone}
              onChange={handleChange}
              className="w-full bg-yellow-100 text-black px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 hover:shadow-md transition"
            />
          </motion.div>

          <motion.div variants={fadeIn} initial="hidden" animate="show" custom={0.3}>
            <label className="block mb-1 text-orange-200">Email:</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full bg-yellow-100 text-black px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 hover:shadow-md transition"
            />
          </motion.div>

          <motion.div variants={fadeIn} initial="hidden" animate="show" custom={0.4}>
            <label className="block mb-1 text-orange-200">Password:</label>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              className="w-full bg-yellow-100 text-black px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 hover:shadow-md transition"
            />
          </motion.div>

          {/* Location Field (centered) */}
          <motion.div
            className="md:col-span-2 flex justify-center"
            variants={fadeIn}
            initial="hidden"
            animate="show"
            custom={0.5}
          >
            <div className="w-full md:w-1/2">
              <label className="block mb-1 text-orange-200">Location:</label>
              <input
                type="text"
                name="location"
                required
                value={form.location}
                onChange={handleChange}
                className="w-full bg-yellow-100 text-black px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 hover:shadow-md transition"
              />
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            className="md:col-span-2 flex justify-center"
            variants={fadeIn}
            initial="hidden"
            animate="show"
            custom={0.6}
          >
            {status.error && <p className="mb-4 text-sm text-red-300">{status.error}</p>}
            {status.success && <p className="mb-4 text-sm text-green-300">{status.success}</p>}
          </motion.div>

          <motion.div
            className="md:col-span-2 flex justify-center"
            variants={fadeIn}
            initial="hidden"
            animate="show"
            custom={0.7}
          >
            <motion.button
              type="submit"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-orange-400 hover:bg-orange-500 text-white font-semibold py-3 px-10 rounded-lg shadow-md hover:shadow-xl transition-all duration-300"
            >
              Register
            </motion.button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default VendorRegister;
