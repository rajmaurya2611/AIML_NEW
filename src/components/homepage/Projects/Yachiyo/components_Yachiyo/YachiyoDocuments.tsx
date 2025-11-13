import { useRef,useState } from "react";
import Pdf_Icon from "../assests_Yachiyo/Pdf_Icon.svg"
import Docs_Icon from "../assests_Yachiyo/Docs_Icon.svg"
import Folder_Icon from "../assests_Yachiyo/Folder_Icon.svg"
import DocumentDelete_Icon from "../assests_Yachiyo/DocumentDelete_Icon.svg"
import Preview_Icon from "../assests_Yachiyo/Preview_Icon.svg"

function YachiyoDocuments(): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    
  const [isDragging, setIsDragging] = useState<boolean>(false);

     const handleDelete = (index: number) => {
      const confirmed = window.confirm("Are you sure you want to delete this file?");
      if (!confirmed) return;
    
      const updated = [...uploadedFiles];
      updated.splice(index, 1);
      setUploadedFiles(updated);
    };

//   const handlePreview = (file) => {
//   const fileURL = URL.createObjectURL(file);
//   window.open(fileURL, "_blank");
// };

    const handlePreview = (file: File) => {
  const type = file.type || "";
  const fileURL = URL.createObjectURL(file);

  if (type === "application/pdf") {
    window.open(fileURL, "_blank");
  } else if (
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    type === "application/msword"
  ) {
    const shouldDownload = window.confirm(
      "Preview not supported for Word documents. Would you like to download it instead?"
    );
    if (shouldDownload) {
      const link = document.createElement("a");
      link.href = fileURL;
      link.download = file.name;
      link.click();
    }
  } else {
    alert("Unsupported file type.");
  }
};

   const handleBrowseClick = () => {
    fileInputRef.current?.click(); 
  };

 const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const selectedFiles = event.target?.files;

  // Step 1: Safety check
  if (!selectedFiles || selectedFiles.length === 0) {
    console.warn("No files selected or file input not found.");
    return;
  }

  // Step 2: Convert FileList to Array safely
  const fileArray = Array.from(selectedFiles).filter((f) => f instanceof File);

  // Step 3: Validate file type using both MIME and extension
  const validFiles = fileArray.filter((file) => {
    try {
      const type = file.type || "";
      const name = file.name?.toLowerCase() || "";

      return (
        type === "application/pdf" ||
        type === "application/msword" || // ✅ for .doc
        type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || // ✅ for .docx
        name.endsWith(".pdf") ||
        name.endsWith(".doc") ||
        name.endsWith(".docx")
      );
    } catch (error) {
      console.error("Error processing file:", error);
      return false;
    }
  });

  if (validFiles.length === 0) {
    alert("Please select valid PDF, DOC, or DOCX files.");
    event.target.value = "";
    return;
  }

  // ✅ Step 4: Check for duplicates
  const duplicates = validFiles.filter((newFile) =>
    uploadedFiles.some(
      (existing) =>
        existing.name === newFile.name && existing.size === newFile.size
    )
  );

  if (duplicates.length > 0) {
    alert(
      `The following file(s) have already been uploaded:\n\n${duplicates
        .map((f) => "• " + f.name)
        .join("\n")}`
    );
  }

  // ✅ Step 5: Add only non-duplicate files
  const uniqueNewFiles = validFiles.filter(
    (newFile) =>
      !uploadedFiles.some(
        (existing) =>
          existing.name === newFile.name && existing.size === newFile.size
      )
  );

  if (uniqueNewFiles.length > 0) {
    setUploadedFiles((prevFiles) => [...prevFiles, ...uniqueNewFiles]);
  }

  // Step 6: Reset the input
  if (event.target) event.target.value = "";
};

     const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(true);
    };

    const handleDragLeave = () => {
      setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(e.dataTransfer.files).filter(
        (f) => f instanceof File
      ) as File[];

      const validFiles = droppedFiles.filter((file) => {
        const type = file.type || "";
        const name = file.name?.toLowerCase() || "";
        return (
          type === "application/pdf" ||
          type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          name.endsWith(".pdf") ||
          name.endsWith(".docx") ||
          name.endsWith(".doc")
        );
      });

      if (validFiles.length > 0) {
        setUploadedFiles((prevFiles) => [...prevFiles, ...validFiles]);
      }
    };





  return (
    <div className="w-100% h-[700px] py-8  mx-[80px]  ">
      <h1 className="h-38 w-581 text-[32px] font-medium">Upload Documents</h1>
      <p className="text-gray-600 h-12 w-581 text-[20px] font-normal">
        Upload your documents for AI-powered analysis and insights.
      </p>

       {/* Upload box with drag & drop */}
      <div
        className={`border-2 border-dashed rounded-xl h-auto p-12 text-center transition-colors ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="relative w-[40px] h-[40px] mx-auto">
          <img
            src={Pdf_Icon}
            alt="PDF"
            className="absolute left-0 top-0 w-[40px] h-[40px] rotate-[-15deg]"
          />
          <img
            src={Docs_Icon}
            alt="DOCX"
            className="absolute left-[20px] w-[40px] h-[40px] rotate-[15deg]"
          />
        </div>

        <p className="text-gray-700">Drag & drop files here</p>


        <div className="flex items-center my-4 justify-center">
          <div className="w-24 border-t border-gray-300"></div>
          <p className="text-gray-500 mx-3">OR</p>
          <div className="w-24 border-t border-gray-300"></div>
        </div>
        {/* <p className="text-gray-500 mt-2">or</p> */}

        <button
          className="mt-4 bg-red-500 text-white px-8 py-2 rounded-lg"
          onClick={handleBrowseClick}
        >
          Browse files
        </button>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.docx,doc"
          multiple
          onChange={handleFileChange}
        />
      </div>

        <p className="text-gray-400 text-xs mt-2 text-left">
          Supported: <span className="font-medium text-gray-600">PDF, DOCX ,DOC</span> • Up to 200MB/file
        </p>
      

      {/* Uploaded files section */}
        <div
    className="border border-gray-50 rounded-lg p-3 bg-gray-10 overflow-y-auto"
    style={{ maxHeight: 160 }}
  >
    <h3 className="text-gray-800 font-semibold mb-2">Uploaded Files</h3>

    {uploadedFiles.length === 0 ? (
      <div className="flex flex-col items-center justify-center border border-dashed border-gray-300 rounded-lg py-6">
        <img
          src={Folder_Icon}
          alt="Uploaded Folder"
          className="mx-auto w-8 h-8 opacity-70"
        />
        <p className="text-gray-400 text-sm mt-1">No files uploaded</p>
      </div>
    ) : (
      <ul className="space-y-2">
        {uploadedFiles.map((file, index) => (
          <li
            key={index}
            className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-100"
          >
            <div className="flex items-center gap-2">
              <img
                src={
                  file.type === "application/pdf"
                    ? Pdf_Icon
                    : Docs_Icon
                }
                alt="file icon"
                className={`w-6 h-6 ${
                     file.type === "application/pdf" ? "rotate-[15deg]" : "rotate-[-15deg]"
                      }`}
              />
              <div className="flex flex-col">
                <span className="text-sm text-gray-700 font-medium truncate w-[200px]">
                  {file.name}
                </span>
                <span className="text-xs text-gray-400">
                  {(file.size / 1024).toFixed(2)} KB
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
               <img
                  src={Preview_Icon}
                  alt="Preview"
                  className="w-5 h-5 cursor-pointer opacity-70 hover:opacity-100"
                  onClick={() => handlePreview(file)}
                />
              <img
                src={DocumentDelete_Icon}
                alt="Delete"
                className="w-5 h-5 cursor-pointer opacity-70 hover:opacity-100"
                onClick={() => handleDelete(index)}
              />
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>


    </div>
  );
}

export default YachiyoDocuments;