"use client";

import React, { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";

export default function TipTapEditor({
  value,
  onChange,
  editable = true,
  placeholder = "Start writing your article...",
}) {
  const editor = useEditor({
    editable,
    extensions: [
      StarterKit.configure({
        // Keep code blocks off unless you want them
      }),
      Image,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
  });

  // Sync external value -> editor
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if ((value || "") !== current) {
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  if (!editor) {
    return (
      <div className="min-h-96 w-full rounded-xl border border-[#2a2740] bg-transparent text-base leading-relaxed text-[#f0eeff]" />
    );
  }

  return (
    <div className="relative">
      {!value && (
        <div className="absolute top-4 left-0 right-0 px-3 pointer-events-none text-[#9490b8] text-base leading-relaxed">
          {placeholder}
        </div>
      )}
      <div className="min-h-96 w-full rounded-xl border border-transparent bg-transparent text-base leading-relaxed text-[#f0eeff] outline-none focus:border-[#7c6ff7]/40 focus:bg-[#141420]/40">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

