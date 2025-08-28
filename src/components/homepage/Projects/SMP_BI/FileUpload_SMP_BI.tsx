import { useState } from "react";
import { Paperclip } from "lucide-react";
import { Button } from "./ui_SMP_BI/button";
import { useToast } from "./hooks_SMP_BI/use-toast";

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
}

const FileUpload = ({ onFilesSelected }: FileUploadProps) => {
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    // Check file count
    if (files.length > 1) {
      toast({
        title: "Too many files",
        description: "Please select maximum 1 file",
        variant: "destructive",
      });
      return;
    }

    // Check file types and ensure they're all the same
    const allowedTypes = ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    const validFiles = files.filter(file => allowedTypes.includes(file.type));

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid file type",
        description: "Please select only PDF or Excel files",
        variant: "destructive",
      });
      return;
    }

    // Check if all files are of the same type
    const firstFileType = validFiles[0].type;
    const allSameType = validFiles.every(file => file.type === firstFileType);

    if (!allSameType) {
      toast({
        title: "Mixed file types",
        description: "All files must be of the same type (all PDF or all Excel)",
        variant: "destructive",
      });
      return;
    }

    onFilesSelected(validFiles);

    // Reset the input so the same files can be selected again if needed
    event.target.value = '';
  };

  return (
    <>
      <input
        type="file"
        id="file-upload"
        multiple
        accept=".pdf,.xls,.xlsx"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => document.getElementById('file-upload')?.click()}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
      >
        <Paperclip className="h-4 w-4" />
      </Button>
    </>
  );
};

export default FileUpload;
