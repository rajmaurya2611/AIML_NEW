// import React, { useState, useEffect } from "react";
// import { Message } from "../types_Capex/chat";
// import { ThumbsUp, ThumbsDown, Copy, CheckIcon } from "lucide-react";
// import ReactMarkdown from "react-markdown";
// import remarkGfm from "remark-gfm";
// import {
//   LineChart,
//   Line,
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   CartesianGrid,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";

// interface MessageBubbleProps {
//   message: Message;
//   onLike: (messageId: string) => void;
//   onDislike: (messageId: string) => void;
//   onRefine: (message: Message) => void; // ✅ add this
// }


// /** Try to turn backend payload (possibly JSON) into displayable text + meta */
// function normalizeContent(raw: string): { text: string; status?: string } {
//   try {
//     const obj = JSON.parse(raw);
//     if (obj && typeof obj === "object") {
//       if (typeof obj.message === "string") {
//         return { text: obj.message, status: typeof obj.status === "string" ? obj.status : undefined };
//       }
//       if (typeof obj.response === "string") {
//         return { text: obj.response, status: typeof obj.status === "string" ? obj.status : undefined };
//       }
//     }
//   } catch {
//     /* not JSON */
//   }
//   return { text: raw };
// }

// /** Heuristic: treat a cell as numeric if it looks like €, digits, commas/periods, or a dash */
// const looksNumeric = (value: any) => {
//   const s = (Array.isArray(value) ? value[0] : value)?.toString?.().trim?.() ?? "";
//   return /^([€]?\s*)?[-\d][\d,]*(\.\d+)?$/.test(s);
// };

// const MarkdownTableWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
//   <div className="relative -mx-1 sm:mx-0 my-4 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
//     <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent" />
//     <div className="min-w-full">{children}</div>
//   </div>
// );

// const markdownComponents = {
//   table: (props: any) => (
//     <MarkdownTableWrapper>
//       <table {...props} className="w-full border-collapse text-[13px] sm:text-sm" />
//     </MarkdownTableWrapper>
//   ),
//   thead: (props: any) => (
//     <thead {...props} className="bg-gray-50 text-gray-900 font-semibold sticky top-0 z-10" />
//   ),
//   th: (props: any) => (
//     <th {...props} className="px-3 py-2 border-b border-gray-200 text-left whitespace-nowrap" />
//   ),
//   tr: (props: any) => (
//     <tr
//       {...props}
//       className="even:bg-white odd:bg-gray-50 border-b border-gray-100 hover:bg-gray-100/60 transition-colors"
//     />
//   ),
//   td: (props: any) => {
//     const numeric = looksNumeric(props.children);
//     return (
//       <td
//         {...props}
//         className={[
//           "px-3 py-2 border-b border-gray-100 align-top whitespace-nowrap",
//           numeric ? "text-right tabular-nums" : "text-left",
//         ].join(" ")}
//       />
//     );
//   },
//   code: ({ inline, className, children, ...props }: any) => (
//     <code
//       className={`${inline ? "bg-gray-100 px-1 rounded text-red-600" : "block bg-gray-900 text-white p-2 rounded-lg"
//         } ${className || ""}`}
//       {...props}
//     >
//       {children}
//     </code>
//   ),
// };

// /* ---------------------- Parsing & Transform helpers ---------------------- */

// type ParsedTable = {
//   title: string;
//   headers: string[];
//   rows: string[][];
// };

// type PivotResult = {
//   tableTitle: string;
//   months: string[];
//   seriesKeys: string[];
//   dataByMonth: Array<Record<string, string | number>>;
//   monthlyTotals?: number[];
// };

// const stripMd = (s: string) => s.replace(/\*\*/g, "").replace(/\*/g, "").trim();

// const parseCurrency = (s: string) => {
//   const cleaned = s.replace(/[€,\s]/g, "");
//   if (cleaned === "" || cleaned === "-") return 0;
//   const n = Number(cleaned);
//   return Number.isFinite(n) ? n : 0;
// };

// const parseAllMarkdownTables = (markdown: string): ParsedTable[] => {
//   const lines = markdown.split("\n");
//   const tables: ParsedTable[] = [];

//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i].trim();
//     if (!line.startsWith("|")) continue;

//     const t: string[] = [];
//     let j = i;
//     while (j < lines.length && lines[j].trim().startsWith("|")) {
//       t.push(lines[j].trim());
//       j++;
//     }

