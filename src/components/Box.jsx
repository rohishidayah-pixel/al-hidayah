import React from "react";

export default function Box({ title, name }) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg px-4 py-2 text-center w-40">
      <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100">{title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">{name || "-"}</p>
    </div>
  );
}
