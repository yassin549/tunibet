'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export function SupabaseConfigCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<any>(null);

  const checkConfiguration = async () => {
    setIsChecking(true);
    try {
      const supabase = createClient();
      
      // Test with a dummy email to see the actual error
      const testEmail = `test-${Date.now()}@test.com`;
      const testPassword = 'TestPassword123!';
      
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setResult({
          success: false,
          error: error.message,
          details: {
            code: error.status,
            message: error.message,
            suggestion: error.message.includes('invalid') 
              ? '🚨 Email confirmation is likely enabled. Go to Supabase Dashboard → Authentication → Providers → Email → Turn OFF "Confirm email"'
              : error.message.includes('rate limit')
              ? '⏱️ Rate limited. Wait a few minutes and try again.'
              : '❓ Unknown error. Check Supabase Dashboard settings.',
          },
        });
        toast.error('Configuration issue detected');
      } else {
        setResult({
          success: true,
          message: '✅ Supabase Auth is configured correctly!',
          details: {
            user: data.user?.email,
            confirmed: data.user?.confirmed_at ? 'Yes (auto-confirmed)' : 'No (needs confirmation)',
          },
        });
        toast.success('Configuration looks good!');
        
        // Clean up test user
        if (data.user) {
          await supabase.auth.signOut();
        }
      }
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message,
        details: {
          suggestion: 'Check your .env.local file and Supabase project settings',
        },
      });
      toast.error('Failed to check configuration');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-xl max-w-md">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white">Supabase Config Check</h3>
          <button
            onClick={checkConfiguration}
            disabled={isChecking}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs rounded"
          >
            {isChecking ? 'Checking...' : 'Test Config'}
          </button>
        </div>

        {result && (
          <div className={`mt-3 p-3 rounded text-xs ${
            result.success ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'
          }`}>
            <div className={`font-semibold mb-2 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
              {result.success ? result.message : `Error: ${result.error}`}
            </div>
            
            {result.details && (
              <div className="text-gray-300 space-y-1">
                {Object.entries(result.details).map(([key, value]) => (
                  <div key={key}>
                    <span className="font-medium">{key}:</span> {String(value)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-3 text-xs text-gray-400">
          <p>This will test your Supabase Auth configuration.</p>
          <p className="mt-1">
            <a 
              href="https://app.supabase.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Open Supabase Dashboard →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
