"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import BlogCard from "@/components/BlogCard";
import BrandMark from "@/components/BrandMark";
import useAuthStore from "@/store/authstore";
import { blogAPI } from "@/utils/api";

const POSTS_PER_PAGE = 6;
const DISCOVERY_POSTS = 3;

const CATEGORY_FILTERS = [
  "All stories",
];

function getPostId(post) {
  return String(post?._id || post?.id || "");
}

function getPostSlug(post) {
  return post?.slug || post?._id || post?.id || "";
}

function getPostImage(post) {
  return (
    post?.coverImage ||
    post?.featuredImage ||
    post?.thumbnail ||
    post?.image ||
    post?.imageUrl ||
    post?.cover ||
    post?.featuredImageUrl ||
    post?.thumbnailUrl ||
    post?.images?.[0]?.url ||
    post?.images?.[0] ||
    post?.content?.coverImage ||
    null
  );
}

function getAuthor(post) {
  return post?.author || post?.user || {};
}

function getAuthorName(post) {
  const author = getAuthor(post);

  return (
    author?.name ||
    author?.username ||
    "Unknown author"
  );
}

function getAuthorAvatar(post) {
  const author = getAuthor(post);

  return (
    author?.avatar ||
    author?.profileImage ||
    author?.profilePicture ||
    null
  );
}

function getPostCategory(post) {
  const category = post?.category;

  if (typeof category === "string" && category.trim()) {
    return category.trim();
  }

  if (typeof category?.name === "string") {
    return category.name;
  }

  if (Array.isArray(post?.tags) && post.tags.length > 0) {
    const firstTag = post.tags[0];

    if (typeof firstTag === "string") {
      return firstTag;
    }

    if (firstTag?.name) {
      return firstTag.name;
    }
  }

  return "General";
}

function getExcerpt(post) {
  if (post?.excerpt) {
    return post.excerpt;
  }

  if (post?.description) {
    return post.description;
  }

  if (typeof post?.content === "string") {
    return post.content
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180);
  }

  return "";
}

