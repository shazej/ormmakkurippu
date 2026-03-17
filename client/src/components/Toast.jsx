/**
 * Minimal toast notification system.
 * Usage:
 *   import { toast } from '../components/Toast';
 *   toast.success('Saved!');
 *   toast.error('Something went wrong.');
 *
 * Mount <Toaster /> once in App.jsx (inside BrowserRouter).
 */
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const ToastCtx = createContext(null);

let _addToast = null;   // module-level reference so `toast.*` works outside React

const ICONS = {
    success: <CheckCircle2 size={16} className="text-green-500 shrink-0" />,
    error:   <AlertCircle  size={16} className="text-red-500   shrink-0" />,
    info:    <Info         size={16} className="text-blue-500  shrink-0" />,
};

export function ToastProvider({ children }) {
    const [items, setItems] = useState([]);

    const add = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        setItems(prev => [...prev, { id, message, type }]);
        if (duration > 0) setTimeout(() => remove(id), duration);
        return id;
    }, []);   // eslint-disable-line react-hooks/exhaustive-deps

    const remove = useCallback((id) => {
        setItems(prev => prev.filter(t => t.id !== id));
    }, []);

    // Expose to module-level singleton
    useEffect(() => { _addToast = add; return () => { _addToast = null; }; }, [add]);

    return (
        <ToastCtx.Provider value={{ add, remove }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
                {items.map(t => (
                    <div
                        key={t.id}
                        className="pointer-events-auto flex items-start gap-3 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-sm text-gray-800 animate-slide-in"
                    >
                        {ICONS[t.type] || ICONS.info}
                        <span className="flex-1 leading-snug">{t.message}</span>
                        <button onClick={() => remove(t.id)} className="text-gray-400 hover:text-gray-600 shrink-0 mt-0.5">
                            <X size={13} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastCtx.Provider>
    );
}

export const useToast = () => useContext(ToastCtx);

/** Imperative API — works anywhere in the app */
export const toast = {
    success: (msg, d) => _addToast?.(msg, 'success', d),
    error:   (msg, d) => _addToast?.(msg, 'error',   d),
    info:    (msg, d) => _addToast?.(msg, 'info',    d),
};
