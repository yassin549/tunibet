'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DebugPage() {
  const [status, setStatus] = useState<any>({
    supabaseUrl: '',
    supabaseKey: '',
    connectionTest: 'pending',
    error: null,
  });

  useEffect(() => {
    const checkConfig = async () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      setStatus((prev: any) => ({
        ...prev,
        supabaseUrl: url ? `${url.substring(0, 20)}...` : 'NOT SET',
        supabaseKey: key ? `${key.substring(0, 20)}...` : 'NOT SET',
      }));

      if (!url || !key) {
        setStatus((prev: any) => ({
          ...prev,
          connectionTest: 'failed',
          error: 'Environment variables not set',
        }));
        return;
      }

      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setStatus((prev: any) => ({
            ...prev,
            connectionTest: 'failed',
            error: error.message,
          }));
        } else {
          setStatus((prev: any) => ({
            ...prev,
            connectionTest: 'success',
            error: null,
          }));
        }
      } catch (err: any) {
        setStatus((prev: any) => ({
          ...prev,
          connectionTest: 'failed',
          error: err.message,
        }));
      }
    };

    checkConfig();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-yellow-400">Debug Information</h1>
        
        <div className="bg-gray-900 p-6 rounded-lg space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
            <div className="space-y-2">
              <p>
                <span className="text-gray-400">NEXT_PUBLIC_SUPABASE_URL:</span>{' '}
                <span className={status.supabaseUrl === 'NOT SET' ? 'text-red-500' : 'text-green-500'}>
                  {status.supabaseUrl}
                </span>
              </p>
              <p>
                <span className="text-gray-400">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>{' '}
                <span className={status.supabaseKey === 'NOT SET' ? 'text-red-500' : 'text-green-500'}>
                  {status.supabaseKey}
                </span>
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Connection Test</h2>
            <p>
              Status:{' '}
              <span className={
                status.connectionTest === 'success' 
                  ? 'text-green-500' 
                  : status.connectionTest === 'failed'
                  ? 'text-red-500'
                  : 'text-yellow-500'
              }>
                {status.connectionTest}
              </span>
            </p>
            {status.error && (
              <p className="text-red-500 mt-2">Error: {status.error}</p>
            )}
          </div>

          {status.supabaseUrl === 'NOT SET' && (
            <div className="bg-red-900/20 border border-red-500 p-4 rounded">
              <h3 className="font-bold text-red-400 mb-2">Configuration Missing!</h3>
              <p className="text-sm">
                Please create a <code>.env.local</code> file in the root of your project with:
              </p>
              <pre className="bg-black p-3 rounded mt-2 text-xs">
{`NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
