export function readableFromFile(file: Deno.FsFile): ReadableStream<Uint8Array> {
  const reader = file.readable.getReader();

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        try {
          reader.releaseLock();
        } finally {
          file.close();
        }
        return;
      }
      controller.enqueue(value);
    },
    cancel() {
      try {
        reader.releaseLock();
      } catch {
        // ignore
      }
      try {
        file.close();
      } catch {
        // ignore
      }
    },
  });
}
