import { useEffect, useState, useRef } from "react";
import { db } from "../firebase/config";
import { ref, onValue, push, update } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, UserCircle, Clock, ThumbsUp } from "lucide-react";

export default function CommentList() {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const bottomRef = useRef(null);

  // 🔹 Ambil komentar realtime
  useEffect(() => {
    const commentsRef = ref(db, "comments");
    return onValue(commentsRef, (snap) => {
      const val = snap.val() || {};
      const arr = Object.keys(val).map((k) => ({ id: k, ...val[k] }));

      // Urutkan lama → baru
      const sorted = arr.sort((a, b) => a.date - b.date);
      setComments(sorted);
    });
  }, []);

  // 🔹 Auto scroll ke bawah saat komentar baru
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments]);

  // 🔹 Kirim komentar baru
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (newComment.length > 100) {
      alert("⚠️ Komentar maksimal 100 karakter");
      return;
    }

    await push(ref(db, "comments"), {
      text: newComment.trim(),
      name: "Anonim",
      date: Date.now(),
      likes: 0,
    });

    setNewComment("");
  };

  // 🔹 Tombol Like
  const handleLike = async (id, currentLikes) => {
    await update(ref(db, `comments/${id}`), { likes: currentLikes + 1 });
  };

  return (
    <div className="mt-6 p-4 rounded-2xl bg-white shadow-md dark:bg-gray-800 max-w-sm mx-auto sm:max-w-md">
      <h3 className="font-bold text-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-3">
        <MessageSquare className="w-5 h-5" /> Komentar
      </h3>

      {/* daftar komentar */}
      <div
        className="max-h-72 overflow-y-auto pr-2 flex flex-col gap-3 mb-3
        scrollbar-thin scrollbar-thumb-emerald-300 scrollbar-track-gray-100 
        dark:scrollbar-track-gray-700 rounded-lg"
      >
        <AnimatePresence>
          {comments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-3">
              Belum ada komentar.
            </p>
          ) : (
            comments.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl shadow-sm text-sm sm:text-base"
              >
                {/* Nama user */}
                <div className="flex items-center gap-2 mb-1 text-gray-700 dark:text-gray-200">
                  <UserCircle className="w-4 h-4 text-emerald-600" />
                  <span className="font-medium text-xs sm:text-sm">{c.name || "Anonim"}</span>
                </div>

                {/* Isi komentar */}
                <p className="text-gray-800 dark:text-gray-100 break-words leading-relaxed text-xs sm:text-sm">
                  {c.text || "Komentar kosong"}
                </p>

                {/* Footer komentar */}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-gray-400 dark:text-gray-300">
                    <Clock className="w-3 h-3" />
                    {c.date
                      ? new Date(c.date).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "?"}
                  </div>

                  <button
                    onClick={() => handleLike(c.id, c.likes || 0)}
                    className="flex items-center gap-1 text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 active:scale-95 transition"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    {c.likes || 0}
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        <div ref={bottomRef}></div>
      </div>

      {/* form komentar */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 items-center bg-gray-50 dark:bg-gray-900 rounded-lg p-2 shadow-inner"
      >
        <input
          type="text"
          placeholder="Tulis komentar..."
          className="flex-grow px-3 py-2 rounded-lg text-xs sm:text-sm border border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-emerald-400 outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-white"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={100}
        />
        <button
          type="submit"
          className="px-3 py-2 sm:px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 active:scale-95 flex items-center gap-1 text-xs sm:text-sm whitespace-nowrap"
        >
          <Send className="w-4 h-4" /> Kirim
        </button>
      </form>
    </div>
  );
}
