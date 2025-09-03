
import React, { useMemo, useState } from "react";

/**
 * AI‑MedAssistant — GUI Médico (v0.1)
 * - Standalone component ready to mount at /medico (o ruta que definas)
 * - TailwindCSS utilities
 * - Puntos de integración: `${API_BASE}/appointments`, `/nlp/*`, `/fhir/*`
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

function SidebarMedico() {
  return (
    <aside className="hidden h-screen border-r bg-white/70 p-3 md:block md:w-64">
      <div className="mb-4 px-2 text-sm text-gray-500">AI‑MedAssistant</div>
      <nav className="space-y-1">
        <span className="flex w-full items-center gap-2 rounded-xl bg-gray-900 px-3 py-2 text-white">
          🩺 <span className="font-medium">Médico</span>
        </span>
        <a href="#/admin" className="flex w-full items-center gap-2 rounded-xl px-3 py-2 hover:bg-gray-100">
          🛠️ <span className="font-medium">Admin</span>
        </a>
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
const mockAgenda = [
  { id: "c1", start: "09:00", end: "09:30", patient: "Ana García", reason: "Dolor torácico leve", status: "confirmada" },
  { id: "c2", start: "09:40", end: "10:00", patient: "Luis Pérez", reason: "Dolor abdominal", status: "espera" },
  { id: "c3", start: "10:10", end: "10:40", patient: "María López", reason: "Control DM2", status: "confirmada" },
];

const mockAlerts = [
  { id: "a1", type: "interacción", severity: "Med", text: "Ibuprofeno + Warfarina (riesgo de sangrado)" },
  { id: "a2", type: "alergia", severity: "High", text: "Alergia a penicilina registrada" },
];

// ------ Main Médico component ------
export default function MedicoApp() {
  const [openTriage, setOpenTriage] = useState(false);
  const [triageText, setTriageText] = useState("");
  const [triageResult, setTriageResult] = useState(null);

  const agendaCols = useMemo(
    () => [
      { key: "start", header: "Inicio" },
      { key: "end", header: "Fin" },
      { key: "patient", header: "Paciente" },
      { key: "reason", header: "Motivo" },
      {
        key: "status",
        header: "Estado",
        render: (v) => <Badge tone={v === "confirmada" ? "green" : v === "espera" ? "yellow" : "gray"}>{v}</Badge>,
      },
    ],
    []
  );

  const alertCols = [
    { key: "type", header: "Tipo" },
    { key: "severity", header: "Severidad" },
    { key: "text", header: "Descripción" },
  ];

  async function runTriage() {
    // TODO: Reemplazar por POST `${API_BASE}/nlp/triage`
    const mock = {
      urgency: "med",
      specialties: ["Medicina Interna"],
      redFlags: ["dolor torácico persistente", "disnea"],
      icd10Candidates: ["R07.9", "R06.0"],
      confidence: 0.74,
    };
    setTriageResult(mock);
  }

  return (
    <div className="flex h-screen w-full bg-gray-100">
      <SidebarMedico />
      <div className="flex-1">
        <Topbar title="Panel del Médico">
          <button onClick={() => setOpenTriage(true)} className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50">
            + Triage rápido
          </button>
        </Topbar>

        <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <div className="grid grid-cols-2 gap-4">
              <StatCard title="Citas hoy" value={mockAgenda.length} />
              <StatCard title="Alertas activas" value={mockAlerts.length} />
            </div>

            <section>
              <h2 className="mb-2 text-sm font-semibold tracking-wide text-gray-600">Agenda de hoy</h2>
              <Table columns={agendaCols} data={mockAgenda} />
            </section>

            <section>
              <h2 className="mb-2 text-sm font-semibold tracking-wide text-gray-600">Alertas clínicas</h2>
              <Table columns={alertCols} data={mockAlerts} />
            </section>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700">Paciente seleccionado</h3>
              <div className="mt-2 text-sm text-gray-600">Selecciona una cita para ver el timeline clínico.</div>
              <div className="mt-3 h-48 rounded-xl border bg-gray-50 p-3 text-xs text-gray-500">
                Timeline FHIR (Observations, Encounters, Prescriptions…)
              </div>
              <button className="mt-3 w-full rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black">
                Abrir historia clínica
              </button>
            </div>

            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700">Visor de documentos</h3>
              <div className="mt-2 h-48 rounded-xl border bg-gray-50 p-3 text-xs text-gray-500">DICOM/PDF/Image viewer</div>
              <button className="mt-3 w-full rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">Subir estudio</button>
            </div>
          </div>
        </main>
      </div>

      <Modal
        open={openTriage}
        onClose={() => setOpenTriage(false)}
        title="Triage rápido con PLN"
        footer={
          <>
            <button onClick={() => setOpenTriage(false)} className="rounded-xl px-3 py-1.5 text-sm hover:bg-gray-100">
              Cancelar
            </button>
            <button
              onClick={runTriage}
              className="rounded-xl bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-black"
            >
              Analizar
            </button>
          </>
        }
      >
        <label className="block text-sm text-gray-600">Síntomas (texto libre)</label>
        <textarea
          value={triageText}
          onChange={(e) => setTriageText(e.target.value)}
          placeholder="Ej.: Dolor en el pecho desde anoche, me falta el aire al subir escaleras…"
          className="mt-1 w-full rounded-xl border p-2 text-sm focus:outline-none focus:ring"
          rows={5}
        />
        {triageResult && (
          <div className="mt-4 space-y-2 rounded-xl border bg-gray-50 p-3 text-sm">
            <div>
              Urgencia:{" "}
              <Badge tone={triageResult.urgency === "high" ? "red" : triageResult.urgency === "med" ? "yellow" : "gray"}>
                {triageResult.urgency}
              </Badge>
            </div>
            <div>Especialidades sugeridas: {triageResult.specialties.join(", ")}</div>
            <div>Red flags: {triageResult.redFlags.join(", ")}</div>
            <div>CIE‑10 candidatos: {triageResult.icd10Candidates.join(", ")}</div>
            <div className="text-xs text-gray-500">Confianza: {(triageResult.confidence * 100).toFixed(0)}%</div>
          </div>
        )}
      </Modal>
    </div>
  );
}
