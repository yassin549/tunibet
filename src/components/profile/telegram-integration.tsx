'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { CardClassic, CardHeader, CardTitle, CardContent } from '@/components/ui/card-classic';
import { ButtonGold } from '@/components/ui/button-gold';
import { Copy, RefreshCw, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

export function TelegramIntegration() {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSessionId();
    }
  }, [user]);

  const fetchSessionId = async () => {
    try {
      const response = await fetch('/api/user/session-id');
      const data = await response.json();
      
      if (response.ok) {
        setSessionId(data.sessionId);
      }
    } catch (error) {
      console.error('Failed to fetch session ID:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateSessionId = async () => {
    setIsRegenerating(true);
    try {
      const response = await fetch('/api/user/session-id', {
        method: 'POST',
      });
      const data = await response.json();
      
      if (response.ok) {
        setSessionId(data.sessionId);
        toast.success('Session ID regenerated successfully');
      } else {
        toast.error('Failed to regenerate session ID');
      }
    } catch (error) {
      console.error('Failed to regenerate session ID:', error);
      toast.error('Failed to regenerate session ID');
    } finally {
      setIsRegenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sessionId);
    toast.success('Session ID copied to clipboard!');
  };

  if (isLoading) {
    return (
      <CardClassic variant="glass">
        <CardContent className="py-12 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent mx-auto" />
        </CardContent>
      </CardClassic>
    );
  }

  return (
    <CardClassic variant="glass" className="border-2 border-gold/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <span>Telegram Bot Integration</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Section */}
        <div className="bg-gradient-to-br from-gold/10 to-gold/5 rounded-xl p-4 border border-gold/20">
          <h3 className="font-bold text-gold mb-2">📱 How it works</h3>
          <ol className="text-sm text-cream/80 space-y-2 list-decimal list-inside">
            <li>Copy your unique Session ID below</li>
            <li>Open our Telegram bot (@TunibetBot)</li>
            <li>Send /start command</li>
            <li>Paste your Session ID</li>
            <li>Bot will notify you when to cash out during games!</li>
          </ol>
        </div>

        {/* Session ID Display */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-cream">Your Session ID</label>
          <div className="relative">
            <div className="w-full px-4 py-4 bg-navy/50 border-2 border-gold/30 rounded-xl font-mono text-center text-lg font-bold text-gold break-all">
              {sessionId || 'Generating...'}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <ButtonGold
              variant="primary"
              onClick={copyToClipboard}
              disabled={!sessionId}
              className="flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy ID
            </ButtonGold>

            <ButtonGold
              variant="outline"
              onClick={regenerateSessionId}
              disabled={isRegenerating}
              className="flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
              Regenerate
            </ButtonGold>
          </div>
        </div>

        {/* Bot Link */}
        <div className="pt-4 border-t border-cream/10">
          <a
            href="https://t.me/TunibetBot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all"
          >
            <ExternalLink className="w-5 h-5" />
            Open Telegram Bot
          </a>
        </div>

        {/* Features List */}
        <div className="bg-cream/5 rounded-xl p-4">
          <h4 className="font-bold text-cream mb-3">🎯 Bot Features</h4>
          <ul className="text-sm text-cream/70 space-y-2">
            <li>• Real-time cashout notifications</li>
            <li>• Get exact multiplier to cashout</li>
            <li>• Win/loss tracking</li>
            <li>• Balance updates</li>
            <li>• Game statistics</li>
          </ul>
        </div>

        {/* Security Note */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
          <p className="text-xs text-orange-400">
            <strong>⚠️ Security:</strong> Keep your Session ID private. Regenerate it if you think it's been compromised.
          </p>
        </div>
      </CardContent>
    </CardClassic>
  );
}
