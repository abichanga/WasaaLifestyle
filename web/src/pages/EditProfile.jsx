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

function EditProfile() {
  const [bio, setBio] = useState("");
  const [area, setArea] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [currentPhoto, setCurrentPhoto] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // load the provider's current profile
  useEffect(() => {
    api.get("/providers/me/profile")
      .then((res) => {
        setBio(res.data.bio || "");
        setArea(res.data.area || "");
        setCurrentPhoto(res.data.photo || "");
        setName(res.data.userId?.fullName || "");
      })
      .catch(() => {});
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setMessage("");
    setSaving(true);

    const formData = new FormData();
    formData.append("bio", bio);
    formData.append("area", area);
    if (photoFile) formData.append("photo", photoFile);

    try {
      await api.patch("/providers/me/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Profile saved.");
      // refresh the shown photo if a new one was uploaded
      const res = await api.get("/providers/me/profile");
      setCurrentPhoto(res.data.photo || "");
      setPhotoFile(null);
    } catch (err) {
      setMessage(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const logout = () => { localStorage.clear(); navigate("/login"); };

  // preview the newly chosen photo, or show the current one
  const photoPreview = photoFile ? URL.createObjectURL(photoFile) : currentPhoto;

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
        <h1 className="page-title">Edit your profile</h1>
        <p className="lede">This is what households see when they view you. A clear photo and bio build trust.</p>

        <form onSubmit={save} className="card">
          {/* photo */}
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 22 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", overflow: "hidden", background: "var(--teal-wash)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              {photoPreview
                ? <img src={photoPreview} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--teal-deep)" }}>{name ? name[0] : "?"}</span>}
            </div>
            <div>
              <label className="label">Profile photo</label>
              <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} />
            </div>
          </div>

          <label className="label">Area</label>
          <input className="input" placeholder="e.g. Westlands" value={area} onChange={(e) => setArea(e.target.value)} />

          <label className="label">Bio</label>
          <textarea className="input" rows={4} placeholder="Tell households about your experience and specialties"
            value={bio} onChange={(e) => setBio(e.target.value)} style={{ resize: "vertical", fontFamily: "inherit" }} />

          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </button>
          {message && <p className="success-msg">{message}</p>}
        </form>
      </div>
    </>
  );
}

export default EditProfile;