function getPublicationDate(post) {
  const value =
    post?.publishedAt ||
    post?.createdAt;

  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getReadingTime(post) {
  if (
    Number.isFinite(post?.readingTime) &&
    post.readingTime > 0
  ) {
    return `${post.readingTime} min read`;
  }

  const content =
    typeof post?.content === "string"
      ? post.content
      : typeof post?.body === "string"
        ? post.body
        : "";

  const words = content
    .replace(/<[^>]*>/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  if (words > 0) {
    return `${Math.max(1, Math.ceil(words / 200))} min read`;
  }

  return "";
}

function isPublicPost(post) {
  const visibility = String(
    post?.visibility || ""
  ).toLowerCase();

  if (
    post?.isDraft === true ||
    post?.isPrivate === true ||
    post?.isPublished === false ||
    post?.published === false ||
    post?.publishedAt === null && post?.isPublished === false ||
    ["draft", "private", "unlisted"].includes(visibility)
  ) {
    return false;
  }

  if (
    post?.isPublished === true ||
    post?.published === true
  ) {
    return true;
  }

  /*
   * Fail closed when the API does not identify
   * whether a post is published.
   *
   * If your backend uses another publication field,
   * update this helper to match the real schema.
   */
  return false;
}

function getCoverAlt(post) {
  return (
    post?.coverImageAlt ||
    post?.featuredImageAlt ||
    post?.imageAlt ||
    post?.title ||
    "Article cover"
  );
}

function getAuthorId(post) {
  const author = getAuthor(post);

  return author?._id || author?.id || "";
}

function getArticleHref(post) {
  const slug = getPostSlug(post);

  return slug
    ? `/blog/${encodeURIComponent(String(slug))}`
    : "/explore";
}

function getAuthorHref(post) {
  const authorId = getAuthorId(post);

  return authorId
    ? `/authors/${encodeURIComponent(String(authorId))}`
    : null;
}

function getLikes(post) {
  if (Number.isFinite(post?.likes)) {
    return post.likes;
  }

  if (Array.isArray(post?.likedBy)) {
    return post.likedBy.length;
  }

  return 0;
}

function getComments(post) {
  if (Number.isFinite(post?.commentCount)) {
    return post.commentCount;
  }

  if (Number.isFinite(post?.commentsCount)) {
    return post.commentsCount;
  }

  if (Array.isArray(post?.comments)) {
    return post.comments.length;
  }

  return 0;
}

function getRestacks(post) {
  if (Number.isFinite(post?.restacks)) {
    return post.restacks;
  }

  if (Array.isArray(post?.restackedBy)) {
    return post.restackedBy.length;
  }

  return 0;
}

function formatCount(value) {
  return new Intl.NumberFormat("en", {
    notation: value >= 10000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong while loading articles."
  );
}

export default function Home() {
  const router = useRouter();

  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const hydrate = useAuthStore((state) => state.hydrate);

  const [mounted, setMounted] = useState(false);
  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState("");
  const [activeCategory, setActiveCategory] =
    useState("All stories");
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    hydrate();

    setMounted(true);

    const storedToken = localStorage.getItem("token");

    setHasSession(Boolean(token || storedToken));
  }, [hydrate, token]);

  const fetchPosts = useCallback(async () => {
    setPostsLoading(true);
    setPostsError("");

    try {
      const response = await blogAPI.getAll();

      const responsePosts = Array.isArray(response?.posts)
        ? response.posts
        : Array.isArray(response?.data?.posts)
          ? response.data.posts
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
              ? response
              : [];

      const publicPosts = responsePosts.filter(isPublicPost);

      /*
       * Do not manufacture article information.
       * The landing page uses the actual post records.
       */
      setPosts(publicPosts);
    } catch (error) {
      console.error("Failed to load Pulse articles:", error);

      setPosts([]);
      setPostsError(getErrorMessage(error));
    } finally {
      setPostsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const categories = useMemo(() => {
    const availableCategories = posts
      .map(getPostCategory)
      .filter(Boolean);

    return [
      ...CATEGORY_FILTERS,
      ...new Set(
        availableCategories.filter(
          (category) => category !== "General"
        )
      ),
    ];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (activeCategory === "All stories") {
      return posts;
    }

    return posts.filter(
      (post) => getPostCategory(post) === activeCategory
    );
  }, [posts, activeCategory]);

  /*
   * Prefer a genuinely featured post when the backend
   * identifies one. Otherwise, use the first published
   * article returned by the API.
   *
   * For a dedicated editorial selection, add a real
   * isFeatured field to the backend post model.
   */
  const featuredPost = useMemo(() => {
    return (
      filteredPosts.find(
        (post) => post?.isFeatured === true
      ) ||
      filteredPosts[0] ||
      null
    );
  }, [filteredPosts]);

  const discoveryPosts = useMemo(() => {
    return filteredPosts
      .filter(
        (post) =>
          getPostId(post) !== getPostId(featuredPost)
      )
      .slice(0, DISCOVERY_POSTS);
  }, [filteredPosts, featuredPost]);

  const remainingPosts = useMemo(() => {
    const excludedIds = new Set(
      [
        featuredPost,
        ...discoveryPosts,
      ]
        .filter(Boolean)
        .map(getPostId)
        .filter(Boolean)
    );

    return filteredPosts.filter(
      (post) => !excludedIds.has(getPostId(post))
    );
  }, [filteredPosts, featuredPost, discoveryPosts]);

  const totalPages = Math.max(
    1,
    Math.ceil(remainingPosts.length / POSTS_PER_PAGE)
  );

  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;

    return remainingPosts.slice(
      start,
      start + POSTS_PER_PAGE
    );
  }, [remainingPosts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const currentUserId = String(
    user?._id || user?.id || ""
  );

  const handleCreateClick = () => {
    const storedToken =
      typeof window !== "undefined"
        ? localStorage.getItem("token")
        : null;

    if (token || storedToken) {
      router.push("/blog/create");
      return;
    }

    router.push("/login?next=/blog/create");
  };

  const handleLogout = async () => {
    try {
      await useAuthStore.getState().logout();
    } finally {
      localStorage.removeItem("token");

      setHasSession(false);
      setMobileMenuOpen(false);

      router.push("/");
      router.refresh();
    }
  };

  const goToPage = (page) => {
    const nextPage = Math.min(
      totalPages,
      Math.max(1, page)
    );

    setCurrentPage(nextPage);

    document
      .getElementById("latest-stories")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  const isLoggedIn = mounted && Boolean(
    hasSession || token || user
  );

  return (
    <main className="min-h-screen overflow-x-clip bg-[#09090f] text-zinc-100 selection:bg-violet-500/30">

      {/* Navigation */}

      <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#09090f]/90 backdrop-blur-2xl">
        <nav
          className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10"
          aria-label="Main navigation"
        >
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5"
            aria-label="Pulse home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-950/40">
              <BrandMark className="h-6 w-6 text-white" />
            </span>

            <span className="text-xl font-black tracking-tight">
              Pulse
              <span className="text-violet-400">.</span>
            </span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            <Link
              href="/explore"
              className="text-sm font-medium text-zinc-300 transition hover:text-white"
            >
              Explore
            </Link>

            <a
              href="#discover"
              className="text-sm font-medium text-zinc-300 transition hover:text-white"
            >
              Discover
            </a>

            <Link
              href="/activity"
              className="text-sm font-medium text-zinc-300 transition hover:text-white"
            >
              Activity
            </Link>
          </div>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/explore"
              aria-label="Search and explore articles"
              className="rounded-lg border border-white/10 px-3.5 py-2 text-sm text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
            >
              Search articles
            </Link>

            <button
              type="button"
              onClick={handleCreateClick}
              className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-[#09090f]"
            >
              Write a story
            </button>

            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-2 py-2 text-sm font-medium text-zinc-300 transition hover:text-white"
              >
                Sign in
              </Link>
            )}

            {isLoggedIn && (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg px-2 py-2 text-sm text-zinc-400 transition hover:text-white"
              >
                Logout
              </button>
            )}
          </div>

          {/* Mobile navigation controls */}

          <div className="flex items-center gap-2 sm:hidden">
            <Link
              href="/explore"
              className="rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-zinc-300"
            >
              Search
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-label={
                mobileMenuOpen
                  ? "Close navigation menu"
                  : "Open navigation menu"
              }
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-xl text-white"
            >
              {mobileMenuOpen ? "×" : "☰"}
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className="border-t border-white/[0.08] bg-[#0d0d15] px-4 py-4 sm:hidden">
            <div className="mx-auto flex max-w-[1440px] flex-col gap-1">
              {[
                {
                  label: "Explore",
                  href: "/explore",
                },
                {
                  label: "Discover stories",
                  href: "#discover",
                },
                {
                  label: "Activity",
                  href: "/activity",
                },
                {
                  label: "Write a story",
                  href: "/blog/create",
                },
                ...(isLoggedIn
                  ? [
                      {
                        label: "Dashboard",
                        href: "/dashboard",
                      },
                    ]
                  : [
                      {
                        label: "Sign in",
                        href: "/login",
                      },
                    ]),
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.05] hover:text-white"
                >
                  {item.label}
                </Link>
              ))}

              {isLoggedIn && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-3 text-left text-sm font-medium text-zinc-400 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Log out
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero */}

      <section className="relative isolate overflow-hidden border-b border-white/[0.06]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-violet-700/[0.13] blur-[130px]" />

          <div className="absolute -right-40 top-20 h-[400px] w-[400px] rounded-full bg-indigo-600/[0.10] blur-[120px]" />
        </div>

        <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-10 lg:py-24">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/[0.08] px-3.5 py-2 text-xs font-semibold tracking-wide text-violet-200">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />

              A HOME FOR IDEAS
            </div>

            <h1 className="max-w-2xl text-[2.7rem] font-black leading-[1.05] tracking-[-0.045em] sm:text-6xl lg:text-[4.5rem]">
              Ideas deserve
              <span className="mt-2 block bg-gradient-to-r from-violet-300 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                to be heard.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-zinc-400 sm:text-lg">
              Discover meaningful stories, explore new
              perspectives, and connect with writers who
              have something worth sharing.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/explore"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-950/30 transition hover:-translate-y-0.5 hover:bg-violet-500"
              >
                Explore stories
                <span aria-hidden="true">→</span>
              </Link>

              <button
                type="button"
                onClick={handleCreateClick}
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.025] px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                Start writing
              </button>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.08] pt-6 text-sm text-zinc-500">
              <span>
                {postsLoading
                  ? "Loading published stories…"
                  : `${formatCount(posts.length)} published ${
                      posts.length === 1 ? "story" : "stories"
                    }`}
              </span>

              <span
                aria-hidden="true"
                className="hidden h-1 w-1 rounded-full bg-zinc-600 sm:block"
              />

              <span>Stories from the community</span>
            </div>
          </div>

          {/* Featured story */}

          <div className="min-w-0">
            {postsLoading ? (
              <div className="aspect-[5/4] animate-pulse rounded-2xl border border-white/[0.08] bg-white/[0.035]" />
            ) : featuredPost ? (
              <FeaturedArticle
                post={featuredPost}
              />
            ) : (
              <EmptyFeatured
                hasError={Boolean(postsError)}
                onRetry={fetchPosts}
              />
            )}
          </div>
        </div>
      </section>

      {/* Discovery section */}

      <section
        id="discover"
        className="mx-auto max-w-[1440px] scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20 lg:px-10"
      >
        <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-violet-300">
              Find your next read
            </p>

            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              Discover stories
            </h2>

            <p className="mt-3 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
              Explore articles from writers sharing their
              knowledge, experiences, and ideas.
            </p>
          </div>

          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300 transition hover:text-violet-200"
          >
            Explore all articles
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {/* Categories from real posts */}

        <div className="-mx-4 mb-9 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <div className="flex w-max gap-2">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-pressed={activeCategory === category}
                className={`rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                  activeCategory === category
                    ? "border-violet-400/40 bg-violet-500/15 text-violet-200"
                    : "border-white/[0.09] bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {postsError ? (
          <ErrorState
            message={postsError}
            onRetry={fetchPosts}
          />
        ) : postsLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <ArticleSkeleton key={item} />
            ))}
          </div>
        ) : discoveryPosts.length > 0 ? (
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {discoveryPosts.map((post) => (
              <ArticleCard
                key={getPostId(post)}
                post={post}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-14 text-center">
            <p className="text-lg font-bold text-white">
              {posts.length === 0
                ? "Your first story starts here."
                : "No stories in this category yet."}
            </p>

            <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-zinc-400">
              {posts.length === 0
                ? "Published articles will appear here as they become available."
                : "Choose another category to discover more articles."}
            </p>

            {posts.length === 0 && (
              <button
                type="button"
                onClick={handleCreateClick}
                className="mt-6 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-500"
              >
                Write a story
              </button>
            )}
          </div>
        )}
      </section>

      {/* Latest articles */}

      <section
        id="latest-stories"
        className="scroll-mt-24 border-t border-white/[0.06] bg-white/[0.015]"
      >
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10">
          <div className="mb-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-violet-300">
                Fresh from the community
              </p>

              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Latest stories
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-400 sm:text-base">
                More ideas, experiences, and perspectives
                to explore.
              </p>
            </div>

            <p className="text-sm text-zinc-500">
              {remainingPosts.length}{" "}
              {remainingPosts.length === 1
                ? "story"
                : "stories"}
            </p>
          </div>

          {postsError ? (
            <ErrorState
              message={postsError}
              onRetry={fetchPosts}
            />
          ) : postsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-36 animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.025]"
                />
              ))}
            </div>
          ) : paginatedPosts.length > 0 ? (
            <div className="space-y-4">
              {paginatedPosts.map((post) => {
                const normalizedPost = {
                  ...post,
                  _id: post?._id || post?.id,
                  slug: getPostSlug(post),
                  name: getAuthorName(post),
                  handle: getAuthor(post)?.username
                    ? `@${getAuthor(post).username}`
                    : "",
                  time: getPublicationDate(post),
                  category: getPostCategory(post),
                  text: getExcerpt(post),
                  comments: getComments(post),
                  likes: getLikes(post),
                  restacks: getRestacks(post),
                  image: getPostImage(post),
                  avatar: getAuthorAvatar(post),
                  authorId: getAuthorId(post),
                };

                return (
                  <div
                    key={getPostId(post)}
                    className="rounded-2xl border border-white/[0.07] bg-[#0c0c13] p-3 transition hover:border-white/[0.14] sm:p-4"
                  >
                    <BlogCard
                      post={normalizedPost}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-10 text-center">
              <p className="font-semibold text-white">
                No more stories to display.
              </p>

              <p className="mt-2 text-sm text-zinc-400">
                Explore the articles above or browse
                the complete collection.
              </p>

              <Link
                href="/explore"
                className="mt-5 inline-flex rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
              >
                Browse articles
              </Link>
            </div>
          )}

          {/* Pagination */}

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
            />
          )}
        </div>
      </section>

      {/* Writing invitation */}

      <section className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 sm:py-24 lg:px-10">
        <div className="relative isolate overflow-hidden rounded-3xl border border-violet-400/15 bg-[#11101c] px-6 py-12 sm:px-12 sm:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-32 -z-10 h-80 w-80 rounded-full bg-violet-600/15 blur-[100px]"
          />

          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.22em] text-violet-300">
              Your voice matters
            </p>

            <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
              Have something
              <span className="block text-violet-300">
                worth sharing?
              </span>
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
              Turn your knowledge, experiences, and ideas
              into stories that others can discover.
            </p>

            <button
              type="button"
              onClick={handleCreateClick}
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-violet-500"
            >
              Start writing
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}

      <Footer />
    </main>
  );
}

/* -------------------------------------------------------
   FEATURED ARTICLE
------------------------------------------------------- */

function FeaturedArticle({ post }) {
  const image = getPostImage(post);
  const authorName = getAuthorName(post);
  const authorAvatar = getAuthorAvatar(post);
  const authorHref = getAuthorHref(post);

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/[0.09] bg-[#101019] transition hover:border-violet-400/25">
      <Link
        href={getArticleHref(post)}
        className="block"
        aria-label={`Read ${post?.title || "featured article"}`}
      >
        <div className="relative aspect-[5/3] overflow-hidden bg-[#151421]">
          {image ? (
            <Image
              src={image}
              alt={getCoverAlt(post)}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover transition duration-700 group-hover:scale-[1.035]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-950 via-[#17142b] to-[#101019] px-6 text-center">
              <div>
                <BrandMark className="mx-auto h-12 w-12 text-violet-300/70" />

                <p className="mt-4 text-sm font-medium text-zinc-400">
                  No cover image uploaded
                </p>
              </div>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

          <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
            {getPostCategory(post)}
          </span>

          <span className="absolute bottom-4 left-4 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
            Featured story
          </span>
        </div>

        <div className="p-5 sm:p-7">
          <h2 className="line-clamp-3 text-2xl font-bold leading-tight tracking-tight text-white transition group-hover:text-violet-200 sm:text-3xl">
            {post?.title || "Untitled article"}
          </h2>

          {getExcerpt(post) && (
            <p className="mt-4 line-clamp-3 text-sm leading-7 text-zinc-400 sm:text-base">
              {getExcerpt(post)}
            </p>
          )}
        </div>
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.07] px-5 py-4 sm:px-7">
        <AuthorIdentity
          name={authorName}
          avatar={authorAvatar}
          href={authorHref}
        />

        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          {getPublicationDate(post) && (
            <span>{getPublicationDate(post)}</span>
          )}

          {getReadingTime(post) && (
            <>
              <span aria-hidden="true">·</span>
              <span>{getReadingTime(post)}</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------
   DISCOVERY ARTICLE CARD
------------------------------------------------------- */

function ArticleCard({ post }) {
  const image = getPostImage(post);
  const authorName = getAuthorName(post);
  const authorAvatar = getAuthorAvatar(post);
  const authorHref = getAuthorHref(post);

  return (
    <article className="group min-w-0">
      <Link
        href={getArticleHref(post)}
        className="block"
        aria-label={`Read ${post?.title || "article"}`}
      >
        <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#13131d]">
          {image ? (
            <Image
              src={image}
              alt={getCoverAlt(post)}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition duration-700 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-950/80 via-[#17142b] to-[#101019]">
              <BrandMark className="h-10 w-10 text-violet-300/60" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-70 transition group-hover:opacity-100" />

          <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
            {getPostCategory(post)}
          </span>
        </div>

        <h3 className="line-clamp-3 text-xl font-bold leading-snug tracking-tight text-white transition group-hover:text-violet-200">
          {post?.title || "Untitled article"}
        </h3>

        {getExcerpt(post) && (
          <p className="mt-3 line-clamp-3 text-sm leading-7 text-zinc-400">
            {getExcerpt(post)}
          </p>
        )}
      </Link>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] pt-4">
        <AuthorIdentity
          name={authorName}
          avatar={authorAvatar}
          href={authorHref}
          compact
        />

        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          {getPublicationDate(post) && (
            <span>{getPublicationDate(post)}</span>
          )}

          {getReadingTime(post) && (
            <span>· {getReadingTime(post)}</span>
          )}
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------
   AUTHOR IDENTITY
------------------------------------------------------- */

function AuthorIdentity({
  name,
  avatar,
  href,
  compact = false,
}) {
  const content = (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-violet-500/10 text-sm font-bold text-violet-200">
        {avatar ? (
          <Image
            src={avatar}
            alt=""
            fill
            sizes="36px"
            className="object-cover"
          />
        ) : (
          <span>
            {name?.trim()?.charAt(0)?.toUpperCase() || "?"}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-zinc-200">
          {name}
        </p>

        {!compact && (
          <p className="text-xs text-zinc-500">
            Published on Pulse
          </p>
        )}
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return (
    <Link
      href={href}
      className="min-w-0 transition hover:opacity-80"
      aria-label={`View ${name}'s profile`}
    >
      {content}
    </Link>
  );
}

/* -------------------------------------------------------
   PAGINATION
------------------------------------------------------- */

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}) {
  const pages = useMemo(() => {
    const visibleCount = Math.min(5, totalPages);
    let start = Math.max(1, currentPage - 2);

    start = Math.min(
      start,
      totalPages - visibleCount + 1
    );

    return Array.from(
      { length: visibleCount },
      (_, index) => start + index
    );
  }, [currentPage, totalPages]);

  return (
    <nav
      aria-label="Article pagination"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-lg border border-white/10 px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-35 sm:px-4"
      >
        Previous
      </button>

      {pages.map((page) => (
        <button
          key={page}
          type="button"
          onClick={() => onPageChange(page)}
          aria-current={
            currentPage === page ? "page" : undefined
          }
          className={`h-10 min-w-10 rounded-lg px-3 text-sm font-semibold transition ${
            currentPage === page
              ? "bg-violet-600 text-white"
              : "border border-white/10 text-zinc-400 hover:bg-white/[0.05] hover:text-white"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-lg border border-white/10 px-3 py-2.5 text-sm text-zinc-300 transition hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-35 sm:px-4"
      >
        Next
      </button>
    </nav>
  );
}

/* -------------------------------------------------------
   LOADING, EMPTY AND ERROR STATES
------------------------------------------------------- */

function ArticleSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[16/10] rounded-2xl bg-white/[0.05]" />

      <div className="mt-5 h-5 w-4/5 rounded bg-white/[0.06]" />

      <div className="mt-3 h-4 w-full rounded bg-white/[0.04]" />

      <div className="mt-2 h-4 w-3/4 rounded bg-white/[0.04]" />

      <div className="mt-5 h-9 w-2/3 rounded bg-white/[0.04]" />
    </div>
  );
}

function EmptyFeatured({
  hasError,
  onRetry,
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center sm:min-h-[400px]">
      <BrandMark className="h-12 w-12 text-violet-300/60" />

      <h2 className="mt-5 text-xl font-bold text-white">
        {hasError
          ? "Featured stories are unavailable"
          : "Your next favourite story starts here"}
      </h2>

      <p className="mt-3 max-w-sm text-sm leading-7 text-zinc-400">
        {hasError
          ? "We couldn't retrieve the latest articles. Please try again."
          : "Published articles will appear here when they become available."}
      </p>

      {hasError && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          Try again
        </button>
      )}
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}) {
  return (
    <div className="rounded-2xl border border-red-400/15 bg-red-400/[0.04] p-8 text-center">
      <h3 className="font-bold text-white">
        Couldn't load the articles
      </h3>

      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-zinc-400">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.05]"
      >
        Try again
      </button>
    </div>
  );
}

/* -------------------------------------------------------
   FOOTER
------------------------------------------------------- */

function Footer() {
  const footerGroups = [
    {
      title: "Discover",
      links: [
        {
          label: "Explore articles",
          href: "/explore",
        },
        {
          label: "Activity",
          href: "/activity",
        },
      ],
    },
    {
      title: "Create",
      links: [
        {
          label: "Write a story",
          href: "/blog/create",
        },
        {
          label: "Dashboard",
          href: "/dashboard",
        },
      ],
    },
    {
      title: "Pulse",
      links: [
        {
          label: "Contact",
          href: "/contact",
        },
        {
          label: "Privacy",
          href: "/privacy",
        },
        {
          label: "Terms",
          href: "/terms",
        },
      ],
    },
  ];

  return (
    <footer className="border-t border-white/[0.07] bg-[#07070c]">
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 sm:py-14 lg:px-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600">
                <BrandMark className="h-5 w-5 text-white" />
              </span>

              <span className="text-lg font-black tracking-tight text-white">
                Pulse
                <span className="text-violet-400">.</span>
              </span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-7 text-zinc-500">
              A place to discover stories, share ideas,
              and connect through writing.
            </p>
          </div>

          {footerGroups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-4 text-sm font-bold text-white">
                {group.title}
              </h3>

              <ul className="space-y-3">
                {group.links.map((item) => (
                  <li key={item.href + item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-zinc-500 transition hover:text-violet-300"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/[0.07] pt-6 text-xs text-zinc-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Pulse. All rights reserved.
          </p>

          <p>Made for people with something to say.</p>
        </div>
      </div>
    </footer>
  );
}
