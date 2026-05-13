"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import useAuthStore from "@/store/authstore";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

function LoginFormContent() {
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuthStore();

  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath =
    searchParams.get("next") || "/dashboard";

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
      const result = loginSchema.safeParse(formData);

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

      await login(
        result.data.email,
        result.data.password
      );

      if (useAuthStore.getState().token) {
        router.push(nextPath);
      } else {
        setErrors({
          form:
            useAuthStore.getState().error ||
            "Login failed",
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
              Welcome back
            </h1>

            <p className="text-sm text-[#9490b8]">
              Sign in to continue to your dashboard.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
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
                type={
                  showPassword ? "text" : "password"
                }
                autoComplete="current-password"
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
                ? "Logging in..."
                : "Sign in"}
            </button>
          </form>

          {/* LINKS */}
          <div className="mt-6 flex items-center justify-between text-sm">
            <Link
              href="/forget-password"
              className="text-[#9490b8] transition hover:text-white"
            >
              Forgot password?
            </Link>

            <Link
              href={`/register?next=${encodeURIComponent(
                nextPath
              )}`}
              className="font-medium text-[#7c6ff7] hover:text-[#9d93ff]"
            >
              Create account
            </Link>
          </div>

          {/* FOOTER */}
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

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d0d14] px-6 py-10 text-[#f0eeff]">
          <div className="mx-auto max-w-md rounded-2xl border border-[#2a2740] bg-[#141420] p-8 text-center">
            <p className="text-[#9490b8]">
              Loading...
            </p>
          </div>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}