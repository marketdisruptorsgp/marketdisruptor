/**
 * FILE UPLOAD VALIDATION
 * Centralized size + type validation for all upload points.
 */

import { toast } from "sonner";

/** Size thresholds */
const IMAGE_WARN_SIZE = 5 * 1024 * 1024;     // 5MB — warn for images
const DOC_WARN_SIZE = 10 * 1024 * 1024;       // 10MB — warn for documents
const HARD_BLOCK_SIZE = 20 * 1024 * 1024;      // 20MB — block everything

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "heic", "heif"]);
const IMAGE_MIME_PREFIXES = ["image/"];

function isImageFile(file: File): boolean {
  if (IMAGE_MIME_PREFIXES.some(p => file.type.startsWith(p))) return true;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return IMAGE_EXTENSIONS.has(ext);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export interface FileValidationResult {
  allowed: boolean;
  warning: string | null;
}

/**
 * Validate a file for upload. Shows toast messages automatically.
 * Returns { allowed, warning }.
 */
export function validateFileUpload(file: File): FileValidationResult {
  const size = file.size;
  const isImage = isImageFile(file);
  const sizeStr = formatSize(size);

  // Hard block above 20MB
  if (size > HARD_BLOCK_SIZE) {
    toast.error(`File too large (${sizeStr}). Maximum upload size is 20MB.`);
    return { allowed: false, warning: null };
  }

  // Image-specific warning above 5MB
  if (isImage && size > IMAGE_WARN_SIZE) {
    const msg = `Large image (${sizeStr}). Files over 5MB may cause analysis timeouts. Consider compressing first.`;
    toast.warning(msg, { duration: 5000 });
    return { allowed: true, warning: msg };
  }

  // Document warning above 10MB
  if (!isImage && size > DOC_WARN_SIZE) {
    const msg = `Large document (${sizeStr}). Files over 10MB may be truncated during analysis. Consider splitting into smaller files.`;
    toast.warning(msg, { duration: 5000 });
    return { allowed: true, warning: msg };
  }

  return { allowed: true, warning: null };
}

/**
 * Validate multiple files. Returns only the allowed files.
 */
export function validateFileBatch(files: File[]): File[] {
  return files.filter(f => validateFileUpload(f).allowed);
}
