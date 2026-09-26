import { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import { formatDate, formatDateTime } from '../../utils/format';
import { PROFILE_FIELD_LABELS, formatProfileValue } from '../../utils/profileFields';
import { LoadingState } from '../../components/Loader.jsx';
import '../../styles/admin.css';

const versionLabel = (version, isFirst) => {
  if (version.source === 'self') return isFirst ? 'Filled in by the user' : 'Changed by the user';
  if (version.source === 'admin') {
    const who = version.changedBy?.name ? ` (${version.changedBy.name})` : '';
    return `${isFirst ? 'Added' : 'Changed'} by an admin${who}`;
  }
  return 'Recorded automatically';
};

const BatchList = ({ title, batches, className = '' }) => (
  <div className={`oh-history-batches ${className}`}>
    <div className="oh-history-batches-title">{title}</div>
    <ul>
      {batches.map((b) => (
        <li key={b.id}>
          Batch {b.batchNo} · {b.productName}
          {b.variantSize ? ` (${b.variantSize})` : ''} · {b.numberOfQrs} QRs · {formatDate(b.createdAt)}
        </li>
      ))}
    </ul>
  </div>
);

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 'es'}`;

// Admin view of one account's profile history: every version of its name / email / address /
// user type / mobile, newest first, with the QR batches generated under each — so batches made
// as "Harish" and as "Kumar" plainly belong to the same user.
const UserHistoryPanel = ({ userId, onClose }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/users/${userId}/history`)
      .then(({ data: body }) => !cancelled && setData(body))
      .catch((err) => !cancelled && setError(err.response?.data?.message || 'Could not load profile history.'));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const { versions, batchesByVersion, untrackedBatches, names } = useMemo(() => {
    const byVersion = new Map();
    const untracked = [];
    for (const batch of data?.batches || []) {
      if (!batch.profileVersionId) {
        untracked.push(batch);
        continue;
      }
      if (!byVersion.has(batch.profileVersionId)) byVersion.set(batch.profileVersionId, []);
      byVersion.get(batch.profileVersionId).push(batch);
    }

    const seen = new Set();
    const allNames = [];
    for (const version of data?.versions || []) {
      const key = version.name?.trim().toLowerCase();
      if (key && !seen.has(key)) {
        seen.add(key);
        allNames.push(version.name.trim());
      }
    }

    return {
      versions: [...(data?.versions || [])].reverse(),
      batchesByVersion: byVersion,
      untrackedBatches: untracked,
      names: allNames,
    };
  }, [data]);

  const user = data?.user;
  const handle = user?.mobile ? `+91 ${user.mobile}` : user?.username ? `@${user.username}` : '';

  return (
    <div className="oh-panel-backdrop" onClick={onClose}>
      <div className="oh-slide-panel" onClick={(e) => e.stopPropagation()}>
        <button className="oh-panel-close" onClick={onClose} type="button" aria-label="Close">
          ✕
        </button>

        {error && <div className="oh-error">{error}</div>}
        {!data && !error && <LoadingState label="Loading history…" />}

        {user && (
          <>
            <div className="oh-panel-header">
              <div className="oh-panel-avatar">{(user.name || user.mobile || '?').charAt(0).toUpperCase()}</div>
              <div className="oh-panel-name">{user.name || user.username || 'Unnamed user'}</div>
              {handle && <div className="oh-panel-mobile">{handle}</div>}
              {names.length > 1 && (
                <div className="oh-history-names">
                  <span>Names used:</span>
                  {names.map((name) => (
                    <span className="oh-history-name" key={name}>
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <p className="oh-history-intro">
              Everything below is one account. Each QR batch is listed under the details the user had when they
              generated it.
            </p>

            {versions.length === 0 && (
              <div className="oh-empty-state">This user hasn't saved any profile details yet.</div>
            )}

            <ol className="oh-history-list">
              {versions.map((version, index) => {
                const isCurrent = index === 0;
                const isFirst = index === versions.length - 1;
                const batches = batchesByVersion.get(version.id) || [];
                return (
                  <li className={`oh-history-item ${isCurrent ? 'current' : ''}`} key={version.id}>
                    <div className="oh-history-title">
                      {versionLabel(version, isFirst)}
                      {isCurrent && <span className="oh-history-current">Current</span>}
                    </div>
                    <div className="oh-history-when">{formatDateTime(version.createdAt)}</div>

                    <dl className="oh-history-fields">
                      {isFirst
                        ? Object.keys(PROFILE_FIELD_LABELS).map((field) => (
                            <div key={field}>
                              <dt>{PROFILE_FIELD_LABELS[field]}</dt>
                              <dd>{formatProfileValue(field, version[field])}</dd>
                            </div>
                          ))
                        : version.changes.map((change) => (
                            <div key={change.field}>
                              <dt>{PROFILE_FIELD_LABELS[change.field]}</dt>
                              <dd>
                                <span className="oh-history-old">{formatProfileValue(change.field, change.from)}</span>
                                {' → '}
                                <strong>{formatProfileValue(change.field, change.to)}</strong>
                              </dd>
                            </div>
                          ))}
                    </dl>

                    {batches.length > 0 && (
                      <BatchList title={`${plural(batches.length, 'QR batch')} generated with these details`} batches={batches} />
                    )}
                  </li>
                );
              })}
            </ol>

            {untrackedBatches.length > 0 && (
              <BatchList
                className="untracked"
                title={`${plural(untrackedBatches.length, 'QR batch')} generated before profile history was kept (details at the time unknown)`}
                batches={untrackedBatches}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserHistoryPanel;
