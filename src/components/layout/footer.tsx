'use client';

import Link from 'next/link';
import { Mail, Shield, FileText, HelpCircle } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-auto border-t border-yellow-500/20 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="font-display text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
              Tunibet
            </h3>
            <p className="text-sm text-cream/60">
              The most exciting crash game in Tunisia. Multiply your wins up to 100x!
            </p>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="font-semibold text-cream">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/terms"
                  className="flex items-center gap-2 text-sm text-cream/60 hover:text-gold transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="flex items-center gap-2 text-sm text-cream/60 hover:text-gold transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/responsible-gaming"
                  className="flex items-center gap-2 text-sm text-cream/60 hover:text-gold transition-colors"
                >
                  <Shield className="h-4 w-4" />
                  Responsible Gaming
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-semibold text-cream">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/faq"
                  className="flex items-center gap-2 text-sm text-cream/60 hover:text-gold transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="flex items-center gap-2 text-sm text-cream/60 hover:text-gold transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  Contact Us
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@tunibet.com"
                  className="flex items-center gap-2 text-sm text-cream/60 hover:text-gold transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  support@tunibet.com
                </a>
              </li>
            </ul>
          </div>

          {/* About */}
          <div className="space-y-4">
            <h4 className="font-semibold text-cream">About</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-sm text-cream/60 hover:text-gold transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/how-to-play"
                  className="text-sm text-cream/60 hover:text-gold transition-colors"
                >
                  How to Play
                </Link>
              </li>
              <li>
                <Link
                  href="/fairness"
                  className="text-sm text-cream/60 hover:text-gold transition-colors"
                >
                  Provably Fair
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-yellow-500/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-cream/40">
              © {currentYear} Tunibet. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-cream/40">18+ Only</span>
              <span className="text-xs text-cream/40">•</span>
              <span className="text-xs text-cream/40">Play Responsibly</span>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 rounded-lg border border-yellow-500/10 bg-yellow-500/5 p-4">
          <p className="text-xs text-center text-cream/50">
            ⚠️ Gambling can be addictive. Please play responsibly. If you or someone you know has a gambling problem, 
            seek help immediately. This platform is for entertainment purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
}
