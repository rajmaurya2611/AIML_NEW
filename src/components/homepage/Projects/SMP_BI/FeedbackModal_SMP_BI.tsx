import { useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui_SMP_BI/dialog";
import { Button } from "./ui_SMP_BI/button";
import { Textarea } from "./ui_SMP_BI/textarea";
import { useToast } from "./hooks_SMP_BI/use-toast";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal = ({ isOpen, onClose }: FeedbackModalProps) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const { toast } = useToast();

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting",
        variant: "destructive",
      });
      return;
    }

    // Here you would typically send the feedback to your backend
    console.log("Feedback submitted:", { rating, feedback });

    toast({
      title: "Feedback submitted",
      description: "Thank you for your feedback!",
    });

    // Reset form and close modal
    setRating(0);
    setFeedback("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] animate-scale-in">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 animate-fade-in">
            <MessageSquare className="h-5 w-5 text-primary animate-pulse" />
            Share Your Feedback
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4 animate-fade-in">
          {/* Star Rating */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              How would you rate this response?
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="rating-star transition-all duration-200 hover:scale-110 transform"
                >
                  <Star
                    className={`h-8 w-8 transition-all duration-300 ${star <= rating
                        ? "fill-warning text-warning animate-pulse"
                        : "text-muted-foreground hover:text-warning/50"
                      }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Additional Comments (Optional)
            </label>
            <Textarea
              placeholder="Tell us how we can improve..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[100px] resize-none border-border rounded-lg transition-all duration-200 focus:scale-[1.02] focus:shadow-md"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
          >
            Submit Feedback
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackModal;





















// import React, { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { useToast } from "@/hooks/use-toast";

// interface FeedbackModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
//   const [rating, setRating] = useState<number>(0);
//   const [feedback, setFeedback] = useState<string>("");
//   const { toast } = useToast();

//   const handleSubmit = async () => {
//     try {
//       const formData = new FormData();
//       formData.append("rating", rating.toString());
//       formData.append("feedback", feedback);

//       const res = await fetch("http://localhost:8000/feedback", {
//         method: "POST",
//         body: formData,
//       });

//       if (!res.ok) throw new Error("Failed to submit feedback");

//       toast({
//         title: "Thank you!",
//         description: "Your feedback has been submitted.",
//       });
//       onClose();
//       setRating(0);
//       setFeedback("");
//     } catch (error) {
//       console.error("Error submitting feedback:", error);
//       toast({
//         title: "Error",
//         description: "Failed to submit feedback. Please try again.",
//         variant: "destructive",
//       });
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
//       <div className="bg-white rounded-lg p-6 w-96">
//         <h2 className="text-lg font-bold mb-4">Rate your experience</h2>

//         {/* Star Rating */}
//         <div className="flex mb-4">
//           {[1, 2, 3, 4, 5].map((star) => (
//             <button
//               key={star}
//               onClick={() => setRating(star)}
//               className={`text-2xl ${star <= rating ? "text-yellow-500" : "text-gray-300"}`}
//             >
//               ★
//             </button>
//           ))}
//         </div>

//         {/* Feedback Input */}
//         <textarea
//           placeholder="Leave your feedback..."
//           value={feedback}
//           onChange={(e) => setFeedback(e.target.value)}
//           className="w-full border rounded p-2 mb-4"
//         />

//         {/* Actions */}
//         <div className="flex justify-end space-x-2">
//           <Button variant="secondary" onClick={onClose}>
//             Cancel
//           </Button>
//           <Button onClick={handleSubmit}>Submit</Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FeedbackModal;
