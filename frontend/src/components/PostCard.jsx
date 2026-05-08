import { Link } from 'react-router-dom';
import Avatar from './Avatar';

export default function PostCard({ post }) {
  const author = post.author || {};
  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition">
      {post.cover_image && (
        <img src={`/static/${post.cover_image}`} alt="" className="w-full h-40 object-cover rounded mb-3" />
      )}
      <div className="flex items-center gap-2 mb-2">
        <Avatar src={author.avatar_url} username={author.username} size={28} />
        <span className="text-xs text-gray-500">{author.username}</span>
        {post.is_pinned && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 rounded">Pinned</span>}
      </div>
      <Link to={`/posts/${post.id}`} className="text-lg font-semibold text-gray-900 hover:text-indigo-600 block mb-1">
        {post.title}
      </Link>
      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{post.content.replace(/<[^>]+>/g, '').slice(0, 200)}</p>
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>&#x2764; {post.like_count || 0}</span>
        <span>&#x1F4AC; {post.comment_count || 0}</span>
        <span>&#x1F4AD; {post.view_count || 0} views</span>
        <span className="ml-auto">{new Date(post.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
