import { useState } from "react";
import { Form, Input, Button, message, Table, Spin } from "antd";
import { useSubmitFeedbackMutation, useFetchRecentFeedbackQuery } from "../store_RKIP/slices/mainApiSlice";

const Feedback = () => {
  const [form] = Form.useForm();
  const [submitFeedback, { isLoading }] = useSubmitFeedbackMutation();
  const { data, refetch, isFetching } = useFetchRecentFeedbackQuery();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (values: { name: string; feedback: string }) => {
    try {
      await submitFeedback(values).unwrap();
      message.success("Feedback submitted successfully!");
      form.resetFields();
      setSubmitted(true);
      refetch();
    } catch (error) {
      message.error("Error submitting feedback. Please try again.");
      console.error("Feedback submission error:", error);
    }
  };

 const formattedFeedback = Array.isArray(data?.recent_feedback)
  ? data.recent_feedback
      .filter((item: unknown) => Array.isArray(item) && item.length >= 2)
      .map((item: any, index: number) => ({
        key: index,
        name: item[0] ?? "",
        feedback: item[1] ?? "",
      }))
  : [];

  // ✅ Define Table Columns
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Feedback",
      dataIndex: "feedback",
      key: "feedback",
    },
  ];

  return (
    <div className="max-w-full mx-auto bg-white shadow-lg  rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 py-8 text-center">Feedback </h2>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Feedback Form */}
        <div className="bg-gray-100 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Send Feedback</h3>

          {!submitted ? (
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                label="Your Name"
                name="name"
                rules={[{ required: true, message: "Please enter your name" }]}
              >
                <Input placeholder="Enter your name" />
              </Form.Item>

              <Form.Item
                label="Your Feedback"
                name="feedback"
                rules={[{ required: true, message: "Please enter your feedback" }]}
              >
                <Input.TextArea rows={4} placeholder="Write your feedback here..." />
              </Form.Item>

              <Button type="primary" htmlType="submit" loading={isLoading} block>
                Submit Feedback
              </Button>
            </Form>
          ) : (
            <p className="text-green-600 font-semibold text-center">Thank you for your feedback! 😊</p>
          )}
        </div>

        {/* Right Column: Recent Feedback Table */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Recent Feedback</h3>

          {isFetching ? (
            <div className="flex justify-center">
              <Spin size="large" />
            </div>
          ) : (
            <Table
              dataSource={formattedFeedback}
              columns={columns}
              pagination={false}
              bordered
            />
          )}
        </div>

      </div>
    </div>
  );
};

export default Feedback;
