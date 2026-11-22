import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import StatusStepper from "../components/StatusStepper";

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

function ProviderBookings() {
  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    api.get("/bookings/mine").then((res) => setBookings(res.data)).catch(() => {});
    api.get("/providers/me/profile").then((res) => setProfile(res.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (bookingId, status) => {
    setMessage("");
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status });
      setMessage(`Booking ${status}.`);
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Update failed");
    }
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };

  const statusBadge = (status) => {
    if (status === "completed") return "trusted";
    if (status === "confirmed") return "verified";
    return "provisional";
  };

  // trust-score card built from the provider's own profile + breakdown
  const scoreCard = () => {
    if (!profile) return null;
    const ts = profile.trustScore?.value ?? 0;
    const bd = profile.breakdown || {};
    const signals = [
      { key: "completion", label: "Job completion", value: bd.completion || 0 },
      { key: "lowComplaints", label: "Low complaints", value: bd.lowComplaints || 0 },
      { key: "rating", label: "Customer rating", value: bd.rating || 0 },
      { key: "verification", label: "Verification", value: bd.verification || 0 },
    ];
    const maxPts = Math.max(...signals.map((s) => s.value), 1);

    // the weakest signal is where they can improve most
    const weakest = [...signals].sort((a, b) => a.value - b.value)[0];
    const tips = {
      completion: "Completing more of the jobs you accept will raise your score the most.",
      lowComplaints: "Avoiding complaints and low ratings will lift your score.",
      rating: "Earning higher ratings from happy customers will help your score.",
      verification: "Getting verified raises your standing with households.",
    };

    return (
      <div className="card" style={{ marginBottom: 20, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid var(--line)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 4 }}>Your trust score</div>
            <span className={`badge ${profile.verificationTier}`}>{profile.verificationTier}</span>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 46, fontWeight: 600, color: "var(--teal)", lineHeight: 1 }}>{ts}</div>
            <div className="score-cap">out of 100</div>
          </div>
        </div>
        <div style={{ padding: "18px 24px 22px" }}>
          {signals.map((s) => (
            <div className="sig" key={s.key}>
              <div className="sig-row"><span>{s.label}</span><span className="pts">{s.value} pts</span></div>
              <div className="track"><div className="fill" style={{ width: `${(s.value / maxPts) * 100}%` }} /></div>
            </div>
          ))}
          <p className="note" style={{ marginTop: 14 }}>
            <strong>To improve: </strong>{tips[weakest.key]}
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Brand />
          <div className="nav-links">
            <button onClick={() => navigate("/verify")}>Get verified</button>
            <button onClick={() => navigate("/account")}>Account</button>
            <button className="primary" onClick={logout}>Log out</button>
          </div>
        </div>
      </nav>

      <div className="page" style={{ maxWidth: 680 }}>
        <h1 className="page-title">My jobs</h1>
        <p className="lede">Respond to booking requests and mark jobs complete. Completed jobs build your trust score.</p>

        {scoreCard()}

        {bookings.length === 0 ? (
          <div className="empty">No job requests yet.</div>
        ) : (
          bookings.map((b) => (
            <div className="card" key={b._id}>
              <div className="row">
                <div style={{ cursor: "pointer", flex: 1 }} onClick={() => setExpanded(expanded === b._id ? null : b._id)}>
                  <strong>{b.householdId?.fullName || "Household"}</strong>
                  <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>
                    {b.scheduledDate ? `${b.scheduledDate} at ${b.scheduledTime}` : "No date set"} · tap for details
                  </div>
                  <StatusStepper status={b.status} />
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {b.status === "requested" && (
                    <>
                      <button className="btn btn-primary" style={{ padding: "9px 16px" }}
                        onClick={() => updateStatus(b._id, "confirmed")}>Confirm</button>
                      <button className="btn btn-danger" style={{ padding: "9px 16px" }}
                        onClick={() => {
                          if (window.confirm("Reject this booking? This cannot be undone.")) {
                            updateStatus(b._id, "rejected");
                          }
                        }}>Reject</button>
                    </>
                  )}
                  {b.status === "confirmed" && (
                    <button className="btn btn-dark" style={{ padding: "9px 16px" }}
                      onClick={() => updateStatus(b._id, "completed")}>Mark completed</button>
                  )}
                  {b.status === "completed" && <span style={{ color: "var(--teal)", fontWeight: 600 }}>✓ Completed</span>}
                </div>
              </div>

              {expanded === b._id && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)", fontSize: 14 }}>
                  <div style={{ marginBottom: 6 }}><strong>When:</strong> {b.scheduledDate || "—"} {b.scheduledTime || ""}</div>
                  <div style={{ marginBottom: 6 }}>
                    <strong>Where:</strong> {b.address || "—"}
                    {b.address && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          marginLeft: 10, display: "inline-flex", alignItems: "center", gap: 5,
                          fontSize: 13, color: "var(--teal)", fontWeight: 600, textDecoration: "none",
                        }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        Get directions
                      </a>
                    )}
                  </div>
                  <div style={{ marginBottom: 6 }}><strong>Job details:</strong> {b.notes || "None provided"}</div>
                  <div><strong>Contact:</strong> {b.householdId?.phone || "—"}</div>
                </div>
              )}
            </div>
          ))
        )}
        {message && <p className="success-msg">{message}</p>}
      </div>
    </>
  );
}

export default ProviderBookings;