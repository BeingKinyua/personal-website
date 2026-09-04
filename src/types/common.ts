export interface TimelineMilestone {
  year: string;
  quarter?: string;
  role: string;
  organization: string;
  description: string;
  impactHighlight: string;
  skills: string[];
}

export interface CurrentlyItem {
  id: string;
  category: "Building" | "Learning" | "Reading" | "Exploring";
  title: string;
  status: string;
  description: string;
  techOrSource: string;
  details: string;
  statusLogs: string[];
  snippet?: {
    filename: string;
    language: string;
    code: string;
  };
}
