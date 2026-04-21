"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-white font-mono"
    >
      <div className="max-w-md text-center px-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Oups !</h1>
        <p className="text-gray-600 mb-2">
          Une erreur inattendue est survenue.
        </p>
        <p className="text-sm text-gray-400 mb-8">
          {error.message || "Erreur inconnue"}
        </p>
        <button
          onClick={() => unstable_retry()}
          className="rounded-lg px-6 py-3 text-white font-semibold transition-colors"
          style={{ backgroundColor: "#FF6B6B" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e55a5a")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#FF6B6B")}
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
