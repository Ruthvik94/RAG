export type DocumentType = '.txt' | '.pdf' | '.docx';

export interface Document {
  id: number;
  createdAt: Date;
  docType: DocumentType;
  fileSize: number;
  content: string;
}