import { Opening } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface OpeningDetailViewProps {
  opening: Opening;
  onBack: () => void;
  onEdit: () => void;
}

export function OpeningDetailView({ opening, onBack, onEdit }: OpeningDetailViewProps) {
  const handleShare = () => {
    const url = `${window.location.origin}/careers/${opening.id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2 -ml-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Openings
        </Button>
        <div className="flex items-center gap-3">
          {opening.status === "open" && !opening.archived_at && (
            <Button onClick={handleShare} variant="outline" className="gap-2">
              <LinkIcon className="h-4 w-4" />
              Share
            </Button>
          )}
          <Button onClick={onEdit} variant="outline" className="gap-2">
            <Edit className="h-4 w-4" />
            Edit Opening
          </Button>
        </div>
      </div>

      <div className="border rounded-lg bg-card p-6 md:p-8 space-y-8">
        <div>
          <h2 className="text-3xl font-bold">{opening.title}</h2>
          <div className="flex flex-wrap gap-3 mt-4">
            <Badge variant="secondary" className="text-sm px-3 py-1">{opening.department}</Badge>
            {opening.type && (
              <Badge variant="outline" className="text-sm px-3 py-1">{opening.type}</Badge>
            )}
            <Badge variant={opening.status === "open" ? "default" : "secondary"} className="text-sm px-3 py-1">
              Status: {opening.status}
            </Badge>
          </div>
        </div>

        {opening.details && opening.details.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6 border-y">
            {opening.details.map((detail) => (
              <div key={detail.id} className="space-y-1">
                <p className="text-sm text-muted-foreground">{detail.label}</p>
                <p className="font-medium">{detail.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Description</h3>
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
            {opening.description}
          </div>
        </div>

        {opening.requirements && opening.requirements.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Requirements</h3>
            <ul className="space-y-2 list-disc list-inside">
              {opening.requirements.map((req) => (
                <li key={req.id} className="text-sm">
                  {req.text} {req.required ? <span className="text-muted-foreground ml-1">(Required)</span> : null}
                </li>
              ))}
            </ul>
          </div>
        )}

        {opening.skills && opening.skills.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {opening.skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="bg-muted/50">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {opening.application_materials && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Application Materials</h3>
            <ul className="space-y-2">
              {Object.entries(opening.application_materials).map(([key, config]) => {
                if (!config.enabled) return null;
                const labelName = key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                return (
                  <li key={key} className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{labelName}</span>
                    <span className="text-muted-foreground">—</span>
                    <span className="text-muted-foreground">{config.required ? "Required" : "Optional"}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
