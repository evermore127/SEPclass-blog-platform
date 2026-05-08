export default function Avatar({ src, username, size = 40 }) {
  const initials = username?.charAt(0).toUpperCase() || '?';
  return (
    <div className="relative inline-flex items-center justify-center rounded-full bg-gray-300 overflow-hidden" style={{ width: size, height: size }}>
      {src ? (
        <img src={`/static/${src}`} alt={username} className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-gray-600" style={{ fontSize: size * 0.4 }}>{initials}</span>
      )}
    </div>
  );
}
