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
import { ThumbsUp, ThumbsDown, Copy, CheckIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
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
    <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent" />
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
    <tr
      {...props}
      className="even:bg-white odd:bg-gray-50 border-b border-gray-100 hover:bg-gray-100/60 transition-colors"
    />
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
        .filter(Boolean);

      const rowLines = t.slice(2);
      const rows = rowLines.map((rl) =>
        rl
          .split("|")
          .map((c) => stripMd(c.trim()))
          .filter(Boolean)
      );

      tables.push({ title, headers, rows });
      i = j - 1;
    }
  }

  return tables;
};

const pivotTable = (pt: ParsedTable): PivotResult => {
  // headers[0] is label (e.g., "Project"), the rest are months
  const months = pt.headers.slice(1); // <- avoid unused 'first'

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

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);

const colorForIndex = (i: number) => `hsl(${(i * 67) % 360} 70% 45%)`;

// /* ------------------------------ Component ------------------------------ */

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onLike,
  onDislike,
  onMenuOptionClick,
}) => {
  const isUser = message.sender === "user";
  const [copied, setCopied] = useState(false);

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
        body: JSON.stringify({ liked: true }),
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
        body: JSON.stringify({ disliked: true }),
      });
    } catch (error) {
      console.error("❌ Failed to send dislike feedback:", error);
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

  // Menu options block
  const hasMenuOptions = message.options && message.options.length > 0;

  const downloadExcel = () => {
    if (pivoted.length === 0) {
      alert("No tables to download.");
      return;
    }

    const wb = XLSX.utils.book_new();

    pivoted.forEach((table) => {
      // Compose a sheet data array: headers + rows
      const sheetData = [
        [table.tableTitle], // Optional title as first row
        [""], // Empty row as spacer
        [table.months.length > 0 ? "Month" : "", ...table.seriesKeys],
      ];

      table.dataByMonth.forEach((row: Record<string, string | number>) => {
        const rowData = [row.month || ""];
        table.seriesKeys.forEach((key: string) => {
          rowData.push(row[key] ?? "");
        });
        sheetData.push(rowData);
      });

      // Create worksheet and append to workbook
      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(wb, ws, table.tableTitle.substring(0, 31)); // Excel sheet names max 31 chars
    });

    // Generate excel file and trigger download
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    saveAs(blob, `CapexData_${new Date().toISOString()}.xlsx`);
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
            {/* Menu options rendering */}
            {hasMenuOptions && onMenuOptionClick && (
              <div>
                <p className="mb-3 text-base text-gray-800">{message.content}</p>
                <div className="flex gap-4 flex-wrap">
                  {Array.isArray(message.options) && message.options.map((opt) => (
                    <button
                      key={opt.id}
                      className="text-[#da2128] px-3 py-1 border border-[#ddd] rounded-xl text-sm hover:text-[#fff] hover:bg-[#da2128] transition"
                      onClick={() => onMenuOptionClick(message.id, opt)}
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Standard (non-menu) content */}
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
                        onClick={downloadExcel}
                        className="bg-[#da2128] text-white text-sm px-2 py-1 rounded-md transition"
                        title="Download all tables as Excel"
                      >
                        Download as Excel
                      </button>
                    </div>
                    {pivoted.map((piv, tIdx) => (
                      <div key={tIdx} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                        <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">
                          {piv.tableTitle} — Visualization
                        </h4>
                        <div className="mb-6">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Monthly trend by project</h5>
                          <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={piv.dataByMonth}>
                              <CartesianGrid strokeDasharray="4 4" />
                              <XAxis dataKey="month" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={50} />
                              <YAxis tickFormatter={(v) => formatCurrency(v as number)} tick={{ fontSize: 12 }} width={90} />
                              <Tooltip formatter={(value: any, name: string) => [formatCurrency(Number(value)), name]} labelFormatter={(label) => label} />
                              <Legend wrapperStyle={{ fontSize: 12 }} />
                              {piv.seriesKeys.map((key: string, i: number) => (
                                <Line
                                  key={key}
                                  type="monotone"
                                  dataKey={key}
                                  stroke={colorForIndex(i)}
                                  dot={false}
                                  strokeWidth={2}
                                  isAnimationActive={true}
                                />
                              ))}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        {piv.monthlyTotals && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Monthly totals</h5>
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={piv.dataByMonth}>
                                <CartesianGrid strokeDasharray="4 4" />
                                <XAxis dataKey="month" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={50} />
                                <YAxis tickFormatter={(v) => formatCurrency(v as number)} tick={{ fontSize: 12 }} width={90} />
                                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} labelFormatter={(label) => label} />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="Monthly total" fill={colorForIndex(9)} isAnimationActive={true} />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    ))}
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

                <div className="flex justify-end mt-2 pt-2 border-t border-gray-200/60">
                  <div className="flex gap-1.5">
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
