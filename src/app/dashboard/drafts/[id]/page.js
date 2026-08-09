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

      await blogAPI.update(draft._id, {
  title: draft.title,
  content: draft.content,
  excerpt: draft.excerpt,
  published: true,
});

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
  href="/dashboard?tab=Drafts"
  className="inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/5 transition"
>
  ← Back to Drafts
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

      <div
  className="prose prose-invert max-w-none mt-10"
  dangerouslySetInnerHTML={{ __html: draft.content }}
/>

          <p className="mt-10 text-sm text-gray-500">
            Last Updated{" "}
            {new Date(
              draft.updatedAt || draft.createdAt
            ).toLocaleString()}
          </p>

     <div className="mt-10 flex flex-wrap gap-3">

  <Link
    href={`/editor-dashboard?id=${draft._id}`}
    className="rounded-full border border-[#7c6ff7]/40 bg-[#141420] px-5 py-2.5 text-sm font-medium text-[#a89cf7] transition hover:border-[#7c6ff7]/70 hover:bg-[#1c1c2e]"
  >
    Edit Draft
  </Link>

  <button
    onClick={publishDraft}
    disabled={publishing}
    className="rounded-full border border-[#7c6ff7]/40 bg-[#141420] px-5 py-2.5 text-sm font-medium text-[#a89cf7] transition hover:border-[#7c6ff7]/70 hover:bg-[#1c1c2e] disabled:opacity-60"
  >
    {publishing ? "Publishing..." : "Publish"}
  </button>

  <button
    onClick={deleteDraft}
    disabled={deleting}
    className="rounded-full border border-rose-500/30 bg-[#141420] px-5 py-2.5 text-sm font-medium text-rose-300 transition hover:border-rose-500/60 hover:bg-[#1c1c2e] disabled:opacity-60"
  >
    {deleting ? "Deleting..." : "Delete"}
  </button>

</div>

        </div>
      </div>
    </main>
  );
}
