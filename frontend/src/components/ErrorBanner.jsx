import { CircleAlert, X } from 'lucide-react';

export default function ErrorBanner({ message, onDismiss }) {
    if (!message) {
        return null;
    }

    return (
        <div
            role="alert"
            className="fixed bottom-4 left-1/2 z-50 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-start gap-2 rounded-lg border border-red-300 bg-red-700 px-4 py-3 text-sm text-white shadow-lg"
        >
            <CircleAlert size={16} className="mt-0.5 shrink-0" />
            <span className="min-w-0 flex-1 leading-5">{message}</span>
            {onDismiss && (
                <button
                    type="button"
                    onClick={onDismiss}
                    className="grid h-6 w-6 shrink-0 place-items-center rounded hover:bg-red-600"
                    title="Dismiss"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
}
