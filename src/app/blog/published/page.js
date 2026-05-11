"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function PostPublishedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [postData, setPostData] = useState(null);

  // Get post data from URL params or sessionStorage
  useEffect(() => {
    const slug = searchParams.get("slug");
    const title = searchParams.get("title");
    const excerpt = searchParams.get("excerpt");
    
    if (slug && title) {
      setPostData({ slug, title, excerpt: excerpt || "Your blog post is now live." });
    } else {
      // Fallback if no params - redirect after 3 seconds
      const timer = setTimeout(() => router.push("/blog"), 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router]);

  const postUrl = postData ? `${typeof window !== "undefined" ? window.location.origin : ""}/blog/${postData.slug}` : "";

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
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#7c6ff7]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[#7c6ff7]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Browser-like container */}
        <div className="rounded-2xl border border-[#2a2740] bg-[#141420] shadow-2xl overflow-hidden">
          {/* Top Navigation */}
          <div className="border-b border-[#2a2740] px-8 py-6 flex items-center justify-between bg-[#0d0d14]">
            <div className="flex items-center gap-8 flex-1">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#7c6ff7] to-[#a89cf7] flex items-center justify-center text-lg font-bold">
                  ⚡
                </div>
                <span className="text-xl font-bold hidden sm:inline">Pulse<span className="text-[#7c6ff7]">.</span></span>
              </Link>

              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-sm text-[#9490b8]">
                <Link href="/blog" className="hover:text-[#f0eeff] transition">Blog</Link>
                <span>/</span>
                <span className="text-[#7c6ff7]">{postData.title.substring(0, 40)}...</span>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-4">
              {/* Live Status Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-full text-xs font-medium text-[#4ade80]">
                <span className="inline-block w-2 h-2 bg-[#4ade80] rounded-full animate-pulse" />
                Live
              </div>

              {/* Edit Button */}
              <Link href={`/blog/${postData.slug}/edit`} className="px-4 py-2 text-sm font-medium text-[#9490b8] hover:text-[#f0eeff] hover:bg-[#1c1c2e] rounded-lg transition border border-transparent hover:border-[#2a2740]">
                Edit post
              </Link>

              {/* New Post Button */}
              <Link href="/blog/create" className="px-4 py-2 text-sm font-semibold text-white bg-linear-to-r from-[#7c6ff7] to-[#a89cf7] rounded-lg hover:shadow-lg hover:shadow-[#7c6ff7]/30 transition">
                New post
              </Link>
            </div>
          </div>

          {/* Success Banner */}
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

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
            {/* Left Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* URL Preview Bar */}
              <div className="bg-[#1c1c2e] border border-[#2a2740] rounded-xl px-4 py-3 flex items-center gap-3 font-mono text-sm text-[#9490b8]">
                <span className="text-[#7c6ff7]">🔒</span>
                <span className="truncate">{postUrl}</span>
                <button
                  onClick={copyLink}
                  className="ml-auto px-2 py-1 text-xs bg-[#7c6ff7]/20 text-[#7c6ff7] rounded hover:bg-[#7c6ff7]/30 transition"
                >
                  Copy
                </button>
              </div>

              {/* Blog Preview Card */}
              <div className="rounded-2xl border border-[#2a2740] bg-[#0d0d14] overflow-hidden hover:border-[#7c6ff7]/50 transition group">
                {/* Cover Placeholder */}
                <div className="w-full h-48 bg-linear-to-br from-[#7c6ff7]/20 to-[#a89cf7]/10 flex items-center justify-center">
                  <div className="text-6xl opacity-20">📝</div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Category Badge */}
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-[#7c6ff7]/20 border border-[#7c6ff7]/50 text-[#a89cf7] text-xs font-semibold rounded-full">
                      Featured
                    </span>
                  </div>

                  {/* Title */}
                  <h1 className="text-3xl font-bold text-[#f0eeff] group-hover:text-[#7c6ff7] transition line-clamp-2">
                    {postData.title}
                  </h1>

                  {/* Excerpt */}
                  <p className="text-[#9490b8] line-clamp-2">
                    {postData.excerpt}
                  </p>

                  {/* Author Row */}
                  <div className="pt-4 border-t border-[#2a2740] flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#7c6ff7] to-[#a89cf7] flex items-center justify-center text-white font-bold text-xs">
                        U
                      </div>
                      <div>
                        <p className="font-medium text-[#f0eeff]">Your Name</p>
                        <p className="text-xs text-[#9490b8]">@yourhandle</p>
                      </div>
                    </div>
                    <div className="text-right text-[#9490b8] text-xs">
                      <p>5 min read</p>
                      <p>Just now</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex gap-3 pt-4">
                <Link href={`/blog/${postData.slug}`} className="flex-1 px-6 py-3 bg-linear-to-r from-[#7c6ff7] to-[#a89cf7] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#7c6ff7]/30 transition text-center">
                  View published post
                </Link>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4">
              {/* Analytics Cards */}
              <div className="space-y-3">
                {[
                  { label: "Views", value: "0", icon: "👁️" },
                  { label: "Reads", value: "0", icon: "📖" },
                  { label: "Likes", value: "0", icon: "❤️" },
                  { label: "Comments", value: "0", icon: "💬" },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-[#1c1c2e] border border-[#2a2740] rounded-lg p-4 hover:border-[#7c6ff7]/50 transition">
                    <p className="text-xs text-[#9490b8] uppercase tracking-wider mb-2">{stat.label}</p>
                    <p className="text-2xl font-bold text-[#f0eeff]">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Read Rate Card */}
              <div className="bg-[#1c1c2e] border border-[#2a2740] rounded-lg p-4">
                <p className="text-xs text-[#9490b8] uppercase tracking-wider mb-2">Read rate</p>
                <div className="w-full bg-[#0d0d14] rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-linear-to-r from-[#7c6ff7] to-[#a89cf7] w-0" />
                </div>
                <p className="text-sm text-[#7c6ff7] mt-2 font-medium">0%</p>
              </div>

              {/* SEO Status */}
              <div className="bg-linear-to-br from-[#7c6ff7]/10 to-[#a89cf7]/5 border border-[#7c6ff7]/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">✓</span>
                  <p className="text-xs text-[#9490b8] uppercase tracking-wider">SEO Ready</p>
                </div>
                <p className="text-xs text-[#9490b8]">Your post has all the essentials for search visibility.</p>
              </div>

              {/* What's Next */}
              <div className="bg-[#1c1c2e] border border-[#2a2740] rounded-lg p-4 space-y-3">
                <p className="text-sm font-semibold text-[#f0eeff]">What's next?</p>
                <div className="space-y-2 text-xs text-[#9490b8]">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-[#f0eeff] transition">
                    <input type="checkbox" className="rounded" />
                    <span>Share on social media</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-[#f0eeff] transition">
                    <input type="checkbox" className="rounded" />
                    <span>Email subscribers</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-[#f0eeff] transition">
                    <input type="checkbox" className="rounded" />
                    <span>Promote in communities</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 text-center space-y-4">
          <p className="text-[#9490b8]">Ready to write your next post?</p>
          <Link href="/blog/create" className="inline-block px-8 py-3 bg-linear-to-r from-[#7c6ff7] to-[#a89cf7] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#7c6ff7]/30 transition">
            Create new post
          </Link>
        </div>
      </div>
    </div>
  );
}
