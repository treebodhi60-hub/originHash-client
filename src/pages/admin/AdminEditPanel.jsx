import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addAdmin, editAdmin } from '../../store/adminsSlice';
import { Spinner } from '../../components/Loader.jsx';
import '../../styles/admin.css';

const AdminEditPanel = ({ mode, admin, onClose }) => {
  const isAdd = mode === 'add';
  const currentUser = useSelector((s) => s.auth.user);
  const isSelf = !isAdd && admin?.id === currentUser?.id;

  const [form, setForm] = useState({
    username: admin?.username || '',
    password: '',
    name: admin?.name || '',
    email: admin?.email || '',
    isSuperAdmin: admin?.isSuperAdmin || false,
    isBlocked: admin?.isBlocked || false,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch();

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.username.trim()) {
      setError('Username is required.');
      return;
    }
    if (isAdd && !form.password) {
      setError('Password is required.');
      return;
    }
    if (form.password && form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const payload = {
      username: form.username.trim(),
      name: form.name,
      email: form.email,
      isSuperAdmin: form.isSuperAdmin,
      ...(isAdd ? {} : { isBlocked: form.isBlocked }),
      ...(form.password ? { password: form.password } : {}),
    };

    setSaving(true);
    const action = isAdd
      ? await dispatch(addAdmin(payload))
      : await dispatch(editAdmin({ id: admin.id, payload }));
    setSaving(false);

    if (action.meta.requestStatus === 'fulfilled') {
      onClose();
    } else {
      setError(action.payload || 'Something went wrong.');
    }
  };

  const initial = (form.name || form.username || '?').charAt(0).toUpperCase();

  return (
    <div className="oh-panel-backdrop" onClick={onClose}>
      <div className="oh-slide-panel" onClick={(e) => e.stopPropagation()}>
        <button className="oh-panel-close" onClick={onClose} type="button" aria-label="Close">
          ✕
        </button>

        <div className="oh-panel-header">
          <div className="oh-panel-avatar">{initial}</div>
          <div className="oh-panel-name">{isAdd ? 'Add new admin' : form.name || 'Edit admin'}</div>
          {!isAdd && <div className="oh-panel-mobile">@{form.username}</div>}
        </div>

        {error && <div className="oh-error">{error}</div>}

        <form onSubmit={handleSave}>
          <div className="oh-field">
            <label>Username</label>
            <input value={form.username} onChange={(e) => update('username', e.target.value)} placeholder="Username" />
          </div>

          <div className="oh-field">
            <label>{isAdd ? 'Password' : 'New password (optional)'}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder={isAdd ? 'Password' : 'Leave blank to keep current password'}
            />
          </div>

          <div className="oh-field">
            <label>Full name</label>
            <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Full name" />
          </div>

          <div className="oh-field">
            <label>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <label className="oh-checkbox-row">
            <input
              type="checkbox"
              checked={form.isSuperAdmin}
              disabled={isSelf}
              onChange={(e) => update('isSuperAdmin', e.target.checked)}
            />
            Super-admin (can manage other admins)
          </label>

          {!isAdd && (
            <label className="oh-checkbox-row">
              <input
                type="checkbox"
                checked={form.isBlocked}
                disabled={isSelf}
                onChange={(e) => update('isBlocked', e.target.checked)}
              />
              Blocked
            </label>
          )}

          {isSelf && <p className="oh-qr-folder-hint">You can't remove your own super-admin access or block yourself.</p>}

          <div className="oh-edit-actions" style={{ marginTop: 16 }}>
            <button className="oh-btn-cancel" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="oh-btn-save" type="submit" disabled={saving}>
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
        </form>
      </div>
    </div>
  );
};

export default AdminEditPanel;
