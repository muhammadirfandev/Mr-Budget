import React, { useState } from 'react';
import { X, LogOut, Check, User, Link, Image, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { CurrencyCode, CURRENCIES } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  profile: { displayName: string; photoURL: string };
  selectedCurrencyCode: CurrencyCode;
  onSaveProfile: (updatedProfile: { displayName: string; photoURL: string }) => Promise<void>;
  onCurrencyChange: (code: CurrencyCode) => Promise<void>;
  onSignOut: () => Promise<void>;
  onSignIn: () => Promise<void>;
}

// Beautiful Preset Avatar choices
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
];

export default function SettingsModal({
  isOpen,
  onClose,
  currentUser,
  profile,
  selectedCurrencyCode,
  onSaveProfile,
  onCurrencyChange,
  onSignOut,
  onSignIn,
}: SettingsModalProps) {
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [photoURL, setPhotoURL] = useState(profile.photoURL);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [useCustomUrl, setUseCustomUrl] = useState(!PRESET_AVATARS.includes(profile.photoURL));
  const [customAvatarUrl, setCustomAvatarUrl] = useState(!PRESET_AVATARS.includes(profile.photoURL) ? profile.photoURL : '');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const finalPhoto = useCustomUrl ? (customAvatarUrl.trim() || profile.photoURL) : photoURL;
      await onSaveProfile({
        displayName: displayName.trim() || 'User',
        photoURL: finalPhoto,
      });
      onClose();
    } catch (error) {
      console.error('Error saving profile settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectPreset = (url: string) => {
    setUseCustomUrl(false);
    setPhotoURL(url);
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-outline-variant/50 relative z-110 flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant/65">
          <div>
            <h3 className="text-base font-bold text-primary">App Settings</h3>
            <p className="text-[10px] font-bold tracking-wider text-on-surface-variant/85 uppercase">
              Configure profile &amp; features
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-on-surface hover:bg-surface-container rounded-full transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Section: Profile Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-primary border-b border-outline-variant/40 pb-1.5">
              Personal Profile
            </h4>

            {/* Avatar Selection Area */}
            <div className="flex flex-col sm:flex-row gap-5 items-center">
              {/* Profile Preview */}
              <div className="relative group shrink-0">
                <img
                  src={useCustomUrl ? (customAvatarUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJyQZ2Er5Ufqz9K7ClQekPOkYEfEL1Pkxu71cGPTkQwghsIC2nV3Ok-Xn9c08y9JOeIJPN5AYoPDVkHTrJdqpBk365Vt5mTlNWEiC3vetmY_AL3oDj_xqWiKTWl6B89LhDUWQlr3q8D1MI0rLZAMzzCYrAsFWn6QhS3-iPxtTLsPWTdyJrrwNNk0R5e2iCscE1enkj7Lcndt-L9Z8g-5f-8TrwdSvV-priG_BIvfc2JG3Qbig5U7MgvzpUhGLChx-yheYw0-2TlJ0') : photoURL}
                  alt="Avatar Preview"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-primary/20 bg-surface-container-low shadow-sm"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJyQZ2Er5Ufqz9K7ClQekPOkYEfEL1Pkxu71cGPTkQwghsIC2nV3Ok-Xn9c08y9JOeIJPN5AYoPDVkHTrJdqpBk365Vt5mTlNWEiC3vetmY_AL3oDj_xqWiKTWl6B89LhDUWQlr3q8D1MI0rLZAMzzCYrAsFWn6QhS3-iPxtTLsPWTdyJrrwNNk0R5e2iCscE1enkj7Lcndt-L9Z8g-5f-8TrwdSvV-priG_BIvfc2JG3Qbig5U7MgvzpUhGLChx-yheYw0-2TlJ0';
                  }}
                />
                <div className="absolute inset-0 bg-black/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <User className="w-5 h-5 text-white" />
                </div>
              </div>

              {/* Selector */}
              <div className="flex-1 w-full space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1">
                  Choose a preset avatar:
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_AVATARS.map((url, i) => {
                    const isSelected = !useCustomUrl && photoURL === url;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectPreset(url)}
                        className={`w-9 h-9 rounded-xl overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                          isSelected ? 'border-primary scale-105 shadow-md' : 'border-outline-variant/40 hover:border-primary/50'
                        }`}
                      >
                        <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomUrl(true);
                      if (!customAvatarUrl) {
                        setCustomAvatarUrl(photoURL);
                      }
                    }}
                    className={`px-3 py-1 flex items-center gap-1 text-[10px] font-bold rounded-xl border border-dashed transition-all cursor-pointer ${
                      useCustomUrl
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-outline-variant/60 text-on-surface-variant hover:border-primary/50'
                    }`}
                  >
                    <Link className="w-3.5 h-3.5" />
                    Custom URL
                  </button>
                </div>
              </div>
            </div>

            {/* Custom URL Input (Conditional) */}
            {useCustomUrl && (
              <div className="space-y-1.5">
                <label htmlFor="custom-avatar-url" className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-on-surface-variant/70" />
                  Custom Image Web URL
                </label>
                <input
                  id="custom-avatar-url"
                  type="url"
                  placeholder="https://example.com/your-photo.png"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  className="w-full bg-surface-container-low text-xs text-primary font-medium p-3 rounded-xl border border-outline-variant focus:outline-none focus:border-primary placeholder:text-outline-variant"
                />
              </div>
            )}

            {/* Display name input */}
            <div className="space-y-1.5">
              <label htmlFor="display-name" className="text-[11px] font-bold text-on-surface-variant">
                Display Name
              </label>
              <input
                id="display-name"
                type="text"
                placeholder="Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={30}
                required
                className="w-full bg-surface-container-low text-xs text-primary font-bold p-3 rounded-xl border border-outline-variant focus:outline-none focus:border-primary h-11"
              />
            </div>
          </div>

          {/* Section: Preferences */}
          <div className="space-y-3.5 pt-2">
            <h4 className="text-xs font-bold text-primary border-b border-outline-variant/40 pb-1.5">
              Application Preferences
            </h4>

            {/* Currency Choice */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/40">
              <div>
                <p className="text-xs font-bold text-primary leading-tight">Primary Base Currency</p>
                <p className="text-[10px] text-on-surface-variant/80 mt-0.5">
                  Changes standard financial symbol display
                </p>
              </div>
              <select
                value={selectedCurrencyCode}
                onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
                className="bg-surface-container-low text-xs font-bold text-primary pl-3 pr-8 py-1.5 rounded-full border border-outline-variant focus:outline-none focus:border-primary appearance-none cursor-pointer transition-colors hover:bg-surface-container-high h-[36px] min-w-[120px]"
                title="Select Base Currency"
              >
                {Object.values(CURRENCIES).map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code === 'USD' && '🇺🇸 '}
                    {curr.code === 'EUR' && '🇪🇺 '}
                    {curr.code === 'PKR' && '🇵🇰 '}
                    {curr.code === 'BHD' && '🇧🇭 '}
                    {curr.code} ({curr.symbol.trim()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section: Authentication status */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-primary border-b border-outline-variant/40 pb-1.5">
              Synchronization Account
            </h4>

            {currentUser ? (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={currentUser.photoURL || 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJyQZ2Er5Ufqz9K7ClQekPOkYEfEL1Pkxu71cGPTkQwghsIC2nV3Ok-Xn9c08y9JOeIJPN5AYoPDVkHTrJdqpBk365Vt5mTlNWEiC3vetmY_AL3oDj_xqWiKTWl6B89LhDUWQlr3q8D1MI0rLZAMzzCYrAsFWn6QhS3-iPxtTLsPWTdyJrrwNNk0R5e2iCscE1enkj7Lcndt-L9Z8g-5f-8TrwdSvV-priG_BIvfc2JG3Qbig5U7MgvzpUhGLChx-yheYw0-2TlJ0'}
                    alt="Google User Profile"
                    className="w-10 h-10 rounded-full object-cover border border-emerald-500/10"
                  />
                  <div>
                    <p className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                      Cloud Connection Active
                      <span className="w-1.5 h-1.5 bg-success rounded-full animate-ping"></span>
                    </p>
                    <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">
                      {currentUser.email}
                    </p>
                  </div>
                </div>

                {!showConfirmLogout ? (
                  <button
                    type="button"
                    onClick={() => setShowConfirmLogout(true)}
                    className="w-full bg-error-container hover:bg-error-container/80 text-on-error-container font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border border-error/10"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out &amp; Go Offline
                  </button>
                ) : (
                  <div className="bg-error/5 border border-error/15 rounded-xl p-3 space-y-2.5">
                    <p className="text-[11px] font-bold text-error leading-snug">
                      Are you sure you want to sign out from your cloud backup? Local fallback values will reload instead.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await onSignOut();
                            setShowConfirmLogout(false);
                            onClose();
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="flex-1 bg-error text-white font-bold py-1.5 rounded-lg text-[10px] cursor-pointer"
                      >
                        Yes, Disconnect
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowConfirmLogout(false)}
                        className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold py-1.5 rounded-lg text-[10px] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex flex-col items-center text-center gap-3">
                <div>
                  <h5 className="text-xs font-bold text-primary">In Guest Mode</h5>
                  <p className="text-[10px] text-on-surface-variant/90 leading-relaxed mt-1 max-w-[280px]">
                    Create an instant Google backup connection to sync and secure your layout details across multiple devices!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await onSignIn();
                  }}
                  className="w-full bg-primary hover:opacity-95 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center gap-2 shadow-sm border border-primary/10"
                >
                  🔑 Google Cloud Sync Backup
                </button>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-outline-variant/65">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition-all text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-primary hover:opacity-90 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Apply Details'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
