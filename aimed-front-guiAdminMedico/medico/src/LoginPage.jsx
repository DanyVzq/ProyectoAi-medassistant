
import React, { useState } from "react";

/**
 * LoginPage — estilo inspirado en tu login.html y style.css, adaptado a Tailwind
 * Props:
 *  - onSuccess(token, user): callback tras login OK
 *  - apiBase: URL base del backend (VITE_API_BASE)
 */
export default function LoginPage({ onSuccess, apiBase }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Ajusta el endpoint a tu backend real
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Credenciales inválidas");
      }

      const token = data?.access || data?.token || data?.jwt || "";
      const user = data?.user || { email };
      if (!token) {
        throw new Error("El backend no devolvió un token");
      }
      onSuccess(token, user);
    } catch (err) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="w-full max-w-md rounded-2xl shadow-xl bg-white/90 backdrop-blur border">
        <div className="px-8 pt-8 pb-4 text-center">
          <h1 className="text-2xl font-bold tracking-tight">AI‑MedAssistant</h1>
          <p className="mt-1 text-sm text-gray-600">Acceso para médicos</p>
        </div>
        <form onSubmit={handleSubmit} className="px-8 pb-8">
          {error && (
            <div className="mb-3 rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2 border border-red-200">
              {error}
            </div>
          )}
          <label className="block text-xs font-medium text-gray-600">Correo</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="medico@clinica.com"
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring"
            required
          />
          <label className="mt-3 block text-xs font-medium text-gray-600">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <a className="hover:underline" href="#">¿Olvidaste tu contraseña?</a>
            <span>© {new Date().getFullYear()} Clínica</span>
          </div>
        </form>
      </div>
    </div>
  );
}
