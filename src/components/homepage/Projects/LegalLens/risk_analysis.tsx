// risk.tsx
import { useEffect, useState } from "react";
import {
  Layout,
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
  ReloadOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import logo from "../assets/logo.png";
import { Link } from 'react-router-dom';
 
const { Header, Sider, Content } = Layout;
const { TextArea } = Input;
const { Option } = Select;
 
 
const API_BASE = import.meta.env.VITE_API_BASE;
 
const perspectives = [
  "Both Parties",
  "Buyer/Purchaser",
  "Seller/Vendor"
];
 
export default function RiskAnalysisPage() {
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [perspective, setPerspective] = useState<string>("Both Parties");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
 
  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/documents`);
      setUploadedDocs(res.data.documents);
      // Reset state when refreshing
      setSelectedDoc(null);
      setPerspective("Both Parties");
      setResult("");
      setFeedbackText("");
      setFeedbackRating(null);
    } catch {
      message.error("Failed to fetch documents.");
    }
  };
 
  useEffect(() => {
    fetchDocuments();
  }, []);
 
  const analyzeRisk = async () => {
    if (!selectedDoc) return;
    setLoading(true);
    setResult("");
    try {
      const res = await axios.post(`${API_BASE}/risk-analysis`, {
        selected_doc: selectedDoc,
        perspective,
      });
      setResult(res.data.risk_analysis);
    } catch {
      message.error("Risk analysis failed.");
    } finally {
      setLoading(false);
    }
  };
 
  const submitFeedback = async () => {
    if (!feedbackRating || !result) return;
    setSubmittingFeedback(true);
    try {
      await axios.post(`${API_BASE}/feedback`, {
        query: `Risk Analysis (${perspective})`,
        response: result,
        feedback: feedbackText,
        rating: feedbackRating,
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
 
          <p className="text-sm text-white text-center mt-2 mb-1">Select Document</p>
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
 
          <p className="text-sm text-white text-center mt-2 mb-1">Select Perspective</p>
          <Select
            value={perspective}
            onChange={setPerspective}
            className="w-full"
          >
            {perspectives.map(p => (
              <Option key={p} value={p}>{p}</Option>
            ))}
          </Select>
 
          <Button
            block
            className="mt-6 bg-[#FF4D4F] text-white"
            type="primary"
            icon={<SendOutlined />}
            loading={loading}
            onClick={analyzeRisk}
            disabled={!selectedDoc}
          >
            Analyze Risk
          </Button>
        </div>
      </Sider>
 
      <Layout>
        <Header className="bg-[#FF4D4F] px-6 text-white text-xl font-semibold shadow flex items-center justify-between">
          <span>📊 Risk Analysis</span>
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
              <p className="text-gray-500 italic">Analyzing risk...</p>
            ) : result ? (
              <>
                <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                components={{
    p: ({ node, ...props }) => <p className="mb-2 text-gray-800 text-sm" {...props} />,
    ul: ({ node, ...props }) => (
      <ul className="pl-5 list-disc space-y-1 text-sm text-gray-800" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className="pl-5 list-decimal space-y-1 text-sm text-gray-800" {...props} />
    ),
    li: ({ node, ...props }) => <li {...props} />,
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
              <p className="text-gray-400 italic">No analysis yet. Select a document and click "Analyze Risk".</p>
            )}
          </div>
        </Content>
      </Layout>
 
      <Modal
        open={isFeedbackModalOpen}
        title="Submit Feedback"
        onCancel={() => setIsFeedbackModalOpen(false)}
        onOk={submitFeedback}
        okText="Submit"
        confirmLoading={submittingFeedback}
        okButtonProps={{ disabled: feedbackRating === null }}
      >
        <Typography.Text strong>How helpful was this response?</Typography.Text>
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