//     if (t.length >= 2 && t[1].includes("---")) {
//       let title = "Table";
//       for (let k = i - 1; k >= 0; k--) {
//         const prev = lines[k].trim();
//         if (prev.startsWith("### ")) {
//           title = prev.replace(/^###\s*/, "").trim();
//           break;
//         }
//       }

//       const headerLine = t[0];
//       const headers = headerLine
//         .split("|")
//         .map((h) => h.trim())
//         .filter(Boolean);

//       const rowLines = t.slice(2);
//       const rows = rowLines.map((rl) =>
//         rl
//           .split("|")
//           .map((c) => stripMd(c.trim()))
//           .filter(Boolean)
//       );

//       tables.push({ title, headers, rows });
//       i = j - 1;
//     }
//   }

//   return tables;
// };

// const pivotTable = (pt: ParsedTable): PivotResult => {
//   // headers[0] is label (e.g., "Project"), the rest are months
//   const months = pt.headers.slice(1); // <- avoid unused 'first'

//   const nameCount: Record<string, number> = {};
//   let totalsRowIndex = -1;

//   for (let i = 0; i < pt.rows.length; i++) {
//     const name = stripMd(pt.rows[i][0] || "");
//     if (/^monthly\s+total$/i.test(name.replace(/\s+/g, " ").trim())) {
//       totalsRowIndex = i;
//       break;
//     }
//   }

//   const seriesMap: Record<string, number[]> = {};
//   pt.rows.forEach((row, idx) => {
//     if (idx === totalsRowIndex) return;
//     const rawName = stripMd(row[0] || "");
//     const baseName = rawName || `Project ${idx + 1}`;
//     nameCount[baseName] = (nameCount[baseName] || 0) + 1;
//     const name = nameCount[baseName] > 1 ? `${baseName} (${nameCount[baseName]})` : baseName;

//     const values = months.map((_, mIdx) => parseCurrency(row[mIdx + 1] || ""));
//     seriesMap[name] = values;
//   });

//   let monthlyTotals: number[] | undefined = undefined;
//   if (totalsRowIndex >= 0) {
//     const trow = pt.rows[totalsRowIndex];
//     monthlyTotals = months.map((_, mIdx) => parseCurrency(trow[mIdx + 1] || ""));
//   }

//   const dataByMonth = months.map((m, idx) => {
//     const obj: Record<string, string | number> = { month: m };
//     for (const key of Object.keys(seriesMap)) {
//       obj[key] = seriesMap[key][idx] ?? 0;
//     }
//     if (monthlyTotals) obj["Monthly total"] = monthlyTotals[idx];
//     return obj;
//   });

//   return {
//     tableTitle: pt.title,
//     months,
//     seriesKeys: Object.keys(seriesMap),
//     dataByMonth,
//     monthlyTotals,
//   };
// };

// const formatCurrency = (n: number) =>
//   new Intl.NumberFormat("en-US", {
//     style: "currency",
//     currency: "EUR",
//     maximumFractionDigits: 2,
//   }).format(n);

// const colorForIndex = (i: number) => `hsl(${(i * 67) % 360} 70% 45%)`;

// /* ------------------------------ Component ------------------------------ */

// const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onLike, onDislike, onRefine }) => {
//   const isUser = message.sender === "user";
//   const [copied, setCopied] = useState(false);

//   const { text: displayText, status } = React.useMemo(
//     () => normalizeContent(message.content ?? ""),
//     [message.content]
//   );

//   const [pivoted, setPivoted] = useState<PivotResult[]>([]);

//   useEffect(() => {
//     if (isUser) return;
//     const tables = parseAllMarkdownTables(displayText);
//     const pivots = tables.map(pivotTable);
//     setPivoted(pivots);
//   }, [displayText, isUser]);

//   const handleLike = async () => {
//     onLike(message.id);
//     try {
//       await fetch(`${import.meta.env.VITE_CAPEX_BASE_URL}/feedback`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ liked: true }),
//       });
//     } catch (error) {
//       console.error("❌ Failed to send like feedback:", error);
//     }
//   };

//   const handleDislike = async () => {
//     onDislike(message.id);
//     try {
//       await fetch(`${import.meta.env.VITE_CAPEX_BASE_URL}/feedback`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ disliked: true }),
//       });
//     } catch (error) {
//       console.error("❌ Failed to send dislike feedback:", error);
//     }
//   };

