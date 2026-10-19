"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import useAuthStore from "@/store/authstore";
import BrandMark from "@/components/BrandMark";

import {
  Home,
  User,
  BarChart3,
  LogOut,
  Search,
  Heart,
  MessageCircle,
  Repeat2,
  Star,
  Bell,
  Check,
  CheckCheck,
  LoaderCircle,
  RefreshCw,
  ArrowUpRight,
  Plus,
  Menu,
  X,
  AlertCircle,
  Inbox,
} from "lucide-react";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const API_ROOT = `${API_BASE_URL}${
  API_BASE_URL.endsWith("/api") ? "" : "/api"
}`;

const PAGE_SIZE = 20;

const TYPE_META = {
  like: {
    label: "liked your post",
    icon: Heart,
    color: "text-rose-400",
    background: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
  comment: {
    label: "commented on your post",
    icon: MessageCircle,
    color: "text-sky-400",
    background: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
  reply: {
    label: "replied to your post",
    icon: MessageCircle,
    color: "text-cyan-400",
    background: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  restack: {
    label: "restacked your post",
    icon: Repeat2,
    color: "text-emerald-400",
    background: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  subscribe: {
    label: "subscribed to your blog",
    icon: Star,
    color: "text-amber-400",
    background: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
};

const FILTERS = [
  { label: "All activity", value: "All" },
  { label: "Likes", value: "like" },
  { label: "Comments", value: "comment" },
  { label: "Replies", value: "reply" },
  { label: "Restacks", value: "restack" },
  { label: "Subscriptions", value: "subscribe" },
];

function getActorName(actor) {
  return actor?.name || actor?.username || "Someone";
}

function getActorInitials(actor) {
  const name = getActorName(actor);

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getRelativeTime(date) {
  if (!date) return "";

  const timestamp = new Date(date).getTime();

  if (Number.isNaN(timestamp)) return "";

  const difference = Date.now() - timestamp;

  if (difference < 0) {
    return new Date(timestamp).toLocaleDateString();
  }

  const seconds = Math.floor(difference / 1000);

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year:
      new Date(timestamp).getFullYear() !==
      new Date().getFullYear()
        ? "numeric"
        : undefined,
  });
}

function getProfileHref(actor) {
  if (!actor) return null;

  const identifier = actor.username || actor._id || actor.id;

  return identifier
    ? `/profile/${encodeURIComponent(identifier)}`
    : null;
}

function getPostHref(post) {
  return post?.slug
    ? `/blog/${encodeURIComponent(post.slug)}`
    : null;
}

function ActivityIcon({ type }) {
  const meta = TYPE_META[type] || {
    icon: Bell,
    color: "text-violet-300",
    background: "bg-violet-500/10",
    border: "border-violet-500/20",
  };

  const Icon = meta.icon;

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${meta.background} ${meta.border} ${meta.color}`}
    >
      <Icon size={19} strokeWidth={2} />
    </div>
  );
}

function ActorAvatar({ actor }) {
  const image = actor?.avatar || actor?.profileImage;

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#393451] bg-gradient-to-br from-[#7c6ff7] to-[#a89cf7] text-sm font-bold text-white">
      {image ? (
        <img
          src={image}
          alt={`${getActorName(actor)}'s profile`}
          className="h-full w-full object-cover"
        />
      ) : (
        getActorInitials(actor)
      )}
    </div>
  );
}

function NotificationItem({
  item,
  onMarkRead,
  busy,
}) {
  const meta = TYPE_META[item.type] || {
    label: "interacted with your content",
  };

  const profileHref = getProfileHref(item.actor);
  const postHref = getPostHref(item.post);

  const content = (
    <div className="flex min-w-0 items-start gap-3">
      <ActorAvatar actor={item.actor} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
          {profileHref ? (
            <Link
              href={profileHref}
              onClick={(event) => event.stopPropagation()}
              className="font-semibold text-white transition hover:text-[#b5aaff]"
            >
              {getActorName(item.actor)}
            </Link>
          ) : (
            <span className="font-semibold text-white">
              {getActorName(item.actor)}
            </span>
          )}

          <span className="text-sm leading-6 text-[#aaa6c5]">
            {meta.label}
          </span>
        </div>

        <p className="mt-1 text-xs text-[#77738f]">
          {getRelativeTime(item.createdAt)}
          {item.createdAt && (
            <>
              {" "}
              <span aria-hidden="true">·</span>{" "}
              <span>
                {new Date(item.createdAt).toLocaleString()}
              </span>
            </>
          )}
        </p>

        {item.content && (
          <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#c5c1dc]">
            {item.content}
          </p>
        )}

        {item.post && (
          <div
            className={`mt-4 rounded-2xl border border-[#302d48] bg-[#10101a] p-4 transition ${
              postHref ? "hover:border-[#7c6ff7]/50" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              {item.post.coverImage && (
                <img
                  src={item.post.coverImage}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-xl border border-white/5 object-cover"
                />
              )}

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#77738f]">
                  Related post
                </p>

                <p className="mt-1 break-words text-sm font-semibold leading-6 text-[#f0eeff]">
                  {item.post.title || "Untitled post"}
                </p>
              </div>

              {postHref && (
                <ArrowUpRight
                  size={16}
                  className="mt-1 shrink-0 text-[#77738f]"
                />
              )}
            </div>
          </div>
        )}

        {item.comment?.content && (
          <div className="mt-3 rounded-xl border border-[#302d48] bg-[#10101a] px-4 py-3 text-sm leading-6 text-[#aaa6c5]">
            {item.comment.content}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <article
      className={`group relative rounded-2xl border p-4 transition duration-200 sm:p-5 ${
        item.read
          ? "border-[#27253a] bg-[#141420]/80 hover:border-[#393451]"
          : "border-[#51438d]/60 bg-gradient-to-br from-[#201b37] to-[#151522] shadow-[0_12px_45px_-30px_rgba(124,111,247,0.5)] hover:border-[#7c6ff7]/60"
      }`}
    >
      {!item.read && (
        <span
          className="absolute right-4 top-4 h-2 w-2 rounded-full bg-[#a89cf7] shadow-[0_0_12px_rgba(168,156,247,0.7)] sm:right-5 sm:top-5"
          aria-label="Unread notification"
          title="Unread"
        />
      )}

      <div className="flex items-start gap-3 sm:gap-4">
        <ActivityIcon type={item.type} />

        <div className="min-w-0 flex-1 pr-2">
          {postHref ? (
            <Link
              href={postHref}
              className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#7c6ff7]"
            >
              {content}
            </Link>
          ) : (
            content
          )}

          {!item.read && (
            <button
              type="button"
              disabled={busy}
              onClick={() => onMarkRead(item._id)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#51438d]/60 px-3 py-2 text-xs font-semibold text-[#b5aaff] transition hover:bg-[#7c6ff7]/10 disabled:cursor-wait disabled:opacity-50"
            >
              {busy ? (
                <LoaderCircle size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              Mark as read
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function EmptyState({ filtered }) {
  return (
    <div className="rounded-3xl border border-dashed border-[#302d48] bg-[#141420]/60 px-5 py-14 text-center sm:py-16">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-[#393451] bg-[#1c1c2e] text-[#a89cf7]">
        <Inbox size={28} strokeWidth={1.5} />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-white">
        {filtered ? "Nothing in this category" : "Your activity starts here"}
      </h3>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#9490b8]">
        {filtered
          ? "Try another filter to see your notifications."
          : "When people interact with your posts or subscribe to your blog, their activity will appear here."}
      </p>

      {filtered && (
        <Link
          href="/explore"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#7c6ff7] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6d5ee8]"
        >
          Explore Pulse
          <ArrowUpRight size={16} />
        </Link>
      )}
    </div>
  );
}

export default function ActivityPage() {
  const router = useRouter();
  const pathname = usePathname();

  const token = useAuthStore((state) => state.token);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  const [activities, setActivities] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [busyIds, setBusyIds] = useState([]);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchActivity = useCallback(
    async ({ append = false } = {}) => {
      if (!token) {
        setActivities([]);
        setUnreadCount(0);
        setTotal(0);
        setLoading(false);
        return;
      }

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const skip = append ? activities.length : 0;

        const res = await fetch(
          `${API_ROOT}/activity?limit=${PAGE_SIZE}&skip=${skip}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        const result = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            result.message || "Unable to load your activity."
          );
        }

        if (!Array.isArray(result.activities)) {
          throw new Error("The activity API returned an unexpected response.");
        }

        setActivities((previous) => {
          if (!append) return result.activities;

          const existingIds = new Set(
            previous.map((item) => item._id)
          );

          return [
            ...previous,
            ...result.activities.filter(
              (item) => !existingIds.has(item._id)
            ),
          ];
        });

        setUnreadCount(
          Number.isFinite(result.unreadCount)
            ? result.unreadCount
            : 0
        );

        setTotal(
          Number.isFinite(result.total)
            ? result.total
            : result.activities.length
        );
      } catch (err) {
        setError(
          err.message || "Something went wrong while loading activity."
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token, activities.length]
  );

  useEffect(() => {
    if (!token) {
      setLoading(false);
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    fetchActivity();
  }, [token, pathname, router, fetchActivity]);

  const handleMarkRead = async (id) => {
    if (!id || busyIds.includes(id)) return;

    const item = activities.find((activity) => activity._id === id);

    if (!item || item.read) return;

    setBusyIds((previous) => [...previous, id]);

    try {
      const res = await fetch(
        `${API_ROOT}/activity/${id}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result.message || "Unable to mark notification as read.");
      }

      setActivities((previous) =>
        previous.map((activity) =>
          activity._id === id
            ? { ...activity, read: true }
            : activity
        )
      );

      setUnreadCount((previous) => Math.max(0, previous - 1));
    } catch (err) {
      setError(err.message || "Unable to update notification.");
    } finally {
      setBusyIds((previous) =>
        previous.filter((busyId) => busyId !== id)
      );
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0 || markingAll) return;

    setMarkingAll(true);
    setError("");

    try {
      const res = await fetch(`${API_ROOT}/activity/read-all`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result.message || "Unable to mark all as read.");
      }

      setActivities((previous) =>
        previous.map((activity) => ({
          ...activity,
          read: true,
        }))
      );

      setUnreadCount(0);
    } catch (err) {
      setError(err.message || "Unable to update notifications.");
    } finally {
      setMarkingAll(false);
    }
  };

  const handleLogout = () => {
    useAuthStore.getState().logout();
    router.push("/login");
  };

  const filteredActivities =
    activeFilter === "All"
      ? activities
      : activities.filter(
          (activity) => activity.type === activeFilter
        );

  const hasMore = activities.length < total;

  const navItems = [
    { label: "Home", icon: Home, href: "/" },
    { label: "Activity", icon: BarChart3, href: "/activity" },
    { label: "Explore", icon: Search, href: "/explore" },
    { label: "Profile", icon: User, href: "/dashboard" },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0d0d14] text-[#f0eeff]">
      {/* Background ambience */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-[#7c6ff7]/10 blur-[110px]" />
        <div className="absolute -right-32 top-[45%] h-96 w-96 rounded-full bg-[#7c6ff7]/5 blur-[120px]" />
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
        />
      )}

      <div className="relative z-10 flex min-h-screen">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-[#2a2740] bg-[#141420] p-5 transition-transform duration-300 md:sticky md:top-0 md:z-20 md:h-screen md:translate-x-0 md:p-6 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="mb-10 flex items-center justify-between">
            <Link
              href="/"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#7c6ff7] to-[#a89cf7]">
                <BrandMark className="h-6 w-6 text-white" />
              </div>

              <span className="text-2xl font-bold tracking-tight">
                Pulse<span className="text-[#7c6ff7]">.</span>
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
              className="rounded-lg p-2 text-[#9490b8] hover:bg-[#1c1c2e] md:hidden"
            >
              <X size={20} />
            </button>
          </div>

          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6f6b89]">
            Workspace
          </p>

          <nav className="flex-1 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-xl border px-3.5 py-3 transition ${
                    active
                      ? "border-[#7c6ff7]/30 bg-[#7c6ff7]/10 text-[#b5aaff]"
                      : "border-transparent text-[#9490b8] hover:bg-[#1c1c2e] hover:text-white"
                  }`}
                >
                  <Icon size={19} />

                  <span className="flex-1 text-sm font-medium">
                    {item.label}
                  </span>

                  {item.label === "Activity" && unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#7c6ff7] px-1.5 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-3 border-t border-[#2a2740] pt-5">
            <Link
              href="/blog/create"
              onClick={() => setSidebarOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#7c6ff7] to-[#9384ff] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#7c6ff7]/10 transition hover:brightness-110"
            >
              <Plus size={18} />
              Create a post
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl border border-[#2a2740] px-4 py-3 text-sm font-medium text-[#9490b8] transition hover:border-rose-500/30 hover:bg-rose-500/5 hover:text-rose-300"
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>

          <div className="mt-5 rounded-xl border border-[#2a2740] bg-[#10101a] px-4 py-3">
            <p className="text-xs font-semibold text-[#c5c1dc]">
              Your creative space.
            </p>
            <p className="mt-1 text-[11px] text-[#77738f]">
              Write. Share. Connect.
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-5xl px-4 pb-12 pt-4 sm:px-6 sm:pt-7 lg:px-10">
            {/* Top bar */}
            <header className="mb-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Open navigation"
                  className="rounded-xl border border-[#302d48] bg-[#141420] p-2.5 text-[#b5aaff] transition hover:bg-[#1c1c2e] md:hidden"
                >
                  <Menu size={20} />
                </button>

                <div>
                  <p className="text-xs font-medium text-[#77738f]">
                    Your workspace
                  </p>
                  <h1 className="mt-1 text-xl font-bold sm:text-2xl">
                    Activity
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-[#393451] bg-[#141420] px-3 py-2 sm:px-4">
                <Bell size={16} className="text-[#a89cf7]" />
                <span className="text-xs font-semibold text-[#c5c1dc] sm:text-sm">
                  {unreadCount} unread
                </span>
              </div>
            </header>

            {/* Hero */}
            <section className="relative mb-7 overflow-hidden rounded-3xl border border-[#393451] bg-gradient-to-br from-[#211c38] via-[#171625] to-[#141420] p-5 sm:p-8">
              <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full bg-[#7c6ff7]/10 blur-3xl" />

              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#51438d]/50 bg-[#7c6ff7]/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#b5aaff]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#a89cf7]" />
                  Your notifications
                </div>

                <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                  <div>
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                      Stay in the loop<span className="text-[#a89cf7]">.</span>
                    </h2>

                    <p className="mt-3 max-w-lg text-sm leading-6 text-[#aaa6c5] sm:text-base">
                      Every like, conversation, restack, and new subscriber —
                      all in one place.
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-5">
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {total}
                      </p>
                      <p className="mt-1 text-xs text-[#77738f]">
                        Total activity
                      </p>
                    </div>

                    <div className="h-10 w-px bg-[#393451]" />

                    <div>
                      <p className="text-2xl font-bold text-[#b5aaff]">
                        {unreadCount}
                      </p>
                      <p className="mt-1 text-xs text-[#77738f]">
                        Unread
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Filters and actions */}
            <section className="mb-6 rounded-2xl border border-[#2a2740] bg-[#141420] p-3 sm:p-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Your feed
                    </h3>
                    <p className="mt-1 text-xs text-[#77738f]">
                      {filteredActivities.length} shown
                      {activeFilter === "All" ? "" : " in this category"}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fetchActivity()}
                      disabled={loading}
                      aria-label="Refresh activity"
                      className="rounded-xl border border-[#302d48] p-2.5 text-[#aaa6c5] transition hover:bg-[#1c1c2e] hover:text-white disabled:opacity-50"
                    >
                      <RefreshCw
                        size={16}
                        className={loading ? "animate-spin" : ""}
                      />
                    </button>

                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      disabled={unreadCount === 0 || markingAll}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#393451] px-3 py-2.5 text-xs font-semibold text-[#b5aaff] transition hover:bg-[#7c6ff7]/10 disabled:cursor-not-allowed disabled:opacity-40 sm:px-4 sm:text-sm"
                    >
                      {markingAll ? (
                        <LoaderCircle size={15} className="animate-spin" />
                      ) : (
                        <CheckCheck size={15} />
                      )}

                      <span className="hidden sm:inline">
                        Mark all read
                      </span>
                      <span className="sm:hidden">Read all</span>
                    </button>
                  </div>
                </div>

                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                  {FILTERS.map((filter) => {
                    const active = activeFilter === filter.value;

                    return (
                      <button
                        key={filter.value}
                        type="button"
                        onClick={() => setActiveFilter(filter.value)}
                        className={`shrink-0 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                          active
                            ? "border-[#7c6ff7] bg-[#7c6ff7] text-white shadow-lg shadow-[#7c6ff7]/15"
                            : "border-[#302d48] bg-[#10101a] text-[#9490b8] hover:border-[#51438d] hover:text-white"
                        }`}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* API errors */}
            {error && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4"
              >
                <AlertCircle
                  size={19}
                  className="mt-0.5 shrink-0 text-rose-400"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-rose-300">
                    Something went wrong
                  </p>
                  <p className="mt-1 break-words text-sm leading-6 text-[#aaa6c5]">
                    {error}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fetchActivity()}
                  className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500/10"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Feed */}
            <section aria-label="Notifications" aria-busy={loading}>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="animate-pulse rounded-2xl border border-[#2a2740] bg-[#141420] p-5"
                    >
                      <div className="flex gap-4">
                        <div className="h-11 w-11 rounded-2xl bg-[#252239]" />
                        <div className="flex-1 space-y-3">
                          <div className="h-4 w-3/5 rounded bg-[#252239]" />
                          <div className="h-3 w-1/3 rounded bg-[#252239]" />
                          <div className="h-14 rounded-xl bg-[#252239]" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredActivities.length === 0 ? (
                <EmptyState
                  filtered={
                    activeFilter !== "All" && activities.length > 0
                  }
                />
              ) : (
                <div className="space-y-3">
                  {filteredActivities.map((item) => (
                    <NotificationItem
                      key={item._id}
                      item={item}
                      onMarkRead={handleMarkRead}
                      busy={busyIds.includes(item._id)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Pagination */}
            {!loading && hasMore && (
              <div className="mt-8 flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => fetchActivity({ append: true })}
                  disabled={loadingMore}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#393451] bg-[#141420] px-6 py-3 text-sm font-semibold text-[#c5c1dc] transition hover:border-[#7c6ff7]/50 hover:bg-[#1c1c2e] disabled:cursor-wait disabled:opacity-50"
                >
                  {loadingMore && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}

                  {loadingMore ? "Loading activity..." : "Load more"}
                </button>

                <p className="mt-3 text-xs text-[#77738f]">
                  Showing {activities.length} of {total} notifications
                </p>
              </div>
            )}

            {!loading && activities.length > 0 && !hasMore && (
              <p className="mt-8 text-center text-xs text-[#77738f]">
                You're all caught up.
              </p>
            )}

            <footer className="mt-12 border-t border-[#27253a] pt-5 text-center">
              <p className="text-xs text-[#6f6b89]">
                Pulse · Your stories, your community.
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
