// src/pages/JobFitRanker/JobFitRanker.jsx

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
const { Text } = Typography;

export default function JobFitRanker() {
  const [jdFiles, setJdFiles] = useState([]);
  const [cvFiles, setCvFiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzingJobKeys, setAnalyzingJobKeys] = useState(new Set());

  const handleJDChange = async ({ fileList }) => {
    if (fileList.length > 5) return message.error("Maximum 5 JD files allowed");
    setLoading(true);
    setJdFiles(fileList.map(f => f.originFileObj || f));
    try {
      const parsedJobs = await Promise.all(
        fileList.map(async (fileWrapper) => {
          const file = fileWrapper.originFileObj || fileWrapper;
          const formData = new FormData();
          formData.append("pdf_file_JD", file);
          try {
            const res = await fetch(
              `${import.meta.env.VITE_TALENTAI_API_BASE_URL}/jd_fitment/send_jd`,
              { method: "POST", body: formData }
            );
            const data = await res.json();
            return {
              key: file.name,
              title: data.Job_Title || "Untitled JD",
              file,
              fileName: file.name,
              candidates: [],
              status: "idle",
            };
          } catch {
            return {
              key: file.name,
              title: "Error parsing JD",
              file,
              fileName: file.name,
              candidates: [],
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

  const handleCVChange = ({ fileList }) => {
    if (fileList.length > 10) return message.error("Maximum 10 CVs allowed");
    setCvFiles(fileList.map(f => f.originFileObj || f));
  };

  const handleRankAll = async () => {
    setLoading(true);
    const updatedJobs = await Promise.all(
      jobs.map(async (job) => {
        const fd = new FormData();
        cvFiles.forEach(f => fd.append("pdf_files_CV", f));
        fd.append("pdf_files_JD", job.file);
        try {
          const res = await fetch(
            `${import.meta.env.VITE_TALENTAI_API_BASE_URL}/jd_fitment/generate_Jd_fitment`,
            { method: "POST", body: fd }
          );
          const data = await res.json();
          const matchEntry = data.find(r => r.job_title === job.title) || {};
          return { ...job, candidates: matchEntry.matches || [], status: "done" };
        } catch {
          return { ...job, status: "error" };
        }
      })
    );
    setJobs(updatedJobs);
    setLoading(false);
  };

  const handleAnalyzeMatch = async (job) => {
    if (!cvFiles.length) {
      return message.warning("Please upload CVs before analyzing matches.");
    }
    setAnalyzingJobKeys(s => new Set(s).add(job.key));

    // Fetch skills
    const skillFd = new FormData();
    skillFd.append("pdf_file_JD", job.file);
    let skillArr = [];
    try {
      const skillRes = await fetch(
        `${import.meta.env.VITE_TALENTAI_API_BASE_URL}/cv_analyzer/get_skills_and_weightages`,
        { method: "POST", body: skillFd }
      );
      skillArr = await skillRes.json();
      if (typeof skillArr === "string") skillArr = JSON.parse(skillArr);
    } catch {
      message.error("Failed to fetch skills/weightages.");
      setAnalyzingJobKeys(s => { const ns = new Set(s); ns.delete(job.key); return ns; });
      return;
    }

    // Prepare analyze_matches
    const analyzeFd = new FormData();
    analyzeFd.append("pdf_file_JD", job.file);
    const matched = cvFiles.filter(cv => job.candidates.includes(cv.name));
    (matched.length ? matched : cvFiles)
      .forEach(f => analyzeFd.append("pdf_files_CV", f));
    analyzeFd.append("skills", skillArr.map(r => r[0]).join("@"));
    analyzeFd.append("weightages", skillArr.map(r => r[1]).join(","));

    // Fetch ranking
    try {
      const res = await fetch(
        `${import.meta.env.VITE_TALENTAI_API_BASE_URL}/jd_fitment/analyze_matches`,
        { method: "POST", body: analyzeFd }
      );
      if (!res.ok) {
        const errMsg = await res.text();
        message.error("Failed to analyze matches: " + errMsg);
      } else {
        const ranking = await res.json();
        const candidates = ranking.map((row,i) => {
          const name = row[0], email = row[row.length-2], phone = row[row.length-1];
          let pairs = [];
          if (Array.isArray(row[1]) && Array.isArray(row[2])) {
            row[1].forEach((s,j) => pairs.push([s, row[2][j] ?? "-"]));
          } else if (Array.isArray(row[1]) && Array.isArray(row[1][0])) {
            pairs = row[1];
          }
          return { key:String(i), name, pairs, email, phone };
        });
        const skillsDisplay = skillArr.slice(1).map(([s,w]) => ({
          skill: s, weight: parseInt(String(w).replace("%",""),10) || 0
        }));
        openCVRankingResultTab({ skills: skillsDisplay, candidates });
      }
    } catch (err) {
      message.error("Analyze matches request failed.");
    } finally {
      setAnalyzingJobKeys(s => { const ns = new Set(s); ns.delete(job.key); return ns; });
    }
  };

  const columns = [
    { title: "Job Title", dataIndex: "title", key: "title", render: t => <Text strong>JD - {t}</Text> },
    {
      title: "Candidate Name", key: "candidates",
      render: (_,r) => r.candidates.length
        ? r.candidates.map((c,i) => <div key={i}><Text>{c}</Text></div>)
        : <Text type="secondary">No matches</Text>
    },
    {
      title: "",
      key: "actions",
      render: (_,r) => (
        <Button
          type="primary"
          className="bg-[#DA2129]"
          loading={analyzingJobKeys.has(r.key)}
          onClick={() => handleAnalyzeMatch(r)}
          disabled={r.status!=="done" || analyzingJobKeys.has(r.key)}
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
        <div className="w-[30%] space-y-4">
          <h2 className="text-xl font-semibold text-[#DA2129]">Job Fit Ranker</h2>
          <div>
            <Text className="font-bold mb-1 inline-block">Upload CVs</Text>
            <Dragger
              action={null}
              multiple
              beforeUpload={() => false}
              onChange={handleCVChange}
              fileList={cvFiles.map(f => ({ uid: f.uid||f.name, name: f.name||f.uid }))}
              accept=".pdf,.doc,.docx"
              disabled={loading}
            >
              <p className="ant-upload-text">
                Drag & drop or <span className="text-[#DA2129]">choose CVs</span> <span className="text-gray-500">(upto 10)</span>
              </p>
            </Dragger>
          </div>
          <div>
            <Text className="font-bold mb-1 inline-block">Upload JDs</Text>
            <Dragger
              action={null}
              multiple
              beforeUpload={() => false}
              onChange={handleJDChange}
              fileList={jdFiles.map(f => ({ uid: f.name, name: f.name }))}
              accept=".pdf,.doc,.docx"
              disabled={loading}
            >
              <p className="ant-upload-text">
                Drag & drop or <span className="text-[#DA2129]">choose JDs</span> <span className="text-gray-500">(upto 5)</span>
              </p>
            </Dragger>
          </div>
          <p className="text-sm mb-5 text-gray-500">Note: Number of JDs should not be greater than CVs</p>
          {loading && <p className="mt-2 text-[#DA2129] text-sm font-semibold">Evaluating uploaded files, please wait...</p>}
          <Button
            type="primary"
            className="bg-[#DA2129]"
            loading={loading}
            disabled={!jobs.length || !cvFiles.length}
            onClick={handleRankAll}
          >
            Rank All Jobs
          </Button>
        </div>
        <div className="w-[70%]">
          <span className="font-bold mb-2 text-sm inline-block">Candidates ranked as per JD</span>
          <Table
            dataSource={jobs.map(j => ({ ...j, key: j.key }))}
            pagination={false}
            bordered
            columns={columns}
            locale={{ emptyText: jobs.length ? "No candidates matched" : "" }}
          />
          {analyzingJobKeys.size > 0 && (
            <p className="mt-2 text-[#DA2129] text-sm font-semibold">Analyzing candidate matches, please wait...</p>
          )}
        </div>
      </div>
    </main>
  );
}