//   // No unused param here anymore
//   const handleCopy = () => {
//     const messageToCopy = (message as any).text || displayText || message.content;
//     if (!messageToCopy) return;
//     navigator.clipboard
//       .writeText(messageToCopy)
//       .then(() => {
//         setCopied(true);
//         setTimeout(() => setCopied(false), 1800);
//       })
//       .catch((err) => console.error("Failed to copy text:", err));
//   };

//   return (
//     <div className={`${isUser ? "flex ms-prompt justify-end" : "ms-response"} mb-4`}>
//       <div
//         className={[
//           "max-w-[95%] md:max-w-[85%] lg:max-w-[75%] rounded-2xl p-4",
//           isUser
//             ? "bg-chat-red text-white rounded-br-none"
//             : "bg-gray-100 text-gray-900 rounded-bl-none ms-response",
//         ].join(" ")}
//       >
//         {isUser ? (
//           <p className="text-sm leading-relaxed">{displayText}</p>
//         ) : (
//           <div>
//             {status === "clarification" && (
//               <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
//                 Clarification needed
//               </div>
//             )}

//             <div className="chat-markdown mayank prose prose-sm sm:prose-base max-w-none prose-headings:mt-0 prose-p:my-2 prose-th:font-semibold prose-code:before:hidden prose-code:after:hidden">
//               <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents as any}>
//                 {displayText}
//               </ReactMarkdown>
//             </div>

//             {pivoted.length > 0 && (
//               <div className="mt-6 space-y-10">
//                 {pivoted.map((piv, tIdx) => (
//                   <div key={tIdx} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
//                     <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
//                       {piv.tableTitle} — Visualization
//                     </h4>

//                     <div className="mb-6">
//                       <h5 className="text-sm font-medium text-gray-700 mb-2">Monthly trend by project</h5>
//                       <ResponsiveContainer width="100%" height={320}>
//                         <LineChart data={piv.dataByMonth}>
//                           <CartesianGrid strokeDasharray="4 4" />
//                           <XAxis dataKey="month" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={50} />
//                           <YAxis tickFormatter={(v) => formatCurrency(v as number)} tick={{ fontSize: 12 }} width={90} />
//                           <Tooltip formatter={(value: any, name: string) => [formatCurrency(Number(value)), name]} labelFormatter={(label) => label} />
//                           <Legend wrapperStyle={{ fontSize: 12 }} />
//                           {piv.seriesKeys.map((key, i) => (
//                             <Line
//                               key={key}
//                               type="monotone"
//                               dataKey={key}
//                               stroke={colorForIndex(i)}
//                               dot={false}
//                               strokeWidth={2}
//                               isAnimationActive={true}
//                             />
//                           ))}
//                         </LineChart>
//                       </ResponsiveContainer>
//                     </div>

//                     {piv.monthlyTotals && (
//                       <div>
//                         <h5 className="text-sm font-medium text-gray-700 mb-2">Monthly totals</h5>
//                         <ResponsiveContainer width="100%" height={300}>
//                           <BarChart data={piv.dataByMonth}>
//                             <CartesianGrid strokeDasharray="4 4" />
//                             <XAxis dataKey="month" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={50} />
//                             <YAxis tickFormatter={(v) => formatCurrency(v as number)} tick={{ fontSize: 12 }} width={90} />
//                             <Tooltip formatter={(value: any) => formatCurrency(Number(value))} labelFormatter={(label) => label} />
//                             <Legend wrapperStyle={{ fontSize: 12 }} />
//                             <Bar dataKey="Monthly total" fill={colorForIndex(9)} isAnimationActive={true} />
//                           </BarChart>
//                         </ResponsiveContainer>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}

//             {message.sources && message.sources.length > 0 && (
//               <div className="mt-4">
//                 <p className="text-sm font-semibold mb-2 text-gray-8 00">📂 Source files used (click to view):</p>
//                 <div className="flex flex-wrap gap-2">
//                   {message.sources.map((source: any) => (
//                     <a
//                       key={source.url}
//                       href={source.url}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="inline-block text-gray-800 bg-gray-200/60 hover:bg-gray-300 px-3 py-1 rounded-md text-xs sm:text-sm transition-colors"
//                     >
//                       📄 {source.file}
//                     </a>
//                   ))}
//                 </div>
//               </div>
//             )}

