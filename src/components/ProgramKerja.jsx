import { useEffect, useState } from "react";
import { db } from "../firebase/config";
import { ref, onValue } from "firebase/database";

export default function ProgramKerja() {
  const [programKerja, setProgramKerja] = useState(null);

  useEffect(() => {
    const periode = new Date().getFullYear(); // contoh ambil periode otomatis
    const programRef = ref(db, `programKerja/${periode}`);
    const unsub = onValue(programRef, (snap) => {
      setProgramKerja(snap.val() || {});
    });
    return () => unsub();
  }, []);

  if (!programKerja) {
    return (
      <section className="mb-12 text-center">
        <h2 className="text-2xl font-semibold mb-6">📌 Program Kerja</h2>
        <p className="text-gray-500">Belum ada program kerja untuk periode ini.</p>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-semibold mb-6 text-center">📌 Program Kerja</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-bold text-green-700 mb-2">Sie Dakwah</h3>
          <p className="text-gray-700">{programKerja.dakwah || "Belum diisi"}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-bold text-green-700 mb-2">Sie Kemas</h3>
          <p className="text-gray-700">{programKerja.kemas || "Belum diisi"}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-bold text-green-700 mb-2">Sie Humas</h3>
          <p className="text-gray-700">{programKerja.humas || "Belum diisi"}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-bold text-green-700 mb-2">Sie SDM</h3>
          <p className="text-gray-700">{programKerja.sdm || "Belum diisi"}</p>
        </div>
      </div>
    </section>
  );
}
