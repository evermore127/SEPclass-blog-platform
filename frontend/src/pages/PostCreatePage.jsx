import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPost, updatePost, getPost } from '../api/posts';
import { getSections } from '../api/sections';
import { uploadImage } from '../api/upload';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';

export default function PostCreatePage({ isEdit }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { postId } = useParams();
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState({ title: '', content: '', cover_image: '', section_id: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!!isEdit);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getSections().then(res => {
      if (res.data.code === 0) setSections(res.data.data);
    });
  }, []);

  useEffect(() => {
    if (isEdit && postId) {
      getPost(postId).then(res => {
        if (res.data.code === 0) {
          const p = res.data.data;
          setForm({ title: p.title, content: p.content, cover_image: p.cover_image || '', section_id: p.section_id });
        }
      }).finally(() => setLoading(false));
    }
  }, [isEdit, postId]);

  const flattenSections = (list, depth = 0) => {
    let result = [];
    for (const s of list) {
      result.push({ ...s, depth });
      if (s.children) result = result.concat(flattenSections(s.children, depth + 1));
    }
    return result;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.section_id) { setError('Please select a section'); return; }
    setError('');
    try {
      if (isEdit) {
        const res = await updatePost(postId, { ...form, section_id: parseInt(form.section_id) });
        if (res.data.code === 0) {
          addToast('Post updated');
          navigate(`/posts/${postId}`);
        } else {
          setError(res.data.msg);
        }
      } else {
        const res = await createPost({ ...form, section_id: parseInt(form.section_id) });
        if (res.data.code === 0) {
          addToast('Post published');
          navigate(`/posts/${res.data.data.id}`);
        } else {
          setError(res.data.msg);
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save post');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadImage(file);
      if (res.data.code === 0) {
        const url = res.data.data.url;
        const markdown = `\n![image](${url})\n`;
        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newContent = form.content.slice(0, start) + markdown + form.content.slice(end);
          setForm({ ...form, content: newContent });
          setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = start + markdown.length;
          }, 0);
        }
        addToast('Image uploaded');
      }
    } catch (err) {
      addToast(err.response?.data?.detail || 'Upload failed', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Post' : 'Create Post'}</h1>
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full border rounded px-3 py-2" required maxLength={200} />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.title.length}/200</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Section</label>
            <select value={form.section_id} onChange={e => setForm({ ...form, section_id: e.target.value })}
              className="w-full border rounded px-3 py-2" required>
              <option value="">Select a section</option>
              {flattenSections(sections).map(s => (
                <option key={s.id} value={s.id}>{'  '.repeat(s.depth)}{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cover Image URL (optional)</label>
            <input type="text" value={form.cover_image} onChange={e => setForm({ ...form, cover_image: e.target.value })}
              className="w-full border rounded px-3 py-2" placeholder="/static/images/xxx.jpg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Content</label>
            <div className="flex items-center gap-2 mb-1">
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded disabled:opacity-50">
                {uploading ? 'Uploading...' : 'Insert Image'}
              </button>
              <span className="text-xs text-gray-400">Uploads to /static/images/</span>
            </div>
            <textarea ref={textareaRef} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })}
              rows={15} className="w-full border rounded px-3 py-2 font-mono text-sm" required />
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.content.length} chars</p>
          </div>
          <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 font-medium">
            {isEdit ? 'Update' : 'Publish'}
          </button>
        </form>
      </div>
    </div>
  );
}
