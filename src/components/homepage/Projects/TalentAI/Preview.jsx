// import html2pdf from "html2pdf.js";
// import logo from "../../assets/ms_logo.png";

// // export default function Preview({ formData }) {
// export default function Preview({ text = "", formData, loading, error, onDownload, feedbackVisible, onFeedback }) {
//   const downloadPDF = () => {
//     const element = document.getElementById("pdf-content");
//     html2pdf()
//       .set({
//         margin: 0,
//         filename: "job-description.pdf",
//         image: { type: "jpeg", quality: 0.98 },
//         html2canvas: { scale: 2, backgroundColor: "#ffffff" },
//         jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
//       })
//       .from(element)
//       .save();
//   };

//   return (
//     <div className="preview-jd flex-grow flex-shrink basis-1/2 overflow-y-auto p-4">
//       <div
//         className="preview-wrapper min-h-full shadow-card bg-white p-4 rounded text-black"
//         id="pdf-content"
//       >
//         <div className="static-content mb-4">
//           <div className="ms-logo-link flex items-end justify-between mb-2">
//             <img className="ms-logo w-24 h-auto" src={logo} alt="MTS Logo" />
//             <a
//               className="text-xs text-blue-600"
//               href="https://www.mothersontechnology.com/"
//               target="_blank"
//               rel="noopener noreferrer"
//             >
//               https://www.mothersontechnology.com/
//             </a>
//           </div>
//           <p className="text-sm">
//             Motherson Technology Services is the technology and industrial solution
//             division of Motherson Group, one of the world's leading auto components
//             manufacturers known for its diversified portfolio of auto ancillary
//             products and services.
//           </p>
//         </div>

//         <div className="jd-content text-sm space-y-2">
//           <p>
//             <strong>Company Details:</strong> {formData.companyDetails || "-"}
//           </p>
//           <p>
//             <strong>Company:</strong> {formData.companyParentName || "-"}
//           </p>
//           <p>
//             <strong>Job Title:</strong> {formData.jobTitle || "-"}
//           </p>
//           <p>
//             <strong>Employment Type:</strong> {formData.employmentType || "-"}
//           </p>
//           <p>
//             <strong>Business Unit:</strong> {formData.businessUnit || "-"}
//           </p>
//           <p>
//             <strong>Experience:</strong> {formData.experience || "-"}
//           </p>
//           <p>
//             <strong>Location:</strong> {formData.location || "-"}
//           </p>
//           <p>
//             <strong>Job Description:</strong> {formData.jobDescription || "-"}
//           </p>
//           <p>
//             <strong>Highest Qualifications:</strong> {formData.highestQualifications || "-"}
//           </p>
//           <p>
//             <strong>Preferred Skills:</strong> {formData.preferredSkills?.join(", ") || "-"}
//           </p>
//         </div>
//       </div>
//       <div className="mt-4">
//         <h2 className="text-lg font-medium">Generated Job Description</h2>
//         {loading && <p>Generating…</p>}
//         {error && <p className="text-red-600">{error}</p>}
//         {!loading && !error && (
//           <textarea
//             className="w-full h-64 p-2 border rounded resize-none"
//             value={text}
//             readOnly
//           />
//         )}
//       </div>


//       {/* DOWNLOAD BUTTONS */}
//        <div className="download-pdf flex justify-center mt-6 gap-4">
//         <button onClick={() => onDownload("docx")} disabled={!text} className="btn-primary">
//           Download DOCX
//         </button>
//         <button onClick={() => onDownload("pdf")} disabled={!text} className="btn-primary">
//           Download PDF
//         </button>
//          {feedbackVisible && (
//            <>
//             <button onClick={() => onFeedback(true)}>👍</button>
//            <button onClick={() => onFeedback(false)}>👎</button>
//            </>
//          )}
//        </div>
//      </div>
//    );
// }

// src/components/Preview.jsx
// src/components/Preview.jsx

// import { useRef, useEffect } from "react";
// import logo from "../../assets/ms_logo.png"; // <- your imported logo

// export default function Preview({
//   text = "",
//   loading,
//   error,
//   onDownload,
//   feedbackVisible,
//   onFeedback,
//   formData = {},
// }) {
//   const {
//     companyDetails = "Motherson Technology Services Limited (MTSL) is the dedicated technology arm of the Samvardhana Motherson Group, one of the world’s leading automotive component manufacturers. With a global presence in 41+ countries, MTSL delivers comprehensive IT and digital transformation services across 12 industry verticals, including automotive, manufacturing, healthcare, logistics, IT and more. We specialize in offering scalable technology solutions through our expertise in application services, infrastructure, cloud, cybersecurity, IoT, data analytics, and enterprise platforms. Headquartered in India – Noida , MTSL operates across key geographies including North America, Europe, Asia-Pacific, and the Middle East, enabling agile and responsive support for clients worldwide. As part of a globally trusted group ranked among the Fortune India 500, MTSL continues to drive innovation and operational excellence, empowering businesses to stay ahead in a rapidly evolving digital landscape.",
//     companyParentName = "Motherson Group",
//     companyName = "Motherson Technology Services Ltd.",
//   } = formData;

//   const editableRef = useRef(null);

//   useEffect(() => {
//     if (editableRef.current) {
//       editableRef.current.innerText = text;
//     }
//   }, [text]);

//   return (
//     <section className="flex flex-col flex-1 bg-gray-50 rounded p-4">
//       <h2 className="text-lg font-medium mb-2">Preview</h2>

