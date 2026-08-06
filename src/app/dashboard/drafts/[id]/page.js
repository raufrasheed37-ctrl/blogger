"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { blogAPI } from "@/utils/api";

export default function DraftPage() {
  const { id } = useParams();
  const router = useRouter();

  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadDraft();
  }, [id]);

  const loadDraft = async () => {
    try {
      const data = await blogAPI.getById(id);
      setDraft(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const publishDraft = async () => {
    try {
      setPublishing(true);

      await blogAPI.update(
        draft._id,
        draft.title,
        draft.content,
        draft.excerpt,
        true
      );

      router.push("/dashboard");
    } catch (err) {
      console.log(err);
      alert(err.message);
    } finally {
      setPublishing(false);
    }
  };

  const deleteDraft = async () => {
    if (!confirm("Delete this draft?")) return;

    try {
      setDeleting(true);

      await blogAPI.delete(draft._id);

      router.push("/dashboard");
    } catch (err) {
      console.log(err);
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0d0d14] flex items-center justify-center text-white">
        Loading draft...
      </main>
    );
  }

  if (!draft) {
    return (
      <main className="min-h-screen bg-[#0d0d14] flex items-center justify-center text-white">
        Draft not found.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d0d14] text-white">
      <div className="max-w-5xl mx-auto p-8">

        <Link
          href="/dashboard"
          className="text-[#8b7cff]"
        >
          ← Back
        </Link>

        <div className="mt-8 rounded-3xl border border-[#2a2740] bg-[#141420] p-8">

          {draft.coverImage && (
            <img
              src={draft.coverImage}
              alt={draft.title}
              className="w-full h-72 object-cover rounded-2xl mb-8"
            />
          )}

          <span className="inline-block px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-sm">
            Draft
          </span>

          <h1 className="text-4xl font-bold mt-5">
            {draft.title}
          </h1>

          {draft.excerpt && (
            <p className="mt-5 text-gray-400">
              {draft.excerpt}
            </p>
          )}

          {draft.category && (
            <div className="mt-6">
              <span className="text-sm text-gray-500">
                Category
              </span>

              <p className="mt-1">
                {draft.category}
              </p>
            </div>
          )}

          {draft.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {draft.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-[#23233a]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-10 whitespace-pre-wrap leading-8 text-gray-300">
            {draft.content}
          </div>

          <p className="mt-10 text-sm text-gray-500">
            Last Updated{" "}
            {new Date(
              draft.updatedAt || draft.createdAt
            ).toLocaleString()}
          </p>

          <div className="flex flex-wrap gap-4 mt-10">

            <Link
              href={`/dashboard/drafts/${draft._id}/edit`}
              className="px-6 py-3 rounded-xl bg-[#7c6ff7]"
            >
              Edit Draft
            </Link>

            <button
              onClick={publishDraft}
              disabled={publishing}
              className="px-6 py-3 rounded-xl bg-green-600"
            >
              {publishing ? "Publishing..." : "Publish"}
            </button>

            <button
              onClick={deleteDraft}
              disabled={deleting}
              className="px-6 py-3 rounded-xl bg-red-600"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>

          </div>

        </div>
      </div>
    </main>
  );
}
