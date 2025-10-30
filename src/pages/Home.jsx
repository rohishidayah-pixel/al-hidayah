// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import NewsCard from "../components/NewsCard";
import CommentList from "../components/CommentList";
import JadwalSholat from "../components/JadwalSholat";
import { db } from "../firebase/config";
import { ref, onValue, set } from "firebase/database";
import { motion } from "framer-motion";
import { BookOpen, Users, ClipboardList, MessageSquare, Sparkles } from "lucide-react";

export default function Home() {
  const [berita, setBerita] = useState([]);
  const [motivasi, setMotivasi] = useState(null);
  const [struktur, setStruktur] = useState([]);
  const [programKerja, setProgramKerja] = useState({});
  const periodeSekarang = new Date().getFullYear();

  // --- Ambil berita ---
  useEffect(() => {
    const r = ref(db, "activities");
    return onValue(r, (snap) => {
      const val = snap.val() || {};
      const arr = Object.keys(val).map((k) => ({ key: k, ...val[k] }));
      setBerita(arr.reverse());
    });
  }, []);

  // --- Ambil motivasi (aktif 7 hari) ---
  useEffect(() => {
    const r = ref(db, "motivasi");
    return onValue(r, (snap) => {
      const val = snap.val() || {};
      const allMotivasi = Object.keys(val)
        .map((k) => {
          const m = val[k];
          return {
            key: k,
            ...m,
            uploadedAt: m.date ? new Date(m.date) : new Date(k),
          };
        })
        .sort((a, b) => b.uploadedAt - a.uploadedAt);

      if (allMotivasi.length === 0) return setMotivasi(null);

      const now = new Date();
      const validMotivasi = allMotivasi.find((m) => {
        const expiry = new Date(m.uploadedAt);
        expiry.setDate(expiry.getDate() + 7);
        return now <= expiry;
      });

      setMotivasi(validMotivasi || null);
    });
  }, []);

  // --- Ambil struktur (dengan uploadedAt otomatis) ---
  useEffect(() => {
    const r = ref(db, "struktur");
    return onValue(r, (snap) => {
      const val = snap.val() || {};

      const arr = Object.keys(val).map((key) => {
        let item = typeof val[key] === "object" ? val[key] : { nama: val[key] };

        // Tambahkan uploadedAt otomatis jika belum ada
        if (!item.uploadedAt) {
          item.uploadedAt = Date.now();
          set(ref(db, `struktur/${key}/uploadedAt`), item.uploadedAt);
        }

        return {
          key,
          jabatan: key,
          nama: item.nama || "Belum diisi",
          uploadedAt: new Date(item.uploadedAt),
        };
      });

      // Urut dari yang di-upload pertama
      arr.sort((a, b) => a.uploadedAt - b.uploadedAt);
      setStruktur(arr);
    });
  }, []);

  // --- Ambil program kerja ---
  useEffect(() => {
    const r = ref(db, `programKerja/${periodeSekarang}`);
    return onValue(r, (snap) => setProgramKerja(snap.val() || {}));
  }, [periodeSekarang]);

  return (
    <main className="flex flex-col items-center bg-[#e6ebf0] dark:bg-gray-900 text-gray-800 dark:text-gray-100 px-4 py-6 min-h-screen max-w-md mx-auto space-y-10">

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center bg-gradient-to-r from-[#8aaee0] to-[#638ecb] text-white rounded-3xl shadow-xl w-full p-8">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="text-2xl font-extrabold drop-shadow-md leading-snug">
            Rohis Al-HIDAYAH <br /> SMAN 1 JETIS
          </h1>
          <p className="mt-3 text-sm opacity-90">
            Berlomba-lomba dalam kebaikan adalah tambahan dari perintah berbuat kebaikan itu sendiri.
          </p>
        </motion.div>
      </section>

      {/* Jadwal Sholat */}
      <JadwalSholat />

      {/* Motivasi Minggu Ini */}
      <motion.section
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="flex flex-col items-center text-center w-full"
      >
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#10b981] dark:text-emerald-400 mb-3">
          <Sparkles className="w-5 h-5" /> Motivasi Minggu Ini
        </h2>
        {motivasi ? (
          <blockquote className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow w-full">
            <p className="italic text-gray-900 dark:text-gray-100">“{motivasi.text}”</p>
            {motivasi.author && <footer className="mt-2 text-sm text-gray-700 dark:text-gray-400">― {motivasi.author}</footer>}
          </blockquote>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Belum ada motivasi minggu ini.</p>
        )}
      </motion.section>

      {/* Pengertian Rohis */}
      <motion.section id="pengertian" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5 text-center w-full">
        <h2 className="text-lg font-bold text-[#10b981] dark:text-emerald-400 mb-3">Apa itu Rohis?</h2>
        <p className="text-sm leading-relaxed">
          Rohis (Rohani Islam) adalah organisasi siswa yang bergerak di bidang keagamaan Islam di SMAN 1 JETIS. 
          Tujuannya untuk meningkatkan keimanan, mempererat ukhuwah Islamiyah, dan membina akhlak serta kepemimpinan generasi muda.
        </p>
      </motion.section>

      {/* Visi & Misi */}
      <motion.section id="visi" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }} className="flex flex-col gap-3 w-full">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow">
          <h3 className="font-semibold mb-1 text-[#10b981] dark:text-emerald-400">Visi</h3>
          <p className="text-sm">Menjadi generasi beriman, berilmu, dan berakhlak mulia.</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow">
          <h3 className="font-semibold mb-1 text-[#10b981] dark:text-emerald-400">Misi</h3>
          <ul className="list-disc list-inside text-sm space-y-1 text-left">
            <li>Meningkatkan pemahaman agama melalui kajian rutin.</li>
            <li>Mengadakan kegiatan sosial dan dakwah.</li>
            <li>Membina karakter dan kepemimpinan anggota.</li>
          </ul>
        </div>
      </motion.section>

      {/* Struktur Organisasi */}
      <motion.section id="struktur" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="w-full">
        <h2 className="flex items-center justify-center gap-2 text-lg font-bold mb-4 text-[#10b981] dark:text-emerald-400">
          <Users className="w-5 h-5" /> Struktur Organisasi
        </h2>
        {struktur.length === 0 ? (
          <p className="text-gray-500 text-center text-sm">Belum diisi.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {struktur.map((item) => (
              <div key={item.key} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow text-center">
                <h3 className="font-semibold text-[#10b981] dark:text-emerald-400 capitalize">{item.jabatan.replace(/[0-9]/g, " $&")}</h3>
                <p className="text-sm">{item.nama}</p>
              </div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Program Kerja */}
      <motion.section id="program" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="w-full">
        <h2 className="flex items-center justify-center gap-2 text-lg font-bold mb-4 text-[#10b981] dark:text-emerald-400">
          <ClipboardList className="w-5 h-5" /> Program Kerja ({periodeSekarang})
        </h2>
        {Object.keys(programKerja).length === 0 ? (
          <p className="text-gray-500 text-center text-sm">Belum diisi.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {Object.entries(programKerja).map(([sie, isi]) => (
              <div key={sie} className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow">
                <h3 className="font-bold text-[#10b981] dark:text-emerald-400 capitalize">Sie {sie}</h3>
                <p className="mt-1 text-sm">{isi || "Belum diisi"}</p>
              </div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Berita */}
      <motion.section id="berita" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.6 }} className="w-full">
        <h2 className="flex items-center gap-2 text-lg font-bold mb-4 text-[#10b981] dark:text-emerald-400">
          <BookOpen className="w-5 h-5" /> Berita & Kegiatan
        </h2>
        {berita.length === 0 ? (
          <p className="text-gray-500 text-center text-sm">Belum ada berita.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {berita.map((b) => (
              <NewsCard key={b.key} item={b} />
            ))}
          </div>
        )}
      </motion.section>

      {/* Komentar */}
      <motion.section id="komentar" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="w-full">
        <h2 className="flex items-center gap-2 text-lg font-bold mb-4 text-[#10b981] dark:text-emerald-400">
          <MessageSquare className="w-5 h-5" /> Komentar
        </h2>
        <CommentList />
      </motion.section>
    </main>
  );
}
