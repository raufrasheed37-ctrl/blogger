"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import useAuthStore from "@/store/authstore";
import { getLoginRedirect } from "@/utils/auth";
import { isClientAuthenticated } from "@/store/authstore";
import CommentSection from "@/components/CommentSection";
import {
  Home,
  User,
  Heart,
  BarChart3,
  LogOut,
  Search,
  MessageCircle,
  Repeat2,
} from "lucide-react";
import Link from "next/link";

export default function ExplorePage() {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const categories = [
    "Explore",
    "Culture",
    "Technology",
    "Business",
    "Sports",
    "Entertainment",
  ];

  const tabs = ["Top", "Recent", "Trending"];

  const [posts, setPosts] = useState([]);
  const [search, setSearch] =
  useState("");
  const [activeCategory, setActiveCategory] =
  useState("Explore");
  const [activeTab, setActiveTab] =
  useState("Recent");
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    useAuthStore.getState().logout();
    router.push("/login");
  };

  useEffect(() => {
  const fetchPosts = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch posts");
      }

      const data = await res.json();

      setPosts(data.posts || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  fetchPosts();
}, []);

  const filteredPosts = posts.filter((post) => {

  const matchesSearch =
    post.title
      ?.toLowerCase()
      .includes(
        search.toLowerCase()
      );

  const matchesCategory =
    activeCategory === "Explore"
      ? true
      : post.category
          ?.toLowerCase()
          .trim() ===
        activeCategory
          .toLowerCase()
          .trim();

  return (
    matchesSearch &&
    matchesCategory
  );
});

const sortedPosts = [...filteredPosts];

if (activeTab === "Top") {
  sortedPosts.sort(
    (a, b) =>
      (b.likes || 0) -
      (a.likes || 0)
  );
}

  if (activeTab === "Recent") {
  sortedPosts.sort(
    (a, b) =>
      new Date(b.createdAt) -
      new Date(a.createdAt)
  );
}

  if (activeTab === "Trending") {
  sortedPosts.sort((a, b) => {

    const aScore =
      (a.likes || 0) +
      (a.restacks || 0) +
      (a.comments || a.replyCount || 0)

    const bScore =
      (b.likes || 0) +
      (b.restacks || 0) +
      (b.comments || b.replyCount || 0)

    return bScore - aScore;
  });
}

  

  const ExplorePostCard = ({ post }) => {
    const postId = post._id || post.id;

    const [liked, setLiked] =
  useState(false);

const [restacked, setRestacked] =
  useState(false);

const [localPost, setLocalPost] =
  useState(post);

const [subscribed, setSubscribed] =
  useState(false);

    const [showComments, setShowComments] = useState(false);

    const postAuthorId = post?.author?._id || post?.author?.id || post?.authorId || null;
    const postAuthorEmail = post?.author?.email || null;
    const postAuthorName = post?.author?.name || null;
    const currentUserId = user?._id || user?.id || null;
    const isAuthor = Boolean(
      user && (
        (postAuthorId && currentUserId && postAuthorId === currentUserId) ||
        (postAuthorEmail && user.email && postAuthorEmail === user.email) ||
        (postAuthorName && user.name && postAuthorName === user.name)
      )
    );

    const requireAuth = () => {
      if (token || isClientAuthenticated()) {
        return true;
      }

      router.push(getLoginRedirect(pathname));
      return false;
    };


    

    return (
      <article className="border-b border-[#2a2740] pb-10">

        {/* HEADER */}
        <div className="flex items-start justify-between">

          {isAuthor ? (
            <Link href="/dashboard" className="flex gap-4 hover:opacity-80 transition">

              <div className="h-12 w-12 rounded-full bg-linear-to-br from-[#7c6ff7] to-[#a89cf7] cursor-pointer" />

              <div>
                <h3 className="text-lg font-semibold text-[#f0eeff]">
                  {post.author?.name || "User"}
                </h3>

                <p className="text-sm text-[#9490b8]">
                  @{post.author?.username || post.author?.name?.toLowerCase() || "user"}
                </p>

                <p className="text-sm text-[#9490b8]">
                  {new Date(
                    post.createdAt
                  ).toLocaleDateString()}
                </p>
              </div>

            </Link>
          ) : (
            <Link href={`/profile/${post.author?._id || post.author?.id || post.author?.username || post.author?.name?.toLowerCase() || "user"}`} className="flex gap-4 hover:opacity-80 transition">

              <div className="h-12 w-12 rounded-full bg-linear-to-br from-[#7c6ff7] to-[#a89cf7] cursor-pointer" />

              <div>
                <h3 className="text-lg font-semibold text-[#f0eeff]">
                  {post.author?.name || "User"}
                </h3>

                <p className="text-sm text-[#9490b8]">
                  @{post.author?.username || post.author?.name?.toLowerCase() || "user"}
                </p>

                <p className="text-sm text-[#9490b8]">
                  {new Date(
                    post.createdAt
                  ).toLocaleDateString()}
                </p>
              </div>

            </Link>
          )}

          <button
  type="button"
  onClick={() =>
    setSubscribed(!subscribed)
  }
  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
    subscribed
      ? "bg-[#7c6ff7]/20 text-[#a89cf7] border border-[#7c6ff7]/50"
      : "bg-[#7c6ff7] text-white hover:bg-[#a89cf7]"
  }`}
>
  {subscribed
    ? "Subscribed"
    : "Subscribe"}
</button>
          

        </div>

        {/* CONTENT */}
        <div
  className="mt-5 cursor-pointer"
  onClick={() =>
    router.push(
      `/blog/${post.slug || post._id}`
    )
  }
>

  <h2 className="text-2xl font-bold text-[#f0eeff]">
    {post.title}
  </h2>

  <div
    className="mt-4 text-lg leading-8 text-[#9490b8]"
    dangerouslySetInnerHTML={{
      __html: post.content,
    }}
  />

  {post.coverImage &&
   !post.coverImage.startsWith("blob:") && (
    <img
      src={post.coverImage}
      alt={post.title}
      className="mt-6 w-full rounded-3xl object-cover"
    />
  )}

</div>

        {/* ACTION BUTTONS */}
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-[#9490b8]">

          {/* LIKE */}
          <button
  type="button"
  onClick={async () => {
    if (!requireAuth()) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${localPost._id}/like`,
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

      setLocalPost((prev) => ({
        ...prev,
        likes: data.likes,
      }));
      setPosts((prevPosts) =>
  prevPosts.map((p) =>
    p._id === localPost._id
      ? {
          ...p,
          likes: data.likes,
        }
      : p
  )
);
            
    } catch (err) {
      console.log(err);
    }
  }}
  className={`flex items-center gap-2 rounded-full border px-4 py-2 transition ${
    liked
      ? "border-rose-500/60 bg-rose-500/15 text-rose-300"
      : "border-[#2a2740] hover:border-rose-500/50 hover:text-rose-300"
  }`}
