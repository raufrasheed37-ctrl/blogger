"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { blogAPI } from "@/utils/api";
import { resolveAuthorIdentity } from "@/utils/auth";
import BrandMark from "@/components/BrandMark";

function PostPublishedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [resolvedAuthor, setResolvedAuthor] = useState(null);

  const slug = searchParams.get("slug");
  const title = searchParams.get("title");
  const excerpt = searchParams.get("excerpt");
  const authorNameParam = searchParams.get("authorName");
  const authorHandleParam = searchParams.get("authorHandle");

  useEffect(() => {
    let cancelled = false;

    const loadAuthor = async () => {
      if (!slug) return;

      try {
        const response = await blogAPI.getById(slug);
        const post = response?.post || response;
        const author = post?.author || {};
        const identity = resolveAuthorIdentity(author, authorNameParam || "Pulse Author", authorHandleParam || "@pulse");

        if (cancelled) return;

        setResolvedAuthor(identity);
      } catch (error) {
        if (!cancelled) {
          setResolvedAuthor(null);
        }
      }
    };

    loadAuthor();

    return () => {
      cancelled = true;
    };
  }, [authorHandleParam, authorNameParam, slug]);

  const postData = useMemo(() => {
    if (!slug || !title) return null;

    const authorName = resolvedAuthor?.name || authorNameParam || "Pulse Author";
    const authorHandle = resolvedAuthor?.handle || authorHandleParam || "@pulse";

    return {
      slug,
      title,
      excerpt: excerpt || "Your blog post is now live.",
      authorName,
      authorHandle,
    };
  }, [authorHandleParam, authorNameParam, excerpt, resolvedAuthor, slug, title]);

  useEffect(() => {
    if (!postData) {
      const timer = setTimeout(() => router.push("/blog"), 3000);
      return () => clearTimeout(timer);
    }
  }, [postData, router]);

  const postUrl = postData
    ? (typeof window === "undefined"
        ? `/blog/${postData.slug}`
        : `${window.location.origin}/blog/${postData.slug}`)
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sharePost = () => {
    if (navigator.share) {
      navigator.share({
        title: postData?.title || "Check out my post",
        text: postData?.excerpt || "I just published a new blog post",
        url: postUrl,
      });
    }
  };

  if (!postData) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
        <div className="animate-pulse text-[#9490b8]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d14] text-[#f0eeff] py-8 px-4 sm:py-12 sm:px-6">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#7c6ff7]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[#7c6ff7]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="rounded-2xl border border-[#2a2740] bg-[#141420] shadow-2xl overflow-hidden">
          <div className="border-b border-[#2a2740] px-8 py-6 flex items-center justify-between bg-[#0d0d14]">
            <div className="flex items-center gap-8 flex-1">
              <Link href="/" className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#7c6ff7] to-[#a89cf7] flex items-center justify-center text-lg font-bold">
                  <BrandMark className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold hidden sm:inline">
                  Pulse<span className="text-[#7c6ff7]">.</span>
                </span>
              </Link>

              <div className="flex items-center gap-2 text-sm text-[#9490b8]">
                <Link href="/blog" className="hover:text-[#f0eeff] transition">
                  Blog
                </Link>
                <span>/</span>
                <span className="text-[#7c6ff7]">{postData.title.substring(0, 40)}...</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-full text-xs font-medium text-[#4ade80]">
                <span className="inline-block w-2 h-2 bg-[#4ade80] rounded-full animate-pulse" />
                Live
              </div>

              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-[#9490b8] hover:text-[#f0eeff] hover:bg-[#1c1c2e] rounded-lg transition border border-transparent hover:border-[#2a2740]"
              >
                Back to homepage
              </Link>

              <Link
                href={`/editor-dashboard?slug=${postData.slug}`}
                className="px-4 py-2 text-sm font-medium text-[#9490b8] hover:text-[#f0eeff] hover:bg-[#1c1c2e] rounded-lg transition border border-transparent hover:border-[#2a2740]"
              >
                Edit post
              </Link>

              <Link
                href="/blog/create"
                className="px-4 py-2 text-sm font-semibold text-white bg-linear-to-r from-[#7c6ff7] to-[#a89cf7] rounded-lg hover:shadow-lg hover:shadow-[#7c6ff7]/30 transition"
              >
                New post
              </Link>
            </div>
          </div>

          <div className="bg-linear-to-r from-[#4ade80]/10 to-[#4ade80]/5 border-b border-[#4ade80]/20 px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#4ade80]/20 border border-[#4ade80]/40 flex items-center justify-center text-lg">
                ✓
              </div>
              <div>
                <p className="font-semibold text-[#4ade80]">Your post is live!</p>
                <p className="text-xs text-[#9490b8] mt-1">Published just now</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={copyLink}
                className="px-4 py-2 text-sm font-medium bg-[#1c1c2e] border border-[#2a2740] text-[#9490b8] hover:text-[#f0eeff] hover:border-[#7c6ff7]/50 rounded-lg transition"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
              <button
                onClick={sharePost}
                className="px-4 py-2 text-sm font-medium bg-[#1c1c2e] border border-[#2a2740] text-[#9490b8] hover:text-[#f0eeff] hover:border-[#7c6ff7]/50 rounded-lg transition"
              >
                Share post
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#1c1c2e] border border-[#2a2740] rounded-xl px-4 py-3 flex items-center gap-3 font-mono text-sm text-[#9490b8]">
                <span className="text-[#7c6ff7]">🔒</span>
                <span className="truncate" suppressHydrationWarning>{postUrl}</span>
                <button
                  onClick={copyLink}
                  className="ml-auto px-2 py-1 text-xs bg-[#7c6ff7]/20 text-[#7c6ff7] rounded hover:bg-[#7c6ff7]/30 transition"
                >
                  Copy
                </button>
              </div>

              <div className="rounded-2xl border border-[#2a2740] bg-[#0d0d14] overflow-hidden hover:border-[#7c6ff7]/50 transition group">
                <div className="w-full h-48 bg-linear-to-br from-[#7c6ff7]/20 to-[#a89cf7]/10 flex items-center justify-center">
                  <div className="text-6xl opacity-20">📝</div>
                </div>

                <div className="p-6 space-y-4">
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-[#7c6ff7]/20 border border-[#7c6ff7]/50 text-[#a89cf7] text-xs font-semibold rounded-full">
                      Featured
                    </span>
                  </div>

                  <h1 className="text-3xl font-bold text-[#f0eeff] group-hover:text-[#7c6ff7] transition line-clamp-2">
                    {postData.title}
                  </h1>

                  <p className="text-[#9490b8] line-clamp-2">{postData.excerpt}</p>

                  <div className="pt-4 border-t border-[#2a2740] flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#7c6ff7] to-[#a89cf7] flex items-center justify-center text-white font-bold text-xs">
                        {(postData.authorName || "P").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[#f0eeff]">{postData.authorName}</p>
                        <p className="text-xs text-[#9490b8]">{postData.authorHandle}</p>
                      </div>
                    </div>
                    <div className="text-right text-[#9490b8] text-xs">
                      <p>5 min read</p>
                      <p>Just now</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Link
                  href={`/blog/${postData.slug}`}
                  className="flex-1 px-6 py-3 bg-linear-to-r from-[#7c6ff7] to-[#a89cf7] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#7c6ff7]/30 transition text-center"
                >
                  View published post
                </Link>
              </div>
            </div>

            <div className="space-y-4" />
          </div>
        </div>

        <div className="mt-8 text-center space-y-4">
          <p className="text-[#9490b8]">Ready to write your next post?</p>
          <Link
            href="/blog/create"
            className="inline-block px-8 py-3 bg-linear-to-r from-[#7c6ff7] to-[#a89cf7] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#7c6ff7]/30 transition"
          >
            Create new post
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PostPublishedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
          <div className="animate-pulse text-[#9490b8]">Loading...</div>
        </div>
      }
    >
      <PostPublishedContent />
    </Suspense>
  );
}
