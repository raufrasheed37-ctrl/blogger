"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import useAuthStore from "@/store/authstore";
import { authorsAPI, blogAPI } from "@/utils/api";
import styles from "./styles.module.css";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_ROOT = `${API_BASE_URL}${API_BASE_URL.endsWith("/api") ? "" : "/api"}`;

function SocialButton({ icon, url }) {
  return (
    <a
      href={url}
      aria-label={`Share on ${icon}`}
      className={styles.socialBtn}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className={styles.socialIcon}>{icon === "X" ? "𝕏" : icon === "LinkedIn" ? "in" : "⚡"}</span>
    </a>
  );
}

function StatCard({ label, value }) {
  return (
    <div className={styles.statCard}>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statLabel}>{label}</p>
    </div>
  );
}

function BlogCard({ post, featured = false }) {
  return (
    <article className={`${styles.blogCard} ${featured ? styles.featured : ""}`}>
      <div className={styles.cardThumb}>
        <div className={styles.thumbGradient} />
        {featured && <span className={styles.featuredBadge}>Featured</span>}
      </div>

      <div className={styles.cardContent}>
        <div className={styles.cardMeta}>
          <span className={styles.categoryPill}>{post.category || post.tags?.[0] || "General"}</span>
          <span className={styles.readTime}>{Math.ceil((post.content?.length || 0) / 200) || 1} min read</span>
        </div>

        <h3 className={styles.cardTitle} style={{ fontFamily: "Fraunces, serif" }}>
          {post.title}
        </h3>

        <p className={styles.cardExcerpt}>{post.excerpt || post.description || "No description available"}</p>

        <div className={styles.cardFooter}>
          <div className={styles.cardDate}>
            {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : "Recently published"}
          </div>
          <div className={styles.cardActions}>
            <button className={styles.actionBtn} title="Like">
              ♡ {post.likes || 0}
            </button>
            <button className={styles.actionBtn} title="Comment">
              💬 {post.comments || 0}
            </button>
            <button className={styles.actionBtn} title="Bookmark">
              🔖 {post.saves || 0}
            </button>
          </div>
        </div>
      </div>

      <Link href={`/blog/${post.slug || post._id}`} className={styles.cardLink} />
    </article>
  );
}

