"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Clock, MapPin } from "lucide-react";
import { supabase } from "../../utils/supabase";

type Queue = {
  id: string;
  name: string;
  location: string;
  is_active: boolean;
};

export default function UserPortal() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueues();
    
    // Subscribe to real-time changes on the queues table
    const channel = supabase
      .channel('public:queues')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'queues' }, () => {
        fetchQueues();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchQueues() {
    try {
      const { data, error } = await supabase
        .from('queues')
        .select('*')
        .eq('is_active', true);
        
      if (error) throw error;
      setQueues(data || []);
    } catch (err: any) {
      console.error('Error fetching queues:', err.message || err);
    } finally {
      setLoading(false);
    }
  }

  async function joinQueue(queueId: string) {
    // In a real app, you would first ensure the user is authenticated here
    alert("Authentication required. Phase 3 (Auth integration) logic goes here for joining Queue: " + queueId);
  }

  return (
    <main className="min-h-screen bg-color-background flex flex-col">
      <header className="glass border-b border-white/10 px-6 py-4 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center text-white font-semibold text-lg">
              <Users className="w-5 h-5 mr-2 text-brand-500" />
              User Portal
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-6 py-12 flex flex-col items-center">
        <div className="w-full max-w-2xl text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-4">Select a Service</h1>
          <p className="text-gray-400">
            Choose a location to join the virtual queue. You'll be notified when it's your turn.
          </p>
        </div>

        {loading ? (
          <div className="text-brand-500 animate-pulse font-medium">Loading active queues...</div>
        ) : queues.length === 0 ? (
          <div className="glass-card p-8 rounded-2xl text-center max-w-md w-full">
            <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl text-white font-medium mb-2">No active queues</h3>
            <p className="text-gray-400">There are currently no active queues available. Please check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 w-full max-w-2xl gap-4">
            {queues.map((queue) => (
              <div key={queue.id} className="glass-card p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between transition-all hover:border-brand-500/30">
                <div className="flex-1 text-left mb-4 sm:mb-0">
                  <h3 className="text-xl font-bold text-white mb-1">{queue.name}</h3>
                  <div className="flex items-center text-sm text-gray-400">
                    <MapPin className="w-4 h-4 mr-1" /> {queue.location || 'Main Branch'}
                  </div>
                </div>
                <button 
                  onClick={() => joinQueue(queue.id)}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium transition-colors shadow-lg shadow-brand-500/20"
                >
                  Join Queue
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
