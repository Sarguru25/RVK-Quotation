/**
 * TypeScript Type Definitions for Zoho Books Attachment Service & Components
 * Supports Estimates, Sales Orders, and Invoices.
 */

export type SupportedZohoModule = "estimates" | "salesorders" | "invoices";

export interface AttachmentUploadParams {
  module: SupportedZohoModule;
  recordId: string;
  file: File | Blob;
}

export interface AttachmentGetParams {
  module: SupportedZohoModule;
  recordId: string;
  action?: "view" | "download";
}

export interface AttachmentDeleteParams {
  module: SupportedZohoModule;
  recordId: string;
}

export interface ZohoAttachmentResponse {
  code: number;
  message: string;
  data?: any;
}

export interface AttachmentManagerProps {
  module: SupportedZohoModule;
  recordId: string;
  title?: string;
  subtext?: string;
  className?: string;
}

export interface AttachmentUploadProps {
  onUpload: (file: File) => Promise<void>;
  loading: boolean;
  accept?: string;
  maxSizeMB?: number;
}

export interface AttachmentPreviewProps {
  module: SupportedZohoModule;
  recordId: string;
  fileName?: string;
  contentType?: string;
  onRefresh?: () => void;
}

export interface AttachmentActionsProps {
  module: SupportedZohoModule;
  recordId: string;
  onReplace: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
  loading: boolean;
}
