// import Image from "next/image";

// export default function Home() {
//   return (
//     <main className="flex bg-center">
//       <div className="bg-gradient-to-b relative from-lime-400 from-15% via-teal-300 via-60% to-transparent text-transparent w-full bg-clip-text leading-none text-[15vw] text-center">
//         Shrey_PLEX
//       </div>
//     </main>
//   );
// }
// pages/index.tsx
"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import ReactPlayer from 'react-player';
import type { NextPage } from 'next';

interface FTPConfig {
  host: string;
  user: string;
  password: string;
  secure: boolean;
}

interface FileItem {
  name: string;
  type: 'file' | 'directory' | 'symbolicLink';
  size: number;
  date: string;
}

const Home: NextPage = () => {
  const [ftpConfig, setFtpConfig] = useState<FTPConfig>({
    host: '',
    user: '',
    password: '',
    secure: false,
  });

  const [currentPath, setCurrentPath] = useState<string>('/');
  const [fileList, setFileList] = useState<FileItem[]>([]);
  const [history, setHistory] = useState<string[]>(['/']);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // Handle input changes for FTP configuration
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const { name, value, type, checked } = e.target;
    setFtpConfig((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Fetch directory listing
  const fetchDirectory = async (path: string = '/') => {
    try {
      const response = await axios.post('/api/ftp/list', {
        ...ftpConfig,
        path,
      });

      setFileList(response.data.list);
      setCurrentPath(path);
    } catch (error: any) {
      alert(
        'Error fetching directory: ' +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Handle connect button click
  const handleConnect = () => {
    fetchDirectory('/');
    setHistory(['/']);
    setSelectedFile(null);
    setMediaUrl(null);
    setImageSrc(null);
  };

  // Navigate into a directory or select a file
  const navigateTo = (item: FileItem) => {
    if (item.type === 'directory') {
      const newPath = currentPath === '/' ? `/${item.name}` : `${currentPath}/${item.name}`;
      setHistory((prev) => [...prev, newPath]);
      fetchDirectory(newPath);
      setSelectedFile(null);
      setMediaUrl(null);
      setImageSrc(null);
    } else {
      // Handle file selection
      setSelectedFile(item);
      const fileExtension = item.name.split('.').pop()?.toLowerCase() || '';

      if (isImageFile(fileExtension)) {
        // Display image
        fetchImageAsBlobURL(item.name);
      } else if (isMediaFile(fileExtension)) {
        // Play media
        fetchMediaUrl(item.name);
      } else {
        alert('Unsupported file type.');
      }
    }
  };

  // Fetch image as Blob URL
  const fetchImageAsBlobURL = async (fileName: string) => {
    try {
      const response = await axios.post(
        '/api/ftp/file',
        {
          ...ftpConfig,
          filePath:
            currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`,
        },
        { responseType: 'blob' }
      );

      const url = URL.createObjectURL(new Blob([response.data]));
      setImageSrc(url);
      setMediaUrl(null);
    } catch (error: any) {
      alert(
        'Error fetching image: ' +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Fetch media file as Blob URL
  const fetchMediaUrl = async (fileName: string) => {
    try {
      const response = await axios.post(
        '/api/ftp/file',
        {
          ...ftpConfig,
          filePath:
            currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`,
        },
        { responseType: 'blob' }
      );

      const url = URL.createObjectURL(new Blob([response.data]));
      setMediaUrl(url);
      setImageSrc(null);
    } catch (error: any) {
      alert(
        'Error fetching media: ' +
          (error.response?.data?.message || error.message)
      );
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const newPath = newHistory[newHistory.length - 1];
      setHistory(newHistory);
      fetchDirectory(newPath);
      setSelectedFile(null);
      setMediaUrl(null);
      setImageSrc(null);
    }
  };

  // Utility functions to determine file types
  const isImageFile = (extension: string): boolean => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
    return imageExtensions.includes(extension);
  };

  const isMediaFile = (extension: string): boolean => {
    const mediaExtensions = ['mp4', 'avi', 'mov', 'mkv', 'mp3', 'wav', 'aac', 'flac'];
    return mediaExtensions.includes(extension);
  };

  return (
    <div style={styles.container}>
      <h1>FTP Browser</h1>

      {/* FTP Configuration Form */}
      <div style={styles.ftpForm}>
        <input
          type="text"
          name="host"
          placeholder="FTP Host"
          value={ftpConfig.host}
          onChange={handleInputChange}
          style={styles.input}
        />
        <input
          type="text"
          name="user"
          placeholder="Username"
          value={ftpConfig.user}
          onChange={handleInputChange}
          style={styles.input}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={ftpConfig.password}
          onChange={handleInputChange}
          style={styles.input}
        />
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            name="secure"
            checked={ftpConfig.secure}
            onChange={handleInputChange}
          />{' '}
          Secure (FTPS)
        </label>
        <button onClick={handleConnect} style={styles.button}>
          Connect
        </button>
      </div>

      {/* Navigation Buttons */}
      <div style={styles.navigation}>
        {history.length > 1 && (
          <button onClick={handleBack} style={styles.button}>
            Back
          </button>
        )}
        <span style={styles.currentPath}>Current Path: {currentPath}</span>
      </div>

      {/* Directory Listing */}
      <ul style={styles.fileList}>
        {fileList.map((item) => (
          <li key={item.name} style={styles.fileItem}>
            <button onClick={() => navigateTo(item)} style={styles.fileButton}>
              {item.type === 'directory' ? '📁' : '📄'} {item.name}
            </button>
          </li>
        ))}
      </ul>

      {/* Image Viewer */}
      {imageSrc && selectedFile && isImageFile(selectedFile.name.split('.').pop() || '') && (
        <div style={styles.mediaContainer}>
          <h3>Image: {selectedFile.name}</h3>
          <img src={imageSrc} alt={selectedFile.name} style={styles.image} />
        </div>
      )}

      {/* Media Player */}
      {mediaUrl && selectedFile && isMediaFile(selectedFile.name.split('.').pop() || '') && (
        <div style={styles.mediaContainer}>
          <h3>Playing: {selectedFile.name}</h3>
          <ReactPlayer
            url={mediaUrl}
            controls
            width="100%"
            height="auto"
          />
        </div>
      )}
    </div>
  );
};

// Inline styles for simplicity
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  ftpForm: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  input: {
    padding: '8px',
    fontSize: '16px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '16px',
  },
  button: {
    padding: '8px 16px',
    fontSize: '16px',
    cursor: 'pointer',
  },
  navigation: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
  },
  currentPath: {
    fontSize: '16px',
    fontWeight: 'bold',
  },
  fileList: {
    listStyleType: 'none',
    padding: 0,
  },
  fileItem: {
    marginBottom: '8px',
  },
  fileButton: {
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: '16px',
    cursor: 'pointer',
    textAlign: 'left',
  },
  mediaContainer: {
    marginTop: '20px',
  },
  image: {
    maxWidth: '100%',
    height: 'auto',
  },
};

export default Home;
