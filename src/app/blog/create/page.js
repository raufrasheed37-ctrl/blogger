"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { blogAPI } from "@/utils/api";
import useAuthStore from "@/store/authstore";
import BrandMark from "@/components/BrandMark";

function Icon({ name, className = "h-4 w-4" }) {
  const icons = {
    bold: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M15.6 10.79A3.5 3.5 0 0 0 13 3H7v18h8a4 4 0 0 0 .6-7.21zM9 5h4a2 2 0 0 1 0 4H9V5zm5 14H9v-6h5a3 3 0 0 1 0 6z" />
      </svg>
    ),
    italic: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M10 4v3h2.21l-3.42 10H6v3h8v-3h-2.21l3.42-10H18V4z" />
      </svg>
    ),
    underline: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M5 3v6a7 7 0 0 0 14 0V3h-2v6a5 5 0 0 1-10 0V3H5zM5 19v2h14v-2H5z" />
      </svg>
    ),
    strike: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M10 5h4a2 2 0 0 1 2 2v1h2V7a4 4 0 0 0-4-4h-4a4 4 0 0 0-4 4c0 2.21 1.79 4 4 4h2c1.1 0 2 .9 2 2s-.9 2-2 2H8v2h2a4 4 0 0 0 4-4c0-2.21-1.79-4-4-4H8a2 2 0 0 1 0-4zM4 11h16v2H4v-2z" />
      </svg>
    ),
    left: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3 3h18v2H3V3zm0 8h12v2H3v-2zm0 8h18v2H3v-2z" />
      </svg>
    ),
    center: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3 3h18v2H3V3zm3 8h12v2H6v-2zm-3 8h18v2H3v-2z" />
      </svg>
    ),
    right: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3 3h18v2H3V3zm6 8h12v2H9v-2zm-6 8h18v2H3v-2z" />
      </svg>
    ),
    justify: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3 3h18v2H3V3zm0 5h18v2H3V8zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
      </svg>
    ),
  };

  return icons[name] || null;
}

