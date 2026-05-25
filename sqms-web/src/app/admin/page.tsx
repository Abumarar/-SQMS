import Link from "next/link";
import { ArrowLeft, Activity } from "lucide-react";

export default function AdminDashboard() {
  return (
    <main className="min-h-screen bg-color-background flex flex-col">
      <header className="glass border-b border-white/10 px-6 py-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center text-white font-semibold text-lg">
              <Activity className="w-5 h-5 mr-2 text-purple-500" />
              Admin Dashboard
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-6 py-12 flex flex-col items-center justify-center text-center">
        <div className="glass-card max-w-lg w-full p-10 rounded-2xl">
          <div className="w-20 h-20 mx-auto bg-purple-500/20 rounded-full flex items-center justify-center mb-6">
            <Activity className="w-10 h-10 text-purple-500" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Queue Management</h2>
          <p className="text-gray-400 mb-8">
            Please wait while we connect to the Supabase backend. Here you will manage all active queues, counters, and view real-time throughput metrics.
          </p>
          <button className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors shadow-lg shadow-purple-500/20" disabled>
            Connecting to Backend...
          </button>
        </div>
      </div>
    </main>
  );
}
