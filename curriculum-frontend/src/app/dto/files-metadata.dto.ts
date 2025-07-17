import { IFilesMetadata } from "../interfaces/files-metadata.interface";

export class FilesMetadata implements IFilesMetadata {
    originalFileName: string;
    mimeType: string;
    localPath?: string | undefined;
    localUrl?: string | undefined;
    uploadDate: string;
    cloudStoragePath?: string;
    cloudStorageUrl?: string;    

    constructor() {
        this.originalFileName = '';
        this.mimeType = '';
        this.uploadDate = '';
    }

}