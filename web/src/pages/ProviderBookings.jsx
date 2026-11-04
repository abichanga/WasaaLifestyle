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
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    api.get("/bookings/mine").then((res) => setBookings(res.data)).catch(() => {});
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
                  <div style={{ marginBottom: 6 }}><strong>Where:</strong> {b.address || "—"}</div>
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