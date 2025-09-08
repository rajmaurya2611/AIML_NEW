import { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, Bot, User, Download } from "lucide-react";
import { Button } from "./ui_SMP_BI/button";
import { useToast } from "./hooks_SMP_BI/use-toast";
import FeedbackModal from "./FeedbackModal_SMP_BI";
import * as XLSX from "xlsx";

interface ChatMessageProps {
  message: string;
  isBot: boolean;
  isTable?: boolean;
  tableData?: { headers: string[]; rows: string[][] };
}

const ChatMessage = ({ message, isBot, isTable, tableData }: ChatMessageProps) => {
  const [likeStatus, setLikeStatus] = useState<"liked" | "disliked" | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const { toast } = useToast();

  const handleLike = () => {
    const wasLiked = likeStatus === "liked";
    setLikeStatus(wasLiked ? null : "liked");
    toast({
      title: wasLiked ? "Like removed" : "Thanks for your feedback!",
      description: wasLiked ? "Feedback cleared" : "We're glad this response was helpful",
    });
  };

  const handleDislike = () => {
    const wasDisliked = likeStatus === "disliked";
    setLikeStatus(wasDisliked ? null : "disliked");
    toast({
      title: wasDisliked ? "Dislike removed" : "Feedback received",
      description: wasDisliked ? "Feedback cleared" : "We'll work on improving our responses",
      variant: wasDisliked ? "default" : "destructive",
    });
  };

  const downloadCSV = () => {
    if (!tableData) return;
    const csvContent = [
      tableData.headers.join(","),
      ...tableData.rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "table.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadExcel = () => {
    if (!tableData) return;
    const worksheet = XLSX.utils.aoa_to_sheet([
      tableData.headers,
      ...tableData.rows,
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "table_data.xlsx");
  };

  return (
    <div className={`flex gap-3 ${isBot ? "justify-start" : "justify-end"} mb-6`}>
      {isBot && (
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      )}

      <div className={`max-w-[70%] ${isBot ? "order-2" : "order-1"}`}>
        <div
          className={`rounded-lg px-4 py-3 ${
            isBot ? "bg-card text-card-foreground border border-border"
                  : "bg-primary text-primary-foreground"
          }`}
        >
          {/* ✅ Always render description/message if provided */}
          {message && (
            <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap break-words">
              {message}
            </p>
          )}

          {/* ✅ Then render table if present */}
          {isTable && tableData && (
            <div>
              <div className="max-h-64 max-w-full overflow-auto rounded-md border border-border bg-background">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      {tableData.headers.map((header, index) => (
                        <th key={index} className="text-left px-2 py-1 font-medium">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="odd:bg-muted/30">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="px-2 py-1">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Download buttons */}
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={downloadCSV}>
                  <Download className="h-4 w-4 mr-1" /> CSV
                </Button>
                <Button size="sm" variant="outline" onClick={downloadExcel}>
                  <Download className="h-4 w-4 mr-1" /> Excel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Only show for bot messages */}
        {isBot && (
          <div className="flex items-center gap-2 mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className={`action-button h-8 w-8 p-0 ${
                likeStatus === "liked"
                  ? "text-success hover:text-success"
                  : "text-muted-foreground hover:text-success"
              }`}
            >
              <ThumbsUp className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleDislike}
              className={`action-button h-8 w-8 p-0 ${
                likeStatus === "disliked"
                  ? "text-destructive hover:text-destructive"
                  : "text-muted-foreground hover:text-destructive"
              }`}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFeedback(true)}
              className="action-button h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {!isBot && (
        <div className="flex-shrink-0 order-2">
          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
            <User className="h-4 w-4 text-secondary-foreground" />
          </div>
        </div>
      )}

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </div>
  );
};

export default ChatMessage;
