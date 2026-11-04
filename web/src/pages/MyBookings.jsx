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

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [reviewing, setReviewing] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    api.get("/bookings/mine").then((res) => setBookings(res.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const submitReview = async (bookingId) => {
    setMessage("");
    try {
      await api.post("/reviews", { bookingId, rating: Number(rating), comment });
      setMessage("Review submitted, thank you.");
      setReviewing(null);
      setComment("");
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Review failed");
    }
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };

  const statusBadge = (status) => {
    if (status === "completed") return "trusted";
    if (status === "confirmed") return "verified";
    if (status === "rejected") return "provisional";
    return "provisional";
  };

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Brand />
          <div className="nav-links">
            <button onClick={() => navigate("/search")}>Search</button>
            <button onClick={() => navigate("/account")}>Account</button>
            <button className="primary" onClick={logout}>Log out</button>
          </div>
        </div>
      </nav>

      <div className="page" style={{ maxWidth: 680 }}>
        <h1 className="page-title">My bookings</h1>
        <p className="lede">Track your requests and review completed jobs.</p>

        {bookings.length === 0 ? (
          <div className="empty">You have no bookings yet.</div>
        ) : (
          bookings.map((b) => (
            <div className="card" key={b._id}>
              <div className="row" style={{ cursor: "pointer" }}
                onClick={() => setExpanded(expanded === b._id ? null : b._id)}>
                <div style={{ flex: 1 }}>
                  <strong>{b.providerId?.bio ? b.providerId.bio.split(" - ")[0] : "Provider"}</strong>
                  <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>
                    {b.scheduledDate ? `${b.scheduledDate} at ${b.scheduledTime}` : "No date set"}
                  </div>
                  <StatusStepper status={b.status} />
                </div>
              </div>

              {expanded === b._id && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)", fontSize: 14 }}>
                  <div style={{ marginBottom: 6 }}><strong>Date & time:</strong> {b.scheduledDate || "—"} {b.scheduledTime || ""}</div>
                  <div style={{ marginBottom: 6 }}><strong>Address:</strong> {b.address || "—"}</div>
                  <div style={{ marginBottom: 6 }}><strong>Job details:</strong> {b.notes || "None provided"}</div>
                  <div><strong>Status:</strong> {b.status}</div>
                </div>
              )}

              {b.status === "completed" && (
                <div style={{ marginTop: 14 }}>
                  {reviewing === b._id ? (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      <select className="select" value={rating} onChange={(e) => setRating(e.target.value)}
                        style={{ width: "auto", marginBottom: 0 }}>
                        {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} stars</option>)}
                      </select>
                      <input className="input" placeholder="Add a comment (optional)" value={comment}
                        onChange={(e) => setComment(e.target.value)} style={{ flex: 1, minWidth: 180, marginBottom: 0 }} />
                      <button className="btn btn-primary" style={{ padding: "10px 18px" }}
                        onClick={() => submitReview(b._id)}>Submit</button>
                    </div>
                  ) : (
                    <button className="btn btn-ghost" style={{ padding: "8px 16px" }}
                      onClick={() => setReviewing(b._id)}>Leave a review</button>
                  )}
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

export default MyBookings;