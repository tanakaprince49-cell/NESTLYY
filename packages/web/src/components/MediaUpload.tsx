import React, { useState, useRef } from 'react';
import { Image, Video, X, Upload } from 'lucide-react';
import type { MediaAttachment } from '@nestly/shared';

interface MediaUploadProps {
  onMediaSelect: (files: MediaAttachment[]) => void;
  maxFiles?: number;
  accept?: string;
  className?: string;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  onMediaSelect,
  maxFiles = 5,
  accept = 'image/*,video/*',
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList) => {
    const attachments: MediaAttachment[] = [];
    
    Array.from(files).forEach(file => {
      if (attachments.length >= maxFiles) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const isVideo = file.type.startsWith('video/');
        
        // Create optimized attachment
        const attachment: MediaAttachment = {
          id: crypto.randomUUID(),
          type: isVideo ? 'video' : 'image',
          url: result,
          size: file.size,
          width: isVideo ? 640 : undefined, // Default video width
          height: isVideo ? 360 : undefined, // Default video height
        };

        // For images, try to get dimensions
        if (!isVideo) {
          const img = new window.Image();
          img.onload = () => {
            attachment.width = img.width;
            attachment.height = img.height;
          };
          img.src = result;
        }

        attachments.push(attachment);
        
        // Check if all files processed
        if (attachments.length === Math.min(files.length, maxFiles)) {
          onMediaSelect(attachments);
        }
      };
      
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div
      className={`relative border-2 border-dashed rounded-2xl p-6 transition-all ${
        isDragging ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'
      } ${className}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={maxFiles > 1}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="text-center">
        <Upload 
          size={32} 
          className={`mx-auto mb-2 transition-colors ${
            isDragging ? 'text-rose-500' : 'text-slate-400'
          }`}
        />
        <p className="text-sm font-medium text-slate-600 mb-2">
          {isDragging ? 'Drop to upload' : 'Drag & drop or click to upload'}
        </p>
        <p className="text-xs text-slate-400">
          {maxFiles > 1 ? `Up to ${maxFiles} files` : 'Single file'} • Max 10MB each
        </p>
      </div>
      
      {/* Preview of selected files */}
      <div className="mt-4 flex flex-wrap gap-2" id="media-preview" />
    </div>
  );
};
