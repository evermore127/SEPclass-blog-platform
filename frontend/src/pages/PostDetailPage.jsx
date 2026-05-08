import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { getPost, deletePost, likePost, favoritePost } from '../api/posts';
import { createReport } from '../api/reports';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import CommentList from '../components/CommentList';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import { PostDetailSkeleton } from '../components/Skeleton';

export default function PostDetailPage() {
  const { postId } = useParams();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  const fetchPost = async () => {
    try {
      const res = await getPost(postId);
      if (res.data.code === 0) setPost(res.data.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPost(); }, [postId]);

  const handleDelete = async () => {
    try {
      await deletePost(postId);
      addToast('Post deleted');
      navigate('/');
    } catch (e) { console.error(e); }
    finally { setShowDelete(false); }
  };

  const handleLike = async () => {
    try {
      const res = await likePost(postId);
      if (res.data.code === 0) fetchPost();
    } catch (e) { console.error(e); }
  };

  const handleFavorite = async () => {
    try {
      const res = await favoritePost(postId);
      if (res.data.code === 0) fetchPost();
    } catch (e) { console.error(e); }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    try {
      await createReport({ target_type: 'post', target_id: parseInt(postId), reason: reportReason });
      setShowReport(false);
      setReportReason('');
      addToast('Report submitted');
    } catch (err) {
      addToast('Failed to submit report', 'error');
    }
  };

  if (loading) return <PostDetailSkeleton />;
  if (!post) return <div className="text-center py-12 text-gray-400">Post not found</div>;

  const author = post.author || {};
  const htmlContent = marked(post.content, { breaks: true });

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <article className="bg-white rounded-lg shadow p-6">
        {post.cover_image && (
          <img src={`/static/${post.cover_image}`} alt="" className="w-full h-64 object-cover rounded mb-4" />
        )}
        <h1 className="text-3xl font-bold mb-2">{post.title}</h1>
        <div className="flex items-center gap-3 mb-4">
          <Avatar src={author.avatar_url} username={author.username} size={32} />
          <div>
            <span className="text-sm font-medium">{author.username}</span>
            <span className="text-xs text-gray-400 ml-2">{new Date(post.created_at).toLocaleDateString()}</span>
          </div>
          {post.is_pinned && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 rounded">Pinned</span>}
          <span className="text-xs text-gray-400">{post.view_count} views</span>
        </div>

        <div className="prose max-w-none mb-6" dangerouslySetInnerHTML={{ __html: htmlContent }} />

        <div className="flex items-center gap-4 border-t pt-4">
          <button onClick={handleLike} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500">
            &#x2764; {post.like_count || 0}
          </button>
          <button onClick={handleFavorite} className="flex items-center gap-1 text-sm text-gray-500 hover:text-yellow-500">
            &#x2B50; {post.favorite_count || 0}
          </button>
          <span className="text-sm text-gray-500">&#x1F4AC; {post.comment_count || 0}</span>
          {user && (
            <button onClick={() => setShowReport(true)} className="text-sm text-gray-400 hover:text-red-500 ml-2">
              Report
            </button>
          )}
          {user && (user.id === post.author_id || user.role === 'moderator' || user.role === 'admin') && (
            <div className="ml-auto flex gap-2">
              <button onClick={() => navigate(`/posts/${postId}/edit`)} className="text-sm text-indigo-600">Edit</button>
              <button onClick={() => setShowDelete(true)} className="text-sm text-red-500">Delete</button>
            </div>
          )}
        </div>
      </article>

      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <CommentList postId={parseInt(postId)} />
      </div>

      {showReport && (
        <Modal title="Report Post" onClose={() => setShowReport(false)}>
          <form onSubmit={handleReport} className="space-y-4">
            <p className="text-sm text-gray-600">Why are you reporting this post?</p>
            <textarea value={reportReason} onChange={e => setReportReason(e.target.value)}
              rows={4} className="w-full border rounded px-3 py-2 text-sm" placeholder="Reason..." required />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowReport(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700">Submit</button>
            </div>
          </form>
        </Modal>
      )}

      {showDelete && (
        <Modal title="Delete Post" onClose={() => setShowDelete(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Are you sure you want to delete this post? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDelete(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
