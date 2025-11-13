import React, { useState } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { StarRating } from './StarRating';
import { Button } from '../components_Yachiyo/ui/button';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating, comment);
      setRating(0);
      setComment('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md bg-white p-6 animate-slide-up rounded-lg border"
        style={{ color: "#555555", borderColor: "#D9D9D9" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-200 rounded-lg">
              <MessageSquare size={20} className="text-gray-600" />
            </div>
            <h2 className="text-xl font-semibold">
              Share Your Feedback
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-red-100"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Rating */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3">
            How was my response?
          </label>
          <div className="flex justify-center">
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              size={32}
            />
          </div>
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Additional comments (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell me how I can improve..."
            className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-red-400 transition-all"
            rows={3}
            style={{ borderColor: "#D9D9D9", color: "#555555" }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {/* Cancel */}
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border text-[#555555] hover:bg-red-500 hover:text-white"
            style={{ borderColor: "#D9D9D9" }}
          >
            Cancel
          </Button>
          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="flex-1 bg-gray-400 text-white hover:bg-red-600 disabled:opacity-50"
          >
            Submit Feedback
          </Button>
        </div>
      </div>
    </div>
  );
};
