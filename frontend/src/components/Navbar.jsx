import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import Avatar from './Avatar';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-bold text-xl text-indigo-600">BlogHub</Link>
          <Link to="/sections" className="text-gray-600 hover:text-indigo-600 text-sm">Sections</Link>
        </div>

        <form onSubmit={e => { e.preventDefault(); navigate(search ? `/?search=${encodeURIComponent(search)}` : '/'); }} className="flex-1 max-w-md mx-4">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search posts..." className="w-full border rounded-full px-4 py-1.5 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300" />
        </form>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              {(user.role === 'moderator' || user.role === 'admin') && (
                <Link to="/admin" className="text-sm text-gray-600 hover:text-indigo-600">Admin</Link>
              )}
              <Link to="/posts/new" className="bg-indigo-600 text-white text-sm px-3 py-1.5 rounded hover:bg-indigo-700">Write</Link>
              <div className="relative">
                <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-2">
                  <Avatar src={user.avatar_url} username={user.username} size={32} />
                  <span className="text-sm">{user.username}</span>
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded shadow-lg border py-1" onMouseLeave={() => setShowDropdown(false)}>
                    <Link to={`/profile/${user.id}`} className="block px-4 py-2 text-sm hover:bg-gray-100">Profile</Link>
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100">Logout</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-600 hover:text-indigo-600">Login</Link>
              <Link to="/register" className="bg-indigo-600 text-white text-sm px-3 py-1.5 rounded hover:bg-indigo-700">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
