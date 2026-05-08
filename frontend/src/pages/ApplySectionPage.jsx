import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { applySection } from '../api/sections';
import { getSections } from '../api/sections';
import { useAuth } from '../store/AuthContext';

export default function ApplySectionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState({ app_type: 'primary', parent_section_id: '', name: '', description: '', reason: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getSections().then(res => { if (res.data.code === 0) setSections(res.data.data); });
  }, []);

  if (!user) { navigate('/login'); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const data = {
        ...form,
        parent_section_id: form.parent_section_id ? parseInt(form.parent_section_id) : null,
      };
      const res = await applySection(data);
      if (res.data.code === 0) {
        setSuccess(true);
      } else {
        setError(res.data.msg);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit');
    }
  };

  const flattenSections = (list, depth = 0) => {
    let result = [];
    for (const s of list) {
      result.push({ ...s, depth });
      if (s.children) result = result.concat(flattenSections(s.children, depth + 1));
    }
    return result;
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-16 text-center">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-green-500 text-5xl mb-4">&#x2714;</div>
          <h1 className="text-2xl font-bold mb-2">Application Submitted</h1>
          <p className="text-gray-500 mb-6">Your section application has been submitted for review.</p>
          <button onClick={() => navigate('/')} className="text-indigo-600 hover:underline">Back to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Apply to Create a Section</h1>
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select value={form.app_type} onChange={e => setForm({ ...form, app_type: e.target.value })}
              className="w-full border rounded px-3 py-2">
              <option value="primary">Primary Section</option>
              <option value="secondary">Sub Section</option>
            </select>
          </div>
          {form.app_type === 'secondary' && (
            <div>
              <label className="block text-sm font-medium mb-1">Parent Section</label>
              <select value={form.parent_section_id} onChange={e => setForm({ ...form, parent_section_id: e.target.value })}
                className="w-full border rounded px-3 py-2">
                <option value="">Select parent</option>
                {flattenSections(sections.filter(s => !s.parent_id)).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Section Name</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded px-3 py-2" required minLength={2} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3} className="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Reason</label>
            <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
              rows={3} className="w-full border rounded px-3 py-2" placeholder="Why do you want to create this section?" />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 font-medium">
            Submit Application
          </button>
        </form>
      </div>
    </div>
  );
}
