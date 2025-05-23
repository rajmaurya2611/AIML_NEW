import { useState } from "react";
import {
  useFetchTrainingDataQuery,
  useAddTrainingDataMutation,
  useUpdateTrainingDataMutation,
  useDeleteTrainingDataMutation,
} from "../store_RKIP/slices/mainApiSlice"; // Ensure the correct import path

import { useSubmitCustomQueryMutation } from "../store_RKIP/slices/processApiSlice"; // Importing from process API
import { Table, Button, Input, Form, Modal, Space, message } from "antd";
import UploadComponent from "../components_RKIP/TrainingData/UploadComponent";

// Define Training Data Type
interface TrainingData {
  id: number;
  query: string;
  answer: string;
  updated?: string;
}

const TrainingData = () => {
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<number | null>(null);

  // Redux Toolkit Query Hooks
  const { data: trainingData = [] as TrainingData[], refetch } = useFetchTrainingDataQuery();
  const [addTrainingData] = useAddTrainingDataMutation();
  const [updateTrainingData] = useUpdateTrainingDataMutation();
  const [deleteTrainingData] = useDeleteTrainingDataMutation();
  const [submitCustomQuery] = useSubmitCustomQueryMutation(); // New API mutation

  // Open Modal for Adding or Editing Data
  const showModal = (item?: TrainingData) => {
    setEditing(!!item);
    setCurrentId(item?.id || null);
    form.setFieldsValue({
      query: item?.query || "",
      answer: item?.answer || "",
    });
    setIsModalOpen(true);
  };

  // Handle Modal Submission
  const handleOk = async () => {
    try {
      const values = await form.validateFields();

      if (editing && currentId !== null) {
        await updateTrainingData({ id: currentId, ...values }).unwrap();
        message.success("Training data updated successfully!");
      } else {
        // Call both APIs simultaneously
        await Promise.all([
          addTrainingData(values).unwrap(),
          submitCustomQuery(values).unwrap(),
        ]);

        message.success("Training data added and submitted successfully!");
      }

      setIsModalOpen(false);
      form.resetFields();
      refetch(); // Refresh data
    } catch (error) {
      message.error("Error processing request!");
      console.error("Error:", error);
    }
  };

  // Delete Training Data
  const handleDelete = async (id: number) => {
    try {
      await deleteTrainingData(id).unwrap();
      message.success("Training data deleted successfully!");
      refetch();
    } catch (error) {
      message.error("Error deleting training data!");
      console.error("Error deleting training data", error);
    }
  };

  // Define Table Columns
  const columns = [
    {
      title: "Query",
      dataIndex: "query",
      key: "query",
    },
    {
      title: "Answer",
      dataIndex: "answer",
      key: "answer",
    },
    {
      title: "Updated",
      dataIndex: "updated",
      key: "updated",
      render: (text: string | undefined) => text || "N/A",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: TrainingData) => (
        <Space>
          <Button type="primary" onClick={() => showModal(record)}>
            Edit
          </Button>
          <Button type="default" danger onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="w-full h-screen bg-white flex flex-col p-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Training Data</h1>

      {/* Upload Button & Add New Data Button */}
      <div className="flex items-center justify-end gap-4 mb-4">
        <Button type="primary" onClick={() => showModal()}>
          Add Training Data
        </Button>
        <UploadComponent />
      </div>

      {/* Ant Design Table */}
      <Table columns={columns} dataSource={trainingData} rowKey="id" />

      {/* Modal for Adding/Editing Data */}
      <Modal
        title={editing ? "Edit Training Data" : "Add Training Data"}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Query" name="query" rules={[{ required: true, message: "Please enter a query" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Answer" name="answer" rules={[{ required: true, message: "Please enter an answer" }]}>
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TrainingData;
