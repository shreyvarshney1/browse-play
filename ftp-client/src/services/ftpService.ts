import * as ftp from 'ftp';

export class FTPService {
  private client: ftp;

  constructor() {
    this.client = new ftp();
  }

  public connect(server: string, username: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.on('ready', () => {
        resolve();
      });

      this.client.on('error', (err) => {
        reject(err);
      });

      this.client.connect({
        host: server,
        user: username,
        password: password
      });
    });
  }

  public browseDirectory(directory: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      this.client.list(directory, (err, files) => {
        if (err) {
          reject(err);
        } else {
          const videoFiles = files.filter((file) => {
            return file.type === '-' && file.name.endsWith('.mp4');
          }).map((file) => {
            return file.name;
          });

          resolve(videoFiles);
        }
      });
    });
  }

  public downloadFile(remotePath: string, localPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.client.get(remotePath, (err, stream) => {
        if (err) {
          reject(err);
        } else {
          stream.once('close', () => {
            resolve();
          });

          stream.pipe(fs.createWriteStream(localPath));
        }
      });
    });
  }
}