
// import React, { useState } from 'react';
// import { v4 as uuidv4 } from 'uuid';
// import MainHeader from "../MainHeader";
// import Sidebar from "../Sidebar";
// import "./HrView.css";

// function HrView(){
//   const [activeTab, setActiveTab] = useState('upload');
//   const [CandidateCV, setCandidateCV] = useState(null);
//   const [CandidateJD, setCandidateJD ] = useState(null);
//   const [CandidateEmail,setCandidateEmail]=useState("");
//   const [isLinkGenerated, setIsLinkGenerated] = useState(false);
//   const [uuid, setUuid] = useState('');

//   const API_BASE = import.meta.env.VITE_TALENTAI_API_INTERVIEW_BASE_URL;

//   const handleJDChange = (e) => {
//     const file = e.target.files[0];
//     if (file && (file.type === 'application/pdf' || file.name.endsWith('.doc') || file.name.endsWith('.docx'))) {
//       setCandidateJD(file);
//       setIsLinkGenerated(false); // reset
//     } else {
//       alert('Only PDF or Word documents are allowed.');
//     }
//   };

//   const handleCVChange = (e) => {
//     const file = e.target.files[0];
//     if (file && (file.type === 'application/pdf' || file.name.endsWith('.doc') || file.name.endsWith('.docx'))) {
//       setCandidateCV(file);
//       setIsLinkGenerated(false); // reset
//     } else {
//       alert('Only PDF or Word documents are allowed.');
//     }
//   };

//   const handleEmailChange = (e) => {
//     setCandidateEmail(e.target.value);
//     setIsLinkGenerated(false); // reset
//   };

//   // Function to generate the UUID and send the CV, JD, UUID and email to the backend
//   const generateLink = async () => {
//     if(isLinkGenerated===true){
//       alert("Link has already been generated for the current candidate!")
//       return;
//     }
//     if (!CandidateCV || !CandidateJD || !CandidateEmail.trim()) {
//       alert("Please upload both CV and JD, and enter the candidate's email.");
//       return;
//     }

//     const id = uuidv4();
//     const formData = new FormData();
//     formData.append('jdPdf', CandidateJD);
//     formData.append('cvPdf', CandidateCV);
//     formData.append('UID', id);
//     formData.append('Email', CandidateEmail);

//     try {
//       // Documents needs to be uploaded here
//       const response = await fetch(`${API_BASE}/api/hr/upload-jd-cv`, {
//         method: 'POST',
//         body: formData,
//       });
//       // const response = {"ok":true}
//       if (!response.ok) {
//         throw new Error('Failed to upload documents');
//       }

//       setUuid(id);
      
//       setIsLinkGenerated(true); // ✅ disable button
//     } catch (error) {
//       console.error(error);
//       alert("Error uploading documents. Please try again.");
//     }
//   };


//   const handleCopy = (uuid) => {
//     // local
//     //const link = `http://localhost:5173/talentai/uuid/interview/${uuid}`;
//     // production =
//      const link = `https://genai.motherson.com/talentai/uuid/interview/${uuid}`;
//     navigator.clipboard.writeText(link).then(() => {
//       alert('Link copied to clipboard!');
//     }).catch((err) => {
//       console.error('Failed to copy:', err);
//     });
//   };

//   const candidates = [
//     {
//       name: 'Ravi Kumar',
//       email: 'ravi@example.com',
//       phone: '9876543210',
//       date: '2025-08-05',
//       status: 'Not Taken'
//     },
//     {
//       name: 'Anjali Sharma',
//       email: 'anjali@example.com',
//       phone: '9123456780',
//       date: '2025-08-04',
//       status: 'Taken'
//     }
//     // You can add more objects or load from API
//   ];

//     return (
//         <>
//         <MainHeader />
//         <Sidebar />
//         <div className="container">
//           <div className="tabs">
//             <button
//               className={activeTab === 'upload' ? 'tab active' : 'tab'}
//               onClick={() => setActiveTab('upload')}
//             >
//               SCHEDULE INTERVIEW
//             </button>
//             <button
//               className={activeTab === 'upcoming' ? 'tab active' : 'tab'}
//               onClick={() => setActiveTab('upcoming')}
//             >
//               CANDIDATE RESULTS
//             </button>
//           </div>

