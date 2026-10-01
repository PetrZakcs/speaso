import { Directory, File, Paths } from 'expo-file-system';

/**
 * Recordings live in <documents>/recordings. The store keeps only the file
 * name — absolute paths of the app container can change between app updates
 * on iOS, so the URI is always resolved at runtime.
 */
const DIR_NAME = 'recordings';

function recordingsDir(): Directory {
  const dir = new Directory(Paths.document, DIR_NAME);
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

/** Moves a freshly recorded temp file into permanent storage; returns its file name. */
export async function persistRecording(tempUri: string): Promise<string> {
  const source = new File(tempUri);
  const ext = source.extension || '.m4a';
  const fileName = `${Date.now()}${ext.startsWith('.') ? ext : `.${ext}`}`;
  await source.move(new File(recordingsDir(), fileName));
  return fileName;
}

export function recordingUri(fileName: string): string {
  return new File(Paths.document, DIR_NAME, fileName).uri;
}

export function deleteRecordingFile(fileName: string) {
  try {
    const file = new File(Paths.document, DIR_NAME, fileName);
    if (file.exists) file.delete();
  } catch (e) {
    console.warn('[recordings] delete failed:', e);
  }
}
