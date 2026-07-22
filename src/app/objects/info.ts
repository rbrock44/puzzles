export interface InfoItem {
  text: string;
  strong?: string;
}

export interface InfoColumn {
  h2: string;
  p: InfoItem[];
  trivia?: string;
}