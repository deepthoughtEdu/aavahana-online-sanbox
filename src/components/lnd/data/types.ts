export interface McqOption {
  key: string;
  text: string;
  weight: number;
  rationale?: string;
}

export interface McqQuestion {
  id: number;
  prompt: string;
  options: McqOption[];
  gridCells: string[];
}

export interface McqBlockSource {
  type: "text" | "video" | "article";
  title: string;
  content: string;
}

export interface McqBlockData {
  id: string;
  name: string;
  framework: string;
  source: McqBlockSource;
  questions: McqQuestion[];
}
