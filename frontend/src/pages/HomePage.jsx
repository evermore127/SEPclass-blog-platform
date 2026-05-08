import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPosts } from '../api/posts';
import { getSections } from '../api/sections';
import PostCard from '../components/PostCard';
import SectionTree from '../components/SectionTree';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import { PostCardSkeleton } from '../components/Skeleton';

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const [posts, setPosts] = useState([]);
  const [sections, setSections] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('time');
  const [loading, setLoading] = useState(true);
  const limit = 10;

  useEffect(() => {
    getSections().then(res => { if (res.data.code === 0) setSections(res.data.data); });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, sort]);

  useEffect(() => {
    setLoading(true);
    getPosts({ page, limit, sort, search: searchQuery || undefined }).then(res => {
      if (res.data.code === 0) {
        setPosts(res.data.data.items);
        setTotal(res.data.data.total);
      }
    }).finally(() => setLoading(false));
  }, [page, searchQuery, sort]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 flex gap-6">
      <div className="w-56 flex-shrink-0">
        <SectionTree sections={sections} />
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Latest Posts</h1>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="border rounded text-sm px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300">
            <option value="time">Sort by Time</option>
            <option value="likes">Sort by Likes</option>
            <option value="favorites">Sort by Favorites</option>
          </select>
        </div>
        {loading ? (
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => <PostCardSkeleton key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState icon="📝" title="No posts yet" description="Be the first to write something!" />
        ) : (
          <div className="grid gap-4">
            {posts.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        )}
        <Pagination page={page} limit={limit} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