export default function CreatePostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState("");
  const [category, setCategory] = useState("Explore");
  const [visibility, setVisibility] = useState("public");
  const [allowComments, setAllowComments] = useState(true);
  const [featureProfile, setFeatureProfile] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [coverImage, setCoverImage] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const { user, isHydrated, hydrate } = useAuthStore();
  const coverInputRef = useRef(null);
  const editorRef = useRef(null);

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

  useEffect(() => {
    if (!editorRef.current) return;
    if (!editorRef.current.innerHTML && content) {
      editorRef.current.innerHTML = content;
    }
  }, [content]);

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

  const execFormat = (command, value = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    setContent(editorRef.current.innerHTML || "");
  };

  const handleEditorInput = () => {
    if (!editorRef.current) return;
    setContent(editorRef.current.innerHTML || "");
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
      // derive a plain-text excerpt/description so saved subtitle/excerpt doesn't contain HTML tags
      const plainText = (editorRef.current && editorRef.current.innerText) ? editorRef.current.innerText : content.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
      const authorName = user?.name?.trim() || user?.username?.trim() || user?.email?.split("@")[0] || "Pulse Author";
      const authorId = user?._id || user?.id || "";
      const authorHandle = user?.username?.trim()
        ? `@${user.username.trim().replace(/^@/, "")}`
        : user?.email?.split("@")[0]
          ? `@${user.email.split("@")[0]}`
          : "@pulse";

      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim() || plainText.slice(0, 180),
        excerpt: subtitle.trim() || plainText.slice(0, 180),
        description: subtitle.trim() || plainText.slice(0, 180),
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
      const postDesc = response?.excerpt || response?.subtitle || response?.description || subtitle || content.slice(0, 150);

      if (slug) {
        router.push(
          `/blog/published?slug=${slug}&title=${encodeURIComponent(postTitle)}&excerpt=${encodeURIComponent(postDesc)}&authorName=${encodeURIComponent(authorName)}&authorHandle=${encodeURIComponent(authorHandle)}&authorId=${encodeURIComponent(authorId)}`
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
              <BrandMark className="w-4 h-4 text-white" />
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
            <button onClick={() => setShowPreview(true)} className="px-4 py-2 text-sm font-medium text-[#9490b8] hover:text-[#f0eeff] hover:bg-[#1c1c2e] rounded-lg transition border border-transparent hover:border-[#2a2740]">
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

        {/* Rich Text Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-6 sm:px-8 py-4 border-b border-[#2a2740] bg-[#10101a]/95 backdrop-blur-md shrink-0">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#2a2740] bg-[#141420] px-3 py-2 shadow-[0_0_0_1px_rgba(124,111,247,0.06)]">
            {[
              { name: "bold", label: "Bold", command: "bold" },
              { name: "italic", label: "Italic", command: "italic" },
              { name: "underline", label: "Underline", command: "underline" },
              { name: "strike", label: "Strikethrough", command: "strikeThrough" },
            ].map((item) => (
              <button
                key={item.name}
                type="button"
                title={item.label}
                aria-label={item.label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execFormat(item.command)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#7c6ff7]/35 bg-transparent text-[#d9d2ff] transition hover:border-[#a89cf7]/80 hover:bg-[#7c6ff7]/10 hover:text-white hover:shadow-[0_0_0_1px_rgba(124,111,247,0.08),0_0_18px_rgba(124,111,247,0.18)]"
              >
                <Icon name={item.name} />
              </button>
            ))}

            <div className="mx-1 h-8 w-px bg-[#2a2740]" />

            {[
              { name: "left", label: "Align left", command: "justifyLeft" },
              { name: "center", label: "Align center", command: "justifyCenter" },
              { name: "right", label: "Align right", command: "justifyRight" },
              { name: "justify", label: "Justify", command: "justifyFull" },
            ].map((item) => (
              <button
                key={item.name}
                type="button"
                title={item.label}
                aria-label={item.label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => execFormat(item.command)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#7c6ff7]/25 bg-transparent text-[#d9d2ff] transition hover:border-[#a89cf7]/80 hover:bg-[#7c6ff7]/10 hover:text-white hover:shadow-[0_0_0_1px_rgba(124,111,247,0.08),0_0_18px_rgba(124,111,247,0.18)]"
              >
                <Icon name={item.name} />
              </button>
            ))}
          </div>

          <p className="text-xs text-[#9490b8]">
            Rich text tools for formatting your draft.
          </p>
        </div>

        {/* Main Editor Container - Full height */}
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-full w-full">
            {/* Left Editor Area */}
            <div className="lg:col-span-2 border-r border-[#2a2740] overflow-y-auto flex flex-col bg-[#0d0d14]">
              <div className="flex-1 p-8 space-y-6 overflow-y-auto">
                {/*
                Cover Image Upload
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
                </div
                */}

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

                {/* Content Editor */}
                <div className="relative">
                  {(!content || content.trim().length === 0) && (
                    <div className="absolute top-8 left-8 right-8 text-[#9490b8] pointer-events-none text-base leading-relaxed">
                      Start writing your article...
                    </div>
                  )}
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleEditorInput}
                    className="min-h-96 w-full rounded-xl border border-transparent bg-transparent text-base leading-relaxed text-[#f0eeff] outline-none focus:border-[#7c6ff7]/40 focus:bg-[#141420]/40"
                    style={{ whiteSpace: "pre-wrap" }}
                  />
                </div>
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
              {/*
              Cover Image Card
              <div className="bg-[#141420] border border-[#2a2740] rounded-xl p-4">
                <p className="text-xs uppercase tracking-wider text-[#9490b8] font-semibold mb-3">Cover Image</p>
                <button
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full py-2 text-sm border border-[#2a2740] text-[#9490b8] hover:text-[#f0eeff] hover:border-[#7c6ff7]/50 rounded-lg transition"
                >
                  {coverImage ? "Change cover" : "Upload cover"}
                </button>
              </div>
              */}

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
                  <option>Explore</option>
                <option>Technology</option>
                 <option>Business</option>
                 <option>Culture</option>
                  <option>Sports</option>
                <option>Entertainment</option>
                </select>
              </div>

              {/* Visibility */}
            <div className="bg-[#141420] border border-[#2a2740] rounded-xl p-4">
  <p className="text-xs uppercase tracking-wider text-[#9490b8] font-semibold mb-3">
    Visibility
  </p>

  <select
    value={visibility}
    onChange={(e) => setVisibility(e.target.value)}
    className="w-full px-3 py-2 bg-[#0d0d14] border border-[#2a2740] text-[#f0eeff] rounded-lg outline-none focus:border-[#7c6ff7] text-sm"
  >
    <option value="public">Public</option>
    <option value="private">Private (Draft)</option>
  </select>
</div>

              {/* Toggles */}
              {/* <div className="bg-[#141420] border border-[#2a2740] rounded-xl p-4 space-y-4">
                
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
               
              </div> */}

              {/* Meta Info
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
              */}

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
                {/*
                <button className="w-full py-2 border border-[#2a2740] text-[#9490b8] hover:text-[#f0eeff] hover:bg-[#141420] font-medium rounded-lg transition">
                  Save as draft
                </button>
                */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowPreview(false)} />
          <div className="relative max-w-4xl w-full bg-[#0b0b12] rounded-2xl border border-[#2a2740] shadow-2xl overflow-auto" style={{maxHeight: '90vh'}}>
            <div className="flex items-center justify-between p-6 border-b border-[#2a2740]">
              <div>
                <h2 className="text-xl font-bold">Preview</h2>
                <p className="text-sm text-[#9490b8]">How your post will appear</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowPreview(false)} className="px-3 py-2 rounded-lg border border-[#2a2740] text-sm hover:bg-[#141420]">Close</button>
              </div>
            </div>

            <article className="p-8">
              { /* cover image if present */ }
              {coverImage && (
                <div className="mb-6 rounded-lg overflow-hidden">
                  <Image
                    src={coverImage}
                    alt="Cover"
                    width={1200}
                    height={630}
                    className="w-full object-cover"
                  />
                </div>
              )}

              <header className="mb-6">
                <h1 className="text-4xl font-extrabold text-[#f0eeff] mb-3">{title || "Untitled"}</h1>
                {subtitle && <p className="text-lg text-[#9490b8]">{subtitle}</p>}
                <div className="mt-4 text-sm text-[#9490b8]">By {user?.name || user?.email || 'You'}</div>
              </header>

              <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content || '<p><em>Empty content</em></p>' }} />
            </article>
          </div>
        </div>
      )}
    </div>
  );
}
