import React, { useEffect, useMemo, useState } from "react";
import { loadProfile, saveProfile, sendSymptomMessage } from "./api";

const cx = (...c) => c.filter(Boolean).join(" ");

function Topbar() {
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="font-semibold tracking-tight">AI‑MedAssistant — Paciente</div>
        <div className="text-xs text-gray-500">Versión demo (sin IA)</div>
      </div>
    </header>
  );
}

function Sidebar({ current, onSelect }) {
  const items = [
    { key: "chat", label: "Chat de Síntomas", icon: "💬" },
    { key: "perfil", label: "Mi Perfil", icon: "👤" },
    { key: "resumen", label: "Resumen", icon: "📄" },
  ];
  return (
    <aside className="hidden h-screen border-r bg-white/70 p-3 md:block md:w-64">
      <div className="mb-4 px-2 text-sm text-gray-500">Paciente</div>
      <nav className="space-y-1">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => onSelect(it.key)}
            className={cx(
              "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-gray-100",
              current === it.key && "bg-gray-900 text-white hover:bg-gray-900"
            )}
          >
            <span className="text-lg">{it.icon}</span>
            <span className="font-medium">{it.label}</span>
          </button>
        ))}
      </nav>
      <div className="mt-6 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
        <div className="font-semibold">Accesos</div>
        <a className="mt-2 block hover:underline" href="http://localhost:5173" target="_blank">Portal Médico</a>
        <a className="block hover:underline" href="http://localhost:5174" target="_blank">Portal Admin</a>
      </div>
    </aside>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </div>
  );
}

function Chips({ items, onRemove }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((t, i) => (
        <span key={i} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs">
          {t}
          <button onClick={() => onRemove(i)} className="rounded px-1 hover:bg-gray-200">✕</button>
        </span>
      ))}
      {items.length === 0 && <span className="text-xs text-gray-500">Sin datos</span>}
    </div>
  );
}

function ProfileCard({ profile, setProfile, onSave }) {
  const [allergyInput, setAllergyInput] = useState("");

  const bmi = useMemo(() => {
    const w = parseFloat(profile.weightKg || 0);
    const h = parseFloat(profile.heightCm || 0) / 100;
    if (!w || !h) return null;
    return (w / (h * h)).toFixed(1);
  }, [profile.weightKg, profile.heightCm]);

  function addAllergy(e) {
    e.preventDefault();
    const v = allergyInput.trim();
    if (!v) return;
    setProfile((p) => ({ ...p, allergies: [...(p.allergies || []), v] }));
    setAllergyInput("");
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm font-semibold text-gray-700">Datos básicos</div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600">Nombre</label>
          <input className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={profile.name || ""} onChange={(e)=>setProfile(p=>({...p, name:e.target.value}))}/>
        </div>
        <div>
          <label className="text-xs text-gray-600">Edad</label>
          <input type="number" min="0" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={profile.age || ""} onChange={(e)=>setProfile(p=>({...p, age:e.target.value}))}/>
        </div>
        <div>
          <label className="text-xs text-gray-600">Sexo</label>
          <select className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={profile.sex || ""} onChange={(e)=>setProfile(p=>({...p, sex:e.target.value}))}>
            <option value="">Selecciona</option>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
            <option value="O">Otro</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600">Tipo de sangre</label>
          <select className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={profile.bloodType || ""} onChange={(e)=>setProfile(p=>({...p, bloodType:e.target.value}))}>
            <option value="">Selecciona</option>
            {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map((t)=>(<option key={t} value={t}>{t}</option>))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600">Peso (kg)</label>
          <input type="number" step="0.1" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={profile.weightKg || ""} onChange={(e)=>setProfile(p=>({...p, weightKg:e.target.value}))}/>
        </div>
        <div>
          <label className="text-xs text-gray-600">Altura (cm)</label>
          <input type="number" step="0.1" className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={profile.heightCm || ""} onChange={(e)=>setProfile(p=>({...p, heightCm:e.target.value}))}/>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-600">Alergias</label>
          <form onSubmit={addAllergy} className="mt-1 flex items-center gap-2">
            <input className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="Ej. penicilina" value={allergyInput} onChange={(e)=>setAllergyInput(e.target.value)} />
            <button className="rounded-xl border px-3 py-2 text-sm hover:bg-gray-50">Agregar</button>
          </form>
          <Chips items={profile.allergies || []} onRemove={(i)=>setProfile(p=>({...p, allergies: p.allergies.filter((_,idx)=>idx!==i)}))} />
        </div>
        <div>
          <label className="text-xs text-gray-600">Medicamentos actuales</label>
          <textarea rows={3} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={profile.meds || ""} onChange={(e)=>setProfile(p=>({...p, meds:e.target.value}))} placeholder="Nombres y dosis..." />
        </div>
        <div>
          <label className="text-xs text-gray-600">Padecimientos previos</label>
          <textarea rows={3} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm" value={profile.conditions || ""} onChange={(e)=>setProfile(p=>({...p, conditions:e.target.value}))} placeholder="Diabetes, hipertensión, etc." />
        </div>
        <div className="rounded-xl border bg-gray-50 p-3">
          <div className="text-xs text-gray-600">IMC estimado</div>
          <div className="mt-1 text-2xl font-semibold">{bmi || "—"}</div>
          <div className="mt-1 text-xs text-gray-500">Se calcula con peso/altura²</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {profile.updatedAt ? `Última actualización: ${new Date(profile.updatedAt).toLocaleString()}` : "Sin guardar"}
        </div>
        <button onClick={onSave} className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black">
          Guardar
        </button>
      </div>
    </div>
  );
}

function ChatBox({ messages, onSend }) {
  const [text, setText] = useState("");

  function send(e) {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    onSend(v);
    setText("");
  }

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="mb-2 text-sm font-semibold text-gray-700">Chat de síntomas</div>
      <div className="h-96 overflow-y-auto rounded-xl border bg-gray-50 p-3">
        {messages.length === 0 && (
          <div className="text-sm text-gray-500">Cuéntame cómo te sientes hoy. Ej.: “Tengo dolor de cabeza desde ayer, me arden los ojos”.</div>
        )}
        <div className="space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={m.from === "user" ? "text-right" : "text-left"}>
              <div className={
                "inline-block max-w-[80%] rounded-2xl px-3 py-2 text-sm " +
                (m.from === "user" ? "bg-gray-900 text-white" : "bg-white border")
              }>
                {m.text}
              </div>
              <div className="mt-1 text-[10px] text-gray-500">{new Date(m.time).toLocaleTimeString()}</div>
            </div>
          ))}
        </div>
      </div>
      <form onSubmit={send} className="mt-3 flex items-center gap-2">
        <input
          className="flex-1 rounded-xl border px-3 py-2 text-sm"
          placeholder="Escribe tus síntomas aquí..."
          value={text}
          onChange={(e)=>setText(e.target.value)}
        />
        <button className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black">Enviar</button>
      </form>
    </div>
  );
}

