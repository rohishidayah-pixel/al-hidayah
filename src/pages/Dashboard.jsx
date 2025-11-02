// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { ref, push, set, onValue, remove } from "firebase/database";
import { motion } from "framer-motion";

/**
 * Dashboard lengkap + theme switcher (hijau, biru, dark).
 * Paste ke src/pages/Dashboard.jsx
 *
 * Pastikan Tailwind sudah terpasang.
 */

/* Helper convert Google Drive link → direct link */
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

/* Theme config: tiap tema punya kelas header, btn, card, accent */
const THEMES = {
  green: {
    name: "Hijau Islami",
    header: "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white",
    btnPrimary: "bg-emerald-500 hover:bg-emerald-600 text-white",
    btnAccent: "bg-emerald-100 text-emerald-800",
    card: "bg-emerald-50/60",
    accentText: "text-emerald-600",
  },
  blue: {
    name: "Biru Lembut",
    header: "bg-gradient-to-r from-sky-600 to-blue-500 text-white",
    btnPrimary: "bg-blue-500 hover:bg-blue-600 text-white",
    btnAccent: "bg-blue-50 text-blue-800",
    card: "bg-blue-50/60",
    accentText: "text-blue-600",
  },
  dark: {
    name: "Dark Elegan",
    header: "bg-gradient-to-r from-gray-800 to-gray-700 text-white",
    btnPrimary: "bg-gray-700 hover:bg-gray-600 text-white",
    btnAccent: "bg-gray-800 text-gray-100",
    card: "bg-gray-800/70",
    accentText: "text-gray-300",
  },
};

