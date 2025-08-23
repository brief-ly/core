import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, Download, DollarSign, Lock, Unlock, Clock, User } from "lucide-react";
import { Button } from "@/src/lib/components/ui/button";
import { useApi } from "@/src/lib/hooks/use-api";
import { toast } from "sonner";
import { cn, truncateText } from "@/src/lib/utils/utils";

interface Document {
  id: number;
  title: string;
  description?: string;
  paymentRequired: number;
  isPaid: boolean;
  uploadedBy: string;
  uploadedAt: string;
}

interface DocumentListProps {
  documents: Document[];
}

export default function DocumentList({ documents }: DocumentListProps) {
  const [expandedDocs, setExpandedDocs] = useState<Set<number>>(new Set());
  const [paidDocuments, setPaidDocuments] = useState<Set<number>>(new Set());
  
  const { payForDocument, downloadDocument } = useApi();

  const toggleExpanded = (docId: number) => {
    const newExpanded = new Set(expandedDocs);
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId);
    } else {
      newExpanded.add(docId);
    }
    setExpandedDocs(newExpanded);
  };

  const handlePayForDocument = async (document: Document) => {
    try {
      // In real app, this would call the actual API
      // await payForDocument.mutateAsync({
      //   groupId: parseInt(groupId),
      //   documentId: document.id
      // });
      
      // Mock payment success
      setPaidDocuments(prev => new Set([...prev, document.id]));
      toast.success(`Payment successful! Document "${document.title}" unlocked.`);
    } catch (error) {
      toast.error("Payment failed. Please try again.");
    }
  };

  const handleDownloadDocument = async (document: Document) => {
    if (!paidDocuments.has(document.id) && document.paymentRequired > 0) {
      toast.error("Please pay for this document first.");
      return;
    }

    try {
      // In real app, this would call the actual API
      // await downloadDocument.mutateAsync({
      //   groupId: parseInt(groupId),
      //   documentId: document.id
      // });
      
      // Mock download
      toast.success(`Downloading "${document.title}"...`);
    } catch (error) {
      toast.error("Download failed. Please try again.");
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isDocumentUnlocked = (document: Document) => {
    return document.paymentRequired === 0 || paidDocuments.has(document.id);
  };

  if (documents.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold mb-3">Documents</h3>
        <div className="bg-muted/50 rounded-lg p-6 text-center">
          <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No documents yet</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">Documents</h3>
      <div className="space-y-3">
        <AnimatePresence>
          {documents.map((document, index) => {
            const isExpanded = expandedDocs.has(document.id);
            const isUnlocked = isDocumentUnlocked(document);
            const isPaying = payForDocument.isPending;
            const isDownloading = downloadDocument.isPending;

            return (
              <motion.div
                key={document.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "bg-background border rounded-lg overflow-hidden transition-all duration-200",
                  isUnlocked 
                    ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20" 
                    : "border-border hover:border-primary/30"
                )}
              >
                {/* Document Header */}
                <div 
                  className="p-3 cursor-pointer" 
                  onClick={() => toggleExpanded(document.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      isUnlocked 
                        ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {isUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm truncate pr-2">{document.title}</h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {document.paymentRequired > 0 && (
                            <div className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                              isUnlocked
                                ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                                : "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300"
                            )}>
                              <DollarSign className="w-3 h-3" />
                              {isUnlocked ? "Paid" : `$${document.paymentRequired}`}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>{document.uploadedBy}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(document.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-border"
                    >
                      <div className="p-3 space-y-3">
                        {/* Description */}
                        {document.description && (
                          <p className="text-sm text-muted-foreground">
                            {truncateText(document.description, 100)}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          {!isUnlocked && document.paymentRequired > 0 ? (
                            <Button
                              onClick={() => handlePayForDocument(document)}
                              disabled={isPaying}
                              size="sm"
                              className="flex-1"
                            >
                              <DollarSign className="w-3 h-3 mr-1" />
                              {isPaying ? "Processing..." : `Pay $${document.paymentRequired}`}
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleDownloadDocument(document)}
                              disabled={isDownloading}
                              size="sm"
                              variant="outline"
                              className="flex-1"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              {isDownloading ? "Downloading..." : "Download"}
                            </Button>
                          )}
                          
                          {/* Preview button (future feature) */}
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled
                            className="opacity-50"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Preview
                          </Button>
                        </div>

                        {/* Payment info */}
                        {document.paymentRequired > 0 && !isUnlocked && (
                          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
                            <p className="text-xs text-amber-700 dark:text-amber-300">
                              💡 This document requires payment to access. Payments are processed securely and funds go directly to the lawyer who created it.
                            </p>
                          </div>
                        )}

                        {/* Success message for paid documents */}
                        {isUnlocked && document.paymentRequired > 0 && (
                          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-2">
                            <p className="text-xs text-green-700 dark:text-green-300">
                              ✅ Payment successful! You now have full access to this document.
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
