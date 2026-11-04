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

function Admin() {
  const [pending, setPending] = useState([]);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const load = () => {
    api.get("/verification/pending").then((res) => setPending(res.data)).catch(() => setPending([]));
  };
  useEffect(() => { load(); }, []);

  const review = async (providerId, decision, tier) => {
    setMessage("");
    try {
      await api.patch(`/verification/${providerId}/review`, { decision, tier });
      setMessage(`Provider ${decision}.`);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Review failed");
    }
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Brand />
          <div className="nav-links">
            <span className="muted" style={{ marginRight: 8 }}>Admin</span>
            <button className="primary" onClick={logout}>Log out</button>
          </div>
        </div>
      </nav>

      <div className="page" style={{ maxWidth: 720 }}>
        <h1 className="page-title">Verification review</h1>
        <p className="lede">Review submitted documents and set each provider's verification tier.</p>

        {pending.length === 0 ? (
          <div className="empty">No providers awaiting review.</div>
        ) : (
          pending.map((p) => (
            <div className="card" key={p._id}>
              <strong style={{ fontSize: 17 }}>{p.userId?.fullName}</strong>
              <div className="muted" style={{ marginBottom: 14 }}>{p.userId?.email}</div>

              <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
                {p.identityDocument && (
                  <a className="btn btn-ghost" style={{ padding: "8px 14px", textDecoration: "none" }}
                    href={p.identityDocument} target="_blank" rel="noreferrer">
                    View identity document
                  </a>
                )}
                {p.credentialDocument && (
                  <a className="btn btn-ghost" style={{ padding: "8px 14px", textDecoration: "none" }}
                    href={p.credentialDocument} target="_blank" rel="noreferrer">
                    View credential document
                  </a>
                )}
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn btn-primary" style={{ padding: "9px 16px" }}
                  onClick={() => review(p._id, "approved", "verified")}>Approve as Verified</button>
                <button className="btn btn-dark" style={{ padding: "9px 16px" }}
                  onClick={() => review(p._id, "approved", "trusted")}>Approve as Trusted</button>
                <button className="btn btn-danger" style={{ padding: "9px 16px" }}
                  onClick={() => review(p._id, "rejected")}>Reject</button>
              </div>
            </div>
          ))
        )}
        {message && <p className="success-msg">{message}</p>}
      </div>
    </>
  );
}

export default Admin;