import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../api/axios';
import { setWalletState } from '../store/walletSlice';
import { formatINR } from '../utils/money';
import { Spinner } from './Loader.jsx';
import { Modal } from './Wallet.jsx';

// ---------- icons ----------
const Svg = ({ size = 22, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const CartIcon = ({ size }) => (
  <Svg size={size}>
    <path d="M3 4h2l2.2 10.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.2" />
    <circle cx="9.5" cy="19.5" r="1.3" />
    <circle cx="17" cy="19.5" r="1.3" />
  </Svg>
);
const CrownIcon = ({ size }) => (
  <Svg size={size}>
    <path d="m4 8 4 3.5L12 5l4 6.5L20 8l-1.6 9.5H5.6L4 8Z" />
    <path d="M6 20.5h12" />
  </Svg>
);
const CoinsIcon = ({ size }) => (
  <Svg size={size}>
    <ellipse cx="12" cy="6" rx="7" ry="2.8" />
    <path d="M5 6v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6M5 12v6c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-6" />
  </Svg>
);
const ArrowIcon = ({ size = 18 }) => (
  <Svg size={size}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);
const Check = () => (
  <Svg size={18}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);
const MinusIcon = ({ size = 18 }) => (
  <Svg size={size}>
    <path d="M6 12h12" />
  </Svg>
);
const PlusIcon = ({ size = 18 }) => (
  <Svg size={size}>
    <path d="M12 6v12M6 12h12" />
  </Svg>
);
const SlidersIcon = () => (
  <Svg>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </Svg>
);
const WalletIcon = () => (
  <Svg>
    <path d="M19 7V5.5A1.5 1.5 0 0 0 17.5 4h-12A2.5 2.5 0 0 0 3 6.5v11A2.5 2.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
    <path d="M3 6.5A2.5 2.5 0 0 0 5.5 9h13A1.5 1.5 0 0 1 20 10.5V15h-4a2 2 0 0 1 0-4h4" />
  </Svg>
);
const QrIcon = () => (
  <Svg>
    <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.4" />
    <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.4" />
    <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.4" />
    <path d="M14 14h2.6v2.6M20.5 14v.01M14 20.5h2.6M20.5 18v2.5h-1.4" />
  </Svg>
);
const GearIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="3" />
    <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.3.9a7 7 0 0 0-2.1-1.2L14 3h-4l-.5 2.5a7 7 0 0 0-2.1 1.2l-2.3-.9-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.3-.9a7 7 0 0 0 2.1 1.2L10 21h4l.5-2.5a7 7 0 0 0 2.1-1.2l2.3.9 2-3.4-2-1.6c.07-.4.1-.8.1-1.2Z" />
  </Svg>
);

// ---------- helpers ----------
export const PLAN_NAMES = { SUBSCRIPTION: 'Subscription', FIXED_VARIABLE: 'Fixed + Variable' };
const qty = (n) => n.toLocaleString('en-IN');
const longDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const shortDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
export const describePlan = (p) =>
  `${PLAN_NAMES[p.planType]} · ${qty(p.monthlyQuota)} QR/month · ${p.billingCycle === 'YEARLY' ? 'Yearly' : 'Monthly'}`;

// Same arithmetic as the server's planTerms (config/plans.js).
const termsFor = (catalog, { planType, billingCycle, monthlyQuota }) => {
  const fixed = planType === 'FIXED_VARIABLE';
  const quota = fixed ? catalog.fixed.includedQr : monthlyQuota;
  const monthly = fixed ? catalog.fixed.feePaise : quota * catalog.subscription.pricePerQrPaise;
  const yearly = billingCycle === 'YEARLY';
  const price = yearly ? Math.round((monthly * 12 * (100 - catalog.yearlyDiscountPct)) / 100) : monthly;
  return { planType, billingCycle, monthlyQuota: quota, monthlyPricePaise: monthly, pricePaise: price, perMonthPaise: yearly ? Math.round(price / 12) : monthly };
};

// The slider moves evenly between these stops (as in the design: 100 · 500 · 1,000 · 5,000 · 10,000).
const SLIDER_STOPS = [100, 500, 1000, 5000, 10000];
const posToQuota = (pos, step) => {
  const seg = Math.min(SLIDER_STOPS.length - 2, Math.floor(pos / 25));
  const t = (pos - seg * 25) / 25;
  const raw = SLIDER_STOPS[seg] + t * (SLIDER_STOPS[seg + 1] - SLIDER_STOPS[seg]);
  return Math.max(SLIDER_STOPS[0], Math.round(raw / step) * step);
};
const quotaToPos = (quota) => {
  for (let i = 0; i < SLIDER_STOPS.length - 1; i++) {
    if (quota <= SLIDER_STOPS[i + 1]) return i * 25 + ((quota - SLIDER_STOPS[i]) / (SLIDER_STOPS[i + 1] - SLIDER_STOPS[i])) * 25;
  }
  return 100;
};

// A quantity box. Totals follow every keystroke (any whole number in range); − / + move by `step`,
// and keep going (faster) while held; ↑ / ↓ work too. Typing outside the range shows a hint and the
// totals keep the last valid number; leaving the box brings it back into range.
const Stepper = ({ value, onChange, min, max, step, label }) => {
  const [text, setText] = useState(String(value));
  const valueRef = useRef(value);
  const repeatRef = useRef(null);
  valueRef.current = value;

  useEffect(() => {
    setText((current) => (Number(current) === value && current !== '' ? current : String(value)));
  }, [value]);

  const stopRepeat = () => {
    clearTimeout(repeatRef.current);
    repeatRef.current = null;
  };
  useEffect(() => stopRepeat, []);

  const clamp = (n) => Math.min(max, Math.max(min, n));
  const typed = Number(text);
  const hint = text === '' || typed < min ? `Minimum ${qty(min)}` : typed > max ? `Maximum ${qty(max)}` : '';

  const type = (raw) => {
    const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 6);
    setText(digits);
    const n = Number(digits);
    if (digits && n >= min && n <= max) onChange(n);
  };
  const settle = () => {
    const n = clamp(Number(text) || min);
    setText(String(n));
    if (n !== valueRef.current) onChange(n);
  };
  const bump = (direction) => {
    const n = clamp(valueRef.current + direction * step);
    if (n === valueRef.current) return false;
    valueRef.current = n;
    setText(String(n));
    onChange(n);
    return n !== min && n !== max;
  };
  const startRepeat = (direction) => {
    stopRepeat();
    if (!bump(direction)) return;
    let delay = 400;
    const tick = () => {
      if (!bump(direction)) return stopRepeat();
      delay = Math.max(45, delay * 0.8);
      repeatRef.current = setTimeout(tick, delay);
      return undefined;
    };
    repeatRef.current = setTimeout(tick, delay);
  };
  // Mouse / touch use press-and-hold; a keyboard "click" (detail 0) steps once.
  const buttonProps = (direction) => ({
    type: 'button',
    onPointerDown: (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      startRepeat(direction);
    },
    onPointerUp: stopRepeat,
    onPointerLeave: stopRepeat,
    onPointerCancel: stopRepeat,
    onClick: (e) => e.detail === 0 && bump(direction),
  });

  return (
    <div className="oh-plan-stepper-wrap">
      <div className={`oh-plan-stepper ${hint ? 'invalid' : ''}`} role="group" aria-label={label}>
        <button {...buttonProps(-1)} disabled={value <= min} aria-label={`Fewer ${label}`}>
          <MinusIcon />
        </button>
        <input
          inputMode="numeric"
          value={text}
          onChange={(e) => type(e.target.value)}
          onBlur={settle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') settle();
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
              bump(e.key === 'ArrowUp' ? 1 : -1);
            }
          }}
          aria-label={label}
          aria-invalid={Boolean(hint)}
        />
        <button {...buttonProps(1)} disabled={value >= max} aria-label={`More ${label}`}>
          <PlusIcon />
        </button>
      </div>
      {hint && (
        <span className="oh-plan-stepper-hint" role="alert">
          {hint}
        </span>
      )}
    </div>
  );
};

