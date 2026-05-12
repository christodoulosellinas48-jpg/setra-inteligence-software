import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Upload, File, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BulkUploadModal({ open, onOpenChange, onSave, businessId, userEmail }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
  };

  const addFiles = (newFiles) => {
    const validFiles = newFiles.filter(f => {
      const type = f.type.toLowerCase();
      return type === 'application/pdf' || type.startsWith('image/');
    });
    setFiles(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setUploadProgress(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;
    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(prev => ({ ...prev, [i]: { status: 'uploading' } }));

        try {
          // Upload file
          const { file_url } = await base44.integrations.Core.UploadFile({ file });

          // Process file with AI to extract all invoices
          const result = await base44.functions.invoke('processBulkInvoiceFile', {
            business_id: businessId,
            file_url
          });

          setUploadProgress(prev => ({
            ...prev,
            [i]: {
              status: 'success',
              processed: result.success,
              total: result.total,
              message: result.message
            }
          }));
        } catch (err) {
          const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
          setUploadProgress(prev => ({ ...prev, [i]: { status: 'failed', error: errorMsg } }));
        }
      }

      // Wait a moment to show final state, then close
      setTimeout(() => {
        setFiles([]);
        setUploadProgress({});
        onOpenChange(false);
        onSave();
      }, 2000);
    } finally {
      setUploading(false);
    }
  };

  const successCount = Object.values(uploadProgress).filter(p => p.status === 'success').length;
  const failedCount = Object.values(uploadProgress).filter(p => p.status === 'failed').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Upload Invoices</DialogTitle>
          <DialogDescription>
            Upload multiple invoices at once—PDFs, images, or a mix. Each will be processed separately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragActive
                ? 'border-[#7B3BFF] bg-[#7B3BFF]/5'
                : 'border-white/10 bg-[#151528]/50 hover:bg-[#151528]/70'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="application/pdf,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="space-y-2">
              <Upload className="w-8 h-8 text-[#C084FC] mx-auto opacity-60" />
              <div>
                <p className="text-white font-medium">Drag files here or click to browse</p>
                <p className="text-slate-500 text-sm">PDFs, PNG, JPEG, or other image formats</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4"
              >
                Select Files
              </Button>
            </div>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <p className="text-sm text-slate-400">{files.length} file{files.length !== 1 ? 's' : ''} selected</p>
              <AnimatePresence>
                {files.map((file, idx) => {
                  const progress = uploadProgress[idx];
                  const isUploading = progress?.status === 'uploading';
                  const isSuccess = progress?.status === 'success';
                  const isFailed = progress?.status === 'failed';

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      className="flex items-center gap-3 p-3 bg-[#0F0F1E] border border-white/5 rounded-lg"
                    >
                      <File className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate font-medium">{file.name}</p>
                        <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                      </div>

                      {isUploading && (
                        <Loader2 className="w-4 h-4 text-[#C084FC] animate-spin flex-shrink-0" />
                      )}
                      {isSuccess && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs text-emerald-500">
                            {progress.processed}/{progress.total}
                          </span>
                        </div>
                      )}
                      {isFailed && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <AlertCircle className="w-4 h-4 text-rose-500" />
                          <span className="text-xs text-rose-500 max-w-xs truncate" title={progress.error}>
                            {progress.error}
                          </span>
                        </div>
                      )}

                      {!isUploading && !isSuccess && !isFailed && (
                        <button
                          onClick={() => removeFile(idx)}
                          className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {uploading && (
                <div className="text-center py-2">
                  <p className="text-xs text-slate-400">
                    Processing {successCount} of {files.length} file{files.length !== 1 ? 's' : ''}...
                  </p>
                </div>
              )}

              {Object.values(uploadProgress).some(p => p.status === 'success') && (
                <div className="text-center py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
                  <p className="text-xs text-emerald-400">
                    ✓ Extracted and created {Object.values(uploadProgress).reduce((sum, p) => sum + (p.processed || 0), 0)} invoices
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={uploadFiles}
              disabled={files.length === 0 || uploading}
              className="flex-1"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload {files.length > 0 ? files.length : 0} File{files.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}