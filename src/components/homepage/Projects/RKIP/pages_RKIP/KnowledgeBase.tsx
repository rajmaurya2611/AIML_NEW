import { Table, Button, Spin, message } from "antd";
import { useFetchKnowledgeBaseFilesQuery } from "../store_RKIP/slices/mainApiSlice";
import UploadComponent from "../components_RKIP/TrainingData/UploadComponent";

interface KnowledgeBaseFile {
  file_name: string;
  download_url: string;
  size: number;
  uploaded_at: string;
}

const KnowledgeBase = () => {
  const { data: files, error, isLoading } = useFetchKnowledgeBaseFilesQuery();

  if (isLoading) {
    return <Spin size="large" className="flex justify-center mt-10" />;
  }

  if (error) {
    message.error("Failed to fetch knowledge base files.");
    return <p className="text-red-500 text-center mt-5">Error loading files.</p>;
  }

  const columns = [
    {
      title: "File Name",
      dataIndex: "file_name",
      key: "file_name",
    },
    {
      title: "Size (KB)",
      dataIndex: "size",
      key: "size",
      render: (size: number) => `${(size / 1024).toFixed(2)} KB`,
    },
    {
      title: "Uploaded At",
      dataIndex: "uploaded_at",
      key: "uploaded_at",
    },
    {
      title: "Download",
      key: "download",
      render: (_: any, record: KnowledgeBaseFile) => (
        <Button type="primary" href={record.download_url} target="_blank" download>
          Download
        </Button>
      ),
    },
  ];

  return (
    <div className="max-w-full mx-auto bg-white p-6 shadow-lg rounded-lg">
      {/* Header with Upload Component */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 pb-8">Knowledge Base Files</h2>
        <UploadComponent />
      </div>

      {/* File Table with Pagination (5 per page) */}
      <Table 
        dataSource={files} 
        columns={columns} 
        rowKey="file_name" 
        pagination={{ pageSize: 5 }} 
      />
    </div>
  );
};

export default KnowledgeBase;
