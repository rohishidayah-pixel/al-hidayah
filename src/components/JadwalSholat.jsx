import React, { useEffect, useState } from "react";
import { FiSun, FiMoon } from "react-icons/fi";
import { motion } from "framer-motion";

export default function JadwalSholat() {
  const [jadwal, setJadwal] = useState(null);
  const [nextSholat, setNextSholat] = useState(null);
  const [countdown, setCountdown] = useState("");

  const sholatOrder = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];
  const sholatLabel = {
    Fajr: "Subuh",
    Dhuhr: "Dzuhur",
    Asr: "Ashar",
    Maghrib: "Maghrib",
    Isha: "Isya",
  };

  const icons = {
    Fajr: <FiMoon className="w-5 h-5 text-sky-500" />,
    Dhuhr: <FiSun className="w-5 h-5 text-yellow-400" />,
    Asr: <FiSun className="w-5 h-5 text-orange-500" />,
    Maghrib: <FiSun className="w-5 h-5 text-red-500" />,
    Isha: <FiMoon className="w-5 h-5 text-indigo-500" />,
  };

  // 🔹 Ambil data dari API
  useEffect(() => {
    fetch(
      "https://api.aladhan.com/v1/timingsByCity?city=Yogyakarta&country=Indonesia&method=2"
    )
      .then((res) => res.json())
      .then((data) => setJadwal(data.data.timings))
      .catch((err) => console.error(err));
  }, []);

  // 🔹 Hitung waktu sholat berikutnya
  useEffect(() => {
    if (!jadwal) return;

    const updateNextSholat = () => {
      const now = new Date();
      let next = null;

      for (let s of sholatOrder) {
        const [hours, minutes] = jadwal[s].split(":").map(Number);
        const sholatTime = new Date();
        sholatTime.setHours(hours, minutes, 0, 0);

        if (sholatTime > now) {
          next = s;
          const diff = sholatTime - now;
          const h = Math.floor(diff / 1000 / 3600);
          const m = Math.floor((diff / 1000 % 3600) / 60);
          const sec = Math.floor((diff / 1000) % 60);
          setCountdown(`${h}j ${m}m ${sec}d`);
          break;
        }
      }

      // Kalau semua sudah lewat → Subuh besok
      if (!next) {
        next = "Fajr";
        const [hours, minutes] = jadwal["Fajr"].split(":").map(Number);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(hours, minutes, 0, 0);

        const diff = tomorrow - now;
        const h = Math.floor(diff / 1000 / 3600);
        const m = Math.floor((diff / 1000 % 3600) / 60);
        const sec = Math.floor((diff / 1000) % 60);
        setCountdown(`${h}j ${m}m ${sec}d`);
      }

      setNextSholat(next);
    };

    updateNextSholat();
    const interval = setInterval(updateNextSholat, 1000);
    return () => clearInterval(interval);
  }, [jadwal]);

  if (!jadwal)
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
        Memuat jadwal sholat...
      </p>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      viewport={{ once: true }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-5 text-center"
    >
      {/* 🔹 Countdown */}
      {nextSholat && (
        <div className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-300">
          Waktu <span className="text-green-600 dark:text-emerald-400 font-bold">
            {sholatLabel[nextSholat]}
          </span>{" "}
          dalam{" "}
          <span className="text-green-600 dark:text-emerald-400 font-bold">
            {countdown}
          </span>
        </div>
      )}

      {/* 🔹 Flexbox grid jadwal */}
      <div className="flex flex-wrap justify-center gap-2">
        {sholatOrder.map((s) => {
          const isNext = s === nextSholat;
          return (
            <div
              key={s}
              className={`flex flex-col items-center justify-center w-20 h-20 rounded-xl transition-all
                ${isNext
                  ? "bg-green-600 text-white scale-105 shadow-md"
                  : "bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                }`}
            >
              {icons[s]}
              <span className="text-xs font-semibold mt-1">
                {sholatLabel[s]}
              </span>
              <span className="text-sm font-bold">{jadwal[s]}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
