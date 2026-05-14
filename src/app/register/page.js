"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import useAuthStore from "@/store/authstore";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Email address required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

function RegisterFormContent() {
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuthStore();

  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = searchParams.get("next") || "/dashboard";

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = registerSchema.safeParse(formData);

      if (!result.success) {
        const newErrors = {};

        result.error.issues.forEach((issue) => {
          const fieldName = issue.path[0];

          if (fieldName) {
            newErrors[fieldName] = issue.message;
          }
        });

        setErrors(newErrors);
        return;
      }

      await register(
        result.data.email,
        result.data.password,
        result.data.name
      );

      if (useAuthStore.getState().token) {
        router.push(nextPath);
      } else {
        setErrors({
          form: useAuthStore.getState().error || "Registration failed",
        });
      }
    } catch (error) {
      setErrors({
        form: error?.message || "Something went wrong",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d14] px-6 py-10 text-[#f0eeff]">
      <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-[#2a2740] bg-[#141420] shadow-2xl">
        {/* TOP */}
        <div className="border-b border-[#2a2740] px-6 py-5">
          <div className="text-lg font-semibold">
            Pulse<span className="text-[#7c6ff7]">.</span>
          </div>
        </div>

        {/* CONTENT */}
        <div className="px-6 py-8">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold">
              Create your account
            </h1>

            <p className="text-sm text-[#9490b8]">
              Join Pulse and start managing your blog dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* NAME */}
            <div>
              <label className="mb-2 block text-sm text-[#b4afd6]">
                Username
              </label>

              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full rounded-xl border border-[#2a2740] bg-[#1c1c2e] px-4 py-3 text-sm outline-none transition focus:border-[#7c6ff7]"
              />

              {errors.name && (
                <p className="mt-2 text-xs text-[#f09595]">
                  {errors.name}
                </p>
              )}
            </div>

            {/* EMAIL */}
            <div>
              <label className="mb-2 block text-sm text-[#b4afd6]">
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[#2a2740] bg-[#1c1c2e] px-4 py-3 text-sm outline-none transition focus:border-[#7c6ff7]"
              />

              {errors.email && (
                <p className="mt-2 text-xs text-[#f09595]">
                  {errors.email}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div>
              <label className="mb-2 block text-sm text-[#b4afd6]">
                Password
              </label>

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#2a2740] bg-[#1c1c2e] px-4 py-3 text-sm outline-none transition focus:border-[#7c6ff7]"
              />

              <div className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showPassword"
                  checked={showPassword}
                  onChange={() =>
                    setShowPassword(!showPassword)
                  }
                  className="h-4 w-4 accent-[#7c6ff7]"
                />

                <label
                  htmlFor="showPassword"
                  className="text-sm text-[#9490b8]"
                >
                  Show password
                </label>
              </div>

              {errors.password && (
                <p className="mt-2 text-xs text-[#f09595]">
                  {errors.password}
                </p>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="mb-2 block text-sm text-[#b4afd6]">
                Confirm password
              </label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[#2a2740] bg-[#1c1c2e] px-4 py-3 text-sm outline-none transition focus:border-[#7c6ff7]"
              />

              {errors.confirmPassword && (
                <p className="mt-2 text-xs text-[#f09595]">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* FORM ERROR */}
            {errors.form && (
              <div className="rounded-xl border border-[#4a1414] bg-[#2a1414] px-4 py-3 text-sm text-[#f09595]">
                {errors.form}
              </div>
            )}

            {/* BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-xl bg-[#7c6ff7] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting
                ? "Registering..."
                : "Create account"}
            </button>
          </form>

          {/* FOOTER */}
          <div className="mt-6 text-center text-sm text-[#9490b8]">
            Already have an account?{" "}
            <Link
              href={`/login?next=${encodeURIComponent(nextPath)}`}
              className="font-medium text-[#7c6ff7] hover:text-[#9d93ff]"
            >
              Sign in
            </Link>
          </div>

          <div className="mt-6 border-t border-[#2a2740] pt-6 text-center">
            <Link
              href="/"
              className="text-sm text-[#9490b8] transition hover:text-white"
            >
              ← Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d0d14] px-6 py-10 text-[#f0eeff]">
          <div className="mx-auto max-w-md rounded-2xl border border-[#2a2740] bg-[#141420] p-8 text-center">
            <p className="text-[#9490b8]">Loading...</p>
          </div>
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}