"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { submitApplicationFeedback, ApplicationFeedback } from "@/app/actions/interviewer-data";

interface FeedbackFormProps {
  applicationId: string;
  existingFeedback: ApplicationFeedback | null;
}

export function FeedbackForm({ applicationId, existingFeedback }: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState("");

  if (existingFeedback) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-muted/20 border rounded-md">
          <h4 className="font-medium text-sm mb-2 text-muted-foreground">Submitted Feedback</h4>
          <p className="text-sm whitespace-pre-wrap">{existingFeedback.details.feedback}</p>
          {existingFeedback.details.rating && (
            <div className="mt-3 text-sm">
              <span className="font-medium text-muted-foreground">Rating: </span>
              {existingFeedback.details.rating}
            </div>
          )}
        </div>
      </div>
    );
  }

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
        // We do a hard refresh or let the page reload to show existing feedback
        window.location.reload();
      }
    } catch (err: any) {
      toast.error("An error occurred while submitting feedback.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="feedback">Your Feedback</Label>
        <Textarea 
          id="feedback"
          placeholder="How did the interview go? What are the candidate's strengths and weaknesses?"
          className="min-h-[150px]"
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rating">Overall Rating (Optional)</Label>
        <select 
          id="rating"
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          disabled={isSubmitting}
        >
          <option value="">Select a rating</option>
          <option value="Strong Yes">Strong Yes</option>
          <option value="Yes">Yes</option>
          <option value="Mixed">Mixed</option>
          <option value="No">No</option>
          <option value="Strong No">Strong No</option>
        </select>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Submitting..." : "Submit Feedback"}
      </Button>
    </form>
  );
}
