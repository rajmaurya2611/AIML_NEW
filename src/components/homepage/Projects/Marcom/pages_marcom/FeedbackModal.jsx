import { useState } from "react";
import "./FeedbackModal.css";

function FeedbackModal({ message, feedbackType, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    onSubmit({ rating, comment });
    setRating(0);
    setComment("");
  };

  return (
    <div className="marcom-modal-overlay marcom-animate-fade-in">
      <div className="marcom-modal-content marcom-animate-scale-in">
        <div className="marcom-modal-header">
            {feedbackType=="like" && (
              <h3 className="marcom-modal-title"> Glad you liked the response, please share your feedback</h3>
            )}
            {feedbackType=="dislike" && (
              <h3 className="marcom-modal-title"> Please share how we can improve our response</h3>
            )}
            <button onClick={onClose} className="marcom-cancel-btn">x</button>
        </div>

        <div className="marcom-modal-body">
          {/* Rating Section */}
          <div className="marcom-rating-section">
            <label>How would you rate this response?</label>
            <div className="marcom-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`marcom-star ${star <= rating ? "active" : ""}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Comment Box */}
          <div className="marcom-comment-section">
            <label>Additional Comments (Optional)</label>
            <textarea
              placeholder="Tell us how we can improve..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="marcom-modal-actions">
          <button onClick={handleSubmit} className="submit-btn">
            Submit Feedback
          </button>
        </div>
      </div>
    </div>
  );
}

export default FeedbackModal;
