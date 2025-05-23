import { useState, useEffect } from "react";
import { Upload, Button, Modal, Progress, Alert } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useUploadDatabaseFileMutation } from "../../store_RKIP/slices/mainApiSlice";

const { Dragger } = Upload;

const DatabaseUpload = () => {
  const [uploadDatabaseFile] = useUploadDatabaseFileMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<null | { type: "success" | "error"; message: string }>(null);

  const handleModalSubmit = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setUploading(true);
      setProgress(50); // Simulate progress midway

      // Call API to upload file
      await uploadDatabaseFile(formData).unwrap();

      setProgress(100);
      setUploadStatus({ type: "success", message: "File uploaded successfully!" });
    } catch (error: any) {
      setProgress(0);
      let errorMessage = "File upload failed!";

      if (error?.status === 404) {
        errorMessage = "Upload failed: Endpoint not found (404)";
      } else if (error?.status === 500) {
        errorMessage = "Upload failed: Internal Server Error (500)";
      } else if (error?.name === "TypeError") {
        errorMessage = "Network error: Could not connect to server.";
      } else {
        errorMessage = error?.data?.message || "Unknown error occurred during upload!";
      }

      setUploadStatus({ type: "error", message: errorMessage });
    } finally {
      setUploading(false);
    }
  };

  // Auto-close modal after success
  useEffect(() => {
    if (uploadStatus?.type === "success") {
      const timer = setTimeout(() => {
        resetModal();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [uploadStatus]);

  const handleFileChange = (info: any) => {
    const file = info.fileList[0]?.originFileObj || null;
    setSelectedFile(file);
    setFileList(info.fileList);
    setProgress(0);
    setUploadStatus(null);
  };

  const resetModal = () => {
    setSelectedFile(null);
    setFileList([]);
    setProgress(0);
    setUploadStatus(null);
    setIsModalOpen(false);
  };

  return (
    <>
      <Button type="primary" onClick={() => setIsModalOpen(true)}>
        Upload Database File
      </Button>

      <Modal
        title="Upload Database File"
        open={isModalOpen}
        onCancel={resetModal}
        onOk={handleModalSubmit}
        okText="Upload"
        okButtonProps={{ disabled: !selectedFile || uploading }}
        confirmLoading={uploading}
      >
        <Dragger
          multiple={false}
          showUploadList={true}
          accept="*"
          beforeUpload={() => false}
          fileList={fileList}
          onChange={handleFileChange}
          style={{ padding: "20px" }}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined style={{ fontSize: "32px" }} />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to upload</p>
          <p className="ant-upload-hint">Supports single file upload. Any file type.</p>
        </Dragger>

        {uploadStatus && (
          <Alert
            message={uploadStatus.message}
            type={uploadStatus.type}
            showIcon
            style={{ marginTop: 20 }}
          />
        )}

        {uploading && (
          <Progress
            percent={progress}
            status={progress === 100 ? "success" : "active"}
            style={{ marginTop: "16px" }}
          />
        )}
      </Modal>
    </>
  );
};

export default DatabaseUpload;
