import { useState } from "react";
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

function Verify() {
  const [identityDoc, setIdentityDoc] = useState(null);
  const [credentialDoc, setCredentialDoc] = useState(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSubmitting(true);

    const formData = new FormData();
    if (identityDoc) formData.append("identityDocument", identityDoc);
    if (credentialDoc) formData.append("credentialDocument", credentialDoc);

    try {
      await api.post("/verification/submit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Documents submitted. An admin will review them shortly.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Brand />
          <div className="nav-links">
            <button onClick={() => navigate("/my-jobs")}>My jobs</button>
            <button className="primary" onClick={logout}>Log out</button>
          </div>
        </div>
      </nav>

      <div className="page" style={{ maxWidth: 560 }}>
        <h1 className="page-title">Get verified</h1>
        <p className="lede">
          Upload your identity and credential documents. An admin will review them to confirm your verification tier, which strengthens your trust score.
        </p>

        <form onSubmit={submit} className="card">
          <div style={{ marginBottom: 20 }}>
            <label className="label">Identity document (national ID)</label>
            <input type="file" accept="image/*" onChange={(e) => setIdentityDoc(e.target.files[0])} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label className="label">Credential document (trade certificate)</label>
            <input type="file" accept="image/*" onChange={(e) => setCredentialDoc(e.target.files[0])} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit for verification"}
          </button>
          {message && <p className="success-msg">{message}</p>}
        </form>
      </div>
    </>
  );
}

export default Verify;