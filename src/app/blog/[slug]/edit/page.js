"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { blogAPI } from "@/utils/api";
import { uploadCoverToBackend } from "@/utils/cloudinary";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";

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
    link: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M3.9 12a5 5 0 0 1 0-7.07l1.41-1.41A5 5 0 0 1 12.36 6l-1.41 1.41A3 3 0 0 0 6.83 7.8L5.42 9.21A3 3 0 0 0 6.83 12.6L8.24 11.19A1 1 0 0 1 9.66 12.6L8.24 14a3 3 0 0 1-4.24-4.24L3.9 12zM20.1 12a5 5 0 0 1 0 7.07l-1.41 1.41A5 5 0 0 1 11.64 18l1.41-1.41A3 3 0 0 0 17.17 16.2l1.41-1.41A3 3 0 0 0 17.17 9.4L15.76 10.81A1 1 0 0 1 14.34 9.4L15.76 8a3 3 0 0 1 4.24 4.24L20.1 12z" />
      </svg>
    ),
    image: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14l4-4 3 3 5-5 5 5z" />
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
    preview: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 5c-7 0-11 6-11 7s4 7 11 7 11-6 11-7-4-7-11-7zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
      </svg>
    ),
    continue: (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M12 2L3 21h18L12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z" />
      </svg>
    ),
  };

  return icons[name] || null;
}

