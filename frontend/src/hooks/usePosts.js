import { useState, useEffect, useCallback } from 'react';
import { getPosts } from '../api/posts';

export function usePosts(params = {}) {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPosts(params);
      if (res.data.code === 0) {
        setPosts(res.data.data.items);
        setTotal(res.data.data.total);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetch(); }, [fetch]);

  return { posts, total, loading, refetch: fetch };
}
