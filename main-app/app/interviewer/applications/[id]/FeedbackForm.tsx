"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitApplicationFeedback, ApplicationFeedback } from "@/app/actions/interviewer-data";
import { MessageSquarePlus, CheckCircle2 } from "lucide-react";

interface FeedbackFormProps {
  applicationId: string;
  existingFeedback: ApplicationFeedback | null;
}

export function FeedbackForm({ applicationId, existingFeedback }: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) {
      toast.error("Please enter some feedback.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await submitApplicationFeedback(applicationId, feedbackText, rating);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Feedback submitted successfully!");
        setIsOpen(false);
        // We do a hard refresh or let the page reload to show existing feedback
        window.location.reload();
      }
    } catch (err: any) {
      toast.error("An error occurred while submitting feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (existingFeedback) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5 h-8" />}>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          View Feedback
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Submitted Feedback</DialogTitle>
            <DialogDescription>
              You have already evaluated this candidate.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 bg-muted/20 border rounded-md">
              <p className="text-sm whitespace-pre-wrap">{existingFeedback.details.feedback}</p>
              {existingFeedback.details.rating && (
                <div className="mt-4 pt-4 border-t text-sm flex items-center justify-between">
                  <span className="font-medium text-muted-foreground">Interviewer Rating:</span>
                  <span className="font-medium">{existingFeedback.details.rating}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant="default" size="sm" className="gap-1.5 h-8" />}>
        <MessageSquarePlus className="h-4 w-4" />
        Give Feedback
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit Interview Feedback</DialogTitle>
          <DialogDescription>
            Submit your candidate evaluation notes and recommendation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          <div className="space-y-2">
            <Label htmlFor="feedback">Your Feedback <span className="text-destructive">*</span></Label>
            <Textarea 
              id="feedback"
              placeholder="How did the interview go? What are the candidate's strengths and weaknesses?"
              className="min-h-[150px] resize-none"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rating">Overall Rating (Optional)</Label>
            <Select value={rating} onValueChange={(val) => val && setRating(val)} disabled={isSubmitting}>
              <SelectTrigger id="rating" className="w-full">
                <SelectValue placeholder="Select a rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Strong Yes">Strong Yes</SelectItem>
                <SelectItem value="Yes">Yes</SelectItem>
                <SelectItem value="Mixed">Mixed</SelectItem>
                <SelectItem value="No">No</SelectItem>
                <SelectItem value="Strong No">Strong No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !feedbackText.trim()}>
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
