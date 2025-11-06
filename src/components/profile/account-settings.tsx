'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { CardClassic, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card-classic';
import { ButtonGold } from '@/components/ui/button-gold';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, Mail, Lock, User, Globe, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { TelegramIntegration } from './telegram-integration';

export function AccountSettings() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [betNotifications, setBetNotifications] = useState(true);
  const [transactionNotifications, setTransactionNotifications] = useState(true);

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      toast.error('Le nom d\'affichage ne peut pas être vide');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: displayName }),
      });

      if (response.ok) {
        toast.success('Profil mis à jour avec succès!');
      } else {
        toast.error('Échec de la mise à jour du profil');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdateNotifications = async () => {
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email_notifications: emailNotifications,
          bet_notifications: betNotifications,
          transaction_notifications: transactionNotifications,
        }),
      });

      if (response.ok) {
        toast.success('Préférences de notification mises à jour!');
      } else {
        toast.error('Échec de la mise à jour');
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Déconnecté avec succès');
      router.push('/auth/signin');
    } catch (error) {
      toast.error('Erreur de déconnexion');
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <CardClassic variant="cream">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Informations du Profil</span>
          </CardTitle>
          <CardDescription>
            Mettez à jour vos informations personnelles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nom d'affichage</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Votre nom"
            />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <div className="flex items-center space-x-2">
              <Input
                value={user.email}
                disabled
                className="bg-navy/5 dark:bg-cream/5"
              />
              <span className="text-xs text-green-600 font-medium whitespace-nowrap">
                ✓ Vérifié
              </span>
            </div>
            <p className="text-xs text-navy/60 dark:text-cream/60">
              L'email ne peut pas être modifié après l'inscription
            </p>
          </div>

          <ButtonGold
            variant="primary"
            onClick={handleUpdateProfile}
            disabled={isUpdatingProfile || displayName === user.display_name}
          >
            {isUpdatingProfile ? 'Mise à jour...' : '💾 Enregistrer les modifications'}
          </ButtonGold>
        </CardContent>
      </CardClassic>

      {/* Security Settings */}
      <CardClassic variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>Sécurité</span>
          </CardTitle>
          <CardDescription>
            Gérez la sécurité de votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl border-2 border-gold/30 bg-gold/5">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-navy dark:text-cream mb-1">
                  Connexion Google
                </h4>
                <p className="text-sm text-navy/70 dark:text-cream/70">
                  Votre compte est sécurisé via Google OAuth
                </p>
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-500/20 px-3 py-1 rounded-full">
                Actif
              </span>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <p className="text-sm text-navy dark:text-cream">
              <strong>💡 Conseil de sécurité:</strong> Votre compte utilise l'authentification Google.
              Pour plus de sécurité, activez la vérification en deux étapes sur votre compte Google.
            </p>
          </div>
        </CardContent>
      </CardClassic>

      {/* Notification Preferences */}
      <CardClassic variant="cream">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Préférences de Notification</span>
          </CardTitle>
          <CardDescription>
            Choisissez les notifications que vous souhaitez recevoir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-navy/10 dark:border-cream/10">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-navy/60 dark:text-cream/60" />
                <div>
                  <p className="font-medium text-navy dark:text-cream">Notifications Email</p>
                  <p className="text-xs text-navy/60 dark:text-cream/60">
                    Recevoir des emails pour les événements importants
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  emailNotifications ? 'bg-gold' : 'bg-navy/20 dark:bg-cream/20'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    emailNotifications ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Bet Notifications */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-navy/10 dark:border-cream/10">
              <div className="flex items-center space-x-3">
                <Bell className="h-5 w-5 text-navy/60 dark:text-cream/60" />
                <div>
                  <p className="font-medium text-navy dark:text-cream">Notifications de Paris</p>
                  <p className="text-xs text-navy/60 dark:text-cream/60">
                    Recevoir des notifications pour vos paris
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBetNotifications(!betNotifications)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  betNotifications ? 'bg-gold' : 'bg-navy/20 dark:bg-cream/20'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    betNotifications ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Transaction Notifications */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-navy/10 dark:border-cream/10">
              <div className="flex items-center space-x-3">
                <Globe className="h-5 w-5 text-navy/60 dark:text-cream/60" />
                <div>
                  <p className="font-medium text-navy dark:text-cream">Notifications de Transaction</p>
                  <p className="text-xs text-navy/60 dark:text-cream/60">
                    Dépôts, retraits et autres transactions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTransactionNotifications(!transactionNotifications)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  transactionNotifications ? 'bg-gold' : 'bg-navy/20 dark:bg-cream/20'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    transactionNotifications ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>

          <ButtonGold
            variant="outline"
            onClick={handleUpdateNotifications}
          >
            💾 Enregistrer les préférences
          </ButtonGold>
        </CardContent>
      </CardClassic>

      {/* Telegram Bot Integration */}
      <TelegramIntegration />

      {/* Session Management */}
      <CardClassic variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <LogOut className="h-5 w-5" />
            <span>Gestion de Session</span>
          </CardTitle>
          <CardDescription>
            Déconnectez-vous de votre compte en toute sécurité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-xl border-2 border-yellow-500/30 bg-yellow-500/5">
              <div className="flex items-start space-x-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-navy dark:text-cream mb-1">
                    Session Active
                  </h4>
                  <p className="text-sm text-navy/70 dark:text-cream/70">
                    Vous êtes actuellement connecté en tant que <strong>{user.display_name}</strong>
                  </p>
                  <p className="text-xs text-navy/60 dark:text-cream/60 mt-1">
                    Email: {user.email}
                  </p>
                </div>
              </div>
            </div>
            
            <ButtonGold
              variant="outline"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Se Déconnecter
            </ButtonGold>
          </div>
        </CardContent>
      </CardClassic>

      {/* Danger Zone */}
      <CardClassic variant="glass">
        <CardHeader>
          <CardTitle className="text-crash">Zone Dangereuse</CardTitle>
          <CardDescription>
            Actions irréversibles sur votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-4 rounded-xl border-2 border-crash/30 bg-crash/5">
              <h4 className="font-semibold text-crash mb-2">Supprimer le compte</h4>
              <p className="text-sm text-navy/70 dark:text-cream/70 mb-3">
                Cette action est irréversible. Toutes vos données seront définitivement supprimées.
              </p>
              <ButtonGold
                variant="crash"
                size="sm"
                onClick={() => toast.error('Contactez le support pour supprimer votre compte')}
              >
                🗑️ Supprimer mon compte
              </ButtonGold>
            </div>
          </div>
        </CardContent>
      </CardClassic>
    </div>
  );
}
