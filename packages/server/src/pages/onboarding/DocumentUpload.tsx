import { useState, useCallback } from "react";
import { Button } from "@/src/lib/components/ui/button";
import Icon from "@/src/lib/components/custom/Icon";
import { cn } from "@/src/lib/utils";

interface UploadedDocument {
  id: string;
  file: File;
  name: string;
  size: string;
  type: string;
}

interface DocumentUploadProps {
  onDocumentsChange: (documents: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  label?: string;
  description?: string;
}

export default function DocumentUpload({
  onDocumentsChange,
  maxFiles = 5,
  acceptedTypes = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"],
  label = "Upload Documents",
  description = "Upload identity verification and professional documents (PDF, images, or Word documents)"
}: DocumentUploadProps) {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newDocuments: UploadedDocument[] = [];
    const remainingSlots = maxFiles - documents.length;
    const filesToProcess = Math.min(files.length, remainingSlots);

    for (let i = 0; i < filesToProcess; i++) {
      const file = files[i];
      const document: UploadedDocument = {
        id: `${Date.now()}-${i}`,
        file,
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type
      };
      newDocuments.push(document);
    }

    const updatedDocuments = [...documents, ...newDocuments];
    setDocuments(updatedDocuments);
    onDocumentsChange(updatedDocuments.map(doc => doc.file));
  }, [documents, maxFiles, onDocumentsChange]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeDocument = (id: string) => {
    const updatedDocuments = documents.filter(doc => doc.id !== id);
    setDocuments(updatedDocuments);
    onDocumentsChange(updatedDocuments.map(doc => doc.file));
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return 'FileText';
    if (type.includes('image')) return 'Image';
    if (type.includes('word') || type.includes('document')) return 'File';
    return 'File';
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-2 block">
          {label}
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          {description}
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed p-6 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-accent/30"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(",")}
          onChange={handleFileInputChange}
          className="hidden"
          id="document-upload"
          disabled={documents.length >= maxFiles}
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon name="Upload" className="w-6 h-6 text-primary" />
          </div>
          
          <div>
            <p className="font-medium text-foreground mb-1">
              {documents.length >= maxFiles 
                ? `Maximum ${maxFiles} files reached` 
                : "Drop files here or click to browse"
              }
            </p>
            <p className="text-xs text-muted-foreground">
              Accepted formats: {acceptedTypes.join(", ")}
            </p>
            <p className="text-xs mt-2 text-muted-foreground">
              {documents.length}/{maxFiles} files uploaded
            </p>
          </div>

          {documents.length < maxFiles && (
            <Button s
              type="button"
              variant="outline" 
              size="sm"

              onClick={() => document.getElementById('document-upload')?.click()}
            >
              <Icon name="Plus" className="w-4 h-4" />
              Add Files
            </Button>
          )}
        </div>
      </div>

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Uploaded Documents</h4>
          <div className="space-y-2">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-3 bg-card border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 flex items-center justify-center">
                    <Icon 
                      name={getFileIcon(document.type) as any} 
                      className="w-4 h-4 text-primary" 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {document.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {document.size}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDocument(document.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Icon name="Trash2" className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
