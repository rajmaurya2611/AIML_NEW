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










export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  liked?: boolean;
  disliked?: boolean;
  feedbackGiven?: boolean;
  sources?: { file: string; url: string }[];  // 👈 Add this
}


export interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export type ChatOption = 'reasoning' | 'web-search' | null;
