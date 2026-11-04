import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

function Brand() {
  return (
    <div className="brand-lockup">
      <span className="brand-mark">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2.5l7 3v5c0 4.3-2.8 7.6-7 9-4.2-1.4-7-4.7-7-9v-5l7-3z" fill="#fff" fillOpacity="0.18" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/>
          <path d="M8.5 12l2.5 2.5 4.5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      <span className="brand-text">Wasaa<span className="life">Lifestyle</span></span>
    </div>
  );
}

function Account() {
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [role, setRole] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/auth/me")
      .then((res) => {
        setForm({ fullName: res.data.fullName || "", email: res.data.email || "", phone: res.data.phone || "" });
        setRole(res.data.role || "");
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setMessage("");
    setSaving(true);
    try {
      const res = await api.patch("/auth/me", form);
      // keep the stored user in sync (name shows in UI)
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setMessage("Account updated.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };
  const back = () => navigate(role === "provider" ? "/my-jobs" : "/");

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Brand />
          <div className="nav-links">
            <button onClick={back}>Back</button>
            <button className="primary" onClick={logout}>Log out</button>
          </div>
        </div>
      </nav>

      <div className="page" style={{ maxWidth: 520 }}>
        <h1 className="page-title">Account settings</h1>
        <p className="lede">Update your name and contact details.</p>

        <form onSubmit={save} className="card">
          <label className="label">Full name</label>
          <input className="input" name="fullName" value={form.fullName} onChange={handleChange} required />

          <label className="label">Email</label>
          <input className="input" name="email" type="email" value={form.email} onChange={handleChange} required />

          <label className="label">Phone</label>
          <input className="input" name="phone" value={form.phone} onChange={handleChange} required />

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
          {message && <p className="success-msg">{message}</p>}
        </form>

        {role === "provider" && (
          <div className="card" style={{ marginTop: 16 }}>
            <strong>Provider profile</strong>
            <p className="muted" style={{ margin: "6px 0 12px" }}>Edit your photo, bio and area shown to households.</p>
            <button className="btn btn-ghost" onClick={() => navigate("/edit-profile")}>Edit provider profile</button>
          </div>
        )}
      </div>
    </>
  );
}

export default Account;