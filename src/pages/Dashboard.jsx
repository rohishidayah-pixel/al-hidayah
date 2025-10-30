import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { ref, push, set, onValue, remove } from 'firebase/database';
import { motion } from 'framer-motion';

// 🔧 Helper convert Google Drive link → direct link
const formatImageUrl = (url) => {
  if (!url) return '';
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/([^/]+)\//);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }
  return url;
};

// Urutan default jabatan
const orderStruktur = ['ketua', 'wakilKetua', 'sekretaris1', 'sekretaris2', 'bendahara1', 'bendahara2', 'koordinatorKegiatan', 'koordinatorKajian', 'humas', 'peralatan'];

export default function Dashboard() {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  // State kegiatan
  const [activity, setActivity] = useState('');
  const [activityDesc, setActivityDesc] = useState('');
  const [activityImage, setActivityImage] = useState('');
  const [previewError, setPreviewError] = useState(false);

  // State motivasi
  const [motivation, setMotivation] = useState('');
  const [author, setAuthor] = useState('');

  // Motivasi terbaru dan status aktif
  const [latestMotivation, setLatestMotivation] = useState(null);
  const [motivationActive, setMotivationActive] = useState(false);

  // State berita & komentar
  const [activities, setActivities] = useState([]);
  const [comments, setComments] = useState([]);

  // State struktur organisasi
  const [struktur, setStruktur] = useState({});
  const [newJabatan, setNewJabatan] = useState('');

  // State program kerja
  const periodeSekarang = new Date().getFullYear();
  const [periode, setPeriode] = useState(periodeSekarang);
  const [programKerja, setProgramKerja] = useState({});
  const [newSie, setNewSie] = useState('');

  // --- Ambil data dari firebase ---
  useEffect(() => {
    return onValue(ref(db, 'activities'), (snap) => {
      const val = snap.val() || {};
      setActivities(
        Object.keys(val)
          .map((k) => ({ key: k, ...val[k] }))
          .reverse()
      );
    });
  }, []);

  useEffect(() => {
    return onValue(ref(db, 'comments'), (snap) => {
      const val = snap.val() || {};
      setComments(
        Object.keys(val)
          .map((k) => ({ key: k, ...val[k] }))
          .reverse()
      );
    });
  }, []);

  useEffect(() => {
    return onValue(ref(db, 'struktur'), (snap) => {
      if (snap.exists()) setStruktur(snap.val());
    });
  }, []);

  useEffect(() => {
    return onValue(ref(db, `programKerja/${periode}`), (snap) => {
      if (snap.exists()) setProgramKerja(snap.val());
      else setProgramKerja({});
    });
  }, [periode]);

  // --- Ambil motivasi terbaru & cek aktif 7 hari ---
  useEffect(() => {
    return onValue(ref(db, 'motivasi'), (snap) => {
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

  // --- Upload Kegiatan ---
  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await push(ref(db, 'activities'), {
      title: activity,
      description: activityDesc,
      image: formatImageUrl(activityImage),
      date: new Date().toISOString(),
    });
    setActivity('');
    setActivityDesc('');
    setActivityImage('');
    setPreviewError(false);
    setLoading(false);
    alert('✅ Kegiatan berhasil diupload!');
    setSelected(null);
  };

  // --- Upload Motivasi ---
  const handleMotivationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    await set(ref(db, `motivasi/${today}`), {
      text: motivation,
      author: author || 'Anonim',
      uploadedAt: new Date().toISOString(),
    });
    setMotivation('');
    setAuthor('');
    setLoading(false);
    alert('✅ Motivasi berhasil diupload dan aktif selama 7 hari!');
    setSelected(null);
  };

  // --- Simpan Struktur ---
  const handleStrukturSubmit = async (e) => {
    e.preventDefault();
    await set(ref(db, 'struktur'), struktur);
    alert('✅ Struktur organisasi berhasil diperbarui!');
    setSelected(null);
  };

  const handleAddJabatan = () => {
    if (!newJabatan.trim()) return;
    setStruktur((prev) => ({ ...prev, [newJabatan]: '' }));
    setNewJabatan('');
  };

  // --- Simpan Program Kerja ---
  const handleProgramKerjaSubmit = async (e) => {
    e.preventDefault();
    await set(ref(db, `programKerja/${periode}`), programKerja);
    alert('✅ Program kerja berhasil diperbarui!');
    setSelected(null);
  };

  const handleAddSie = () => {
    if (!newSie.trim()) return;
    setProgramKerja((prev) => ({ ...prev, [newSie]: '' }));
    setNewSie('');
  };

  // --- Hapus berita / komentar ---
  const handleDeleteActivity = async (id) => {
    if (window.confirm('Yakin ingin menghapus berita ini?')) {
      await remove(ref(db, `activities/${id}`));
    }
  };

  const handleDeleteComment = async (id) => {
    if (window.confirm('Yakin ingin menghapus komentar ini?')) {
      await remove(ref(db, `comments/${id}`));
    }
  };

  // --- Hitung sisa waktu motivasi ---
  const getMotivationCountdown = () => {
    if (!latestMotivation) return '';
    const expiry = new Date(latestMotivation.uploadedAt);
    expiry.setDate(expiry.getDate() + 7);
    const diff = expiry - new Date();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${days} hari ${hours} jam ${minutes} menit`;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-6">📊 Dashboard Admin</h1>

      {loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 text-center bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 rounded">
          ⏳ Sedang memproses...
        </motion.div>
      )}

      {/* --- Menu Utama --- */}
      {!selected && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div onClick={() => setSelected('activity')} className="cursor-pointer bg-blue-500 text-white p-6 rounded-xl shadow hover:bg-blue-600 transition">
              <h2 className="text-xl font-semibold">📌 Upload Kegiatan</h2>
            </div>

            <div
              onClick={() => {
                if (!motivationActive) setSelected('motivation');
              }}
              className={`cursor-pointer p-6 rounded-xl shadow transition ${motivationActive ? 'bg-gray-400 text-gray-200 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'}`}
            >
              <h2 className="text-xl font-semibold">🌟 Upload Motivasi</h2>
              {motivationActive && <p className="mt-2 text-sm">Motivasi aktif: {getMotivationCountdown()}</p>}
            </div>

            <div onClick={() => setSelected('struktur')} className="cursor-pointer bg-purple-500 text-white p-6 rounded-xl shadow hover:bg-purple-600 transition">
              <h2 className="text-xl font-semibold">👥 Edit Struktur</h2>
            </div>
            <div onClick={() => setSelected('program')} className="cursor-pointer bg-orange-500 text-white p-6 rounded-xl shadow hover:bg-orange-600 transition">
              <h2 className="text-xl font-semibold">📋 Program Kerja</h2>
            </div>
          </div>

          {/* Kelola Berita */}
          <div className="mt-10 bg-white dark:bg-gray-800 shadow rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">📰 Kelola Berita</h2>
            {activities.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Belum ada berita.</p>
            ) : (
              activities.map((a) => (
                <motion.div key={a.key} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded mb-2">
                  <span>{a.title}</span>
                  <button onClick={() => handleDeleteActivity(a.key)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm">
                    Hapus
                  </button>
                </motion.div>
              ))
            )}
          </div>

          {/* Kelola Komentar */}
          <div className="mt-10 bg-white dark:bg-gray-800 shadow rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">💬 Kelola Komentar</h2>
            {comments.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Belum ada komentar.</p>
            ) : (
              comments.map((c) => (
                <motion.div key={c.key} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-3 rounded mb-2">
                  <span>{c.text}</span>
                  <button onClick={() => handleDeleteComment(c.key)} className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm">
                    Hapus
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </>
      )}

      {/* --- Form Upload / Edit --- */}
      {/* --- Upload Kegiatan --- */}
      {selected === 'activity' && (
        <form onSubmit={handleActivitySubmit} className="space-y-4 mt-6">
          <h2 className="text-2xl font-semibold mb-4">📌 Upload Kegiatan</h2>

          {/* Nama kegiatan */}
          <input
            className="w-full border border-gray-300 dark:border-gray-600 
                 bg-white dark:bg-gray-800 
                 text-gray-900 dark:text-gray-100 
                 px-4 py-2 rounded-lg"
            placeholder="Nama Kegiatan"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            required
          />

          {/* Deskripsi kegiatan */}
          <textarea
            className="w-full border border-gray-300 dark:border-gray-600 
                 bg-white dark:bg-gray-800 
                 text-gray-900 dark:text-gray-100 
                 px-4 py-2 rounded-lg h-28"
            placeholder="Deskripsi Kegiatan"
            value={activityDesc}
            onChange={(e) => setActivityDesc(e.target.value)}
            required
          />

          {/* 🔹 Tutorial imgbb */}
          <div
            className="bg-blue-50 dark:bg-gray-700 
                    text-gray-800 dark:text-gray-200 
                    p-3 rounded-lg text-sm"
          >
            <p className="font-semibold">Cara dapat link foto (imgbb):</p>
            <ol className="list-decimal list-inside space-y-1 mt-1">
              <li>
                Buka{' '}
                <a href="https://imgbb.com" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">
                  imgbb.com
                </a>
              </li>
              <li>Upload foto kegiatan</li>
              <li>
                Pilih <b>Copy Direct Link</b>
              </li>
              <li>Tempel link ke kolom bawah</li>
            </ol>

            {/* 🔹 Gambar bantuan */}
            <div className="mt-3">
              <img src="/imgbb.png" alt="Tutorial imgbb" className="rounded-lg border dark:border-gray-600 w-full md:w-2/3 mx-auto" />
              <p className="text-xs text-center text-gray-600 dark:text-gray-300 mt-1">
                Contoh cara copy <b>Direct Link</b> dari imgbb
              </p>
            </div>
          </div>

          {/* Input link foto */}
          <input
            className="w-full border border-gray-300 dark:border-gray-600 
                 bg-white dark:bg-gray-800 
                 text-gray-900 dark:text-gray-100 
                 px-4 py-2 rounded-lg"
            placeholder="Link Foto (Direct Link dari imgbb)"
            value={activityImage}
            onChange={(e) => setActivityImage(e.target.value)}
            required
          />

          {/* 🔹 Preview foto */}
          {activityImage && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <img src={formatImageUrl(activityImage)} alt="Preview" className="w-full h-48 object-cover rounded-lg border dark:border-gray-600" onError={() => setPreviewError(true)} />
              {previewError && (
                <p className="text-red-500 text-sm mt-1">
                  ❌ Link tidak valid. Pastikan pilih <b>Direct Link</b> dari imgbb.
                </p>
              )}
            </motion.div>
          )}

          {/* Tombol aksi */}
          <div className="flex gap-4">
            <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">Simpan</button>
            <button type="button" onClick={() => setSelected(null)} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
              ⬅ Kembali
            </button>
          </div>
        </form>
      )}

      {/* --- Upload Motivasi --- */}
      {selected === 'motivation' && (
        <form onSubmit={handleMotivationSubmit} className="space-y-4 mt-6">
          <h2 className="text-2xl font-semibold mb-4">🌟 Upload Motivasi</h2>

          {/* Tulis motivasi */}
          <textarea
            className="w-full border border-gray-300 dark:border-gray-600
                 bg-white dark:bg-gray-800
                 text-gray-900 dark:text-gray-100
                 px-4 py-2 rounded-lg h-28"
            placeholder="Tulis motivasi..."
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            required
          />

          {/* Nama pengutip */}
          <input
            className="w-full border border-gray-300 dark:border-gray-600
                 bg-white dark:bg-gray-800
                 text-gray-900 dark:text-gray-100
                 px-4 py-2 rounded-lg"
            placeholder="Nama pengutip / hadis (opsional)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />

          {/* Tombol aksi */}
          <div className="flex gap-4">
            <button
              className="bg-green-500 text-white px-6 py-2 rounded-lg 
                   hover:bg-green-600"
            >
              Simpan
            </button>
            <button type="button" onClick={() => setSelected(null)} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
              ⬅ Kembali
            </button>
          </div>
        </form>
      )}

      {/* --- Struktur dan Program Kerja --- */}
      {/* Struktur */}
      {selected === 'struktur' && (
        <form onSubmit={handleStrukturSubmit} className="space-y-4 mt-6">
          <h2 className="text-2xl font-semibold mb-4">👥 Edit Struktur</h2>

          {Object.keys(struktur).map((jabatan) => (
            <div key={jabatan} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg flex justify-between items-center">
              <div className="flex-1">
                <label className="capitalize text-gray-800 dark:text-gray-200">{jabatan}</label>
                <input
                  className="w-full border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-900
                       text-gray-900 dark:text-gray-100
                       px-3 py-2 rounded mt-1"
                  value={struktur[jabatan]}
                  onChange={(e) => setStruktur((prev) => ({ ...prev, [jabatan]: e.target.value }))}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Hapus jabatan ${jabatan}?`)) {
                    setStruktur((prev) => {
                      const copy = { ...prev };
                      delete copy[jabatan];
                      return copy;
                    });
                  }
                }}
                className="ml-2 text-red-500 hover:text-red-700 dark:hover:text-red-400"
              >
                🗑
              </button>
            </div>
          ))}

          {/* Tambah jabatan baru */}
          <div className="flex gap-2 mt-2">
            <input
              className="flex-grow border border-gray-300 dark:border-gray-600
                   bg-white dark:bg-gray-900
                   text-gray-900 dark:text-gray-100
                   px-3 py-2 rounded"
              placeholder="Nama jabatan..."
              value={newJabatan}
              onChange={(e) => setNewJabatan(e.target.value)}
            />
            <button type="button" onClick={handleAddJabatan} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              ➕
            </button>
          </div>

          <div className="flex gap-4 mt-4">
            <button className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600">Simpan</button>
            <button type="button" onClick={() => setSelected(null)} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
              ⬅ Kembali
            </button>
          </div>
        </form>
      )}

      

      {/* Program Kerja */}
      {selected === 'program' && (
        <form onSubmit={handleProgramKerjaSubmit} className="space-y-4 mt-6">
          <h2 className="text-2xl font-semibold mb-4">📋 Edit Program Kerja</h2>

          {/* 🔹 Periode */}
          <div>
            <label className="text-gray-800 dark:text-gray-200">Periode</label>
            <input
              type="number"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              className="border border-gray-300 dark:border-gray-600
                   bg-white dark:bg-gray-900
                   text-gray-900 dark:text-gray-100
                   px-3 py-2 rounded w-40 ml-2"
            />
          </div>

          {/* 🔹 Daftar Sie */}
          {Object.keys(programKerja).map((sie) => (
            <div key={sie} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <label className="capitalize text-gray-800 dark:text-gray-200">Sie {sie}</label>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Hapus sie "${sie}"?`)) {
                      setProgramKerja((prev) => {
                        const copy = { ...prev };
                        delete copy[sie];
                        return copy;
                      });
                    }
                  }}
                  className="text-red-500 hover:text-red-700 dark:hover:text-red-400"
                >
                  🗑
                </button>
              </div>
              <textarea
                className="w-full border border-gray-300 dark:border-gray-600
                     bg-white dark:bg-gray-900
                     text-gray-900 dark:text-gray-100
                     px-3 py-2 rounded"
                rows="3"
                value={programKerja[sie]}
                onChange={(e) => setProgramKerja((prev) => ({ ...prev, [sie]: e.target.value }))}
              />
            </div>
          ))}

          {/* 🔹 Tambah sie */}
          <div className="flex gap-2">
            <input
              className="flex-grow border border-gray-300 dark:border-gray-600
                   bg-white dark:bg-gray-900
                   text-gray-900 dark:text-gray-100
                   px-3 py-2 rounded"
              placeholder="Nama sie baru..."
              value={newSie}
              onChange={(e) => setNewSie(e.target.value)}
            />
            <button type="button" onClick={handleAddSie} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              ➕
            </button>
          </div>

          {/* 🔹 Tombol aksi */}
          <div className="flex gap-4 mt-4">
            <button className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600">Simpan</button>
            <button type="button" onClick={() => setSelected(null)} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">
              ⬅ Kembali
            </button>
          </div>
        </form>
      )}
    </div>
  );
}  