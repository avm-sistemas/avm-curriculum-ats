export interface IProcessedFilesMetadata {
  originalFileName: string;
  mimeType: string;
  localPath?: string;
  localUrl?: string;
  uploadDate: Date | string | null; // A data aqui já estará processada
}