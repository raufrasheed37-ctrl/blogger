"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useRef } from "react";
import { blogAPI } from "@/utils/api";
import CommentSection from "@/components/CommentSection";
import useAuthStore, { isClientAuthenticated } from "@/store/authstore";
import {
  Heart,
  MessageCircle,
  Repeat2,
} from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_ROOT = `${API_BASE_URL}${API_BASE_URL.endsWith("/api") ? "" : "/api"}`;

const SECTION_TEMPLATES = [
  { id: "overview", title: "Overview" },
  { id: "insights", title: "Core insights" },
  { id: "takeaways", title: "Takeaways" },
  { id: "closing", title: "Closing note" },
];

function sanitizeText(value) {
  if (!value) return "";
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitContent(content) {
  const clean = sanitizeText(content);
  if (!clean) return [];

  const paragraphs = clean
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length > 1) {
    return paragraphs;
  }

  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length > 3) {
    const chunkSize = Math.max(1, Math.ceil(sentences.length / 4));
    return Array.from({ length: Math.ceil(sentences.length / chunkSize) }, (_, index) =>
      sentences.slice(index * chunkSize, index * chunkSize + chunkSize).join(" ")
    ).filter(Boolean);
  }

  return clean ? [clean] : [];
}

function buildSections(post) {
  const paragraphs = splitContent(post?.content || post?.body || post?.excerpt || "");
  const chunkSize = Math.max(1, Math.ceil(Math.max(paragraphs.length, 1) / SECTION_TEMPLATES.length));

  return SECTION_TEMPLATES.map((section, index) => ({
    ...section,
    paragraphs: paragraphs.slice(index * chunkSize, index * chunkSize + chunkSize),
  })).filter((section) => section.paragraphs.length > 0);
}

function initialsFromName(name) {
  return String(name || "P")
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function buildFallbackPost(slug) {
  return {
    _id: slug,
    slug,
    title: "Pulse editorial article",
    excerpt: "A premium dark-mode article view designed for reading, sharing, and managing your work.",
    content:
      "This is a refined Pulse fallback article preview. Connect a real post and the layout will render your content, author details, tags, and stats in a premium editorial experience.\n\nThe design keeps the reading surface calm and focused while surfacing the tools you need to manage, share, and update the post.\n\nUse this as a polished post view for your published content.",
    category: "Pulse",
    tags: ["Pulse", "Editorial", "Design"],
    likes: 128,
    comments: 24,
    views: 2140,
    reads: 840,
    createdAt: new Date().toISOString(),
    author: {
      name: "Pulse Author",
      username: "pulseauthor",
      email: "author@pulse.blog",
    },
  };
}

function normalizeCounter(post, keys) {
  for (const key of keys) {
    const value = Number(post?.[key]);
    if (!Number.isNaN(value)) {
      return value;
    }
  }

  return 0;
}

async function fetchPostFromBackend(slug) {
  const response = await fetch(`${API_ROOT}/posts/${encodeURIComponent(slug)}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load post (${response.status})`);
  }

  const data = await response.json();
  return data?.post || data?.data || data;
}

function StatCard({ label, value, accent = false }) {
  return (
    <div className="rounded-2xl border border-[#2a2740] bg-[#141420]/80 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur-sm">
      <p className="text-[11px] uppercase tracking-[0.24em] text-[#9490b8]">{label}</p>
      <p className={`mt-3 text-2xl font-semibold ${accent ? "text-[#a89cf7]" : "text-[#f0eeff]"}`}>{value}</p>
    </div>
  );
}

function ShareIconButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#2a2740] bg-[#141420] text-[#f0eeff] transition hover:border-[#7c6ff7]/60 hover:bg-[#1c1c2e] hover:text-[#a89cf7]"
    >
      {children}
    </button>
  );
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("overview");
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const isLoggedIn = Boolean(token || isClientAuthenticated());
  const viewsIncrementedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPost() {
      if (!slug) {
        setError("Missing post slug.");
        setLoading(false);
        return;
      }

      viewsIncrementedRef.current = false;
      setLoading(true);
      setError("");

      try {
        let resolvedPost;

        try {
          resolvedPost = await fetchPostFromBackend(slug);
        } catch (backendError) {
          const fallback = await blogAPI.getById(slug);
          resolvedPost = fallback?.post || fallback?.data || fallback;
          console.debug("Loaded post via fallback endpoint:", backendError?.message || backendError);
        }

        if (!cancelled) {
          setPost(resolvedPost || buildFallbackPost(slug));
        }
      } catch (fetchError) {
        if (!cancelled) {
          setPost(buildFallbackPost(slug));
          setError(fetchError?.message || "Unable to load this post right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPost();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Increment views and reads when post is loaded
  useEffect(() => {
    if (!post || !post._id || viewsIncrementedRef.current) {
      return;
    }

    const incrementViews = async () => {
      try {
        viewsIncrementedRef.current = true;
        const response = await fetch(`${API_ROOT}/posts/${post._id || post.id}/view`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPost((prev) => ({
            ...prev,
            views: data.views ?? data.viewCount ?? data.totalViews ?? prev.views,
            reads: data.reads ?? data.readCount ?? data.totalReads ?? prev.reads,
          }));
        }
      } catch (err) {
        console.error("Error incrementing views:", err);
      }
    };

    incrementViews();
  }, [post]);

  const normalizedPost = useMemo(() => {
    if (!post) return null;

    const author = post.author || {};
    const content = sanitizeText(post.content || post.body || post.excerpt || "");
    const paragraphs = splitContent(content);
    const sections = buildSections({ ...post, content });
    const tags = Array.isArray(post.tags) && post.tags.length > 0 ? post.tags : [post.category || "Pulse"];
    const views = normalizeCounter(post, ["views", "viewCount", "totalViews", "viewsCount"]);
    const reads = normalizeCounter(post, ["reads", "readCount", "totalReads", "readsCount"]);
    const likes = Number(post.likes ?? 0);
    const comments = Number(post.comments ?? 0);
    const restacks = Number(post.restacks ?? 0);
    const createdAt = post.createdAt ? new Date(post.createdAt) : new Date();
    const readTime = Math.max(1, Math.ceil(Math.max(content.split(/\s+/).filter(Boolean).length, 1) / 200));

    return {
      id: post._id || post.id || slug,
      slug: post.slug || slug,
      isRestack: Boolean(post.isRestack),

restackedFromName:
  post?.restackedFrom?.name ||
  post?.originalPost?.author?.name ||
  "Unknown",

originalPostSlug:
  post?.originalPost?.slug || null,
      title: post.title || "Untitled article",
      subtitle: post.subtitle || post.excerpt || "A premium editorial reading experience from Pulse.",
      category: post.category || tags[0] || "Pulse",
      tags,
      authorName: author.name || author.username || author.email?.split("@")[0] || "Pulse Author",
      authorHandle: author.username ? `@${author.username}` : author.email ? `@${author.email.split("@")[0]}` : "@pulse",
      authorAvatar: author.avatar || initialsFromName(author.name || author.username || author.email),
      createdAtLabel: Number.isNaN(createdAt.getTime()) ? "Recently published" : createdAt.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      readTime,
      content,
      paragraphs,
      sections,
      views,
      reads,
      likes,
      comments,
      restacks,
        quote: paragraphs[1] || paragraphs[0] || post.excerpt || "Write a strong editorial hook to anchor the reading experience.",
    };
  }, [post, slug]);

  const isAuthor = useMemo(() => {
  if (!normalizedPost || !user || post?.isRestack) return false;

  const author = post?.author || {};
  const postAuthorId = author._id || author.id || post?.authorId || null;
  const postAuthorEmail = author.email || null;
  const postAuthorName = author.name || null;
  const currentUserId = user?._id || user?.id || null;

  return Boolean(
    (postAuthorId && currentUserId && postAuthorId === currentUserId) ||
    (postAuthorEmail && user.email && postAuthorEmail === user.email) ||
    (postAuthorName && user.name && postAuthorName === user.name)
  );
}, [normalizedPost, post, user]);
  
  const handleShare = async () => {
    if (!normalizedPost) return;

    const url = typeof window !== "undefined" ? window.location.href : "";

    try {
      if (navigator.share) {
        await navigator.share({
          title: normalizedPost.title,
          text: normalizedPost.subtitle,
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        window.setTimeout(() => setShareCopied(false), 1800);
      }
    } catch (shareError) {
      console.debug("Share cancelled or failed:", shareError);
    }
  };

  const handleDelete = async () => {
    if (!normalizedPost) return;

    const confirmed = window.confirm("Delete this post? This action cannot be undone.");
    if (!confirmed) return;

    try {
      await blogAPI.delete(normalizedPost.id);
      router.push("/dashboard");
    } catch (deleteError) {
      setError(deleteError?.message || "Unable to delete this post.");
    }
  };

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0d14] text-[#f0eeff] flex items-center justify-center">
        <div className="rounded-full border border-[#2a2740] bg-[#141420] px-5 py-3 text-sm text-[#9490b8] shadow-lg">
          Loading Pulse article...
        </div>
      </div>
    );
  }

  if (!normalizedPost) {
    return (
      <div className="min-h-screen bg-[#0d0d14] text-[#f0eeff] flex items-center justify-center px-6">
        <div className="max-w-md rounded-3xl border border-[#2a2740] bg-[#141420] p-8 text-center shadow-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-[#9490b8]">Pulse</p>
          <h1 className="mt-4 text-3xl font-semibold">Article not found</h1>
          <p className="mt-3 text-sm leading-6 text-[#9490b8]">
            We could not load this post. You can go back to the blog or try again from the dashboard.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/blog" className="rounded-full bg-[#7c6ff7] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8c7ef8]">
              Back to blog
            </Link>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-full border border-[#2a2740] px-5 py-2.5 text-sm text-[#f0eeff] transition hover:border-[#7c6ff7]/60 hover:bg-[#1c1c2e]"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#0d0d14] text-[#f0eeff]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#7c6ff7]/12 blur-3xl" />
        <div className="absolute -right-24 top-24 h-96 w-96 rounded-full bg-[#a89cf7]/10 blur-3xl" />
        <div className="absolute -bottom-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#7c6ff7]/8 blur-3xl" />
      </div>

      <div className="relative mx-auto flex h-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-4xl border border-[#2a2740] bg-[#11111a]/95 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <header className="flex flex-col gap-4 border-b border-[#2a2740] bg-[#0f0f17]/90 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center gap-2 rounded-full border border-[#2a2740] bg-[#141420] px-4 py-2 text-sm text-[#f0eeff] transition hover:border-[#7c6ff7]/60 hover:bg-[#1c1c2e]"
              >
                <span aria-hidden>←</span>
                Back
              </button>

              <Link href="/" className="flex items-center gap-2">
                <span
                  className="text-2xl font-semibold text-[#f0eeff]"
                  style={{ fontFamily: "Fraunces, serif" }}
                >
                  Pulse.
                </span>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleShare}
                className="rounded-full border border-[#2a2740] bg-[#141420] px-4 py-2 text-sm font-medium text-[#f0eeff] transition hover:border-[#7c6ff7]/60 hover:bg-[#1c1c2e] hover:text-[#a89cf7]"
              >
                {shareCopied ? "Link copied" : "Share"}
              </button>
              {isAuthor ? (
                <>
                  <Link
                    href={`/editor-dashboard?slug=${normalizedPost.slug}`}
                    className="rounded-full border border-[#7c6ff7]/40 bg-[#7c6ff7]/10 px-4 py-2 text-sm font-medium text-[#a89cf7] transition hover:border-[#7c6ff7]/70 hover:bg-[#7c6ff7]/20"
                  >
                    Edit Post
                  </Link>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20 hover:text-rose-200"
                  >
                    Delete
                  </button>
                </>
              ) : null}
            </div>
          </header>

          <main className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[1.6fr_0.82fr]">
            <section className="min-h-0 overflow-y-auto border-r border-[#2a2740] px-5 py-6 sm:px-6 lg:px-8">
              <div className="rounded-[1.75rem] border border-[#2a2740] bg-[linear-gradient(180deg,rgba(124,111,247,0.12),rgba(20,20,32,0.88))] px-6 py-10 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-8">
                <div className="flex min-h-56 flex-col items-center justify-center gap-5 text-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#7c6ff7]/30 bg-[#0d0d14] text-4xl shadow-[0_0_45px_rgba(124,111,247,0.25)]">
                    ✦
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-[#a89cf7]">Editorial article</p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <span className="inline-flex rounded-full border border-[#7c6ff7]/30 bg-[#7c6ff7]/10 px-3 py-1 text-xs font-medium text-[#a89cf7]">
                  {normalizedPost.category}
                </span>
                <h1
                  className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[#f0eeff] sm:text-5xl"
                  style={{ fontFamily: "Fraunces, serif" }}
                >
                  {normalizedPost.title}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-[#9490b8] sm:text-lg">
                  {normalizedPost.subtitle}
                </p>

                  {normalizedPost.isRestack && (
  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
    <Repeat2 size={16} />
    <span>
      Restacked from {normalizedPost.restackedFromName}
    </span>
  </div>
)}

                <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-[#2a2740] bg-[#141420]/80 px-4 py-4">
                  {isAuthor ? (
                    <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7c6ff7,#a89cf7)] text-sm font-semibold text-white cursor-pointer">
                        {normalizedPost.authorAvatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#f0eeff]">{normalizedPost.authorName}</p>
                        <p className="text-xs text-[#9490b8]">{normalizedPost.authorHandle}</p>
                      </div>
                    </Link>
                  ) : (
                    <Link href={`/profile/${post?.author?._id || post?.author?.id || post?.author?.username || normalizedPost.authorName.toLowerCase()}`} className="flex items-center gap-3 hover:opacity-80 transition">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#7c6ff7,#a89cf7)] text-sm font-semibold text-white cursor-pointer">
                        {normalizedPost.authorAvatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#f0eeff]">{normalizedPost.authorName}</p>
                        <p className="text-xs text-[#9490b8]">{normalizedPost.authorHandle}</p>
                      </div>
                    </Link>
                  )}

                  <div className="h-8 w-px bg-[#2a2740]" />
                  <p className="text-sm text-[#9490b8]">{normalizedPost.createdAtLabel}</p>
                  <p className="text-sm text-[#9490b8]">{normalizedPost.readTime} min read</p>
                  {isAuthor ? (
                    <button
                      type="button"
                      className="rounded-full border border-[#2a2740] bg-[#0f0f17] px-4 py-2 text-sm font-medium text-[#a89cf7] transition hover:border-[#7c6ff7]/60 hover:bg-[#1c1c2e]"
                    >
                      Your post
                    </button>
                  ) : null}
                </div>
              </div>

              <article className="mt-10 space-y-10">
                {normalizedPost.sections.length > 0 ? (
                  normalizedPost.sections.map((section, index) => (
                    <section key={section.id} id={section.id} className="scroll-mt-28">
                      <div className="mb-4 flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2a2740] bg-[#141420] text-sm text-[#a89cf7]">
                          0{index + 1}
                        </span>
                        <h2
                          className="text-2xl font-semibold text-[#f0eeff]"
                          style={{ fontFamily: "Fraunces, serif" }}
                        >
                          {section.title}
                        </h2>
                      </div>

                      <div className="space-y-5 text-base leading-8 text-[#d4d1ec]">
                        {section.paragraphs.map((paragraph, paragraphIndex) => {
                          const isQuote = index === 1 && paragraphIndex === 0;
                          if (isQuote) {
                            return (
                              <blockquote
                                key={`${section.id}-${paragraphIndex}`}
                                className="border-l-4 border-[#7c6ff7] bg-[#141420] px-5 py-4 text-[1.05rem] italic text-[#f0eeff] shadow-[0_10px_30px_rgba(124,111,247,0.1)]"
                                style={{ fontFamily: "Fraunces, serif" }}
                              >
                                {paragraph}
                              </blockquote>
                            );
                          }

                          return (
                            <p key={`${section.id}-${paragraphIndex}`}>
                              {paragraph}
                            </p>
                          );
                        })}
                      </div>
                    </section>
                  ))
                ) : (
                  <section className="rounded-3xl border border-[#2a2740] bg-[#141420]/80 p-6 text-[#d4d1ec]">
                    <p>{normalizedPost.subtitle}</p>
                  </section>
                )}
              </article>

              <footer className="mt-12 border-t border-[#2a2740] pt-6">
                <div className="flex flex-wrap gap-2">
                  {normalizedPost.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#2a2740] bg-[#141420] px-3 py-1 text-xs text-[#a89cf7] transition hover:border-[#7c6ff7]/60 hover:bg-[#1c1c2e]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                   <div className="flex flex-wrap items-center gap-3">

  {/* LIKE */}
  <button
    type="button"
    onClick={async () => {
      if (!isLoggedIn) {
        router.push(`/login?next=/blog/${normalizedPost.slug}`);
        return;
      }

      try {
        const response = await fetch(
          `${API_ROOT}/posts/${normalizedPost.id}/like`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to like");
        }

        const data = await response.json();

        setLiked(data.liked);

        setPost((prev) => ({
          ...prev,
          likes: data.likes,
        }));
      } catch (err) {
        console.log(err);
      }
    }}
    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
      liked
        ? "border-rose-500/60 bg-rose-500/15 text-rose-300"
        : "border-[#2a2740] bg-[#141420] text-[#f0eeff] hover:border-rose-500/50 hover:text-rose-300"
    }`}
  >
    <Heart
      size={18}
      className={liked ? "fill-current" : ""}
    />
    <span>{post.likes}</span>
  </button>

  {/* COMMENT */}
  <button
    type="button"
    className="flex items-center gap-2 rounded-full border border-[#2a2740] bg-[#141420] px-4 py-2 text-sm font-medium text-[#f0eeff] transition hover:border-[#7c6ff7]/60 hover:text-[#a89cf7]"
  >
    <MessageCircle size={18} />
    <span>{post.comments}</span>
  </button>

  {/* RESTACK */}
  <button
    type="button"
    onClick={async () => {
      if (!isLoggedIn) {
        router.push(`/login?next=/blog/${normalizedPost.slug}`);
        return;
      }
      if (post?.isRestack) {
  return;
}

      try {
        const response = await fetch(
          `${API_ROOT}/posts/${normalizedPost.id}/restack`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to restack");
        }

        const data = await response.json();

        if (!post?.isRestack) {
  setSaved(data.restacked);

  setPost((prev) => ({
    ...prev,
    restacks: data.restacks,
  }));
}
      } catch (err) {
        console.log(err);
      }
    }}
    className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
  post?.isRestack
    ? "border-[#2a2740] bg-[#101018] text-[#55516e] cursor-not-allowed"
    : saved
    ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
    : "border-[#2a2740] bg-[#141420] text-[#f0eeff] hover:border-emerald-500/50 hover:text-emerald-300"
}`}
  >
    <Repeat2 size={18} />
    <span>{normalizedPost.restacks}</span>
  </button>

</div>

                  <div className="flex items-center gap-2">
                    <ShareIconButton label="Share on X" onClick={handleShare}>
                      <span className="text-sm font-semibold">X</span>
                    </ShareIconButton>
                    <ShareIconButton label="Share on LinkedIn" onClick={handleShare}>
                      <span className="text-sm font-semibold">in</span>
                    </ShareIconButton>
                    <ShareIconButton label="Copy link" onClick={handleShare}>
                      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                        <path d="M10 13a5 5 0 0 1 0-7.07l2.12-2.12a5 5 0 1 1 7.07 7.07l-1.41 1.41-1.41-1.41 1.41-1.41a3 3 0 1 0-4.24-4.24L11.41 8.41A3 3 0 0 0 15.66 12.66l-1.41 1.41A5 5 0 0 1 10 13zm4 1a5 5 0 0 1 0 7.07l-2.12 2.12a5 5 0 1 1-7.07-7.07l1.41-1.41 1.41 1.41-1.41 1.41a3 3 0 1 0 4.24 4.24l2.12-2.12A3 3 0 0 0 10.34 12l1.41-1.41A5 5 0 0 1 14 14z" />
                      </svg>
                    </ShareIconButton>
                  </div>
                </div>
              </footer>

              <div className="mt-10">
                <CommentSection
  postId={post._id}
  onCommentAdded={() => {
    setPost((prev) => ({
      ...prev,
      comments: (prev.comments || 0) + 1,
    }));
  }}
  onCommentCountUpdated={(count) => {
    setPost((prev) => ({
      ...prev,
      comments: count,
    }));
  }}
/>
              </div>
            </section>

            <aside className="space-y-6 bg-[#0f0f17]/55 px-5 py-6 sm:px-6 lg:border-l lg:border-[#2a2740] lg:px-6 lg:sticky lg:top-0 lg:h-full lg:self-start lg:overflow-hidden">
              <div className="rounded-3xl border border-[#2a2740] bg-[#141420]/80 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)]">
                <p className="text-xs uppercase tracking-[0.34em] text-[#9490b8]">Post stats</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <StatCard label="Likes" value={normalizedPost.likes.toLocaleString()} />
                  <StatCard label="Comments" value={normalizedPost.comments.toLocaleString()} />
                </div>
              </div>

              <div className="rounded-3xl border border-[#2a2740] bg-[#141420]/80 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)]">
                <p className="text-xs uppercase tracking-[0.34em] text-[#9490b8]">In this post</p>
                <div className="mt-4 space-y-2">
                  {normalizedPost.sections.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => scrollToSection(section.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        activeSection === section.id
                          ? "border-[#7c6ff7]/60 bg-[#7c6ff7]/15 text-[#f0eeff]"
                          : "border-[#2a2740] bg-[#0f0f17] text-[#9490b8] hover:border-[#7c6ff7]/40 hover:bg-[#1c1c2e] hover:text-[#f0eeff]"
                      }`}
                    >
                      <span>{section.title}</span>
                      <span className="text-xs text-[#a89cf7]">{String(section.paragraphs.length).padStart(2, "0")}</span>
                    </button>
                  ))}
                </div>
              </div>

              {isAuthor ? (
                <div className="rounded-3xl border border-[#2a2740] bg-[#141420]/80 p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)]">
                  <p className="text-xs uppercase tracking-[0.34em] text-[#9490b8]">Manage post</p>
                  <div className="mt-4 space-y-3">
                    <Link
                      href={`/editor-dashboard?slug=${normalizedPost.slug}`}
                      className="block rounded-2xl border border-[#7c6ff7]/35 bg-[#0f0f17] px-4 py-3 text-center text-sm font-medium text-[#a89cf7] transition hover:border-[#7c6ff7]/60 hover:bg-[#1c1c2e]"
                    >
                      Edit post
                    </Link>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="block w-full rounded-2xl border border-[#2a2740] bg-[#0f0f17] px-4 py-3 text-sm font-medium text-rose-200 transition hover:border-rose-500/40 hover:bg-[#1c1c2e]"
                    >
                      Delete post
                    </button>
                  </div>
                </div>
              ) : null}
            </aside>
          </main>
        </div>
      </div>

      {error ? (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-rose-500/30 bg-rose-500/15 px-4 py-2 text-sm text-rose-200 shadow-xl">
          {error}
        </div>
      ) : null}
    </div>
  );
}
