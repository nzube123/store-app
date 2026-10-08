import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface ToastMessage { id: number; text: string; kind: 'success' | 'error' }
interface ToastContextValue { notify: (text: string, kind?: ToastMessage['kind']) => void }
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const notify = useCallback((text: string, kind: ToastMessage['kind'] = 'success') => {
    const id = Date.now() + Math.random();
    setMessages((current) => [...current, { id, text, kind }]);
    window.setTimeout(() => setMessages((current) => current.filter((message) => message.id !== id)), 3600);
  }, []);
  return <ToastContext.Provider value={{ notify }}>
    {children}
    <div className="toast-stack" aria-live="polite">{messages.map((message) => <div className={`toast toast-${message.kind}`} key={message.id}>{message.text}</div>)}</div>
  </ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used within ToastProvider.');
  return value;
}
