import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/axios';
import { fetchWallet, setBalance, setWalletState } from '../store/walletSlice';
import { formatINR } from '../utils/money';
import { loadRazorpay } from '../utils/razorpay';
import { formatDateTimeShort } from '../utils/format';
import { Spinner } from './Loader.jsx';
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, CrossIcon, QrIcon } from './ScanIcons.jsx';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000]; // rupees

const Svg = ({ size = 20, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const WalletIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M19 7V5.5A1.5 1.5 0 0 0 17.5 4h-12A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
    <path d="M3 6.5A2.5 2.5 0 0 0 5.5 9h13A1.5 1.5 0 0 1 20 10.5V15h-4a2 2 0 0 1 0-4h4" />
  </Svg>
);

const PlusIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

const ReceiptIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M6 3.5h12v17l-2.5-1.5-2 1.5-1.5-1.2-1.5 1.2-2-1.5L6 20.5v-17Z" />
    <path d="M9 8h6M9 11.5h6M9 15h3.5" />
  </Svg>
);

const ResetIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" />
  </Svg>
);

const LockIcon = ({ size }) => (
  <Svg size={size}>
    <rect x="5" y="10.5" width="14" height="10" rx="2" />
    <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
  </Svg>
);

const stickersFor = (paise, pricePerQrPaise) => (pricePerQrPaise ? Math.floor(paise / pricePerQrPaise) : 0);
const plural = (n, word) => `${n.toLocaleString('en-IN')} ${word}${n === 1 ? '' : 's'}`;