>
  <Heart
    size={18}
    className={liked ? "fill-current" : ""}
  />

  <span>
    {localPost.likes ||
 localPost.likeCount ||
 0}
  </span>
</button>

          {/* COMMENT */}
          <button
  type="button"
  onClick={() => {
    if (!requireAuth()) return;

    setShowComments(
      (prev) => !prev
    );
  }}
  className="flex items-center gap-2 rounded-full border border-[#2a2740] px-4 py-2 transition hover:border-[#7c6ff7]/40 hover:text-[#a89cf7]"
>
  <MessageCircle size={18} />

  <span>
    {localPost.comments ||
 localPost.replyCount ||
 0}
  </span>
</button>

          {/* RESTACK */}
          <button
  type="button"
  onClick={async () => {
    if (!requireAuth()) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/posts/${localPost._id}/restack`,
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

      setRestacked(data.restacked);

      setLocalPost((prev) => ({
        ...prev,
        restacks: data.restacks,
      }));
     setPosts((prevPosts) =>
  prevPosts.map((p) =>
    p._id === localPost._id
      ? {
          ...p,
          restacks: data.restacks,
        }
      : p
  )
);
      
    } catch (err) {
      console.log(err);
    }
  }}
  className={`flex items-center gap-2 rounded-full border px-4 py-2 transition ${
    restacked
      ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-300"
      : "border-[#2a2740] hover:border-emerald-500/50 hover:text-emerald-300"
  }`}
>
  <Repeat2
    size={18}
  />

  <span>
    {localPost.restacks ||
 localPost.restackCount ||
 0}
  </span>
</button>

        </div>

        {/* COMMENT SECTION */}
        {showComments && (
  <CommentSection
    postId={postId}
    requireAuth={requireAuth}
    onCommentAdded={() => {
  setLocalPost((prev) => ({
    ...prev,
    comments:
      (prev.comments ||
        prev.replyCount ||
        0) + 1,
  }));

      setPosts((prevPosts) =>
  prevPosts.map((p) =>
    p._id === localPost._id
      ? {
          ...p,
          comments:
            ((p.comments ||
              p.replyCount ||
              0) + 1),
        }
      : p
  )
);
}}
  />
)}
        

      </article>
    );
  };

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
  { label: "Profile", icon: User, href: "/dashboard" },
].map((item) => {
  const Icon = item.icon;

  return (
    <Link
      key={item.label}
      href={item.href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
        pathname === item.href
          ? 'bg-[#7c6ff7]/20 border border-[#7c6ff7]/50 text-[#a89cf7]'
          : 'text-[#9490b8] hover:text-[#f0eeff] hover:bg-[#1c1c2e]'
      }`}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{item.label}</span>
    </Link>
  );
})}
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
          <div className="max-w-7xl mx-auto p-6 md:p-8">
           <div className="flex gap-8">
              <div className="flex-1">
            {/* Header with mobile menu toggle */}
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden text-[#7c6ff7]">
                ☰
              </button>
              <h1 className="text-3xl font-bold">Explore</h1>
              <div className="w-10 h-10" />
            </div>

            {/* Categories */}
            <div className="flex gap-3 overflow-x-auto pb-4">
              {categories.map((item) => (
                <button
  key={item}
  onClick={() =>
    setActiveCategory(item)
  }
                
                  className={`whitespace-nowrap rounded-xl px-5 py-2 text-sm font-medium ${
                    activeCategory === item
  ? "bg-[#7c6ff7] text-white"
  : "bg-[#1c1c2e] text-[#9490b8] hover:text-[#f0eeff]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* SEARCH */}
<div className="mb-6">
  <div className="flex items-center gap-3 rounded-2xl border border-[#2a2740] bg-[#141420] px-4 py-3">

    <Search className="h-5 w-5 text-[#9490b8]" />

    <input
      type="text"
      placeholder="Search Pulse..."
      value={search}
      onChange={(e) =>
        setSearch(e.target.value)
      }
      className="w-full bg-transparent outline-none text-[#f0eeff] placeholder:text-[#666]"
    />

  </div>
</div>

            {/* Tabs */}
            <div className="mt-6 flex justify-center gap-16 border-b border-[#2a2740] pb-4">
              {tabs.map((tab) => (
                <button
  key={tab}
  onClick={() => setActiveTab(tab)}
                  className={`text-sm font-semibold ${
                    activeTab === tab
  ? "border-b-2 border-[#7c6ff7] pb-2 text-[#7c6ff7]"
  : "text-[#9490b8]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* FEED */}
            <div className="mt-8 space-y-8">
              {loading ? (
  <div className="space-y-6">
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="rounded-3xl border border-[#2a2740] bg-[#141420] p-6 animate-pulse"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-[#2a2740]" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-[#2a2740] rounded" />
            <div className="h-3 w-20 bg-[#2a2740] rounded" />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="h-5 w-3/4 bg-[#2a2740] rounded" />
          <div className="h-4 w-full bg-[#2a2740] rounded" />
          <div className="h-4 w-5/6 bg-[#2a2740] rounded" />
        </div>
      </div>
    ))}
  </div>
) : sortedPosts.length === 0 ? (
  <div className="rounded-3xl border border-[#2a2740] bg-[#141420] p-10 text-center">
    <h2 className="text-xl font-semibold text-[#f0eeff]">
      No posts yet
    </h2>
    <p className="mt-3 text-[#9490b8]">
      Be the first person to create a post.
    </p>
  </div>
) : (
  sortedPosts.map((post) => (
    <ExplorePostCard
      key={post._id || post.id}
      post={post}
    />
  ))
)}
              
            </div>
          </div>
          

          {/* RIGHT SIDEBAR */}
<div className="hidden xl:block w-[340px]">
  <div className="rounded-3xl border border-[#2a2740] bg-[#141420] p-6">

    <h2 className="text-lg font-bold text-[#f0eeff]">
      Trending
    </h2>

    <div className="mt-5 space-y-5">

            {[...posts]
  .sort((a, b) => {

    const aScore =
      (a.likes || 0) +
      (a.restacks || 0) +
      (a.comments || a.replyCount || 0)

    const bScore =
      (b.likes || 0) +
      (b.restacks || 0) +
      (b.comments || b.replyCount || 0)

    return bScore - aScore;
  })
  .slice(0, 5)
  .map((post) => (

        <div
          key={post._id}
          className="border-b border-[#2a2740] pb-4"
        >
          <h3 className="font-semibold text-[#f0eeff]">
            {post.title}
          </h3>

          <p className="text-sm text-[#9490b8]">
            {(post.likes || 0)} likes
          </p>
        </div>
      ))}
    </div>
  </div>
  </div>
    </div>
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
