"use client";
import Image from "next/image";
import React, { useRef, useState } from "react";
import dynamic from "next/dynamic";
import styles from "./page.module.css";

export default dynamic(
  async () => {
    const init = await import("zip_wasm");
    await init.default();
    return () => Home(init);
  },
  {
    ssr: false,
  },
);

function Home(zip_wasm: typeof import("zip_wasm")) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [encoedArchive, setEncodedArchive] = useState<File[]>([]);
  const worker = new Worker(new URL("@/lib/extractWorker.ts", import.meta.url));
  worker.addEventListener("message", (e: MessageEvent<[number, File]>) => {
    const [index, data] = e.data;
    setEncodedArchive((current) => {
      const newOne = [...current];
      newOne[index] = data;
      return newOne;
    });
  });

  function preventDefaults<E, C, T>(event: React.BaseSyntheticEvent<E, C, T>) {
    event.preventDefault();
    event.stopPropagation();
  }
  function handleDrop<E>(event: React.DragEvent<E>) {
    preventDefaults(event);
    const files = event.dataTransfer.files;
    addItems(Array.from(files));
  }
  function addItems(files: File[]) {
    let a = files.at(0);
    if (a === undefined) {
      return;
    }
    worker.postMessage([a, "auto"]);
  }
  return (
    <>
      <div className={styles["container"]}>
        <p className={styles["disclaimer"]}>
          ※
          本ツールはWebAssemblyを用いており、ファイルの処理はすべてローカル（お使いの端末上）で実行されます。外部サーバーへの送信は一切ありません。
        </p>
        <h1 className={styles["title"]}>ZIPファイルの文字化けを直す</h1>
        <p className={styles["description"]}>
          文字化けしたZIPファイルのファイル名を修正して、正しく開けるように変換します。
        </p>
        <div
          className={styles["upload-area"]}
          onDragEnter={preventDefaults}
          onDragLeave={preventDefaults}
          onDragOver={preventDefaults}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className={styles["icon"]}>📦</div>
          <div>ここにZIPファイルをドラッグするか、クリックして選択</div>
        </div>
        <input
          ref={inputRef}
          type="file"
          id="fileInput"
          accept=".zip"
          style={{ display: "none" }}
          onChange={(event) => {
            const files = event.target.files;
            files && addItems(Array.from(files));
          }}
        />
        {/* 
        <label htmlFor="mode" className={styles["label"]}>
          変換モード
        </label>
        <select id="mode" className={styles["select"]}>
          <option value="auto">自動判別（おすすめ）</option>
          <option value="sjis">Shift_JIS → UTF-8</option>
          <option value="eucjp">EUC-JP → UTF-8</option>
        </select>
         */}
        {encoedArchive.map((it) => {
          return (
            <a
              key={it.name}
              className={styles["button"]}
              href={URL.createObjectURL(it)}
              download={it.name}
            >
              文字化けを修正したZIPをダウンロード
            </a>
          );
        })}
      </div>
      <footer className={styles["footer"]}>
        {/* 
        <a href="#" className={styles["footer-link"]}>
          <img src="https://via.placeholder.com/16" alt="Laboc Icon" />
          Laboc.inc
        </a>
         */}
        <a
          href="https://github.com/laboctsunekawa/fix-mojibake-zip"
          className={styles["footer-link"]}
          target="_blank"
          rel="noopener noreferrer"
        >
          <img
            src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
            alt="GitHub"
          />
          ソースコード
        </a>
      </footer>
    </>
  );
}
