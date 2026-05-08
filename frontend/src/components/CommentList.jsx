import { useState, useEffect } from 'react';
import { getComments, createComment, deleteComment } from '../api/comments';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import Avatar from './Avatar';
import Modal from './Modal';

export default function CommentList({ postId }) {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const { user } = useAuth();
  const { addToast } = useToast();

  const fetchComments = async () => {
    try {
      const res = await getComments(postId);
      if (res.data.code === 0) setComments(res.data.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchComments(); }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await createComment({ post_id: postId, content, parent_id: replyTo });
      setContent('');
      setReplyTo(null);
      fetchComments();
      addToast('Comment posted');
    } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteComment(deleteTarget);
      setDeleteTarget(null);
      fetchComments();
      addToast('Comment deleted');
    } catch (e) { console.error(e); }
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-4">Comments ({comments.length})</h3>

      {user && (
        <form onSubmit={handleSubmit} className="mb-6">
          {replyTo && <p className="text-xs text-gray-500 mb-1">Replying to comment #{replyTo} <button type="button" onClick={() => setReplyTo(null)} className="text-indigo-600">(cancel)</button></p>}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
            className="w-full border rounded p-2 text-sm resize-none"
          />
          <button type="submit" className="mt-2 bg-indigo-600 text-white text-sm px-4 py-1.5 rounded hover:bg-indigo-700">Post</button>
        </form>
      )}

      {comments.map(comment => (
        <div key={comment.id} className="border-b py-3">
          <div className="flex items-start gap-3">
            <Avatar src={comment.author?.avatar_url} username={comment.author?.username} size={28} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{comment.author?.username}</span>
                <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm mt-1">{comment.content}</p>
              <div className="flex gap-3 mt-1">
                {user && <button onClick={() => setReplyTo(comment.id)} className="text-xs text-gray-500 hover:text-indigo-600">Reply</button>}
                {user && (user.id === comment.author_id || user.role === 'moderator' || user.role === 'admin') && (
                  <button onClick={() => setDeleteTarget(comment.id)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                )}
              </div>
              {comment.replies?.map(reply => (
                <div key={reply.id} className="ml-6 mt-2 border-l-2 pl-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{reply.author?.username}</span>
                    <span className="text-xs text-gray-400">{new Date(reply.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm">{reply.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {deleteTarget && (
        <Modal title="Delete Comment" onClose={() => setDeleteTarget(null)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Delete this comment?</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
