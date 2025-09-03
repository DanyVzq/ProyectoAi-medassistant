
import React from "react";
import { useAuth } from "./AuthProvider";
import LoginPage from "./LoginPage";
import MedicoApp from "./MedicoApp";

export default function MedicoEntry() {
  const { isAuth, login } = useAuth();
  const apiBase = import.meta.env.VITE_API_BASE || "http://localhost:8080";

  if (!isAuth) {
    return <LoginPage onSuccess={login} apiBase={apiBase} />;
  }
  return <MedicoApp />;
}
