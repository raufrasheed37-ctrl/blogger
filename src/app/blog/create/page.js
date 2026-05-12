"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { blogAPI } from "@/utils/api";
import useAuthStore from "@/store/authstore";

export default function CreatePostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [category, setCategory] = useState("General");
  const [visibility, setVisibility] = useState("public");
  const [allowComments, setAllowComments] = useState(true);
  const [featureProfile, setFeatureProfile] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");
  const { user, isHydrated, hydrate } = useAuthStore();
  const coverInputRef = useRef(null);

  // Hydrate on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Redirect only after hydration is finished
  useEffect(() => {
    if (isHydrated && !user?._id) {
      router.push("/login");
    }
  }, [isHydrated, user, router]);

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200);
  const charCount = content.length;

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleCoverUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverImage(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!content.trim()) {
      setError("Content is required");
      return;
    }
    if (!user?._id) {
      setError("User not authenticated. Please login again.");
      router.push("/login");
      return;
    }

    setIsPublishing(true);
    setError("");

    try {
      const payload = {
        title: title.trim(),
        description: subtitle.trim() || content.slice(0, 180),
        content: content.trim(),
        author: user._id,
        tags: tags.length > 0 ? tags : ["general"],
        category: category || "general",
        isPublished: true,
        enableComments: allowComments,
        coverImage: coverImage,
      };

      console.log("Publishing payload:", payload);

      const response = await blogAPI.create(payload);

      console.log("Backend response:", response);

      const slug = response?.slug || response?._id;
      const postTitle = response?.title || title;
      const postDesc = response?.description || subtitle || content.slice(0, 150);

      if (slug) {
        router.push(
          `/blog/published?slug=${slug}&title=${encodeURIComponent(postTitle)}&excerpt=${encodeURIComponent(postDesc)}`
        );
      } else {
        setError("Post created but could not get post ID");
      }
    } catch (err) {
      const errorMsg = err?.message || err?.response?.data?.message || err?.toString() || "Failed to publish post";
      setError(errorMsg);
      console.error("Publish error details:", {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status,
        error: err,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Show loading while authenticating
  if (!isHydrated) {
    return (
      <div className="min-h-screen h-screen bg-[#0d0d14] flex items-center justify-center">
        <div className="animate-pulse text-[#9490b8]">Loading...</div>
      </div>
    );
  }

  if (!user?._id) {
    return null;
  }

  return (
    <div className="min-h-screen h-screen bg-[#0d0d14] text-[#f0eeff] overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#7c6ff7]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[#7c6ff7]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full h-full flex flex-col">
        {/* Top Navigation */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-[#2a2740] bg-[#0d0d14] shrink-0">
          <Link href="/blog" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-[#7c6ff7] to-[#a89cf7] flex items-center justify-center">
              ⚡
            </div>
            <span className="text-lg font-bold">Pulse<span className="text-[#7c6ff7]">.</span></span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Draft Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-full text-xs font-medium text-[#f59e0b]">
              <span className="inline-block w-2 h-2 bg-[#f59e0b] rounded-full" />
              Draft
            </div>

            {/* Preview Button */}
            <button className="px-4 py-2 text-sm font-medium text-[#9490b8] hover:text-[#f0eeff] hover:bg-[#1c1c2e] rounded-lg transition border border-transparent hover:border-[#2a2740]">
              Preview
            </button>

            {/* Publish Button */}
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="px-6 py-2 text-sm font-semibold text-white bg-linear-to-r from-[#7c6ff7] to-[#a89cf7] rounded-lg hover:shadow-lg hover:shadow-[#7c6ff7]/30 transition disabled:opacity-50"
            >
              {isPublishing ? "Publishing..." : "Publish now"}
            </button>
          </div>
        </div>

        {/* Main Editor Container - Full height */}
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-full w-full">
            {/* Left Editor Area */}
            <div className="lg:col-span-2 border-r border-[#2a2740] overflow-y-auto flex flex-col bg-[#0d0d14]">
              <div className="flex-1 p-8 space-y-6 overflow-y-auto">
                {/* Cover Image Upload */}
                <div
                  onClick={() => coverInputRef.current?.click()}
                  className="relative w-full h-48 rounded-xl border-2 border-dashed border-[#2a2740] hover:border-[#7c6ff7] bg-[#1c1c2e] flex items-center justify-center cursor-pointer group transition shrink-0"
                >
                  {coverImage ? (
                    <Image
                      src={coverImage}
                      alt="Cover"
                      fill
                      unoptimized
                      className="object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center">
                      <div className="text-3xl mb-2">📸</div>
                      <p className="text-sm text-[#9490b8]">Click to upload cover image</p>
                    </div>
                  )}
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                  />
                </div>

                {/* Title Input */}
                <div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter your article title..."
                    className="w-full bg-transparent text-4xl font-bold text-[#f0eeff] placeholder-[#9490b8]/50 outline-none"
                  />
                </div>

                {/* Subtitle Input */}
                <div className="pt-4 border-t border-[#2a2740]">
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Add a compelling subtitle..."
                    className="w-full bg-transparent text-lg text-[#9490b8] placeholder-[#9490b8]/30 outline-none"
                  />
                </div>

                {/* Content Textarea */}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start writing your article..."
                  className="w-full flex-1 bg-transparent text-base text-[#f0eeff] placeholder-[#9490b8]/30 outline-none resize-none leading-relaxed min-h-96"
                />
              </div>

              {/* Bottom Stats Bar */}
              <div className="border-t border-[#2a2740] px-8 py-4 flex items-center gap-6 text-xs text-[#9490b8] bg-[#141420] shrink-0">
                <span>Words: <span className="text-[#7c6ff7]">{wordCount}</span></span>
                <span>Reading time: <span className="text-[#7c6ff7]">{readingTime} min</span></span>
                <span>Characters: <span className="text-[#7c6ff7]">{charCount}</span></span>
              </div>
            </div>

            {/* Right Settings Panel */}
            <div className="border-l border-[#2a2740] overflow-y-auto bg-[#1c1c2e] p-6 space-y-6">
              {/* Cover Image Card */}
              <div className="bg-[#141420] border border-[#2a2740] rounded-xl p-4">
                <p className="text-xs uppercase tracking-wider text-[#9490b8] font-semibold mb-3">Cover Image</p>
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full py-2 text-sm border border-[#2a2740] text-[#9490b8] hover:text-[#f0eeff] hover:border-[#7c6ff7]/50 rounded-lg transition"
                >
                  {coverImage ? "Change cover" : "Upload cover"}
                </button>
              </div>

              {/* Tags Section */}
              <div className="bg-[#141420] border border-[#2a2740] rounded-xl p-4">
                <p className="text-xs uppercase tracking-wider text-[#9490b8] font-semibold mb-3">Tags</p>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {tags.map((tag, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-[#7c6ff7]/20 border border-[#7c6ff7]/50 text-[#a89cf7] text-xs rounded-full">
                      {tag}
                      <button
                        onClick={() => removeTag(idx)}
                        className="hover:text-[#f0eeff] transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
                    placeholder="Add tag..."
                    className="flex-1 px-3 py-2 bg-[#0d0d14] border border-[#2a2740] text-[#f0eeff] placeholder-[#9490b8]/30 rounded-lg outline-none focus:border-[#7c6ff7] text-sm"
                  />
                  <button
                    onClick={addTag}
                    className="px-3 py-2 bg-[#7c6ff7] text-white rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-[#7c6ff7]/30 transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Category */}
              <div className="bg-[#141420] border border-[#2a2740] rounded-xl p-4">
                <p className="text-xs uppercase tracking-wider text-[#9490b8] font-semibold mb-3">Category</p>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0d0d14] border border-[#2a2740] text-[#f0eeff] rounded-lg outline-none focus:border-[#7c6ff7] text-sm"
                >
                  <option>General</option>
                  <option>Technology</option>
                  <option>Business</option>
                  <option>Personal</option>
                  <option>Lifestyle</option>
                </select>
              </div>

              {/* Visibility */}
              <div className="bg-[#141420] border border-[#2a2740] rounded-xl p-4">
                <p className="text-xs uppercase tracking-wider text-[#9490b8] font-semibold mb-3">Visibility</p>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0d0d14] border border-[#2a2740] text-[#f0eeff] rounded-lg outline-none focus:border-[#7c6ff7] text-sm"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="bg-[#141420] border border-[#2a2740] rounded-xl p-4 space-y-4">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm text-[#9490b8] group-hover:text-[#f0eeff] transition">Allow comments</span>
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                    className="w-5 h-5"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-sm text-[#9490b8] group-hover:text-[#f0eeff] transition">Feature on profile</span>
                  <input
                    type="checkbox"
                    checked={featureProfile}
                    onChange={(e) => setFeatureProfile(e.target.checked)}
                    className="w-5 h-5"
                  />
                </label>
              </div>

              {/* Meta Info */}
              <div className="bg-[#141420] border border-[#2a2740] rounded-xl p-4 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#9490b8] font-semibold mb-2">Meta title</p>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="SEO title (auto-filled)"
                    className="w-full px-3 py-2 bg-[#0d0d14] border border-[#2a2740] text-[#f0eeff] placeholder-[#9490b8]/30 rounded-lg outline-none focus:border-[#7c6ff7] text-sm"
                  />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-[#9490b8] font-semibold mb-2">Meta description</p>
                  <textarea
                    value={metaDesc}
                    onChange={(e) => setMetaDesc(e.target.value)}
                    placeholder="SEO description (auto-filled)"
                    rows="3"
                    className="w-full px-3 py-2 bg-[#0d0d14] border border-[#2a2740] text-[#f0eeff] placeholder-[#9490b8]/30 rounded-lg outline-none focus:border-[#7c6ff7] text-sm resize-none"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Publish Buttons */}
              <div className="space-y-3 pt-4 border-t border-[#2a2740]">
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="w-full py-3 bg-linear-to-r from-[#7c6ff7] to-[#a89cf7] text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-[#7c6ff7]/30 transition disabled:opacity-50"
                >
                  {isPublishing ? "Publishing..." : "Publish now"}
                </button>
                <button className="w-full py-2 border border-[#2a2740] text-[#9490b8] hover:text-[#f0eeff] hover:bg-[#141420] font-medium rounded-lg transition">
                  Save as draft
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
