// import { useState, useRef } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate } from 'react-router-dom';
// import BottomNav from '../components/BottomNav.jsx';
// import { updateProfile, logout } from '../store/authSlice';
// import '../styles/app-shell.css';

// const USER_TYPES = [
//   { value: 'farmer', label: 'Farmer' },
//   { value: 'retailer', label: 'Retailer' },
//   { value: 'distributor', label: 'Distributor' },
//   { value: 'supplier', label: 'Supplier' },
// ];

// const FIELDS = [
//   { key: 'name', label: 'Full name', icon: '👤', placeholder: 'Nil' },
//   { key: 'mobile', label: 'Mobile number', icon: '📞', readOnly: true },
//   { key: 'userType', label: 'User type', icon: '🧑‍🌾', placeholder: 'Nil', isSelect: true },
//   { key: 'email', label: 'Email', icon: '✉️', placeholder: 'Nil' },
//   { key: 'address', label: 'Address (optional)', icon: '📍', placeholder: 'Nil' },
// ];

// const Profile = () => {
//   const { user } = useSelector((state) => state.auth);
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const fileInputRef = useRef(null);

//   const [editingField, setEditingField] = useState(null);
//   const [draft, setDraft] = useState('');
//   const [saving, setSaving] = useState(false);

//   if (!user) return null;

//   const startEdit = (field) => {
//     if (field.readOnly) return;
//     setEditingField(field.key);
//     setDraft(user[field.key] || '');
//   };

//   const cancelEdit = () => {
//     setEditingField(null);
//     setDraft('');
//   };

//   const saveEdit = async () => {
//     setSaving(true);
//     const fd = new FormData();
//     fd.append(editingField, draft);
//     const result = await dispatch(updateProfile(fd));
//     setSaving(false);
//     if (updateProfile.fulfilled.match(result)) {
//       cancelEdit();
//     }
//   };

//   const handlePhotoChange = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     const fd = new FormData();
//     fd.append('photo', file);
//     await dispatch(updateProfile(fd));
//   };

//   const handleLogout = () => {
//     dispatch(logout());
//     navigate('/login', { replace: true });
//   };

//   const initial = (user.name || user.mobile || '?').charAt(0).toUpperCase();

//   return (
//     <div className="oh-mobile-shell">
//       <div className="oh-mobile-content">
//         <div className="oh-profile-card">
//           <div className="oh-avatar-wrap">
//             <div className="oh-avatar">
//               {user.photoUrl ? <img src={user.photoUrl} alt={user.name || 'Profile'} /> : initial}
//               <div className="oh-avatar-cam" onClick={() => fileInputRef.current?.click()}>
//                 📷
//               </div>
//               <input
//                 ref={fileInputRef}
//                 type="file"
//                 accept="image/*"
//                 style={{ display: 'none' }}
//                 onChange={handlePhotoChange}
//               />
//             </div>
//             <div className="oh-profile-name">{user.name || 'Nil'}</div>
//             <div className="oh-profile-mobile">+91 {user.mobile}</div>
//             {user.userType && <span className={`oh-badge ${user.userType}`}>{user.userType}</span>}
//           </div>

//           <div className="oh-section-label">Account details — tap a row to edit</div>

//           {FIELDS.map((field) => {
//             const value = field.key === 'mobile' ? `+91 ${user.mobile}` : user[field.key];
//             return (
//               <div key={field.key}>
//                 <div className="oh-detail-row" onClick={() => startEdit(field)}>
//                   <div className="oh-detail-left">
//                     <div className="oh-detail-icon">{field.icon}</div>
//                     <div style={{ minWidth: 0 }}>
//                       <div className="oh-detail-label">{field.label}</div>
//                       <div className={`oh-detail-value ${!value ? 'empty' : ''}`}>
//                         {value || field.placeholder || 'Nil'}
//                       </div>
//                     </div>
//                   </div>
//                   {!field.readOnly && <span style={{ color: 'var(--oh-forest)' }}>✎</span>}
//                 </div>

//                 {editingField === field.key && (
//                   <div className="oh-edit-inline">
//                     <label>Edit {field.label.toLowerCase()}</label>
//                     {field.isSelect ? (
//                       <select value={draft} onChange={(e) => setDraft(e.target.value)}>
//                         <option value="">Select category</option>
//                         {USER_TYPES.map((t) => (
//                           <option key={t.value} value={t.value}>
//                             {t.label}
//                           </option>
//                         ))}
//                       </select>
//                     ) : (
//                       <input
//                         type={field.key === 'email' ? 'email' : 'text'}
//                         value={draft}
//                         onChange={(e) => setDraft(e.target.value)}
//                         autoFocus
//                       />
//                     )}
//                     <div className="oh-edit-actions">
//                       <button className="oh-btn-cancel" onClick={cancelEdit} type="button">
//                         Cancel
//                       </button>
//                       <button className="oh-btn-save" onClick={saveEdit} type="button" disabled={saving}>
//                         {saving ? 'Saving…' : 'Save'}
//                       </button>
//                     </div>
//                   </div>
//                 )}
//               </div>
//             );
//           })}