//             <div className="flex justify-end mt-2 pt-2 border-t border-gray-200/60">
//               <div className="flex gap-1.5">
//                 <button
//                   onClick={handleLike}
//                   className={`rounded-full p-1.5 transition-colors ${message.liked ? "bg-green-100 text-green-600" : "text-gray-400 hover:text-green-600"
//                     }`}
//                   aria-label="Like"
//                   title="Like"
//                 >
//                   <ThumbsUp className="w-4 h-4" />
//                 </button>
//                 <button
//                   onClick={handleDislike}
//                   className={`rounded-full p-1.5 transition-colors ${message.disliked ? "bg-red-100 text-chat-red" : "text-gray-400 hover:text-chat-red"
//                     }`}
//                   aria-label="Dislike"
//                   title="Dislike"
//                 >
//                   <ThumbsDown className="w-4 h-4" />
//                 </button>
//                 <button
//                   onClick={handleCopy} // <- no arg
//                   className={`rounded-full p-1.5 transition-colors ${copied ? "text-green-600" : "text-gray-400 hover:text-gray-600"
//                     }`}
//                   aria-label="Copy message"
//                   title="Copy to clipboard"
//                 >
//                   {copied ? <CheckIcon className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
//                 </button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//       {/* ✅ Refine Response button (delegated to parent) */}
//       {!isUser && (
//         <div className="reset-file-btn max-w-[95%] md:max-w-[85%] lg:max-w-[75%] text-right mt-1">
//           <p
//             className="cursor-pointer text-blue-600 hover:underline text-sm"
//             onClick={() => onRefine(message)}
//           >
//             Refine Response
//           </p>
//         </div>
//       )}

//     </div>
//   );
// };

// export default MessageBubble;


import React, { useState, useEffect } from "react";
import { Message } from "../types_Capex/chat";
import { ThumbsUp, ThumbsDown, Copy, CheckIcon, MessageSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

interface MessageBubbleProps {
  message: Message;
  onLike: (messageId: string) => void;
  onDislike: (messageId: string) => void;
  onMenuOptionClick?: (messageId: string, option: { id: string; text: string }) => void;
}

function normalizeContent(raw: string): { text: string; status?: string } {
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object") {
      if (typeof obj.message === "string") {
        return { text: obj.message, status: typeof obj.status === "string" ? obj.status : undefined };
      }
      if (typeof obj.response === "string") {
        return { text: obj.response, status: typeof obj.status === "string" ? obj.status : undefined };
      }
    }
  } catch {
    /* not JSON */
  }
  return { text: raw };
}

/** Heuristic: treat a cell as numeric if it looks like €, digits, commas/periods, or a dash */
const looksNumeric = (value: any) => {
  const s = (Array.isArray(value) ? value[0] : value)?.toString?.().trim?.() ?? "";
  return /^([€]?\s*)?[-\d][\d,]*(\.\d+)?$/.test(s);
};

const MarkdownTableWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative -mx-1 sm:mx-0 my-4 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
    <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent invisible" />
    <div className="min-w-full">{children}</div>
  </div>
);

const markdownComponents = {
  table: (props: any) => (
    <MarkdownTableWrapper>
      <table {...props} className="w-full border-collapse text-[13px] sm:text-sm" />
    </MarkdownTableWrapper>
  ),
  thead: (props: any) => (
    <thead {...props} className="bg-gray-50 text-gray-900 font-semibold sticky top-0 z-10" />
  ),
  th: (props: any) => (
    <th {...props} className="px-3 py-2 border-b border-gray-200 text-left whitespace-nowrap" />
  ),
  tr: (props: any) => (
    <tr {...props} className="even:bg-white odd:bg-gray-50 border-b border-gray-100 hover:bg-gray-100/60 transition-colors" />
  ),
  td: (props: any) => {
    const numeric = looksNumeric(props.children);
    return (
      <td
        {...props}
        className={[
          "px-3 py-2 border-b border-gray-100 align-top whitespace-nowrap",
          numeric ? "text-right tabular-nums" : "text-left",
        ].join(" ")}
      />
    );
  },
  code: ({ inline, className, children, ...props }: any) => (
    <code
      className={`${inline ? "bg-gray-100 px-1 rounded text-red-600" : "block bg-gray-900 text-white p-2 rounded-lg"
        } ${className || ""}`}
      {...props}
    >
      {children}
    </code>
  ),
};

