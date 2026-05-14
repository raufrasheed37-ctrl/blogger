"use client"
import React, { useState, useEffect, } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useAuthStore from "@/store/authstore";
import { Home, User, Heart, BarChart3, LogOut, Eye, Search, PenSquare, Plus , FileText, BookOpen, Users, Table,} from 'lucide-react';
 
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

const API_ROOT = `${API_BASE_URL}${
  API_BASE_URL.endsWith("/api")
    ? ""
    : "/api"
}`;


const TYPE_META = {
  like: { label: "liked your post", icon: "❤️" },
  restack: { label: "restacked your post", icon: "🔁" },
  reply: { label: "replied to your post", icon: "💬" },
  subscribe: { label: "subscribed to your blog", icon: "⭐" },
};

const Icon = ({ type }) => {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1c1c2e] text-xl border border-[#2a2740]">
      {TYPE_META[type]?.icon || "🔔"}
    </div>
  );
};

const NotificationItem = ({ item }) => {
  return (
    <article className="rounded-3xl border border-[#2a2740] bg-[#141420] p-6 transition hover:-translate-y-0.5 hover:shadow-[0_25px_70px_-30px_rgba(124,111,247,0.2)]">
      <div className="flex items-start gap-4">
        <Icon type={item.type} />

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-[#a89cf7]">
              {item.actor?.name}
            </span>

            <span className="text-[#9490b8] text-sm">
              {TYPE_META[item.type]?.label}
            </span>
          </div>

          {item.content && (
            <div className="mt-4 rounded-2xl border border-[#2a2740] bg-[#1c1c2e] p-4 text-sm leading-7 text-[#9490b8]">
              {item.content}
            </div>
          )}

          {item.post && (
            <div className="mt-4 rounded-2xl border border-[#2a2740] bg-[#1c1c2e] p-4">
              <p className="font-medium text-[#f0eeff]">
                {item.post?.title}
              </p>

              <p className="mt-1 text-xs text-[#9490b8]">
                {item.meta}
              </p>
            </div>
          )}
        </div>

        <div className="text-xs text-[#9490b8] whitespace-nowrap">
          {item.time}
        </div>
      </div>
    </article>
  );
};

export default function ActivityPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] =
  useState([]);

const token = useAuthStore(
  (state) => state.token
);

useEffect(() => {
  const fetchActivity =
    async () => {
      try {
        const res = await fetch(
          `${API_ROOT}/activity`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result =
          await res.json();

        setData([
          {
            section: "Recent",
            items: result,
          },
        ]);
      } catch (error) {
        console.log(error);
      }
    };

  if (token) {
    fetchActivity();
  }
}, [token]);

  const filters = [
    "All",
    "Likes",
    "Replies",
    "Restacks",
    "Subscriptions",
  ];

  const handleLogout = () => {
    useAuthStore.getState().logout();
    router.push("/login");
  };

  const filterMap = {
    Likes: "like",
    Replies: "reply",
    Restacks: "restack",
    Subscriptions: "subscribe",
  };

  const filteredData = data
    .map((section) => ({
      ...section,
      items:
        activeFilter === "All"
          ? section.items
          : section.items.filter(
              (item) => item.type === filterMap[activeFilter]
            ),
    }))
    .filter((section) => section.items.length > 0);

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
            <div className="w-10 h-10 rounded-lg bg-linear-to-br from-[#7c6ff7] to-[#a89cf7] flex items-center justify-center text-xl font-bold">
              ⚡
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
].map((item) => {
  const Icon = item.icon;

  return (
    <Link
      key={item.label}
      href={item.href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
        item.active
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
          <div className="max-w-5xl mx-auto p-6 md:p-8">
            {/* Header with mobile menu toggle */}
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden text-[#7c6ff7]">
                ☰
              </button>
              <h1 className="text-3xl font-bold">Activity</h1>
              <div className="w-10 h-10" />
            </div>

            {/* Header Section */}
            <section className="rounded-3xl border border-[#2a2740] bg-[#141420] p-6 shadow-lg mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9490b8]">
                Notifications
              </p>

              <h2 className="mt-3 text-4xl font-bold">
                Activity
              </h2>

              <p className="mt-3 text-sm text-[#9490b8]">
                A feed of likes, replies, subscriptions, and restacks.
              </p>

              {/* Filters */}
              <div className="mt-6 flex flex-wrap gap-3">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`rounded-xl px-5 py-2 text-sm font-medium transition ${
                      activeFilter === filter
                        ? "bg-[#7c6ff7] text-white"
                        : "border border-[#2a2740] text-[#9490b8] hover:bg-[#1c1c2e]"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </section>

            {/* Feed */}
            <div className="space-y-8">
              {filteredData.length === 0 ? (
                <p className="text-center text-[#9490b8] mt-10">
                  No activity in this category.
                </p>
              ) : (
                filteredData.map((section, idx) => (
                  <div key={idx}>
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#9490b8]">
                      {section.section}
                    </p>

                    <div className="space-y-5">
                      {section.items.map((item, i) => (
                        <NotificationItem
                          key={`${item.user}-${item.time}-${i}`}
                          item={item}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Load More */}
            <div className="mt-10 flex justify-center">
              <button className="rounded-2xl border border-[#2a2740] px-6 py-3 text-sm font-medium text-[#9490b8] transition hover:bg-[#1c1c2e]">
                Load more
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
