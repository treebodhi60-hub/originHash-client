import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, toggleBlock, setSearch, setStatusFilter } from '../../store/usersSlice';
import UserEditPanel from './UserEditPanel.jsx';
import '../../styles/admin.css';

const exportCsv = (users) => {
  const header = ['Name', 'Mobile', 'Type', 'Address', 'Email', 'Status', 'Scans'];
  const rows = users.map((u) => [
    u.name || '',
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

const UsersList = () => {
  const dispatch = useDispatch();
  const { list, total, active, blocked, search, statusFilter, status } = useSelector(
    (state) => state.users
  );
  const [panel, setPanel] = useState(null); // { mode: 'add' | 'edit', user? }

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
          placeholder="Search name or number"
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
                </div>
                <div className="oh-user-meta">
                  +91 {user.mobile} · {user.address || '—'} · {user.scansCount ?? 0} scans
                </div>
              </div>
              <div className="oh-user-actions">
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

      {panel && (
        <UserEditPanel mode={panel.mode} user={panel.user} onClose={() => setPanel(null)} />
      )}
    </div>
  );
};

export default UsersList;