// ---------- current plan ----------
const CurrentPlan = ({ plan, balancePaise, busy, onAction, onAddBalance }) => {
  if (!plan) return null;
  const renewalShort = plan.renewal.pricePaise > balancePaise;

  if (plan.status === 'PAUSED') {
    return (
      <section className="oh-plan-current paused" aria-label="Your plan">
        <div className="oh-plan-current-main">
          <span className="oh-plan-pill paused">Paused</span>
          <h3>{describePlan(plan.renewal)}</h3>
          <p>
            Your plan couldn't renew: it needs {formatINR(plan.renewal.pricePaise)} and your wallet has {formatINR(balancePaise)}.
            Until you resume, stickers are charged as Pay As You Go.
          </p>
        </div>
        <div className="oh-plan-current-actions">
          {renewalShort ? (
            <button type="button" className="oh-plan-btn primary" onClick={() => onAddBalance(plan.renewal.pricePaise - balancePaise)}>
              Add {formatINR(plan.renewal.pricePaise - balancePaise, { whole: true })}
            </button>
          ) : (
            <button type="button" className="oh-plan-btn primary" disabled={busy} onClick={() => onAction('resume')}>
              Resume for {formatINR(plan.renewal.pricePaise)}
            </button>
          )}
          <button type="button" className="oh-plan-btn ghost" disabled={busy} onClick={() => onAction('cancel')}>
            Cancel plan
          </button>
        </div>
      </section>
    );
  }

  const usedPct = Math.min(100, Math.round((plan.cycleUsed / plan.monthlyQuota) * 100));
  return (
    <section className="oh-plan-current" aria-label="Your plan">
      <div className="oh-plan-current-main">
        <span className="oh-plan-pill">Current plan</span>
        <h3>{describePlan(plan)}</h3>
        <div className="oh-plan-meter" role="meter" aria-valuemin={0} aria-valuemax={plan.monthlyQuota} aria-valuenow={plan.cycleUsed} aria-label="QR codes used this month">
          <span style={{ width: `${usedPct}%` }} />
        </div>
        <p className="oh-plan-meter-text">
          <b>{qty(plan.remaining)}</b> of {qty(plan.monthlyQuota)} QR codes left this month · resets {shortDate(plan.cycleEnd)}
        </p>
        <p className="oh-plan-renews">
          {plan.autoRenew
            ? `Renews on ${longDate(plan.periodEnd)} for ${formatINR(plan.renewal.pricePaise)} from your wallet.`
            : `Auto-renewal is off: the plan ends on ${longDate(plan.periodEnd)}, then stickers are Pay As You Go.`}
        </p>
        {plan.scheduledChange && (
          <p className="oh-plan-scheduled">
            Changes to <b>{describePlan(plan.scheduledChange)}</b> on {longDate(plan.periodEnd)}.{' '}
            <button type="button" className="oh-plan-link" disabled={busy} onClick={() => onAction('discard')}>
              Keep current plan
            </button>
          </p>
        )}
        {plan.autoRenew && renewalShort && (
          <p className="oh-plan-warning">
            Your balance is {formatINR(balancePaise)}. Add {formatINR(plan.renewal.pricePaise - balancePaise)} before{' '}
            {longDate(plan.periodEnd)} so your plan renews.
          </p>
        )}
      </div>
      <div className="oh-plan-current-actions">
        {plan.autoRenew && renewalShort && (
          <button type="button" className="oh-plan-btn primary" onClick={() => onAddBalance(plan.renewal.pricePaise - balancePaise)}>
            Add balance
          </button>
        )}
        {plan.autoRenew ? (
          <button type="button" className="oh-plan-btn ghost" disabled={busy} onClick={() => onAction('cancel')}>
            Turn off auto-renewal
          </button>
        ) : (
          <button type="button" className="oh-plan-btn primary" disabled={busy} onClick={() => onAction('resume')}>
            Turn on auto-renewal
          </button>
        )}
      </div>
    </section>
  );
};

