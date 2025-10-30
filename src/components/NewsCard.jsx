import React, { useState } from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";

/**
 * 🔹 Helper: convert Google Drive preview/share link → direct image link
 */
const formatImageUrl = (url) => {
  if (!url) return "";
  if (url.includes("drive.google.com")) {
    const match = url.match(/\/d\/([^/]+)\//);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }
  return url; // fallback: langsung pakai url original
};

export default function NewsCard({ item }) {
  const [expanded, setExpanded] = useState(false);

  const imgSrc = item?.image ? formatImageUrl(item.image) : "/logo.png";
  const dateText = item?.date
    ? new Date(item.date).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Tidak ada tanggal";

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ duration: 0.3 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-lg transition overflow-hidden flex flex-col"
    >
      {/* 🔹 Gambar */}
      {imgSrc && (
        <div className="relative">
          <img
            src={imgSrc}
            alt={item?.title || "Berita"}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/logo.png"; // fallback jika error
            }}
          />
        </div>
      )}

      {/* 🔹 Konten */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Judul */}
        <h3 className="font-bold text-lg text-emerald-700 dark:text-emerald-300 mb-2 line-clamp-2">
          {item?.title || "Tanpa Judul"}
        </h3>

        {/* Info tanggal */}
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-3 gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>{dateText}</span>
          <span className="mx-1">•</span>
          <span>Admin</span>
        </div>

        {/* Deskripsi */}
        <div className="text-gray-700 dark:text-gray-300 text-sm">
          <p
            className={`leading-relaxed transition-all ${
              expanded ? "max-h-[2000px]" : "line-clamp-3"
            }`}
          >
            {item?.description || "Tidak ada deskripsi."}
          </p>

          {/* Tombol selengkapnya */}
          {item?.description && item.description.length > 150 && (
            <button
              onClick={() => setExpanded((s) => !s)}
              className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-300 hover:underline"
            >
              {expanded ? "Tutup" : "Baca selengkapnya"}
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