/* ---------------------- Parsing & Transform helpers ---------------------- */

type ParsedTable = {
  title: string;
  headers: string[];
  rows: string[][];
};

type PivotResult = {
  tableTitle: string;
  months: string[];
  seriesKeys: string[];
  dataByMonth: Array<Record<string, string | number>>;
  monthlyTotals?: number[];
};

const stripMd = (s: string) => s.replace(/\*\*/g, "").replace(/\*/g, "").trim();

const parseCurrency = (s: string) => {
  const cleaned = s.replace(/[€,\s]/g, "");
  if (cleaned === "" || cleaned === "-") return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
};

const parseAllMarkdownTables = (markdown: string): ParsedTable[] => {
  const lines = markdown.split("\n");
  const tables: ParsedTable[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("|")) continue;

    const t: string[] = [];
    let j = i;
    while (j < lines.length && lines[j].trim().startsWith("|")) {
      t.push(lines[j].trim());
      j++;
    }

    if (t.length >= 2 && t[1].includes("---")) {
      let title = "Table";
      for (let k = i - 1; k >= 0; k--) {
        const prev = lines[k].trim();
        if (prev.startsWith("### ")) {
          title = prev.replace(/^###\s*/, "").trim();
          break;
        }
      }

      const headerLine = t[0];
      const headers = headerLine
        .split("|")
        .map((h) => h.trim())
        .filter((h, idx, arr) => !(idx === 0 && h === "") && !(idx === arr.length - 1 && h === "")); 
      // ✅ only strip leading/trailing blanks, not in-between

      const rowLines = t.slice(2);
      const rows = rowLines.map((rl) => {
        let cells = rl.split("|").map((c) => stripMd(c.trim()));
        // Remove only the first/last empty if row starts/ends with a pipe
        if (cells.length && cells[0] === "") cells.shift();
        if (cells.length && cells[cells.length - 1] === "") cells.pop();
        return cells; // ✅ do NOT filter(Boolean) → keep blanks
      });

      tables.push({ title, headers, rows });
      i = j - 1;
    }
  }

  return tables;
};


const pivotTable = (pt: ParsedTable): PivotResult => {
  const months = pt.headers.slice(1);

  const nameCount: Record<string, number> = {};
  let totalsRowIndex = -1;

  for (let i = 0; i < pt.rows.length; i++) {
    const name = stripMd(pt.rows[i][0] || "");
    if (/^monthly\s+total$/i.test(name.replace(/\s+/g, " ").trim())) {
      totalsRowIndex = i;
      break;
    }
  }

  const seriesMap: Record<string, number[]> = {};
  pt.rows.forEach((row, idx) => {
    if (idx === totalsRowIndex) return;
    const rawName = stripMd(row[0] || "");
    const baseName = rawName || `Project ${idx + 1}`;
    nameCount[baseName] = (nameCount[baseName] || 0) + 1;
    const name = nameCount[baseName] > 1 ? `${baseName} (${nameCount[baseName]})` : baseName;

    const values = months.map((_, mIdx) => parseCurrency(row[mIdx + 1] || ""));
    seriesMap[name] = values;
  });

  let monthlyTotals: number[] | undefined = undefined;
  if (totalsRowIndex >= 0) {
    const trow = pt.rows[totalsRowIndex];
    monthlyTotals = months.map((_, mIdx) => parseCurrency(trow[mIdx + 1] || ""));
  }

  const dataByMonth = months.map((m, idx) => {
    const obj: Record<string, string | number> = { month: m };
    for (const key of Object.keys(seriesMap)) {
      obj[key] = seriesMap[key][idx] ?? 0;
    }
    if (monthlyTotals) obj["Monthly total"] = monthlyTotals[idx];
    return obj;
  });

  return {
    tableTitle: pt.title,
    months,
    seriesKeys: Object.keys(seriesMap),
    dataByMonth,
    monthlyTotals,
  };
};

// const formatCurrency = (n: number) =>
//   new Intl.NumberFormat("en-US", {
//     style: "currency",
//     currency: "EUR",
//     maximumFractionDigits: 2,
//   }).format(n);

