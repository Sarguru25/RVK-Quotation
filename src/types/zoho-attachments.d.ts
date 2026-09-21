/**
 * TypeScript Type Definitions for Zoho Books Attachment Service & Components
 * Supports Estimates, Sales Orders, and Invoices with multiple documents.
 */

export type SupportedZohoModule = "estimates" | "salesorders" | "invoices";

export interface ZohoDocument {
  document_id: string;
  file_name: string;
  file_size: number;
  file_size_formatted: string;
  file_type: string;
  uploaded_on: string;
  uploaded_by: string;
  can_send_in_mail?: boolean;
}

export interface AttachmentUploadParams {
  module: SupportedZohoModule;
  recordId: string;
  file: File | Blob;
}

export interface AttachmentGetParams {
  module: SupportedZohoModule;
  recordId: string;
  action?: "list" | "view" | "download";
  documentId?: string;
}

export interface AttachmentDeleteParams {
  module: SupportedZohoModule;
  recordId: string;
  documentId?: string;
}

export interface ZohoAttachmentResponse {
  code: number;
  message: string;
  documents?: ZohoDocument[];
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
  onUpload: (files: File[]) => Promise<void>;
  loading: boolean;
  accept?: string;
  maxSizeMB?: number;
  onCancel?: () => void;
}

export interface AttachmentPreviewProps {
  module: SupportedZohoModule;
  recordId: string;
  document: ZohoDocument;
  onClose?: () => void;
  refreshKey?: number;
}

export interface AttachmentActionsProps {
  module: SupportedZohoModule;
  recordId: string;
  document: ZohoDocument;
  onPreview?: () => void;
  onReplace: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
  loading: boolean;
  isPreviewing?: boolean;
}

