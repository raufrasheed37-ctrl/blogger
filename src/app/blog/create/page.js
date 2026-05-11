"use client";

import { useState } from "react";
import { useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authAPI, blogAPI } from "@/utils/api";
import useAuthStore, { getClientAuthToken } from "@/store/authstore";

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

export default function CreatePostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [tags, setTags] = useState([""]);
  const [newTag, setNewTag] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [hasBodyContent, setHasBodyContent] = useState(false);
  const [contentHtml, setContentHtml] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const hydrate = useAuthStore((s) => s.hydrate);
  const setUser = useAuthStore((s) => s.setUser);
  const [isBoldActive, setIsBoldActive] = useState(false);
  const [isItalicActive, setIsItalicActive] = useState(false);
  const [isUnderlineActive, setIsUnderlineActive] = useState(false);
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
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

    // Use legacy command state to detect active formatting
    setIsBoldActive(document.queryCommandState("bold"));
    setIsItalicActive(document.queryCommandState("italic"));
    setIsUnderlineActive(document.queryCommandState("underline"));
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", updateFormatStates);
    return () => document.removeEventListener("selectionchange", updateFormatStates);
  }, [updateFormatStates]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    let cancelled = false;

    if (!token || user) {
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const me = await authAPI.getMe();
        const resolvedUser = me?.user || me;
        if (!cancelled && resolvedUser?._id) {
          setUser(resolvedUser);
        }
      } catch (error) {
        // Keep create flow token-based even if profile fetch fails.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, user, setUser]);

  const insertImage = useCallback((file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    exec(
      "insertHTML",
      `<figure><img src="${url}" alt="${file.name || "uploaded image"}" style="max-width:100%;height:auto;border-radius:8px;" /></figure><p><br></p>`
    );

    // Move caret after the inserted image so typing continues below it.
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

  // Replace image or insert depending on replacePending
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

      if (replacePending && selectedImageRef.current) {
        const url = URL.createObjectURL(file);
        // replace the selected image src
        selectedImageRef.current.src = url;
        // remove any highlight selection on replace
        selectedImageRef.current.removeAttribute("data-selected");
        selectedImageRef.current = null;
        setSelectedImageVisible(false);
        setReplacePending(false);
        e.target.value = null;
        return;
      }

    insertImage(file);
    
    // update stored content
    requestAnimationFrame(() => {
      setContentHtml(editorRef.current?.innerHTML || "");
    });
    e.target.value = null;
  };

  // select image element and position overlay
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
    const is = img.getAttribute("data-highlight") === "true";
    if (is) {
      img.removeAttribute("data-highlight");
      img.style.outline = "";
      img.style.boxShadow = "";
    } else {
      img.setAttribute("data-highlight", "true");
      img.style.outline = "2px solid rgba(99,102,241,0.18)"; // faint indigo
      img.style.boxShadow = "0 6px 18px rgba(15,23,42,0.04)";
    }
    // keep selection
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
        // clicking outside image clears selection
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

  // Sync stored content into editor when switching from preview to edit or on mount
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (!isPreview) {
      // restore saved HTML into the editor
      if (contentHtml && editor.innerHTML !== contentHtml) {
        editor.innerHTML = contentHtml;
      }
    } else {
      // when entering preview, capture current editor HTML
      setContentHtml(editor.innerHTML || "");
    }
  }, [isPreview, contentHtml]);


  const addTag = () => {
    const t = newTag.trim();
    if (!t) return;
    setTags((s) => Array.from(new Set([...s, t])));
    setNewTag("");
  };

  const removeTag = (t) => {
    if (isPreview) return;
    setTags((s) => s.filter((x) => x !== t));
  };

  const handleSave = async () => {
    if (isSubmitting) return;

    const authToken = token || getClientAuthToken();
    if (!authToken) {
      setSubmitError("Please log in to create a post.");
      return;
    }

    // Always use the current editor DOM as the source of truth
    const editorEl = editorRef.current;
    const contentHtmlVal = editorEl?.innerHTML ?? contentHtml ?? "";

    // Convert editor HTML -> plain text for validation/excerpt
    const tmp = document.createElement("div");
    tmp.innerHTML = contentHtmlVal;
    const rawText = tmp.innerText?.replace(/\u00A0/g, " ") ?? "";
    let contentText = rawText.trim();

    // If user never wrote anything, contentText may include placeholder text.
    // Treat placeholder-ish content as empty.
    const isPlaceholderOnly =
      !contentText ||
      contentText.length < 20 ||
      /start writing\.+/i.test(contentText) ||
      /^start writing\.*$/i.test(contentText);

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
    // Ensure we only submit real editor content (typed by the user)
    // Use the same sanitized HTML we validated above.
    const payloadContent = [
      `<p><strong>Tags:</strong> ${tags.join(", ") || "none"}</p>`,
      contentHtmlVal,
    ].join("");

      const created = await blogAPI.create(payloadTitle, payloadContent, payloadExcerpt, user?._id);
      const nextSlug = created?.slug || created?._id || created?.id;

      if (nextSlug) {
        router.push(`/blog/${nextSlug}`);
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
    <main className="mx-auto max-w-7xl px-8 py-16 w-full min-h-screen bg-white">
      <div className="w-full text-slate-800">
        <header className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-orange-500">Create Blog</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPreview((s) => !s)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm"
            >
              <Icon name="preview" /> <span>{isPreview ? "Edit" : "Preview"}</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow"
            >
              <Icon name="continue" /> <span>{isSubmitting ? "Saving..." : "Continue"}</span>
            </button>
          </div>
        </header>

        {submitError && <p className="mb-4 text-sm text-red-600">{submitError}</p>}

        {/* Toolbar */}
        {!isPreview && (
          <div className="mb-6 flex items-center gap-3 p-3">
              <div className="flex gap-2">
              <button
                onClick={() => { exec("bold"); requestAnimationFrame(updateFormatStates); }}
                className={`rounded px-2 py-1 ${isBoldActive ? "bg-slate-800 text-white" : "hover:bg-slate-100"}`}
                aria-pressed={isBoldActive}
              >
                <Icon name="bold" />
              </button>
              <button
                onClick={() => { exec("italic"); requestAnimationFrame(updateFormatStates); }}
                className={`rounded px-2 py-1 ${isItalicActive ? "bg-slate-800 text-white" : "hover:bg-slate-100"}`}
                aria-pressed={isItalicActive}
              >
                <Icon name="italic" />
              </button>
              <button
                onClick={() => { exec("underline"); requestAnimationFrame(updateFormatStates); }}
                className={`rounded px-2 py-1 ${isUnderlineActive ? "bg-slate-800 text-white" : "hover:bg-slate-100"}`}
                aria-pressed={isUnderlineActive}
              >
                <Icon name="underline" />
              </button>

              <button
                onClick={() => {
                  const url = prompt("Insert link URL");
                  if (url) exec("createLink", url);
                }}
                className="rounded px-2 py-1 hover:bg-slate-100"
              >
                <Icon name="link" />
              </button>

              <button onClick={() => fileInputRef.current?.click()} className="rounded px-2 py-1 hover:bg-slate-100">
                <Icon name="image" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>

            <div className="ml-auto flex gap-2">
              <button onClick={() => exec("justifyLeft")} className="rounded px-2 py-1 hover:bg-slate-100">
                <Icon name="left" />
              </button>
              <button onClick={() => exec("justifyCenter")} className="rounded px-2 py-1 hover:bg-slate-100">
                <Icon name="center" />
              </button>
              <button onClick={() => exec("justifyRight")} className="rounded px-2 py-1 hover:bg-slate-100">
                <Icon name="right" />
              </button>
            </div>
          </div>
        )}

        {/* Editable template */}
        <div className="w-full p-8">
          <div className="mb-4 flex items-center justify-between">
            <div />
            <div className="text-sm text-slate-500">Soft neutral palette · Minimal</div>
          </div>

          <div className="space-y-4">
            {/* header removed */}

            <div className="p-10">
              <div className="prose max-w-none min-h-90" style={{ whiteSpace: "pre-wrap" }}>
                {isPreview ? (
                  <>
                    <h1 className="text-4xl font-bold mb-3">{title.trim() || "Title"}</h1>
                    <h3 className="text-base text-slate-500 mb-5">{subtitle.trim() || "Add a subtitle..."}</h3>
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

                {/* Tags */}
                <div className="mb-4 flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span key={t} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm">
                      {t}
                      {!isPreview && (
                        <button onClick={() => removeTag(t)} aria-label={`Remove ${t}`} className="text-xs text-slate-400">✕</button>
                      )}
                    </span>
                  ))}
                  {!isPreview && (
                    <div className="inline-flex items-center gap-2">
                      <input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} placeholder="Add tag" className="rounded px-2 py-1 border border-slate-200 text-sm" />
                      <button onClick={addTag} className="rounded bg-slate-800 px-2 py-1 text-sm text-white">Add</button>
                    </div>
                  )}
                </div>

                <div className="relative min-h-45 text-slate-700">{/* main content area */}
                  {!isPreview && !hasBodyContent && (
                    <p className="pointer-events-none absolute left-0 top-0 text-base text-slate-400">Start writing...</p>
                  )}
                  <div
                    ref={editorRef}
                    contentEditable={!isPreview}
                    suppressContentEditableWarning
                    onInput={(e) => {
                      setHasBodyContent(Boolean(e.currentTarget.textContent?.trim()));
                      setContentHtml(e.currentTarget.innerHTML || "");
                      requestAnimationFrame(updateFormatStates);
                    }}
                    className="min-h-45 outline-none"
                  />
                </div>
                {selectedImageVisible && (
                  <div style={{ position: "fixed", top: overlayPos.top, left: overlayPos.left, zIndex: 60 }}>
                    <div className="inline-flex items-center gap-2 rounded bg-white p-2 shadow-md">
                      <button onClick={deleteImage} className="text-sm text-red-600 px-2 py-1">Delete</button>
                      <button onClick={() => { setReplacePending(true); fileInputRef.current?.click(); }} className="text-sm px-2 py-1">Replace</button>
                      <button onClick={toggleHighlight} className="text-sm px-2 py-1">Highlight</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
