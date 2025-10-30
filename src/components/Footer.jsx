import React from "react";
import { FaInstagram, FaYoutube } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="hidden md:block bg-green-700 dark:bg-gray-900 text-white mt-12 transition-colors">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Tentang Rohis */}
          <div>
            <h4 className="font-bold text-lg mb-3">Rohis AL-HIDAYAH</h4>
            <p className="text-green-100 dark:text-gray-400 text-sm leading-relaxed">
              Organisasi Rohis — Pembinaan spiritual, kajian rutin, serta
              kegiatan sosial untuk membangun generasi muslim berakhlak mulia.
            </p>
          </div>

          {/* Navigasi */}
          <div>
            <h4 className="font-bold mb-3">Navigasi</h4>
            <ul className="text-sm space-y-2">
              <li>
                <a
                  href="/"
                  className="hover:underline hover:text-green-200 transition-colors"
                >
                  Beranda
                </a>
              </li>
              <li>
                <a
                  href="/login"
                  className="hover:underline hover:text-green-200 transition-colors"
                >
                  Login Admin
                </a>
              </li>
              <li>
                <a
                  href="/dashboard"
                  className="hover:underline hover:text-green-200 transition-colors"
                >
                  Dashboard
                </a>
              </li>
            </ul>
          </div>

          {/* Sosial Media */}
          <div>
            <h4 className="font-bold mb-3">Ikuti Kami</h4>
            <div className="flex items-center gap-5 text-2xl">
              <a
                href="https://www.instagram.com/rohisalhidayah/?hl=id"
                target="_blank"
                rel="noreferrer"
                className="hover:text-pink-400 transition-colors"
              >
                <FaInstagram />
              </a>
              <a
                href="https://www.youtube.com/channel/UCgRIgYAQ5vMzncyO8UcZEaA"
                target="_blank"
                rel="noreferrer"
                className="hover:text-red-500 transition-colors"
              >
                <FaYoutube />
              </a>
              {/*
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noreferrer"
                className="hover:text-green-400 transition-colors"
              >
                <FaWhatsapp />
              </a>
              */}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-sm text-green-100 dark:text-gray-500 mt-10 border-t border-green-600 dark:border-gray-700 pt-4">
          © {new Date().getFullYear()} Divisi Media Rohis AL-HIDAYAH.
        </div>
      </div>
    </footer>
  );
}
