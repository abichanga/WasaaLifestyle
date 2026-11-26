import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import StatusStepper from "../components/StatusStepper";

// chip options shown based on the rating
const POSITIVE_CHIPS = ["On time", "Professional", "Quality work", "Fair price", "Clean & tidy", "Would rebook"];
const NEGATIVE_CHIPS = ["Arrived late", "Poor workmanship", "Overpriced", "Unprofessional", "Didn't finish", "No-show"];

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
  const [selectedTags, setSelectedTags] = useState([]);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    api.get("/bookings/mine").then((res) => setBookings(res.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  // which chips to show depends on the rating
  const chips = rating >= 4 ? POSITIVE_CHIPS : NEGATIVE_CHIPS;

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const startReview = (bookingId) => {
    setReviewing(bookingId);
    setRating(5);
    setSelectedTags([]);
    setComment("");
  };

  const submitReview = async (bookingId) => {
    setMessage("");
    try {
      await api.post("/reviews", {
        bookingId,
        rating: Number(rating),
        comment,
        tags: selectedTags,
      });
      setMessage("Review submitted, thank you.");
      setReviewing(null);
      setSelectedTags([]);
      setComment("");
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Review failed");
    }
  };

  // household confirms the provider really finished (or sends it back)
  const confirmCompletion = async (bookingId, confirmed) => {
    setMessage("");
    try {
      await api.patch(`/bookings/${bookingId}/confirm-completion`, { confirmed });
      setMessage(confirmed
        ? "Thanks for confirming. You can now leave a review."
        : "Okay, we've let the provider know the job isn't finished.");
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Could not update booking");
    }
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };

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

              {b.status === "awaiting_household" && (
                <div style={{ marginTop: 14, padding: 14, borderRadius: 10, background: "var(--teal-soft, #e6f4f1)" }}>
                  <div style={{ fontSize: 14, marginBottom: 10 }}>
                    The provider says this job is done. Was it completed?
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn btn-primary" style={{ padding: "9px 16px" }}
                      onClick={() => confirmCompletion(b._id, true)}>Yes, it's done</button>
                    <button className="btn btn-ghost" style={{ padding: "9px 16px" }}
                      onClick={() => {
                        if (window.confirm("Tell the provider the job isn't finished yet?")) {
                          confirmCompletion(b._id, false);
                        }
                      }}>Not yet</button>
                  </div>
                </div>
              )}

              {b.status === "completed" && (
                <div style={{ marginTop: 14 }}>
                  {reviewing === b._id ? (
                    <div>
                      {/* star rating */}
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 13, color: "var(--ink-soft)", display: "block", marginBottom: 6 }}>
                          How was it?
                        </label>
                        <select className="select" value={rating} onChange={(e) => { setRating(e.target.value); setSelectedTags([]); }}
                          style={{ width: "auto", marginBottom: 0 }}>
                          {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} stars</option>)}
                        </select>
                      </div>

                      {/* rating-aware chips */}
                      <div style={{ marginBottom: 12 }}>
                        <label style={{ fontSize: 13, color: "var(--ink-soft)", display: "block", marginBottom: 8 }}>
                          {rating >= 4 ? "What went well?" : "What went wrong?"}
                        </label>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {chips.map((tag) => {
                            const active = selectedTags.includes(tag);
                            return (
                              <button key={tag} type="button" onClick={() => toggleTag(tag)}
                                style={{
                                  padding: "7px 14px",
                                  borderRadius: 999,
                                  border: active ? "1.5px solid var(--teal)" : "1.5px solid var(--line)",
                                  background: active ? "var(--teal-soft, #e6f4f1)" : "#fff",
                                  color: active ? "var(--teal-deep, var(--teal))" : "var(--ink)",
                                  fontSize: 13,
                                  cursor: "pointer",
                                  fontWeight: active ? 600 : 400,
                                }}>
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* optional comment */}
                      <input className="input" placeholder="Add a note (optional)" value={comment}
                        onChange={(e) => setComment(e.target.value)} style={{ marginBottom: 10 }} />

                      <div style={{ display: "flex", gap: 8 }}>
                        <button className="btn btn-primary" style={{ padding: "10px 18px" }}
                          onClick={() => submitReview(b._id)}>Submit review</button>
                        <button className="btn btn-ghost" style={{ padding: "10px 18px" }}
                          onClick={() => setReviewing(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button className="btn btn-ghost" style={{ padding: "8px 16px" }}
                      onClick={() => startReview(b._id)}>Leave a review</button>
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