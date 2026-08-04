"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();

  const token = params?.token;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    if (password.length < 6) {
  setLoading(false);
  return setError("Password must be at least 6 characters.");
}

if (password !== confirmPassword) {
  setLoading(false);
  return setError("Passwords do not match.");
}

    try {
      
      const res = await axios.post(
  `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password/${token}`,
        
        { password }
      );

      setMessage(res.data?.message || "Password reset successful");

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);

    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Something went wrong.";

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d14] px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-[#26263a] bg-[#141420] p-8 shadow-2xl">

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">
            Reset Password
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Enter your new password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-300">
              New Password
            </label>

          <input
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="Enter your new password"
  className="w-full rounded-2xl border border-[#2f2f46] bg-[#1b1b2d] px-4 py-3 text-white outline-none transition focus:border-[#7c3aed]"
  required
/>
          </div>

  <div>
  <label className="mb-2 block text-sm font-medium text-gray-300">
    Confirm Password
  </label>

  <input
    type="password"
    value={confirmPassword}
    onChange={(e) => setConfirmPassword(e.target.value)}
    placeholder="Confirm your new password"
    className="w-full rounded-2xl border border-[#2f2f46] bg-[#1b1b2d] px-4 py-3 text-white outline-none transition focus:border-[#7c3aed]"
    required
  />
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
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
