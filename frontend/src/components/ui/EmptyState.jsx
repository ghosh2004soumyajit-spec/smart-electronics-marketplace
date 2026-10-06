import { Link } from 'react-router-dom';
import { IconBox } from './Icons';

/**
 * EmptyState — helpful and human, never blaming ("Nothing here yet" beats
 * "No results found!"). Always offers one concrete next action.
 */
export default function EmptyState({
  code = 'EMPTY',
  title,
  message,
  action = null,
  icon = null,
}) {
  return (
    <div className="flex flex-col items-start gap-4 border border-line bg-card px-6 py-10 sm:px-10">
      <div className="flex items-center gap-3">
        <span className="text-ink3">{icon ?? <IconBox size={26} />}</span>
        <span className="label">{code}</span>
      </div>
      <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl">{title}</h2>
      <p className="max-w-md text-[15px] leading-relaxed text-ink2">{message}</p>
      {action &&
        (action.href || action.to ? (
          <Link to={action.to ?? action.href} className="btn-primary mt-1">
            {action.label}
          </Link>
        ) : (
          <button type="button" onClick={action.onClick} className="btn-primary mt-1">
            {action.label}
          </button>
        ))}
    </div>
  );
}
