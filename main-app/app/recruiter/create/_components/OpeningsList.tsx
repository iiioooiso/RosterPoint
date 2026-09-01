import { Opening } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Link as LinkIcon, ExternalLink } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateOpening, archiveOpening, restoreOpening } from "@/app/actions/openings";
import { toast } from "sonner";

interface OpeningsListProps {
  openings: Opening[];
  onViewDetail: (opening: Opening) => void;
  onEdit: (opening: Opening) => void;
  isArchivedView?: boolean;
}

export function OpeningsList({ openings, onViewDetail, onEdit, isArchivedView }: OpeningsListProps) {
  
  const handleToggleStatus = async (opening: Opening) => {
    const newStatus = opening.status === "open" ? "closed" : "open";
    try {
      await updateOpening(opening.id, {
        ...opening,
        status: newStatus,
      });
      toast.success(`Opening ${newStatus === "open" ? "reopened" : "closed"}`);
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/careers/${id}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  const handleArchiveToggle = async (opening: Opening) => {
    try {
      if (opening.archived_at) {
        await restoreOpening(opening.id);
        toast.success("Opening restored");
      } else {
        await archiveOpening(opening.id);
        toast.success("Opening archived");
      }
    } catch (e) {
      toast.error("Failed to archive/restore");
    }
  };

  if (openings.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No openings found in this view.
      </div>
    );
  }

  return (
    <Table className="table-fixed w-full">
      <TableHeader>
        <TableRow>
          <TableHead className="w-full sm:w-[30%] max-w-[250px]">Title</TableHead>
          <TableHead className="w-[20%] hidden sm:table-cell">Department</TableHead>
          <TableHead className="w-[20%] hidden md:table-cell">Type</TableHead>
          <TableHead className="w-[80px] hidden sm:table-cell">Status</TableHead>
          <TableHead className="w-[120px] text-right"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {openings.map((opening) => (
          <TableRow 
            key={opening.id} 
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onViewDetail(opening)}
          >
            <TableCell className="font-medium truncate pr-4" title={opening.title}>
              {opening.title}
            </TableCell>
            <TableCell className="truncate pr-4 hidden sm:table-cell" title={opening.department}>
              {opening.department}
            </TableCell>
            <TableCell className="truncate pr-4 hidden md:table-cell" title={opening.type || ""}>
              {opening.type || "—"}
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              <Badge variant={opening.status === "open" ? "default" : "secondary"}>
                {opening.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-end gap-1">
                {opening.status === "open" && !opening.archived_at && (
                  <>
                    <Button 
                      variant="ghost" 
                      className="h-8 w-8 p-0" 
                      onClick={() => handleCopyLink(opening.id)} 
                      title="Copy Link"
                    >
                      <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="h-8 w-8 p-0" 
                      title="View as Candidate"
                      nativeButton={false}
                      render={<a href={`/careers/${opening.id}`} target="_blank" rel="noopener noreferrer" />}
                    >
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" />}>
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!isArchivedView && (
                      <DropdownMenuItem onClick={() => onEdit(opening)}>
                        Edit
                      </DropdownMenuItem>
                    )}
                    {!isArchivedView && (
                      <DropdownMenuItem onClick={() => handleToggleStatus(opening)}>
                        {opening.status === "open" ? "Close Opening" : "Reopen Opening"}
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => handleArchiveToggle(opening)}
                      className={isArchivedView ? "" : "text-destructive"}
                    >
                      {isArchivedView ? "Restore" : "Archive"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

