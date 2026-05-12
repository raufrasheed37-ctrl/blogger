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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user profile and posts
  useEffect(() => {
    if (!authorId) {
      setError("User not found");
      setLoading(false);
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
    const categoryMap = {};
    categoryMap["All posts"] = userPosts.length;
    userPosts.forEach((post) => {
      const cat = post.category || post.tags?.[0] || "General";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    return Object.entries(categoryMap).map(([name, count]) => ({ name, count }));
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
          <div className={styles.navButtons}>
            <button className={styles.iconBtn}>🔍</button>
            <button className={styles.outlined}>Sign in</button>
            <button className={styles.primary}>Get started</button>
          </div>
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
            @{profileUser.username || profileUser.email?.split("@")[0] || "creator"} 
            {profileUser.location && ` · ${profileUser.location}`}
          </p>

          <p className={styles.bio}>
            {profileUser.bio || "A creator on Pulse sharing their thoughts and stories."}
          </p>

          <div className={styles.socialLinks}>
            {profileUser.socialLinks?.twitter && <SocialButton icon="X" url={profileUser.socialLinks.twitter} />}
            {profileUser.socialLinks?.linkedin && <SocialButton icon="LinkedIn" url={profileUser.socialLinks.linkedin} />}
            {profileUser.socialLinks?.github && <SocialButton icon="GitHub" url={profileUser.socialLinks.github} />}
          </div>

          <button className={`${styles.primary} ${styles.subscribeBtn}`} onClick={() => setSubscribed(!subscribed)}>
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
              onClick={() => setSubscribed(!subscribed)}
              className={`${styles.primary} ${styles.fullWidth}`}
            >
              {subscribed ? "✓ Subscribed" : "Subscribe"}
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
}