export default function Dashboard() {
  // UI tab selection
  const [selected, setSelected] = useState(null); // 'activity','motivation','struktur','program','manage'
  const [loading, setLoading] = useState(false);

  // ----- Activity / Berita -----
  const [activity, setActivity] = useState("");
  const [activityDesc, setActivityDesc] = useState("");
  const [activityImage, setActivityImage] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [activities, setActivities] = useState([]);

  // ----- Comments -----
  const [comments, setComments] = useState([]);

  // ----- Motivasi -----
  const [motivation, setMotivation] = useState("");
  const [author, setAuthor] = useState("");
  const [latestMotivation, setLatestMotivation] = useState(null);
  const [motivationActive, setMotivationActive] = useState(false);

  // ----- Struktur organisasi (format baru) -----
  const [struktur, setStruktur] = useState({});
  const [newJabatan, setNewJabatan] = useState("");

  // ----- Program Kerja -----
  const currentYear = new Date().getFullYear();
  const [periode, setPeriode] = useState(currentYear);
  const [programKerja, setProgramKerja] = useState({});
  const [newSie, setNewSie] = useState("");

  // ----- Theme -----
  const [themeKey, setThemeKey] = useState("green");
  const theme = THEMES[themeKey];

  // ================================
  // Firebase listeners (mount)
  // ================================
  useEffect(() => {
    // activities
    const unsubActivities = onValue(ref(db, "activities"), (snap) => {
      const val = snap.val() || {};
      setActivities(
        Object.keys(val)
          .map((k) => ({ key: k, ...val[k] }))
          .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      );
    });
    // comments
    const unsubComments = onValue(ref(db, "comments"), (snap) => {
      const val = snap.val() || {};
      setComments(
        Object.keys(val)
          .map((k) => ({ key: k, ...val[k] }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      );
    });
    // struktur
    const unsubStruktur = onValue(ref(db, "struktur"), (snap) => {
      if (snap.exists()) setStruktur(snap.val());
      else setStruktur({});
    });
    // motivasi
    const unsubMotivasi = onValue(ref(db, "motivasi"), (snap) => {
      const val = snap.val() || {};
      const all = Object.values(val)
        .map((m) => ({ ...m, uploadedAt: new Date(m.uploadedAt) }))
        .sort((a, b) => b.uploadedAt - a.uploadedAt);
      if (all.length === 0) {
        setLatestMotivation(null);
        setMotivationActive(false);
      } else {
        const latest = all[0];
        const expiry = new Date(latest.uploadedAt);
        expiry.setDate(expiry.getDate() + 7);
        if (new Date() <= expiry) {
          setLatestMotivation(latest);
          setMotivationActive(true);
        } else {
          setLatestMotivation(null);
          setMotivationActive(false);
        }
      }
    });
    // programKerja for current periode (initial)
    const unsubProgram = onValue(ref(db, `programKerja/${periode}`), (snap) => {
      if (snap.exists()) setProgramKerja(snap.val());
      else setProgramKerja({});
    });

    // cleanup
    return () => {
      unsubActivities();
      unsubComments();
      unsubStruktur();
      unsubMotivasi();
      unsubProgram();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mounted once

  // Program listener react to periode change
  useEffect(() => {
    const unsub = onValue(ref(db, `programKerja/${periode}`), (snap) => {
      if (snap.exists()) setProgramKerja(snap.val());
      else setProgramKerja({});
    });
    return () => unsub();
  }, [periode]);

  // -----------------------------
  // Helpers / Actions
  // -----------------------------
  // ACTIVITY submit
  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await push(ref(db, "activities"), {
        title: activity,
        description: activityDesc,
        image: formatImageUrl(activityImage),
        date: new Date().toISOString(),
      });
      setActivity("");
      setActivityDesc("");
      setActivityImage("");
      setPreviewError(false);
      alert("✅ Kegiatan berhasil diupload!");
      setSelected(null);
    } catch (err) {
      console.error("Error upload activity:", err);
      alert("Gagal upload kegiatan.");
    } finally {
      setLoading(false);
    }
  };

  // MOTIVATION submit
  const handleMotivationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const todayKey = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      await set(ref(db, `motivasi/${todayKey}`), {
        text: motivation,
        author: author || "Anonim",
        uploadedAt: new Date().toISOString(),
      });
      setMotivation("");
      setAuthor("");
      alert("✅ Motivasi berhasil diupload dan aktif selama 7 hari!");
      setSelected(null);
    } catch (err) {
      console.error("Error save motivasi:", err);
      alert("Gagal simpan motivasi.");
    } finally {
      setLoading(false);
    }
  };

  // STRUKTUR actions
  const handleStrukturSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSave = {};
      Object.keys(struktur).forEach((k) => {
        const item = struktur[k];
        dataToSave[k] = {
          nama: item?.nama || "",
          uploadedAt: item?.uploadedAt || Date.now(),
        };
      });
      await set(ref(db, "struktur"), dataToSave);
      alert("✅ Struktur organisasi berhasil diperbarui!");
      setSelected(null);
    } catch (err) {
      console.error("Error save struktur:", err);
      alert("Gagal menyimpan struktur.");
    }
  };

  const handleAddJabatan = () => {
    if (!newJabatan.trim()) return;
    const key = newJabatan.trim().replace(/\s+/g, "_").toLowerCase();
    setStruktur((prev) => ({
      ...prev,
      [key]: { nama: "", uploadedAt: Date.now() },
    }));
    setNewJabatan("");
  };

  const handleDeleteJabatan = (jabatanKey) => {
    if (!window.confirm(`Hapus jabatan ${jabatanKey.replace(/_/g, " ")}?`)) return;
    setStruktur((prev) => {
      const copy = { ...prev };
      delete copy[jabatanKey];
      return copy;
    });
  };

  const handleChangeNama = (jabatanKey, value) => {
    setStruktur((prev) => ({
      ...prev,
      [jabatanKey]: { ...prev[jabatanKey], nama: value },
    }));
  };

  // PROGRAM kerja submit
  const handleProgramKerjaSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await set(ref(db, `programKerja/${periode}`), programKerja || {});
      alert("✅ Program kerja berhasil diperbarui!");
      setSelected(null);
    } catch (err) {
      console.error("Error save program kerja:", err);
      alert("Gagal menyimpan program kerja.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSie = () => {
    if (!newSie.trim()) return;
    const key = newSie.trim().replace(/\s+/g, "_").toLowerCase();
    setProgramKerja((prev) => ({ ...prev, [key]: "" }));
    setNewSie("");
  };

  // DELETE activity / comment
  const handleDeleteActivity = async (id) => {
    if (!window.confirm("Yakin ingin menghapus berita ini?")) return;
    try {
      await remove(ref(db, `activities/${id}`));
    } catch (err) {
      console.error("Delete activity failed:", err);
      alert("Gagal menghapus berita.");
    }
  };

  const handleDeleteComment = async (id) => {
    if (!window.confirm("Yakin ingin menghapus komentar ini?")) return;
    try {
      await remove(ref(db, `comments/${id}`));
    } catch (err) {
      console.error("Delete comment failed:", err);
      alert("Gagal menghapus komentar.");
    }
  };

  // Countdown motivasi
  const getMotivationCountdown = () => {
    if (!latestMotivation) return "";
    const expiry = new Date(latestMotivation.uploadedAt);
    expiry.setDate(expiry.getDate() + 7);
    const diff = expiry - new Date();
    if (diff <= 0) return "0 hari 0 jam 0 menit";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${days} hari ${hours} jam ${minutes} menit`;
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="min-h-screen p-6" style={{ background: themeKey === "dark" ? "#0b0f13" : "" }}>
      {/* Header */}
      <header className={`rounded-2xl p-6 mb-6 shadow-lg ${theme.header}`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold">📊 Dashboard Admin</h1>
            <p className="mt-1 opacity-80">Kelola berita, motivasi, struktur, program kerja, dan komentar.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme chooser */}
            <div className="text-sm mr-2 hidden md:block">Tema:</div>
            <div className="flex gap-2">
              {Object.keys(THEMES).map((k) => (
                <button
                  key={k}
                  onClick={() => setThemeKey(k)}
                  className={`px-3 py-1 rounded-2xl border ${themeKey === k ? "ring-2 ring-offset-2" : "opacity-70"} ${k === "green" ? "bg-emerald-50 text-emerald-700" : k === "blue" ? "bg-blue-50 text-blue-700" : "bg-gray-900 text-gray-100"}`}
                >
                  {THEMES[k].name}
                </button>
              ))}
            </div>

            {/* quick status */}
            <div className="ml-3 text-sm text-white/90 p-2 rounded" style={{ background: "rgba(255,255,255,0.08)" }}>
              {activities.length} berita • {comments.length} komentar
            </div>
          </div>
        </div>
      </header>

      {/* Menu Tab */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <button
            onClick={() => setSelected("activity")}
            className={`p-4 rounded-2xl shadow-lg text-left ${selected === "activity" ? theme.btnPrimary : "bg-white dark:bg-gray-800"}`}
          >
            📌 <div className="font-semibold mt-1">Upload Kegiatan</div>
          </button>

          <button
            onClick={() => { if (!motivationActive) setSelected("motivation"); }}
            disabled={motivationActive}
            className={`p-4 rounded-2xl shadow-lg text-left ${selected === "motivation" ? theme.btnPrimary : "bg-white dark:bg-gray-800"} ${motivationActive ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            🌟 <div className="font-semibold mt-1">Upload Motivasi</div>
            {motivationActive && <div className="text-xs mt-1">{getMotivationCountdown()} tersisa</div>}
          </button>

          <button
            onClick={() => setSelected("struktur")}
            className={`p-4 rounded-2xl shadow-lg text-left ${selected === "struktur" ? theme.btnPrimary : "bg-white dark:bg-gray-800"}`}
          >
            👥 <div className="font-semibold mt-1">Struktur Organisasi</div>
          </button>

          <button
            onClick={() => setSelected("program")}
            className={`p-4 rounded-2xl shadow-lg text-left ${selected === "program" ? theme.btnPrimary : "bg-white dark:bg-gray-800"}`}
          >
            📋 <div className="font-semibold mt-1">Program Kerja</div>
          </button>

          <button
            onClick={() => setSelected("manage")}
            className={`p-4 rounded-2xl shadow-lg text-left ${selected === "manage" ? theme.btnPrimary : "bg-white dark:bg-gray-800"}`}
          >
            📰 <div className="font-semibold mt-1">Berita & Komentar</div>
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 rounded-2xl shadow-xl" style={{ background: theme.card }}>
          {loading && (
            <div className="mb-4 p-3 text-center rounded" style={{ background: "rgba(0,0,0,0.06)" }}>
              ⏳ Sedang memproses...
            </div>
          )}

          {/* Upload Kegiatan */}
          {selected === "activity" && (
            <form onSubmit={handleActivitySubmit} className="space-y-4">
              <h2 className={`text-2xl font-bold ${theme.accentText}`}>📌 Upload Kegiatan</h2>

              <input value={activity} onChange={(e) => setActivity(e.target.value)} required placeholder="Judul kegiatan" className="w-full px-4 py-3 rounded-xl border" />

              <textarea value={activityDesc} onChange={(e) => setActivityDesc(e.target.value)} required placeholder="Deskripsi kegiatan" className="w-full px-4 py-3 rounded-xl h-32 border" />

              <div className={`p-3 rounded-lg ${theme.btnAccent}`}>
                <p className="font-semibold">Cara dapat link foto (imgbb):</p>
                <ol className="list-decimal list-inside text-sm mt-1">
                  <li>Buka imgbb.com → upload → Copy Direct Link</li>
                  <li>Tempel ke input link foto</li>
                </ol>
              </div>

              <input value={activityImage} onChange={(e) => { setActivityImage(e.target.value); setPreviewError(false); }} placeholder="Link foto (direct link atau drive)" className="w-full px-4 py-3 rounded-xl border" />

              {activityImage && (
                <div className="mt-2 rounded overflow-hidden border">
                  <img src={formatImageUrl(activityImage)} alt="preview" className="w-full h-56 object-cover" onError={() => setPreviewError(true)} />
                  {previewError && <p className="text-red-500 text-sm p-2">❌ Link tidak valid. Pastikan direct link.</p>}
                </div>
              )}

              <div className="flex gap-3 mt-3">
                <button className={`px-6 py-2 rounded-xl ${theme.btnPrimary}`}>Simpan</button>
                <button type="button" onClick={() => setSelected(null)} className="px-6 py-2 rounded-xl bg-white border">⬅ Kembali</button>
              </div>
            </form>
          )}

          {/* Upload Motivasi */}
          {selected === "motivation" && (
            <form onSubmit={handleMotivationSubmit} className="space-y-4">
              <h2 className={`text-2xl font-bold ${theme.accentText}`}>🌟 Upload Motivasi</h2>

              <textarea value={motivation} onChange={(e) => setMotivation(e.target.value)} required placeholder="Tulis motivasi..." className="w-full px-4 py-3 rounded-xl h-28 border" />
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Nama pengutip (opsional)" className="w-full px-4 py-3 rounded-xl border" />

              <div className="flex gap-3">
                <button className={`px-6 py-2 rounded-xl ${theme.btnPrimary}`}>Simpan</button>
                <button type="button" onClick={() => setSelected(null)} className="px-6 py-2 rounded-xl bg-white border">⬅ Kembali</button>
              </div>

              {latestMotivation && (
                <div className="mt-4 p-4 rounded-xl border">
                  <div className="font-semibold">Motivasi Aktif</div>
                  <div className="text-sm mt-1">{latestMotivation.text}</div>
                  <div className="text-xs mt-2 text-gray-500">oleh {latestMotivation.author} — sisa {getMotivationCountdown()}</div>
                </div>
              )}
            </form>
          )}

          {/* Struktur */}
          {selected === "struktur" && (
            <form onSubmit={handleStrukturSubmit} className="space-y-4">
              <h2 className={`text-2xl font-bold ${theme.accentText}`}>👥 Struktur Organisasi</h2>

              {Object.entries(struktur)
                .sort((a, b) => (a[1].uploadedAt || 0) - (b[1].uploadedAt || 0))
                .map(([jabKey, item]) => (
                  <div key={jabKey} className="p-3 rounded-xl mb-3 flex items-center gap-3 border">
                    <div className="flex-1">
                      <div className="text-sm font-medium capitalize">{jabKey.replace(/_/g, " ")}</div>
                      <input value={item?.nama || ""} onChange={(e) => handleChangeNama(jabKey, e.target.value)} placeholder={`Nama ${jabKey.replace(/_/g, " ")}`} className="w-full px-3 py-2 rounded-lg mt-2 border" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="text-xs text-gray-500">{new Date(item?.uploadedAt || Date.now()).toLocaleDateString()}</div>
                      <button type="button" onClick={() => handleDeleteJabatan(jabKey)} className="px-3 py-1 rounded bg-red-500 text-white">Hapus</button>
                    </div>
                  </div>
                ))}

              <div className="flex gap-2">
                <input value={newJabatan} onChange={(e) => setNewJabatan(e.target.value)} placeholder="Nama jabatan baru..." className="flex-grow px-3 py-2 rounded-lg border" />
                <button type="button" onClick={handleAddJabatan} className="px-4 py-2 rounded-lg bg-white border">➕ Tambah</button>
              </div>

              <div className="flex gap-3">
                <button className={`px-6 py-2 rounded-xl ${theme.btnPrimary}`}>💾 Simpan</button>
                <button type="button" onClick={() => setSelected(null)} className="px-6 py-2 rounded-xl bg-white border">⬅ Kembali</button>
              </div>
            </form>
          )}

          {/* Program Kerja */}
          {selected === "program" && (
            <form onSubmit={handleProgramKerjaSubmit} className="space-y-4">
              <h2 className={`text-2xl font-bold ${theme.accentText}`}>📋 Program Kerja</h2>

              <div className="flex items-center gap-3">
                <label>Periode</label>
                <input type="number" value={periode} onChange={(e) => setPeriode(Number(e.target.value))} className="px-3 py-2 rounded-lg border w-36" />
              </div>

              {Object.keys(programKerja || {}).length === 0 && <p className="text-sm text-gray-500">Belum ada sie untuk periode ini.</p>}

              {Object.entries(programKerja || {}).map(([sieKey, desc]) => (
                <div key={sieKey} className="p-3 rounded-xl border mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium capitalize">Sie {sieKey.replace(/_/g, " ")}</div>
                    <button type="button" onClick={() => {
                      if (!window.confirm(`Hapus sie "${sieKey}"?`)) return;
                      setProgramKerja((prev) => {
                        const copy = { ...prev };
                        delete copy[sieKey];
                        return copy;
                      });
                    }} className="px-2 py-1 rounded bg-red-500 text-white text-sm">Hapus</button>
                  </div>
                  <textarea rows={3} value={desc} onChange={(e) => setProgramKerja((prev) => ({ ...prev, [sieKey]: e.target.value }))} className="w-full px-3 py-2 rounded-lg border" />
                </div>
              ))}

              <div className="flex gap-2">
                <input value={newSie} onChange={(e) => setNewSie(e.target.value)} placeholder="Nama sie baru..." className="flex-grow px-3 py-2 rounded-lg border" />
                <button type="button" onClick={handleAddSie} className="px-4 py-2 rounded-lg bg-white border">➕</button>
              </div>

              <div className="flex gap-3">
                <button className={`px-6 py-2 rounded-xl ${theme.btnPrimary}`}>Simpan</button>
                <button type="button" onClick={() => setSelected(null)} className="px-6 py-2 rounded-xl bg-white border">⬅ Kembali</button>
              </div>
            </form>
          )}

          {/* Manage Berita & Komentar */}
          {selected === "manage" && (
            <div className="space-y-6">
              <h2 className={`text-2xl font-bold ${theme.accentText}`}>📰 Berita & Komentar</h2>

              <div>
                <h3 className="font-semibold mb-2">Daftar Berita ({activities.length})</h3>
                {activities.length === 0 ? (
                  <p className="text-gray-500">Belum ada berita.</p>
                ) : (
                  activities.map((a) => (
                    <motion.div key={a.key} className="p-4 rounded-xl mb-3 border flex gap-4 items-start">
                      <div className="w-32 h-20 rounded overflow-hidden border">
                        {a.image ? <img src={a.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">No Image</div>}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{a.title}</div>
                        <div className="text-sm text-gray-500 mt-1">{a.description?.slice(0, 140)}</div>
                        <div className="text-xs text-gray-400 mt-2">{a.date ? new Date(a.date).toLocaleString() : ""}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => handleDeleteActivity(a.key)} className="px-3 py-1 rounded bg-red-500 text-white">Hapus</button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Komentar ({comments.length})</h3>
                {comments.length === 0 ? (
                  <p className="text-gray-500">Belum ada komentar.</p>
                ) : (
                  comments.map((c) => (
                    <motion.div key={c.key} className="p-3 rounded-xl mb-2 border flex justify-between items-start">
                      <div>
                        <div className="font-medium">{c.name || "Anonim"}</div>
                        <div className="text-sm text-gray-500 mt-1">{c.text}</div>
                        <div className="text-xs text-gray-400 mt-2">{c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}</div>
                      </div>
                      <div>
                        <button onClick={() => handleDeleteComment(c.key)} className="px-3 py-1 rounded bg-red-500 text-white">Hapus</button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="flex justify-end">
                <button onClick={() => setSelected(null)} className="px-6 py-2 rounded-xl bg-white border">⬅ Kembali</button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
