import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, toggleBlock, setSearch, setStatusFilter } from '../../store/usersSlice';
import { fetchAdmins, promoteUser, demoteAdmin, setSearch as setAdminSearch } from '../../store/adminsSlice';
import UserEditPanel from './UserEditPanel.jsx';
import AdminEditPanel from './AdminEditPanel.jsx';
import UserHistoryPanel from './UserHistoryPanel.jsx';
import '../../styles/admin.css';

const exportCsv = (users) => {
  const header = ['Name', 'Previous names', 'Mobile', 'Type', 'Address', 'Email', 'Status', 'Scans'];
  const rows = users.map((u) => [
    u.name || '',
    (u.profileHistory?.previousNames || []).join('; '),
    u.mobile,
    u.userType || '',
    u.address || '',
    u.email || '',
    u.isBlocked ? 'Blocked' : 'Active',
    u.scansCount ?? 0,
  ]);
  const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'originhash-users.csv';
  a.click();
  URL.revokeObjectURL(url);
};

const PromoteModal = ({ user, onClose }) => {
  const dispatch = useDispatch();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Username and password are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSaving(true);
    const action = await dispatch(
      promoteUser({ id: user.id, payload: { username: username.trim(), password, isSuperAdmin } })
    );
    setSaving(false);
    if (action.meta.requestStatus === 'fulfilled') {
      onClose();
    } else {
      setError(action.payload || 'Could not promote user.');
    }
  };

  return (
    <div className="oh-panel-backdrop" onClick={onClose}>
      <div className="oh-slide-panel" onClick={(e) => e.stopPropagation()}>
        <button className="oh-panel-close" onClick={onClose} type="button" aria-label="Close">
          ✕
        </button>
        <div className="oh-panel-header">
          <div className="oh-panel-avatar">{(user.name || '?').charAt(0).toUpperCase()}</div>
          <div className="oh-panel-name">Promote {user.name || 'user'} to admin</div>
          <div className="oh-panel-mobile">+91 {user.mobile}</div>
        </div>

        {error && <div className="oh-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="oh-field">
            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" autoFocus />
          </div>
          <div className="oh-field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>
          <label className="oh-checkbox-row">
            <input type="checkbox" checked={isSuperAdmin} onChange={(e) => setIsSuperAdmin(e.target.checked)} />
            Grant super-admin access
          </label>

          <div className="oh-edit-actions" style={{ marginTop: 16 }}>
            <button className="oh-btn-cancel" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="oh-btn-save" type="submit" disabled={saving}>
              {saving ? 'Promoting…' : 'Promote to admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DemoteMobileModal = ({ admin, onClose }) => {
  const dispatch = useDispatch();
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    setSaving(true);
    const action = await dispatch(demoteAdmin({ id: admin.id, payload: { mobile } }));
    setSaving(false);
    if (action.meta.requestStatus === 'fulfilled') {
      onClose();
    } else {
      setError(action.payload || 'Could not demote admin.');
    }
  };

  return (
    <div className="oh-panel-backdrop" onClick={onClose}>
      <div className="oh-slide-panel" onClick={(e) => e.stopPropagation()}>
        <button className="oh-panel-close" onClick={onClose} type="button" aria-label="Close">
          ✕
        </button>
        <div className="oh-panel-header">
          <div className="oh-panel-avatar">{(admin.name || '?').charAt(0).toUpperCase()}</div>
          <div className="oh-panel-name">Demote {admin.name || admin.username} to normal user</div>
        </div>

        <p className="oh-qr-folder-hint" style={{ marginBottom: 14 }}>
          This admin has no mobile number on file. A normal user logs in with mobile + OTP, so enter one to
          continue.
        </p>

        {error && <div className="oh-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="oh-field">
            <label>Mobile number</label>
            <div className="oh-mobile-input">
              <span className="oh-code">+91</span>
              <input
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit number"
                autoFocus
              />
            </div>
          </div>

          <div className="oh-edit-actions" style={{ marginTop: 16 }}>
            <button className="oh-btn-cancel" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="oh-btn-save" type="submit" disabled={saving}>
              {saving ? 'Demoting…' : 'Demote to normal user'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const NormalUsersTab = ({ showPromote }) => {
  const dispatch = useDispatch();
  const { list, total, active, blocked, search, statusFilter, status } = useSelector((state) => state.users);
  const [panel, setPanel] = useState(null); // { mode: 'add' | 'edit', user? }
  const [promoting, setPromoting] = useState(null); // user being promoted
  const [historyUserId, setHistoryUserId] = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(fetchUsers({ search, status: statusFilter }));
    }, 300);
    return () => clearTimeout(timeout);
  }, [dispatch, search, statusFilter]);

  const handleToggleBlock = (user) => {
    dispatch(toggleBlock({ id: user.id, block: !user.isBlocked }));
  };

  return (
    <div>
      <div className="oh-admin-header">
        <div>
          <h1 className="oh-admin-title">Users</h1>
          <p className="oh-admin-subtitle">
            {total} users · {active} active · {blocked} blocked
          </p>
        </div>
        <div className="oh-header-actions">
          <button className="oh-btn-add" onClick={() => setPanel({ mode: 'add' })}>
            + Add
          </button>
          <button className="oh-btn-export" onClick={() => exportCsv(list)}>
            ⬇ Export
          </button>
        </div>
      </div>

      <div className="oh-toolbar">
        <input
          className="oh-search-input"
          placeholder="Search name or number (past ones too)"
          value={search}
          onChange={(e) => dispatch(setSearch(e.target.value))}
        />
        <select
          className="oh-status-select"
          value={statusFilter}
          onChange={(e) => dispatch(setStatusFilter(e.target.value))}
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
      </div>

      <div className="oh-users-panel">
        {status === 'loading' && list.length === 0 && <div className="oh-empty-state">Loading users…</div>}

        {status !== 'loading' && list.length === 0 && (
          <div className="oh-empty-state">No users match this search yet.</div>
        )}

        {list.map((user) => {
          const initial = (user.name || user.mobile || '?').charAt(0).toUpperCase();
          const { editCount = 0, previousNames = [] } = user.profileHistory || {};
          return (
            <div className="oh-user-row" key={user.id}>
              <div className="oh-user-avatar">
                {user.photoUrl ? <img src={user.photoUrl} alt={user.name} /> : initial}
              </div>
              <div className="oh-user-info">
                <div className="oh-user-name-row">
                  <span className="oh-user-name">{user.name || 'Unnamed user'}</span>
                  {user.userType && <span className={`oh-badge ${user.userType}`}>{user.userType}</span>}
                  {user.isBlocked && <span className="oh-badge blocked">Blocked</span>}
                  {editCount > 0 && (
                    <span className="oh-badge changed" title={`Profile details changed ${editCount} time${editCount === 1 ? '' : 's'}`}>
                      Profile edited
                    </span>
                  )}
                </div>
                <div className="oh-user-meta">
                  +91 {user.mobile} · {user.address || '—'} · {user.scansCount ?? 0} scans
                </div>
                {previousNames.length > 0 && (
                  <div className="oh-user-meta oh-user-previous">Previously: {previousNames.join(', ')}</div>
                )}
              </div>
              <div className="oh-user-actions">
                {showPromote && (
                  <button className="oh-btn-cancel" onClick={() => setPromoting(user)}>
                    Promote
                  </button>
                )}
                <button className="oh-btn-cancel" onClick={() => setHistoryUserId(user.id)}>
                  History
                </button>
                <button className="oh-btn-edit" onClick={() => setPanel({ mode: 'edit', user })}>
                  Edit
                </button>
                <button
                  className={user.isBlocked ? 'oh-btn-unblock' : 'oh-btn-block'}
                  onClick={() => handleToggleBlock(user)}
                >
                  {user.isBlocked ? 'Unblock' : 'Block'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {panel && <UserEditPanel mode={panel.mode} user={panel.user} onClose={() => setPanel(null)} />}
      {promoting && <PromoteModal user={promoting} onClose={() => setPromoting(null)} />}
      {historyUserId && <UserHistoryPanel userId={historyUserId} onClose={() => setHistoryUserId(null)} />}
    </div>
  );
};

const AdminsTab = () => {
  const dispatch = useDispatch();
  const { list, search, status } = useSelector((state) => state.admins);
  const currentUser = useSelector((state) => state.auth.user);
  const [panel, setPanel] = useState(null); // { mode: 'add' | 'edit', admin? }
  const [demoteTarget, setDemoteTarget] = useState(null); // admin needing a mobile number

  useEffect(() => {
    const timeout = setTimeout(() => {
      dispatch(fetchAdmins({ search }));
    }, 300);
    return () => clearTimeout(timeout);
  }, [dispatch, search]);

  const handleDemote = (admin) => {
    if (!admin.mobile) {
      setDemoteTarget(admin);
      return;
    }
    if (!window.confirm(`Demote ${admin.name || admin.username} to a normal user?`)) return;
    dispatch(demoteAdmin({ id: admin.id }));
  };

  return (
    <div>
      <div className="oh-admin-header">
        <div>
          <h1 className="oh-admin-title">Admins</h1>
          <p className="oh-admin-subtitle">{list.length} admin accounts</p>
        </div>
        <div className="oh-header-actions">
          <button className="oh-btn-add" onClick={() => setPanel({ mode: 'add' })}>
            + Add admin
          </button>
        </div>
      </div>

      <div className="oh-toolbar">
        <input
          className="oh-search-input"
          placeholder="Search name, username or email"
          value={search}
          onChange={(e) => dispatch(setAdminSearch(e.target.value))}
        />
      </div>

      <div className="oh-users-panel">
        {status === 'loading' && list.length === 0 && <div className="oh-empty-state">Loading admins…</div>}
        {status !== 'loading' && list.length === 0 && <div className="oh-empty-state">No admins match this search.</div>}

        {list.map((admin) => {
          const initial = (admin.name || admin.username || '?').charAt(0).toUpperCase();
          const isSelf = admin.id === currentUser?.id;
          return (
            <div className="oh-user-row" key={admin.id}>
              <div className="oh-user-avatar">{initial}</div>
              <div className="oh-user-info">
                <div className="oh-user-name-row">
                  <span className="oh-user-name">{admin.name || admin.username}</span>
                  {admin.isSuperAdmin && <span className="oh-badge producer">Super-admin</span>}
                  {admin.isBlocked && <span className="oh-badge blocked">Blocked</span>}
                  {isSelf && <span className="oh-badge consumer">You</span>}
                </div>
                <div className="oh-user-meta">
                  @{admin.username} {admin.email ? `· ${admin.email}` : ''}
                </div>
              </div>
              <div className="oh-user-actions">
                {!isSelf && (
                  <button className="oh-btn-cancel" onClick={() => handleDemote(admin)}>
                    Demote
                  </button>
                )}
                <button className="oh-btn-edit" onClick={() => setPanel({ mode: 'edit', admin })}>
                  Edit
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {panel && <AdminEditPanel mode={panel.mode} admin={panel.admin} onClose={() => setPanel(null)} />}
      {demoteTarget && <DemoteMobileModal admin={demoteTarget} onClose={() => setDemoteTarget(null)} />}
    </div>
  );
};

const UsersList = () => {
  const currentUser = useSelector((state) => state.auth.user);
  const [tab, setTab] = useState('users');

  if (!currentUser?.isSuperAdmin) {
    return <NormalUsersTab showPromote={false} />;
  }

  return (
    <div>
      <div className="oh-tabs">
        <button type="button" className={`oh-tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          Users
        </button>
        <button type="button" className={`oh-tab ${tab === 'admins' ? 'active' : ''}`} onClick={() => setTab('admins')}>
          Admins
        </button>
      </div>

      {tab === 'users' ? <NormalUsersTab showPromote /> : <AdminsTab />}
    </div>
  );
};

export default UsersList;
