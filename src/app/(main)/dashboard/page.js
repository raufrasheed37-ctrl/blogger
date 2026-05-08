"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authstore";
import { authAPI, blogAPI } from "@/utils/api";

function AvatarMark({ initial = "D" }) {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-orange-400 via-amber-500 to-rose-500 p-0.5 shadow-[0_18px_60px_rgba(255,106,0,0.25)]">
      <div className="flex h-full w-full items-center justify-center rounded-full border border-white/10 bg-[#12161d] text-xl font-semibold text-white">
        {initial}
      </div>
    </div>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-4 w-4 text-black/80">
      <path
        fill="currentColor"
        d="M5.2 7.2a1 1 0 0 1 1.4 0L10 10.6l3.4-3.4a1 1 0 1 1 1.4 1.4l-4.1 4.1a1 1 0 0 1-1.4 0L5.2 8.6a1 1 0 0 1 0-1.4Z"
      />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 text-white/70">
      <circle cx="5" cy="12" r="1.7" fill="currentColor" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
      <circle cx="19" cy="12" r="1.7" fill="currentColor" />
    </svg>
  );
}

function PencilNoteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-14 w-14 text-orange-400/90">
      <path
        fill="currentColor"
        d="M17.9 3.7a2.6 2.6 0 0 1 3.7 3.7L10.8 17.9a4 4 0 0 1-1.7 1.04l-3.76 1.25a.85.85 0 0 1-1.08-1.08l1.25-3.76a4 4 0 0 1 1.04-1.7L17.9 3.7Zm1.3 1.2L7.9 16.2a2.4 2.4 0 0 0-.63 1.04l-.67 2.01 2.01-.67a2.4 2.4 0 0 0 1.04-.63L21.57 7.2a.9.9 0 0 0-1.27-1.27Z"
      />
    </svg>
  );
}

function DashboardPostCard({ post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="block rounded-3xl border border-white/10 bg-white/4 p-5 transition hover:border-orange-400/30 hover:bg-white/6"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.18em] text-white/40">
            {post.category}
          </p>

          <h3 className="mt-2 text-lg font-semibold text-white">
            {post.title}
          </h3>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/60">
            {post.excerpt}
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-white/6 px-3 py-1 text-xs text-white/60">
          {post.published ? "Published" : "Draft"}
        </span>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] =
    useState("Activity");

  const [authorPosts, setAuthorPosts] =
    useState([]);

  const [postsLoading, setPostsLoading] =
    useState(false);

  const user = useAuthStore(
    (s) => s.user
  );

  const hydrate = useAuthStore(
    (s) => s.hydrate
  );

  // PROTECT DASHBOARD
  useEffect(() => {
    hydrate();

    const token =
      localStorage.getItem("token");

    if (!token) {
      router.push("/login");
    }
  }, [hydrate, router]);

  // LOAD USER
  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (token && !user) {
      (async () => {
        try {
          const data =
            await authAPI.getMe();

          if (data?.user) {
            const userObj = {
              ...data.user,
              _id:
                data.user.id ||
                data.user._id,
            };

            useAuthStore
              .getState()
              .setUser(userObj);
          }
        } catch (err) {
          console.log(err);
        }
      })();
    }
  }, [user]);

  // LOAD USER POSTS
  useEffect(() => {
    const authorId =
      user?._id || user?.id;

    if (!authorId) {
      return;
    }

    let cancelled = false;

    (async () => {
      setPostsLoading(true);

      try {
        const response =
          await blogAPI.getByAuthor(
            authorId
          );

        const livePosts =
          Array.isArray(
            response?.posts
          )
            ? response.posts
            : [];

        if (!cancelled) {
          setAuthorPosts(livePosts);
        }
      } catch (error) {
        if (!cancelled) {
          setAuthorPosts([]);
        }
      } finally {
        if (!cancelled) {
          setPostsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?._id, user?.id]);

  // PREVENT OLD USER FLASH
  if (!user) {
    return null;
  }

  const tabs = [
    {
      label: "Activity",
      count: null,
    },
    {
      label: "Posts",
      count:
        authorPosts.length,
    },
    {
      label: "Likes",
      count: null,
    },
    {
      label: "Reads",
      count: 0,
    },
  ];

  const displayName =
    user?.name || "User";

  const username =
    user?.email
      ? `@${
          user.email.split("@")[0]
        }`
      : `@${
          (
            user?.name ||
            "user"
          )
            .toLowerCase()
            .replace(/\s+/g, "")
        }`;

  const initial = (
    user?.name?.[0] || "U"
  ).toUpperCase();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0f1115] px-4 py-8 text-white sm:px-6 lg:px-8 lg:py-10">

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,106,0,0.12),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.06),transparent_30%),linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_36%)]" />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center">

        <section className="w-full rounded-4xl border border-white/8 bg-white/3 px-5 py-6 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-8 sm:py-8">

          <div className="flex flex-col items-center gap-5 text-center">

            <AvatarMark initial={initial} />

            <div className="space-y-2">

              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs font-medium text-white/80">

                {displayName}

              </div>

              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">

                {displayName}

              </h1>

              <p className="text-sm text-white/60">

                {username}

              </p>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}