export default function PatientApp() {
  const [tab, setTab] = useState("chat");
  const [profile, setProfile] = useState({
    name: "",
    age: "",
    sex: "",
    weightKg: "",
    heightCm: "",
    bloodType: "",
    allergies: [],
    meds: "",
    conditions: "",
    updatedAt: null,
  });
  const [messages, setMessages] = useState([]);
  const [savedToast, setSavedToast] = useState("");

  useEffect(() => {
    const p = loadProfile();
    if (p) setProfile(p);
  }, []);

  function handleSend(text) {
    const now = Date.now();
    const userMsg = { id: "u-" + now, from: "user", text, time: now };
    // Respuesta mock inmediata (sin IA)
    const botMsg = {
      id: "b-" + now,
      from: "bot",
      text:
        "Gracias por compartirlo. Tu mensaje quedó registrado para revisión. " +
        "Si agregas duración (días/horas), intensidad (1–10) y ubicación del dolor, mejor.",
      time: now
    };
    setMessages((arr) => [...arr, userMsg, botMsg]);
    sendSymptomMessage(text);
  }

  function handleSave() {
    saveProfile(profile);
    setSavedToast("Guardado ✓");
    setTimeout(() => setSavedToast(""), 1500);
  }

  return (
    <div className="flex h-screen w-full bg-gray-100">
      <Sidebar current={tab} onSelect={setTab} />
      <div className="flex-1">
        <Topbar />
        <main className="mx-auto max-w-7xl px-4 py-6">
          {savedToast && (
            <div className="mb-3 rounded-xl border bg-green-50 px-3 py-2 text-sm text-green-700 shadow-sm">
              {savedToast}
            </div>
          )}

          {tab === "chat" && (
            <div className="grid gap-6 md:grid-cols-3">
              <div className="md:col-span-2">
                <ChatBox messages={messages} onSend={handleSend} />
              </div>
              <div className="space-y-4">
                <div className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="mb-2 text-sm font-semibold text-gray-700">Datos de perfil (solo lectura)</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Nombre: </span>{profile.name || "—"}</div>
                    <div><span className="text-gray-500">Edad: </span>{profile.age || "—"}</div>
                    <div><span className="text-gray-500">Sexo: </span>{profile.sex || "—"}</div>
                    <div><span className="text-gray-500">Tipo de sangre: </span>{profile.bloodType || "—"}</div>
                    <div><span className="text-gray-500">Peso: </span>{profile.weightKg ? `${profile.weightKg} kg` : "—"}</div>
                    <div><span className="text-gray-500">Altura: </span>{profile.heightCm ? `${profile.heightCm} cm` : "—"}</div>
                    <div className="col-span-2"><span className="text-gray-500">Alergias: </span>{(profile.allergies||[]).join(", ") || "—"}</div>
                  </div>
                </div>
                <div className="rounded-2xl border bg-white p-4 text-xs text-gray-600 shadow-sm">
                  * El chat es demostrativo. Más adelante se conectará con IA/triage.
                </div>
              </div>
            </div>
          )}

          {tab === "perfil" && (
            <ProfileCard profile={profile} setProfile={setProfile} onSave={handleSave} />
          )}

          {tab === "resumen" && (
            <div className="grid gap-6 md:grid-cols-3">
              <Stat label="Consultas" value="—" hint="Próximamente" />
              <Stat label="Estudios" value="—" hint="Próximamente" />
              <Stat label="Recetas" value="—" hint="Próximamente" />
              <div className="md:col-span-3 rounded-2xl border bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-gray-700">Resumen</div>
                <p className="mt-2 text-sm text-gray-600">
                  Aquí verás un resumen de tus datos, citas, resultados y recomendaciones.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
