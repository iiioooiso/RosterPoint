"use client";

import { useState, useEffect } from "react";
import { Opening } from "@/lib/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  ArrowLeft,
  Edit,
  Link as LinkIcon,
  ExternalLink,
  Building2,
  Briefcase,
  Clock,
  Calendar,
  CheckCircle2,
  FileText,
  HelpCircle,
  Copy,
  Check,
  Tag,
  Layers,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface OpeningDetailViewProps {
  opening: Opening;
  onBack: () => void;
  onEdit: () => void;
}

export function OpeningDetailView({ opening, onBack, onEdit }: OpeningDetailViewProps) {
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const getPublicUrl = () => {
    if (mounted && typeof window !== "undefined") {
      return `${window.location.origin}/careers/${opening.id}`;
    }
    return `/careers/${opening.id}`;
  };

  const handleShare = () => {
    const url = getPublicUrl();
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Public career link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const standardMaterials = [
    { key: "resume", label: "Resume / CV", config: opening.application_materials?.resume },
    { key: "portfolio", label: "Portfolio URL", config: opening.application_materials?.portfolio },
    { key: "cover_letter", label: "Cover Letter", config: opening.application_materials?.cover_letter },
  ];

  const customQuestions = opening.application_materials?.custom_questions || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Openings
        </Button>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {opening.status === "open" && !opening.archived_at && (
            <>
              <Button onClick={handleShare} variant="outline" size="sm" className="gap-2">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy Link"}
              </Button>
              <Link
                href={`/careers/${opening.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Live Career Page
              </Link>
            </>
          )}
          <Button onClick={onEdit} size="sm" className="gap-2">
            <Edit className="h-3.5 w-3.5" />
            Edit Opening
          </Button>
        </div>
      </div>

      {/* Main Detail Container */}
      <div className="space-y-6">
        {/* Header Summary Card */}
        <div className="border border-border/80 rounded-lg bg-card p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-xs font-mono text-muted-foreground">ID: {opening.id}</span>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">{opening.title}</h1>
              </div>

              {/* Badges / Metadata pills */}
              <div className="flex flex-wrap items-center gap-2">
                {opening.company_name && (
                  <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary border-primary/20">
                    <Building2 className="h-3.5 w-3.5" />
                    {opening.company_name}
                  </Badge>
                )}
                <Badge variant="secondary" className="gap-1.5 px-2.5 py-1 text-xs font-medium bg-muted/70 text-foreground">
                  <Briefcase className="h-3.5 w-3.5" />
                  {opening.department}
                </Badge>
                {opening.type && (
                  <Badge variant="outline" className="gap-1.5 px-2.5 py-1 text-xs font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    {opening.type}
                  </Badge>
                )}
                <Badge
                  variant={opening.status === "open" ? "default" : "secondary"}
                  className={`px-2.5 py-1 text-xs font-medium ${
                    opening.status === "open"
                      ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {opening.status === "open" ? "Active / Open" : "Closed"}
                </Badge>
                {opening.archived_at && (
                  <Badge variant="destructive" className="px-2.5 py-1 text-xs font-medium">
                    Archived
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-1 text-xs text-muted-foreground shrink-0 pt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Created: {formatDate(opening.created_at)}</span>
              </div>
              {opening.updated_at && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Updated: {formatDate(opening.updated_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats / Custom Details Grid */}
          {opening.details && opening.details.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-4 border-t border-border/60">
              {opening.details.map((detail: any, idx) => {
                const label = detail.label || detail.title;
                const value = detail.value || detail.content;
                return (
                  <div key={detail.id || `detail-${idx}`} className="p-3 rounded-md bg-muted/30 border border-border/40 space-y-1">
                    <p className="text-xs text-muted-foreground font-medium">{label}</p>
                    <p className="text-sm font-medium text-foreground">{value}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Two-Column or Stacked Detailed Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left / Main Section (Description & Requirements) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card className="border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Role Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {opening.description || "No description provided."}
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card className="border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Requirements & Qualifications</CardTitle>
                <CardDescription>Key requirements and candidate criteria for this position</CardDescription>
              </CardHeader>
              <CardContent>
                {!opening.requirements || opening.requirements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No specific requirements listed.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {opening.requirements.map((req: any, idx) => {
                      const text = typeof req === 'string' ? req : req.text;
                      const isRequired = typeof req === 'string' ? true : req.required !== false;
                      
                      return (
                        <li key={req.id || `req-${idx}`} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                          <div className="flex-1 flex items-center justify-between gap-2">
                            <span className="text-foreground">{text}</span>
                            {isRequired ? (
                              <Badge variant="outline" className="text-[10px] uppercase font-semibold tracking-wider text-primary border-primary/30">
                                Required
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] uppercase font-medium text-muted-foreground">
                                Optional
                              </Badge>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Custom Screening Questions */}
            <Card className="border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  Custom Screening Questions
                </CardTitle>
                <CardDescription>Questions candidates answer when submitting their application</CardDescription>
              </CardHeader>
              <CardContent>
                {customQuestions.length === 0 ? (
                  <div className="p-4 rounded-md bg-muted/30 border border-dashed border-border text-center">
                    <p className="text-sm text-muted-foreground">No custom screening questions configured for this opening.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customQuestions.map((q, idx) => {
                      const typeLabel =
                        q.type === "textarea" ? "Long Answer / Textarea" :
                        q.type === "file" ? "File Upload" : "Short Text";

                      return (
                        <div key={q.id || idx} className="p-3.5 rounded-md border border-border/60 bg-muted/20 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-semibold text-muted-foreground mt-0.5">Q{idx + 1}.</span>
                              <p className="text-sm font-medium text-foreground">{q.title}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant="outline" className="text-[10px] font-mono">
                                {typeLabel}
                              </Badge>
                              {q.required ? (
                                <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                                  Required
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                                  Optional
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Section (Skills, Application Materials & Public Link) */}
          <div className="space-y-6">
            {/* Required Skills */}
            <Card className="border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  Skills & Keywords
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!opening.skills || opening.skills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No skills specified.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {opening.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs font-medium bg-muted/60 hover:bg-muted text-foreground">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Application Materials */}
            <Card className="border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Application Materials
                </CardTitle>
                <CardDescription>Required submissions from candidates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {standardMaterials.map(({ key, label, config }) => {
                  const isEnabled = config?.enabled;
                  const isRequired = config?.required;

                  return (
                    <div key={key} className="flex items-center justify-between p-2.5 rounded-md border border-border/50 bg-muted/20 text-sm">
                      <span className="font-medium text-foreground">{label}</span>
                      <div>
                        {!isEnabled ? (
                          <Badge variant="outline" className="text-[11px] text-muted-foreground">
                            Not Required
                          </Badge>
                        ) : isRequired ? (
                          <Badge variant="default" className="text-[11px] bg-primary text-primary-foreground">
                            Required
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[11px]">
                            Optional
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Public Career Page Card */}
            <Card className="border-border/80 bg-muted/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-primary" />
                  Public Application Page
                </CardTitle>
                <CardDescription>Direct link for applicants to apply online</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-2.5 bg-background border rounded-md text-xs font-mono text-muted-foreground truncate select-all">
                  {getPublicUrl()}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleShare} variant="outline" size="sm" className="flex-1 gap-1.5">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy Link"}
                  </Button>
                  <Link
                    href={`/careers/${opening.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: "default", size: "sm" }), "flex-1 gap-1.5")}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View Live
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
