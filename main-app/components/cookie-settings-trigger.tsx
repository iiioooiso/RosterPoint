"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { openCookieSettings } from "@/components/cookie-consent";
import { Settings } from "lucide-react";

export function CookieSettingsTrigger() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-foreground"
      onClick={() => openCookieSettings()}
    >
      <Settings className="mr-2 h-4 w-4" />
      Cookie Settings
    </Button>
  );
}
