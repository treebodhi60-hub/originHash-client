import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { updateProfile, logout } from '../../store/authSlice';
import { Spinner } from '../../components/Loader.jsx';
import '../../styles/admin.css';
import '../../styles/app-shell.css';

const AdminProfile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    const fd = new FormData();
    fd.append('name', name);
    await dispatch(updateProfile(fd));
    setSaving(false);
    setEditing(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  const initial = (user.name || 'A').charAt(0).toUpperCase();

  return (
    <div style={{ maxWidth: 420 }}>
      <h1 className="oh-admin-title" style={{ marginBottom: 18 }}>
        Admin profile
      </h1>

      <div className="oh-profile-card">
        <div className="oh-avatar-wrap">
          <div className="oh-avatar">{initial}</div>
          <div className="oh-profile-name">{user.name || 'Admin'}</div>
          <div className="oh-profile-mobile">
            {user.username ? `@${user.username}` : user.mobile ? `+91 ${user.mobile}` : ''}
          </div>
          <span className="oh-badge farmer">{user.isSuperAdmin ? 'Super-admin' : 'Admin'}</span>
        </div>

        <div className="oh-section-label">Account details</div>

        <div className="oh-detail-row" onClick={() => setEditing(true)}>
          <div className="oh-detail-left">
            <div className="oh-detail-icon">👤</div>
            <div>
              <div className="oh-detail-label">Full name</div>
              <div className="oh-detail-value">{user.name || 'Nil'}</div>
            </div>
          </div>
          <span style={{ color: 'var(--oh-forest)' }}>✎</span>
        </div>

        {user.username && (
          <div className="oh-detail-row">
            <div className="oh-detail-left">
              <div className="oh-detail-icon">🔑</div>
              <div>
                <div className="oh-detail-label">Username</div>
                <div className="oh-detail-value">@{user.username}</div>
              </div>
            </div>
          </div>
        )}

        {user.mobile && (
          <div className="oh-detail-row">
            <div className="oh-detail-left">
              <div className="oh-detail-icon">📞</div>
              <div>
                <div className="oh-detail-label">Mobile number</div>
                <div className="oh-detail-value">+91 {user.mobile}</div>
              </div>
            </div>
          </div>
        )}

        {editing && (
          <div className="oh-edit-inline">
            <label>Edit full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <div className="oh-edit-actions">
              <button className="oh-btn-cancel" onClick={() => setEditing(false)} type="button">
                Cancel
              </button>
              <button className="oh-btn-save" onClick={handleSave} type="button" disabled={saving}>
                {saving ? (
                  <>
                    <Spinner />
                    Saving…
                  </>
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        )}

        <div className="oh-logout-row">
          <button className="oh-btn-logout" onClick={handleLogout} type="button">
            Log out
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
