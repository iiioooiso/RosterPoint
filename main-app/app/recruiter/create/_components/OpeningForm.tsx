"use client";
// Force rebuild to resolve Turbopack module cache issue

import { useState, useEffect } from "react";
import { Opening, OpeningDetail, OpeningRequirement, ApplicationMaterials, CustomQuestion } from "@/lib/types";
import { createOpening, updateOpening } from "@/app/actions/openings";
import { CreatableCombobox } from "@/components/ui/creatable-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, X, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface OpeningFormProps {
  opening: Opening | null;
  onCancel: () => void;
  onSuccess: () => void;
}

export function OpeningForm({ opening, onCancel, onSuccess }: OpeningFormProps) {
  const [loading, setLoading] = useState(false);
  
  // Basic Info
  const [title, setTitle] = useState(opening?.title || "");
  const [department, setDepartment] = useState(opening?.department || "");
  const [type, setType] = useState(opening?.type || "");
  const [description, setDescription] = useState(opening?.description || "");
  
  // Dynamic arrays
  const [details, setDetails] = useState<OpeningDetail[]>(opening?.details || []);
  const [requirements, setRequirements] = useState<OpeningRequirement[]>(opening?.requirements || []);
  const [skills, setSkills] = useState<string[]>(opening?.skills || []);
  
  // Materials
  const [materials, setMaterials] = useState<ApplicationMaterials>(
    opening?.application_materials || {
      resume: { enabled: true, required: true },
      portfolio: { enabled: false, required: false },
      cover_letter: { enabled: false, required: false },
    }
  );

  // Draft states for new items
  const [newDetailLabel, setNewDetailLabel] = useState("");
  const [newDetailValue, setNewDetailValue] = useState("");
  const [newRequirement, setNewRequirement] = useState("");
  const [newSkill, setNewSkill] = useState("");

  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>(opening?.application_materials?.custom_questions || []);
  const [newQTitle, setNewQTitle] = useState("");
  const [newQType, setNewQType] = useState<"text" | "textarea" | "file">("text");
  const [newQRequired, setNewQRequired] = useState(true);

  // Restore draft on mount if not editing an existing opening
  useEffect(() => {
    if (!opening) {
      const saved = localStorage.getItem("draft_opening");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.department) setDepartment(parsed.department);
          if (parsed.type) setType(parsed.type);
          if (parsed.description) setDescription(parsed.description);
          if (parsed.details) setDetails(parsed.details);
          if (parsed.requirements) setRequirements(parsed.requirements);
          if (parsed.skills) setSkills(parsed.skills);
          if (parsed.materials) setMaterials(parsed.materials);
          if (parsed.customQuestions) setCustomQuestions(parsed.customQuestions);
        } catch (e) {
          // ignore parse errors
        }
      }
    }
  }, [opening]);

  // Save draft whenever form state changes
  useEffect(() => {
    if (!opening) {
      localStorage.setItem("draft_opening", JSON.stringify({
        title, department, type, description, details, requirements, skills, materials, customQuestions
      }));
    }
  }, [opening, title, department, type, description, details, requirements, skills, materials, customQuestions]);

  const handleAddDetail = () => {
    if (!newDetailLabel || !newDetailValue) return;
    setDetails([...details, { id: crypto.randomUUID(), label: newDetailLabel, value: newDetailValue }]);
    setNewDetailLabel("");
    setNewDetailValue("");
  };

  const handleAddRequirement = () => {
    if (!newRequirement) return;
    setRequirements([...requirements, { id: crypto.randomUUID(), text: newRequirement, required: true }]);
    setNewRequirement("");
  };

  const handleAddSkill = (e?: React.KeyboardEvent) => {
    if (e && e.key !== "Enter") return;
    e?.preventDefault();
    if (!newSkill) return;
    const normalized = newSkill.trim().toLowerCase();
    if (!skills.includes(normalized)) {
      setSkills([...skills, normalized]);
    }
    setNewSkill("");
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleAddQuestion = () => {
    if (!newQTitle) return;
    const newQ: CustomQuestion = {
      id: crypto.randomUUID(),
      title: newQTitle,
      type: newQType,
      required: newQRequired
    };
    const updated = [...customQuestions, newQ];
    setCustomQuestions(updated);
    setMaterials({ ...materials, custom_questions: updated });
    setNewQTitle("");
    setNewQType("text");
    setNewQRequired(true);
  };
  
  const handleRemoveQuestion = (id: string) => {
    const updated = customQuestions.filter(q => q.id !== id);
    setCustomQuestions(updated);
    setMaterials({ ...materials, custom_questions: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !department || !description) {
      toast.error("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    try {
      // Capture any un-added items
      const finalRequirements = [...requirements];
      if (newRequirement.trim()) {
        finalRequirements.push({ id: crypto.randomUUID(), text: newRequirement.trim(), required: true });
        setNewRequirement("");
      }
      
      const finalSkills = [...skills];
      if (newSkill.trim()) {
        const normalized = newSkill.trim().toLowerCase();
        if (!finalSkills.includes(normalized)) {
          finalSkills.push(normalized);
        }
        setNewSkill("");
      }

      const finalMaterials = { ...materials };
      let finalCustomQuestions = [...customQuestions];
      if (newQTitle.trim()) {
        finalCustomQuestions.push({
          id: crypto.randomUUID(),
          title: newQTitle.trim(),
          type: newQType,
          required: newQRequired
        });
        finalMaterials.custom_questions = finalCustomQuestions;
        setNewQTitle("");
      }

      const payload = {
        title,
        department,
        description,
        type: type || null,
        details,
        requirements: finalRequirements,
        skills: finalSkills,
        application_materials: finalMaterials,
      };

      if (opening) {
        await updateOpening(opening.id, payload);
        toast.success("Opening updated");
      } else {
        await createOpening(payload);
        toast.success("Opening created");
        localStorage.removeItem("draft_opening"); // Clear draft on successful creation
      }
      onSuccess();
    } catch (error) {
      toast.error(opening ? "Failed to update opening" : "Failed to create opening");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onCancel} className="-ml-4 gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">{opening ? "Edit Opening" : "Create Opening"}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Core details about the opening.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Opening Title <span className="text-destructive">*</span></Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Software Engineer Intern"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department <span className="text-destructive">*</span></Label>
                <CreatableCombobox 
                  options={["Engineering", "Design", "Marketing", "Sales", "Product", "HR", "Operations"]}
                  value={department}
                  onValueChange={setDepartment}
                  placeholder="Select or type to add..."
                />
              </div>
            </div>
            
            <div className="space-y-2 md:w-1/2 md:pr-2">
              <Label htmlFor="type">Opening Type</Label>
              <CreatableCombobox 
                options={["Full-time", "Part-time", "Contract", "Internship", "Freelance"]}
                value={type || ""}
                onValueChange={setType}
                placeholder="Select or type to add..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description <span className="text-destructive">*</span></Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Describe the role and responsibilities..."
                className="min-h-[200px]"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Details */}
        <Card>
          <CardHeader>
            <CardTitle>Opening Details</CardTitle>
            <CardDescription>Add structured details like Location, Salary, or Experience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {details.map((detail, idx) => (
              <div key={detail.id} className="flex items-center gap-3 bg-muted/40 p-2 rounded-md">
                <div className="font-medium min-w-[120px]">{detail.label}</div>
                <div className="flex-1 text-muted-foreground">{detail.value}</div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setDetails(details.filter(d => d.id !== detail.id))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex items-end gap-3 pt-2">
              <div className="space-y-2 flex-1">
                <Label>Label</Label>
                <Input 
                  placeholder="e.g. Location" 
                  value={newDetailLabel} 
                  onChange={(e) => setNewDetailLabel(e.target.value)} 
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label>Value</Label>
                <Input 
                  placeholder="e.g. Remote" 
                  value={newDetailValue} 
                  onChange={(e) => setNewDetailValue(e.target.value)} 
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddDetail(); } }}
                />
              </div>
              <Button type="button" onClick={handleAddDetail} variant="secondary" className="gap-2">
                <Plus className="h-4 w-4" /> Add Detail
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
            <CardDescription>Add specific requirements for this opening.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {requirements.map((req) => (
              <div key={req.id} className="flex items-center gap-4 bg-muted/40 p-2 rounded-md">
                <div className="flex-1">{req.text}</div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={req.required}
                    onCheckedChange={(checked) => {
                      setRequirements(requirements.map(r => r.id === req.id ? { ...r, required: checked } : r));
                    }}
                  />
                  <span className="text-sm text-muted-foreground min-w-[60px]">
                    {req.required ? "Required" : "Optional"}
                  </span>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setRequirements(requirements.filter(r => r.id !== req.id))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <div className="flex items-center gap-3 pt-2">
              <Input 
                placeholder="e.g. 2+ years of React experience" 
                value={newRequirement} 
                onChange={(e) => setNewRequirement(e.target.value)} 
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddRequirement(); } }}
                className="flex-1"
              />
              <Button type="button" onClick={handleAddRequirement} variant="secondary" className="gap-2">
                <Plus className="h-4 w-4" /> Add Requirement
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Skills & Tags</CardTitle>
            <CardDescription>Add relevant skills to help categorize this opening.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <div key={skill} className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  {skill}
                  <button type="button" onClick={() => handleRemoveSkill(skill)} className="hover:text-destructive ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 pt-2 max-w-sm">
              <Input 
                placeholder="e.g. React, TypeScript..." 
                value={newSkill} 
                onChange={(e) => setNewSkill(e.target.value)} 
                onKeyDown={handleAddSkill}
              />
              <Button type="button" onClick={() => handleAddSkill()} variant="secondary">
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Application Materials */}
        <Card>
          <CardHeader>
            <CardTitle>Application Materials</CardTitle>
            <CardDescription>Configure what documents candidates should provide.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(["resume", "portfolio", "cover_letter"] as const).map((key) => {
              const config = materials[key];
              const title = key.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
              return (
                <div key={key} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                  <div className="font-medium">{title}</div>
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                      <Label className="text-muted-foreground font-normal">Enabled</Label>
                      <Switch 
                        checked={config.enabled} 
                        onCheckedChange={(c) => setMaterials({...materials, [key]: {...config, enabled: c}})} 
                      />
                    </div>
                    <div className="flex items-center gap-2 w-[120px]">
                      <Label className={`font-normal ${!config.enabled ? 'opacity-50' : 'text-muted-foreground'}`}>
                        Required
                      </Label>
                      <Switch 
                        checked={config.required} 
                        disabled={!config.enabled}
                        onCheckedChange={(c) => setMaterials({...materials, [key]: {...config, required: c}})} 
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {customQuestions.length > 0 && (
              <div className="pt-6 border-t mt-6">
                <h4 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Custom Fields</h4>
                <div className="space-y-4">
                  {customQuestions.map((q) => (
                    <div key={q.id} className="flex items-center gap-4 bg-muted/40 p-3 rounded-md">
                      <div className="flex-1">
                        <div className="font-medium">{q.title}</div>
                        <div className="text-xs text-muted-foreground capitalize mt-0.5">
                          {q.type === 'file' ? 'File Upload' : q.type} Input
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch 
                          checked={q.required}
                          onCheckedChange={(checked) => {
                            const updated = customQuestions.map(curr => curr.id === q.id ? { ...curr, required: checked } : curr);
                            setCustomQuestions(updated);
                            setMaterials({ ...materials, custom_questions: updated });
                          }}
                        />
                        <span className="text-sm text-muted-foreground min-w-[60px]">
                          {q.required ? "Required" : "Optional"}
                        </span>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveQuestion(q.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-6 border-t mt-6">
              <h4 className="font-semibold mb-4 text-sm">Add Custom Field</h4>
              <div className="flex items-end gap-3">
                <div className="space-y-2 flex-1">
                  <Label>Field Title / Question</Label>
                  <Input 
                    placeholder="e.g. Why do you want to work here?" 
                    value={newQTitle}
                    onChange={(e) => setNewQTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddQuestion(); } }}
                    className="h-9"
                  />
                </div>
                <div className="space-y-2 w-[160px]">
                  <Label>Response Type</Label>
                  <Select value={newQType} onValueChange={(val: any) => setNewQType(val)}>
                    <SelectTrigger className="w-full h-9">
                      <SelectValue>
                        {newQType === 'text' ? 'Short Text' : newQType === 'textarea' ? 'Long Text' : newQType === 'file' ? 'File Upload' : 'Select'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Short Text</SelectItem>
                      <SelectItem value="textarea">Long Text</SelectItem>
                      <SelectItem value="file">File Upload</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" onClick={handleAddQuestion} variant="secondary" className="gap-2 h-9">
                  <Plus className="h-4 w-4" /> Add Field
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4 pt-4">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="min-w-[120px]">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : opening ? "Save Changes" : "Create Opening"}
          </Button>
        </div>
      </form>
    </div>
  );
}
