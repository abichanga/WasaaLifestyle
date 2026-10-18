import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

function ProviderBookings() {
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");
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

  return (
    <div style={{ maxWidth: 650, margin: "40px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>My Jobs</h1>
        <button onClick={logout}>Log out</button>
      </div>

      {bookings.length === 0 ? (
        <p style={{ color: "#666" }}>No job requests yet.</p>
      ) : (
        bookings.map((b) => (
          <div key={b._id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>{b.householdId?.fullName || "Household"}</strong>
                <div style={{ fontSize: 13, color: "#666" }}>Status: {b.status}</div>
              </div>
              <div>
                {b.status === "requested" && (
                  <>
                    <button onClick={() => updateStatus(b._id, "confirmed")} style={{ padding: 6, marginRight: 6 }}>Confirm</button>
                    <button onClick={() => updateStatus(b._id, "rejected")} style={{ padding: 6 }}>Reject</button>
                  </>
                )}
                {b.status === "confirmed" && (
                  <button onClick={() => updateStatus(b._id, "completed")} style={{ padding: 6, background: "#2a9d8f", color: "white", border: "none", borderRadius: 4 }}>Mark completed</button>
                )}
                {b.status === "completed" && <span style={{ color: "#2a9d8f" }}>✓ Completed</span>}
              </div>
            </div>
          </div>
        ))
      )}
      {message && <p style={{ color: "#2a9d8f" }}>{message}</p>}
    </div>
  );
}

export default ProviderBookings;