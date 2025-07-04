const workder = self;
workder.addEventListener(
  "message",
  async (e: MessageEvent<[File, string | undefined]>) => {
    const pna = await import("zip_wasm");
    await pna.default();
    const [archive, encoding_mode] = e.data;
    try {
      let data = await pna.convert_zip_encoding(
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
