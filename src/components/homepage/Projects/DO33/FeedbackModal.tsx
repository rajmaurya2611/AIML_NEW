// components/FeedbackModal.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from './do33_ui/dialog';
 
interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
}
 
const FeedbackModal: React.FC<FeedbackModalProps> = ({ open, onClose, onSubmit }) => {
  const [feedback, setFeedback] = useState('');
 
  const handleSubmit = () => {
    if (feedback.trim()) {
      onSubmit(feedback);
      setFeedback('');
      onClose();
    }
  };
 
  return (
<Dialog open={open} onOpenChange={onClose}>
<DialogContent>
<DialogHeader>
<DialogTitle>Feedback for the response</DialogTitle>
</DialogHeader>
<div className="mt-4">
<textarea
            className="w-full border border-gray-300 focus:border-gray-500 focus:outline-none rounded-md p-2 text-sm resize-none min-h-[100px]"
            placeholder="Your feedback..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
</div>
<DialogFooter className="mt-4">
<DialogClose asChild>
<button
              onClick={onClose}
              className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300"
>
              Cancel
</button>
</DialogClose>
<button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm bg-chat-red text-white rounded hover:bg-chat-red-dark"
>
            Submit
</button>
</DialogFooter>
</DialogContent>
</Dialog>
  );
};
 
export default FeedbackModal;