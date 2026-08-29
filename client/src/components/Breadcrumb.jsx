import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="flex items-center gap-1 text-xs text-ink-muted mb-6 overflow-x-auto">
      <Link to="/" className="flex items-center gap-1 hover:text-ink transition-colors shrink-0">
        <Home size={12} />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1 shrink-0">
          <ChevronRight size={12} className="text-ink-soft/40" />
          {item.to ? (
            <Link to={item.to} className="hover:text-ink transition-colors">{item.label}</Link>
          ) : (
            <span className="text-ink font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
