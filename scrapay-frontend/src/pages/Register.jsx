import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    location: "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = (e) => {
    e.preventDefault();
    console.log("Registering:", form);
    // TODO: Submit data to backend
  };

  return (
    <div className="min-h-screen bg-[#8B5E3C] text-white px-4 py-8 flex flex-col items-center">
      {/* Back Button */}
      <div className="absolute top-4 left-4">
        <button onClick={() => navigate(-1)}>
          <ArrowLeft className="text-yellow-300 w-6 h-6" />
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-6">Sign in as user</h2>

      {/* Form Card */}
      <form
        onSubmit={handleRegister}
        className="bg-[#A1623C] p-6 rounded-lg w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <label className="block mb-1">Name:</label>
          <input
            type="text"
            name="name"
            required
            value={form.name}
            onChange={handleChange}
            className="w-full bg-yellow-100 text-black px-4 py-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Email:</label>
          <input
            type="email"
            name="email"
            required
            value={form.email}
            onChange={handleChange}
            className="w-full bg-yellow-100 text-black px-4 py-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Password:</label>
          <input
            type="password"
            name="password"
            required
            value={form.password}
            onChange={handleChange}
            className="w-full bg-yellow-100 text-black px-4 py-2 rounded"
          />
        </div>

        <div>
          <label className="block mb-1">Phone:</label>
          <input
            type="tel"
            name="phone"
            required
            value={form.phone}
            onChange={handleChange}
            className="w-full bg-yellow-100 text-black px-4 py-2 rounded"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block mb-1">Location:</label>
          <input
            type="text"
            name="location"
            required
            value={form.location}
            onChange={handleChange}
            className="w-full bg-yellow-100 text-black px-4 py-2 rounded"
          />
        </div>
      </form>

      {/* Submit Button */}
      <button
        onClick={handleRegister}
        className="mt-6 bg-orange-400 hover:bg-orange-500 text-white font-semibold py-2 px-6 rounded"
      >
        Login
      </button>
    </div>
  );
};

export default Register;
