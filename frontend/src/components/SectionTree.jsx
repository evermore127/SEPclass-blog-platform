import { Link } from 'react-router-dom';

function TreeNode({ section, depth = 0 }) {
  return (
    <div>
      <Link
        to={`/sections/${section.id}`}
        className="block px-3 py-1.5 text-sm hover:bg-gray-100 rounded"
        style={{ paddingLeft: 12 + depth * 16 }}
      >
        {section.name}
      </Link>
      {section.children?.map(child => (
        <TreeNode key={child.id} section={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function SectionTree({ sections }) {
  return (
    <div className="bg-white rounded-lg shadow p-3">
      <h3 className="font-semibold text-sm mb-2 text-gray-500 uppercase tracking-wide">Sections</h3>
      <Link to="/sections" className="block px-3 py-1.5 text-sm text-indigo-600 hover:bg-gray-100 rounded">All Sections</Link>
      {sections.filter(s => !s.parent_id).map(s => (
        <TreeNode key={s.id} section={s} />
      ))}
    </div>
  );
}
