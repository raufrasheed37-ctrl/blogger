"use client";

import { useRouter } from "next/navigation";
import { getClientAuthToken, isClientAuthenticated } from "@/store/authstore";

export function getLoginRedirect(nextPath = "/") {
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export function useAuthRedirect() {
  const router = useRouter();

  const requireAuth = (nextPath = "/") => {
    if (isClientAuthenticated()) {
      return true;
    }

    router.push(getLoginRedirect(nextPath));
    return false;
  };

  return { requireAuth };
}

export function resolveAuthorIdentity(user, fallbackName = "Pulse Author", fallbackHandle = "@pulse") {
  const name = user?.name?.trim() || user?.username?.trim() || user?.email?.split("@")[0] || fallbackName;
  const handle = user?.username?.trim()
    ? `@${user.username.trim().replace(/^@/, "")}`
    : user?.email?.split("@")[0]
      ? `@${user.email.split("@")[0]}`
      : fallbackHandle;

  return { name, handle };
}