// const colorForIndex = (i: number) => `hsl(${(i * 67) % 360} 70% 45%)`;
const colors = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
  "#f97316", // orange
  "#14b8a6", // teal
  "#6366f1", // indigo
  "#a855f7", // purple
  "#22c55e", // emerald
  "#eab308", // yellow
  "#0ea5e9", // sky
  "#d946ef", // fuchsia
  "#475569", // slate
  "#f43f5e", // rose
  "#0891b2", // cyan dark
  "#65a30d", // olive/lime dark
  "#2563eb", // deep blue
  "#dc2626", // deep red
  "#7c3aed", // deep violet
  "#fb923c", // light orange
  "#15803d", // forest green
];

function colorForIndex(i: number) {
  return colors[i % colors.length];
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onLike,
  onDislike,
  onMenuOptionClick,
}) => {
  const isUser = message.sender === "user";
  const [copied, setCopied] = useState(false);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");

  const { text: displayText, status } = React.useMemo(
    () => normalizeContent(message.content ?? ""),
    [message.content]
  );

  const [pivoted, setPivoted] = useState<any[]>([]);

  useEffect(() => {
    if (isUser) return;
    const tables = parseAllMarkdownTables(displayText);
    const pivots = tables.map(pivotTable);
    setPivoted(pivots);
  }, [displayText, isUser]);

  const handleLike = async () => {
    onLike(message.id);
    try {
      await fetch(`${import.meta.env.VITE_CAPEX_BASE_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: message.id, feedback: "like", content: displayText }),
      });
    } catch (error) {
      console.error("❌ Failed to send like feedback:", error);
    }
  };

  const handleDislike = async () => {
    onDislike(message.id);
    try {
      await fetch(`${import.meta.env.VITE_CAPEX_BASE_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: message.id, feedback: "dislike", content: displayText }),
      });
    } catch (error) {
      console.error("❌ Failed to send dislike feedback:", error);
    }
  };

  const submitFeedbackText = async () => {
    if (!feedbackText.trim()) {
      alert("Please enter feedback text");
      return;
    }
    try {
      await fetch(`${import.meta.env.VITE_CAPEX_BASE_URL}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message_id: message.id,
          feedback: "text",
          content: feedbackText.trim(),
        }),
      });
      setShowFeedbackPopup(false);
      setFeedbackText("");
      alert("Thank you for your feedback!");
    } catch (error) {
      console.error("❌ Failed to send text feedback:", error);
      alert("Failed to send feedback, please try again.");
    }
  };

  const handleCopy = () => {
    const messageToCopy = (message as any).text || displayText || message.content;
    if (!messageToCopy) return;
    navigator.clipboard
      .writeText(messageToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      })
      .catch((err) => console.error("Failed to copy text:", err));
  };

  const hasMenuOptions = message.options && message.options.length > 0;

  const downloadOneMarkdownTableAsExcel = (tableMarkdown: string, tableHeading: string) => {
    // Extract a single table from markdown string
    const lines = tableMarkdown.split("\n");
    let tableStart = -1,
      tableEnd = -1;
    for (let i = 0; i < lines.length; ++i) {
      if (lines[i].trim().startsWith("|")) {
        if (tableStart === -1) tableStart = i;
        tableEnd = i;
      }
    }
    if (tableStart === -1 || tableEnd === -1) {
      alert("Table not found.");
      return;
    }

    // Optionally extract the headers from the heading above table, or use `tableHeading`
    let title = tableHeading;
    for (let i = tableStart - 1; i >= 0; --i) {
      if (lines[i].startsWith("###")) {
        title = lines[i].replace(/^#{2,}\s*/, "");
        break;
      }
    }

    const body = lines.slice(tableStart, tableEnd + 1).join("\n");
    // Parse using your existing markdown parser
    const [parsed] = parseAllMarkdownTables(body);

      if (!parsed) {
        alert("Could not parse table.");
        return;
      }

      const colCount = parsed.headers.length;
      const sheetData: any[] = [];

      // Add table title as first row (optional)
      sheetData.push([title]);
      sheetData.push([]); // empty row
      sheetData.push(parsed.headers.map(h => (h == null ? "" : String(h).trim()))); // headers

      // --- FIXED ROW NORMALIZATION ---
      const normalizeRow = (row: any): string[] => {
        let cells: string[];
        if (Array.isArray(row)) {
          cells = row.map(c => (c == null ? "" : String(c).trim()));
        } else {
          // Fallback: split raw markdown line
          cells = String(row).split("|");
          if (cells.length && cells[0].trim() === "") cells.shift();
          if (cells.length && cells[cells.length - 1].trim() === "") cells.pop();
          cells = cells.map(c => c.trim());
        }

        // Pad or trim to match header length
        if (cells.length < colCount) {
          cells = cells.concat(Array(colCount - cells.length).fill(""));
        } else if (cells.length > colCount) {
          cells = cells.slice(0, colCount);
        }
        return cells;
      };

      parsed.rows.forEach(row => sheetData.push(normalizeRow(row)));

      // Export as Excel
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      const safeSheetName =
        (title || "Sheet").replace(/[:\\/?*\[\]]/g, "_").substring(0, 31) || "Sheet";
      XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      saveAs(blob, `${(title || "table").replace(/\s+/g, "_")}_${new Date().toISOString()}.xlsx`);
    };

  // Export a chart div to PDF
  const exportChartToPdf = async (chartId: string, title = "chart") => {
    const input = document.getElementById(chartId);
    if (!input) {
      alert("Chart not found for PDF export!");
      return;
    }

    // Use html2canvas to render chart DOM as image
    const canvas = await html2canvas(input, { scale: 2, backgroundColor: "#fff" });
    const imgData = canvas.toDataURL("image/png");

    // Create jsPDF instance
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: [canvas.width, canvas.height]
    });

    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.setFontSize(14);
    pdf.text(title, 32, 32);
    pdf.save(`${title.replace(/\s+/g, "_")}_${new Date().toISOString()}.pdf`);
  };



  return (
    <div className={`${isUser ? "flex ms-prompt justify-end" : "ms-response"} mb-4`}>
      
      <div
        className={[
          "max-w-[95%] md:max-w-[85%] lg:max-w-[75%] rounded-2xl p-4",
          isUser
            ? "bg-chat-red text-white rounded-br-none"
            : "bg-gray-100 text-gray-900 rounded-bl-none ms-response",
        ].join(" ")}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed">{displayText}</p>
        ) : (
          <div>
            {hasMenuOptions && onMenuOptionClick && (
              <div>
                <p className="mb-3 text-base text-gray-800">{message.content}</p>
                <div className="flex gap-4 flex-wrap">
                  {Array.isArray(message.options) &&
                    message.options.map((opt) => (
                      <button
                        key={opt.id}
                        className="text-[#da2128] px-3 py-1 border border-[#ddd] rounded-xl text-sm hover:text-[#fff] hover:bg-[#da2128] transition"
                        onClick={() => onMenuOptionClick(message.id, opt)}
                      >
                        {opt.text}
                      </button>
                    ))}
                </div>
                <p className="mb-3 text-base text-gray-800 mt-3">Enter <span style={{fontWeight:"bold"}}>Exit</span> to change the area of interest.</p>
              </div>
            )}

            {!hasMenuOptions && (
              <>
                {status === "clarification" && (
                  <div className="mb-2 inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                    Clarification needed
                  </div>
                )}

                <div className="chat-markdown mayank prose prose-sm sm:prose-base max-w-none prose-headings:mt-0 prose-p:my-2 prose-th:font-semibold prose-code:before:hidden prose-code:after:hidden">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents as any}>
                    {displayText}
                  </ReactMarkdown>
                </div>
                
                {pivoted.length > 0 && (
                  <div className="mt-6 space-y-10">
                    <div className="mb-4 text-right">
                      <button
                        onClick={() => downloadOneMarkdownTableAsExcel(displayText, "Total Investment")}
                        className="bg-[#da2128] text-white text-sm px-2 py-1 rounded-md transition"
                        title="Download all tables as Excel"
                      >
                        Download as Excel
                      </button>
                    </div>
                    {/* {pivoted.map((piv, tIdx) => {
                      const chartId = `chart-container-${message.id}-${tIdx}`;
                      return (
                        <div
                          key={tIdx}
                          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
                            {piv.tableTitle} — Visualization
                          </h4>
                          <div className="text-right">
                            <button
                              onClick={() => exportChartToPdf(chartId, piv.tableTitle)}
                              className="bg-[#da2128] text-white text-sm px-2 py-1 rounded-md transition"
                            >
                              Download chart as PDF
                            </button>
                          </div>
                          </div>
                        </div>
                      )
                    })} */}
                  </div>
                )}
                {message.chart && (
                  <div className="mt-6">
                    <div className="mb-4 text-right">
                      <button
                        onClick={() =>
                          exportChartToPdf(`chart-${message.id}`, message.content || "Chart")
                        }
                        className="bg-[#da2128] text-white text-sm px-2 py-1 rounded-md transition"
                      >
                        Download chart as PDF
                      </button>
                    </div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">
                      {message.content}
                    </h5>
<div id={`chart-${message.id}`}>
  <ResponsiveContainer width="100%" height={350}>
    {message.chart.type === "bar" ? (
      // <BarChart data={message.chart.data}>
      //   <CartesianGrid strokeDasharray="4 4" />
      //   <XAxis dataKey="name" tick={false} axisLine={false} />
      //   <YAxis tick={{ fontSize: 12 }} />
      //   <Tooltip />
      //   <Legend />
      //   {message.chart.keys.map((key: string, i: number) => (
      //     <Bar
      //       key={key}
      //       dataKey={key}
      //       fill={colorForIndex(i)}   // legend + bar color
      //       isAnimationActive={true}
      //     />
      //   ))}
      // </BarChart>

      <BarChart data={message.chart.data}>
        <CartesianGrid strokeDasharray="4 4" />
        <XAxis dataKey="name" tick={false} axisLine={false} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Legend />
        {message.chart.keys.map((key: string) => (
          <Bar
            key={key}
            dataKey={key}
            isAnimationActive={true}
          >
            {message.chart?.data.map((_, barIndex) => (
              <Cell
                key={`cell-${barIndex}`}
                fill={colorForIndex(barIndex)}
              />
            ))}
          </Bar>
        ))}
      </BarChart>

    ) : (
      <LineChart data={message.chart.data}>
        <CartesianGrid strokeDasharray="4 4" />
        <XAxis dataKey="name" tick={false} axisLine={false} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        {message.chart.keys.map((key: string, i: number) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colorForIndex(i)}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    )}
  </ResponsiveContainer>

{/* Custom X labels */}
<div className="flex justify-between mt-2">
  {message.chart.data.map((d: any, i: number) => (
    <span
      key={i}
      className="text-xs font-medium"
      style={{ color: colorForIndex(i) }} // Use dynamic color per index
    >
      {d.name}
    </span>
  ))}
</div>

</div>


                  </div>
                )}
                
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold mb-2 text-gray-800">
                      📂 Source files used (click to view):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {message.sources.map((source: any) => (
                        <a
                          key={source.url}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-gray-800 bg-gray-200/60 hover:bg-gray-300 px-3 py-1 rounded-md text-xs sm:text-sm transition-colors"
                        >
                          📄 {source.file}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feedback / actions */}
                <div className="flex justify-end mt-2 pt-2 border-t border-gray-200/60 items-center gap-1.5">
                  <button
                    onClick={handleLike}
                    className={`rounded-full p-1.5 transition-colors ${message.liked ? "bg-green-100 text-green-600" : "text-gray-400 hover:text-green-600"
                      }`}
                    aria-label="Like"
                    title="Like"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDislike}
                    className={`rounded-full p-1.5 transition-colors ${message.disliked ? "bg-red-100 text-chat-red" : "text-gray-400 hover:text-chat-red"
                      }`}
                    aria-label="Dislike"
                    title="Dislike"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </button>

                  {/* Feedback popup */}
                  <div className="relative">
                    <button
                      onClick={() => setShowFeedbackPopup(!showFeedbackPopup)}
                      className="rounded-full p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                      aria-label="Provide textual feedback"
                      title="Provide textual feedback"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    {showFeedbackPopup && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded shadow-lg p-3 z-20">
                        <textarea
                          className="w-full p-2 border border-gray-300 rounded resize-none text-sm"
                          rows={3}
                          placeholder="Enter your feedback..."
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => {
                              setShowFeedbackPopup(false);
                              setFeedbackText("");
                            }}
                            className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={submitFeedbackText}
                            className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                          >
                            Submit
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleCopy}
                    className={`rounded-full p-1.5 transition-colors ${copied ? "text-green-600" : "text-gray-400 hover:text-gray-600"
                      }`}
                    aria-label="Copy message"
                    title="Copy to clipboard"
                  >
                    {copied ? <CheckIcon className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );


};

export default MessageBubble;

