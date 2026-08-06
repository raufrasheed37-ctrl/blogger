"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { blogAPI } from "@/utils/api";

export default function DraftsPage() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrafts();
  }, []);

  async function loadDrafts() {
    try {
      const data = await blogAPI.getMyDrafts();
      setDrafts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0d0d14] text-white p-8">
        Loading drafts...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d0d14] text-white p-8">
      <h1 className="text-3xl font-bold mb-8">
        Drafts
      </h1>

      {drafts.length === 0 ? (
        <div className="rounded-2xl border border-[#2a2740] bg-[#141420] p-10 text-center">
          <p className="text-lg">
            No drafts yet.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {drafts.map((draft) => (
            <div
              key={draft._id}
              className="rounded-2xl border border-[#2a2740] bg-[#141420] p-6"
            >
              <span className="inline-block mb-3 rounded-full bg-yellow-500/20 px-3 py-1 text-xs text-yellow-400">
                Draft
              </span>

              <h2 className="text-xl font-bold">
                {draft.title}
              </h2>

              <p className="mt-2 text-sm text-gray-400">
                {draft.category || "General"}
              </p>

              <p className="mt-4 text-sm text-gray-500">
                Last Updated:
                {" "}
                {new Date(draft.updatedAt).toLocaleString()}
              </p>

              <div className="mt-6 flex justify-end">
                <Link
                  href={`/dashboard/drafts/${draft._id}`}
                  className="rounded-lg bg-[#7c6ff7] px-5 py-2 text-white"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
