"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import useAuthStore from "@/store/authstore";
import { getLoginRedirect } from "@/utils/auth";
import { isClientAuthenticated } from "@/store/authstore";

export default function BlogCard({ post }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [actions, setActions] = useState({
    liked: false,
    commented: false,
    restacked: false,
    subscribed: false,
  });

  const requireAuth = () => {
    if (token || isClientAuthenticated()) {
      return true;
    }

    router.push(getLoginRedirect(pathname));
    return false;
  };

  const postAuthorId = post?.author?._id || post?.author?.id || post?.authorId || null;
  const postAuthorEmail = post?.author?.email || null;
  const postAuthorName = post?.author?.name || post?.name || null;
  const currentUserId = user?._id || user?.id || null;
  const isAuthor = Boolean(
    user && (
      (postAuthorId && currentUserId && postAuthorId === currentUserId) ||
      (postAuthorEmail && user.email && postAuthorEmail === user.email) ||
      (postAuthorName && user.name && postAuthorName === user.name)
    )
  );

  const toggleAction = (action) => {
    if (!requireAuth()) {
      return;
    }

    if (action === "subscribed" && isAuthor) {
      return;
    }

    setActions((current) => ({
      ...current,
      [action]: !current[action],
    }));
  };

  const likeCount = post.likes + (actions.liked ? 1 : 0);
  const commentCount = post.comments + (actions.commented ? 1 : 0);
  const restackCount = (post.restacks ?? 0) + (actions.restacked ? 1 : 0);

  return (
    <article className="border-b border-white/10 py-6 transition hover:bg-white/2">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 gap-3">
          {isAuthor ? (
            <Link href="/dashboard" className="h-11 w-11 shrink-0 rounded-full hover:opacity-80 transition cursor-pointer" style={{ backgroundImage: `linear-gradient(to bottom right, rgb(124, 111, 247), rgb(168, 156, 247))` }} />
          ) : (
            <Link href={`/profile/${postAuthorId || post.author?.username || post.name?.toLowerCase() || "user"}`} className="h-11 w-11 shrink-0 rounded-full hover:opacity-80 transition cursor-pointer" style={{ backgroundImage: `linear-gradient(to bottom right, rgb(124, 111, 247), rgb(168, 156, 247))` }} />
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {isAuthor ? (
                <Link href="/dashboard" className="text-sm font-semibold text-white hover:text-[#a89cf7] transition">
                  {post.name}
                </Link>
              ) : (
                <Link href={`/profile/${postAuthorId || post.author?.username || post.name?.toLowerCase() || "user"}`} className="text-sm font-semibold text-white hover:text-[#a89cf7] transition">
                  {post.name}
                </Link>
              )}

              <p className="text-xs text-zinc-500">
                {post.handle}
              </p>

              <span className="text-xs text-zinc-600">•</span>

              <p className="text-xs text-zinc-500">
                {post.time}
              </p>
            </div>

            <Link href={`/blog/${post.slug}`} className="inline-block">
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
                onClick={() => toggleAction("liked")}
                className={`rounded-full border px-3 py-1.5 transition ${
                  actions.liked
                    ? "border-orange-500/60 bg-orange-500/10 text-orange-400"
                    : "border-white/10 hover:border-orange-500/40 hover:text-orange-400"
                }`}
              >
                ♡ {likeCount}
              </button>

              <button
                type="button"
                onClick={() => toggleAction("commented")}
                className={`rounded-full border px-3 py-1.5 transition ${
                  actions.commented
                    ? "border-orange-500/60 bg-orange-500/10 text-orange-400"
                    : "border-white/10 hover:border-orange-500/40 hover:text-orange-400"
                }`}
              >
                💬 {commentCount}
              </button>

              <button
                type="button"
                onClick={() => toggleAction("restacked")}
                className={`rounded-full border px-3 py-1.5 transition ${
                  actions.restacked
                    ? "border-orange-500/60 bg-orange-500/10 text-orange-400"
                    : "border-white/10 hover:border-orange-500/40 hover:text-orange-400"
                }`}
              >
                ↻ {restackCount}
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
            onClick={() => toggleAction("subscribed")}
            disabled={isAuthor}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              isAuthor
                ? "cursor-not-allowed bg-white/8 text-white/35"
                : actions.subscribed
                ? "bg-zinc-800 text-zinc-100"
                : "bg-orange-500 text-black hover:bg-orange-400"
            }`}
          >
            {isAuthor ? "Your post" : actions.subscribed ? "Subscribed" : "Subscribe"}
          </button>

          <span className="text-xs text-zinc-500">
            {post.category}
          </span>
        </div>
      </div>
    </article>
  );
}
