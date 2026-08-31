import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import BrandPanel from '../components/BrandPanel.jsx';
import { sendOtp, verifyOtp, clearError } from '../store/authSlice';
import '../styles/auth.css';

const OtpVerify = () => {
  const [otp, setOtp] = useState('');
  const [resendIn, setResendIn] = useState(24);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // const { mobile, demoOtp, status, error, token, user } = useSelector((state) => state.auth);

  const { mobile, sessionId, status, error, token, user } = useSelector(
    (state) => state.auth,
  );

  useEffect(() => {
    if (!mobile) {
      navigate('/login', { replace: true });
    }
  }, [mobile, navigate]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (token && user) {
      if (user.isAdmin) {
        navigate('/admin/users', { replace: true });
      } else if (!user.profileCompleted) {
        navigate('/onboarding', { replace: true });
      } else {
        navigate('/profile', { replace: true });
      }
    }
  }, [token, user, navigate]);

  // const handleVerify = async (e) => {
  //   e.preventDefault();
  //   dispatch(clearError());
  //   dispatch(verifyOtp({ mobile, otp }));
  // };

  const handleVerify = async (e) => {
    e.preventDefault();

    dispatch(clearError());

    if (!otp || otp.length < 4) {
      return;
    }

    dispatch(
      verifyOtp({
        mobile,
        otp,
        sessionId,
      }),
    );
  };

  // const handleResend = () => {
  //   dispatch(clearError());
  //   dispatch(sendOtp(mobile));
  //   setResendIn(24);
  //   setOtp('');
  // };

  const handleResend = async () => {
    dispatch(clearError());

    const result = await dispatch(sendOtp(mobile));

    if (sendOtp.fulfilled.match(result)) {
      setResendIn(30);
      setOtp("");
    }
  };

  return (
    <div className="oh-auth-shell">
      <BrandPanel />
      <div className="oh-form-panel">
        <div className="oh-auth-card">
          <div className="oh-auth-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2 2 7v6c0 5.2 3.8 9.9 10 11 6.2-1.1 10-5.8 10-11V7l-10-5Z" fill="var(--oh-gold)" />
            </svg>
          </div>
          <h2 className="oh-auth-heading">Welcome back</h2>
          <p className="oh-auth-sub">Log in to continue verifying products</p>

        

          {error && <div className="oh-error">{error}</div>}

          <form onSubmit={handleVerify}>
            <div className="oh-field">
              <label htmlFor="otp">Enter OTP</label>
              <div className="oh-otp-input">
                <input
                  id="otp"
                  type="tel"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--oh-text-muted)', marginTop: 6 }}>
                OTP sent to +91 {mobile} &middot; check your SMS
              </p>
            </div>

            <button className="oh-btn-primary" type="submit" disabled={status === 'loading' || !otp}>
              {status === 'loading' ? 'Verifying…' : 'Verify and log in'}
            </button>
          </form>

          <div className="oh-resend-row">
            {resendIn > 0 ? (
              <span>Resend in {resendIn}s</span>
            ) : (
              <button className="oh-link" type="button" onClick={handleResend}>
                Resend OTP
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OtpVerify;
