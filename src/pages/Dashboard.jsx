import { useState, useEffect } from "react";
import { db } from "../firebase/config";
import { ref, push, set, onValue, remove } from "firebase/database";
import { motion } from "framer-motion";

// 🔧 Helper convert Google Drive link → direct link
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

export default function Dashboard() {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔹 State untuk kegiatan
  const [activity, setActivity] = useState("");
  const [activityDesc, setActivityDesc] = useState("");
  const [activityImage, setActivityImage] = useState("");
  const [previewError, setPreviewError] = useState(false);

  // 🔹 State untuk motivasi
  const [motivation, setMotivation] = useState("");
  const [author, setAuthor] = useState("");
  const [latestMotivation, setLatestMotivation] = useState(null);
  const [motivationActive, setMotivationActive] = useState(false);

  // 🔹 State untuk berita dan komentar
  const [activities, setActivities] = useState([]);
  const [comments, setComments] = useState([]);

  // 🔹 Struktur organisasi (versi baru)
  const [struktur, setStruktur] = useState({});
  const [newJabatan, setNewJabatan] = useState("");

  // 🔹 Program kerja
  const periodeSekarang = new Date().getFullYear();
  const [periode, setPeriode] = useState(periodeSekarang);
  const [programKerja, setProgramKerja] = useState({});
  const [newSie, setNewSie] = useState("");

  // ================================
  // 🔹 Firebase Listeners
  // ================================
  useEffect(() => {
    return onValue(ref(db, "activities"), (snap) => {
      const val = snap.val() || {};
      setActivities(
        Object.keys(val)
          .map((k) => ({ key: k, ...val[k] }))
          .reverse()
      );
    });
  }, []);

  useEffect(() => {
    return onValue(ref(db, "comments"), (snap) => {
      const val = snap.val() || {};
      setComments(
        Object.keys(val)
          .map((k) => ({ key: k, ...val[k] }))
          .reverse()
      );
    });
  }, []);

  // 🔹 Ambil struktur organisasi (versi baru)
  useEffect(() => {
    const unsub = onValue(ref(db, "struktur"), (snap) => {
      if (snap.exists()) setStruktur(snap.val());
      else setStruktur({});
    });
    return () => unsub();
  }, []);

  // 🔹 Program kerja
  useEffect(() => {
    return onValue(ref(db, `programKerja/${periode}`), (snap) => {
      if (snap.exists()) setProgramKerja(snap.val());
      else setProgramKerja({});
    });
  }, [periode]);

  // 🔹 Motivasi (aktif 7 hari)
  useEffect(() => {
    return onValue(ref(db, "motivasi"), (snap) => {
      const val = snap.val() || {};
      const allMotivasi = Object.values(val)
        .map((m) => ({ ...m, uploadedAt: new Date(m.uploadedAt) }))
        .sort((a, b) => b.uploadedAt - a.uploadedAt);

      if (allMotivasi.length === 0) {
        setLatestMotivation(null);
        setMotivationActive(false);
        return;
      }

      const terbaru = allMotivasi[0];
      const expiry = new Date(terbaru.uploadedAt);
      expiry.setDate(expiry.getDate() + 7);
      const now = new Date();

      if (now <= expiry) {
        setLatestMotivation(terbaru);
        setMotivationActive(true);
      } else {
        setLatestMotivation(null);
        setMotivationActive(false);
      }
    });
  }, []);

  // ================================
  // 🔹 Fungsi Upload dan Simpan
  // ================================
  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
    setLoading(false);
    alert("✅ Kegiatan berhasil diupload!");
    setSelected(null);
  };

  const handleMotivationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    await set(ref(db, `motivasi/${today}`), {
      text: motivation,
      author: author || "Anonim",
      uploadedAt: new Date().toISOString(),
    });
    setMotivation("");
    setAuthor("");
    setLoading(false);
    alert("✅ Motivasi berhasil diupload dan aktif selama 7 hari!");
    setSelected(null);
  };

  // ================================
  // 🔹 Struktur Organisasi (versi baru)
  // ================================
  const handleStrukturSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSave = {};
      Object.keys(struktur).forEach((key) => {
        const item = struktur[key];
        dataToSave[key] = {
          nama: item?.nama || "",
          uploadedAt: item?.uploadedAt || Date.now(),
        };
      });
      await set(ref(db, "struktur"), dataToSave);
      alert("✅ Struktur organisasi berhasil diperbarui!");
      setSelected(null);
    } catch (err) {
      console.error("❌ Gagal menyimpan struktur:", err);
      alert("Gagal menyimpan struktur!");
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

  const handleDeleteJabatan = (jabatan) => {
    if (window.confirm(`Hapus jabatan ${jabatan}?`)) {
      setStruktur((prev) => {
        const copy = { ...prev };
        delete copy[jabatan];
        return copy;
      });
    }
  };

  const handleChangeNama = (jabatan, value) => {
    setStruktur((prev) => ({
      ...prev,
      [jabatan]: { ...prev[jabatan], nama: value },
    }));
  };

  // ================================
  // 🔹 Program kerja
  // ================================
  const handleProgramKerjaSubmit = async (e) => {
    e.preventDefault();
    await set(ref(db, `programKerja/${periode}`), programKerja);
    alert("✅ Program kerja berhasil diperbarui!");
    setSelected(null);
  };

  const handleAddSie = () => {
    if (!newSie.trim()) return;
    setProgramKerja((prev) => ({ ...prev, [newSie]: "" }));
    setNewSie("");
  };

  // ================================
  // 🔹 Hapus berita / komentar
  // ================================
  const handleDeleteActivity = async (id) => {
    if (window.confirm("Yakin ingin menghapus berita ini?")) {
      await remove(ref(db, `activities/${id}`));
    }
  };

  const handleDeleteComment = async (id) => {
    if (window.confirm("Yakin ingin menghapus komentar ini?")) {
      await remove(ref(db, `comments/${id}`));
    }
  };

  // ================================
  // 🔹 Hitung sisa waktu motivasi
  // ================================
  const getMotivationCountdown = () => {
    if (!latestMotivation) return "";
    const expiry = new Date(latestMotivation.uploadedAt);
    expiry.setDate(expiry.getDate() + 7);
    const diff = expiry - new Date();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${days} hari ${hours} jam ${minutes} menit`;
  };

  // ================================
  // 🔹 Render UI
  // ================================
  return (
    <div className="max-w-5xl mx-auto px-4 py-10 text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-6">📊 Dashboard Admin</h1>

      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 p-3 text-center bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded"
        >
          ⏳ Sedang memproses...
        </motion.div>
      )}

      {/* --- MENU UTAMA --- */}
      {!selected && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div
              onClick={() => setSelected("activity")}
              className="cursor-pointer bg-blue-500 text-white p-6 rounded-xl shadow hover:bg-blue-600 transition"
            >
              📌 Upload Kegiatan
            </div>
            <div
              onClick={() => {
                if (!motivationActive) setSelected("motivation");
              }}
              className={`cursor-pointer p-6 rounded-xl shadow transition ${
                motivationActive
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-green-500 text-white hover:bg-green-600"
              }`}
            >
              🌟 Upload Motivasi
              {motivationActive && (
                <p className="mt-2 text-sm">
                  Aktif: {getMotivationCountdown()}
                </p>
              )}
            </div>
            <div
              onClick={() => setSelected("struktur")}
              className="cursor-pointer bg-purple-500 text-white p-6 rounded-xl shadow hover:bg-purple-600 transition"
            >
              👥 Edit Struktur
            </div>
            <div
              onClick={() => setSelected("program")}
              className="cursor-pointer bg-orange-500 text-white p-6 rounded-xl shadow hover:bg-orange-600 transition"
            >
              📋 Program Kerja
            </div>
          </div>

          {/* Kegiatan & Komentar */}
          <div className="mt-10 bg-white dark:bg-gray-800 shadow rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">📰 Kelola Berita</h2>
            {activities.length === 0 ? (
              <p className="text-gray-500">Belum ada berita.</p>
            ) : (
              activities.map((a) => (
                <motion.div
                  key={a.key}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded mb-2"
                >
                  <span>{a.title}</span>
                  <button
                    onClick={() => handleDeleteActivity(a.key)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                  >
                    Hapus
                  </button>
                </motion.div>
              ))
            )}
          </div>

          <div className="mt-10 bg-white dark:bg-gray-800 shadow rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">💬 Kelola Komentar</h2>
            {comments.length === 0 ? (
              <p className="text-gray-500">Belum ada komentar.</p>
            ) : (
              comments.map((c) => (
                <motion.div
                  key={c.key}
                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded mb-2"
                >
                  <span>{c.text}</span>
                  <button
                    onClick={() => handleDeleteComment(c.key)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                  >
                    Hapus
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </>
      )}

      {/* --- STRUKTUR ORGANISASI (Versi Baru) --- */}
      {selected === "struktur" && (
        <form onSubmit={handleStrukturSubmit} className="space-y-4 mt-6">
          <h2 className="text-2xl font-semibold mb-4">
            👥 Edit Struktur Organisasi
          </h2>

          {Object.entries(struktur)
            .sort((a, b) => (a[1].uploadedAt || 0) - (b[1].uploadedAt || 0))
            .map(([jabatan, value]) => (
              <div
                key={jabatan}
                className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg flex justify-between items-center"
              >
                <div className="flex-1 mr-2">
                  <label className="capitalize text-gray-800 dark:text-gray-200">
                    {jabatan.replace(/_/g, " ")}
                  </label>
                  <input
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 rounded mt-1"
                    value={value?.nama || ""}
                    onChange={(e) => handleChangeNama(jabatan, e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteJabatan(jabatan)}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                >
                  🗑
                </button>
              </div>
            ))}

          <div className="flex gap-2 mt-4">
            <input
              className="flex-grow border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-3 py-2 rounded"
              placeholder="Nama jabatan baru..."
              value={newJabatan}
              onChange={(e) => setNewJabatan(e.target.value)}
            />
            <button
              type="button"
              onClick={handleAddJabatan}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              ➕ Tambah
            </button>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="submit"
              className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600"
            >
              💾 Simpan
            </button>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
            >
              ⬅ Kembali
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
