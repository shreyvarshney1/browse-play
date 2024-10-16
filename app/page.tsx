"use client";
import { useState, useEffect } from 'react';
import { Readable } from 'stream';
import axios from 'axios';
import ReactPlayer from 'react-player';
import { Client } from 'basic-ftp';
import type { NextPage } from 'next';

const Home: NextPage = () => {
  const [ftpClient] = useState(new Client());
  const [message, setMessage] = useState<string>('');
  const [files, setFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const connectToFtp = async () => {
    try {
      await ftpClient.access({
        host: "ftp://192.168.1.37:2121",
        user: "username",
        password: "password",
        secure: false
      });
      setMessage('Connected to FTP server');
      listFiles(); // List files after connecting
    } catch (err) {
      setMessage(`Error: ${(err as Error).message}`);
    }
  };

  const listFiles = async () => {
    try {
      const list = await ftpClient.list();
      setFiles(list.map(file => file.name));
      setMessage('Files listed successfully');
    } catch (err) {
      const error = err as Error;
      setMessage(`Error: ${error.message}`);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      const fileStream = file.stream();
      const readableStream = new ReadableStream({
        start(controller) {
          const reader = fileStream.getReader();
          function push() {
            reader.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }
              controller.enqueue(value);
              push();
            });
          }
          push();
        }
      });
      const readable = new Response(readableStream).body as unknown as Readable;
      await ftpClient.uploadFrom(readable, file.name);
      setMessage('File uploaded successfully');
      listFiles(); // Refresh file list after upload
    } catch (err) {
      const error = err as Error;
      setMessage(`Error: ${error.message}`);
    }
  };

  const downloadFile = async (fileName: string) => {
    try {
      await ftpClient.downloadTo(`./downloads/${fileName}`, fileName);
      setMessage('File downloaded successfully');
    } catch (err) {
      const error = err as Error;
      setMessage(`Error: ${error.message}`);
    }
  };

  const playVideo = (fileName: string) => {
    setSelectedFile(fileName);
  };

  useEffect(() => {
    connectToFtp();
  }, []);

  return (
    <main className="flex flex-col items-center bg-center">
      <div className="bg-gradient-to-b relative from-lime-400 from-15% via-teal-300 via-60% to-transparent text-transparent w-full bg-clip-text leading-none text-[15vw] text-center">
        Shrey_PLEX
      </div>
      <div className="mt-4">
        <input type="file" onChange={(e) => e.target.files && uploadFile(e.target.files[0])} />
      </div>
      <div className="mt-4">
        <button onClick={listFiles}>Refresh File List</button>
      </div>
      <div className="mt-4">
        <ul>
          {files.map(file => (
            <li key={file}>
              {file} 
              <button onClick={() => downloadFile(file)}>Download</button>
              <button onClick={() => playVideo(file)}>Play</button>
            </li>
          ))}
        </ul>
      </div>
      {selectedFile && (
        <div className="mt-4">
          <ReactPlayer url={`ftp://your-ftp-server/${selectedFile}`} controls />
        </div>
      )}
      <div className="mt-4">
        {message}
      </div>
    </main>
  );
};

export default Home;
