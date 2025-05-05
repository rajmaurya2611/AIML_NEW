// comparison.tsx
import { useEffect, useState } from "react";
import {
  Layout,
  Button,
  Modal,
  Select,
  Typography,
  Input,
  Rate,
  message,
} from "antd";
import {
  SendOutlined,
  MessageOutlined,
  DeleteOutlined,
  SaveOutlined,
  StopOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import logo from "./assets_legal/logo.png";
import { Link } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { TextArea } = Input;

const { Option } = Select;

const LEGALLENS_API_BASE = import.meta.env.VITE_LEGALLENS_BASE;

const comparisonQuestions = [
  "Compare the Definition of 'Material Adverse Effect' (MAE)?",
  "Compare the non-compete & non-solicitation provisions in the selected contracts?",
  "Compare the Limitation on Liability (Indemnification)?",
  "Compare the mechanism of determination of Indemnification?",
  "Compare the selected NDAs?",
];

export default function ComparisonPage() {
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);
  const [doc1, setDoc1] = useState<string | null>(null);
  const [doc2, setDoc2] = useState<string | null>(null);
  const [doc3, setDoc3] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [botTyping, setBotTyping] = useState(false);
  const [typingIntervalId, setTypingIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`${LEGALLENS_API_BASE}/documents`);
      setUploadedDocs(res.data.documents);
    } catch {
      message.error("Failed to fetch documents.");
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const simulateTyping = (text: string, callback: (finalText: string) => void) => {
    let index = 0;
    let currentText = "";
    setBotTyping(true);
    const interval = setInterval(() => {
      if (index < text.length) {
        currentText += text[index++];
        setChatHistory(prev => {
          const updated = [...prev];
          updated[updated.length - 1].content = currentText;
          return [...updated];
        });
      } else {
        clearInterval(interval);
        setBotTyping(false);
        callback(currentText);
      }
    }, 20);
    setTypingIntervalId(interval);
  };

  const stopTyping = () => {
    if (typingIntervalId) {
      clearInterval(typingIntervalId);
      setBotTyping(false);
      setTypingIntervalId(null);
    }
  };

  const handleAsk = async () => {
    if (!doc1 || !doc2 || !question) return;
    const userMsg = { id: uuidv4(), role: "user", content: question };
    setChatHistory(prev => [...prev, userMsg]);
    setQuestion("");

    const typingPlaceholder = { id: uuidv4(), role: "bot", content: "" };
    setChatHistory(prev => [...prev, typingPlaceholder]);

    try {
      const res = await axios.post(`${LEGALLENS_API_BASE}/query`, {
        mode: "comparison",
        selected_doc: doc1,
        second_doc: doc2,
        third_doc: doc3 || undefined,
        query: userMsg.content,
      });
      simulateTyping(res.data.response, () => {});
    } catch {
      message.error("Failed to get response.");
      setChatHistory(prev => prev.slice(0, -1));
    }
  };

  const openFeedbackModal = (id: string) => {
    setActiveMessageId(id);
    setIsFeedbackModalOpen(true);
  };

  const submitFeedback = async () => {
    if (!feedbackRating || !activeMessageId) return;
    const msg = chatHistory.find(m => m.id === activeMessageId);
    if (!msg || msg.role !== "bot") return;

    setSubmittingFeedback(true);
    try {
      await axios.post(`${LEGALLENS_API_BASE}/feedback`, {
        query: "",
        response: msg.content,
        feedback: feedbackText,
        rating: feedbackRating,
      });
      message.success("Feedback submitted");
      setFeedbackRating(null);
      setFeedbackText("");
      setIsFeedbackModalOpen(false);
    } catch {
      message.error("Feedback submission failed");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const saveChatAsText = () => {
    const content = chatHistory.map(msg => `${msg.role === "user" ? "You" : "Bot"}: ${msg.content}`).join("\n\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "comparison_chat.txt";
    link.click();
  };

  const clearChat = () => {
    setChatHistory([]);
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

          <p className="text-sm text-white text-center mt-2 mb-2">Select Documents to Compare</p>
          <Select
            placeholder="Select First Document"
            className="w-full mb-4"
            onChange={setDoc1}
            value={doc1 || undefined}
          >
            {uploadedDocs.map(doc => (
              <Option key={doc} value={doc}>{doc}</Option>
            ))}
          </Select>

          <Select
            placeholder="Select Second Document"
            className="w-full mb-4"
            onChange={setDoc2}
            value={doc2 || undefined}
          >
            {uploadedDocs
              .filter(doc => doc !== doc1)
              .map(doc => (
                <Option key={doc} value={doc}>{doc}</Option>
              ))}
          </Select>

          <Select
            placeholder="(Optional) Select Third Document"
            className="w-full mb-4"
            onChange={setDoc3}
            value={doc3 || undefined}
            allowClear
          >
            {uploadedDocs
              .filter(doc => doc !== doc1 && doc !== doc2)
              .map(doc => (
                <Option key={doc} value={doc}>{doc}</Option>
              ))}
          </Select>
        </div>
      </Sider>

      <Layout>
        <Header className="bg-[#FF4D4F] px-6 text-xl font-semibold shadow flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Select
              placeholder="Predefined Comparison Questions"
              onChange={setQuestion}
              value={comparisonQuestions.includes(question) ? question : undefined}
              style={{ minWidth: 600 }}
            >
              {comparisonQuestions.map((q, idx) => (
                <Option key={idx} value={q}>{q}</Option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button icon={<DeleteOutlined />} onClick={clearChat} />
            <Button icon={<SaveOutlined />} onClick={saveChatAsText} />
            <Button icon={<StopOutlined />} onClick={stopTyping} disabled={!botTyping} />
          </div>
        </Header>

        <Content className="flex flex-col justify-between bg-[#f4f4f4]">
          <div className="max-w-6xl w-full mx-auto flex flex-col gap-4 overflow-y-auto h-[80vh] p-4 px-8 bg-white rounded shadow">
            {chatHistory.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`p-3 max-w-[80%] rounded-lg shadow ${msg.role === "user" ? "bg-gray-100 text-black rounded-br-none" : "bg-gray-100 text-black rounded-bl-none"}`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                      table: ({ node, ...props }) => (
                        <table className="min-w-full border-collapse border border-gray-300 mb-4 text-sm" {...props} />
                      ),
                      thead: ({ node, ...props }) => (
                        <thead className="bg-gray-200 text-black text-sm" {...props} />
                      ),
                      tbody: ({ node, ...props }) => <tbody {...props} />,
                      tr: ({ node, ...props }) => (
                        <tr className="border-t border-gray-300" {...props} />
                      ),
                      th: ({ node, ...props }) => (
                        <th className="px-4 py-2 text-left text-sm font-semibold border border-gray-300" {...props} />
                      ),
                      td: ({ node, ...props }) => (
                        <td className="px-4 py-2 border border-gray-300 text-sm" {...props} />
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                  {msg.role === "bot" && !botTyping && (
                    <div className="text-right mt-1">
                      <MessageOutlined className="text-gray-500 cursor-pointer hover:text-gray-800" onClick={() => openFeedbackModal(msg.id)} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {botTyping && <div className="text-gray-400 italic">Typing...</div>}
          </div>

          <div className="max-w-4xl w-full mx-auto mb-4 flex gap-2">
            <TextArea
              placeholder="Type your comparison question..."
              autoSize={{ minRows: 1, maxRows: 4 }}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onPressEnter={(e) => {
                if (!e.shiftKey) {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              className="flex-1 rounded border-gray-500"
            />
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleAsk}
              disabled={!doc1 || !doc2 || !question}
              className="bg-[#FF4D4F]"
            >
              Send
            </Button>
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
