export interface IFilesMetadata {
  originalFileName: string;
  mimeType: string;
  localPath?: string; // Ou cloudStoragePath
  localUrl?: string;  // Ou cloudStorageUrl
  uploadDate: string; // Ou Date
  cloudStoragePath?: string;
  cloudStorageUrl?: string;
}