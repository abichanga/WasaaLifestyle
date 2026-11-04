import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSending(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setMessage("If that email exists, a reset link has been sent. Check your inbox.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="auth-form-side" style={{ minHeight: "100vh" }}>
      <div className="auth-form">
        <div className="auth-logo">
          <span className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2.5l7 3v5c0 4.3-2.8 7.6-7 9-4.2-1.4-7-4.7-7-9v-5l7-3z" fill="#fff" fillOpacity="0.18" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/>
              <path d="M8.5 12l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="brand-text">Wasaa<span className="life">Lifestyle</span></span>
        </div>

        <h1 className="auth-title">Reset your password</h1>
        <p className="auth-sub">Enter your email and we'll send you a reset link.</p>

        <form onSubmit={submit}>
          <input className="input" type="email" placeholder="Email address"
            value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button className="btn btn-primary" type="submit" style={{ width: "100%" }} disabled={sending}>
            {sending ? "Sending..." : "Send reset link"}
          </button>
        </form>

        {message && <p className="success-msg">{message}</p>}

        <p className="muted" style={{ marginTop: 18, textAlign: "center" }}>
          <button onClick={() => navigate("/login")}
            style={{ border: "none", background: "none", color: "var(--teal)", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>
            Back to sign in
          </button>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;