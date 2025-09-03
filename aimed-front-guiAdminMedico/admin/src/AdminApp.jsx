
import React, { useMemo, useState } from "react";

/**
 * AI‑MedAssistant — GUI Admin (v0.1)
 * - Standalone component listo para ruta /admin
 * - TailwindCSS utilities
 * - Puntos de integración: `${API_BASE}/admin/*`, `/audit/*`
 */

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

// ------ UI helpers ------
const cx = (...a) => a.filter(Boolean).join(" ");

function Topbar({ title, children }) {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </header>
  );
}

function SidebarAdmin() {
  return (
    <aside className="hidden h-screen border-r bg-white/70 p-3 md:block md:w-64">
      <div className="mb-4 px-2 text-sm text-gray-500">AI‑MedAssistant</div>
      <nav className="space-y-1">
        <a href="#/medico" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 hover:bg-gray-100">
          🩺 <span className="font-medium">Médico</span>
        </a>
        <span className="flex w-full items-center gap-2 rounded-xl bg-gray-900 px-3 py-2 text-white">
          🛠️ <span className="font-medium">Admin</span>
        </span>
      </nav>
      <div className="mt-6 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
        <div className="font-semibold">Integración</div>
        <div>API: {API_BASE}</div>
        <div>JWT: localStorage.token</div>
      </div>
    </aside>
  );
}

function StatCard({ title, value, hint }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </div>
  );
}

function Badge({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    yellow: "bg-yellow-100 text-yellow-700",
    blue: "bg-blue-100 text-blue-700",
    orange: "bg-orange-100 text-orange-700",
  };
  return <span className={cx("inline-flex items-center rounded-full px-2 py-0.5 text-xs", tones[tone])}>{children}</span>;
}

function Table({ columns, data, empty = "Sin datos" }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <table className="min-w-full divide-y">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-600">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.length === 0 && (
            <tr>
              <td className="px-4 py-6 text-sm text-gray-500" colSpan={columns.length}>
                {empty}
              </td>
            </tr>
          )}
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3 text-sm">
                  {c.render ? c.render(row[c.key], row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-sm hover:bg-gray-100">✕</button>
        </div>
        <div className="p-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}

// ------ Mock data ------
const mockUsers = [
  { id: "u1", email: "medico1@clinic.local", role: "practitioner", status: "active" },
  { id: "u2", email: "admin@clinic.local", role: "admin", status: "active" },
  { id: "u3", email: "enfermeria@clinic.local", role: "nurse", status: "suspended" },
];
const mockAudits = [
  { id: "ad1", actor: "admin@clinic.local", action: "CREATE_USER", target: "u3", ts: "2025-09-02 14:12" },
  { id: "ad2", actor: "medico1@clinic.local", action: "READ_PATIENT", target: "p123", ts: "2025-09-03 09:05" },
];

// ------ Main Admin component ------
export default function AdminApp() {
  const [filter, setFilter] = useState("");
  const [openUser, setOpenUser] = useState(null);

  const users = useMemo(() => mockUsers.filter((u) => u.email.includes(filter)), [filter]);

  const userCols = [
    { key: "email", header: "Email" },
    { key: "role", header: "Rol", render: (v) => <Badge tone="blue">{v}</Badge> },
    { key: "status", header: "Estado", render: (v) => <Badge tone={v === "active" ? "green" : "orange"}>{v}</Badge> },
    {
      key: "actions",
      header: "",
      render: (_, row) => (
        <button className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50" onClick={() => setOpenUser(row)}>
          Editar
        </button>
      ),
    },
  ];

  const auditCols = [
    { key: "ts", header: "Fecha" },
    { key: "actor", header: "Actor" },
    { key: "action", header: "Acción" },
    { key: "target", header: "Objetivo" },
  ];

  return (
    <div className="flex h-screen w-full bg-gray-100">
      <SidebarAdmin />
      <div className="flex-1">
        <Topbar title="Panel de Administración">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar usuarios…"
            className="w-56 rounded-xl border px-3 py-1.5 text-sm focus:outline-none focus:ring"
          />
        </Topbar>

        <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <div className="grid grid-cols-3 gap-4">
              <StatCard title="Usuarios activos" value={mockUsers.filter((u) => u.status === "active").length} />
              <StatCard title="Roles" value={[...new Set(mockUsers.map((u) => u.role))].length} />
              <StatCard title="Eventos (24h)" value={mockAudits.length} />
            </div>

            <section>
              <h2 className="mb-2 text-sm font-semibold tracking-wide text-gray-600">Usuarios</h2>
              <Table columns={userCols} data={users} empty="Sin usuarios" />
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold tracking-wide text-gray-600">Auditoría reciente</h2>
              <Table columns={auditCols} data={mockAudits} empty="Sin eventos" />
            </section>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700">Salud del sistema</h3>
              <ul className="mt-2 space-y-1 text-sm">
                <li><Badge tone="green">OK</Badge> API Gateway</li>
                <li><Badge tone="green">OK</Badge> PostgreSQL</li>
                <li><Badge tone="green">OK</Badge> MongoDB</li>
                <li><Badge tone="green">OK</Badge> Redis</li>
                <li><Badge tone="yellow">LOAD</Badge> NLP Queue</li>
              </ul>
              <button className="mt-3 w-full rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">Ver métricas</button>
            </div>

            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700">Parámetros de IA</h3>
              <div className="mt-2 space-y-2 text-sm">
                <label className="block">Umbral de confianza</label>
                <input type="range" min="0" max="100" defaultValue={70} className="w-full" />
                <label className="mt-2 block">Desactivar fuera de dominio</label>
                <input type="checkbox" defaultChecked />
              </div>
            </div>
          </div>
        </main>
      </div>

      <Modal
        open={!!openUser}
        onClose={() => setOpenUser(null)}
        title={openUser ? `Editar usuario: ${openUser.email}` : "Editar usuario"}
        footer={
          <>
            <button onClick={() => setOpenUser(null)} className="rounded-xl px-3 py-1.5 text-sm hover:bg-gray-100">
              Cancelar
            </button>
            <button className="rounded-xl bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-black">
              Guardar
            </button>
          </>
        }
      >
        {openUser && (
          <div className="space-y-3 text-sm">
            <div>
              <label className="block text-gray-600">Rol</label>
              <select defaultValue={openUser.role} className="mt-1 w-full rounded-xl border p-2">
                <option value="admin">admin</option>
                <option value="practitioner">practitioner</option>
                <option value="nurse">nurse</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-600">Estado</label>
              <select defaultValue={openUser.status} className="mt-1 w-full rounded-xl border p-2">
                <option value="active">active</option>
                <option value="suspended">suspended</option>
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