function splitContentAndTags(html, fallbackTags = []) {
  if (typeof window === "undefined") {
    return { tags: fallbackTags.length > 0 ? fallbackTags : [""], bodyHtml: html || "" };
  }

  if (!html) {
    return { tags: fallbackTags.length > 0 ? fallbackTags : [""], bodyHtml: "" };
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;

  const firstChild = wrapper.firstElementChild;
  if (firstChild?.tagName === "P") {
    const text = firstChild.textContent || "";
    const match = text.match(/^Tags:\s*(.*)$/i);

    if (match) {
      const tags = match[1]
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      firstChild.remove();

      return {
        tags: tags.length > 0 ? tags : [""],
        bodyHtml: wrapper.innerHTML || "",
      };
    }
  }

  return {
    tags: fallbackTags.length > 0 ? fallbackTags : [""],
    bodyHtml: html,
  };
}

export default function EditPostPage() {
  const router = useRouter();

  const routeParams = useParams();
  const slugParam = Array.isArray(routeParams?.slug) ? routeParams.slug[0] : routeParams?.slug;

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [tags, setTags] = useState([""]);
  const [newTag, setNewTag] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [hasBodyContent, setHasBodyContent] = useState(false);
  const [contentHtml, setContentHtml] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [postId, setPostId] = useState(slugParam || "");
  const [postSlug, setPostSlug] = useState(slugParam || "");
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [isUnderlineActive, setIsUnderlineActive] = useState(false);
  // TipTap-only editor state is driven by `contentHtml`.
  // Keeping this ref unused to avoid touching larger legacy code paths.
  const editorRef = useRef(null);

  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const [coverImage, setCoverImage] = useState(null);
  const selectedImageRef = useRef(null);
  const [selectedImageVisible, setSelectedImageVisible] = useState(false);
  const [overlayPos, setOverlayPos] = useState({ top: 0, left: 0 });
  const [replacePending, setReplacePending] = useState(false);

  const exec = useCallback((command, value = null) => {
    if (!editorRef.current) return;
    document.execCommand(command, false, value);
    editorRef.current.focus();
  }, []);

  const updateFormatStates = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      setIsBoldActive(false);
      setIsItalicActive(false);
      setIsUnderlineActive(false);
      return;
    }

    const anchor = sel.anchorNode;
    if (!anchor || !editor.contains(anchor)) {
      setIsBoldActive(false);
      setIsItalicActive(false);
      setIsUnderlineActive(false);
      return;
    }

    setIsBoldActive(document.queryCommandState("bold"));
    setIsItalicActive(document.queryCommandState("italic"));
    setIsUnderlineActive(document.queryCommandState("underline"));
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", updateFormatStates);
    return () => document.removeEventListener("selectionchange", updateFormatStates);
  }, [updateFormatStates]);

  const insertImage = useCallback((file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    exec(
      "insertHTML",
      `<figure><img src="${url}" alt="${file.name || "uploaded image"}" style="max-width:100%;height:auto;border-radius:8px;" /></figure><p><br></p>`
    );

    requestAnimationFrame(() => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();

      const selection = window.getSelection();
      if (!selection) return;

      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);

      setHasBodyContent(Boolean(editor.innerText?.trim()));
      setContentHtml(editor.innerHTML || "");
    });
  }, [exec]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (replacePending && selectedImageRef.current) {
      const url = URL.createObjectURL(file);
      selectedImageRef.current.src = url;
      selectedImageRef.current.removeAttribute("data-selected");
      selectedImageRef.current = null;
      setSelectedImageVisible(false);
      setReplacePending(false);
      e.target.value = null;
      return;
    }

    insertImage(file);

    requestAnimationFrame(() => {
      setContentHtml(editorRef.current?.innerHTML || "");
    });
    e.target.value = null;
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSubmitError("");

      const apiRoot = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const normalizedApiRoot = `${apiRoot}${apiRoot.endsWith("/api") ? "" : "/api"}`;

      // Edit page doesn't currently have access to authstore user/token.
      // uploadCoverToBackend accepts token optionally, so we'll send without token.
      const url = await uploadCoverToBackend({
        file,
        apiRoot: normalizedApiRoot,
        token: null,
      });

      setCoverImage(url);
    } catch (err) {
      setSubmitError(err?.message || "Failed to upload cover image");
    } finally {
      e.target.value = null;
    }
  };

  const selectImage = (img) => {
    if (!img) {
      selectedImageRef.current = null;
      setSelectedImageVisible(false);
      return;
    }

    selectedImageRef.current = img;
    setSelectedImageVisible(true);
    const rect = img.getBoundingClientRect();
    setOverlayPos({ top: rect.top + window.scrollY - 44, left: rect.left + window.scrollX });
  };

  const deleteImage = useCallback(() => {
    const img = selectedImageRef.current;
    if (!img) return;
    const figure = img.closest("figure");
    if (figure) figure.remove();
    else img.remove();
    selectedImageRef.current = null;
    setSelectedImageVisible(false);
    setHasBodyContent(Boolean(editorRef.current?.innerText?.trim()));
  }, []);

  const toggleHighlight = useCallback(() => {
    const img = selectedImageRef.current;
    if (!img) return;
    const isHighlighted = img.getAttribute("data-highlight") === "true";
    if (isHighlighted) {
      img.removeAttribute("data-highlight");
      img.style.outline = "";
      img.style.boxShadow = "";
    } else {
      img.setAttribute("data-highlight", "true");
      img.style.outline = "2px solid rgba(99,102,241,0.18)";
      img.style.boxShadow = "0 6px 18px rgba(15,23,42,0.04)";
    }

    setOverlayPos((pos) => ({ ...pos }));
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const onClick = (ev) => {
      const img = ev.target.closest && ev.target.closest("img");
      if (img && editor.contains(img)) {
        ev.preventDefault();
        selectImage(img);
      } else {
        selectedImageRef.current = null;
        setSelectedImageVisible(false);
      }
    };

    editor.addEventListener("click", onClick);

    const onKey = (ev) => {
      if (!selectedImageRef.current) return;
      if (ev.key === "Delete" || ev.key === "Backspace") {
        ev.preventDefault();
        deleteImage();
      }
    };

    window.addEventListener("keydown", onKey);

    return () => {
      editor.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [deleteImage]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (!isPreview) {
      if (contentHtml && editor.innerHTML !== contentHtml) {
        editor.innerHTML = contentHtml;
      }
    } else {
      setContentHtml(editor.innerHTML || "");
    }
  }, [isPreview, contentHtml]);

  useEffect(() => {
    let cancelled = false;

    const fetchPost = async () => {
      if (!slugParam) return;

      setIsLoading(true);

      try {
        const post = await blogAPI.getById(slugParam);
        const resolvedPost = post?.post || post;
        const resolvedId = resolvedPost?._id || resolvedPost?.id || slugParam;
        const resolvedSlug = resolvedPost?.slug || slugParam;
        const { tags: resolvedTags, bodyHtml } = splitContentAndTags(
          resolvedPost?.content || "",
          Array.isArray(resolvedPost?.tags) && resolvedPost.tags.length > 0 ? resolvedPost.tags : [""]
        );

        if (cancelled) return;

        setPostId(resolvedId);
        setPostSlug(resolvedSlug);
        setTitle(resolvedPost?.title || "");
        setSubtitle(resolvedPost?.excerpt || "");
        setTags(resolvedTags);
        setContentHtml(bodyHtml || "");
        setCoverImage(resolvedPost?.coverImage || null);
        setHasBodyContent(Boolean(bodyHtml?.trim()));
      } catch (error) {
        if (!cancelled) {
          setSubmitError(error?.message || "Failed to load post");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchPost();

    return () => {
      cancelled = true;
    };
  }, [slugParam]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (!isPreview && contentHtml && editor.innerHTML !== contentHtml) {
      editor.innerHTML = contentHtml;
    }
  }, [contentHtml, isPreview]);

  const addTag = () => {
    const t = newTag.trim();
    if (!t) return;
    setTags((current) => Array.from(new Set([...current.filter(Boolean), t])));
    setNewTag("");
  };

  const removeTag = (tag) => {
    if (isPreview) return;
    setTags((current) => current.filter((value) => value !== tag));
  };

  const handleSave = async () => {
    if (isSubmitting) return;

    if (!postId) {
      setSubmitError("Unable to determine which post to update.");
      return;
    }

    const contentHtmlVal = contentHtml ?? "";


    const tmp = document.createElement("div");
    tmp.innerHTML = contentHtmlVal;
    const rawText = tmp.innerText?.replace(/\u00A0/g, " ") ?? "";
    const contentText = rawText.trim();

    const isPlaceholderOnly =
      !contentText ||
      contentText.length < 20 ||
      false;


    const normalizedTitle = title.trim();
    const fallbackTitle = normalizedTitle || "Untitled";

    if (isPlaceholderOnly) {
      setSubmitError("Please add your post content before continuing.");
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);

    try {
      const payloadTitle = fallbackTitle;
      const payloadExcerpt = subtitle.trim() || contentText.slice(0, 180);
      // Prepend cover image HTML if provided so updates include the cover visually
      const coverHtml = coverImage
        ? `<figure><img src="${coverImage}" alt="cover" style="max-width:100%;height:auto;border-radius:8px;"/></figure><p><br></p>`
        : "";

      const payloadContent = [
        `<p><strong>Tags:</strong> ${tags.filter(Boolean).join(", ") || "none"}</p>`,
        coverHtml,
        contentHtmlVal,
      ].join("");

      await blogAPI.update(postId, payloadTitle, payloadContent, payloadExcerpt);

      if (postSlug) {
        router.push(`/blog/${postSlug}`);
        return;
      }

      router.push("/blog");
    } catch (error) {
      setSubmitError(error?.message || "Failed to continue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl bg-white px-8 py-16">
      <div className="w-full text-slate-800">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-orange-500">Edit Blog</h1>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPreview((current) => !current)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm"
            >
              <Icon name="preview" /> <span>{isPreview ? "Edit" : "Preview"}</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow"
            >
              <Icon name="continue" /> <span>{isSubmitting ? "Saving..." : "Update"}</span>
            </button>
          </div>
        </header>

        {submitError && <p className="mb-4 text-sm text-red-600">{submitError}</p>}



        <div className="w-full p-8">
          <div className="mb-4 flex items-center justify-between">
            <div />
            <div className="text-sm text-slate-500">Soft neutral palette · Minimal</div>
          </div>

          <div className="space-y-4">
            <div className="p-10">
              <div className="prose min-h-90 max-w-none" style={{ whiteSpace: "pre-wrap" }}>
                {/* Cover Image Upload */}
                <div
                  onClick={() => coverInputRef.current?.click()}
                  className="relative w-full h-48 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-400 bg-slate-50 flex items-center justify-center cursor-pointer group transition shrink-0 mb-6"
                >
                  {coverImage ? (
                    <img src={coverImage} alt="Cover" className="object-cover w-full h-full rounded-lg" />
                  ) : (
                    <div className="text-center text-slate-400">
                      <div className="text-3xl mb-2">📸</div>
                      <p className="text-sm">Click to upload cover image</p>
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

                {isPreview ? (
                  <>
                    <h1 className="mb-3 text-4xl font-bold">{title.trim() || "Title"}</h1>
                    <h3 className="mb-5 text-base text-slate-500">{subtitle.trim() || "Add a subtitle..."}</h3>
                  </>
                ) : (
                  <>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Title"
                      className="mb-3 w-full bg-transparent text-4xl font-bold outline-none placeholder:text-slate-400"
                    />
                    <input
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Add a subtitle..."
                      className="mb-5 w-full bg-transparent text-base text-slate-500 outline-none placeholder:text-slate-400"
                    />
                  </>
                )}

                <div className="mb-4 flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm">
                      {tag}
                      {!isPreview && (
                        <button onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`} className="text-xs text-slate-400">
                          ✕
                        </button>
                      )}
                    </span>
                  ))}
                  {!isPreview && (
                    <div className="inline-flex items-center gap-2">
                      <input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        placeholder="Add tag"
                        className="rounded border border-slate-200 px-2 py-1 text-sm"
                      />
                      <button onClick={addTag} className="rounded bg-slate-800 px-2 py-1 text-sm text-white">
                        Add
                      </button>
                    </div>
                  )}
                </div>

                <div className="relative min-h-45 text-slate-700">
                  <SimpleEditor
                    value={contentHtml}
                    onChange={(html) => setContentHtml(html || "")}
                  />
                </div>



                {selectedImageVisible && (
                  <div style={{ position: "fixed", top: overlayPos.top, left: overlayPos.left, zIndex: 60 }}>
                    <div className="inline-flex items-center gap-2 rounded bg-white p-2 shadow-md">
                      <button onClick={deleteImage} className="px-2 py-1 text-sm text-red-600">
                        Delete
                      </button>
                      <button
                        onClick={() => {
                          setReplacePending(true);
                          fileInputRef.current?.click();
                        }}
                        className="px-2 py-1 text-sm"
                      >
                        Replace
                      </button>
                      <button onClick={toggleHighlight} className="px-2 py-1 text-sm">
                        Highlight
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLoading && <p className="mt-4 text-center text-sm text-slate-500">Loading post...</p>}
    </main>
  );
}