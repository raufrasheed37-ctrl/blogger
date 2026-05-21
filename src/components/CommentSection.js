"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Heart,
  MessageCircle,
} from "lucide-react";
import useAuthStore from "@/store/authstore";
import { getClientAuthToken } from "@/store/authstore";
import { useAuthRedirect } from "@/utils/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_ROOT = `${API_BASE_URL}${API_BASE_URL.endsWith("/api") ? "" : "/api"}`;

function getAuthHeaders() {
  const token = getClientAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function updateNestedComment(comments, targetId, updater) {
  return comments.map((comment) => {

    if (comment._id === targetId) {
      return updater(comment);
    }

    if (comment.replies?.length) {
      return {
        ...comment,
        replies: updateNestedComment(
          comment.replies,
          targetId,
          updater
        ),
      };
    }

    return comment;
  });
}

function ReplyItem({
  reply,
  requireAuth,
  replyText,
  setReplyText,
  replyingTo,
  setReplyingTo,
  handleReply,
  setComments,
}) {

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111] p-4">

      <p className="font-semibold text-white">
        {reply.user?.name}
      </p>

      <p className="mt-2 text-sm text-zinc-300">
        {reply.text}
      </p>

      <div className="mt-4 flex items-center gap-5 text-sm text-zinc-500">

        <button
          onClick={async () => {

            if (!requireAuth()) return;

            try {

              const res = await fetch(
                `${API_ROOT}/comments/${reply._id}/like`,
                {
                  method: "PUT",
                  headers: {
                    ...getAuthHeaders(),
                  },
                }
              );

              const data = await res.json();

              setComments((prev) =>
                updateNestedComment(
                  prev,
                  reply._id,
                  (target) => ({
                    ...target,
                    likes: data.likes,
                  })
                )
              );

            } catch (err) {
              console.log(err);
            }
          }}
          className="flex items-center gap-2 transition hover:text-orange-400"
        >

          <Heart
            size={16}
            className="text-orange-400"
          />

          <span>
            {reply.likes || 0}
          </span>

        </button>

        <button
          onClick={() => {

            if (!requireAuth()) return;

            setReplyingTo(
              replyingTo === reply._id
                ? null
                : reply._id
            );
          }}
          className="transition hover:text-orange-400"
        >
          Reply
        </button>

      </div>

      {replyingTo === reply._id && (

        <div className="mt-4">

          <textarea
            value={replyText}
            onChange={(e) =>
              setReplyText(e.target.value)
            }
            placeholder="Write a reply..."
            rows={3}
            className="w-full rounded-2xl border border-white/10 bg-[#101010] p-3 text-sm text-white outline-none"
          />

          <div className="mt-3 flex justify-end">

            <button
              onClick={() =>
                handleReply(reply._id)
              }
              className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-black"
            >
              Reply
            </button>

          </div>

        </div>
      )}

        {Array.isArray(reply.replies) && reply.replies.length > 0 && (
  <>
    <div className="mt-3 text-xs text-orange-400">
      {reply.replies.length} repl
      {reply.replies.length > 1 ? "ies" : "y"}
    </div>

    <div className="mt-5 ml-6 space-y-4 border-l border-white/10 pl-5">
      {reply.replies.map((nestedReply) => (
        <ReplyItem
          key={nestedReply._id}
          reply={nestedReply}
          requireAuth={requireAuth}
          replyText={replyText}
          setReplyText={setReplyText}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          handleReply={handleReply}
          setComments={setComments}
        />
      ))}
    </div>
  </>
)} 

    </div>
  );
}

