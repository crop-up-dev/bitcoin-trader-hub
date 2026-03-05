import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Home, CreditCard, ChevronDown, ChevronUp, Upload, CheckCircle2, X, File, Image } from 'lucide-react';
import { toast } from 'sonner';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  url: string;
}

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
}

const Documents = () => {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFile[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSection, setActiveSection] = useState<string>('');

  const sections: DocSection[] = [
    { id: 'identity', title: 'Proof of identity upload', icon: <FileText className="w-5 h-5 text-muted-foreground" /> },
    { id: 'residence', title: 'Proof of residence upload', icon: <Home className="w-5 h-5 text-muted-foreground" /> },
    { id: 'payment', title: 'Payment documents', icon: <CreditCard className="w-5 h-5 text-muted-foreground" /> },
    { id: 'other', title: 'Other documents', icon: <FileText className="w-5 h-5 text-muted-foreground" /> },
  ];

  const handleFileSelect = (sectionId: string) => {
    setActiveSection(sectionId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: UploadedFile[] = [];
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return;
      }
      const url = URL.createObjectURL(file);
      newFiles.push({ name: file.name, size: file.size, type: file.type, url });
    });

    if (newFiles.length > 0) {
      setUploadedFiles(prev => ({
        ...prev,
        [activeSection]: [...(prev[activeSection] || []), ...newFiles],
      }));
      toast.success(`${newFiles.length} file(s) uploaded successfully`);
    }

    // Reset input
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const newFiles: UploadedFile[] = [];
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return;
      }
      const url = URL.createObjectURL(file);
      newFiles.push({ name: file.name, size: file.size, type: file.type, url });
    });

    if (newFiles.length > 0) {
      setUploadedFiles(prev => ({
        ...prev,
        [sectionId]: [...(prev[sectionId] || []), ...newFiles],
      }));
      toast.success(`${newFiles.length} file(s) uploaded successfully`);
    }
  };

  const removeFile = (sectionId: string, index: number) => {
    setUploadedFiles(prev => {
      const files = [...(prev[sectionId] || [])];
      URL.revokeObjectURL(files[index].url);
      files.splice(index, 1);
      return { ...prev, [sectionId]: files };
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileCount = (sectionId: string) => (uploadedFiles[sectionId] || []).length;
  const getStatus = (sectionId: string) => getFileCount(sectionId) > 0 ? 'complete' : 'incomplete';

  return (
    <div className="min-h-screen bg-background">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground flex-1">Documents</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <p className="text-sm text-muted-foreground text-center leading-relaxed px-4">
          Providing proof of your identity and residence is obligatory for regulatory purposes.
          Please, make sure your documents' photos are in color, not blurred, cut out, or damaged in any way.
          A confirmation email will be sent as soon as we verify your documents.
        </p>

        <div className="space-y-3 mt-6">
          {sections.map(section => (
            <div key={section.id} className="border border-border/50 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === section.id ? null : section.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-accent/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  {section.icon}
                  <span className="text-sm font-medium text-foreground">{section.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${getStatus(section.id) === 'complete' ? 'text-trading-green' : 'text-primary'}`}>
                    {getStatus(section.id) === 'complete' ? 'Complete' : 'Incomplete'}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">{getFileCount(section.id)}</span>
                  {expandedId === section.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>
              {expandedId === section.id && (
                <div className="px-4 pb-4 border-t border-border/30">
                  {/* Uploaded files list */}
                  {(uploadedFiles[section.id] || []).length > 0 && (
                    <div className="mt-3 space-y-2">
                      {(uploadedFiles[section.id] || []).map((file, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 border border-border/30">
                          {file.type.startsWith('image/') ? (
                            <img src={file.url} alt={file.name} className="w-10 h-10 rounded object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                              <File className="w-5 h-5 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                            <p className="text-[10px] text-muted-foreground">{formatSize(file.size)}</p>
                          </div>
                          <button onClick={() => removeFile(section.id, idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload area */}
                  <div
                    className="mt-4 flex flex-col items-center gap-3 py-8 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:border-primary/30 hover:bg-primary/5 transition-all"
                    onClick={() => handleFileSelect(section.id)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => handleDrop(e, section.id)}
                  >
                    <Upload className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Drag & drop files here or click to upload</p>
                    <p className="text-[10px] text-muted-foreground">Supports: Images, PDF, DOC (Max 10MB)</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Documents;
