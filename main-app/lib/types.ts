export type UserRole = "recruiter" | "interviewer";

export interface Profile {
  id: string;
  role: UserRole;
  created_at: string;
}

export type OpeningStatus = "open" | "closed";

export interface OpeningDetail {
  id: string;
  label: string;
  value: string;
}

export interface OpeningRequirement {
  id: string;
  text: string;
  required: boolean;
}

export interface CustomQuestion {
  id: string;
  type: "text" | "textarea" | "file";
  title: string;
  required: boolean;
}

export interface ApplicationMaterials {
  resume: { enabled: boolean; required: boolean };
  portfolio: { enabled: boolean; required: boolean };
  cover_letter: { enabled: boolean; required: boolean };
  custom_questions?: CustomQuestion[];
}

export interface Opening {
  id: string;
  created_at: string;
  updated_at: string;
  recruiter_id: string;
  title: string;
  department: string;
  description: string;
  status: OpeningStatus;
  type: string | null;
  archived_at: string | null;
  details: OpeningDetail[];
  requirements: OpeningRequirement[];
  skills: string[];
  application_materials: ApplicationMaterials;
}
