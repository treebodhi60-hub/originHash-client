import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import BrandPanel from '../components/BrandPanel.jsx';
import { sendOtp, clearError } from '../store/authSlice';
import '../styles/auth.css';

const Login = () => {
  const [mobile, setMobile] = useState('');
  const [localError, setLocalError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    dispatch(clearError());

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setLocalError('Enter a valid 10-digit mobile number.');
      return;
    }

    const result = await dispatch(sendOtp(mobile));
    if (sendOtp.fulfilled.match(result)) {
      navigate('/verify-otp');
    }
  };

  return (
    <div className="oh-auth-shell">
      <BrandPanel />
      <div className="oh-form-panel">
        <div className="oh-auth-card">
          <div className="oh-auth-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2c-2.2 0-4 1.8-4 4v1H7a1 1 0 0 0 0 2h1v2H7a1 1 0 0 0 0 2h1v1c0 2.2 1.8 4 4 4s4-1.8 4-4v-1h1a1 1 0 1 0 0-2h-1V9h1a1 1 0 1 0 0-2h-1V6c0-2.2-1.8-4-4-4Z"
                fill="var(--oh-gold)"
              />
            </svg>
          </div>
          <h2 className="oh-auth-heading">Welcome back</h2>
          <p className="oh-auth-sub">Log in to continue verifying products</p>

          {(localError || error) && <div className="oh-error">{localError || error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="oh-field">
              <label htmlFor="mobile">Mobile number</label>
              <div className="oh-mobile-input">
                <span className="oh-code">+91</span>
                <input
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10-digit number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </div>
            </div>

            <button className="oh-btn-primary" type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Sending OTP…' : 'Send OTP'}
            </button>
          </form>

          <div className="oh-divider">New here?</div>
          <button className="oh-btn-secondary" type="button" onClick={() => navigate('/login')}>
            Create an account
          </button>
          <p className="oh-auth-footer">
            Registration uses the same mobile + OTP flow — just enter your number above.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
