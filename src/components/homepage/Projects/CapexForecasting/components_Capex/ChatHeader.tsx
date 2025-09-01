import React, { useState } from 'react';
import Logo from '../assets_Capex/logo.png';
import { Upload, MoreVertical } from "lucide-react";
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
    // const displayText = fileName.length > 10 ? `${fileName.slice(0, 10)}...` : fileName;
    return (
      <div className="relative flex items-center ml-2">
        <button
          className="text-gray-600 cursor-pointer select-none"
          onClick={toggle}
          aria-label={`Toggle file name tooltip for ${fileName}`}
          title={fileName}
        >
          {/* Show ellipsis with underline on hover */}
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
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
