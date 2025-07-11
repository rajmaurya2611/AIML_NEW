// // import { useState } from "react";
// // import JobForm from "./JobForm";
// // import Preview from "./Preview";
// // import "./JdGenerator.css";
// // import MainHeader from "../../components/common/MainHeader/MainHeader";
// // import Sidebar from "../../components/common/sidebar/Sidebar";

// // export default function JdGenerator() {
// //   const [formData, setFormData] = useState({
// //     location: "",
// //     jobTitle: "",
// //     employmentType: "",
// //     businessUnit: "",
// //     // experience: "",
// //     jobDescription: "",
// //     experience: "3-8",
// //     // keyResponsibilities: "",
// //     highestQualifications: "",
// //     preferredSkills: [],
// //     // companyDetails: "",
// //     // companyName: "",
// //   });

// //   return (
// //     <>
// //     <MainHeader />
// //     {/* <Sidebar /> */}
// //     <main className="flex flex-1 p-4 gap-6">
// //       <JobForm formData={formData} setFormData={setFormData} />
// //       <Preview formData={formData} />
// //     </main>
// //     </>
// //   );
// // }


// import { useState } from "react";
// import JobForm from "./JobForm";
// import Preview from "./Preview";
// import "./JdGenerator.css";
// import MainHeader from "../../components/common/MainHeader/MainHeader";

// export default function JdGenerator() {
//   const [formData, setFormData] = useState({
//     location: "",
//     jobTitle: "",
//     employmentType: "",
//     businessUnit: "",
//     experience: "",
//     highestQualifications: "",
//     preferredSkills: [],            // keep as array
//     companyDetails: "",             // add if Preview expects it
//     companyName: "",
//   });

//   const [previewText, setPreviewText]   = useState("");
//   const [loading, setLoading]           = useState(false);
//   const [error, setError]               = useState("");
//   const [feedbackVisible, setFeedbackVisible] = useState(false);


//   // Generate JD based on formData
//   const handleGenerate = async () => {
//     setError("");
//     // Basic validation: ensure required fields are filled
//     if (!formData.location || !formData.jobTitle || !formData.experience) {
//       setError("Please fill in all required fields.");
//       return;
//     }

//     setLoading(true);
//     setPreviewText("");
//     setFeedbackVisible(false);

//     try {
//       const payload = new FormData();
//       Object.entries(formData).forEach(([key, value]) => {
//         payload.append(key, value);
//       });

//       const response = await fetch("/jd_maker/generate_job_description", {
//         method: "POST",
//         body: payload,
//       });

//       if (!response.ok) {
//         throw new Error("Failed to generate job description.");
//       }

//       const text = await response.text();
//       setPreviewText(text);
//       setFeedbackVisible(true);
//     } catch (err) {
//       setError(err.message || "An error occurred.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Save edited text to backend
//   const saveUpdatedDescription = async (updatedText) => {
//     try {
//       await fetch("/jd_maker/update_job_description", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ updated_text: updatedText }),
//       });
//     } catch (err) {
//       console.error("Failed to save update:", err);
//     }
//   };

//   // Download DOCX or PDF
//   const handleDownload = async (format) => {
//     if (!previewText) return;
//     setDownloadFormat(format);

//     // Save any edits before download
//     await saveUpdatedDescription(previewText);

//     try {
//       const endpoint = format === "docx" ? "/jd_maker/get_docx_file" : "/jd_maker/get_pdf_file";
//       const response = await fetch(endpoint, { method: "POST" });
//       if (!response.ok) throw new Error(`Error downloading ${format}`);

//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = `Job_Description.${format}`;
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   // Send feedback
//   const sendFeedback = async (isPositive) => {
//     try {
//       const response = await fetch('/jd_maker/api/feedback', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ feedback: isPositive, source: 'jd_maker' })
//       });

//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement('a');
//       a.href = url;
//       a.download = 'feedback_response.xlsx';
//       document.body.appendChild(a);
//       a.click();
//       a.remove();
//       window.URL.revokeObjectURL(url);
//     } catch (err) {
//       console.error('Feedback error:', err);
//     }
//   };

//   return (
//     <>
//       <MainHeader />

//       {error && (
//         <div className="w-full text-center bg-red-100 text-red-700 py-2">
//           {error}
//         </div>
//       )}

//       <main className="flex flex-1 p-4 gap-6">
//          <JobForm
//           formData={formData}
//           setFormData={setFormData}
//           onGenerate={handleGenerate}   // fires backend call
//           disabled={loading}
//         />

//         <Preview
//           text={previewText}            // shows response
//           loading={loading}
//           error={error}
//           formData={formData}           // optional: to show any form fields
//           onDownload={handleDownload}
//           feedbackVisible={feedbackVisible}
//           onFeedback={sendFeedback}
//         />
//       </main>
//     </>
//   );
// }

import { useState } from "react";
import JobForm from "./JobForm";
import Preview from "./Preview";
import "./JdGenerator.css";
import MainHeader from "./MainHeader";
import Sidebar from "./Sidebar";

export default function JdGenerator() {
  /* ✅ pick up your backend host from .env — or leave empty for same-origin */
  const baseUrl = import.meta.env.VITE_TALENTAI_API_BASE_URL || "";

  const [formData, setFormData] = useState({
    companyDetails:
      "Motherson Technology Services Ltd is the technology and industrial solution " +
      "division of Motherson Group, one of the world's leading auto components " +
      "manufacturers known for its diversified portfolio of auto ancillary " +
      "products and services.",
    location: "",
    jobTitle: "",
    employmentType: "",
    businessUnit: "",
    experience: "",
    highestQualifications: "",
    preferredSkills: [],
    keyResponsibilities: "",
  });

  const [previewText, setPreviewText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  /* ---------- generate JD ---------- */
  const handleGenerate = async () => {
    setError("");
    if (!formData.location || !formData.jobTitle || !formData.experience) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true); setPreviewText(""); setFeedbackVisible(false);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v));

      const res = await fetch(`${baseUrl}/jd_maker/generate_job_description`, {
        method: "POST", body: fd,
      });
      if (!res.ok) throw new Error(await res.text());
      setPreviewText(await res.text());
      setFeedbackVisible(true);
    } catch (e) {
      setError(e.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- save edits ---------- */
  const saveUpdatedDescription = (txt) =>
    fetch(`${baseUrl}/jd_maker/update_job_description`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updated_text: txt }),
    }).catch(console.error);

  /* ---------- download DOCX / PDF ---------- */
  const handleDownload = async (fmt) => {
    if (!previewText) return;
    await saveUpdatedDescription(previewText);

    const endpoint =
      fmt === "docx"
        ? `${baseUrl}/jd_maker/get_docx_file`
        : `${baseUrl}/jd_maker/get_pdf_file`;

    try {
      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok) throw new Error(`Download ${fmt} failed`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Job_Description.${fmt}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    }
  };

  /* ---------- thumbs feedback ---------- */
  const sendFeedback = async (positive) => {
    try {
      const res = await fetch(`${baseUrl}/jd_maker/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback: positive, source: "jd_maker" }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "feedback_response.xlsx";
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
  };

  return (
    <>
      <MainHeader />
      <Sidebar/>
      <main className="flex flex-1 p-4 gap-6 pl-20">
        <JobForm
          formData={formData}
          setFormData={setFormData}
          disabled={loading}
          onGenerate={handleGenerate}
        />
        <Preview
          text={previewText}
          loading={loading}
          error={error}
          onDownload={handleDownload}      /* ← works now */
          feedbackVisible={feedbackVisible}
          onFeedback={sendFeedback}
        />
      </main>
    </>
  );
}


