const workder = self;
workder.addEventListener(
  "message",
  async (e: MessageEvent<[File, string | undefined]>) => {
    const zip_wasm = await import("zip_wasm");
    await zip_wasm.default();
    const [archive, encoding_mode] = e.data;
    try {
      let data = await zip_wasm.convert_zip_encoding(
        archive,
        encoding_mode || "auto",
      );
      const file = new File([data], archive.name);
      workder.postMessage([0, file]);
    } catch (e) {
      console.error(e);
    }
  },
);
