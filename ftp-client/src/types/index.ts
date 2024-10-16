// This file contains the necessary types and interfaces used throughout the project

export interface Video {
  name: string;
  url: string;
}

export interface Directory {
  name: string;
  path: string;
  videos: Video[];
}

export interface FTPClientOptions {
  host: string;
  port: number;
  username: string;
  password: string;
}

export interface FTPService {
  connect(options: FTPClientOptions): Promise<void>;
  browseDirectories(path: string): Promise<Directory[]>;
  retrieveVideo(url: string): Promise<Video>;
}

export interface VideoPlayerProps {
  video: Video;
}