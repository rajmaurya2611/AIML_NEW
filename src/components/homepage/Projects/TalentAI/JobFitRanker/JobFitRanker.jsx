import React, { useState } from "react";
import {
  Upload,
  Button,
  Table,
  Typography,
  message,
} from "antd";
import MainHeader from "../MainHeader";
import Sidebar from "../Sidebar";
import { openCVRankingResultTab } from './openRankingTab';
 
const { Dragger } = Upload;
const { Title, Text } = Typography;
 
export default function JobFitRanker() {
  const [jdFiles, setJdFiles] = useState([]);
  const [cvFiles, setCvFiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false); // global loading for JD upload / Rank All Jobs
  const [analyzingJobKeys, setAnalyzingJobKeys] = useState(new Set()); // per-row loading for "Rank CVs" buttons
 
  // Handle Job Description files upload
  const handleJDChange = async ({ fileList }) => {
    if (fileList.length > 5) {
      message.error("Maximum 5 JD files allowed");
      return;
    }
    setLoading(true);
    setJdFiles(fileList);
 
    try {
      const parsedJobs = await Promise.all(
        fileList.map(async (fileWrapper) => {
          const file = fileWrapper.originFileObj || fileWrapper;
          const formData = new FormData();
          formData.append("pdf_file_JD", file);
 
          try {
            const res = await fetch(`${import.meta.env.VITE_TALENTAI_API_BASE_URL}/jd_fitment/send_jd`, {
              method: "POST",
              body: formData,
            });
            const data = await res.json();
            return {
              key: file.name, // unique key per job
              title: data.Job_Title || "Untitled JD",
              file,
              fileName: file.name,
              candidates: [],
              analyzed: [],
              status: "idle",
            };
          } catch {
            return {
              key: file.name,
              title: "Error parsing JD",
              file,
              fileName: file.name,
              candidates: [],
              analyzed: [],
              status: "error",
            };
          }
        })
      );
      setJobs(parsedJobs);
    } finally {
      setLoading(false);
    }
  };
 
  // Handle CV files upload
  const handleCVChange = ({ fileList }) => {
    if (fileList.length > 10) {
      message.error("Maximum 10 CVs allowed");
      return;
    }
    setCvFiles(fileList.map((f) => f.originFileObj || f));
  };
 
  // "Rank All Jobs" button handler
  const handleRankAll = async () => {
    setLoading(true);
    const updatedJobs = await Promise.all(
      jobs.map(async (job) => {
        const fd = new FormData();
        cvFiles.forEach((f) => fd.append("pdf_files_CV", f));
        fd.append("pdf_files_JD", job.file);
 
        try {
          const res = await fetch(`${import.meta.env.VITE_TALENTAI_API_BASE_URL}/jd_fitment/generate_Jd_fitment`, {
            method: "POST",
            body: fd,
          });
          const data = await res.json();
          const matchEntry = data.find((r) => r.job_title === job.title) || {};
          const matches = matchEntry.matches || [];
          return { ...job, candidates: matches, status: "done" };
        } catch {
          return { ...job, status: "error" };
        }
      })
    );
    setJobs(updatedJobs);
    setLoading(false);
  };
 
  // Per-row "Rank CVs" button handler
  const handleAnalyzeMatch = async (job) => {
    if (!cvFiles || cvFiles.length === 0) {
      message.warning("Please upload CVs before analyzing matches.");
      return;
    }
 
    // Show spinner on this row
    setAnalyzingJobKeys((prev) => new Set(prev).add(job.key));
 
    try {
      // Step 1: Fetch skills and weightages robustly
      const skillFd = new FormData();
      skillFd.append("pdf_file_JD", job.file);
      let skillArr = [];
      try {
        const skillRes = await fetch(`${import.meta.env.VITE_TALENTAI_API_BASE_URL}/cv_analyzer/get_skills_and_weightages`, {
          method: "POST",
          body: skillFd,
        });
        const skillRaw = await skillRes.text();
 
        // Parse repeatedly until you get an array (handle backend double-encoding)
        skillArr = skillRaw;
        while (typeof skillArr === "string") {
          skillArr = JSON.parse(skillArr);
        }
 
        if (!Array.isArray(skillArr)) {
          message.error("Unexpected response: skills/weightages was not an array.");
          return;
        }
 
        // Remove header row if present
        if (
          skillArr.length &&
          typeof skillArr[0][0] === "string" &&
          skillArr[0][0].toLowerCase().includes("skill")
        ) {
          skillArr = skillArr.slice(1);
        }
 
        if (skillArr.length === 0) {
          message.error("No skills extracted from JD. Please check your JD file.");
          return;
        }
      } catch {
        message.error("Failed to fetch skills/weightages.");
        return;
      }
 
      // Step 2: Prepare form data and filter CVs for analyze_matches
      const analyzeFd = new FormData();
      analyzeFd.append("pdf_file_JD", job.file);
 
      // Filter CV files that exactly match candidate names returned earlier
      const matchedCvFiles = cvFiles.filter((cv) => {
        if (!cv.name) return false;
        return job.candidates.includes(cv.name);
      });
      const finalCvFiles = matchedCvFiles.length > 0 ? matchedCvFiles : cvFiles;
      finalCvFiles.forEach((f) => analyzeFd.append("pdf_files_CV", f));
 
      analyzeFd.append(
        "skills",
        skillArr.map(([skill]) => skill).join("@")
      );
      analyzeFd.append(
        "weightages",
        skillArr.map(([_, weight]) => weight).join(",")
      );
 
      // Step 3: Fetch results from /analyze_matches
      const res = await fetch(`${import.meta.env.VITE_TALENTAI_API_BASE_URL}/jd_fitment/analyze_matches`, {
        method: "POST",
        body: analyzeFd,
      });
 
      if (!res.ok) {
        const errMsg = await res.text();
        message.error("Failed to analyze matches: " + errMsg);
        return;
      }
      const ranking = await res.json();
 
      // Step 4: Map response into candidates array for UI
      const candidates = ranking.map((row, i) => {
        const name = row[0];
        const email = row[row.length - 2];
        const phone = row[row.length - 1];
        let pairs = [];
        if (Array.isArray(row[1]) && Array.isArray(row[2])) {
          row[1].forEach((skillName, j) => {
            pairs.push([skillName, row[2][j] ?? "-"]);
          });
        } else if (Array.isArray(row[1]) && Array.isArray(row[1][0])) {
          pairs = row[1];
        }
        return { key: String(i), name, pairs, email, phone };
      });
 
      // Step 5: Convert skillArr into skill objects for UI
      const skills = skillArr.map(([skillText, weight]) => ({
        skill: skillText,
        weight: parseInt(String(weight).replace("%", ""), 10) || 0,
      }));
 
      // Step 6: Open new tab with results
      openCVRankingResultTab({ skills, candidates });
    } finally {
      setAnalyzingJobKeys((prev) => {
        const newSet = new Set(prev);
        newSet.delete(job.key);
        return newSet;
      });
    }
  };
 
  // Table columns config
  const columns = [
    {
      title: "Job Title",
      dataIndex: "title",
      key: "title",
      render: (text) => <Text strong>JD - {text}</Text>,
    },
    {
      title: "Candidate Name",
      key: "candidates",
      render: (_, record) => (
        <>
          {record.candidates.length > 0 ? (
            record.candidates.map((c, i) => <div key={i}><Text>{c}</Text></div>)
          ) : (
            <Text type="secondary">No matches</Text>
          )}
        </>
      ),
    },
    {
      title: "",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          className="bg-[#DA2128]"
          loading={analyzingJobKeys.has(record.key)}
          onClick={() => handleAnalyzeMatch(record)}
          disabled={record.status !== "done" || analyzingJobKeys.has(record.key)}
        >
          Rank CVs
        </Button>
      ),
    },
  ];
 
  return (
    <main>
      <MainHeader />
      <Sidebar />
      <div className="flex flex-col lg:flex-row gap-6 p-6 pl-20">
        {/* Left panel */}
        <div className="w-[30%] space-y-4">
          <h2 className="text-xl font-semibold text-[#DA2128]">Job Fit Ranker</h2>
 
          <div>
            <Text className="font-bold mb-1 inline-block">Upload CVs</Text>
            <Dragger
              multiple
              fileList={cvFiles.map((f) => ({ uid: f.uid || f.name, name: f.name || f.uid }))}
              beforeUpload={() => false}
              onChange={handleCVChange}
              accept=".pdf,.doc,.docx"
              disabled={loading}
            >
              <p className="ant-upload-text">
                Drag & drop or <span className="text-[#DA2128]">choose CVs </span>
                <span className="text-gray-500">(upto 10)</span>
              </p>
            </Dragger>
          </div>
 
          <div>
            <Text className="font-bold mb-1 inline-block">Upload JDs</Text>
            <Dragger
              multiple
              fileList={jdFiles}
              beforeUpload={() => false}
              onChange={handleJDChange}
              accept=".pdf,.doc,.docx"
              disabled={loading}
            >
              <p className="ant-upload-text">
                Drag & drop or <span className="text-[#DA2128]">choose JDs </span>
                <span className="text-gray-500">(upto 5)</span>
              </p>
            </Dragger>
          </div>
 
          <p className="text-sm mb-5 text-gray-500">Note: Number of JDs should not be greater than CVs</p>
 
          {loading && (
            <p className="mt-2 text-[#DA2128] text-sm font-semibold">
              Evaluating the uploaded files, please wait...
            </p>
          )}
 
          <Button
            type="primary"
            className="bg-[#DA2128]"
            loading={loading}
            disabled={!jobs.length || !cvFiles.length}
            onClick={handleRankAll}
          >
            Rank All Jobs
          </Button>
        </div>
 
        {/* Right panel */}
        <div className="w-[70%]">
          <span className="font-bold mb-2 text-sm inline-block">Candidates ranked as per JD</span>
          <Table
            dataSource={jobs.map((job) => ({ ...job, key: job.key }))}
            pagination={false}
            bordered
            columns={columns}
            locale={{ emptyText: jobs.length ? "No candidates matched" : "" }}
          />
 
          {/* Loading text below table for any analyzing jobs */}
          {analyzingJobKeys.size > 0 && (
            <p className="mt-2 text-[#DA2128] text-sm font-semibold">
              Analyzing candidate matches, please wait...
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
 