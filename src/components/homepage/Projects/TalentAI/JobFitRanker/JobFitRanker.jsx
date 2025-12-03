import React, { useState } from "react";
import { Upload, Button, Table, Typography, message } from "antd";
import MainHeader from "../MainHeader";
import Sidebar from "../Sidebar";
import { openCVRankingResultTab } from "./openRankingTab";
 
const { Dragger } = Upload;
const { Text } = Typography;
 
export default function JobFitRanker() {
  // AntD Upload file lists (NOT plain File[])
  const [jdFiles, setJdFiles] = useState([]); // UploadFile[]
  const [cvFiles, setCvFiles] = useState([]); // UploadFile[]
  const [jobs, setJobs] = useState([]); // [{ key, jd_id?, title, fileName, passing_cvs }]
  const [loading, setLoading] = useState(false);
  const [analyzingJobKeys, setAnalyzingJobKeys] = useState(new Set());
 
  // Handle Job Description files upload
  const handleJDChange = ({ fileList }) => {
    if (fileList.length > 5) {
      message.error("Maximum 5 JD files allowed");
      return;
    }
 
    // Keep AntD UploadFile objects
    setJdFiles(fileList);
 
    // Build stub job rows immediately (for UI) – we’ll fill passing_cvs after backend call
    const stubJobs = fileList.map((fileWrapper, idx) => ({
      key: fileWrapper.uid || `jd-${idx + 1}`,
      jd_id: null,
      title:
        (fileWrapper.name &&
          fileWrapper.name.replace(/\.[^/.]+$/, "")) ||
        `JD ${idx + 1}`,
      fileName: fileWrapper.name || `JD ${idx + 1}`,
      passing_cvs: [],
    }));
 
    setJobs(stubJobs);
  };
 
  // Handle CV files upload
  const handleCVChange = ({ fileList }) => {
    if (fileList.length > 10) {
      message.error("Maximum 10 CVs allowed");
      return;
    }
    setCvFiles(fileList);
  };
 
  // "Rank All Jobs" -> single call to match_jds_cvs_structured
  const handleRankAll = async () => {
    if (!jdFiles.length) {
      message.warning("Please upload JDs before ranking.");
      return;
    }
    if (!cvFiles.length) {
      message.warning("Please upload CVs before ranking.");
      return;
    }
 
    setLoading(true);
    try {
      const fd = new FormData();
 
      // Append all JD files
      jdFiles.forEach((f) => {
        const file = f.originFileObj;
        if (file) {
          fd.append("pdf_file_JD", file);
        }
      });
 
      // Append all CV files
      cvFiles.forEach((f) => {
        const file = f.originFileObj;
        if (file) {
          fd.append("pdf_files_CV", file);
        }
      });
 
      const res = await fetch(
        `${import.meta.env.VITE_TALENTAI_API_BASE_URL}/jd_fitment/match_jds_cvs_structured`,
        {
          method: "POST",
          body: fd,
        }
      );
 
      if (!res.ok) {
        const errText = await res.text();
        console.error("Backend 400 body:", errText);
        message.error(
          "Failed to rank jobs and CVs. Backend error: " + errText
        );
        return;
      }
 
      const data = await res.json();
      const results = Array.isArray(data.results) ? data.results : [];
 
      // Map backend JD results to frontend job rows
      const updatedJobs = results.map((jdResult, index) => {
        const fileWrapper = jdFiles[index]; // assuming order is preserved
        return {
          key: fileWrapper?.uid || `jd-${jdResult.jd_id ?? index + 1}`,
          jd_id: jdResult.jd_id,
          title:
            jdResult.jd_title ||
            fileWrapper?.name ||
            `JD ${index + 1}`,
          fileName: fileWrapper?.name || `JD ${index + 1}`,
          passing_cvs: jdResult.passing_cvs || [],
        };
      });
 
      setJobs(updatedJobs);
      message.success("Jobs and CVs ranked successfully.");
    } catch (err) {
      console.error("Error in handleRankAll:", err);
      message.error("Unexpected error while ranking jobs and CVs.");
    } finally {
      setLoading(false);
    }
  };
 
  // Per-row "Rank CVs" -> open detail tab using structured scores
  // const handleAnalyzeMatch = (job) => {
  //   const passing = job.passing_cvs || [];
  //   if (!passing.length) {
  //     message.info("No matching CVs available for this JD.");
  //     return;
  //   }
 
  //   setAnalyzingJobKeys((prev) => {
  //     const next = new Set(prev);
  //     next.add(job.key);
  //     return next;
  //   });
 
  //   try {
  //     const metricNames = [
  //       "Skills Match",
  //       "Experience Match",
  //       "Job Type Match",
  //       "Title Match",
  //       "Final Score",
  //     ];
 
  //     const candidates = passing.map((cv, idx) => {
  //     const d = cv.detail || {};
  //     const pairs = [
  //       ["Skills Match", d.desc_skills_score?.toFixed(3) ?? "-"],
  //       ["Experience Match", d.experience_score?.toFixed(3) ?? "-"],
  //       ["Job Type Match", d.job_type_score?.toFixed(3) ?? "-"],
  //       ["Title Match", d.title_designation_score?.toFixed(3) ?? "-"],
  //       ["Final Score", d.final_score?.toFixed(3) ?? "-"],
  //     ];
 
  //     const displayName =
  //       cv.cv_name ||                      // ✅ filename first
  //       cv.cv_current_designation ||       // fallback
  //       `CV ${cv.cv_id ?? idx + 1}`;
 
  //     return {
  //       key: String(idx),
  //       name: displayName,
  //       pairs,
  //       email: cv.email || "-",
  //       phone: cv.phone || "-",
  //     };
  //   });
 
 
  //     const skills = metricNames.map((name) => ({
  //       skill: name,
  //       weight: 0,
  //     }));
 
  //     openCVRankingResultTab({ skills, candidates });
  //   } finally {
  //     setAnalyzingJobKeys((prev) => {
  //       const next = new Set(prev);
  //       next.delete(job.key);
  //       return next;
  //     });
  //   }
  // };
 
  // Newly Added Rank CVs Handler Frontend Logical Implementation
  const handleAnalyzeMatch = async (job) => {
  if (!cvFiles || cvFiles.length === 0) {
    message.warning("Please upload CVs before analyzing matches.");
    return;
  }
 
  setAnalyzingJobKeys((prev) => {
    const next = new Set(prev);
    next.add(job.key);
    return next;
  });
 
  try {
    // --- 1) Resolve JD file for this row ---
    const jdWrapper =
      jdFiles.find((f) => f.name === job.fileName) ||
      jdFiles.find((f) =>
        f.name?.replace(/\.[^/.]+$/, "") === job.title
      );
 
    const jdFile = jdWrapper?.originFileObj;
    if (!jdFile) {
      message.error("Unable to resolve JD file for this job row.");
      return;
    }
 
    // --- 2) Resolve CV files to send for ranking ---
    const passing = Array.isArray(job.passing_cvs) ? job.passing_cvs : [];
    const matchedNames = new Set(
      passing.map((cv) => cv.cv_name).filter(Boolean)
    );
 
    const matchedCvWrappers = cvFiles.filter((f) =>
      matchedNames.has(f.name)
    );
    const cvWrappersToUse =
      matchedCvWrappers.length > 0 ? matchedCvWrappers : cvFiles;
 
    if (!cvWrappersToUse.length) {
      message.error("No CV files available to rank.");
      return;
    }
 
    // --- 3) /get_skills_and_weightages ---
    const skillsFd = new FormData();
    skillsFd.append("pdf_file_JD", jdFile);
 
    const skillsRes = await fetch(
      `${import.meta.env.VITE_TALENTAI_API_BASE_URL}/cv_analyzer/get_skills_and_weightages`,
      {
        method: "POST",
        body: skillsFd,
      }
    );
 
    if (!skillsRes.ok) {
      const err = await skillsRes.text();
      message.error("Failed to extract skills: " + err);
      return;
    }
 
    const skillsTable = await skillsRes.json();
    // Expected:
    // [
    //   ["Skill", "Weight%"],
    //   ["data science, machine learning", "35%"],
    //   ...
    // ]
    if (
      !Array.isArray(skillsTable) ||
      skillsTable.length < 2 ||
      !Array.isArray(skillsTable[0])
    ) {
      console.error("Bad skills table", skillsTable);
      message.error("Unexpected skills table format.");
      return;
    }
 
    const skillsString = skillsTable.map((row) => row[0]).join("@");
    const weightagesString = skillsTable.map((row) => row[1]).join(",");
 
    // --- 4) /generate_ranking ---
    const rankingFd = new FormData();
    cvWrappersToUse.forEach((f) => {
      const file = f.originFileObj;
      if (file) {
        rankingFd.append("pdf_files_CV", file);
      }
    });
    rankingFd.append("skills", skillsString);
    rankingFd.append("weightages", weightagesString);
 
    const rankRes = await fetch(
      `${import.meta.env.VITE_TALENTAI_API_BASE_URL}/cv_analyzer/generate_ranking`,
      {
        method: "POST",
        body: rankingFd,
      }
    );
 
    if (!rankRes.ok) {
      const err = await rankRes.text();
      message.error("Failed to generate ranking: " + err);
      return;
    }
 
    const ranking = await rankRes.json();
    console.log("generate_ranking response:", ranking);
 
    if (!Array.isArray(ranking)) {
      console.error("Bad ranking payload", ranking);
      message.error("Unexpected ranking response format.");
      return;
    }
 
    // --- 5) Map skillsTable -> left panel skills ---
    const [, ...skillRows] = skillsTable; // skip header
    const skills = skillRows.map(([skillName, weightStr]) => ({
      skill: skillName,
      weight:
        parseInt(String(weightStr).replace("%", "").trim(), 10) || 0,
    }));
 
    // --- 6) Map ranking -> candidates for CVRankingResult ---
    const candidates = ranking.map((row, i) => {
      const name = row[0];
      const perSkill = row[1]; // [[skill, score], ...]
      const email = row[3] ?? "-";
      const phone = row[4] ?? "-";
 
      let pairs = [];
      if (Array.isArray(perSkill) && Array.isArray(perSkill[0])) {
        pairs = perSkill;
      }
 
      return {
        key: String(i),
        name,
        pairs,
        email,
        phone,
      };
    });
 
    console.log("CV ranking payload:", { skills, candidates });
 
    // --- 7) Open the result tab ---
    openCVRankingResultTab({ skills, candidates });
  } catch (err) {
    console.error("Error in handleAnalyzeMatch:", err);
    message.error("Unexpected error while ranking CVs.");
  } finally {
    setAnalyzingJobKeys((prev) => {
      const next = new Set(prev);
      next.delete(job.key);
      return next;
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
  title: "Candidate Matches",
  key: "candidates",
  render: (_, record) => {
    const passing = record.passing_cvs || [];
    if (!passing.length) {
      return <Text type="secondary">No matches</Text>;
    }
    return (
          <>
            {passing.map((cv) => {
              const displayName =
                cv.cv_name ||                      // ✅ filename from backend
                cv.cv_current_designation ||       // fallback
                `CV ${cv.cv_id ?? ""}`;
 
              return (
                <div key={cv.cv_id ?? displayName}>
                  <Text>{displayName}</Text>
                  {typeof cv.final_score === "number" && (
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      ({(cv.final_score * 100).toFixed(1)}% match)
                    </Text>
                  )}
                </div>
              );
            })}
          </>
        );
      },
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
          disabled={
            !record.passing_cvs ||
            record.passing_cvs.length === 0 ||
            analyzingJobKeys.has(record.key)
          }
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
          <h2 className="text-xl font-semibold text-[#DA2128]">
            Job Fit Ranker
          </h2>
 
          <div>
            <Text className="font-bold mb-1 inline-block">Upload CVs</Text>
            <Dragger
              multiple
              fileList={cvFiles}
              beforeUpload={() => false}
              onChange={handleCVChange}
              accept=".pdf,.doc,.docx"
              disabled={loading}
            >
              <p className="ant-upload-text">
                Drag &amp; drop or{" "}
                <span className="text-[#DA2128]">choose CVs </span>
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
                Drag &amp; drop or{" "}
                <span className="text-[#DA2128]">choose JDs </span>
                <span className="text-gray-500">(upto 5)</span>
              </p>
            </Dragger>
          </div>
 
          <p className="text-sm mb-5 text-gray-500">
            Note: Number of JDs should not be greater than CVs
          </p>
 
          {loading && (
            <p className="mt-2 text-[#DA2128] text-sm font-semibold">
              Evaluating the uploaded files, please wait...
            </p>
          )}
 
          <Button
            type="primary"
            className="bg-[#DA2128]"
            loading={loading}
            disabled={!jdFiles.length || !cvFiles.length}
            onClick={handleRankAll}
          >
            Rank All Jobs
          </Button>
        </div>
 
        {/* Right panel */}
        <div className="w-[70%]">
          <span className="font-bold mb-2 text-sm inline-block">
            Candidates ranked as per JD
          </span>
          <Table
            dataSource={jobs.map((job) => ({ ...job, key: job.key }))}
            pagination={false}
            bordered
            columns={columns}
            locale={{
              emptyText: jobs.length ? "No candidates matched" : "",
            }}
          />
 
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

// import React, { useState } from "react";
// import {
//   Upload,
//   Button,
//   Table,
//   Typography,
//   message,
// } from "antd";
// import MainHeader from "../MainHeader";
// import Sidebar from "../Sidebar";
// import { openCVRankingResultTab } from './openRankingTab';
 
// const { Dragger } = Upload;
// const { Title, Text } = Typography;
 
// export default function JobFitRanker() {
//   const [jdFiles, setJdFiles] = useState([]);
//   const [cvFiles, setCvFiles] = useState([]);
//   const [jobs, setJobs] = useState([]);
//   const [loading, setLoading] = useState(false); // global loading for JD upload / Rank All Jobs
//   const [analyzingJobKeys, setAnalyzingJobKeys] = useState(new Set()); // per-row loading for "Rank CVs" buttons
 
//   // Handle Job Description files upload
//   const handleJDChange = async ({ fileList }) => {
//     if (fileList.length > 5) {
//       message.error("Maximum 5 JD files allowed");
//       return;
//     }
//     setLoading(true);
//     setJdFiles(fileList);
 
//     try {
//       const parsedJobs = await Promise.all(
//         fileList.map(async (fileWrapper) => {
//           const file = fileWrapper.originFileObj || fileWrapper;
//           const formData = new FormData();
//           formData.append("pdf_file_JD", file);
 
//           try {
//             const res = await fetch(`${import.meta.env.VITE_TALENTAI_API_BASE_URL}/jd_fitment/send_jd`, {
//               method: "POST",
//               body: formData,
//             });
//             const data = await res.json();
//             return {
//               key: file.name, // unique key per job
//               title: data.Job_Title || "Untitled JD",
//               file,
//               fileName: file.name,
//               candidates: [],
//               analyzed: [],
//               status: "idle",
//             };
//           } catch {
//             return {
//               key: file.name,
//               title: "Error parsing JD",
//               file,
//               fileName: file.name,
//               candidates: [],
//               analyzed: [],
//               status: "error",
//             };
//           }
//         })
//       );
//       setJobs(parsedJobs);
//     } finally {
//       setLoading(false);
//     }
//   };
 
//   // Handle CV files upload
//   const handleCVChange = ({ fileList }) => {
//     if (fileList.length > 10) {
//       message.error("Maximum 10 CVs allowed");
//       return;
//     }
//     setCvFiles(fileList.map((f) => f.originFileObj || f));
//   };
 
//   // "Rank All Jobs" button handler
//   const handleRankAll = async () => {
//     setLoading(true);
//     const updatedJobs = await Promise.all(
//       jobs.map(async (job) => {
//         const fd = new FormData();
//         cvFiles.forEach((f) => fd.append("pdf_files_CV", f));
//         fd.append("pdf_files_JD", job.file);
 
//         try {
//           const res = await fetch(`${import.meta.env.VITE_TALENTAI_API_BASE_URL}/jd_fitment/generate_Jd_fitment`, {
//             method: "POST",
//             body: fd,
//           });
//           const data = await res.json();
//           const matchEntry = data.find((r) => r.job_title === job.title) || {};
//           const matches = matchEntry.matches || [];
//           return { ...job, candidates: matches, status: "done" };
//         } catch {
//           return { ...job, status: "error" };
//         }
//       })
//     );
//     setJobs(updatedJobs);
//     setLoading(false);
//   };
 
//   // Per-row "Rank CVs" button handler
//   const handleAnalyzeMatch = async (job) => {
//   if (!cvFiles || cvFiles.length === 0) {
//     message.warning("Please upload CVs before analyzing matches.");
//     return;
//   }
 
//   setAnalyzingJobKeys((prev) => new Set(prev).add(job.key));
 
//   try {
//     const analyzeFd = new FormData();
//     analyzeFd.append("pdf_file_JD", job.file);
 
//     const matchedCvFiles = cvFiles.filter((cv) => {
//       if (!cv.name) return false;
//       return job.candidates.includes(cv.name);
//     });
//     const finalCvFiles = matchedCvFiles.length > 0 ? matchedCvFiles : cvFiles;
//     finalCvFiles.forEach((f) => analyzeFd.append("pdf_files_CV", f));
 
//     // Provide default dummy skills and weightages or infer from somewhere
//     // Here, you can hardcode or infer skills as a fallback
//     const defaultSkills = ["Data Science", "Python", "SQL"]; // example
//     const defaultWeightages = [35, 25, 10]; // example percentages
 
//     analyzeFd.append("skills", defaultSkills.join("@"));
//     analyzeFd.append("weightages", defaultWeightages.join(","));
 
//     const res = await fetch(`${import.meta.env.VITE_TALENTAI_API_BASE_URL}/jd_fitment/analyze_matches`, {
//       method: "POST",
//       body: analyzeFd,
//     });
 
//     if (!res.ok) {
//       const errMsg = await res.text();
//       message.error("Failed to analyze matches: " + errMsg);
//       return;
//     }
//     const ranking = await res.json();
 
//     // Process response as before
//     const candidates = ranking.map((row, i) => {
//       const name = row[0];
//       const email = row[row.length - 2];
//       const phone = row[row.length - 1];
//       let pairs = [];
//       if (Array.isArray(row[1]) && Array.isArray(row[2])) {
//         row[1].forEach((skillName, j) => {
//           pairs.push([skillName, row[2][j] ?? "-"]);
//         });
//       } else if (Array.isArray(row[1]) && Array.isArray(row[1][0])) {
//         pairs = row[1];
//       }
//       return { key: String(i), name, pairs, email, phone };
//     });
 
//     let skills = [];
//     if (candidates.length > 0) {
//       skills = candidates[0].pairs.map(([skillText]) => ({
//         skill: skillText,
//         weight: 0,
//       }));
//     }
 
//     openCVRankingResultTab({ skills, candidates });
//   } finally {
//     setAnalyzingJobKeys((prev) => {
//       const newSet = new Set(prev);
//       newSet.delete(job.key);
//       return newSet;
//     });
//   }
// };
 
 
 
//   // Table columns config
//   const columns = [
//     {
//       title: "Job Title",
//       dataIndex: "title",
//       key: "title",
//       render: (text) => <Text strong>JD - {text}</Text>,
//     },
//     {
//       title: "Candidate Name",
//       key: "candidates",
//       render: (_, record) => (
//         <>
//           {record.candidates.length > 0 ? (
//             record.candidates.map((c, i) => <div key={i}><Text>{c}</Text></div>)
//           ) : (
//             <Text type="secondary">No matches</Text>
//           )}
//         </>
//       ),
//     },
//     {
//       title: "",
//       key: "actions",
//       render: (_, record) => (
//         <Button
//           type="primary"
//           className="bg-[#DA2128]"
//           loading={analyzingJobKeys.has(record.key)}
//           onClick={() => handleAnalyzeMatch(record)}
//           disabled={record.status !== "done" || analyzingJobKeys.has(record.key)}
//         >
//           Rank CVs
//         </Button>
//       ),
//     },
//   ];
 
//   return (
//     <main>
//       <MainHeader />
//       <Sidebar />
//       <div className="flex flex-col lg:flex-row gap-6 p-6 pl-20">
//         {/* Left panel */}
//         <div className="w-[30%] space-y-4">
//           <h2 className="text-xl font-semibold text-[#DA2128]">Job Fit Ranker</h2>
 
//           <div>
//             <Text className="font-bold mb-1 inline-block">Upload CVs</Text>
//             <Dragger
//               multiple
//               fileList={cvFiles.map((f) => ({ uid: f.uid || f.name, name: f.name || f.uid }))}
//               beforeUpload={() => false}
//               onChange={handleCVChange}
//               accept=".pdf,.doc,.docx"
//               disabled={loading}
//             >
//               <p className="ant-upload-text">
//                 Drag & drop or <span className="text-[#DA2128]">choose CVs </span>
//                 <span className="text-gray-500">(upto 10)</span>
//               </p>
//             </Dragger>
//           </div>
 
//           <div>
//             <Text className="font-bold mb-1 inline-block">Upload JDs</Text>
//             <Dragger
//               multiple
//               fileList={jdFiles}
//               beforeUpload={() => false}
//               onChange={handleJDChange}
//               accept=".pdf,.doc,.docx"
//               disabled={loading}
//             >
//               <p className="ant-upload-text">
//                 Drag & drop or <span className="text-[#DA2128]">choose JDs </span>
//                 <span className="text-gray-500">(upto 5)</span>
//               </p>
//             </Dragger>
//           </div>
 
//           <p className="text-sm mb-5 text-gray-500">Note: Number of JDs should not be greater than CVs</p>
 
//           {loading && (
//             <p className="mt-2 text-[#DA2128] text-sm font-semibold">
//               Evaluating the uploaded files, please wait...
//             </p>
//           )}
 
//           <Button
//             type="primary"
//             className="bg-[#DA2128]"
//             loading={loading}
//             disabled={!jobs.length || !cvFiles.length}
//             onClick={handleRankAll}
//           >
//             Rank All Jobs
//           </Button>
//         </div>
 
//         {/* Right panel */}
//         <div className="w-[70%]">
//           <span className="font-bold mb-2 text-sm inline-block">Candidates ranked as per JD</span>
//           <Table
//             dataSource={jobs.map((job) => ({ ...job, key: job.key }))}
//             pagination={false}
//             bordered
//             columns={columns}
//             locale={{ emptyText: jobs.length ? "No candidates matched" : "" }}
//           />
 
//           {/* Loading text below table for any analyzing jobs */}
//           {analyzingJobKeys.size > 0 && (
//             <p className="mt-2 text-[#DA2128] text-sm font-semibold">
//               Analyzing candidate matches, please wait...
//             </p>
//           )}
//         </div>
//       </div>
//     </main>
//   );
// }