// ---------- confirmation ----------
const ConfirmPlan = ({ terms, currentPlan, balancePaise, busy, error, onConfirm, onClose, onAddBalance }) => {
  const scheduled = currentPlan?.status === 'ACTIVE';
  const shortfall = scheduled ? 0 : Math.max(0, terms.pricePaise - balancePaise);
  const yearly = terms.billingCycle === 'YEARLY';
  const renewOn = new Date();
  renewOn.setMonth(renewOn.getMonth() + (yearly ? 12 : 1));

  return (
    <Modal title={scheduled ? 'Change your plan' : 'Confirm your plan'} labelId="oh-plan-confirm-title" onClose={onClose} locked={busy}>
      <div className="oh-plan-confirm">
        <p className="oh-plan-confirm-name">{describePlan(terms)}</p>
        <dl>
          {scheduled ? (
            <>
              <div>
                <dt>Starts on</dt>
                <dd>{longDate(currentPlan.periodEnd)}, when your current plan renews</dd>
              </div>
              <div>
                <dt>Charged now</dt>
                <dd>{formatINR(0)}</dd>
              </div>
              <div>
                <dt>Charged on {shortDate(currentPlan.periodEnd)}</dt>
                <dd>{formatINR(terms.pricePaise)} from your wallet</dd>
              </div>
            </>
          ) : (
            <>
              <div>
                <dt>Charged now from your wallet</dt>
                <dd>{formatINR(terms.pricePaise)}</dd>
              </div>
              <div>
                <dt>Wallet after</dt>
                <dd>{shortfall ? '—' : formatINR(balancePaise - terms.pricePaise)}</dd>
              </div>
              <div>
                <dt>Renews automatically</dt>
                <dd>
                  {longDate(renewOn)} for {formatINR(terms.pricePaise)}
                </dd>
              </div>
            </>
          )}
          <div>
            <dt>Included each month</dt>
            <dd>{qty(terms.monthlyQuota)} QR codes (unused ones expire at month end)</dd>
          </div>
        </dl>

        {shortfall > 0 && (
          <div className="oh-plan-short">
            <span>
              Your wallet has {formatINR(balancePaise)}. Add <b>{formatINR(shortfall)}</b> to buy this plan.
            </span>
            <button type="button" className="oh-plan-btn primary" onClick={() => onAddBalance(shortfall)}>
              Add balance
            </button>
          </div>
        )}
        {error && (
          <div className="oh-error" role="alert">
            {error}
          </div>
        )}

        <button type="button" className="oh-wallet-pay" disabled={busy || shortfall > 0} onClick={onConfirm}>
          {busy ? (
            <>
              <Spinner /> Please wait…
            </>
          ) : scheduled ? (
            `Switch on ${shortDate(currentPlan.periodEnd)}`
          ) : (
            `Pay ${formatINR(terms.pricePaise)} from wallet`
          )}
        </button>
        <p className="oh-wallet-secure">You can turn off auto-renewal any time; the plan then runs until the end of its period.</p>
      </div>
    </Modal>
  );
};

