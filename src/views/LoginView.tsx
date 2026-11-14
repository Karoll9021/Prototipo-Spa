import { useState } from "react";
import { FormRow, Input, PrimaryBtn } from "../components/ui";
import { Banner } from "../components/feedback";

function Logo() {
  return (
    <img src="/eko-plus-logo.png" alt="EKO+" style={{ width: "132px", height: "130px", objectFit: "contain", background: "#FFFFFF", borderRadius: "8px", padding: "2px" }} />
  );
}

export default function LoginView({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errs, setErrs] = useState<{ email?: string; password?: string }>({});
  const [failed, setFailed] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errs = {};
    if (!email.trim()) next.email = "Ingresa tu correo";
    if (!password) next.password = "Ingresa tu contraseña";
    setErrs(next);
    if (Object.keys(next).length) { setFailed(false); return; }
    // Demo: cualquier correo válido y contraseña de 6 o más caracteres
    const ok = /\S+@\S+\.\S+/.test(email) && password.length >= 6;
    setFailed(!ok);
    if (ok) onLogin();
  };

  return (
    <div className="bn-login" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "#FFFFFF" }}>
      <div className="bn-login-hero" style={{ background: "#FCE8EE", padding: "64px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Logo />
        <div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "40px", lineHeight: 1.15, fontWeight: 700, color: "#221F20", maxWidth: "440px" }}>Gestiona tus citas con calma</h1>
          <p style={{ fontSize: "17px", lineHeight: 1.5, color: "#52525B", maxWidth: "420px", marginTop: "14px" }}>Agenda, clientes, servicios y ventas del salón en un solo lugar.</p>
        </div>
        <span style={{ fontSize: "13px", color: "#52525B" }}>EKO+ · Sistema de gestión</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <form onSubmit={submit} noValidate style={{ width: "100%", maxWidth: "380px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="bn-mobile-only" style={{ marginBottom: "8px" }}><Logo /></div>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "26px", fontWeight: 700, color: "#221F20" }}>Iniciar sesión</h1>
          {failed && <Banner kind="error">Correo o contraseña incorrectos</Banner>}
          <FormRow label="Correo electrónico" error={errs.email}>
            <Input value={email} onChange={setEmail} placeholder="correo@ekoplus.co" type="email" invalid={!!errs.email} />
          </FormRow>
          <FormRow label="Contraseña" error={errs.password}>
            <Input value={password} onChange={setPassword} placeholder="••••••••" type={show ? "text" : "password"} invalid={!!errs.password} />
          </FormRow>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button type="button" onClick={() => setShow(s => !s)} style={{ border: "none", background: "transparent", color: "#B8405E", fontSize: "13px", fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: "6px 0" }}>{show ? "Ocultar contraseña" : "Mostrar contraseña"}</button>
            <button type="button" style={{ border: "none", background: "transparent", color: "#B8405E", fontSize: "13px", fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: "6px 0" }}>¿Olvidaste tu contraseña?</button>
          </div>
          <button type="submit" style={{ background: "#B8405E", color: "#FFFFFF", border: "none", borderRadius: "10px", minHeight: "44px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>Iniciar sesión</button>
          <p style={{ fontSize: "12px", color: "#52525B" }}>Demo: cualquier correo válido y contraseña de 6 o más caracteres.</p>
        </form>
      </div>
    </div>
  );
}