//       {loading && <p>Generating…</p>}
//       {error && <p className="text-red-600">{error}</p>}

//       <div className="flex-1 border rounded p-4 bg-white mb-4 overflow-auto">
//         {/* Non-editable Header */}
//         <div className="items-center gap-4 mb-4">
//           <div className="msHeader flex justify-between items-center">
//             <div className="companyLogo">
//               <img src={logo} alt="Company Logo" className="h-24 w-auto" />
//             </div>
//             <div className="companyLinks flex flex-col">
//               <a className="text-sm underline" target="_blank" href="https://www.motherson.com/">{companyParentName}</a>
//               <a className="text-sm underline" target="_blank" href="https://www.mothersontechnology.com/">{companyName}</a>
//             </div>
//           </div>
//           <div className="ms-aboutUs">
//             <p>{companyDetails}</p>
//           </div>
//         </div>

//         {/* Editable JD content */}
//         <div
//           ref={editableRef}
//           contentEditable
//           className="whitespace-pre-wrap outline-none"
//           style={{ minHeight: "150px", fontFamily: "Poppins, sans-serif" }}
//           onInput={(e) => {
//             // Optional sync logic here
//           }}
//         />
//       </div>

//       <div className="flex gap-3">
//         <button
//           onClick={() => onDownload("pdf")}
//           disabled={!text}
//           className="bg-primary text-white px-4 py-2 rounded disabled:opacity-50"
//         >
//           Download&nbsp;PDF
//         </button>

//         {feedbackVisible && (
//           <>
//             <button onClick={() => onFeedback(true)}>👍</button>
//             <button onClick={() => onFeedback(false)}>👎</button>
//           </>
//         )}
//       </div>
//     </section>
//   );
// }

import { useRef, useEffect } from "react";
import logo from "./assets_talentAI/ms_logo.png";
import html2pdf from "html2pdf.js";

export default function Preview({
  text = "",
  loading,
  error,
  onDownload,
  feedbackVisible,
  onFeedback,
  formData = {},
}) {
  const {
    companyDetails = "Motherson Technology Services Limited (MTSL) is the dedicated technology arm of the Samvardhana Motherson Group, one of the world’s leading automotive component manufacturers. With a global presence in 41+ countries, MTSL delivers comprehensive IT and digital transformation services across 12 industry verticals, including automotive, manufacturing, healthcare, logistics, IT and more. We specialize in offering scalable technology solutions through our expertise in application services, infrastructure, cloud, cybersecurity, IoT, data analytics, and enterprise platforms. Headquartered in India – Noida , MTSL operates across key geographies including North America, Europe, Asia-Pacific, and the Middle East, enabling agile and responsive support for clients worldwide. As part of a globally trusted group ranked among the Fortune India 500, MTSL continues to drive innovation and operational excellence, empowering businesses to stay ahead in a rapidly evolving digital landscape.",
    companyParentName = "Motherson Group",
    companyName = "Motherson Technology Services Ltd.",
  } = formData;

  const editableRef = useRef(null);
  const pdfContentRef = useRef(null);

  useEffect(() => {
    if (editableRef.current) {
      editableRef.current.innerText = text;
    }
  }, [text]);

  const handleDownloadPDF = () => {
    const element = pdfContentRef.current;

    const opt = {
      margin: 0.5,
      filename: 'job_description.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true
      },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      pagebreak: {
        mode: ['css', 'legacy'], // 💡 Key part to prevent page-breaking mid-text
        // before: '.page-break', 
      }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <section className="flex flex-col flex-1 bg-gray-50 rounded p-4">
      <h2 className="text-lg font-medium mb-2">Preview</h2>

      {loading && <p>Generating…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {/* PDF content wrapper */}
      <div
        ref={pdfContentRef}
        className="flex-1 border rounded p-4 bg-white mb-4 overflow-auto"
        style={{
          fontFamily: 'Poppins, sans-serif',
          fontSize: '14px',
          lineHeight: '1.6',
          wordBreak: 'break-word',
          whiteSpace: 'normal',
          overflowWrap: 'break-word',
        }}
      >
        <div className="items-center gap-4 mb-4">
          <div className="msHeader flex justify-between items-center">
            <div className="companyLogo">
              <img src={logo} alt="Company Logo" className="h-24 w-auto" />
            </div>
            <div className="companyLinks flex flex-col">
              <a className="text-sm underline" target="_blank" href="https://www.motherson.com/">{companyParentName}</a>
              <a className="text-sm underline" target="_blank" href="https://www.mothersontechnology.com/">{companyName}</a>
            </div>
          </div>
          <div className="ms-aboutUs mt-4">
            <p>{companyDetails}</p>
          </div>
        </div>

        {/* Editable JD content */}
        <div
          ref={editableRef}
          contentEditable
          className="outline-none whitespace-pre-line"
          style={{
            minHeight: "150px",
            fontFamily: "Poppins, sans-serif",
            lineHeight: "1.6", // smoother line spacing
            wordBreak: "break-word",
          }}
        />

      </div>

      <div className="flex gap-3">
        <button
          onClick={handleDownloadPDF}
          disabled={!text}
          className="bg-[#DA2129] text-white px-4 py-2 rounded disabled:opacity-50"
        >
          Download&nbsp;PDF
        </button>

        {/* {feedbackVisible && (
          <>
            <button onClick={() => onFeedback(true)}>👍</button>
            <button onClick={() => onFeedback(false)}>👎</button>
          </>
        )} */}
      </div>
    </section>
  );
}




