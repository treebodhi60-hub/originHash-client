import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { addUser, editUser } from '../../store/usersSlice';
import { Spinner } from '../../components/Loader.jsx';
import '../../styles/admin.css';

const USER_TYPES = [
  { value: '', label: 'Select category' },
  { value: 'farmer', label: 'Farmer' },
  { value: 'retailer', label: 'Retailer' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'supplier', label: 'Supplier' },
];

const UserEditPanel = ({ mode, user, onClose }) => {
  const isAdd = mode === 'add';
  const [form, setForm] = useState({
    mobile: user?.mobile || '',
    name: user?.name || '',
    email: user?.email || '',
    userType: user?.userType || '',
    address: user?.address || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch();

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (!/^[6-9]\d{9}$/.test(form.mobile)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }

    setSaving(true);
    const action = isAdd
      ? await dispatch(addUser(form))
      : await dispatch(editUser({ id: user.id, payload: form }));
    setSaving(false);

    if (action.meta.requestStatus === 'fulfilled') {
      onClose();
    } else {
      setError(action.payload || 'Something went wrong.');
    }
  };

  const initial = (form.name || form.mobile || '?').charAt(0).toUpperCase();

  return (
    <div className="oh-panel-backdrop" onClick={onClose}>
      <div className="oh-slide-panel" onClick={(e) => e.stopPropagation()}>
        <button className="oh-panel-close" onClick={onClose} type="button" aria-label="Close">
          ✕
        </button>

        <div className="oh-panel-header">
          <div className="oh-panel-avatar">{initial}</div>
          <div className="oh-panel-name">{isAdd ? 'Add new user' : form.name || 'Edit user'}</div>
          {!isAdd && <div className="oh-panel-mobile">+91 {form.mobile}</div>}
        </div>

        {error && <div className="oh-error">{error}</div>}

        <form onSubmit={handleSave}>
          <div className="oh-field">
            <label>Full name</label>
            <input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Full name" />
          </div>

          <div className="oh-field">
            <label>Mobile number</label>
            <div className="oh-mobile-input">
              <span className="oh-code">+91</span>
              <input
                value={form.mobile}
                disabled={!isAdd}
                maxLength={10}
                onChange={(e) => update('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit number"
              />
            </div>
          </div>

          <div className="oh-field">
            <label>User type</label>
            <select value={form.userType} onChange={(e) => update('userType', e.target.value)}>
              {USER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
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

          <div className="oh-field">
            <label>Address (optional)</label>
            <input value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Address" />
          </div>

          <div className="oh-edit-actions" style={{ marginTop: 8 }}>
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

export default UserEditPanel;