//           {activeTab === 'upload' && (
//             <div className="tab-content">
//               <div className="input-group">
//               <label>UPLOAD CV (PDF/DOCX):</label>
//               <input
//                 type="text"
//                 readOnly
//                 className="custom-file-input"
//                 value={CandidateCV ? CandidateCV.name : ''}
//                 placeholder="Click to upload candidate CV"
//                 onClick={() => document.getElementById('cv-upload').click()}
//               />
//               <input
//                 type="file"
//                 id="cv-upload"
//                 accept=".pdf,.doc,.docx"
//                 style={{ display: 'none' }}
//                 onChange={(e) => handleCVChange(e, setCandidateCV)}
//               />
//             </div>

//             <div className="input-group">
//               <label>UPLOAD JD (PDF/DOCX):</label>
//               <input
//                 type="text"
//                 readOnly
//                 className="custom-file-input"
//                 value={CandidateJD ? CandidateJD.name : ''}
//                 placeholder="Click to upload job description"
//                 onClick={() => document.getElementById('jd-upload').click()}
//               />
//               <input
//                 type="file"
//                 id="jd-upload"
//                 accept=".pdf,.doc,.docx"
//                 style={{ display: 'none' }}
//                 onChange={(e) => handleJDChange(e,setCandidateJD)}
//               />
//             </div>
//             <div className="input-group">
//               <label>Candidate Email:</label>
//               <input
//                 type="email"
//                 className="custom-file-input"
//                 value={CandidateEmail}
//                 placeholder="Click to upload job description"
//                 onChange={handleEmailChange}
//               />
//             </div>


//               <button
//                 className="generate-button"
//                 onClick={generateLink}
//               >
//                 Generate Candidate Interview Link
//               </button>

