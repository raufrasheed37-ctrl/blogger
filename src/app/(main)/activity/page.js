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
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const API_ROOT = `${API_BASE_URL.replace(/\/+$/, "")}${
  API_BASE_URL.replace(/\/+$/, "").endsWith("/api") ? "" : "/api"
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
  return getActorName(actor)
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
      new Date(timestamp).getFullYear() !== new Date().getFullYear()
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

function NotificationItem({ item, onMarkRead, busy }) {
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
              {" · "}
              <span>{new Date(item.createdAt).toLocaleString()}</span>
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
          : "border-[#51438d]/60 bg-gradient-to-br from-[#201b37] to-[#151
