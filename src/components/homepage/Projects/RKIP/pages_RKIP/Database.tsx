import { Table, Button, Spin, message } from "antd";
import { useFetchDatabaseFilesQuery } from "../store_RKIP/slices/mainApiSlice";
import DatabaseUpload from "../components_RKIP/DatabaseComponent/DatabaseUpload";

interface DatabaseFile {
  file_name: string;
  download_url: string;
  size: number;
  uploaded_at: string;
}

const Database = () => {
  const { data: files, error, isLoading } = useFetchDatabaseFilesQuery();

  if (isLoading) {
    return <Spin size="large" className="flex justify-center mt-10" />;
  }

  if (error) {
    message.error("Failed to fetch database files.");
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
      render: (_: any, record: DatabaseFile) => (
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
        <h2 className="text-2xl font-bold text-gray-800">Database Files</h2>
        <DatabaseUpload />
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

export default Database;
