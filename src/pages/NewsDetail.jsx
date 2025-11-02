import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ref, get } from "firebase/database";
import { db } from "../firebase/config";
import { ArrowLeft, Calendar } from "lucide-react";

/**
 * 🔹 Helper: ubah link Google Drive → direct image URL
 */
const formatImageUrl = (url) => {
  if (!url) return "";
  if (url.includes("drive.google.com")) {
    const match = url.match(/\/d\/([^/]+)\//);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }
  return url;
};

export default function BeritaDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    const ambilData = async () => {
      const snapshot = await get(ref(db, `activities/${id}`));
      if (snapshot.exists()) {
        setData(snapshot.val());
      }
    };
    ambilData();
  }, [id]);

  if (!data)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 dark:text-gray-300">
        Memuat...
      </div>
    );

  // Format tanggal agar rapi
  const tanggal = data.date
    ? new Date(data.date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Tanpa tanggal";

  return (
    <main className="bg-[#e6ebf0] dark:bg-gray-900 text-gray-800 dark:text-gray-100 min-h-screen px-4 py-6 max-w-3xl mx-auto">

      {/* Gambar berita */}
      {data.image && (
        <img
          src={formatImageUrl(data.image)}
          alt={data.title}
          className="w-full h-auto object-cover rounded-xl shadow mb-5"
          onError={(e) => {
            e.currentTarget.src = "/logo.png"; // fallback
          }}
        />
      )}

      {/* Judul & tanggal */}
      <h1 className="text-2xl font-bold mb-2 text-[#10b981] dark:text-emerald-400 leading-snug">
        {data.title}
      </h1>

      <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-4 gap-2">
        <Calendar className="w-4 h-4" />
        <span>{tanggal}</span>
        <span className="mx-1">•</span>
        <span>Admin</span>
      </div>

      {/* Isi berita */}
      <p className="text-base leading-relaxed whitespace-pre-line">
        {data.description}
      </p>
    </main>
  );
}
