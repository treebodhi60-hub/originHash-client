import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import BrandPanel from '../components/BrandPanel.jsx';
import { updateProfile, skipOnboarding } from '../store/authSlice';
import '../styles/auth.css';

const USER_TYPES = [
  { value: 'farmer', label: 'Farmer', emoji: '🌾' },
  { value: 'retailer', label: 'Retailer', emoji: '🏪' },
  { value: 'distributor', label: 'Distributor', emoji: '🚚' },
  { value: 'supplier', label: 'Supplier', emoji: '📦' },
];

const Onboarding = () => {
  const [form, setForm] = useState({ name: '', email: '', userType: '', address: '' });
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Please enter your name, or tap Skip for now.');
      return;
    }

    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('email', form.email);
    fd.append('userType', form.userType);
    fd.append('address', form.address);
    if (photo) fd.append('photo', photo);

    setSubmitting(true);
    const result = await dispatch(updateProfile(fd));
    setSubmitting(false);
    if (updateProfile.fulfilled.match(result)) {
      navigate('/home', { replace: true });
    } else {
      setError(result.payload || 'Could not save your details.');
    }
  };

  const handleSkip = async () => {
    await dispatch(skipOnboarding());
    navigate('/home', { replace: true });
  };

  return (
    <div className="oh-auth-shell">
      <BrandPanel />
      <div className="oh-form-panel">
        <div className="oh-auth-card">
          <h2 className="oh-auth-heading">Create your account</h2>
          <p className="oh-auth-sub">Start verifying and tracking products</p>

          {error && <div className="oh-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="oh-field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
              />
            </div>

            <div className="oh-field">
              <label>Mobile number</label>
              <div className="oh-mobile-input">
                <span className="oh-code">+91</span>
                <input value={user?.mobile || ''} disabled />
              </div>
            </div>

            <div className="oh-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
              />
            </div>

            <div className="oh-field">
              <label>I am a</label>
              <div className="oh-user-type-grid">
                {USER_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={`oh-user-type-option ${form.userType === t.value ? 'active' : ''}`}
                    onClick={() => update('userType', t.value)}
                  >
                    <span className="oh-emoji">{t.emoji}</span> {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="oh-field">
              <label htmlFor="address">Address</label>
              <input
                id="address"
                type="text"
                placeholder="Village / town, district"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
              />
            </div>

            <div className="oh-field">
              <label htmlFor="photo">Photo</label>
              <input id="photo" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files[0])} />
            </div>

            <button className="oh-btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Continue →'}
            </button>
          </form>

          <p className="oh-auth-footer">
            <button className="oh-link" type="button" onClick={handleSkip}>
              Skip for now
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
