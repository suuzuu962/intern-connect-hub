import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Upload, FileText, CheckCircle, AlertTriangle, Loader2, Shield, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FileUploadProps {
  accept: string;
  maxSizeMB?: number;
  fileType: 'resume' | 'document' | 'college-id' | 'logo' | 'cover';
  bucket: string;
  userId: string;
  onUploadComplete: (storagePath: string) => void;
  disabled?: boolean;
  currentFileUrl?: string;
  label?: string;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type UploadStage = 'idle' | 'scanning' | 'uploading' | 'done' | 'error';

export const FileUpload = ({
  accept,
  maxSizeMB = 5,
  fileType,
  bucket,
  userId,
  onUploadComplete,
  disabled = false,
  currentFileUrl,
  label,
  className,
}: FileUploadProps) => {
  const [stage, setStage] = useState<UploadStage>('idle');
  const [progress, setProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const resetState = () => {
    setStage('idle');
    setProgress(0);
    setSelectedFile(null);
    setErrorMessage('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setErrorMessage('');

    // Client-side size check
    if (file.size > maxSizeBytes) {
      setStage('error');
      setErrorMessage(`File too large (${formatFileSize(file.size)}). Max: ${maxSizeMB}MB`);
      return;
    }

    // Stage 1: Scan
    setStage('scanning');
    setProgress(10);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);
      formData.append('fileName', file.name);

      const scanResponse = await supabase.functions.invoke('scan-file', {
        body: formData,
      });

      setProgress(40);

      if (scanResponse.error || (scanResponse.data && !scanResponse.data.passed)) {
        const threats = scanResponse.data?.threats || ['File rejected by security scan'];
        setStage('error');
        setErrorMessage(threats.join('. '));
        toast.error('File rejected', { description: threats[0] });
        return;
      }

      // Stage 2: Upload
      setStage('uploading');
      setProgress(50);

      const ext = file.name.split('.').pop();
      const fileName = `${userId}/${fileType}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      setProgress(90);

      // Build storage path
      let storagePath: string;
      if (bucket === 'public-assets') {
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(fileName);
        storagePath = publicUrl;
      } else if (bucket === 'resume-storage') {
        storagePath = `resume://${fileName}`;
      } else {
        storagePath = `private://${fileName}`;
      }

      setProgress(100);
      setStage('done');
      onUploadComplete(storagePath);
      toast.success('File uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      setStage('error');
      setErrorMessage(error.message || 'Upload failed');
      toast.error('Upload failed');
    }
  };

  const stageInfo: Record<UploadStage, { icon: React.ReactNode; text: string; color: string }> = {
    idle: { icon: <Upload className="h-4 w-4" />, text: 'Choose file', color: 'text-muted-foreground' },
    scanning: { icon: <Shield className="h-4 w-4 animate-pulse" />, text: 'Scanning for threats...', color: 'text-info' },
    uploading: { icon: <Loader2 className="h-4 w-4 animate-spin" />, text: 'Uploading...', color: 'text-primary' },
    done: { icon: <CheckCircle className="h-4 w-4" />, text: 'Upload complete', color: 'text-success' },
    error: { icon: <AlertTriangle className="h-4 w-4" />, text: 'Error', color: 'text-destructive' },
  };

  const current = stageInfo[stage];

  return (
    <div className={cn('space-y-2', className)}>
      {/* File input area */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || stage === 'scanning' || stage === 'uploading'}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          {label || 'Choose File'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled || stage === 'scanning' || stage === 'uploading'}
          className="hidden"
        />

        {/* File info */}
        {selectedFile && (
          <div className="flex items-center gap-2 text-xs">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-foreground font-medium max-w-[150px] truncate">
              {selectedFile.name}
            </span>
            <span className="text-muted-foreground">
              ({formatFileSize(selectedFile.size)})
            </span>
            {stage === 'done' || stage === 'error' ? (
              <button onClick={resetState} className="text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        )}

        {/* Current file indicator */}
        {!selectedFile && currentFileUrl && (
          <span className="text-xs text-success flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" />
            File uploaded
          </span>
        )}
      </div>

      {/* Progress bar + status */}
      {stage !== 'idle' && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className={cn('flex items-center gap-1.5 text-xs font-medium', current.color)}>
              {current.icon}
              {stage === 'error' ? errorMessage : current.text}
            </span>
          </div>
          {(stage === 'scanning' || stage === 'uploading' || stage === 'done') && (
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  'h-full transition-all duration-500 rounded-full',
                  stage === 'done' ? 'bg-success' : 'bg-primary'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Size limit hint */}
      {stage === 'idle' && !selectedFile && (
        <p className="text-xs text-muted-foreground">
          Max {maxSizeMB}MB • {accept.replace(/\./g, '').toUpperCase().replace(/,/g, ', ')}
        </p>
      )}
    </div>
  );
};
