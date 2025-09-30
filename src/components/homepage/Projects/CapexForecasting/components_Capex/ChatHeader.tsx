import React, { useState, useEffect, useRef } from 'react';
import Logo from '../assets_Capex/logo.png';
import { Upload, MoreVertical, Files, Eye, Download } from "lucide-react";
import { useToast } from '../hooks_Capex/use-toast';
import { motion, AnimatePresence } from "framer-motion";

const ChatHeader: React.FC = () => {
  const { toast } = useToast();

  // Store uploaded filenames separately for BET and BP
  const [uploadedBETFile, setUploadedBETFile] = useState<string | null>(null);
  const [uploadedBPFile, setUploadedBPFile] = useState<string | null>(null);

  // State to show/hide filename tooltip or panel for BET and BP
  const [showBetFileName, setShowBetFileName] = useState(false);
  const [showBpFileName, setShowBpFileName] = useState(false);

  const [ellipsisOpen, setEllipsisOpen] = useState(false);
  const ellipsisRef = useRef<HTMLDivElement>(null);

  const [showFilesPopup, setShowFilesPopup] = useState(false);
  const [filesData, setFilesData] = useState<string[]>([]);

  // New state for managing selected files
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);

  const [showMppUploadPopup, setShowMppUploadPopup] = useState(false);
  const [mppFile, setMppFile] = useState<File | null>(null);
  const [mppUploading, setMppUploading] = useState(false);

  const handleOpenMppViewer = () => {
    // set your default MPP table name here or via env
    const table = (import.meta as any).env?.VITE_MPP_TABLE ?? "invesment_simple";
    const base = (import.meta as any).env?.BASE_URL ?? "/";
    const normalized = base.endsWith("/") ? base.slice(0, -1) : base;
    const url = `${normalized}/capex-forecasting/data-viewer?table=${encodeURIComponent(table)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setEllipsisOpen(false);
  };

  // Handle checkbox changes
  const handleFileSelection = (fileName: string, isChecked: boolean) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(fileName);
      } else {
        newSet.delete(fileName);
      }
      return newSet;
    });
  };

  // Handle select all checkbox
  const handleSelectAll = (isChecked: boolean) => {
    if (isChecked) {
      setSelectedFiles(new Set(filesData));
    } else {
      setSelectedFiles(new Set());
    }
  };

  // Download selected files
  const handleDownloadFiles = async () => {
    if (selectedFiles.size === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one file to download.",
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_CAPEX_BASE_URL}/filedownload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: Array.from(selectedFiles)
        })
      });

      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Set filename based on response headers or default
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = 'download.zip';
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      } else if (selectedFiles.size === 1) {
        // If single file, use the original filename
        fileName = Array.from(selectedFiles)[0];
      }
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `Successfully downloaded ${selectedFiles.size} file${selectedFiles.size > 1 ? 's' : ''}.`,
        variant: "default",
      });

      // Close popup and reset selections
      setShowFilesPopup(false);
      setSelectedFiles(new Set());

    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download selected files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle cancel button
  const handleCancelFilesPopup = () => {
    setShowFilesPopup(false);
    setSelectedFiles(new Set());
  };

  // Handle upload button clicks and hit respective APIs
  const handleUpload = async (fileType: "BET" | "BP") => {
    try {
      // Create an input element to select a file
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = ".xlsx,.xls,.csv";

      input.onchange = async () => {
        if (input.files && input.files.length > 0) {
          const file = input.files[0];
          const formData = new FormData();
          formData.append('file', file);

          let uploadUrl = "";
          if (fileType === "BET") uploadUrl = `${import.meta.env.VITE_CAPEX_BASE_URL}/upload_bet`;
          else if (fileType === "BP") uploadUrl = `${import.meta.env.VITE_CAPEX_BASE_URL}/upload_bp`;

          try {
            const res = await fetch(uploadUrl, {
              method: "POST",
              body: formData,
            });

            if (!res.ok) throw new Error(`Upload failed with status ${res.status}`);

            toast({
              title: "Success",
              description: `Successfully uploaded ${fileType} file`,
              variant: "default",
            });

            if (fileType === "BET") {
              setUploadedBETFile(file.name);
              setShowBetFileName(false);
            } else {
              setUploadedBPFile(file.name);
              setShowBpFileName(false);
            }
          } catch (uploadError: any) {
            console.error(`${fileType} upload error:`, uploadError);

            if (
              uploadError.message.includes("Failed to fetch") ||
              uploadError.message.includes("NetworkError") ||
              uploadError.message.includes("ERR_CONNECTION_REFUSED")
            ) {
              toast({
                title: "Network Error",
                description: `Could not reach server for ${fileType} file upload.`,
                variant: "destructive",
              });
            } else {
              toast({
                title: "Error",
                description: `Failed to upload ${fileType} file.`,
                variant: "destructive",
              });
            }
          }
        }
      };

      input.click();
    } catch (error) {
      console.error(`${fileType} upload error outer:`, error);
      toast({
        title: "Error",
        description: `Failed to upload ${fileType} file.`,
        variant: "destructive",
      });
    }
  };

  // Animations for the filename tooltip/panel
  const tooltipVariants = {
    hidden: { opacity: 0, y: -8 },
    visible: { opacity: 1, y: 0 }
  };

  const filenameDisplay = (fileName: string | null, show: boolean, toggle: () => void) => {
    if (!fileName) return null;
    return (
      <div className="relative flex items-center ml-2">
        <button
          className="text-gray-600 cursor-pointer select-none"
          onClick={toggle}
          aria-label={`Toggle file name tooltip for ${fileName}`}
          title={fileName}
        >
          <motion.span
            whileHover={{ scale: 1.2, color: "#DA2128" }}
            className="font-mono select-text"
          >
            <MoreVertical className="w-5 h-5 text-gray-600" />
          </motion.span>
        </button>
        <AnimatePresence>
          {show && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={tooltipVariants}
              className="absolute top-full top-[30px] right-0 mt-1 bg-gray-100 border border-gray-300 text-sm rounded px-2 py-1 whitespace-nowrap shadow-lg z-10"
            >
              {fileName}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        ellipsisRef.current &&
        !ellipsisRef.current.contains(event.target as Node)
      ) {
        setEllipsisOpen(false);
      }
    }
    if (ellipsisOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [ellipsisOpen]);

  // Dropdown menu component
  const ellipsisMenu = (
    <AnimatePresence>
      {ellipsisOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="absolute right-[15px] top-[40px] mt-2 w-56 bg-white rounded-lg shadow-lg border z-50"
        >
          <button
            className="w-full flex items-center text-left text-xs gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={async () => {
              try {
                const res = await fetch(`${import.meta.env.VITE_CAPEX_BASE_URL}/list_data_files`, { method: "GET" });
                const data = await res.json();
                setFilesData(data.files);
              } catch (err) {
                setFilesData(["Error fetching files"]);
              }

              setShowFilesPopup(true);
              setSelectedFiles(new Set()); // Reset selections when opening popup
              setEllipsisOpen(false);
            }}
          >
            <Files className="w-3 h-3 text-red-600" />
            Show all files
          </button>

          <button
            className="w-full flex items-center text-left text-xs gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={handleOpenMppViewer}
          >
            <Eye className="w-3 h-3 text-red-600" />
            View / Edit MPP data
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <header className="w-full pt-4 pb-3 px-4 sm:px-6">
      <div className="flex items-center justify-between">
        <div className='capex-img flex items-center flex-col'>
          <img src={Logo} alt="Logo" className="h-10" />
          <span className="text-xs capex-logo-text ml-1 font-sans font-bold">CAPEX Forecasting</span>
        </div>
        <div className="product-logo flex items-center gap-2">
          {/* Placeholder for other icons */}
        </div>
        <div className="upload flex items-center gap-4">
          {/* Upload BET File button */}
          <div className="flex items-center">
            <button
              onClick={() => handleUpload("BET")}
              className='flex items-center gap-2 px-4 py-2 rounded-lg shadow-md text-xs border border-gray-100 hover:border-[#DA2128] transition-colors duration-300'
            >
              <Upload className='w-4 h-4 text-[#DA2128]' />
              <span className='text-[#727272]'>Upload BET File</span>
            </button>
            {filenameDisplay(uploadedBETFile, showBetFileName, () => setShowBetFileName(!showBetFileName))}
          </div>

          {/* Upload BP File button */}
          <div className="flex items-center">
            <button
              onClick={() => handleUpload("BP")}
              className='flex items-center gap-2 px-4 py-2 rounded-lg shadow-md text-xs border border-gray-100 hover:border-[#DA2128] transition-colors duration-300'
            >
              <Upload className='w-4 h-4 text-[#DA2128]' />
              <span className='text-[#727272]'>Upload BP File</span>
            </button>
            {filenameDisplay(uploadedBPFile, showBpFileName, () => setShowBpFileName(!showBpFileName))}
          </div>
          <div ref={ellipsisRef} className="relative flex items-center">
            <button
              onClick={() => setEllipsisOpen((v) => !v)}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Show actions"
            >
              <MoreVertical className="w-6 h-6 text-gray-700" />
            </button>
            {ellipsisMenu}
          </div>
        </div>
      </div>

      {/* Files Popup with Checkboxes */}
      <AnimatePresence>
        {showFilesPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30"
          >
            <div className="bg-white rounded-lg shadow-xl p-6 min-w-[600px] max-w-[95vw] max-h-[650px] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-base font-semibold text-[#da2128]">Uploaded Files</h2>
                <button
                  onClick={handleCancelFilesPopup}
                  className="text-gray-400 hover:text-gray-700"
                  aria-label="Close"
                >
                  &#x2715;
                </button>
              </div>

              {filesData.length > 0 && (
                <div className="mb-4 pb-2 border-b border-gray-200">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedFiles.size === filesData.length && filesData.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-[#da2128] border-gray-300 rounded focus:ring-[#da2128] focus:ring-2"
                    />
                    Select All ({selectedFiles.size} of {filesData.length} selected)
                  </label>
                </div>
              )}

              <div className="flex-1 overflow-auto mb-4">
                <div className="space-y-2">
                  {filesData.map((fname, idx) => (
                    <label key={idx} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(fname)}
                        onChange={(e) => handleFileSelection(fname, e.target.checked)}
                        className="w-4 h-4 text-[#da2128] border-gray-300 rounded focus:ring-[#da2128] focus:ring-2"
                      />
                      <span className="text-sm text-gray-700 select-none">{fname}</span>
                    </label>
                  ))}
                </div>

                {filesData.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Files className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No files available</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancelFilesPopup}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  disabled={isDownloading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownloadFiles}
                  disabled={selectedFiles.size === 0 || isDownloading}
                  className={`px-4 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                    selectedFiles.size === 0 || isDownloading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#da2128] text-white hover:bg-[#ae1b22]'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  {isDownloading 
                    ? 'Downloading...' 
                    : `Download${selectedFiles.size > 0 ? ` (${selectedFiles.size})` : ''}`
                  }
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MPP files upload popup */}
      <AnimatePresence>
        {showMppUploadPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30"
          >
            <div className="bg-white rounded-lg shadow-xl p-6 min-w-[340px] max-w-[95vw]">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-base font-semibold text-[#da2128]">Upload MPP Commodity Data</h2>
                <button
                  onClick={() => {
                    setShowMppUploadPopup(false);
                    setMppFile(null);
                  }}
                  className="text-gray-400 hover:text-gray-700"
                  aria-label="Close"
                >
                  &#x2715;
                </button>
              </div>
              <div className="mb-3">
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={e => setMppFile(e.target.files?.[0] ?? null)}
                  disabled={mppUploading}
                  className="cursor-pointer block w-full text-sm text-gray-600 rounded border border-dashed border-[#da2128] px-3 py-2"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowMppUploadPopup(false);
                    setMppFile(null);
                  }}
                  className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                  disabled={mppUploading}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!mppFile) {
                      toast({
                        title: "File Required",
                        description: "Please select a file to upload.",
                        variant: "destructive"
                      });
                      return;
                    }
                    setMppUploading(true);
                    try {
                      const formData = new FormData();
                      formData.append('file', mppFile);
                      const res = await fetch(`${import.meta.env.VITE_CAPEX_BASE_URL}/upload-mpp`, {
                        method: "POST",
                        body: formData
                      });
                      if (!res.ok) throw new Error(`Upload failed with status ${res.status}`);
                      toast({
                        title: "Success",
                        description: "MPP commodity data uploaded successfully.",
                        variant: "default"
                      });
                      setShowMppUploadPopup(false);
                      setMppFile(null);
                    } catch (err) {
                      toast({
                        title: "Error",
                        description: "Failed to upload MPP commodity data.",
                        variant: "destructive"
                      });
                    } finally {
                      setMppUploading(false);
                    }
                  }}
                  className={`px-3 py-1 text-sm bg-[#da2128] text-white rounded hover:bg-[#ae1b22] transition ${mppUploading ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  disabled={mppUploading}
                >
                  {mppUploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default ChatHeader;