//               {uuid && (
//                 <div className="link-output">
//                   <p>Candidate Interview Link:</p>
//                   <div className="link-copy-wrapper">
//                     <input
//                       type="text"
//                       className="link"
//                       // local
//                       //value={`http://localhost:5173/talentai/uuid/interview/${uuid}`}
//                       // production
//                       value={`https://genai.motherson.com/talentai/uuid/interview/${uuid}`}
//                       readOnly
//                     />
//                     <button className="copy-button" onClick={() => handleCopy(uuid)}>
//                       Copy
//                     </button>
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           {activeTab === 'upcoming' && (
//             <div className="tab-content">
//               <h3 className="table-title">Invited Candidates</h3>
//               <table className="candidates-table">
//                 <thead>
//                   <tr>
//                     <th>#</th>
//                     <th>Name</th>
//                     <th>Email</th>
//                     <th>Phone</th>
//                     <th>Date Sent</th>
//                     <th>Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {candidates.map((candidate, index) => (
//                     <tr key={index}>
//                       <td>{index + 1}</td>
//                       <td>{candidate.name}</td>
//                       <td>{candidate.email}</td>
//                       <td>{candidate.phone}</td>
//                       <td>{candidate.date}</td>
//                       <td>{candidate.status}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//         </>
//     )
// }

// export default HrView;

// // Further we need to store the cv and jd into some storage, get its links and then send the URL, in the interview page
// // We will use the uuid to filter the interview, get the details and start the interview.




// NEW CODE PUSHHH








import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import MainHeader from "../MainHeader";
import Sidebar from "../Sidebar";
import "./HrView.css";

function HrView(){
  const [activeTab, setActiveTab] = useState('upload');
  const [CandidateCV, setCandidateCV] = useState(null);
  const [CandidateJD, setCandidateJD ] = useState(null);
  const [CandidateEmail,setCandidateEmail]=useState("");
  const [isLinkGenerated, setIsLinkGenerated] = useState(false);
  const [uuid, setUuid] = useState('');

  const API_BASE = import.meta.env.VITE_TALENTAI_API_INTERVIEW_BASE_URL;

  const handleJDChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.doc') || file.name.endsWith('.docx'))) {
      setCandidateJD(file);
      setIsLinkGenerated(false); // reset
    } else {
      alert('Only PDF or Word documents are allowed.');
    }
  };

  const handleCVChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.doc') || file.name.endsWith('.docx'))) {
      setCandidateCV(file);
      setIsLinkGenerated(false); // reset
    } else {
      alert('Only PDF or Word documents are allowed.');
    }
  };

  const handleEmailChange = (e) => {
    setCandidateEmail(e.target.value);
    setIsLinkGenerated(false); // reset
  };

  // Function to generate the UUID and send the CV, JD, UUID and email to the backend
  const generateLink = async () => {
    if(isLinkGenerated===true){
      alert("Link has already been generated for the current candidate!")
      return;
    }
    if (!CandidateCV || !CandidateJD || !CandidateEmail.trim()) {
      alert("Please upload both CV and JD, and enter the candidate's email.");
      return;
    }

    const id = uuidv4();
    const formData = new FormData();
    formData.append('jdPdf', CandidateJD);
    formData.append('cvPdf', CandidateCV);
    formData.append('UID', id);
    formData.append('Email', CandidateEmail);

    try {
      // Documents needs to be uploaded here
      const response = await fetch(`${API_BASE}/api/hr/upload-jd-cv`, {
        method: 'POST',
        body: formData,
      });
      // const response = {"ok":true}
      if (!response.ok) {
        throw new Error('Failed to upload documents');
      }

      setUuid(id);
      
      setIsLinkGenerated(true); // ✅ disable button
    } catch (error) {
      console.error(error);
      alert("Error uploading documents. Please try again.");
    }
  };


  const handleCopy = (uuid) => {
    // local
    const link = `http://localhost:5173/talentai/uuid/interview/${uuid}`;
    // production =
    // const link = `https://genai.motherson.com/talentai/uuid/interview/${uuid}`;
    navigator.clipboard.writeText(link).then(() => {
      alert('Link copied to clipboard!');
    }).catch((err) => {
      console.error('Failed to copy:', err);
    });
  };

  const candidates = [
    {
      name: 'Ravi Kumar',
      email: 'ravi@example.com',
      phone: '9876543210',
      date: '2025-08-05',
      status: 'Not Taken'
    },
    {
      name: 'Anjali Sharma',
      email: 'anjali@example.com',
      phone: '9123456780',
      date: '2025-08-04',
      status: 'Taken'
    }
    // You can add more objects or load from API
  ];

    return (
        <>
        <MainHeader />
        <Sidebar />
        <div className="hrview-container">
          <div className="tabs">
            <button
              className={activeTab === 'upload' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('upload')}
            >
              SCHEDULE INTERVIEW
            </button>
            <button
              className={activeTab === 'upcoming' ? 'tab active' : 'tab'}
              onClick={() => setActiveTab('upcoming')}
            >
              CANDIDATE RESULTS
            </button>
          </div>

          {activeTab === 'upload' && (
            <div className="tab-content">
              <div className="input-group">
              <label>UPLOAD CV (PDF/DOCX):</label>
              <input
                type="text"
                readOnly
                className="custom-file-input"
                value={CandidateCV ? CandidateCV.name : ''}
                placeholder="Click to upload candidate CV"
                onClick={() => document.getElementById('cv-upload').click()}
              />
              <input
                type="file"
                id="cv-upload"
                accept=".pdf,.doc,.docx"
                style={{ display: 'none' }}
                onChange={(e) => handleCVChange(e, setCandidateCV)}
              />
            </div>

            <div className="input-group">
              <label>UPLOAD JD (PDF/DOCX):</label>
              <input
                type="text"
                readOnly
                className="custom-file-input"
                value={CandidateJD ? CandidateJD.name : ''}
                placeholder="Click to upload job description"
                onClick={() => document.getElementById('jd-upload').click()}
              />
              <input
                type="file"
                id="jd-upload"
                accept=".pdf,.doc,.docx"
                style={{ display: 'none' }}
                onChange={(e) => handleJDChange(e,setCandidateJD)}
              />
            </div>
            <div className="input-group">
              <label>Candidate Email:</label>
              <input
                type="email"
                className="custom-file-input"
                value={CandidateEmail}
                placeholder="Click to upload job description"
                onChange={handleEmailChange}
              />
            </div>


              <button
                className="generate-button"
                onClick={generateLink}
              >
                Generate Candidate Interview Link
              </button>

              {uuid && (
                <div className="link-output">
                  <p>Candidate Interview Link:</p>
                  <div className="link-copy-wrapper">
                    <input
                      type="text"
                      className="link"
                      // local
                      value={`http://localhost:5173/talentai/uuid/interview/${uuid}`}
                      // production
                      //value={`https://genai.motherson.com/talentai/uuid/interview/${uuid}`}
                      readOnly
                    />
                    <button className="copy-button" onClick={() => handleCopy(uuid)}>
                      Copy
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upcoming' && (
            <div className="tab-content">
              <h3 className="table-title">Invited Candidates</h3>
              <table className="candidates-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Date Sent</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((candidate, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{candidate.name}</td>
                      <td>{candidate.email}</td>
                      <td>{candidate.phone}</td>
                      <td>{candidate.date}</td>
                      <td>{candidate.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </>
    )
}

export default HrView;

// Further we need to store the cv and jd into some storage, get its links and then send the URL, in the interview page
// We will use the uuid to filter the interview, get the details and start the interview.


