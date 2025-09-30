// Version: 0.0
// export interface Message {
//   id: string;
//   content: string;
//   sender: 'user' | 'bot';
//   timestamp: Date;
//   liked?: boolean;
//   disliked?: boolean;
//   feedbackGiven?: boolean;
// }

// export interface ChatSession {
//   id: string;
//   messages: Message[];
//   createdAt: Date;
//   updatedAt: Date;
// }

// export type ChatOption = 'reasoning' | 'web-search' | null;










// export interface ChartMessage {
//   type: "bar";
//   data: any[];       // recharts data
//   keys: string[];    // dynamic data keys
// }

interface ChartConfig {
  chartType: 'bar' | 'line';
  config: any;
  data: any[];
  title?: string;
  summary?: {
    dataPoints: number;
    formattedTotal: string;
    totalValue: number;
  };
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  liked?: boolean;
  disliked?: boolean;
  feedbackGiven?: boolean;
  sources?: { file: string; url: string }[];
  options?: { id: string; text: string }[];
  chartConfig?: ChartConfig;   // 👈 optional chart data
}

export interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export type ChatOption = 'reasoning' | 'web-search' | null;
