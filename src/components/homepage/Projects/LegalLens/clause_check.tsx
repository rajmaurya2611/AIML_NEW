import { useEffect, useState } from "react";
import {
  Layout,
  Upload,
  Select,
  Typography,
  Input,
  Button,
  message,
  Modal,
  Rate,
} from "antd";
import {
  SendOutlined,
  UploadOutlined,
  ReloadOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import logo from "./assets_legal/logo.png";
import { Link } from "react-router-dom";

import { getUserEmail } from "./getUsersEmail";
 
const { Header, Sider, Content } = Layout;
const { TextArea } = Input;
const { Option } = Select;
 
const API_BASE = import.meta.env.VITE_LEGALLENS_BASE;
 
const predefinedClauses = [
  "Force Majeure",
  "Termination Clause",
  "Confidentiality Clause",
  "Limitation of Liability",
  "Dispute Resolution",
  "Governing Law",
  "Payment Terms",
];
 
export default function ClauseCheckPage() {
  const [fileList, setFileList] = useState<any[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [clauseQuery, setClauseQuery] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
 
  

  useEffect(() => {
      const resetSession = async () => {
        try {
          const email = await getUserEmail();
  
          await fetch(`${import.meta.env.VITE_LEGALLENS_BASE}/reset_session`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: email }), // ⬅️ send email
            credentials: "include",
          });
  
          //setMessages([]);
        } catch (error) {
          console.error("Failed to reset session:", error);
        }
      };
  
      resetSession();
    }, []);
  


   useEffect(() => {
    fetchDocuments();
  }, []);
  
  const fetchDocuments = async () => {
    try {
      //const res = await axios.get(`${API_BASE}/documents`);
         const email = await getUserEmail();
        const res = await axios.get(`${API_BASE}/documents`, {
  params: { email }
  });

      setUploadedDocs(res.data.documents);
      setSelectedDoc(null);
      setClauseQuery("");
      setResult("");
      setFeedbackText("");
      setFeedbackRating(null);
    } catch {
      message.error("Failed to fetch documents.");
    }
  };
  


  const customUpload = async ({ file, onSuccess, onError }: any) => {
    const formData = new FormData();
    formData.append("file", file);

     const email = await getUserEmail();
         formData.append("email", email);

    try {
      const res = await axios.post(`${API_BASE}/upload-document`, formData);
      const result = res.data;
 
      message.success("Uploaded successfully");
      fetchDocuments();
      setIsUploadModalOpen(false);
      setFileList([]);
      onSuccess({}, file);
 
      // Show clause check result
      if (result.missing_clauses) {
        const missing = Array.isArray(result.missing_clauses) && result.missing_clauses.length > 0;
 
        Modal.info({
          title: "Clause Check Result",
          content: (
            <div>
              {missing ? (
                <>
                  <p><strong>Missing Clauses:</strong></p>
                  <ul className="list-disc list-inside text-red-600">
                    {result.missing_clauses.map((clause: string, idx: number) => (
                      <li key={idx}>{clause}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-green-600 font-medium">All key clauses are present in the document.</p>
              )}
            </div>
          ),
          width: 500
        });
      }
    } catch (err) {
      message.error("Upload failed");
      onError(new Error("Upload failed"));
    }
  };
 
 
  const analyzeClause = async () => {

    const email = await getUserEmail();

    if (!selectedDoc || !clauseQuery.trim()) return;
    setLoading(true);
    setResult("");
    try {
      const res = await axios.post(`${API_BASE}/clause-check`, {
        selected_doc: selectedDoc,
        clause_request: clauseQuery,
        email: email,  
      });
      setResult(res.data.clause_analysis);
    } catch {
      message.error("Clause check failed.");
    } finally {
      setLoading(false);
    }
  };
 
  const submitFeedback = async () => {

    const email = await getUserEmail();

    if (!feedbackRating || !result) return;
    setSubmittingFeedback(true);
    try {
      await axios.post(`${API_BASE}/feedback`, {
        query: clauseQuery,
        response: result,
        feedback: feedbackText,
        rating: feedbackRating,
        email: email,  
      });
      message.success("Feedback submitted");
      setIsFeedbackModalOpen(false);
      setFeedbackText("");
      setFeedbackRating(null);
    } catch {
      message.error("Feedback submission failed");
    } finally {
      setSubmittingFeedback(false);
    }
  };
 
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={300} theme="dark" className="bg-[#1f1f1f]">
        <div className="p-4">
          <div className="flex justify-center mb-4">
            <Link to="/">
              <img src={logo} alt="Logo" className="w-40" />
            </Link>
          </div>


           <div className="my-14">
            <p className="text-sm text-white text-center mt-2 mb-4">
              Upload PDF/DOCX File • Limit 200MB per file • PDF, DOCX
            </p>
            <Button
              type="primary"
              block
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-[#FF4D4F] border-none"
            >
              Upload Document
            </Button>
          </div>


           <p className="text-sm text-white text-center mt-2 mb-4">
            Must select a document to ask questions
          </p>
          <Select
            placeholder="Select Document"
            className="w-full mb-4"
            onChange={setSelectedDoc}
            value={selectedDoc || undefined}
          >
            {uploadedDocs.map(doc => (
              <Option key={doc} value={doc}>{doc}</Option>
            ))}
          </Select>
 
          {/* <p className="text-sm text-white text-center mt-2 mb-1">
            Select Document
          </p>
          <Select
            placeholder="Select Document"
            className="w-full mb-4"
            onChange={setSelectedDoc}
            value={selectedDoc || undefined}
          >
            {uploadedDocs.map((doc) => (
              <Option key={doc} value={doc}>
                {doc}
              </Option>
            ))}
          </Select> */}
 
          <Select
            placeholder="Choose Predefined Clause (Optional)"
            className="w-full mb-2"
            onChange={(val) => setClauseQuery(val || "")}
            value={predefinedClauses.includes(clauseQuery) ? clauseQuery : undefined}
            allowClear
          >
            {predefinedClauses.map((clause, idx) => (
              <Option key={idx} value={clause}>
                {clause}
              </Option>
            ))}
          </Select>
 
          <TextArea
            rows={4}
            className="mb-4"
            placeholder="Or enter a custom clause to check..."
            value={clauseQuery}
            onChange={(e) => setClauseQuery(e.target.value)}
          />
 
          <Button
            block
            className="bg-[#FF4D4F] text-white"
            type="primary"
            icon={<SendOutlined />}
            loading={loading}
            onClick={analyzeClause}
            disabled={!selectedDoc || !clauseQuery.trim()}
          >
            Check Clause
          </Button>
        </div>
      </Sider>
 
      <Layout>
        <Header className="bg-[#FF4D4F] px-6 text-white text-xl font-semibold shadow flex items-center justify-between">
          <span>📜 Clause Checker</span>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchDocuments}
            className="text-black border-white"
          >
            Refresh Docs
          </Button>
        </Header>
 
        <Content className="p-8 bg-[#f4f4f4] overflow-y-auto">
          <div className="max-w-6xl mx-auto bg-white rounded shadow p-6">
            {loading ? (
              <p className="text-gray-500 italic">Searching for clause...</p>
            ) : result ? (
              <>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  components={{
                    p: ({ node, ...props }) => (
                      <p className="mb-2 text-sm text-gray-800" {...props} />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul className="pl-5 list-disc space-y-1 text-sm text-gray-800" {...props} />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol className="pl-5 list-decimal space-y-1 text-sm text-gray-800" {...props} />
                    ),
                    li: ({ node, ...props }) => (
                      <li {...props} />
                    ),
                    br: () => <br />,
                  }}
                >
                  {result}
                </ReactMarkdown>
                <div className="text-right mt-4">
                  <MessageOutlined
                    className="text-gray-500 cursor-pointer hover:text-gray-800"
                    onClick={() => setIsFeedbackModalOpen(true)}
                  />
                </div>
              </>
            ) : (
              <p className="text-gray-400 italic">
                Enter a clause to check and click "Check Clause".
              </p>
            )}
          </div>
        </Content>
      </Layout>


      <Modal open={isUploadModalOpen} title="Upload Contract Document" onCancel={() => setIsUploadModalOpen(false)} footer={null}>
        <Upload.Dragger
          name="file"
          customRequest={customUpload}
          accept=".pdf,.docx"
          fileList={fileList}
          onChange={({ fileList }) => setFileList(fileList)}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <UploadOutlined style={{ fontSize: 32, color: "#FF4D4F" }} />
          </p>
          <p>Drag and drop or click to upload PDF/DOCX</p>
        </Upload.Dragger>
      </Modal>

 
      <Modal
        open={isFeedbackModalOpen}
        title="Submit Feedback"
        onCancel={() => setIsFeedbackModalOpen(false)}
        onOk={submitFeedback}
        okText="Submit"
        confirmLoading={submittingFeedback}
        okButtonProps={{ disabled: feedbackRating === null }}
      >
        <Typography.Text strong>
          How helpful was this response?
        </Typography.Text>
        <div className="my-2">
          <Rate
            className="custom-rate"
            value={feedbackRating || 0}
            onChange={(val) => setFeedbackRating(val)}
          />
        </div>
        <TextArea
          rows={3}
          placeholder="Optional comments..."
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
        />
      </Modal>
    </Layout>
  );
}
 