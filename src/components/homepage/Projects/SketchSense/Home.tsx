import React, { useRef, useState, type ChangeEvent } from "react";
import { motion } from "framer-motion";
import logo from "./assets_sketchsense/Logo.png";
import api from "./lib_sketchsense/axios";

function Home(): React.ReactElement {
  const fileInput1Ref = useRef<HTMLInputElement | null>(null);
  const fileInput2Ref = useRef<HTMLInputElement | null>(null);

  const [uploadProgress1, setUploadProgress1] = useState<number>(0);
  const [uploadProgress2, setUploadProgress2] = useState<number>(0);
  const [uploadSuccess1, setUploadSuccess1] = useState<boolean>(false);
  const [uploadSuccess2, setUploadSuccess2] = useState<boolean>(false);
  const [fileName1, setFileName1] = useState<string>("");
  const [fileName2, setFileName2] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [comparisonResult, setComparisonResult] = useState<string>("");
  const [comparisonResultOld, setComparisonResultOld] = useState<string>("");
  const [comparisonResultNew, setComparisonResultNew] = useState<string>("");

  const handleClickFileInput = (
    inputRef: React.RefObject<HTMLInputElement | null>
  ) => {
    inputRef.current?.click();
  };

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>,
    setUploadProgress: React.Dispatch<React.SetStateAction<number>>,
    setUploadSuccess: React.Dispatch<React.SetStateAction<boolean>>,
    setFileName: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setUploadSuccess(false);
      setUploadProgress(0);

      const interval = setInterval(() => {
        setUploadProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(interval);
            setUploadSuccess(true);
            return 100;
          }
          return prevProgress + 10;
        });
      }, 200);
    }
  };

  const handleRemoveFile = (
    setFileName: React.Dispatch<React.SetStateAction<string>>,
    setUploadSuccess: React.Dispatch<React.SetStateAction<boolean>>,
    setUploadProgress: React.Dispatch<React.SetStateAction<number>>
  ) => {
    setFileName("");
    setUploadSuccess(false);
    setUploadProgress(0);
  };

  const handleCompare = async () => {
    if (
      !fileName1 ||
      !fileName2 ||
      !fileInput1Ref.current?.files?.[0] ||
      !fileInput2Ref.current?.files?.[0]
    ) {
      alert("Both files must be uploaded");
      return;
    }

    console.log("Sending files to the backend...");

    const formData = new FormData();
    formData.append("file1", fileInput1Ref.current.files[0]);
    formData.append("file2", fileInput2Ref.current.files[0]);

    setIsProcessing(true);

    try {
      const response = await api.post("/compare", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = response.data;
      console.log("Files compared successfully:", data);
      alert("Files compared successfully!");
      setComparisonResult(data.download_url);
      setComparisonResultOld(data.download_url_old);
      setComparisonResultNew(data.download_url_new);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || "Error comparing files.";
      console.error("Error comparing files:", errorMsg);
      alert(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <img src={logo} className="absolute top-0 left-0 p-2 w-1/6" alt="Logo" />
      <div className="h-screen flex flex-col items-center bg-[#212121] justify-center px-4">
        <h1 className="md:text-5xl pb-12 pt-8 font-extrabold text-white font-rubik relative z-20 text-center">
          Compare Using{" "}
          <span className="bg-clip-text md:text-6xl text-transparent bg-gradient-to-r from-pink-500 to-violet-500 font-rubik">
            SketchSense
          </span>
        </h1>

        <div className="flex justify-between gap-12 mt-10 w-full max-w-4xl">
          {/* File Upload Area 1 */}
          <motion.div
            initial={{ x: "-10vw", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{
              duration: 1,
              type: "easeOut",
              stiffness: 30,
              damping: 20,
            }}
            className="w-full sm:w-1/2 h-60 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer bg-[#FBF5E5] hover:bg-[#FCE7C8] rounded-xl transition-all"
            onDrop={(e) => e.preventDefault()}
            onDragOver={(e) => e.preventDefault()}
          >
            <p className="text-gray-500 text-lg">Drag and Drop File 1</p>
            <button
              onClick={() => handleClickFileInput(fileInput1Ref)}
              className="mt-4 bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-all"
            >
              Upload File 1
            </button>
            <input
              type="file"
              ref={fileInput1Ref}
              className="hidden"
              onChange={(e) =>
                handleFileChange(
                  e,
                  setUploadProgress1,
                  setUploadSuccess1,
                  setFileName1
                )
              }
            />
            {uploadProgress1 > 0 && uploadProgress1 < 100 && (
              <div className="mt-4 w-3/4 bg-gray-200 rounded-full h-2.5">
                <div
                  style={{ width: `${uploadProgress1}%` }}
                  className="bg-blue-500 h-2.5 rounded-full transition-all"
                ></div>
              </div>
            )}
            {uploadSuccess1 && (
              <>
                <p className="text-green-600 mt-2">
                  File 1 uploaded successfully!
                </p>
                <div className="flex items-center mt-1 space-x-2">
                  <span className="text-gray-700">{fileName1}</span>
                  <button
                    onClick={() =>
                      handleRemoveFile(
                        setFileName1,
                        setUploadSuccess1,
                        setUploadProgress1
                      )
                    }
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              </>
            )}
          </motion.div>

          {/* File Upload Area 2 */}
          <motion.div
            initial={{ x: "10vw", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{
              duration: 1,
              type: "easeInOut",
              stiffness: 30,
              damping: 20,
            }}
            className="w-full sm:w-1/2 h-60 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer bg-[#FBF5E5] hover:bg-[#FCE7C8] rounded-xl transition-all"
            onDrop={(e) => e.preventDefault()}
            onDragOver={(e) => e.preventDefault()}
          >
            <p className="text-gray-500 text-lg">Drag and Drop File 2</p>
            <button
              onClick={() => handleClickFileInput(fileInput2Ref)}
              className="mt-4 bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-all"
            >
              Upload File 2
            </button>
            <input
              type="file"
              ref={fileInput2Ref}
              className="hidden"
              onChange={(e) =>
                handleFileChange(
                  e,
                  setUploadProgress2,
                  setUploadSuccess2,
                  setFileName2
                )
              }
            />
            {uploadProgress2 > 0 && uploadProgress2 < 100 && (
              <div className="mt-4 w-3/4 bg-gray-200 rounded-full h-2.5">
                <div
                  style={{ width: `${uploadProgress2}%` }}
                  className="bg-blue-500 h-2.5 rounded-full transition-all"
                ></div>
              </div>
            )}
            {uploadSuccess2 && (
              <>
                <p className="text-green-600 mt-2">
                  File 2 uploaded successfully!
                </p>
                <div className="flex items-center mt-1 space-x-2">
                  <span className="text-gray-700">{fileName2}</span>
                  <button
                    onClick={() =>
                      handleRemoveFile(
                        setFileName2,
                        setUploadSuccess2,
                        setUploadProgress2
                      )
                    }
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Compare Button */}
        <button
          onClick={handleCompare}
          disabled={isProcessing}
          className="mt-8 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-all"
        >
          {isProcessing ? "Processing..." : "Compare"}
        </button>

        {/* Download Links */}
        {comparisonResult && (
          <div className="mt-4 flex space-x-4">
            <a
              href={comparisonResultOld}
              className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-all"
              download="comparison-old.pdf"
            >
              Download Old
            </a>
            <a
              href={comparisonResult}
              className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-all"
              download="comparison.pdf"
            >
              Download Comparison
            </a>
            <a
              href={comparisonResultNew}
              className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-all"
              download="comparison-new.pdf"
            >
              Download New
            </a>
          </div>
        )}
      </div>
    </>
  );
}

export default Home;
