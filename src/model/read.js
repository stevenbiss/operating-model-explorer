import { unzipSync } from 'fflate';

// Each reader returns [{ path, data: Uint8Array }] with '/'-separated paths.

export function readZip(bytes) {
  return Object.entries(unzipSync(bytes))
    .filter(([path]) => !path.endsWith('/'))
    .map(([path, data]) => ({ path, data }));
}

// From <input type="file" webkitdirectory> or a multi-file input.
export async function readFileList(fileList) {
  return Promise.all(
    [...fileList].map(async (f) => ({ path: f.webkitRelativePath || f.name, data: new Uint8Array(await f.arrayBuffer()) })),
  );
}

// From showDirectoryPicker() or DataTransferItem.getAsFileSystemHandle(). The handle can be re-read for "Reload".
export async function readDirectoryHandle(dir, prefix = '') {
  const files = [];
  for await (const [name, handle] of dir.entries()) {
    if (handle.kind === 'directory') files.push(...(await readDirectoryHandle(handle, `${prefix}${name}/`)));
    else files.push({ path: prefix + name, data: new Uint8Array(await (await handle.getFile()).arrayBuffer()) });
  }
  return files;
}
