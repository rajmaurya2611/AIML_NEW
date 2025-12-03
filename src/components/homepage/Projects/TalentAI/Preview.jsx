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
import { jsPDF } from "jspdf";

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
    companyDetails = "Motherson Technology Services Limited (MTSL) is the dedicated technology arm of the Samvardhana Motherson Group, one of the world’s leading automotive component manufacturers. With a global presence in 41+ countries, MTSL delivers comprehensive IT and digital transformation services across 12 industry verticals, including automotive, manufacturing, healthcare, logistics, IT and more.",
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
  
  // This one is old function to download pdf, can be removed if not wanted 
  // const handleDownloadPDF = () => {
  //   const element = pdfContentRef.current;

  //   const opt = {
  //     margin: 0.5,
  //     filename: 'job_description.pdf',
  //     image: { type: 'jpeg', quality: 0.98 },
  //     html2canvas: {
  //       scale: 2,
  //       useCORS: true
  //     },
  //     jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
  //     pagebreak: {
  //       mode: ['css', 'legacy'], // 💡 Key part to prevent page-breaking mid-text
  //       // before: '.page-break', 
  //     }
  //   };

  //   html2pdf().set(opt).from(element).save();
  // };


  // const handleDownloadPDF = () => {
  //   const element = pdfContentRef.current;
  //   if (!element) return;

  //   const printWindow = window.open('', '_blank');

  //   // Get all stylesheets and inline them
  //   const styles = Array.from(document.styleSheets)
  //     .map(styleSheet => {
  //       try {
  //         return Array.from(styleSheet.cssRules)
  //           .map(rule => rule.cssText)
  //           .join('\n');
  //       } catch (e) {
  //         // External stylesheet, likely CORS restricted
  //         return '';
  //       }
  //     })
  //     .join('\n');

  //   // Inline your custom styles as fallback
  //   const fallbackStyles = `
  //     body {
  //       font-family: 'Poppins', sans-serif;
  //       font-size: 12pt;
  //       line-height: 1.6;
  //       padding: 40px;
  //     }
  //     img {
  //       max-width: 100%;
  //       height: auto;
  //     }
  //   `;

  // // Clone HTML content
  //   const contentHTML = element.outerHTML;

  //   printWindow.document.write(`
  //     <html>
  //       <head>
  //         <title>Job Description</title>
  //         <style>
  //           ${fallbackStyles}
  //           ${styles}
  //         </style>
  //       </head>
  //       <body onload="window.print(); window.close();">
  //         ${contentHTML}
  //       </body>
  //     </html>
  //   `);

  //   printWindow.document.close();
  // };


// const handleDownloadPDF = () => {
//   const element = pdfContentRef.current;
//   if (!element) return;

//   const doc = new jsPDF({
//     unit: 'pt',
//     format: 'a4',
//     orientation: 'portrait'
//   });

//   doc.html(element, {
//     callback: function (doc) {
//       doc.save("job_description.pdf");
//     },
//     x: 40,
//     y: 40,
//     width: 515,
//     autoPaging: 'text',
//     html2canvas: {
//       scale: 0.8,         // ↓ Reduce scale to speed up rendering
//       useCORS: true,
//       allowTaint: false,
//       logging: false,     // Disable console logs from html2canvas
//       backgroundColor: "#ffffff" // Force solid background if transparency is used
//     },
//     windowWidth: element.scrollWidth // Matches actual element width
//   });
// };


// Downloading the PDF starts from here 
const handleDownloadPDF = () => {
  const element = pdfContentRef.current;
  if (!element) return;

  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
    orientation: 'portrait'
  });

  const marginLeft = 20;
  const marginTop = 5;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - 2 * marginLeft;
  let cursorY = marginTop;

  // Attempt to include logo if present
  const logoImgEl = element.querySelector("img");
  if (logoImgEl && logoImgEl.src) {
    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous"; // ensure CORS
    logoImg.src = logoImgEl.src;

    logoImg.onload = () => {
      const originalWidth = logoImgEl.naturalWidth || logoImg.width;
      const originalHeight = logoImgEl.naturalHeight || logoImg.height;

      const maxWidth = 150; // limit to avoid oversized logos
      const scaleFactor = originalWidth > maxWidth ? maxWidth / originalWidth : 1;

      const displayWidth = originalWidth * scaleFactor;
      const displayHeight = originalHeight * scaleFactor;

      doc.addImage(logoImg, 'PNG', marginLeft, cursorY, displayWidth, displayHeight);
      cursorY += displayHeight + 10;

      renderRemainingContent();
    };
  } else {
    renderRemainingContent();
  }

  function renderRemainingContent() {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    // const allNodes = Array.from(element.childNodes);
    // const logoImgEl = element.querySelector("img");

    const pageWidth = doc.internal.pageSize.getWidth();
    const linkMarginRight = 40;
    const usableWidth = pageWidth - 2 * marginLeft;
    const linkFontSize = 10;

    let cursorY = marginTop + 70;

    // Step 1 draw the links
    drawTopLinks();

    // Step 2: Render top-right links
    function drawTopLinks() {
      const links = element.querySelectorAll("a");
      const topLinks = Array.from(links).slice(0, 2); // first two links only

      let linkY = cursorY;

      doc.setFontSize(linkFontSize);
      doc.setTextColor(36, 35, 33);

      topLinks.forEach(link => {
        const text = link.textContent.trim();
        const href = link.getAttribute("href");
        if (text && href) {
          const textWidth = doc.getTextWidth(text);
          const x = pageWidth - linkMarginRight - textWidth;
          doc.textWithLink(text, x, linkY, { url: href });

          // Optional underline
          doc.setLineWidth(0.5);
          doc.line(x, linkY + 1.5, x + textWidth, linkY + 1.5);
          linkY += 14;
        }
      });

      doc.setTextColor(36, 35, 33); // reset
      cursorY += 20; // move below logo + spacing
      renderMainContent();
    }

    // Step 3: Render rest of the content (excluding logo and top links)
    function renderMainContent() {
      const nodes = Array.from(element.childNodes);

      nodes.forEach(node => renderNode(node));
      doc.save("job_description.pdf");
    }

    // Step 4: Recursive renderer
    function renderNode(node) {
      if (cursorY > pageHeight-30) {
        doc.addPage();
        cursorY = marginTop;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) {
          const lines = doc.splitTextToSize(text, usableWidth);
          lines.forEach(line => {
            doc.text(line, marginLeft, cursorY);
            cursorY += 12;
          });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase();

        // Skip logo and top links
        if (
          (tag === 'a' && element.querySelectorAll("a").length > 0 &&
          Array.from(element.querySelectorAll("a")).slice(0, 2).includes(node))
        ) {
          return; // skip these nodes
        }

        switch (tag) {
          case 'a':
            const href = node.getAttribute("href");
            const text = node.textContent.trim();
            if (text && href) {
              doc.setTextColor(0, 0, 255);
              doc.textWithLink(text, marginLeft, cursorY, { url: href });
              doc.setLineWidth(0.5);
              const w = doc.getTextWidth(text);
              doc.line(marginLeft, cursorY + 1.5, marginLeft + w, cursorY + 1.5);
              doc.setTextColor(36, 35, 33); // reset
              cursorY += 14;
            }
            break;
          case 'br':
            cursorY += 9;
            break;
          case 'p':
          case 'div':
            Array.from(node.childNodes).forEach(renderNode);
            cursorY += 8;
            break;
          default:
            Array.from(node.childNodes).forEach(renderNode);
            break;
        }
      }
    }
  }


};
// Downloading the PDF ends here 


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
          fontSize: '12px',
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




