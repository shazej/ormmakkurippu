/**
 * AuthLoadingScreen
 *
 * Shown while the Google OAuth code exchange is in flight.
 * Replaces the login form so the user gets clear feedback
 * that something is happening after they approve Google.
 */
export default function AuthLoadingScreen() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
            {/* Brand wordmark */}
            <div className="text-2xl font-extrabold tracking-tight text-gray-900 select-none">
                <span className="text-red-600">ormmak</span>kurippu
            </div>

            {/* Spinner */}
            <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-2 border-gray-200" />
                <div className="absolute inset-0 rounded-full border-2 border-t-red-600 animate-spin" />
            </div>

            <p className="text-sm text-gray-400 tracking-wide">Signing you in…</p>
        </div>
    );
}
