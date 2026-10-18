import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [reviewing, setReviewing] = useState(null);   // booking id being reviewed
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const load = () => {
    api.get("/bookings/mine").then((res) => setBookings(res.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const submitReview = async (bookingId) => {
    setMessage("");
    try {
      await api.post("/reviews", { bookingId, rating: Number(rating), comment });
      setMessage("Review submitted, thank you!");
      setReviewing(null);
      setComment("");
      load();
    } catch (err) {
      setMessage(err.response?.data?.message || "Review failed");
    }
  };

  return (
    <div style={{ maxWidth: 650, margin: "40px auto", fontFamily: "sans-serif" }}>
      <button onClick={() => navigate("/search")}>&larr; Back to search</button>
      <h1>My Bookings</h1>

      {bookings.length === 0 ? (
        <p style={{ color: "#666" }}>You have no bookings yet.</p>
      ) : (
        bookings.map((b) => (
          <div key={b._id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>{b.providerId?.bio ? b.providerId.bio.split(" - ")[0] : "Provider"}</strong>
              <span style={{
                padding: "2px 10px", borderRadius: 12, fontSize: 13,
                background: b.status === "completed" ? "#d4edda" : "#fff3cd",
              }}>{b.status}</span>
            </div>

            {b.status === "completed" && (
              <div style={{ marginTop: 10 }}>
                {reviewing === b._id ? (
                  <div>
                    <select value={rating} onChange={(e) => setRating(e.target.value)} style={{ padding: 6 }}>
                      {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} stars</option>)}
                    </select>
                    <input placeholder="Comment" value={comment} onChange={(e) => setComment(e.target.value)}
                      style={{ padding: 6, marginLeft: 8, width: 250 }} />
                    <button onClick={() => submitReview(b._id)} style={{ marginLeft: 8, padding: 6 }}>Submit</button>
                  </div>
                ) : (
                  <button onClick={() => setReviewing(b._id)} style={{ padding: 6 }}>Leave a review</button>
                )}
              </div>
            )}
          </div>
        ))
      )}
      {message && <p style={{ color: "#2a9d8f" }}>{message}</p>}
    </div>
  );
}

export default MyBookings;