//           <div className="oh-logout-row">
//             <button className="oh-btn-logout" onClick={handleLogout} type="button">
//               Log out
//             </button>
//           </div>
//         </div>
//       </div>
//       <BottomNav />
//     </div>
//   );
// };

// export default Profile;

import { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import BottomNav from "../components/BottomNav.jsx";
import { updateProfile, logout } from "../store/authSlice";
import "../styles/app-shell.css";

const USER_TYPES = [
  { value: "farmer", label: "Farmer" },
  { value: "retailer", label: "Retailer" },
  { value: "distributor", label: "Distributor" },
  { value: "supplier", label: "Supplier" },
];

const FIELDS = [
  { key: "name", label: "Full name", icon: "👤", placeholder: "Nil" },
  { key: "mobile", label: "Mobile number", icon: "📞", readOnly: true },
  {
    key: "userType",
    label: "User type",
    icon: "🧑‍🌾",
    placeholder: "Nil",
    isSelect: true,
  },
  { key: "email", label: "Email", icon: "✉️", placeholder: "Nil" },
  {
    key: "address",
    label: "Address (optional)",
    icon: "📍",
    placeholder: "Nil",
  },
];

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [editingField, setEditingField] = useState(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoError, setPhotoError] = useState("");

  if (!user) return null;

  const startEdit = (field) => {
    if (field.readOnly) return;
    setEditingField(field.key);
    setDraft(user[field.key] || "");
  };

  const cancelEdit = () => {
    setEditingField(null);
    setDraft("");
  };

  const saveEdit = async () => {
    setSaving(true);
    const fd = new FormData();
    fd.append(editingField, draft);
    const result = await dispatch(updateProfile(fd));
    setSaving(false);
    if (updateProfile.fulfilled.match(result)) {
      cancelEdit();
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;

    setPhotoError("");
    setPhotoSaving(true);
    const fd = new FormData();
    fd.append("photo", file);
    const result = await dispatch(updateProfile(fd));
    setPhotoSaving(false);

    if (updateProfile.rejected.match(result)) {
      setPhotoError(result.payload || "Could not update profile photo.");
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  const initial = (user.name || user.mobile || "?").charAt(0).toUpperCase();

  return (
    <div className="oh-mobile-shell">
      <div className="oh-mobile-content">
        <div style={{ maxWidth: 420, margin: "0 auto" }}>
          <h1 className="oh-admin-title" style={{ marginBottom: 18 }}>
            My profile
          </h1>

          <div className="oh-profile-card">
            <div className="oh-avatar-wrap">
              <div className="oh-avatar">
                {user.photoUrl ? (
                  <img src={user.photoUrl} alt={user.name || "Profile"} />
                ) : (
                  initial
                )}
                <div
                  className="oh-avatar-cam"
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  aria-label="Change profile photo"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  {photoSaving ? "…" : "📷"}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handlePhotoChange}
                />
              </div>
              <div className="oh-profile-name">{user.name || "Nil"}</div>
              <div className="oh-profile-mobile">+91 {user.mobile}</div>
              {user.userType && (
                <span className={`oh-badge ${user.userType}`}>
                  {user.userType}
                </span>
              )}
              {photoError && <div className="oh-error">{photoError}</div>}
            </div>

            <div className="oh-section-label">
              Account details — tap a row to edit
            </div>

            {FIELDS.map((field) => {
              const value =
                field.key === "mobile" ? `+91 ${user.mobile}` : user[field.key];
              return (
                <div key={field.key}>
                  <div
                    className="oh-detail-row"
                    onClick={() => startEdit(field)}
                  >
                    <div className="oh-detail-left">
                      <div className="oh-detail-icon">{field.icon}</div>
                      <div style={{ minWidth: 0 }}>
                        <div className="oh-detail-label">{field.label}</div>
                        <div
                          className={`oh-detail-value ${!value ? "empty" : ""}`}
                        >
                          {value || field.placeholder || "Nil"}
                        </div>
                      </div>
                    </div>
                    {!field.readOnly && (
                      <span style={{ color: "var(--oh-forest)" }}>✎</span>
                    )}
                  </div>

                  {editingField === field.key && (
                    <div className="oh-edit-inline">
                      <label>Edit {field.label.toLowerCase()}</label>
                      {field.isSelect ? (
                        <select
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                        >
                          <option value="">Select category</option>
                          {USER_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.key === "email" ? "email" : "text"}
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          autoFocus
                        />
                      )}
                      <div className="oh-edit-actions">
                        <button
                          className="oh-btn-cancel"
                          onClick={cancelEdit}
                          type="button"
                        >
                          Cancel
                        </button>
                        <button
                          className="oh-btn-save"
                          onClick={saveEdit}
                          type="button"
                          disabled={saving}
                        >
                          {saving ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="oh-logout-row">
              <button
                className="oh-btn-logout"
                onClick={handleLogout}
                type="button"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;