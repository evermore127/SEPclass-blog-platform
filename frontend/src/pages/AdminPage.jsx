import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getReports, resolveReport, togglePin, hidePost, getApplications, approveApplication, rejectApplication, getAuditLogs, getAdminPosts } from '../api/admin';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';

export default function AdminPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [applications, setApplications] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [posts, setPosts] = useState([]);

  if (!user || (user.role !== 'moderator' && user.role !== 'admin')) {
    navigate('/');
    return null;
  }

  const fetchReports = async () => {
    const res = await getReports();
    if (res.data.code === 0) setReports(res.data.data);
  };
  const fetchApplications = async () => {
    const res = await getApplications();
    if (res.data.code === 0) setApplications(res.data.data);
  };
  const fetchLogs = async () => {
    const res = await getAuditLogs();
    if (res.data.code === 0) setAuditLogs(res.data.data);
  };
  const fetchPosts = async () => {
    const res = await getAdminPosts({ limit: 100 });
    if (res.data.code === 0) setPosts(res.data.data.items);
  };

  useEffect(() => { if (tab === 'reports') fetchReports(); }, [tab]);
  useEffect(() => { if (tab === 'applications') fetchApplications(); }, [tab]);
  useEffect(() => { if (tab === 'logs') fetchLogs(); }, [tab]);
  useEffect(() => { if (tab === 'posts') fetchPosts(); }, [tab]);

  const handleResolve = async (id, action) => {
    await resolveReport(id, action);
    addToast(action === 'resolve' ? 'Report resolved' : 'Report dismissed');
    fetchReports();
  };

  const handleApprove = async (id) => {
    await approveApplication(id);
    addToast('Application approved');
    fetchApplications();
  };

  const handleReject = async (id) => {
    await rejectApplication(id);
    addToast('Application rejected');
    fetchApplications();
  };

  const handleTogglePin = async (id) => {
    await togglePin(id);
    addToast('Pin toggled');
    fetchPosts();
  };

  const handleHide = async (id) => {
    await hidePost(id);
    addToast('Post hidden/unhidden');
    fetchPosts();
  };

  const tabs = [
    { key: 'reports', label: 'Reports' },
    { key: 'applications', label: 'Applications' },
    { key: 'posts', label: 'Posts' },
    { key: 'logs', label: 'Audit Logs' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm rounded ${tab === t.key ? 'bg-indigo-600 text-white' : 'bg-white border hover:bg-gray-50'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'reports' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {reports.length === 0 ? (
            <EmptyState icon="&#x1F4CB;" title="No pending reports" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Target</th>
                  <th className="text-left p-3">Reason</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3">{r.id}</td>
                    <td className="p-3">{r.target_type}</td>
                    <td className="p-3">#{r.target_id}</td>
                    <td className="p-3 max-w-xs truncate">{r.reason}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => handleResolve(r.id, 'resolve')} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Resolve</button>
                      <button onClick={() => handleResolve(r.id, 'dismiss')} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Dismiss</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'applications' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {applications.length === 0 ? (
            <EmptyState icon="&#x1F4CB;" title="No pending applications" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Description</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(a => (
                  <tr key={a.id} className="border-t">
                    <td className="p-3">{a.id}</td>
                    <td className="p-3 font-medium">{a.name}</td>
                    <td className="p-3">{a.app_type}</td>
                    <td className="p-3 max-w-xs truncate">{a.description}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => handleApprove(a.id)} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Approve</button>
                      <button onClick={() => handleReject(a.id)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'posts' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {posts.length === 0 ? (
            <EmptyState icon="&#x1F4CB;" title="No posts found" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">Title</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Pinned</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {posts.map(p => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3">{p.id}</td>
                    <td className="p-3 max-w-xs truncate font-medium">{p.title}</td>
                    <td className="p-3">{p.status}</td>
                    <td className="p-3">{p.is_pinned ? 'Yes' : 'No'}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => handleTogglePin(p.id)} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                        {p.is_pinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button onClick={() => handleHide(p.id)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        {p.status === 'hidden' ? 'Unhide' : 'Hide'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'logs' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {auditLogs.length === 0 ? (
            <EmptyState icon="&#x1F4CB;" title="No audit logs" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Time</th>
                  <th className="text-left p-3">Operator</th>
                  <th className="text-left p-3">Action</th>
                  <th className="text-left p-3">Target</th>
                  <th className="text-left p-3">Detail</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id} className="border-t">
                    <td className="p-3 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="p-3">#{log.operator_id}</td>
                    <td className="p-3">{log.action}</td>
                    <td className="p-3">{log.target_type} #{log.target_id}</td>
                    <td className="p-3 text-xs max-w-xs truncate">{log.detail ? JSON.stringify(log.detail) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
