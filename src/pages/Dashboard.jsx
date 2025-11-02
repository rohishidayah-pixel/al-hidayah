// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import {
  ref,
  push,
  set,
  onValue,
  remove,
  get,
  query,
  orderByChild,
  equalTo,
} from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";

/**
 * Dashboard lengkap — 1 file.
 * - Tombol hapus berita otomatis menghapus komentar terkait (comments.activityId === activityId)
 * - Tombol hapus komentar menghapus satu komentar
 * - Responsive mobile, dark mode toggle
 *
 * Pastikan:
 * - Tailwind sudah terpasang
 * - ../firebase/config meng-export initialized Realtime DB instance `db`
 */

const formatImageUrl = (url) => {
  if (!url) return "";
  if (url.includes("drive.google.com")) {
    const match = url.match(/\/d\/([^/]+)\//);
    if (match && match[1]) return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  return url;
};

export default function Dashboard() {
  // ui
  const [darkMode, setDarkMode] = useState(false);
  const [tab, setTab] = useState("news"); // news,motivasi,struktur,program,manage
  const [loading, setLoading] = useState(false);

  // activities & preview
  const [activities, setActivities] = useState([]);
  const [previewError, setPreviewError] = useState(false);

  // comments (global list) and comment input not needed here
  const [comments, setComments] = useState([]);

  // motivasi
  const [motivasiText, setMotivasiText] = useState("");
  const [motivasiAuthor, setMotivasiAuthor] = useState("");
  const [latestMotivasi, setLatestMotivasi] = useState(null);
  const [motivasiActive, setMotivasiActive] = useState(false);

  // struktur
  const [struktur, setStruktur] = useState({});
  const [newJabatan, setNewJabatan] = useState("");

  // program
  const [periode, setPeriode] = useState(new Date().getFullYear());
  const [programKerja, setProgramKerja] = useState({});
  const [newSie, setNewSie] = useState("");

  // form inputs for activity
  const [aTitle, setATitle] = useState("");
  const [aDesc, setADesc] = useState("");
  const [aImage, setAImage] = useState("");

  useEffect(() => {
    // dark mode class on <html>
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // ---------- Firebase listeners ----------
  useEffect(() => {
    const unsubActivities = onValue(ref(db, "activities"), (snap) => {
      const val = snap.val() || {};
      // sort by date desc
      const arr = Object.keys(val)
        .map((k) => ({ key: k, ...val[k] }))
        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      setActivities(arr);
    });

    const unsubComments = onValue(ref(db, "comments"), (snap) => {
      const val = snap.val() || {};
      const arr = Object.keys(val)
        .map((k) => ({ key: k, ...val[k] }))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setComments(arr);
    });

    const unsubStruktur = onValue(ref(db, "struktur"), (snap) => {
      setStruktur(snap.val() || {});
    });

    const unsubProgram = onValue(ref(db, `programKerja/${periode}`), (snap) => {
      setProgramKerja(snap.val() || {});
    });

    const unsubMotivasi = onValue(ref(db, "motivasi"), (snap) => {
      const val = snap.val() || {};
      const all = Object.values(val)
        .map((m) => ({ ...m, uploadedAt: new Date(m.uploadedAt) }))
        .sort((a, b) => b.uploadedAt - a.uploadedAt);
      if (all.length === 0) {
        setLatestMotivasi(null);
        setMotivasiActive(false);
      } else {
        const latest = all[0];
        const expiry = new Date(latest.uploadedAt);
        expiry.setDate(expiry.getDate() + 7);
        if (new Date() <= expiry) {
          setLatestMotivasi(latest);
          setMotivasiActive(true);
        } else {
          setLatestMotivasi(null);
          setMotivasiActive(false);
        }
      }
    });

    return () => {
      unsubActivities();
      unsubComments();
      unsubStruktur();
      unsubProgram();
      unsubMotivasi();
    };
  }, [periode]);

  // ---------- Helpers ----------
  const resetActivityForm = () => {
    setATitle("");
    setADesc("");
    setAImage("");
    setPreviewError(false);
  };

  const getMotivationCountdown = () => {
    if (!latestMotivasi) return "";
    const expiry = new Date(latestMotivasi.uploadedAt);
    expiry.setDate(expiry.getDate() + 7);
    const diff = expiry - new Date();
    if (diff <= 0) return "0 hari 0 jam 0 menit";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${days} hari ${hours} jam ${minutes} menit`;
  };

  // ---------- Actions: create ----------
  const handleUploadActivity = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await push(ref(db, "activities"), {
        title: aTitle,
        description: aDesc,
        image: formatImageUrl(aImage),
        date: new Date().toISOString(),
      });
      resetActivityForm();
      setTab("manage"); // langsung ke manage agar bisa lihat
      alert("✅ Kegiatan berhasil diupload!");
    } catch (err) {
      console.error("upload activity error", err);
      alert("Gagal upload kegiatan.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadMotivasi = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const key = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      await set(ref(db, `motivasi/${key}`), {
        text: motivasiText,
        author: motivasiAuthor || "Anonim",
        uploadedAt: new Date().toISOString(),
      });
      setMotivasiText("");
      setMotivasiAuthor("");
      alert("✅ Motivasi berhasil disimpan (aktif 7 hari).");
      setTab("motivasi");
    } catch (err) {
      console.error("save motivasi", err);
      alert("Gagal simpan motivasi.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveStruktur = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // ensure setiap entry memiliki nama & uploadedAt
      const payload = {};
      Object.keys(struktur).forEach((k) => {
        payload[k] = {
          nama: struktur[k]?.nama || "",
          uploadedAt: struktur[k]?.uploadedAt || Date.now(),
        };
      });
      await set(ref(db, "struktur"), payload);
      alert("✅ Struktur tersimpan.");
      setTab("struktur");
    } catch (err) {
      console.error("save struktur", err);
      alert("Gagal menyimpan struktur.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddJabatan = () => {
    if (!newJabatan.trim()) return;
    const key = newJabatan.trim().replace(/\s+/g, "_").toLowerCase();
    setStruktur((p) => ({ ...p, [key]: { nama: "", uploadedAt: Date.now() } }));
    setNewJabatan("");
  };

  const handleSaveProgram = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await set(ref(db, `programKerja/${periode}`), programKerja || {});
      alert("✅ Program kerja tersimpan.");
      setTab("program");
    } catch (err) {
      console.error("save program", err);
      alert("Gagal menyimpan program kerja.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSie = () => {
    if (!newSie.trim()) return;
    const key = newSie.trim().replace(/\s+/g, "_").toLowerCase();
    setProgramKerja((p) => ({ ...p, [key]: "" }));
    setNewSie("");
  };

  // ---------- Actions: delete ----------
  // Hapus satu komentar
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Yakin ingin menghapus komentar ini?")) return;
    try {
      await remove(ref(db, `comments/${commentId}`));
      // UI akan update karena onValue listener
    } catch (err) {
      console.error("delete comment", err);
      alert("Gagal menghapus komentar.");
    }
  };

  // Hapus berita & komentar terkait
  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm("Yakin ingin menghapus berita ini dan semua komentarnya?")) return;
    setLoading(true);
    try {
      // 1) hapus activity
      await remove(ref(db, `activities/${activityId}`));

      // 2) query comments where activityId == activityId, lalu hapus semua yang match
      const q = query(ref(db, "comments"), orderByChild("activityId"), equalTo(activityId));
      const snap = await get(q);
      if (snap.exists()) {
        const val = snap.val();
        const keys = Object.keys(val);
        await Promise.all(keys.map((k) => remove(ref(db, `comments/${k}`))));
      }
      alert("✅ Berita dan komentar terkait berhasil dihapus.");
    } catch (err) {
      console.error("delete activity & comments", err);
      alert("Gagal menghapus berita atau komentarnya.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Render ----------
  return (
    <div className={`min-h-screen ${darkMode ? "dark bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-4 py-3 bg-green-600 dark:bg-green-800 text-white shadow">
        <div className="flex items-center gap-3">
          <div className="text-2xl">📊</div>
          <div>
            <div className="font-bold">Dashboard Admin</div>
            <div className="text-sm opacity-90">Kelola Berita, Motivasi, Struktur, Program, Komentar</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex text-sm opacity-90">{activities.length} berita • {comments.length} komentar</div>

          <button
            onClick={() => setDarkMode((d) => !d)}
            className="p-2 rounded-full hover:bg-green-700 dark:hover:bg-green-600 transition"
            aria-label="toggle dark"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 mt-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            ["news", "📰 Berita"],
            ["motivasi", "🌟 Motivasi"],
            ["struktur", "👥 Struktur"],
            ["program", "📋 Program Kerja"],
            ["manage", "💬 Kelola Komentar"],
          ].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`px-4 py-2 rounded-full text-sm md:text-base font-medium ${tab === k ? "bg-green-600 text-white" : "bg-white dark:bg-gray-800 dark:text-gray-200"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content container */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            {/* NEWS (upload + preview + list + delete) */}
            {tab === "news" && (
              <motion.div key="news" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <form onSubmit={handleUploadActivity} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow">
                  <h3 className="text-lg font-semibold mb-3">📢 Upload Berita / Kegiatan</h3>

                  <input value={aTitle} onChange={(e) => setATitle(e.target.value)} placeholder="Judul kegiatan" className="w-full p-2 rounded border mb-2 dark:bg-gray-900" required />
                  <textarea value={aDesc} onChange={(e) => setADesc(e.target.value)} placeholder="Deskripsi kegiatan" className="w-full p-2 rounded border mb-2 dark:bg-gray-900" rows={4} required />
                  <input value={aImage} onChange={(e) => { setAImage(e.target.value); setPreviewError(false); }} placeholder="Link gambar (imgbb / drive)" className="w-full p-2 rounded border mb-2 dark:bg-gray-900" />
                  {aImage && (
                    <div className="mb-2 rounded overflow-hidden border">
                      <img src={formatImageUrl(aImage)} alt="preview" className="w-full h-48 object-cover" onError={() => setPreviewError(true)} />
                      {previewError && <div className="p-2 text-sm text-red-500">❌ Preview gagal. Pastikan direct link atau link drive benar.</div>}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button type="submit" className="px-4 py-2 rounded bg-green-600 text-white">Upload</button>
                    <button type="button" onClick={resetActivityForm} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Reset</button>
                  </div>
                </form>

                {/* list berita */}
                <div className="mt-6 grid gap-4">
                  {activities.length === 0 ? (
                    <div className="text-center text-gray-500">Belum ada berita.</div>
                  ) : (
                    activities.map((a) => (
                      <div key={a.key} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow flex flex-col md:flex-row gap-4">
                        <div className="w-full md:w-40 h-28 rounded overflow-hidden border">
                          {a.image ? <img src={a.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-semibold">{a.title}</div>
                              <div className="text-xs text-gray-500">{a.date ? new Date(a.date).toLocaleString() : ""}</div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button onClick={() => { setTab("manage"); }} className="text-sm px-3 py-1 rounded bg-gray-100 dark:bg-gray-700">Lihat komentar</button>
                              <button onClick={() => handleDeleteActivity(a.key)} className="text-sm px-3 py-1 rounded bg-red-500 text-white">Hapus</button>
                            </div>
                          </div>

                          <p className="mt-2 text-gray-700 dark:text-gray-200">{a.description}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* MOTIVASI */}
            {tab === "motivasi" && (
              <motion.div key="motivasi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <form onSubmit={handleUploadMotivasi} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow">
                  <h3 className="text-lg font-semibold mb-3">🌟 Upload Motivasi (aktif 7 hari)</h3>
                  <textarea value={motivasiText} onChange={(e) => setMotivasiText(e.target.value)} placeholder="Tulis motivasi..." className="w-full p-2 rounded border mb-2 dark:bg-gray-900" rows={4} required />
                  <input value={motivasiAuthor} onChange={(e) => setMotivasiAuthor(e.target.value)} placeholder="Nama pengutip (opsional)" className="w-full p-2 rounded border mb-2 dark:bg-gray-900" />
                  <div className="flex gap-2">
                    <button className="px-4 py-2 rounded bg-green-600 text-white">Simpan</button>
                    <button type="button" onClick={() => { setMotivasiText(""); setMotivasiAuthor(""); }} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Reset</button>
                  </div>
                </form>

                {latestMotivasi && (
                  <div className="mt-4 p-4 rounded-2xl bg-green-50 dark:bg-green-900">
                    <div className="italic">“{latestMotivasi.text}”</div>
                    <div className="text-sm mt-2">— {latestMotivasi.author} • sisa {getMotivationCountdown()}</div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STRUKTUR */}
            {tab === "struktur" && (
              <motion.div key="struktur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <form onSubmit={handleSaveStruktur} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow space-y-3">
                  <h3 className="text-lg font-semibold">👥 Struktur Organisasi</h3>
                  {Object.entries(struktur).length === 0 && <div className="text-sm text-gray-500">Belum ada jabatan.</div>}
                  <div className="space-y-2">
                    {Object.entries(struktur)
                      .sort((a, b) => (a[1].uploadedAt || 0) - (b[1].uploadedAt || 0))
                      .map(([k, v]) => (
                        <div key={k} className="flex gap-2 items-center">
                          <div className="flex-1">
                            <div className="text-sm font-medium capitalize">{k.replace(/_/g, " ")}</div>
                            <input value={v.nama || ""} onChange={(e) => setStruktur((p) => ({ ...p, [k]: { ...v, nama: e.target.value } }))} className="w-full p-2 rounded border dark:bg-gray-900" />
                          </div>
                          <button type="button" onClick={() => { const c = { ...struktur }; delete c[k]; setStruktur(c); }} className="px-3 py-1 rounded bg-red-500 text-white">Hapus</button>
                        </div>
                      ))}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <input value={newJabatan} onChange={(e) => setNewJabatan(e.target.value)} placeholder="Tambah jabatan baru..." className="flex-1 p-2 rounded border dark:bg-gray-900" />
                    <button type="button" onClick={handleAddJabatan} className="px-4 py-2 rounded bg-green-600 text-white">➕</button>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button className="px-4 py-2 rounded bg-green-600 text-white">Simpan Struktur</button>
                    <button type="button" onClick={() => setTab("manage")} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Lihat komentar</button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* PROGRAM */}
            {tab === "program" && (
              <motion.div key="program" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <form onSubmit={handleSaveProgram} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow space-y-3">
                  <h3 className="text-lg font-semibold">📋 Program Kerja ({periode})</h3>
                  <div className="flex gap-2 items-center">
                    <label className="text-sm">Periode</label>
                    <input type="number" value={periode} onChange={(e) => setPeriode(Number(e.target.value))} className="p-2 rounded border dark:bg-gray-900 w-32" />
                  </div>

                  <div className="space-y-2">
                    {Object.entries(programKerja || {}).map(([k, v]) => (
                      <div key={k} className="p-2 rounded border dark:bg-gray-900">
                        <div className="flex justify-between items-center mb-1">
                          <div className="capitalize">{k.replace(/_/g, " ")}</div>
                          <button type="button" onClick={() => { const copy = { ...programKerja }; delete copy[k]; setProgramKerja(copy); }} className="text-red-500">Hapus</button>
                        </div>
                        <textarea value={v} onChange={(e) => setProgramKerja((p) => ({ ...p, [k]: e.target.value }))} className="w-full p-2 rounded" rows={3} />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input value={newSie} onChange={(e) => setNewSie(e.target.value)} placeholder="Nama sie baru..." className="flex-1 p-2 rounded border dark:bg-gray-900" />
                    <button type="button" onClick={handleAddSie} className="px-4 py-2 rounded bg-green-600 text-white">➕</button>
                  </div>

                  <div className="flex gap-2">
                    <button className="px-4 py-2 rounded bg-green-600 text-white">Simpan Program</button>
                    <button type="button" onClick={() => setTab("manage")} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700">Lihat komentar</button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* MANAGE COMMENTS (detail list + delete) */}
            {tab === "manage" && (
              <motion.div key="manage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow space-y-4">
                  <h3 className="text-lg font-semibold">💬 Kelola Komentar</h3>

                  {/* show comments grouped by activity optionally */}
                  {comments.length === 0 ? (
                    <div className="text-gray-500">Belum ada komentar.</div>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((c) => (
                        <div key={c.key} className="p-3 rounded border dark:bg-gray-900 flex flex-col md:flex-row md:justify-between gap-2">
                          <div>
                            <div className="font-medium">{c.name || "Anonim"}</div>
                            <div className="text-sm text-gray-500">{c.text}</div>
                            <div className="text-xs text-gray-400 mt-1">{c.activityId ? `Untuk berita: ${c.activityId}` : ""} {c.timestamp ? ` • ${new Date(c.timestamp).toLocaleString()}` : ""}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => handleDeleteComment(c.key)} className="px-3 py-1 rounded bg-red-500 text-white">Hapus</button>
                            {c.activityId && (
                              <button onClick={() => { /* jump to news tab and highlight */ setTab("news"); setTimeout(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, 200); }} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700">Lihat Berita</button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* small loading indicator */}
          {loading && <div className="mt-4 text-center text-sm">Memproses...</div>}
        </div>
      </div>

      <div className="h-24" />
    </div>
  );
}

// helper countdown function used inside component
function getMotivationCountdown() {
  // This function is used via reference in one place; component-level version exists earlier.
  return "";
}
