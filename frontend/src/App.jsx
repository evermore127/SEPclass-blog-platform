import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SectionPage from './pages/SectionPage';
import PostDetailPage from './pages/PostDetailPage';
import PostCreatePage from './pages/PostCreatePage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import ApplySectionPage from './pages/ApplySectionPage';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/sections" element={<SectionPage />} />
        <Route path="/sections/:sectionId" element={<SectionPage />} />
        <Route path="/sections/apply" element={<ApplySectionPage />} />
        <Route path="/posts/new" element={<PostCreatePage />} />
        <Route path="/posts/:postId" element={<PostDetailPage />} />
        <Route path="/posts/:postId/edit" element={<PostCreatePage isEdit />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </div>
  );
}
