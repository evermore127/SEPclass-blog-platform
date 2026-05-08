import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getUser, uploadAvatar, updateMe } from '../api/users';
import { getPosts } from '../api/posts';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import EmptyState from '../components/EmptyState';
import { PostCardSkeleton } from '../components/Skeleton';

export default function ProfilePage() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const isOwner = currentUser && currentUser.id === parseInt(userId);

  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({ username: '', current_password: '', new_password: '', confirm_password: '' });
  const [saving, setSaving] = useState(false);
  const [settingsError, setSettingsError] = useState('');

  useEffect(() => {
    if (profile) setSettings(prev => ({ ...prev, username: profile.username }));
  }, [profile]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSettingsError('');
    if (settings.new_password && settings.new_password !== settings.confirm_password) {
      setSettingsError('Passwords do not match');
      return;
    }
    if (settings.new_password && !settings.current_password) {
      setSettingsError('Current password is required to set a new password');
      return;
    }
    setSaving(true);
    try {
      const body = { username: settings.username };
      if (settings.new_password) {
        body.current_password = settings.current_password;
        body.new_password = settings.new_password;
      }
      const res = await updateMe(body);
      if (res.data.code === 0) {
        addToast('Profile updated');
        setProfile(res.data.data);
        setSettings({ ...settings, current_password: '', new_password: '', confirm_password: '' });
        setShowSettings(false);
      } else {
        setSettingsError(res.data.msg);
      }
    } catch (err) {
      setSettingsError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getUser(userId),
      getPosts({ limit: 50 }).then(r => {
        if (r.data.code === 0) {
          setPosts(r.data.data.items.filter(p => p.author_id === parseInt(userId)));
        }
      }),
    ]).then(([userRes]) => {
      if (userRes.data.code === 0) setProfile(userRes.data.data);
    }).finally(() => setLoading(false));
  }, [userId]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadAvatar(file);
      if (res.data.code === 0) {
        setProfile(prev => ({ ...prev, avatar_url: res.data.data.avatar_url }));
        addToast('Avatar updated');
      }
    } catch (err) {
      addToast('Failed to upload avatar', 'error');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-200 animate-pulse" />
          <div className="flex-1">
            <div className="h-6 w-32 bg-gray-200 animate-pulse rounded mb-2" />
            <div className="h-4 w-48 bg-gray-200 animate-pulse rounded" />
          </div>
        </div>
      </div>
      <div className="grid gap-4">
        {[...Array(2)].map((_, i) => <PostCardSkeleton key={i} />)}
      </div>
    </div>
  );

  if (!profile) return <div className="text-center py-12 text-gray-400">User not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 pb-6 pt-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <Avatar src={profile.avatar_url} username={profile.username} size={80} />
              {isOwner && (
                <>
                  <button onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 transition flex items-center justify-center text-white text-xs"
                  >
                    {uploading ? '...' : 'Upload'}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{profile.username}</h1>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">{profile.role}</span>
              </div>
              {profile.bio && <p className="text-gray-600 text-sm mt-1">{profile.bio}</p>}
              <p className="text-xs text-gray-400 mt-1">Joined {new Date(profile.created_at).toLocaleDateString()}</p>
            </div>
            {isOwner && (
              <button onClick={() => setShowSettings(!showSettings)}
                className="ml-auto self-start text-sm text-indigo-600 hover:underline shrink-0">
                Settings
              </button>
            )}
          </div>

          {isOwner && showSettings && (
            <form onSubmit={handleSaveSettings} className="border-t pt-4 mt-2 space-y-3">
              {settingsError && <div className="bg-red-50 text-red-600 text-sm p-3 rounded">{settingsError}</div>}
              <div>
                <label className="block text-xs font-medium mb-1">Username</label>
                <input type="text" value={settings.username}
                  onChange={e => setSettings({ ...settings, username: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm" maxLength={50} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Current Password</label>
                <input type="password" value={settings.current_password}
                  onChange={e => setSettings({ ...settings, current_password: e.target.value })}
                  className="w-full border rounded px-3 py-2 text-sm" placeholder="Leave blank to keep current" />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1">New Password</label>
                  <input type="password" value={settings.new_password}
                    onChange={e => setSettings({ ...settings, new_password: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm" placeholder="Leave blank to keep current" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium mb-1">Confirm New Password</label>
                  <input type="password" value={settings.confirm_password}
                    onChange={e => setSettings({ ...settings, confirm_password: e.target.value })}
                    className="w-full border rounded px-3 py-2 text-sm" placeholder="Confirm new password" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowSettings(false)}
                  className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1.5">Cancel</button>
                <button type="submit" disabled={saving}
                  className="bg-indigo-600 text-white text-sm px-4 py-1.5 rounded hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <h2 className="text-xl font-bold mt-8 mb-4">Posts</h2>
      {posts.length === 0 ? (
        <EmptyState icon="📝" title="No posts yet" />
      ) : (
        <div className="grid gap-4">
          {posts.map(post => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  );
}
