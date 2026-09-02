export type UserRole = "recruiter" | "interviewer";

export interface Profile {
  id: string;
  role: UserRole;
  created_at: string;
  name?: string | null;
  age?: number | null;
  sex?: string | null;
  university_name?: string | null;
  company_name?: string | null;
  job_title?: string | null;
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
  company_id?: string | null;
  company_name?: string | null;
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

export type ApplicationStage = "applied" | "screening" | "interview" | "offer" | "hired" | "rejected";

export interface CandidateResponseQuestion {
  id?: string;
  title: string;
  answer: string;
  type?: string;
}

export interface CandidateResponses {
  portfolio?: string | null;
  cover_letter?: string | null;
  questions?: CandidateResponseQuestion[];
}

export interface Application {
  id: string;
  created_at: string;
  updated_at: string;
  student_id: string;
  opening_id: string;
  stage: ApplicationStage;
  notes: string | null;
  routed_department_id: string | null;
  candidate_name: string | null;
  candidate_email: string | null;
  source: string | null;
  candidate_responses?: CandidateResponses | null;
}

export interface ApplicationInterviewer {
  id: string;
  application_id: string;
  interviewer_id: string;
  created_at: string;
}

export interface ApplicationHistory {
  id: string;
  application_id: string;
  actor_id: string | null;
  event_type: string;
  details: any;
  created_at: string;
}

export interface Interview {
  id: string;
  application_id: string;
  scheduled_at: string;
  created_at: string;
  updated_at: string;
}
