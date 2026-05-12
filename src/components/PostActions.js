"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import useAuthStore, { isClientAuthenticated } from "@/store/authstore";
import { getLoginRedirect } from "@/utils/auth";
import { blogAPI, subscribeAPI } from "@/utils/api";

export default function PostActions({ post }) {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const [subscribed, setSubscribed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

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

  const requireAuth = () => {
    if (token || isClientAuthenticated()) return true;
    router.push(getLoginRedirect(pathname));
    return false;
  };

  const toggleSubscribe = async () => {
    if (!requireAuth()) return;
    if (isAuthor) return;
    // Call backend to toggle subscription
    try {
      const resp = await subscribeAPI.toggle(postAuthorId);
      // resp is the parsed response from API (via axios interceptor)
      // Expect shape: { subscribers, subscribed }
      setSubscribed(Boolean(resp?.subscribed));
    } catch (err) {
      console.error("Subscribe failed", err?.message || err);
    }
  };

  const handleDelete = async () => {
    if (!requireAuth()) return;
    if (!isAuthor || isDeleting) return;

    const identifier = post?._id || post?.id || post?.slug;

    if (!identifier) {
      console.error("Delete failed: missing post identifier");
      return;
    }

    const confirmed = window.confirm("Delete this post? This cannot be undone.");
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await blogAPI.delete(identifier);
      router.push("/blog");
      router.refresh();
    } catch (error) {
      console.error("Delete failed", error?.message || error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-2">
      {isAuthor && (
        <>
          <Link
            href={`/editor-dashboard?slug=${post._id || post.id || post.slug}`}
            className="rounded-xl bg-zinc-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-600"
          >
            Edit
          </Link>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </>
      )}

      <button
        type="button"
        onClick={toggleSubscribe}
        disabled={isAuthor}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
          isAuthor
            ? "cursor-not-allowed bg-white/8 text-white/35"
            : subscribed
            ? "bg-zinc-800 text-zinc-100"
            : "bg-orange-500 text-black hover:bg-orange-400"
        }`}
      >
        {isAuthor ? "Your post" : subscribed ? "Subscribed" : "Subscribe"}
      </button>
    </div>
  );
}
