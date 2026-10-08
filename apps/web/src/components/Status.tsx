import { AlertCircle, LoaderCircle } from 'lucide-react';

export function Loading({ label = 'Gathering the good things…' }: { label?: string }) {
  return <div className="status-state" role="status"><LoaderCircle className="spin" size={24} /><span>{label}</span></div>;
}

export function ErrorState({ message = 'We couldn’t load this just now.', onRetry }: { message?: string; onRetry?: () => void }) {
  return <div className="status-state error-state"><AlertCircle size={24} /><p>{message}</p>{onRetry && <button className="button button-outline" onClick={onRetry}>Try again</button>}</div>;
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: React.ReactNode }) {
  return <div className="empty-state"><span className="empty-mark">✳</span><h2>{title}</h2><p>{message}</p>{action}</div>;
}
