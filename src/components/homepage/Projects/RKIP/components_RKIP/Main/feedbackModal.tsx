import React, { useState } from 'react';
import { Modal, Rate, Input, Button } from 'antd';
import { useSubmitFeedbackQuestionMutation } from '../../store_RKIP/slices/mainApiSlice';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  question: string;
  answer: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ visible, onClose, question, answer }) => {
  const [starRating, setStarRating] = useState<number | undefined>(undefined);
  const [feedback, setFeedback] = useState('');
  const [submitFeedbackQuestion] = useSubmitFeedbackQuestionMutation();

  const handleSubmit = async () => {
    if (starRating === undefined) {
      alert('Please provide a rating');
      return;
    }

    const feedbackData = {
      question: question,
      answer: answer,
      starRating: starRating,
      feedbackText: feedback || 'No additional feedback provided',
    };

    try {
      await submitFeedbackQuestion(feedbackData).unwrap();
      onClose();
    } catch (error) {
      console.error('Error submitting feedback', error);
    }
  };

  return (
    <Modal
      title="Submit Feedback"
      open={visible} // changed from 'visible' to 'open'
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          Submit
        </Button>,
      ]}
    >
      <div className="mb-4">
      </div>
      <div className="mb-4">
        <Rate className="gray-900" onChange={setStarRating} value={starRating} />
      </div>
      <div className="mb-4">
        <Input.TextArea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Optional feedback"
          rows={4}
        />
      </div>
    </Modal>
  );
};

export default FeedbackModal;