// ---------- the page ----------
export const PlansTab = ({ onAddBalance }) => {
  const dispatch = useDispatch();
  // The price list comes with the wallet (and is remembered between visits), so the cards show at
  // once; the buttons wait for the user's own balance and plan.
  const { balancePaise, plan, catalog, status } = useSelector((s) => s.wallet);
  const ready = status === 'ready';
  // Yearly billing is offered on Subscription only; Fixed + Variable is billed monthly.
  const [subCycle, setSubCycle] = useState(plan?.planType === 'SUBSCRIPTION' ? plan.billingCycle : 'MONTHLY');
  const [paygQty, setPaygQty] = useState(100);
  const [subQuota, setSubQuota] = useState(plan?.planType === 'SUBSCRIPTION' ? plan.monthlyQuota : 1000);
  const [fixedExtra, setFixedExtra] = useState(500);
  const [confirming, setConfirming] = useState(null); // terms being confirmed
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // A plan bought elsewhere (or loaded after first render) shows its own billing on the card.
  useEffect(() => {
    if (plan?.planType === 'SUBSCRIPTION') setSubCycle(plan.billingCycle);
  }, [plan?.planType, plan?.billingCycle]);

  const subTerms = useMemo(() => catalog && termsFor(catalog, { planType: 'SUBSCRIPTION', billingCycle: subCycle, monthlyQuota: subQuota }), [catalog, subCycle, subQuota]);
  const fixedTerms = useMemo(() => catalog && termsFor(catalog, { planType: 'FIXED_VARIABLE', billingCycle: 'MONTHLY' }), [catalog]);

  if (!catalog) {
    return (
      <div className="oh-wallet-empty">
        <Spinner /> Loading plans…
      </div>
    );
  }

  const active = plan?.status === 'ACTIVE' ? plan : null;
  const isCurrent = (t) => active && active.planType === t.planType && active.billingCycle === t.billingCycle && active.monthlyQuota === t.monthlyQuota;
  const isScheduled = (t) => {
    const next = active?.scheduledChange;
    return next && next.planType === t.planType && next.billingCycle === t.billingCycle && next.monthlyQuota === t.monthlyQuota;
  };
  const planButtonLabel = (t, fallback) => (isCurrent(t) ? 'Your current plan' : isScheduled(t) ? `Starts ${shortDate(active.periodEnd)}` : active ? 'Switch at renewal' : fallback);

  const run = async (request, { closeConfirm = false } = {}) => {
    setBusy(true);
    setError('');
    try {
      const { data } = await request();
      dispatch(setWalletState({ balancePaise: data.balancePaise, plan: data.plan }));
      setNotice(data.message);
      if (closeConfirm) setConfirming(null);
    } catch (err) {
      const body = err.response?.data || {};
      if (body.code === 'INSUFFICIENT_BALANCE') dispatch(setWalletState({ balancePaise: body.balancePaise, plan }));
      setError(body.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const onAction = (action) => {
    if (action === 'cancel' && !window.confirm(plan?.status === 'PAUSED' ? 'Cancel this plan? Stickers will be Pay As You Go.' : 'Turn off auto-renewal? Your plan stays active until the end of this period.')) return;
    const path = { cancel: '/plans/cancel', resume: '/plans/resume', discard: '/plans/scheduled/cancel' }[action];
    run(() => api.post(path));
  };

  const paygTotal = paygQty * catalog.paygPricePerQrPaise;
  const fixedMonthlyTotal = fixedTerms.perMonthPaise + fixedExtra * catalog.fixed.extraPricePaise;
  const { minQr, maxQr, stepQr } = catalog.subscription;

  return (
    <div className="oh-plans">
      <header className="oh-plans-head">
        <div>
          <h2>Choose your plan</h2>
          <p>Flexible options for your QR code needs. Plans are paid from your wallet, and you can change or upgrade anytime.</p>
        </div>
        <span className="oh-plans-save">Save {catalog.yearlyDiscountPct}% with a yearly Subscription</span>
      </header>

      {notice && (
        <div className="oh-plans-notice" role="status">
          {notice}
          <button type="button" onClick={() => setNotice('')} aria-label="Dismiss">
            ×
          </button>
        </div>
      )}
      {error && !confirming && (
        <div className="oh-error" role="alert">
          {error}
        </div>
      )}

      {ready && <CurrentPlan plan={plan} balancePaise={balancePaise} busy={busy} onAction={onAction} onAddBalance={onAddBalance} />}

      <div className="oh-plans-grid">
        {/* Pay As You Go */}
        <article className={`oh-plan-card tone-payg ${ready && !plan ? 'current' : ''}`}>
          {ready && !plan && <span className="oh-plan-ribbon">Current</span>}
          <span className="oh-plan-icon">
            <CartIcon />
          </span>
          <h3>Pay As You Go</h3>
          <p className="oh-plan-sub">Pay only for what you use. No subscription.</p>
          <div className="oh-plan-panel">
            <label className="oh-plan-label">How many QR codes do you need?</label>
            <Stepper value={paygQty} onChange={setPaygQty} min={5} max={10000} step={10} label="QR codes" />
            <div className="oh-plan-lines">
              <div>
                <span>Price per QR code</span>
                <strong>{formatINR(catalog.paygPricePerQrPaise)}</strong>
              </div>
              <div className="total">
                <span>Total amount</span>
                <strong>{formatINR(paygTotal)}</strong>
              </div>
            </div>
          </div>
          <button type="button" className="oh-plan-cta" onClick={() => onAddBalance(paygTotal)}>
            Buy now <ArrowIcon />
          </button>
          <p className="oh-plan-foot">Adds {formatINR(paygTotal, { whole: true })} to your wallet; each sticker deducts {formatINR(catalog.paygPricePerQrPaise, { whole: true })} as you generate.</p>
        </article>

        {/* Subscription */}
        <article className={`oh-plan-card tone-sub ${isCurrent(subTerms) ? 'current' : ''}`}>
          {isCurrent(subTerms) && <span className="oh-plan-ribbon">Current</span>}
          <span className="oh-plan-icon">
            <CrownIcon />
          </span>
          <h3>Subscription</h3>
          <p className="oh-plan-sub">Fixed monthly fee with included QR codes.</p>
          <div className="oh-plan-panel">
            <div className="oh-plan-cycle-row">
              <span className="oh-plan-label">Billing</span>
              <div className="oh-segment small" role="group" aria-label="Subscription billing">
                {['MONTHLY', 'YEARLY'].map((c) => (
                  <button key={c} type="button" className={subCycle === c ? 'active' : ''} aria-pressed={subCycle === c} onClick={() => setSubCycle(c)}>
                    {c === 'MONTHLY' ? 'Monthly' : `Yearly · −${catalog.yearlyDiscountPct}%`}
                  </button>
                ))}
              </div>
            </div>
            <div className="oh-plan-quota-head">
              <label className="oh-plan-label" htmlFor="oh-sub-quota">
                QR codes per month
              </label>
              <Stepper value={subQuota} onChange={setSubQuota} min={minQr} max={maxQr} step={Math.max(stepQr, 100)} label="QR codes per month" />
            </div>
            <input
              id="oh-sub-quota"
              className="oh-plan-slider"
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={quotaToPos(subQuota)}
              onChange={(e) => setSubQuota(Math.min(maxQr, posToQuota(Number(e.target.value), Math.max(stepQr, 100))))}
              style={{ '--fill': `${quotaToPos(subQuota)}%` }}
              aria-valuetext={`${qty(subQuota)} QR codes per month`}
            />
            <div className="oh-plan-ticks" aria-hidden="true">
              {SLIDER_STOPS.map((s) => (
                <span key={s}>{qty(s)}</span>
              ))}
            </div>
            <div className="oh-plan-lines">
              <div>
                <span>Monthly price</span>
                <strong>
                  {subCycle === 'YEARLY' && <s>{formatINR(subTerms.monthlyPricePaise, { whole: true })}</s>} {formatINR(subTerms.perMonthPaise)}
                </strong>
              </div>
              <div className="total">
                <span>{subCycle === 'YEARLY' ? 'Billed yearly (12 months)' : 'Billed monthly'}</span>
                <strong>{formatINR(subTerms.pricePaise)}</strong>
              </div>
              <p className="oh-plan-note">
                {subCycle === 'YEARLY' && `You save ${formatINR(subTerms.monthlyPricePaise * 12 - subTerms.pricePaise, { whole: true })} · `}
                Beyond {qty(subQuota)} a month: {formatINR(catalog.paygPricePerQrPaise, { whole: true })} per QR
              </p>
            </div>
          </div>
          <button type="button" className="oh-plan-cta" disabled={!ready || isCurrent(subTerms) || isScheduled(subTerms)} onClick={() => { setError(''); setConfirming(subTerms); }}>
            {planButtonLabel(subTerms, 'Subscribe now')} {!isCurrent(subTerms) && !isScheduled(subTerms) && <ArrowIcon />}
          </button>
          <p className="oh-plan-foot">{formatINR(catalog.subscription.pricePerQrPaise, { whole: true })} per QR code each month · renews automatically from your wallet.</p>
        </article>

        {/* Fixed + Variable */}
        <article className={`oh-plan-card tone-fixed ${isCurrent(fixedTerms) ? 'current' : ''}`}>
          {isCurrent(fixedTerms) && <span className="oh-plan-ribbon">Current</span>}
          <span className="oh-plan-icon">
            <CoinsIcon />
          </span>
          <h3>Fixed + Variable</h3>
          <p className="oh-plan-sub">A fixed monthly fee plus additional QR codes as you need them. Billed monthly.</p>
          <div className="oh-plan-panel">
            <div className="oh-plan-fixed-row">
              <div>
                <span className="oh-plan-label">Fixed monthly fee</span>
                <strong className="oh-plan-big">{formatINR(catalog.fixed.feePaise, { whole: true })}</strong>
              </div>
              <div className="oh-plan-includes">
                <span>Includes</span>
                <strong>{qty(catalog.fixed.includedQr)}</strong>
                <span>QR codes per month</span>
              </div>
            </div>
            <label className="oh-plan-label">Expected additional QR codes (per month)</label>
            <Stepper value={fixedExtra} onChange={setFixedExtra} min={0} max={100000} step={100} label="additional QR codes" />
            <div className="oh-plan-lines">
              <div>
                <span>Price per additional QR code</span>
                <strong>{formatINR(catalog.fixed.extraPricePaise)}</strong>
              </div>
              <div className="total">
                <span>Estimated monthly total</span>
                <strong>{formatINR(fixedMonthlyTotal)}</strong>
              </div>
              <p className="oh-plan-note">
                {formatINR(fixedTerms.perMonthPaise, { whole: true })} fixed + ({qty(fixedExtra)} × {formatINR(catalog.fixed.extraPricePaise, { whole: true })}) ·{' '}
                extras are charged as you use them
              </p>
            </div>
          </div>
          <button type="button" className="oh-plan-cta" disabled={!ready || isCurrent(fixedTerms) || isScheduled(fixedTerms)} onClick={() => { setError(''); setConfirming(fixedTerms); }}>
            {planButtonLabel(fixedTerms, 'Choose this plan')} {!isCurrent(fixedTerms) && !isScheduled(fixedTerms) && <ArrowIcon />}
          </button>
          <p className="oh-plan-foot">Only the fixed fee is paid upfront; additional QR codes come out of your wallet when used.</p>
        </article>
      </div>

      <section className="oh-plans-compare" aria-label="Compare plans">
        <table>
          <thead>
            <tr>
              <th scope="col">Features</th>
              <th scope="col" className="tone-payg">Pay As You Go</th>
              <th scope="col" className="tone-sub">Subscription</th>
              <th scope="col" className="tone-fixed">Fixed + Variable</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Price per QR code', formatINR(catalog.paygPricePerQrPaise, { whole: true }), `${formatINR(catalog.subscription.pricePerQrPaise, { whole: true })} within the allowance`, `${formatINR(catalog.fixed.extraPricePaise, { whole: true })} beyond ${qty(catalog.fixed.includedQr)}`],
              ['Monthly fee', false, true, true],
              ['QR codes included each month', false, `You choose (${qty(minQr)}–${qty(maxQr)})`, qty(catalog.fixed.includedQr)],
              ['QR codes beyond the allowance', '—', `${formatINR(catalog.paygPricePerQrPaise, { whole: true })} each`, `${formatINR(catalog.fixed.extraPricePaise, { whole: true })} each`],
              [`Yearly billing (save ${catalog.yearlyDiscountPct}%)`, false, true, false],
              ['Unused QR codes', '—', 'Expire at month end', 'Expire at month end'],
              ['Change anytime', true, 'From next renewal', 'From next renewal'],
            ].map(([feature, ...cells]) => (
              <tr key={feature}>
                <th scope="row">{feature}</th>
                {cells.map((cell, i) => (
                  <td key={i} className={['tone-payg', 'tone-sub', 'tone-fixed'][i]}>
                    {cell === true ? (
                      <span className="oh-plans-yes" aria-label="Yes">
                        <Check />
                      </span>
                    ) : cell === false ? (
                      <span className="oh-plans-no" aria-label="No">
                        <MinusIcon size={16} />
                      </span>
                    ) : (
                      cell
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="oh-plans-steps" aria-label="How it works">
        <div className="oh-plans-steps-title">
          <h3>How it works</h3>
          <p>Get started in a few steps</p>
        </div>
        {[
          [GearIcon, 'Choose a plan', 'Pick the option that fits your needs'],
          [SlidersIcon, 'Enter numbers', 'See the price for your quantity instantly'],
          [WalletIcon, 'Add balance', 'Pay securely with Razorpay into your wallet'],
          [QrIcon, 'Start using', 'Generate and download your QR stickers'],
        ].map(([Icon, title, text], i) => (
          <div key={title} className="oh-plans-step">
            <span className="oh-plans-step-no">{i + 1}</span>
            <span className="oh-plans-step-icon">
              <Icon />
            </span>
            <div>
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
          </div>
        ))}
      </section>

      {confirming && (
        <ConfirmPlan
          terms={confirming}
          currentPlan={active}
          balancePaise={balancePaise}
          busy={busy}
          error={error}
          onClose={() => setConfirming(null)}
          onAddBalance={(shortfall) => {
            setConfirming(null);
            onAddBalance(shortfall);
          }}
          onConfirm={() =>
            run(() => api.post('/plans/subscribe', { planType: confirming.planType, billingCycle: confirming.billingCycle, monthlyQuota: confirming.monthlyQuota }), {
              closeConfirm: true,
            })
          }
        />
      )}
    </div>
  );
};