// A centred dialog: Esc and the backdrop close it unless `locked` (a payment step is running).
export const Modal = ({ title, labelId, onClose, locked = false, children, className = '' }) => {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !locked && onClose();
    window.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [locked, onClose]);

  return (
    <div className="oh-wallet-backdrop" onClick={() => !locked && onClose()}>
      <div
        className={`oh-wallet-modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="oh-wallet-modal-head">
          <h2 id={labelId}>{title}</h2>
          <button type="button" className="oh-wallet-close" onClick={onClose} disabled={locked} aria-label="Close">
            <CrossIcon size={16} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
};

// ---------- Balance bar (top of Generate) ----------

const PLAN_LABELS = { SUBSCRIPTION: 'Subscription', FIXED_VARIABLE: 'Fixed + Variable' };

export const WalletBar = ({ onAdd, onActivity, onPlans }) => {
  const dispatch = useDispatch();
  const { status, balancePaise, pricePerQrPaise, plan, razorpayKeyId } = useSelector((s) => s.wallet);
  const [resetting, setResetting] = useState(false);
  // Only with Razorpay test keys (the server refuses otherwise too).
  const testMode = razorpayKeyId?.startsWith('rzp_test_');
  const reset = async () => {
    if (!window.confirm('Test mode: reset your wallet to ₹0 and clear your plan?')) return;
    setResetting(true);
    try {
      const { data } = await api.post('/wallet/reset');
      dispatch(setWalletState({ balancePaise: data.balancePaise, plan: data.plan }));
    } catch (err) {
      window.alert(err.response?.data?.message || 'Could not reset the wallet.');
    } finally {
      setResetting(false);
    }
  };
  if (status === 'failed') {
    return (
      <section className="oh-wallet-bar" aria-label="Wallet">
        <span className="oh-wallet-bar-icon">
          <WalletIcon size={22} />
        </span>
        <div className="oh-wallet-bar-main">
          <span className="oh-wallet-bar-label">Wallet balance</span>
          <span className="oh-wallet-bar-sub">Couldn't load your wallet. Check your connection.</span>
        </div>
        <div className="oh-wallet-bar-actions">
          <button type="button" className="oh-wallet-primary" onClick={() => dispatch(fetchWallet())}>
            Try again
          </button>
        </div>
      </section>
    );
  }
  // Same size as the real bar, so nothing jumps when the balance arrives.
  if (status !== 'ready') {
    return (
      <section className="oh-wallet-bar loading" aria-busy="true" aria-label="Wallet">
        <span className="oh-wallet-bar-icon">
          <WalletIcon size={22} />
        </span>
        <div className="oh-wallet-bar-main">
          <span className="oh-wallet-bar-label">Wallet balance</span>
          <span className="oh-wallet-skel wide" />
          <span className="oh-wallet-skel" />
        </div>
      </section>
    );
  }
  const active = plan?.status === 'ACTIVE' ? plan : null;
  const canAfford = stickersFor(balancePaise, active ? active.overagePricePaise : pricePerQrPaise);
  const low = !active && canAfford < 10;

  return (
    <section className={`oh-wallet-bar ${low ? 'low' : ''}`} aria-label="Wallet">
      <span className="oh-wallet-bar-icon">
        <WalletIcon size={22} />
      </span>
      <div className="oh-wallet-bar-main">
        <span className="oh-wallet-bar-label">Wallet balance</span>
        <strong className="oh-wallet-bar-balance">{formatINR(balancePaise)}</strong>
        <span className="oh-wallet-bar-sub">
          {active
            ? `${plural(active.remaining, 'plan QR code')} left this month · then ${formatINR(active.overagePricePaise)} each from the wallet`
            : `${canAfford > 0 ? `Enough for ${plural(canAfford, 'sticker')}` : 'Add balance to generate stickers'} · ${formatINR(pricePerQrPaise)} per sticker`}
        </span>
      </div>
      {onPlans && (
        <button type="button" className={`oh-wallet-plan ${plan?.status === 'PAUSED' ? 'paused' : ''}`} onClick={onPlans}>
          <span>{plan?.status === 'PAUSED' ? 'Plan paused' : 'Your plan'}</span>
          <strong>{plan ? PLAN_LABELS[plan.planType] : 'Pay As You Go'}</strong>
          <small>{plan?.status === 'PAUSED' ? 'Resume' : plan ? 'Manage' : 'View plans'} →</small>
        </button>
      )}
      <div className="oh-wallet-bar-actions">
        {testMode && (
          <button type="button" className="oh-wallet-ghost" onClick={reset} disabled={resetting} title="Test mode only: set the balance to ₹0 and clear the plan">
            <ResetIcon size={16} />
            {resetting ? 'Resetting…' : 'Reset'}
          </button>
        )}
        <button type="button" className="oh-wallet-ghost" onClick={onActivity}>
          <ReceiptIcon size={16} />
          Activity
        </button>
        <button type="button" className="oh-wallet-primary" onClick={() => onAdd()}>
          <PlusIcon size={16} />
          Add balance
        </button>
      </div>
    </section>
  );
};

// ---------- Add balance (Razorpay Checkout) ----------

// phase: idle → starting (creating the order) → checkout (Razorpay open) → verifying → success
export const AddBalanceModal = ({ suggestedPaise = 0, onClose }) => {
  const dispatch = useDispatch();
  const { balancePaise, pricePerQrPaise, minTopupPaise, maxTopupPaise, maxBalancePaise } = useSelector((s) => s.wallet);

  // A shortfall is rounded up to whole rupees and at least the minimum top-up.
  const suggestedRupees = suggestedPaise > 0 ? Math.max(Math.ceil(suggestedPaise / 100), minTopupPaise / 100) : 0;
  const [rupees, setRupees] = useState(String(suggestedRupees || 1000));
  const [phase, setPhase] = useState('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);
  const checkoutRef = useRef(null);

  useEffect(() => {
    inputRef.current?.select();
  }, []);

  // If this dialog goes away while Razorpay is open, close Razorpay too.
  useEffect(() => () => checkoutRef.current?.close?.(), []);

  const amountPaise = (Number(rupees) || 0) * 100;
  const roomPaise = Math.max(0, maxBalancePaise - balancePaise);
  const validation =
    !rupees
      ? 'Enter an amount.'
      : amountPaise < minTopupPaise
        ? `The minimum is ${formatINR(minTopupPaise, { whole: true })}.`
        : amountPaise > Math.min(maxTopupPaise, roomPaise)
          ? `You can add up to ${formatINR(Math.min(maxTopupPaise, roomPaise), { whole: true })} right now.`
          : '';
  const busy = phase === 'starting' || phase === 'verifying';

  const chips = [...new Set([suggestedRupees, ...QUICK_AMOUNTS].filter(Boolean))].slice(0, 5);

  const verify = useCallback(
    async (response) => {
      setPhase('verifying');
      try {
        const { data } = await api.post('/wallet/topups/verify', {
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        });
        dispatch(setBalance(data.balancePaise));
        setResult(data);
        setPhase('success');
      } catch (err) {
        setError(
          `${err.response?.data?.message || 'We could not confirm your payment yet.'} If money was deducted, it will be added to your wallet automatically within a few minutes.`
        );
        setPhase('idle');
        dispatch(fetchWallet());
      }
    },
    [dispatch]
  );

  const pay = async () => {
    if (validation || busy) return;
    setError('');
    setPhase('starting');
    try {
      const [Razorpay, { data: order }] = await Promise.all([
        loadRazorpay(),
        api.post('/wallet/topups', { amountPaise }),
      ]);
      let lastFailure = '';
      const checkout = new Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amountPaise,
        currency: order.currency,
        name: 'OriginHash',
        description: `Wallet top-up · ${formatINR(order.amountPaise)}`,
        prefill: order.prefill,
        notes: { purpose: 'wallet_topup' },
        theme: { color: '#163832' },
        handler: verify,
        modal: {
          confirm_close: true,
          ondismiss: () => {
            setPhase((p) => (p === 'checkout' ? 'idle' : p));
            if (lastFailure) setError(`Payment failed: ${lastFailure} No money was added. You can try again.`);
          },
        },
      });
      // Razorpay keeps its window open so the user can retry; remember why the last try failed.
      checkout.on('payment.failed', (resp) => {
        lastFailure = resp?.error?.description || 'the payment was not completed.';
      });
      checkoutRef.current = checkout;
      setPhase('checkout');
      checkout.open();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not start the payment. Please try again.');
      setPhase('idle');
    }
  };

  if (phase === 'success' && result) {
    const nowAfford = stickersFor(result.balancePaise, pricePerQrPaise);
    return (
      <Modal title="Balance added" labelId="oh-wallet-add-title" onClose={onClose}>
        <div className="oh-wallet-success" role="status">
          <span className="oh-wallet-success-icon">
            <CheckIcon size={30} />
          </span>
          <strong>{formatINR(result.amountPaise)} added</strong>
          <p>
            New balance <b>{formatINR(result.balancePaise)}</b> — enough for {plural(nowAfford, 'sticker')}.
          </p>
          <button type="button" className="oh-wallet-pay" onClick={onClose}>
            Continue
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Add balance" labelId="oh-wallet-add-title" onClose={onClose} locked={busy}>
      <form
        className="oh-wallet-form"
        onSubmit={(e) => {
          e.preventDefault();
          pay();
        }}
      >
        <p className="oh-wallet-current">
          Current balance <b>{formatINR(balancePaise)}</b>
        </p>

        <label className="oh-wallet-amount-label" htmlFor="oh-wallet-amount">
          Amount to add
        </label>
        <div className={`oh-wallet-amount ${validation && rupees ? 'invalid' : ''}`}>
          <span aria-hidden="true">₹</span>
          <input
            id="oh-wallet-amount"
            ref={inputRef}
            inputMode="numeric"
            autoComplete="off"
            value={rupees}
            onChange={(e) => setRupees(e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 7))}
            disabled={busy || phase === 'checkout'}
            aria-describedby="oh-wallet-amount-hint"
          />
        </div>

        <div className="oh-wallet-chips" role="group" aria-label="Quick amounts">
          {chips.map((value) => (
            <button
              key={value}
              type="button"
              className={`oh-wallet-chip ${Number(rupees) === value ? 'active' : ''}`}
              onClick={() => setRupees(String(value))}
              disabled={busy || phase === 'checkout'}
            >
              {formatINR(value * 100, { whole: true })}
              {value === suggestedRupees && <small>needed</small>}
            </button>
          ))}
        </div>

        <p id="oh-wallet-amount-hint" className={`oh-wallet-hint ${validation && rupees ? 'error' : ''}`}>
          {validation && rupees
            ? validation
            : `Generates up to ${plural(stickersFor(amountPaise, pricePerQrPaise), 'sticker')} at ${formatINR(pricePerQrPaise)} each.`}
        </p>

        {error && (
          <div className="oh-error" role="alert">
            {error}
          </div>
        )}

        <button type="submit" className="oh-wallet-pay" disabled={Boolean(validation) || busy || phase === 'checkout'}>
          {phase === 'starting' ? (
            <>
              <Spinner /> Opening Razorpay…
            </>
          ) : phase === 'verifying' ? (
            <>
              <Spinner /> Confirming payment…
            </>
          ) : phase === 'checkout' ? (
            'Complete the payment in the Razorpay window'
          ) : (
            <>
              <LockIcon size={16} /> Pay {amountPaise ? formatINR(amountPaise) : ''} securely
            </>
          )}
        </button>

        <p className="oh-wallet-secure">
          Payments are processed by Razorpay (UPI, cards, net banking, wallets). OriginHash never sees your card or bank
          details.
        </p>
      </form>
    </Modal>
  );
};

// ---------- Activity (ledger) ----------

const TYPE_LABELS = {
  TOPUP: 'Balance added',
  STICKER_CHARGE: 'Stickers generated',
  REFUND: 'Refund',
  ADJUSTMENT: 'Adjustment',
};

export const WalletActivityModal = ({ onClose }) => {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    api
      .get('/wallet/transactions', { params: { page } })
      .then(({ data: body }) => {
        if (cancelled) return;
        setData(body);
        setStatus('ready');
      })
      .catch(() => !cancelled && setStatus('failed'));
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <Modal title="Wallet activity" labelId="oh-wallet-activity-title" onClose={onClose} className="wide">
      {status === 'loading' && !data && (
        <div className="oh-wallet-empty">
          <Spinner /> Loading…
        </div>
      )}
      {status === 'failed' && <div className="oh-wallet-empty">Couldn't load your activity. Please try again.</div>}
      {data && data.total === 0 && <div className="oh-wallet-empty">No activity yet. Add balance to get started.</div>}
      {data && data.total > 0 && (
        <>
          <ul className={`oh-wallet-ledger ${status === 'loading' ? 'refreshing' : ''}`}>
            {data.transactions.map((t) => {
              const credit = t.amountPaise > 0;
              return (
                <li key={t.id}>
                  <span className={`oh-wallet-ledger-icon ${credit ? 'credit' : 'debit'}`}>
                    {credit ? <PlusIcon size={16} /> : <QrIcon size={16} />}
                  </span>
                  <div className="oh-wallet-ledger-main">
                    <strong>{TYPE_LABELS[t.type] || t.type}</strong>
                    <span>{t.description}</span>
                    <time dateTime={t.createdAt}>{formatDateTimeShort(t.createdAt)}</time>
                  </div>
                  <div className="oh-wallet-ledger-amount">
                    <strong className={credit ? 'credit' : 'debit'}>
                      {credit ? '+' : '−'}
                      {formatINR(Math.abs(t.amountPaise))}
                    </strong>
                    <span>Balance {formatINR(t.balanceAfterPaise)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
          {data.totalPages > 1 && (
            <nav className="oh-wallet-pager" aria-label="Activity pages">
              <button type="button" onClick={() => setPage((p) => p - 1)} disabled={page <= 1 || status === 'loading'} aria-label="Newer">
                <ChevronLeftIcon size={16} />
              </button>
              <span>
                Page {data.page} of {data.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.totalPages || status === 'loading'}
                aria-label="Older"
              >
                <ChevronRightIcon size={16} />
              </button>
            </nav>
          )}
        </>
      )}
    </Modal>
  );
};