function initialsFromName(name) {
  return String(name || "U")
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const authorId = Array.isArray(params?.username) ? params.username[0] : params?.username;
  const currentUser = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState("all");
  const [subscribed, setSubscribed] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(Boolean(authorId));
  const [error, setError] = useState(authorId ? null : "User not found");

  // Fetch user profile and posts
  useEffect(() => {
    if (!authorId) {
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        const authorData = await authorsAPI.getById(authorId);
        const author = authorData?.author || authorData;
        setProfileUser(author);

        // Fetch posts by this user
        const postsData = await blogAPI.getByAuthor(author._id || author.id || authorId);
        setUserPosts(Array.isArray(postsData?.posts) ? postsData.posts : []);
      } catch (err) {
        console.error("Profile error:", err);
        setError(err?.message || "Failed to load profile");
        setUserPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [authorId]);

  // Redirect if current user is viewing their own profile
  useEffect(() => {
    if (profileUser && currentUser) {
      const userMatch =
        (profileUser._id && currentUser._id && profileUser._id === currentUser._id) ||
        (profileUser.id && currentUser.id && profileUser.id === currentUser.id) ||
        (profileUser.email && currentUser.email && profileUser.email === currentUser.email) ||
        (profileUser.username && currentUser.username && profileUser.username === currentUser.username);

      if (userMatch) {
        router.push("/dashboard");
      }
    }
  }, [profileUser, currentUser, router]);

  "use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import useAuthStore from "@/store/authstore";
import { getClientAuthToken } from "@/store/authstore";
import { useAuthRedirect } from "@/utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_ROOT = `${API_BASE_URL}${API_BASE_URL.endsWith("/api") ? "" : "/api"}`;

function getAuthHeaders() {
  const token = getClientAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function CommentSection({
  postId,
  requireAuth: requireAuthProp, onCommentAdded,
}) {
  const currentUser = useAuthStore((state) => state.user);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");

  // edit states
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      setFetching(true);

      const res = await fetch(`${API_ROOT}/comments/${postId}`, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.log(err);
    } finally {
      setFetching(false);
    }
  }, [postId]);

  useEffect(() => {
    if (postId) {
      Promise.resolve().then(() => fetchComments());
    }
  }, [postId, fetchComments]);

  // auth
  const { requireAuth: localRequireAuth } = useAuthRedirect();
  const requireAuth = requireAuthProp || localRequireAuth;

  // Create comment
  const handleComment = async () => {
    if (!requireAuth()) return;
    if (!commentText.trim()) return;

    try {
      setLoading(true);

      const res = await fetch(`${API_ROOT}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          text: commentText,
          postId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        console.log(errData);
       throw new Error(errData.message || "Failed to post");
      }
      const data = await res.json();

      setComments((prev) => [data, ...prev]);
      setCommentText("");
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (parentCommentId) => {
  if (!requireAuth()) return;

  if (!replyText.trim()) return;

  try {

    console.log("Reply text:", replyText);
    console.log("Parent ID:", parentCommentId);

    const res = await fetch(`${API_ROOT}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        text: replyText,
        postId,
        parentComment: parentCommentId,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.log(err);
      throw new Error("Failed to reply");
    }

    setReplyText("");
    setReplyingTo(null);

    await fetchComments();

    setExpandedReplies((prev) => ({
      ...prev,
      [parentCommentId]: true,
    }));

  } catch (err) {
    console.log(err);
  }
};

  // Delete comment
  const handleDelete = async (id) => {
    try {
      await fetch(`${API_ROOT}/comments/${id}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(),
        },
      });

      setComments((prev) =>
        prev.filter((c) => c._id !== id)
      );
    } catch (err) {
      console.log(err);
    }
  };

  // Start edit
  const handleEdit = (comment) => {
    setEditingId(comment._id);
    setEditText(comment.text);
  };

  // Save edit
  const handleSaveEdit = (id) => {
    if (!editText.trim()) return;

    fetch(`${API_ROOT}/comments/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ text: editText }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update comment");
        return res.json();
      })
      .then((updated) => {
        setComments((prev) =>
          prev.map((c) =>
            c._id === id
              ? { ...c, text: updated?.text || editText }
              : c
          )
        );
        setEditingId(null);
        setEditText("");
      })
      .catch((err) => {
        console.log(err);
        setComments((prev) =>
          prev.map((c) =>
            c._id === id
              ? { ...c, text: editText }
              : c
          )
        );
        setEditingId(null);
        setEditText("");
      });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  return (
    <div className="mt-8 border-t border-white/10 pt-8">

      {/* INPUT */}
      <div className="rounded-[28px] border border-white/10 bg-[#151515] p-4">

        <textarea
          value={commentText}
          onChange={(e) =>
            setCommentText(e.target.value)
          }
          placeholder="Share your thoughts..."
          rows={4}
          disabled={loading}
          className="w-full resize-none bg-transparent text-[15px] leading-7 text-white outline-none placeholder:text-zinc-500"
        />

        <div className="mt-4 flex items-center justify-between">

          <p className="text-xs text-zinc-500">
            Join the discussion respectfully.
          </p>

          <button
            onClick={handleComment}
            disabled={loading}
            className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:opacity-50"
          >
            {loading ? "Posting..." : "Reply"}
          </button>

        </div>
      </div>

      {/* LOADING */}
      {fetching && (
        <p className="mt-5 text-sm text-zinc-500">
          Loading comments...
        </p>
      )}

      {/* COMMENTS */}
      <div className="mt-6 space-y-5">

        {!fetching && comments.length === 0 && (
          <p className="text-sm text-zinc-500">
            No comments yet
          </p>
        )}

        {comments.map((comment) => {
          const isCurrentUserComment = Boolean(
            currentUser && (
              (comment.user?._id && currentUser._id && comment.user._id === currentUser._id) ||
              (comment.user?.id && currentUser.id && comment.user.id === currentUser.id) ||
              (comment.user?.email && currentUser.email && comment.user.email === currentUser.email)
            )
          );

          return (
          <div
            key={comment._id}
            className="rounded-[28px] border border-white/10 bg-[#151515] p-5 transition hover:border-white/20"
          >

            <div className="flex items-start gap-4">

              {/* AVATAR */}
              {isCurrentUserComment ? (
                <Link href="/dashboard" className="h-11 w-11 shrink-0 rounded-full bg-linear-to-br from-orange-400 to-amber-500 hover:opacity-80 transition cursor-pointer" />
              ) : (
                <Link href={`/profile/${comment.user?._id || comment.user?.id || comment.user?.username || comment.user?.name?.toLowerCase() || "user"}`} className="h-11 w-11 shrink-0 rounded-full bg-linear-to-br from-orange-400 to-amber-500 hover:opacity-80 transition cursor-pointer" />
              )}

              {/* CONTENT */}
              <div className="flex-1">

                {editingId === comment._id ? (
                  <>
                    <input
                      autoFocus
                      value={editText}
                      onChange={(e) =>
                        setEditText(e.target.value)
                      }
                      className="w-full rounded-2xl border border-white/10 bg-[#101010] p-3 text-[15px] text-white outline-none"
                    />

                    <div className="mt-4 flex items-center gap-4 text-sm text-zinc-500">

                      <button
                        onClick={() =>
                          handleSaveEdit(comment._id)
                        }
                        className="rounded-full border border-white/10 px-3 py-1 transition hover:border-green-400 hover:text-green-400"
                      >
                        Save
                      </button>

                      <button
                        onClick={handleCancelEdit}
                        className="rounded-full border border-white/10 px-3 py-1 transition hover:text-white"
                      >
                        Cancel
                      </button>

                    </div>
                  </>
                ) : (
                  <>
                    {/* HEADER */}
                    <div className="flex flex-wrap items-center gap-2 text-sm">

                      {isCurrentUserComment ? (
                        <Link href="/dashboard" className="text-[15px] font-semibold text-white hover:text-[#a89cf7] transition">
                          {comment.user?.name || "User"}
                        </Link>
                      ) : (
                        <Link href={`/profile/${comment.user?._id || comment.user?.id || comment.user?.username || comment.user?.name?.toLowerCase() || "user"}`} className="text-[15px] font-semibold text-white hover:text-[#a89cf7] transition">
                          {comment.user?.name || "User"}
                        </Link>
                      )}

                      <span className="text-xs text-zinc-500">
                        {new Date(
                          comment.createdAt
                        ).toLocaleTimeString()}
                      </span>

                    </div>

                    {/* COMMENT */}
                    <p className="mt-3 text-[15px] leading-7 text-zinc-300">
                      {comment.text}
                    </p>

                    {/* ACTIONS */}
                    <div className="mt-4 flex items-center gap-5 text-sm text-zinc-500">

  <button
  onClick={async () => {
    if (!requireAuth()) return;

    try {
      const res = await fetch(
        `${API_ROOT}/comments/${comment._id}/like`,
        {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed");
      }

      const data = await res.json();

      setComments((prev) =>
        prev.map((c) =>
          c._id === comment._id
            ? {
                ...c,
                likes: data.likes,
              }
            : c
        )
      );
    } catch (err) {
      console.log(err);
    }
  }}
  className="transition hover:text-orange-400"
>
  ❤️ {comment.likes || 0}
</button>

    <button
  onClick={() => {
    if (!requireAuth()) return;

    setReplyingTo(
      replyingTo === comment._id
        ? null
        : comment._id
    );
  }}
  className="transition hover:text-orange-400"
>
  Reply
</button>

    <button
  onClick={() => {
    if (comment.replyCount < 1) return;

    setExpandedReplies((prev) => ({
      ...prev,
      [comment._id]: !prev[comment._id],
    }));
  }}
  className="transition hover:text-orange-400"
>
  💬 {comment.replyCount || 0} replies
</button>

  <button
    onClick={() =>
      handleEdit(comment)
    }
    className="transition hover:text-white"
  >
    Edit
  </button>

  <button
    onClick={() =>
      handleDelete(comment._id)
    }
    className="transition hover:text-red-400"
  >
    Delete
  </button>

</div>

    {replyingTo === comment._id && (
  <div className="mt-4">

    <textarea
      value={replyText}
      onChange={(e) =>
        setReplyText(e.target.value)
      }
      placeholder="Write a reply..."
      rows={3}
      className="w-full rounded-2xl border border-white/10 bg-[#101010] p-3 text-sm text-white outline-none"
    />

    <div className="mt-3 flex justify-end">
      <button
  onClick={() =>
    handleReply(comment._id)
  }
  className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-black"
>
  Reply
</button>
    </div>

  </div>
)}

      {expandedReplies[comment._id] && (
  <div className="mt-5 ml-10 space-y-4 border-l border-white/10 pl-5">

    {comment.replies?.map((reply) => (
      <div
        key={reply._id}
        className="rounded-2xl border border-white/10 bg-[#111] p-4"
      >
        <p className="font-semibold text-white">
          {reply.user?.name}
        </p>

        <p className="mt-2 text-sm text-zinc-300">
          {reply.text}
        </p>
      </div>
    ))}

  </div>
)}
  
        </>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

  const filteredPosts = useMemo(() => {
    if (activeTab === "all") return userPosts;
    if (activeTab === "popular") return [...userPosts].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    return userPosts.filter((p) => {
      const tags = p.tags || [];
      const category = p.category || tags[0] || "";
      return category.toLowerCase() === activeTab.toLowerCase();
    });
  }, [activeTab, userPosts]);

  const categories = useMemo(() => {
    const map = {};
    userPosts.forEach((post) => {
      const raw = post.category || post.tags?.[0] || "General";
      const key = String(raw).trim().toLowerCase();
      const display = String(raw)
        .trim()
        .split(" ")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      if (!map[key]) map[key] = { name: display || "General", count: 0 };
      map[key].count += 1;
    });

    const categoriesArr = [{ name: "All posts", count: userPosts.length }];
    Object.values(map).forEach((c) => categoriesArr.push({ name: c.name, count: c.count }));
    return categoriesArr;
  }, [userPosts]);

  const tabs = useMemo(() => {
    return [
      { id: "all", label: "All posts", count: userPosts.length },
      { id: "popular", label: "Popular", count: userPosts.length },
      ...categories.slice(1).map((cat) => ({
        id: cat.name.toLowerCase(),
        label: cat.name,
        count: cat.count,
      })),
    ];
  }, [userPosts, categories]);

  const topPosts = useMemo(() => {
    return [...userPosts].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 5);
  }, [userPosts]);

  const stats = useMemo(() => {
    const totalReads = userPosts.reduce((sum, p) => sum + (p.reads || 0), 0);
    const avgReadTime = userPosts.length > 0 ? Math.ceil(totalReads / userPosts.length / 200) : 1;
    return {
      posts: userPosts.length,
      subscribers: profileUser?.subscribers || 0,
      reads: totalReads.toLocaleString(),
      avgReadTime: `${avgReadTime} min`,
    };
  }, [userPosts, profileUser]);

  if (loading) {
    return (
      <div className={styles.shell}>
        <div className={styles.gradientBg}>
          <div className={styles.grad1} />
          <div className={styles.grad2} />
          <div className={styles.grad3} />
        </div>
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ color: "#9490b8" }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className={styles.shell}>
        <div className={styles.gradientBg}>
          <div className={styles.grad1} />
          <div className={styles.grad2} />
          <div className={styles.grad3} />
        </div>
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ textAlign: "center", color: "#f0eeff" }}>
            <h1>Profile Not Found</h1>
            <p style={{ color: "#9490b8" }}>{error || "This user does not exist"}</p>
            <Link href="/" style={{ color: "#a89cf7", textDecoration: "underline" }}>
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const avatar = initialsFromName(profileUser.name || profileUser.username || "User");

  return (
    <div className={styles.shell}>
      {/* Decorative gradients */}
      <div className={styles.gradientBg}>
        <div className={styles.grad1} />
        <div className={styles.grad2} />
        <div className={styles.grad3} />
      </div>

      {/* Sticky navigation */}
      <nav className={styles.navbar}>
        <div className={styles.navContent}>
          <Link href="/" className={styles.logo} style={{ fontFamily: "Fraunces, serif" }}>
            Pulse.
          </Link>
          <div className={styles.navLinks}>
            <Link href="/" className={styles.navLink}>
              Home
            </Link>
            <Link href="/explore" className={styles.navLink}>
              Explore
            </Link>
            <Link href="/categories" className={styles.navLink}>
              Categories
            </Link>
          </div>
          <div className={styles.navButtons} />
        </div>
      </nav>

      {/* Hero / Profile section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatar}>
              <span>{avatar}</span>
            </div>
          </div>

          <h1 className={styles.username} style={{ fontFamily: "Fraunces, serif" }}>
            {profileUser.name || profileUser.username || "Creator"}
          </h1>

          <p className={styles.handle}>
            @{profileUser.username || profileUser.name || profileUser.email?.split("@")[0] || "creator"} 
            {profileUser.location && ` · ${profileUser.location}`}
          </p>

          <p className={styles.bio}>
            {profileUser.bio || "A creator on Pulse sharing their thoughts and stories."}
          </p>

          <div className={styles.socialLinks}>
            {profileUser.socialLinks?.twitter && <SocialButton icon="X" url={profileUser.socialLinks.twitter} />}
            {profileUser.socialLinks?.linkedin && <SocialButton icon="LinkedIn" url={profileUser.socialLinks.linkedin} />}
            {profileUser.socialLinks?.github && <SocialButton icon="GitHub" url={profileUser.socialLinks.github} />}

               <button
  className={`${styles.primary} ${styles.subscribeBtn}`}
  onClick={async () => {
    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        router.push(
          `/login?next=/profile/${authorId}`
        );
        return;
      }

      const res = await fetch(
        `${API_ROOT}/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            authorId:
              profileUser._id ||
              profileUser.id,
          }),
        }
      );

      const data =
        await res.json();

      setSubscribed(
        data.subscribed
      );

      setProfileUser((prev) => ({
        ...prev,
        subscribers:
          data.subscribers,
      }));
    } catch (err) {
      console.log(err);
    }
  }}
>
            {subscribed ? "✓ Subscribed" : "Subscribe"}
          </button>
        </div>
      </section>

      {/* Stats section */}
      <section className={styles.statsSection}>
        <div className={styles.statsContent}>
          <StatCard label="Posts" value={stats.posts} />
          <div className={styles.statsDivider} />
          <StatCard label="Subscribers" value={stats.subscribers} />
          <div className={styles.statsDivider} />
          <StatCard label="Total reads" value={stats.reads} />
          <div className={styles.statsDivider} />
          <StatCard label="Avg read time" value={stats.avgReadTime} />
        </div>
      </section>

      {/* Tabs */}
      <section className={styles.tabsSection}>
        <div className={styles.tabsContainer}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
            >
              <span className={styles.tabLabel}>{tab.label}</span>
              {activeTab === tab.id && <span className={styles.tabBadge}>{tab.count}</span>}
            </button>
          ))}
        </div>
      </section>

      {/* Main content area */}
      <main className={styles.mainContent}>
        <div className={styles.postsColumn}>
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <BlogCard key={post._id || post.id} post={post} featured={filteredPosts.indexOf(post) === 0} />
            ))
          ) : (
            <div className={styles.emptyState}>
              <p>No posts found in this category.</p>
            </div>
          )}
        </div>

        <aside className={styles.sidebar}>
          {/* Categories widget */}
          <div className={styles.widget}>
            <p className={styles.widgetTitle}>Categories</p>
            <div className={styles.categoriesList}>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => setActiveTab(cat.name.toLowerCase())}
                  className={`${styles.categoryLink} ${activeTab === cat.name.toLowerCase() ? styles.categoryActive : ""}`}
                >
                  <span>{cat.name}</span>
                  <span className={styles.categoryCount}>{cat.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Most popular widget */}
          <div className={styles.widget}>
            <p className={styles.widgetTitle}>Most popular</p>
            <div className={styles.popularList}>
              {topPosts.map((post, idx) => (
                <Link
                  key={post._id || post.id}
                  href={`/blog/${post.slug || post._id}`}
                  className={styles.popularItem}
                >
                  <span className={styles.popularRank}>{idx + 1}</span>
                  <span className={styles.popularTitle}>{post.title}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Newsletter subscription */}
          <div className={`${styles.widget} ${styles.newsletterWidget}`}>
            <p className={styles.newsletterTitle}>Never miss a story</p>
            <p className={styles.newsletterText}>
              Get notified whenever {profileUser.name || "this creator"} publishes new articles.
            </p>
            <button
  className={`${styles.primary} ${styles.subscribeBtn}`}
  onClick={async () => {
    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        router.push(
          `/login?next=/profile/${authorId}`
        );
        return;
      }

      const res = await fetch(
        `${API_ROOT}/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            authorId:
              profileUser._id ||
              profileUser.id,
          }),
        }
      );

      const data =
        await res.json();

      setSubscribed(
        data.subscribed
      );

      setProfileUser((prev) => ({
        ...prev,
        subscribers:
          data.subscribers,
      }));
    } catch (err) {
      console.log(err);
    }
  }}
>
              {subscribed ? "✓ Subscribed" : "Subscribe"}
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
