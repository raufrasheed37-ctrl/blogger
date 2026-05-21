"use client"
import { useState } from "react";
import Link from "next/link";
import axios from "axios";


export default function ForgetPasswordPage() {

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await axios.post(
        // "http://localhost:5000/api/auth/forgot-password", 
        "https://blog-backend-3p8r.onrender.com/api/auth/forgot-password",
        { email }
      );

      setMessage(res.data?.message || "Password reset link sent to your email.");
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d14] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[#26263a] bg-[#141420] p-8 shadow-2xl">
        {/* HEADER */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#7c3aed]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-8 w-8 text-white"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.98l-7.5 4.143a2.25 2.25 0 01-2.134 0l-7.5-4.143A2.25 2.25 0 012.25 9V7.5m19.5 1.5v6.75A2.25 2.25 0 0119.5 18h-15a2.25 2.25 0 01-2.25-2.25V9m19.5 0l-8.69 4.8a2.25 2.25 0 01-2.12 0L2.25 9m19.5 0V6.75A2.25 2.25 0 0019.5 4.5h-15A2.25 2.25 0 002.25 6.75V9"
              />
            </svg>
          </div>

          <h1 className="text-3xl font-bold text-white">
            Forgot Password
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Enter your email to receive a reset link.
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Email Address
            </label>

            <div className="">
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                className="w-full rounded-2xl border border-[#2f2f46] bg-[#1b1b2d] px-4 py-3 text-white outline-none transition focus:border-[#7c3aed]"
                required
              />
            </div>
          </div>

          {message && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#7c6ff7] py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Sending Link..." : "Send Reset Link"}
          </button>
        </form>

        {/* FOOTER */}
        <div className="mt-6 text-center text-sm text-gray-400">
          Remember your password?{" "}
          <Link
            href="/login"
            className="font-medium text-[#a78bfa] hover:text-[#c4b5fd]"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
