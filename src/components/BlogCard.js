"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, } from "react";
import useAuthStore from "@/store/authstore";
import {
  getLoginRedirect,
} from "@/utils/auth";
import {
  isClientAuthenticated,
  getClientAuthToken,
} from "@/store/authstore";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const API_ROOT = `${API_BASE_URL}${
  API_BASE_URL.endsWith("/api")
    ? ""
    : "/api"
}`;

export default function BlogCard({
  post,
}) {
  const pathname = usePathname();
  const router = useRouter();

  const user = useAuthStore(
    (state) => state.user
  );

  const token = useAuthStore(
    (state) => state.token
  );

  const [likes, setLikes] = useState(
    post.likes || 0
  );

  const [restacks, setRestacks] =
    useState(post.restacks || 0);

  const [liked, setLiked] =
    useState(false);

  const [restacked, setRestacked] =
    useState(false);

  const subscribers =
  post.author?.subscribersList || [];

const currentUserId =
  user?._id || user?.id;

const [subscribed, setSubscribed] =
  useState(
    currentUserId &&
    subscribers.some(
      (id) =>
        id.toString() ===
        currentUserId.toString()
    )
  );


  const requireAuth = () => {
    if (
      token ||
      isClientAuthenticated()
    ) {
      return true;
    }

    router.push(
      getLoginRedirect(pathname)
    );

    return false;
  };

  const postAuthorId =
    post?.author?._id ||
    post?.author?.id ||
    post?.authorId ||
    null;

  const postAuthorEmail =
    post?.author?.email || null;

  const postAuthorName =
    post?.author?.name ||
    post?.name ||
    null;



  const isAuthor = Boolean(
    user &&
      ((postAuthorId &&
        currentUserId &&
        postAuthorId ===
          currentUserId) ||
        (postAuthorEmail &&
          user.email &&
          postAuthorEmail ===
            user.email) ||
        (postAuthorName &&
          user.name &&
          postAuthorName ===
            user.name))
  );

  const toggleLike =
    async () => {
      if (!requireAuth()) return;

      try {
        const res = await fetch(
          `${API_ROOT}/posts/${
            post._id || post.slug
          }/like`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${getClientAuthToken()}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error(
            "Failed to like"
          );
        }

        const data =
          await res.json();

        setLikes(data.likes);
        setLiked(data.liked);
      } catch (error) {
        console.log(error);
      }
    };

  const toggleRestack =
    async () => {
      if (!requireAuth()) return;

      try {
        const res = await fetch(
          `${API_ROOT}/posts/${
            post._id || post.slug
          }/restack`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${getClientAuthToken()}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error(
            "Failed to restack"
          );
        }

        const data =
          await res.json();

        setRestacks(
          data.restacks
        );

        setRestacked(
          data.restacked
        );
      } catch (error) {
        console.log(error);
      }
    };

  const commentCount =
    post.comments ||
    post.commentCount ||
    0;

  return (
    <article className="border-b border-white/10 py-6 transition hover:bg-white/2">
      <div className="flex items-start justify-between gap-4">

        <div className="flex flex-1 gap-3">

          {isAuthor ? (
            <Link
              href="/dashboard"
              className="h-11 w-11 shrink-0 rounded-full hover:opacity-80 transition cursor-pointer"
              style={{
                backgroundImage:
                  `linear-gradient(to bottom right, rgb(124, 111, 247), rgb(168, 156, 247))`,
              }}
            />
          ) : (
            <Link
              href={`/profile/${
                postAuthorId ||
                post.author
                  ?.username ||
                post.name?.toLowerCase() ||
                "user"
              }`}
              className="h-11 w-11 shrink-0 rounded-full hover:opacity-80 transition cursor-pointer"
              style={{
                backgroundImage:
                  `linear-gradient(to bottom right, rgb(124, 111, 247), rgb(168, 156, 247))`,
              }}
            />
          )}

          <div className="min-w-0 flex-1">

            <div className="flex flex-wrap items-center gap-2">

              {isAuthor ? (
                <Link
                  href="/dashboard"
                  className="text-sm font-semibold text-white hover:text-[#a89cf7] transition"
                >
                  {post.name}
                </Link>
              ) : (
                <Link
                  href={`/profile/${
                    postAuthorId ||
                    post.author
                      ?.username ||
                    post.name?.toLowerCase() ||
                    "user"
                  }`}
                  className="text-sm font-semibold text-white hover:text-[#a89cf7] transition"
                >
                  {post.name}
                </Link>
              )}

              <p className="text-xs text-zinc-500">
                {post.handle}
              </p>

              <span className="text-xs text-zinc-600">
                •
              </span>

              <p className="text-xs text-zinc-500">
                {post.time}
              </p>

            </div>

            <Link
              href={`/blog/${post.slug}`}
              className="inline-block"
            >
              <h2 className="mt-3 text-lg font-semibold leading-7 text-white transition hover:text-orange-400">
                {post.title}
              </h2>
            </Link>

            <p className="mt-3 text-sm leading-7 text-zinc-300">
              {post.text}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-zinc-500">

              <button
                type="button"
                onClick={toggleLike}
                className={`rounded-full border px-3 py-1.5 transition ${
                  liked
                    ? "border-orange-500/60 bg-orange-500/10 text-orange-400"
                    : "border-white/10 hover:border-orange-500/40 hover:text-orange-400"
                }`}
              >
                ❤️ {likes}
              </button>

              <Link
                href={`/blog/${post.slug}`}
                className="rounded-full border border-white/10 px-3 py-1.5 transition hover:border-orange-500/40 hover:text-orange-400"
              >
                💬 {commentCount}
              </Link>

              <button
                type="button"
                onClick={
                  toggleRestack
                }
                className={`rounded-full border px-3 py-1.5 transition ${
                  restacked
                    ? "border-orange-500/60 bg-orange-500/10 text-orange-400"
                    : "border-white/10 hover:border-orange-500/40 hover:text-orange-400"
                }`}
              >
                ↻ {restacks}
              </button>

              <span className="rounded-full border border-white/10 px-3 py-1.5">
                Share
              </span>

            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">

          <button
            type="button"
          onClick={async () => {
  if (!requireAuth()) return;

  if (isAuthor) return;

  try {
    const res = await fetch(
      `${API_ROOT}/subscribe`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getClientAuthToken()}`,
        },
        body: JSON.stringify({
          authorId: postAuthorId,
        }),
      }
    );

    if (!res.ok) {
      throw new Error("Failed to subscribe");
    }

    const data = await res.json();

    setSubscribed(data.subscribed);
  } catch (error) {
    console.log(error);
  }
}}
            disabled={
              isAuthor
            }
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              isAuthor
                ? "cursor-not-allowed bg-white/8 text-white/35"
                : subscribed
                ? "bg-purple-600 text-white hover:bg-purple-500"
                : "bg-purple-600 text-white hover:bg-purple-500"
            }`}
          >
            {isAuthor
              ? "Your post"
              : subscribed
              ? "Subscribed"
              : "Subscribe"}
          </button>

          <span className="text-xs text-zinc-500">
            {post.category}
          </span>

        </div>
      </div>
    </article>
  );
}
