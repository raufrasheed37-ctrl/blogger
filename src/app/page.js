"use client";

import BlogCard from "@/components/BlogCard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authstore";
import { useEffect, useRef, useState } from "react";
import { blogAPI } from "@/utils/api";
import id from "zod/v4/locales/id.cjs";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);
  const hasSession = Boolean(isMounted && (token || user || localStorage.getItem("token")));
  const postsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(posts.length / postsPerPage));
  const listRef = useRef(null);

  const start = (currentPage - 1) * postsPerPage;
  const visiblePosts = posts.slice(start, start + postsPerPage);
  const featuredPost = posts[0];
  const recentPosts = posts.slice(1, 4);

  const heroContent = [
    {
      title: "Discover Stories That Inspire",
      subtitle: "Explore thoughtfully crafted articles from creators building authentic communities",
    },
    {
      title: "Where Ideas Meet Impact",
      subtitle: "Read, learn, and grow with premium content designed for creators and thinkers",
    },
    {
      title: "Your Creative Hub Awaits",
      subtitle: "Join a community of writers and readers shaping the future of content",
    },
  ];

  const [activeHero, setActiveHero] = useState(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsMounted(true));
    hydrate();

    return () => window.cancelAnimationFrame(frame);
  }, [hydrate]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setPostsLoading(true);
      try {
        const response = await blogAPI.getAll();
        const livePosts = Array.isArray(response?.posts) ? response.posts : [];

        if (cancelled) return;

        const mappedPosts = livePosts.map((post) => ({
          _id: post._id,
          name: post.author?.name || "Anonymous",
          handle: post.author?.email ? `@${post.author.email.split("@")[0]}` : "@anonymous",
          time: post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "just now",
          slug: post.slug || post._id,
          title: post.title,
          category: post.tags?.[0] || "General",
          likes: post.likes ?? 0,
          comments: post.commentCount ?? 0,
          text: post.excerpt || "",
          avatarClass: "from-purple-400 to-pink-500",
          author: post.author,
          authorId: post.author?._id || post.author?.id,
        }));

        setPosts(mappedPosts);
      } catch (error) {
        if (!cancelled) {
          setPosts([]);
          console.debug("Home feed failed to load:", error?.message || error);
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
  }, []);

  const handleCreateClick = () => {
    const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    if (currentToken) {
      router.push("/blog/create");
      return;
    }

    router.push("/login?next=/blog/create");
  };

  const handleLogout = () => {
    useAuthStore.getState().logout();
    router.push("/");
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHero((prev) => (prev + 1) % heroContent.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [heroContent.length]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-purple-950 to-slate-900 text-white overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="z-50 sticky top-0 backdrop-blur-lg bg-slate-950/40 border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-linear-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center transform group-hover:scale-110 transition">
              <PulseIcon className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold">Pulse</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-300 hover:text-white transition font-medium">Home</Link>
            <Link href="/explore" className="text-gray-300 hover:text-white transition font-medium">Explore</Link>
            <Link href="/activity" className="text-gray-300 hover:text-white transition font-medium">Activity</Link>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={handleCreateClick} className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 transition font-semibold shadow-lg">
            Create
            </button>
            {hasSession ? (
              <button onClick={handleLogout} className="px-4 py-2 rounded-lg border border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/10 transition font-medium">
                Logout
              </button>
            ) : (
              <Link href="/login" className="px-4 py-2 rounded-lg border border-purple-500/30 hover:border-purple-500 hover:bg-purple-500/10 transition font-medium">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div>
              <span className="inline-block px-4 py-2 rounded-full bg-purple-500/20 border border-purple-500/50 text-purple-200 text-sm font-semibold mb-6">
                Welcome to Pulse 🌟
              </span>
              <h1 className="text-5xl md:text-6xl font-black leading-tight space-y-2">
                <span className="block">{heroContent[activeHero].title.split(' ').slice(0, 2).join(' ')}</span>
                <span className="block bg-linear-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {heroContent[activeHero].title.split(' ').slice(2).join(' ')}
                </span>
              </h1>
              <p className="text-lg text-gray-300 mt-6 leading-relaxed max-w-lg">
                {heroContent[activeHero].subtitle}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button onClick={() => router.push('/explore')} className="px-8 py-4 bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-bold text-lg transition transform hover:scale-105 shadow-xl">
                Explore Articles
              </button>
              <button onClick={() => {
                if (token) router.push('/dashboard');
                else router.push('/login?next=/dashboard');
              }} className="px-8 py-4 border-2 border-purple-500/50 hover:border-purple-400 rounded-xl font-bold text-lg transition hover:bg-purple-500/10">
                Go to Dashboard
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-6 pt-8 border-t border-purple-500/20">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 border-slate-950 bg-linear-to-br from-purple-${400 + i*100} to-pink-${400 + i*100}`} />
                ))}
              </div>
              <div>
                <p className="font-bold text-lg">10k+ Readers</p>
                <p className="text-gray-400">Enjoying premium content daily</p>
              </div>
            </div>

            {/* Slide Indicators */}
            <div className="flex gap-2 pt-4">
              {heroContent.map((_, idx) => (
                <button key={idx} onClick={() => setActiveHero(idx)} className={`h-2 rounded-full transition ${idx === activeHero ? 'w-8 bg-purple-500' : 'w-2 bg-purple-500/40 hover:bg-purple-500/60'}`} />
              ))}
            </div>
          </div>

          {/* Right Featured Article Card */}
          {featuredPost ? (
            <Link href={`/blog/${featuredPost.slug}`} className="group">
              <div className="relative rounded-2xl overflow-hidden backdrop-blur-xl border border-purple-500/30 bg-linear-to-br from-purple-500/10 to-indigo-500/10 hover:border-purple-500/60 transition shadow-2xl h-full">
                <div className="absolute inset-0 bg-linear-to-br from-purple-600/20 via-transparent to-indigo-600/20 group-hover:from-purple-600/30 transition" />
                
                <div className="relative p-8 h-full flex flex-col justify-between min-h-125">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-linear-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold mb-4">
                      {featuredPost.category}
                    </span>
                    <h3 className="text-3xl font-black text-white group-hover:text-purple-200 transition leading-tight line-clamp-3">
                      {featuredPost.title}
                    </h3>
                    <p className="mt-6 text-gray-300 line-clamp-3">{featuredPost.text}</p>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-purple-500/20">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full bg-linear-to-br ${featuredPost.avatarClass}`} />
                      <div>
                        <p className="font-bold text-sm">{featuredPost.name}</p>
                        <p className="text-gray-400 text-xs">{featuredPost.time}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">5 min read</span>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 h-96 flex items-center justify-center text-gray-400">
              No featured article yet
            </div>
          )}
        </div>
      </section>

      {/* Featured Articles Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="mb-12">
          <h2 className="text-4xl font-black mb-3">Featured Articles</h2>
          <p className="text-gray-400 text-lg">Handpicked stories worth your time</p>
        </div>

        {postsLoading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-purple-500/20 bg-purple-500/5 h-96 animate-pulse" />
            ))}
          </div>
        ) : recentPosts.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {recentPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group">
                <div className="h-full rounded-2xl overflow-hidden backdrop-blur-xl border border-purple-500/30 bg-linear-to-br from-purple-500/10 to-indigo-500/10 hover:border-purple-500/60 transition shadow-lg hover:shadow-2xl duration-300 transform hover:-translate-y-1 flex flex-col">
                  {/* Image placeholder */}
                  <div className={`h-48 bg-linear-to-br ${post.avatarClass} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition" />
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-purple-200 text-xs font-bold">
                        {post.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 p-6 flex flex-col">
                    <h3 className="text-xl font-bold text-white group-hover:text-purple-200 transition mb-3 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-6 line-clamp-2 flex-1">{post.text}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-purple-500/20">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full bg-linear-to-br ${post.avatarClass}`} />
                        <div>
                          <p className="font-bold text-xs text-white">{post.name}</p>
                          <p className="text-gray-500 text-xs">{post.time}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">5 min</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-12 text-center text-gray-400">
            No articles available yet
          </div>
        )}
      </section>

      {/* All Articles Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="mb-12">
          <h2 className="text-4xl font-black mb-3">Latest Articles</h2>
          <p className="text-gray-400 text-lg">Explore our full collection</p>
        </div>

        {postsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl border border-purple-500/20 bg-purple-500/5 animate-pulse" />
            ))}
          </div>
        ) : visiblePosts.length > 0 ? (
          <div className="space-y-4" ref={listRef}>
            {visiblePosts.map((post) => (
              <BlogCard key={post.slug || post._id || post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-12 text-center text-gray-400">
            No articles yet
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-lg border border-purple-500/30 hover:border-purple-500 disabled:opacity-40 transition">
              ← Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const page = i + 1;
              return (
                <button key={page} onClick={() => setCurrentPage(page)} className={`w-10 h-10 rounded-lg font-bold transition ${currentPage === page ? 'bg-linear-to-r from-purple-600 to-indigo-600' : 'border border-purple-500/30 hover:border-purple-500'}`}>
                  {page}
                </button>
              );
            })}
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg border border-purple-500/30 hover:border-purple-500 disabled:opacity-40 transition">
              Next →
            </button>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-purple-500/20 bg-slate-950/60 backdrop-blur-xl py-16 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-linear-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <PulseIcon className="w-4 h-4" />
                </div>
                <span className="font-bold text-lg">Pulse</span>
              </div>
              <p className="text-gray-400 text-sm">Premium content platform for creators</p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Explore</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/" className="hover:text-purple-400 transition">Home</Link></li>
                <li><Link href="/explore" className="hover:text-purple-400 transition">Articles</Link></li>
                <li><Link href="/activity" className="hover:text-purple-400 transition">Trending</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Community</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/" className="hover:text-purple-400 transition">Blog</Link></li>
                <li><Link href="/" className="hover:text-purple-400 transition">Writers</Link></li>
                <li><Link href="/" className="hover:text-purple-400 transition">Creators</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/" className="hover:text-purple-400 transition">Help Center</Link></li>
                <li><Link href="/" className="hover:text-purple-400 transition">Guidelines</Link></li>
                <li><Link href="/" className="hover:text-purple-400 transition">API</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/" className="hover:text-purple-400 transition">Privacy</Link></li>
                <li><Link href="/" className="hover:text-purple-400 transition">Terms</Link></li>
                <li><Link href="/" className="hover:text-purple-400 transition">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-purple-500/20 pt-8 flex flex-col md:flex-row items-center justify-between text-gray-400 text-sm">
            <p>&copy; 2026 Pulse. All rights reserved.</p>
            
          </div>
        </div>
      </footer>
    </div>
  );
}

function PulseIcon({ className = "w-5 h-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 11.8L12 5l8 6.8V20a1 1 0 0 1-1 1h-4.8v-5.6H9.8V21H5a1 1 0 0 1-1-1v-8.2Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M4 12h4l2-5 4 10 2-5h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExploreIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path d="m15.8 8.2-2.6 5.6-5.6 2.6 2.6-5.6 5.6-2.6Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 19a7 7 0 0 1 14 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-zinc-500">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m16.2 16.2 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}