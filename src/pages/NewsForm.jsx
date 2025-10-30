import { useState } from "react";
import { db } from "../firebase/config";
import { ref, push } from "firebase/database";

export default function NewsForm() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      const newsRef = ref(db, "news");
      await push(newsRef, {
        title,
        content,
        date: new Date().toISOString(),
      });

      setTitle("");
      setContent("");
      alert("✅ Berita berhasil diupload!");
    } catch (error) {
      console.error("❌ Error upload berita:", error);
      alert("Gagal upload berita. Cek console.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold mb-6">Upload Berita</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Judul Berita"
          className="w-full border px-4 py-2 rounded-lg"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Isi Berita"
          className="w-full border px-4 py-2 rounded-lg h-40"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
        >
          Simpan
        </button>
      </form>
    </div>
  );
}
