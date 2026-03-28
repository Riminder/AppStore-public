// HrFlow profile as returned by /profiles/searching
export interface HrFlowProfile {
  key: string;
  reference: string | null;
  source_key: string;
  info: {
    full_name: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    location: { text: string | null } | null;
    summary: string | null;
    picture: string | null;
  };
  experiences: HrFlowExperience[];
  educations: HrFlowEducation[];
  skills: HrFlowEntityItem[];
  languages: HrFlowEntityItem[];
  tags: { name: string; value: string }[];
  created_at: string;
  updated_at: string;
}

export interface HrFlowExperience {
  title: string | null;
  company: string | null;
  location: { text: string | null } | null;
  date_start: { iso8601: string | null } | null;
  date_end: { iso8601: string | null } | null;
  description: string | null;
}

export interface HrFlowEducation {
  title: string | null;
  school: string | null;
  location: { text: string | null } | null;
  date_start: { iso8601: string | null } | null;
  date_end: { iso8601: string | null } | null;
  description: string | null;
}

export interface HrFlowEntityItem {
  name: string;
  type: string | null;
  value: string | null;
}

// Feed events for agent activity panel
export interface FeedEvent {
  id: string;
  time: string;
  action: string;
  detail: string;
  status: "done" | "running" | "error";
  type: "connect" | "parse" | "score" | "source" | "analyze" | "notify";
}

// Chat message
export interface ChatMessage {
  id: string;
  type: "user" | "agent";
  text: string;
  time: string;
}
