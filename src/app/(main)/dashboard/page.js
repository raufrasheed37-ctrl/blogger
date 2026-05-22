"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from '@/store/authstore';
import { authorsAPI, blogAPI } from '@/utils/api';
import { useEffect } from 'react';
import { Home, User, Heart, BarChart3, Repeat2, LogOut,  MessageCircle, Search, PenSquare, FileText,  Users, Table, Info} from 'lucide-react';
import { Expletus_Sans } from "next/font/google";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_ROOT = `${API_BASE_URL}${API_BASE_URL.endsWith("/api") ? "" : "/api"}`;

const TYPE_META = {
  like: { label: "liked your post", icon: "❤️" },
  comment: { label: "commented on your post", icon: "💬" },
  restack: { label: "restacked your post", icon: "🔁" },
  reply: { label: "replied to your post", icon: "💬" },
  subscribe: { label: "subscribed to your blog", icon: "⭐" },
};

const ACTIVITY_FILTERS = ["All", "Likes", "Comments", "Replies", "Restacks", "Subscriptions"];

const ACTIVITY_FILTER_MAP = {
  Likes: "like",
  Comments: "comment",
  Replies: "reply",
  Restacks: "restack",
  Subscriptions: "subscribe",
};

function ActivityItem({ item }) {
  return (
    <article className="rounded-3xl border border-[#2a2740] bg-[#141420] p-6 transition hover:-translate-y-0.5 hover:shadow-[0_25px_70px_-30px_rgba(124,111,247,0.2)]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#2a2740] bg-[#1c1c2e] text-xl">
          {TYPE_META[item.type]?.icon || "🔔"}
        </div>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#a89cf7]">{item.actor?.name}</span>
            <span className="text-sm text-[#9490b8]">{TYPE_META[item.type]?.label}</span>
          </div>

          {item.content && (
            <div className="mt-4 rounded-2xl border border-[#2a2740] bg-[#1c1c2e] p-4 text-sm leading-7 text-[#9490b8]">
              {item.content}
            </div>
          )}

          {item.post && (
            <div className="mt-4 rounded-2xl border border-[#2a2740] bg-[#1c1c2e] p-4">
              <p className="font-medium text-[#f0eeff]">{item.post?.title}</p>
              <p className="mt-1 text-xs text-[#9490b8]">{item.meta}</p>
            </div>
          )}
        </div>

        <div className="whitespace-nowrap text-xs text-[#9490b8]">
          {new Date(item.createdAt).toLocaleString()}
        </div>
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Activity");
  const [activeFilter, setActiveFilter] = useState("All");
  const [activityItems, setActivityItems] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [authorPosts, setAuthorPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = useAuthStore((s) => s.user);
  const hydrate = useAuthStore((s) => s.hydrate);
  const token = useAuthStore((s) => s.token);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    router.push("/login");
  };

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    (async () => {
      setActivityLoading(true);

      try {
        const response = await fetch(`${API_ROOT}/activity`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const result = await response.json();

        if (!cancelled) {
          setActivityItems(Array.isArray(result) ? result : []);
        }
      } catch (error) {
        if (!cancelled) {
          console.debug('Failed to load dashboard activity', error?.message || error);
          setActivityItems([]);
        }
      } finally {
        if (!cancelled) {
          setActivityLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const authorId = user?._id || user?.id;

  useEffect(() => {
    if (!authorId) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const data = await authorsAPI.getById(authorId);
        const author = data?.author || data;

        if (!cancelled && author) {
          const resolvedSubscribers =
            typeof author.subscribers === "number"
              ? author.subscribers
              : typeof author.subscriberCount === "number"
                ? author.subscriberCount
                : null;

          useAuthStore.getState().setUser({
            ...author,
            _id: author._id || author.id || authorId,
          });

          setSubscriberCount(resolvedSubscribers);
        }
      } catch (err) {
        console.debug('Failed to refresh dashboard user', err?.message || err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authorId]);

  useEffect(() => {
    const authorId = user?._id || user?.id;
    if (!authorId) {
      return;
    }

    let cancelled = false;

    (async () => {
      setPostsLoading(true);

      try {
        const response = await blogAPI.getByAuthor(authorId);
        const livePosts = Array.isArray(response?.posts) ? response.posts : [];

        if (!cancelled) {
          setAuthorPosts(livePosts);
        }
      } catch (error) {
        if (!cancelled) {
          console.debug('Failed to load dashboard posts', error?.message || error);
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

  const getDisplayName = (u) => {
    const name = u?.name;
    if (name && typeof name === 'string' && name.trim()) return name.trim();

    const email = u?.email;
    if (email && typeof email === 'string' && email.includes('@')) {
      const local = email.split('@')[0] || 'user';
      return local
        .replace(/[._-]+/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }

    return 'User';
  };

  const getUsername = (u) => {
    if (u?.email && typeof u.email === 'string') {
      const local = u.email.split('@')[0] || 'user';
      return `@${local}`.replace(/\s+/g, '');
    }

    const name = typeof u?.name === 'string' ? u.name : '';
    const slug = name
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9@._-]/g, '') || 'user';
    return `@${slug}`;
  };

  const displayName = user ? getDisplayName(user) : 'User';
  const username = user ? getUsername(user) : '@user';
  const initial = (displayName?.[0] || 'U').toUpperCase();

  const tabs = [
   // { label: "Activity", icon: BarChart3 },
    { label: "Posts", icon: PenSquare, count: authorPosts.length },
    { label: "About", icon: Info },
  ];

  const filteredActivityItems =
    activeFilter === "All"
      ? activityItems
      : activityItems.filter((item) => item.type === ACTIVITY_FILTER_MAP[activeFilter]);

  const stats = [
    { label: "Posts", value: authorPosts.length, icon: FileText },
    { label: "Likes Received", value: "0", icon: Heart },
    {
      label: "Subscribers",
      value:
        subscriberCount === null
          ? typeof user?.subscribers === "number"
            ? user.subscribers
            : "Loading..."
          : subscriberCount,
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d0d14] text-[#f0eeff] overflow-hidden">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#7c6ff7]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[#7c6ff7]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#141420] border-r border-[#2a2740] p-6 flex flex-col transition-transform md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-12">
            <div className="w-10 h-10 bg-linear-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
  <PulseIcon className="w-6 h-6" />
</div>
            <span className="text-2xl font-bold">Pulse<span className="text-[#7c6ff7]">.</span></span>
          </Link>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 mb-8">
            {[
              { label: "Home", icon: Home, href: "/" },
              { label: "Activity", icon: BarChart3, href: "/activity" },
              { label: "Explore", icon: Search, href: "/explore" },
              { label: "Profile", icon: User, href: "/dashboard", active: true },
            ].map((item) => (
              <Link key={item.label} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${item.active ? 'bg-[#7c6ff7]/20 border border-[#7c6ff7]/50 text-[#a89cf7]' : 'text-[#9490b8] hover:text-[#f0eeff] hover:bg-[#1c1c2e]'}`}>
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Bottom Actions */}
          <div className="space-y-3">
            <Link href="/blog/create" className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-[#7c6ff7] to-[#a89cf7] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-[#7c6ff7]/30 transition">
              <span>✨</span> Create
            </Link>
            <button onClick={handleLogout} className="w-full px-4 py-3 border border-[#2a2740] hover:border-[#7c6ff7]/50 text-[#9490b8] hover:text-[#f0eeff] rounded-xl font-medium transition hover:bg-[#1c1c2e]">
              Logout
            </button>
          </div>

          {/* Close button on mobile */}
          <button onClick={() => setSidebarOpen(false)} className="md:hidden absolute top-6 right-6 text-[#9490b8] hover:text-[#f0eeff]">
            ✕
          </button>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="md:hidden fixed inset-0 bg-black/50 z-30" />}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
            {/* Header with mobile menu toggle */}
            <div className="flex items-center justify-between">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden text-[#7c6ff7]">
                ☰
              </button>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <div className="w-10 h-10" />
            </div>

            {/* Profile Banner */}
            <section className="relative rounded-2xl bg-linear-to-br from-[#7c6ff7]/10 to-[#a89cf7]/5 border border-[#2a2740] p-8 overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#7c6ff7]/5 rounded-full blur-3xl -z-10" />
              
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                {/* Avatar */}
                <div className="relative group">
                  <div className="w-32 h-32 rounded-full bg-linear-to-br from-[#7c6ff7] to-[#a89cf7] p-1">
                    <div className="w-full h-full rounded-full bg-[#0d0d14] flex items-center justify-center text-4xl font-bold text-[#7c6ff7] group-hover:text-[#a89cf7] transition">
                      {initial}
                    </div>
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left">
                  <p className="text-[#9490b8] text-sm font-semibold uppercase tracking-wider mb-2">Creator Profile</p>
                  <h2 className="text-4xl font-bold mb-2">{displayName}</h2>
                  <p className="text-[#a89cf7] text-lg mb-4">{username}</p>
                  <p className="mx-auto mb-6 max-w-2xl text-sm leading-6 text-[#d4d1ec] md:mx-0">
                    {user?.bio?.trim() || "Add a short bio in Edit Profile to personalize your dashboard."}
                  </p>
                  <p className="text-[#9490b8] mb-6">
                    {subscriberCount === null
                      ? typeof user?.subscribers === "number"
                        ? `${user.subscribers} subscribers`
                        : "Loading subscribers..."
                      : `${subscriberCount} subscribers`}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href="/blog/create" className="px-6 py-2 bg-linear-to-r from-[#7c6ff7] to-[#a89cf7] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-[#7c6ff7]/30 transition">
                      Create Post
                    </Link>
                    <Link href="/contact" className="px-6 py-2 border border-[#2a2740] text-[#9490b8] rounded-lg font-semibold hover:border-[#7c6ff7]/50 hover:text-[#f0eeff] hover:bg-[#1c1c2e] transition">
                      Edit Profile
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center justify-center mx-auto">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                <div key={idx} className="rounded-xl bg-[#141420] border border-[#2a2740] p-6 hover:border-[#7c6ff7]/50 transition group">
                  <p className="text-[#9490b8] text-sm font-medium mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold text-[#f0eeff] group-hover:text-[#7c6ff7] transition">{stat.value}</p>
                    <Icon className="h-8 w-8 mt-3 opacity-50 group-hover:opacity-100 transition" />
                </div>
                );
              })}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-[#2a2740] overflow-x-auto">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.label;
                const TabIcon = tab.icon;
                return (
                  <button key={tab.label} onClick={() => setActiveTab(tab.label)} className={`relative px-4 py-3 font-medium text-sm transition whitespace-nowrap ${
                    isActive 
                      ? 'text-[#7c6ff7] border-b-2 border-[#7c6ff7]' 
                      : 'text-[#9490b8] hover:text-[#f0eeff]'
                  }`}>
                    <span className="flex items-center gap-2">
                      <TabIcon className="h-4 w-4" />
                      {tab.label}
                      {tab.count !== undefined && <span className="text-xs text-[#9490b8]">({tab.count})</span>}
                     
                    </span>
                  </button>
                );
              })}
            </div>

          /*  Post Composer (dashboard only) 
            {activeTab === "Activity" && (
              <section className="rounded-xl bg-[#141420] border border-[#2a2740] p-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-linear-to-br from-[#7c6ff7] to-[#a89cf7] flex items-center justify-center font-bold text-white shrink-0">
                    {initial}
                  </div>
                  <textarea
                    placeholder="What's on your mind?"
                    rows={4}
                    className="flex-1 bg-[#1c1c2e] border border-[#2a2740] rounded-lg px-4 py-3 text-[#f0eeff] placeholder-[#9490b8] outline-none focus:border-[#7c6ff7] focus:ring-1 focus:ring-[#7c6ff7]/50 resize-none transition"
                  />
                </div>
              </section>
            )} */

            {/* Posts Section */}
            {activeTab === "Posts" && (
              <section className="space-y-4">
                {postsLoading ? (
                  <div className="text-center py-12 text-[#9490b8]">Loading posts...</div>
                ) : authorPosts.length > 0 ? (
                  <div className="space-y-4">
                    {authorPosts.map((post) => (
  <Link
    key={post._id || post.id || post.slug}
    href={`/blog/${post.slug}`}
    className="block rounded-xl bg-[#141420] border border-[#2a2740] p-6 hover:border-[#7c6ff7]/50 hover:bg-[#1c1c2e] transition group"
  >
                       
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div className="w-16 h-16 rounded-lg bg-linear-to-br from-[#7c6ff7]/20 to-[#a89cf7]/20 border border-[#2a2740] flex items-center justify-center text-2xl shrink-0 group-hover:from-[#7c6ff7]/30 group-hover:to-[#a89cf7]/30 transition">
                            <FileText />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-1 bg-[#7c6ff7]/20 border border-[#7c6ff7]/50 text-[#a89cf7] text-xs font-semibold rounded">
                                {post.tags?.[0] || "General"}
                              </span>
                              <span className="text-xs text-[#9490b8]">

                                {post.isRestack ? (
  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">
    <Repeat2 size={14} />
    Restack
  </span>
) : post.published ? (
  "Published"
) : (
  "Draft"
)}
                     </span>
                            </div>
                               
                   
 {post.isRestack && (
  <p className="text-xs text-[#a89cf7] mb-1">
    <span className="inline-flex items-center gap-1 text-xs text-emerald-300">
  <Repeat2 size={14} />
  Restacked from {post.restackedFrom?.name || "Unknown"}
</span>
  </p>
  )}
                
                            <h3 className="text-lg font-bold text-[#f0eeff] group-hover:text-[#7c6ff7] transition line-clamp-1">
  {post.isRestack ? (
    <>
      <span className="inline-flex items-center gap-2 text-[#a89cf7]">
  <Repeat2 size={16} />
  Restacked
</span>
{post.originalPost?.title || post.title}
    </>
  ) : (
    post.title
  )}
</h3>
                            <p className="text-[#9490b8] text-sm mt-1 line-clamp-2">
  {post.isRestack
    ? `From ${
        post.originalPost?.author?.name || "Unknown author"
      }`
    : post.excerpt || "No description"}
</p>
                            <div className="flex items-center gap-4 mt-3 text-xs text-[#9490b8]">
                              <span>📅 {new Date(post.createdAt).toLocaleDateString()}</span>
                              <span>⏱️ 5 min read</span>
                            </div>
                          </div>

                          {/* <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                            <button className="p-2 hover:bg-[#1c1c2e] rounded-lg text-[#9490b8] hover:text-[#f0eeff]">❤️</button>
                            <button className="p-2 hover:bg-[#1c1c2e] rounded-lg text-[#9490b8] hover:text-[#f0eeff]">💬</button>
                            <button className="p-2 hover:bg-[#1c1c2e] rounded-lg text-[#9490b8] hover:text-[#f0eeff]">↗️</button>
                          </div> */}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl bg-[#141420] border border-[#2a2740] p-12 text-center">
                    <p className="text-4xl mb-4">✍️</p>
                    <h3 className="text-xl font-bold text-[#f0eeff] mb-2">No posts yet</h3>
                    <p className="text-[#9490b8] mb-6">Start creating your first post to see it here</p>
                    <Link href="/blog/create" className="inline-block px-6 py-2 bg-linear-to-r from-[#7c6ff7] to-[#a89cf7] text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-[#7c6ff7]/30 transition">
                      Create First Post
                    </Link>
                  </div>
                )}
              </section>
            )}


            {/* About Section */}
            {activeTab === "About" && (
              <section className="rounded-xl bg-[#141420] border border-[#2a2740] p-6">
                <h3 className="text-lg font-bold text-[#f0eeff] mb-5">About Me</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-[#9490b8] text-sm mb-1">Bio</p>
                    <p className="text-[#f0eeff]">{user?.bio?.trim() || "No bio added yet."}</p>
                  </div>
                  <div>
                    <p className="text-[#9490b8] text-sm mb-1">Email</p>
                    <p className="text-[#f0eeff]">{user?.email || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-[#9490b8] text-sm mb-1">Location</p>
                    <p className="text-[#f0eeff]">{user?.address || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-[#9490b8] text-sm mb-1">Website</p>
                    <p className="text-[#f0eeff]">{user?.website ? <a href={user.website} className="text-[#7c6ff7] hover:underline">{user.website}</a> : "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-[#9490b8] text-sm mb-1">Phone</p>
                    <p className="text-[#f0eeff]">{user?.phoneNo || user?.phone || "Not provided"}</p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
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