export default function CommentSection({
  postId,
  requireAuth: requireAuthProp, onCommentAdded,
  onCommentCountUpdated,
}) {
  const currentUser = useAuthStore((state) => state.user);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  

  // edit states
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      setFetching(true);


      const res = await fetch(`${API_ROOT}/comments/${postId}`, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      setComments(data);
      setHasLoadedOnce(true);
      
      // Notify parent of comments count
      if (onCommentCountUpdated && Array.isArray(data)) {
        onCommentCountUpdated(data.length);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setFetching(false);
    }
  }, [postId, onCommentCountUpdated]);

  useEffect(() => {
    if (postId) {
      Promise.resolve().then(() => fetchComments());
    }
  }, [postId, fetchComments]);

  // auth
  const { requireAuth: localRequireAuth } = useAuthRedirect();
  const requireAuth = requireAuthProp || localRequireAuth;

  // Create comment
  const handleComment = async () => {
    if (!requireAuth()) return;
    if (!commentText.trim()) return;

    try {
      setLoading(true);

      const res = await fetch(`${API_ROOT}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          text: commentText,
          postId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        console.log(errData);
       throw new Error(errData.message || "Failed to post");
      }
      const data = await res.json();

      const nextComments = [data, ...comments];
      setComments(nextComments);
      if (onCommentCountUpdated) {
        onCommentCountUpdated(nextComments.length);
      }
      setCommentText("");
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (parentCommentId) => {
  if (!requireAuth()) return;

  if (!replyText.trim()) return;

  try {

    console.log("Reply text:", replyText);
    console.log("Parent ID:", parentCommentId);

    const res = await fetch(`${API_ROOT}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        text: replyText,
        postId,
        parentComment: parentCommentId,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.log(err);
      throw new Error("Failed to reply");
    }

    setReplyText("");
    setReplyingTo(null);

    await fetchComments();


setExpandedReplies((prev) => ({
  ...prev,
  [parentCommentId]: true,
}));

setReplyingTo(null);
    
  } catch (err) {
    console.log(err);
  }
};

  // Delete comment
  const handleDelete = async (id) => {
    try {
      await fetch(`${API_ROOT}/comments/${id}`, {
        method: "DELETE",
        headers: {
          ...getAuthHeaders(),
        },
      });

      const nextComments = comments.filter((c) => c._id !== id);
      setComments(nextComments);
      if (onCommentCountUpdated) {
        onCommentCountUpdated(nextComments.length);
      }
    } catch (err) {
      console.log(err);
    }
  };

  // Start edit
  const handleEdit = (comment) => {
    setEditingId(comment._id);
    setEditText(comment.text);
  };

  // Save edit
  const handleSaveEdit = (id) => {
    if (!editText.trim()) return;

    fetch(`${API_ROOT}/comments/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ text: editText }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to update comment");
        return res.json();
      })
      .then((updated) => {
        setComments((prev) =>
          prev.map((c) =>
            c._id === id
              ? { ...c, text: updated?.text || editText }
              : c
          )
        );
        setEditingId(null);
        setEditText("");
      })
      .catch((err) => {
        console.log(err);
        setComments((prev) =>
          prev.map((c) =>
            c._id === id
              ? { ...c, text: editText }
              : c
          )
        );
        setEditingId(null);
        setEditText("");
      });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  return (
    <div className="mt-8 border-t border-white/10 pt-8">

      {/* INPUT */}
      <div className="rounded-[28px] border border-white/10 bg-[#151515] p-4">

        <textarea
          value={commentText}
          onChange={(e) =>
            setCommentText(e.target.value)
          }
          placeholder="Share your thoughts..."
          rows={4}
          disabled={loading}
          className="w-full resize-none bg-transparent text-[15px] leading-7 text-white outline-none placeholder:text-zinc-500"
        />

        <div className="mt-4 flex items-center justify-between">

          <p className="text-xs text-zinc-500">
            Join the discussion respectfully.
          </p>

          <button
            onClick={handleComment}
            disabled={loading}
            className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:opacity-50"
          >
            {loading ? "Posting..." : "Reply"}
          </button>

        </div>
      </div>

      {/* LOADING */}
      <div className="mt-5 relative min-h-[24px]">
      {fetching && !hasLoadedOnce && (
  <div className="mt-5 space-y-2">
    <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
    <div className="h-4 w-48 bg-zinc-800 rounded animate-pulse" />
  </div>
)}
</div>

      {/* COMMENTS */}
      <div className="mt-6 space-y-5">

        {!fetching && comments.length === 0 && (
          <p className="text-sm text-zinc-500">
            No comments yet
          </p>
        )}

        {comments.map((comment) => {
          const isCurrentUserComment = Boolean(
            currentUser && (
              (comment.user?._id && currentUser._id && comment.user._id === currentUser._id) ||
              (comment.user?.id && currentUser.id && comment.user.id === currentUser.id) ||
              (comment.user?.email && currentUser.email && comment.user.email === currentUser.email)
            )
          );

          return (
          <div
            key={comment._id}
            className="rounded-[28px] border border-white/10 bg-[#151515] p-5 transition hover:border-white/20"
          >

            <div className="flex items-start gap-4">

              {/* AVATAR */}
              {isCurrentUserComment ? (
                <Link href="/dashboard" className="h-11 w-11 shrink-0 rounded-full bg-linear-to-br from-orange-400 to-amber-500 hover:opacity-80 transition cursor-pointer" />
              ) : (
                <Link href={`/profile/${comment.user?._id || comment.user?.id || comment.user?.username || comment.user?.name?.toLowerCase() || "user"}`} className="h-11 w-11 shrink-0 rounded-full bg-linear-to-br from-orange-400 to-amber-500 hover:opacity-80 transition cursor-pointer" />
              )}

              {/* CONTENT */}
              <div className="flex-1">

                {editingId === comment._id ? (
                  <>
                    <input
                      autoFocus
                      value={editText}
                      onChange={(e) =>
                        setEditText(e.target.value)
                      }
                      className="w-full rounded-2xl border border-white/10 bg-[#101010] p-3 text-[15px] text-white outline-none"
                    />

                    <div className="mt-4 flex items-center gap-4 text-sm text-zinc-500">

                      <button
                        onClick={() =>
                          handleSaveEdit(comment._id)
                        }
                        className="rounded-full border border-white/10 px-3 py-1 transition hover:border-green-400 hover:text-green-400"
                      >
                        Save
                      </button>

                      <button
                        onClick={handleCancelEdit}
                        className="rounded-full border border-white/10 px-3 py-1 transition hover:text-white"
                      >
                        Cancel
                      </button>

                    </div>
                  </>
                ) : (
                  <>
                    {/* HEADER */}
                    <div className="flex flex-wrap items-center gap-2 text-sm">

                      {isCurrentUserComment ? (
                        <Link href="/dashboard" className="text-[15px] font-semibold text-white hover:text-[#a89cf7] transition">
                          {comment.user?.name || "User"}
                        </Link>
                      ) : (
                        <Link href={`/profile/${comment.user?._id || comment.user?.id || comment.user?.username || comment.user?.name?.toLowerCase() || "user"}`} className="text-[15px] font-semibold text-white hover:text-[#a89cf7] transition">
                          {comment.user?.name || "User"}
                        </Link>
                      )}

                      <span className="text-xs text-zinc-500">
                        {new Date(
                          comment.createdAt
                        ).toLocaleTimeString()}
                      </span>

                    </div>

                    {/* COMMENT */}
                    <p className="mt-3 text-[15px] leading-7 text-zinc-300">
                      {comment.text}
                    </p>

                    {/* ACTIONS */}
                    <div className="mt-4 flex items-center gap-5 text-sm text-zinc-500">

  <button
  onClick={async () => {
    if (!requireAuth()) return;

    try {
      const res = await fetch(
        `${API_ROOT}/comments/${comment._id}/like`,
        {
          method: "PUT",
          headers: {
            ...getAuthHeaders(),
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed");
      }

      const data = await res.json();

      setComments((prev) =>
        prev.map((c) =>
          c._id === comment._id
            ? {
                ...c,
                likes: data.likes,
              }
            : c
        )
      );
    } catch (err) {
      console.log(err);
    }
  }}
  className="transition hover:text-orange-400"
>
  <div className="flex items-center gap-2">
  <Heart
    size={16}
    className="text-orange-400"
  />

  <span>
    {comment.likes || 0}
  </span>
</div>
</button>

    <button
  onClick={() => {
    if (!requireAuth()) return;

    setReplyingTo(
      replyingTo === comment._id
        ? null
        : comment._id
    );
  }}
  className="transition hover:text-orange-400"
>
  Reply
</button>

    <button
  onClick={() => {
    if (comment.replyCount < 1) return;

    setExpandedReplies((prev) => ({
      ...prev,
      [comment._id]: !prev[comment._id],
    }));
  }}
  className="transition hover:text-orange-400"
>
  <div className="flex items-center gap-2">
  <MessageCircle
    size={16}
    className="text-orange-400"
  />

  <span>
    {comment.replyCount || 0} replies
  </span>
</div>
</button>

  {isCurrentUserComment && (
  <>
    <button
      onClick={() =>
        handleEdit(comment)
      }
      className="transition hover:text-white"
    >
      Edit
    </button>

    <button
      onClick={() =>
        handleDelete(comment._id)
      }
      className="transition hover:text-red-400"
    >
      Delete
    </button>
  </>
)}

</div>

    {replyingTo === comment._id && (
  <div className="mt-4">

    <textarea
      value={replyText}
      onChange={(e) =>
        setReplyText(e.target.value)
      }
      placeholder="Write a reply..."
      rows={3}
      className="w-full rounded-2xl border border-white/10 bg-[#101010] p-3 text-sm text-white outline-none"
    />

    <div className="mt-3 flex justify-end">
      <button
  onClick={() =>
    handleReply(comment._id)
  }
  className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-black"
>
  Reply
</button>
    </div>

  </div>
)}

      {expandedReplies[comment._id] && (
  <div className="mt-5 ml-10 space-y-4 border-l border-white/10 pl-5">

    {comment.replies?.map((reply) => (

  <ReplyItem
    key={reply._id}
    reply={reply}
    requireAuth={requireAuth}
    replyText={replyText}
    setReplyText={setReplyText}
    replyingTo={replyingTo}
    setReplyingTo={setReplyingTo}
    handleReply={handleReply}
    setComments={setComments}
  />

))}

  </div>
)}
  
        </>
                )}
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
