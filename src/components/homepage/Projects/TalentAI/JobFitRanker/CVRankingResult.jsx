// src/pages/JobFitRanker/CVRankingResult.jsx
import React from "react";
import { Table, Typography, Input, Tooltip } from "antd";
const { Title, Text } = Typography;
import MainHeader from "../MainHeader";

export default function CVRankingResult({ skills = [], candidates = [] }) {
  // Table data construction, similar to CvRanker
  const tableRows = [];
  candidates.forEach((cand, idx) => {
    const sortedPairs = [...cand.pairs].sort((a, b) => Number(b[1]) - Number(a[1]));
    const span = sortedPairs.length;
    sortedPairs.forEach(([sk, sc], j) => {
      tableRows.push({
        key:      `${idx}-${j}`,
        name:     cand.name,
        skill:    sk,
        score:    `${sc}`,
        email:    cand.email,
        phone:    cand.phone,
        rowSpan:  j === 0 ? span : 0,
        group:    idx,
      });
    });
  });

  const columns = [
    {
      title: "Candidate’s Name",
      dataIndex: "name",
      render: (text,row) => ({ children:text, props:{ rowSpan: row.rowSpan } }),
    },
    {
      title: "Contact Number",
      dataIndex: "phone",
      render: (text,row) => ({ children:text, props:{ rowSpan: row.rowSpan } }),
    },
    {
      title: "Email Address",
      dataIndex: "email",
      render: (text,row) => ({ children:text, props:{ rowSpan: row.rowSpan } }),
    },
    { title: "Skills", dataIndex: "skill" },
    { title: "Score out of 5",  dataIndex: "score" }
  ];

  return (
    <main>
        <MainHeader/>
        <div className="flex flex-col lg:flex-row gap-6 p-6" style={{ minHeight: 600 }}>
        {/* Left panel: Skills */}
        <div className="w-[30%] space-y-4">
            <span className="font-bold mb-1">Key Skills</span>
            {skills.length > 0 && (
            <div>
                {skills.map((r, i) => (
                <div key={i} className="flex items-center gap-2 mt-1">
                    <Tooltip title={r.skill}>
                    <Input value={r.skill} style={{ width: 220 }} />
                    </Tooltip>
                    {/* <Input value={r.weight + "%"} style={{ width: 60 }} /> */}
                </div>
                ))}
            </div>
            )}
        </div>
        {/* Right panel: Candidates ranking */}
        <div className="w-[70%] space-y-4">
            <Text className="font-bold mb-2">Candidate CVs ranked</Text>
            <Table
            columns={columns}
            dataSource={tableRows}
            pagination={false}
            bordered
            className="shadow rounded"
            rowClassName={(_record, index) => {
                const group = tableRows[index]?.group ?? 0;
                return group % 2 === 0 ? "even-row" : "odd-row";
            }}
            />
        </div>
        </div>
    </main>
  );
}
