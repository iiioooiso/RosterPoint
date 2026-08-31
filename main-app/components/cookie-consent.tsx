"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, ShieldCheck } from "lucide-react";

export type CookiePreferences = {
  essential: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  consentGiven: boolean;
  version: string;
  timestamp: string;
};

const CONSENT_KEY = "cookie-consent-preferences";
const VERSION = "1.0";

export function openCookieSettings() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("open-cookie-settings"));
  }
}

export function CookieConsent() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [preferences, setPreferences] = React.useState<CookiePreferences>({
    essential: true,
    preferences: false,
    analytics: false,
    marketing: false,
    consentGiven: false,
    version: VERSION,
    timestamp: new Date().toISOString(),
  });

  React.useEffect(() => {
    const handleOpenSettings = () => {
      setShowSettings(true);
      setIsOpen(false);
    };
    window.addEventListener("open-cookie-settings", handleOpenSettings);
    return () => window.removeEventListener("open-cookie-settings", handleOpenSettings);
  }, []);

  React.useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    const forceShow = process.env.NEXT_PUBLIC_ALWAYS_SHOW_COOKIE_BANNER === "true";

    let isValid = false;
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.version === VERSION && parsed.consentGiven) {
          setPreferences(parsed);
          isValid = true;
        }
      } catch (e) {
        console.error("Failed to parse cookie preferences", e);
      }
    }

    if (!isValid || forceShow) {
      setIsOpen(true);
    }
  }, []);

  const savePreferences = (newPrefs: CookiePreferences) => {
    const prefsToSave = {
      ...newPrefs,
      essential: true,
      consentGiven: true,
      timestamp: new Date().toISOString(),
      version: VERSION,
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(prefsToSave));
    setPreferences(prefsToSave);
    setIsOpen(false);
    setShowSettings(false);
  };

  const handleAcceptAll = () => {
    savePreferences({
      ...preferences,
      preferences: true,
      analytics: true,
      marketing: true,
    });
  };

  const handleSaveSettings = () => {
    savePreferences(preferences);
  };

  return (
    <>
      {isOpen && !showSettings && (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-[calc(100vw-2rem)] sm:w-[360px] animate-in slide-in-from-bottom-5 fade-in duration-500">
          <div className="flex flex-col gap-5 rounded-2xl border bg-background p-6 shadow-2xl">
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold text-foreground tracking-tight text-lg">We value your privacy</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use essential cookies to keep you signed in. Optional cookies help us remember preferences.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowSettings(true)}>
                Configure
              </Button>
              <Button className="flex-1" onClick={handleAcceptAll}>
                Accept
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-xl sm:max-w-xl gap-0 p-0 overflow-hidden [&>[data-slot=dialog-close]]:right-4 [&>[data-slot=dialog-close]]:top-4">
          <DialogTitle className="sr-only">Cookie Preferences</DialogTitle>
          <DialogDescription className="sr-only">Manage your cookie preferences.</DialogDescription>
          
          <div className="flex flex-col border-b bg-muted/30">
            {/* Essential */}
            <div className="flex items-start justify-between gap-4 p-6 pt-12 sm:px-8 sm:pt-14 border-b bg-background">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">Essential</span>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-secondary-foreground">
                    Always Active
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Required to keep you signed in, maintain security, and associate requests with the correct session.
                </p>
              </div>
              <div className="flex h-6 items-center shrink-0">
                <Check className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>

            {/* Preferences */}
            <div className="flex items-start justify-between gap-4 p-6 sm:px-8 border-b bg-background">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">Preferences</span>
                  <span className="rounded-full bg-secondary/50 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                    Optional
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Used to remember non-essential interface preferences such as theme or sidebar state. Some of these use browser localStorage.
                </p>
              </div>
              <div className="flex h-6 items-center shrink-0">
                <Switch
                  checked={preferences.preferences}
                  onCheckedChange={(checked) => setPreferences({ ...preferences, preferences: checked })}
                  aria-label="Toggle Preferences"
                />
              </div>
            </div>

            {/* Analytics */}
            <div className="flex items-start justify-between gap-4 p-6 sm:px-8 border-b bg-background">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-muted-foreground">Analytics</span>
                  <span className="rounded-full bg-secondary/30 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">
                    Not Used
                  </span>
                </div>
                <p className="text-sm text-muted-foreground/70 leading-relaxed">
                  Analytics cookies are not currently used by this application.
                </p>
              </div>
              <div className="flex h-6 items-center shrink-0 opacity-50">
                <Switch disabled checked={false} aria-label="Toggle Analytics" />
              </div>
            </div>

            {/* Marketing */}
            <div className="flex items-start justify-between gap-4 p-6 sm:px-8 bg-background">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-muted-foreground">Marketing</span>
                  <span className="rounded-full bg-secondary/30 px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">
                    Not Used
                  </span>
                </div>
                <p className="text-sm text-muted-foreground/70 leading-relaxed">
                  No advertising or cross-site marketing cookies are currently used.
                </p>
              </div>
              <div className="flex h-6 items-center shrink-0 opacity-50">
                <Switch disabled checked={false} aria-label="Toggle Marketing" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 sm:px-8 bg-muted/10 border-t">
            <Button variant="ghost" onClick={() => setShowSettings(false)} className="px-2 hover:bg-transparent hover:underline text-muted-foreground">
              Cancel
            </Button>
            <Button onClick={handleSaveSettings}>
              Save Preferences
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
