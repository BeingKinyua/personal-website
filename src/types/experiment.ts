export type ExperimentStatus =
  | "Idea"
  | "Exploring"
  | "Prototype"
  | "Building"
  | "Paused"
  | "Archived";

export interface Experiment {
  id: string;
  number: string; // e.g. "EXPERIMENT 07"
  title: string;
  status: ExperimentStatus;
  category: string;
  hypothesis: string;
  currentState: string;
  nextExperiment: string;
  tags: string[];
  findings?: string;
  metrics?: { label: string; value: string }[];
  snippet?: {
    filename: string;
    language: string;
    code: string;
  };
}
