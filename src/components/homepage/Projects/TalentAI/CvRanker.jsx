
// src/pages/CvRanker/CvRanker.jsx

import { useState, useMemo } from "react";
import MainHeader from "./MainHeader";
import Sidebar from "./Sidebar";
import "./CvRanker.css";
import JSZip from "jszip";
import {
  InboxOutlined,
  DeleteOutlined,
  LikeOutlined,
  DislikeOutlined
} from "@ant-design/icons";
import {
  Upload,
  Button,
  Table,
  Typography,
  message,
  Input
} from "antd";
import * as XLSX from "xlsx";
import "antd/dist/reset.css";

const { Dragger } = Upload;
const { Title, Text } = Typography;

export default function CVRanker() {
  // ── State ─────────────────────────────────────────────────────────────
  const [cvs, setCvs]               = useState([]);
  const [jd, setJd]                 = useState(null);
  const [skillRows, setSkillRows]   = useState([]);    // { skill, weight }
  const [candidates, setCandidates] = useState([]);    // mapped rows
  const [parsedData, setParsedData] = useState([]);    // raw backend output
  const [loading, setLoading]       = useState(false);

  // ── Total-weight enforcement ───────────────────────────────────────────
  const totalWeight = useMemo(
    () => skillRows.reduce((sum, r) => sum + (Number(r.weight) || 0), 0),
    [skillRows]
  );

  // ── CV upload w/ ZIP extraction ────────────────────────────────────────
  const beforeCVUpload = async file => {
    const isZip = file.type==="application/zip"||file.name.endsWith(".zip");
    if (!isZip) return false;
    try {
      const zip       = await JSZip.loadAsync(file);
      const extracted = [];
      await Promise.all(
        Object.values(zip.files).map(async entry => {
          if (entry.dir) return;
          const ext = entry.name.split(".").pop().toLowerCase();
          if (["pdf","doc","docx"].includes(ext)) {
            const blob = await entry.async("blob");
            extracted.push({
              uid: entry.name,
              name: entry.name,
              originFileObj: new File([blob], entry.name, { type: blob.type })
            });
          }
        })
      );
      setCvs(prev => [...prev, ...extracted]);
      message.success(`Extracted ${extracted.length} file(s) from ZIP`);
    } catch {
      message.error("ZIP extraction failed");
    }
    return Upload.LIST_IGNORE;
  };
  const handleCVChange = ({ fileList }) => setCvs(fileList);

  // ── JD upload ──────────────────────────────────────────────────────────
  const handleJDUpload = ({ fileList }) => {
    setJd(fileList[0]);
    setSkillRows([]);
    setCandidates([]);
    setParsedData([]);
  };

  // ── Fetch skills from backend ──────────────────────────────────────────
  const fetchSkills = async () => {
    if (!jd) return message.error("Please upload a JD first");
    setLoading(true);
    const fd = new FormData();
    fd.append("pdf_file_JD", jd.originFileObj || jd);
    try {
      const res = await fetch(`${import.meta.env.VITE_TALENTAI_API_BASE_URL}/cv_analyzer/get_skills_and_weightages`, {
        method: "POST",
        body: fd
      });
      const raw = await res.json();            // JSON string from LLM
      const arr = JSON.parse(raw);
// drop the header row at index 0
  const data = arr;

  setSkillRows(
    data.map(([skillText, w]) => ({
      skill: skillText,
      weight: parseInt(String(w).replace("%",""), 10) || 0
    }))
  );

    } catch {
      message.error("Error extracting skills");
    } finally {
      setLoading(false);
    }
  };

  // ── Generate ranking ───────────────────────────────────────────────────
  const generateRanking = async () => {
    if (!cvs.length)           return message.error("Please upload CVs");
    if (totalWeight !== 100)   return message.error("Total weight must be 100%");
    setLoading(true);
    const fd = new FormData();
    cvs.forEach(f => fd.append("pdf_files_CV", f.originFileObj || f));
    fd.append("skills", skillRows.map(r=>r.skill).join("@"));
    fd.append("weightages", skillRows.map(r=>r.weight + "%"));
    try {
      const res  = await fetch(`${import.meta.env.VITE_TALENTAI_API_BASE_URL}/cv_analyzer/generate_ranking`, { method: "POST", body: fd });
      const data = await res.json();
      setParsedData(data);

      // Map into structured candidates
      const mapped = data.map((row, i) => {
        const name  = row[0];
        const email = row[row.length-2];
        const phone = row[row.length-1];
        let pairs = [];
        // New shape: parallel arrays
        if (Array.isArray(row[1]) && Array.isArray(row[2])) {
          row[1].forEach((sk, j) => {
            pairs.push([ sk, row[2][j] ?? "-" ]);
          });
        }
        // Old shape: already [ [skill,score], … ]
        else if (Array.isArray(row[1]) && Array.isArray(row[1][0])) {
          pairs = row[1];
        }
        return { key: String(i), name, pairs, email, phone };
      });

      // Sort descending by total of scores
      mapped.sort((a,b) => {
        const sumA = a.pairs.reduce((s,[,sc]) => s + Number(sc), 0);
        const sumB = b.pairs.reduce((s,[,sc]) => s + Number(sc), 0);
        return sumB - sumA;
      });

      setCandidates(mapped);
      if (cvs.length !== data.length) {
        message.warning(`Duplicate: ${cvs.length - data.length} CV(s) dropped`);
      }
      message.success("Ranking completed");
    } catch {
      message.error("Error generating rankings");
    } finally {
      setLoading(false);
    }
  };

  // ── Skill rows CRUD ───────────────────────────────────────────────────
  const addSkill    = () => skillRows.length < 10 && setSkillRows([...skillRows,{skill:"",weight:0}]);
  const updateSkill = (i,v) => { const c=[...skillRows]; c[i].skill=v; setSkillRows(c); };
  const updateWeight= (i,v) => { const n=parseInt(v,10); if(!isNaN(n)){ const c=[...skillRows]; c[i].weight=n; setSkillRows(c); }};
  const deleteSkill = i       => setSkillRows(skillRows.filter((_,idx)=>idx!==i));

  // ── Build flattened rows with rowSpan ──────────────────────────────────
  const tableRows = useMemo(() => {
    const rows = [];
    candidates.forEach((cand, idx) => {
      const span = cand.pairs.length;
      cand.pairs.forEach(([sk, sc], j) => {
        rows.push({
          key:      `${idx}-${j}`,
          name:     cand.name,
          skill:    sk,
          score:    `${sc}`,
          email:    cand.email,
          phone:    cand.phone,
          rowSpan:  j === 0 ? span : 0
        });
      });
    });
    return rows;
  }, [candidates]);

// ── Feedback download ─────────────────────────────────────────────────
const sendFeedback = async ok=>{
  try {
    const res = await fetch(`${import.meta.env.VITE_TALENTAI_API_BASE_URL}/jd_maker/api/feedback`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({feedback:ok,source:"cv_analyzer"})
    });
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href=url; a.download="feedback.xlsx"; a.click();
    URL.revokeObjectURL(url);
  } catch {
    message.error("Feedback failed");
  }
};


  // ── Export to Excel (blank repeats) ───────────────────────────────────
  const exportExcel = () => {
    if (!tableRows.length) {
      message.error("No data to export");
      return;
    }
    const aoa = [
      ["Candidate’s Name","Contact Number","Email Address","Skills","Score out of 5"]
    ];
    let prev = null;
    tableRows.forEach(r => {
      if (r.name === prev) {
        aoa.push(["", "", "",r.skill ,r.score]);
      } else {
        aoa.push([r.name, r.phone, r.email, r.skill, r.score,]);
        prev = r.name;
      }
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, "Rankings");
    XLSX.writeFile(wb, `CV_Ranking_${new Date().toISOString().slice(0,10)}.xlsx`);
    message.success("Excel exported");
  };

  // ── Table columns ─────────────────────────────────────────────────────
  const columns = [
    {
      title: "Candidate’s Name",
      dataIndex: "name",
      render: (text,row) => ({ children:text, props:{ rowSpan: row.rowSpan } })
    },
    {
      title: "Contact Number",
      dataIndex: "phone",
      render: (text,row) => ({ children:text, props:{ rowSpan: row.rowSpan } })
    },
    {
      title: "Email Address",
      dataIndex: "email",
      render: (text,row) => ({ children:text, props:{ rowSpan: row.rowSpan } })
    }
    ,
    { title: "Skills", dataIndex: "skill" },
    { title: "Score out of 5",  dataIndex: "score" }
  ];

  return (
    <main>
      <MainHeader />
      <Sidebar/>
      <div className="flex flex-col lg:flex-row gap-6 p-6 pl-20">
        {/* Left panel: JD & skills */}
        <div className="w-[40%] h-1/2 lg:w-[40%] space-y-4">
          <Title level={4}>Find Best-Fit Candidates</Title>

          <div className="upload-jd">
            <Text className="font-bold mb-2">Upload JD</Text>
            <Dragger
              fileList={jd?[jd]:[]}
              beforeUpload={()=>false}
              onChange={handleJDUpload}
              accept=".pdf,.doc,.docx"
              disabled={loading}
            >
              {/* <p className="ant-upload-drag-icon"><InboxOutlined/></p> */}
              <p className="ant-upload-text">Drag & drop or choose JD</p>
            </Dragger>
          </div>

          <div className="upload-cvs">
            <Text className="font-bold mb-2">Upload CVs (PDF/DOC/DOCX or ZIP)</Text>
            <Dragger
              multiple
              fileList={cvs}
              beforeUpload={beforeCVUpload}
              onChange={handleCVChange}
              accept=".pdf,.doc,.docx,.zip"
              disabled={loading}
            >
              {/* <p className="ant-upload-drag-icon"><InboxOutlined/></p> */}
              <p className="ant-upload-text">Drag & drop or choose CVs</p>
            </Dragger>
          </div>

          {skillRows.length>0 && (
            <div>
              {/* <Text>Skills & Weightages (must total 100%)</Text> */}
              {skillRows.map((r,i)=>(
                i===0?null:(
                <div key={i} className="flex items-center gap-2 mt-1">
                  <Input
                    value={r.skill}
                    onChange={e=>updateSkill(i,e.target.value)}
                    placeholder="Skill"
                    disabled={loading}
                    style={{width:220}}
                  />
                  {/* <Input
                    value={r.weight}
                    onChange={e=>updateWeight(i,e.target.value)}
                    placeholder="Weight"
                    suffix="%"
                    disabled={loading}
                    style={{width:80}}
                  /> */}
                  {/* <DeleteOutlined onClick={()=>deleteSkill(i)}/> */}
                </div>)
              ))}
              {/* <div className="mt-2 flex items-center gap-4">
                <Button onClick={addSkill} disabled={loading}>Add Skill</Button>
                <Text>Total:&nbsp;
                  <span style={{color: totalWeight===100?"inherit":"red"}}>
                    {totalWeight}%
                  </span>
                </Text>
              </div> */}
            </div>
          )}

          <Button
            type="primary"
            className="bg-primary"
            loading={loading}
            onClick={skillRows.length ? generateRanking : fetchSkills}
            style={{
       backgroundColor: "#DA2129", // ← your primary
       color: "#fff",
     }}
          >
            {skillRows.length ? "Rank CVs" : "Extract Skills"}
          </Button>
        </div>

        {/* Right panel: results */}
        <div className="w-[60%] lg:w-[60%] space-y-4">
          {tableRows.length>0 && (
            <>
              <Table
                columns={columns}
                dataSource={tableRows}
                pagination={false}
                bordered
                className="shadow rounded"
              />
              <div className="flex gap-4">
                {/* <Button icon={<LikeOutlined/>} onClick={()=>sendFeedback(true)}>
                  Thumbs Up
                </Button>
                <Button icon={<DislikeOutlined/>} onClick={()=>sendFeedback(false)}>
                  Thumbs Down
                </Button> */}
                <Button onClick={exportExcel}>Export Excel</Button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}







