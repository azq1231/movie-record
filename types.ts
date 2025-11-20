export interface Show {
  id: string;
  title: string;
  currentSeason: number;
  currentEpisode: number;
  status: ShowStatus;
  lastUpdated: number;
}

export enum ShowStatus {
  WATCHING = 'Watching',
  WAITING = 'Waiting for New Season',
  COMPLETED = 'Completed',
  DROPPED = 'Dropped',
}

export interface UserProfile {
  id: string;
  name: string;
  color: string; // Hex color or tailwind class reference
  createdAt: number;
}

export interface GeminiShowDetails {
  description: string;
  genres: string[];
  statusSuggestion: string;
  posterUrl?: string;
  source?: {
    title: string;
    url: string;
  };
}