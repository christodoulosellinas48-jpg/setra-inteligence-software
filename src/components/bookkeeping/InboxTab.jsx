import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Eye,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

export default function InboxTab({ businessId }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', businessId],
    queryFn: () => base44.entities.Document.filter({ business_id: businessId }, '-created_date')
  });

  // Upload mutation
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        // Upload file
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        
        // Parse with AI
        const parseResult = await base44.integrations.Core.InvokeLLM({
          prompt: `Extract invoice/receipt data from this document. Return JSON with: supplier_name, invoice_number, invoice_date (YYYY-MM-DD), gross_total, net_total, vat_total, type (invoice/receipt/credit_note). If you can't extract a field, set it to null.`,
          file_urls: [file_url],
          response_json_schema: {
            type: "object",
            properties: {
              supplier_name: { type: "string" },
              invoice_number: { type: "string" },
              invoice_date: { type: "string" },
              gross_total: { type: "number" },
              net_total: { type: "number" },
              vat_total: { type: "number" },
              type: { type: "string" }
            }
          }
        });

        // Calculate confidence based on extracted fields
        const confidence = Object.values(parseResult).filter(v => v !== null).length / 7;

        // Create document
        await base44.entities.Document.create({
          business_id: businessId,
          file_url,
          status: confidence < 0.7 ? 'needs_review' : 'parsed',
          confidence_score: confidence,
          ...parseResult
        });
      }

      queryClient.invalidateQueries(['documents', businessId]);
      toast.success(`Uploaded ${files.length} document${files.length > 1 ? 's' : ''}`);
    } catch (error) {
      toast.error('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (docId) => base44.entities.Document.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents', businessId]);
      toast.success('Document deleted');
    }
  });

  const getStatusBadge = (status) => {
    const config = {
      new: { label: 'New', className: 'bg-blue-500/10 text-blue-400' },
      parsed: { label: 'Parsed', className: 'bg-green-500/10 text-green-400' },
      needs_review: { label: 'Needs Review', className: 'bg-amber-500/10 text-amber-400' },
      approved: { label: 'Approved', className: 'bg-emerald-500/10 text-emerald-400' },
      posted: { label: 'Posted', className: 'bg-slate-500/10 text-slate-400' }
    };
    const { label, className } = config[status] || config.new;
    return <Badge className={className}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <Card className="bg-slate-900/50 border-slate-800 p-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7B3BFF]/20 to-[#A855F7]/20 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-[#C084FC]" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Upload Invoices & Receipts</h2>
          <p className="text-slate-400 mb-6">
            Upload PDF, JPG, or PNG files. AI will automatically extract and categorize data.
          </p>
          
          <label htmlFor="file-upload" className="cursor-pointer">
            <Button disabled={uploading} asChild>
              <span>
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Files
                  </>
                )}
              </span>
            </Button>
            <Input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </Card>

      {/* Documents List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white">Documents ({documents.length})</h3>
        
        {documents.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-800 p-8 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No documents uploaded yet</p>
          </Card>
        ) : (
          documents.map((doc, idx) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="bg-slate-900/50 border-slate-800 p-4 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-slate-800/50 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-slate-400" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white">{doc.supplier_name || 'Unknown Supplier'}</h4>
                        {getStatusBadge(doc.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        {doc.invoice_number && <span>#{doc.invoice_number}</span>}
                        {doc.invoice_date && <span>{new Date(doc.invoice_date).toLocaleDateString()}</span>}
                        {doc.type && <span className="capitalize">{doc.type}</span>}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-semibold text-white">
                        €{doc.gross_total?.toFixed(2) || '0.00'}
                      </p>
                      {doc.confidence_score > 0 && (
                        <p className="text-xs text-slate-500">
                          {Math.round(doc.confidence_score * 100)}% confidence
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {doc.file_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(doc.file_url, '_blank')}
                        className="text-slate-400 hover:text-white"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(doc.id)}
                      disabled={deleteMutation.isPending}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}