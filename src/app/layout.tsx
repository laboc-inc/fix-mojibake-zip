import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ZIPファイルの文字化け修正ツール",
  description:
    "ZIPファイルに含まれるファイルのファイル名の文字化けを修正するツールです",
  keywords: [
    "ZIP 文字化け",
    "ZIPファイル 修復",
    "Shift_JIS UTF-8 変換",
    "EUC-JP 文字コード変換",
    "文字コード 修正ツール",
    "日本語 ZIP 解凍",
    "ZIP 文字化け 解決",
    "ファイル名 文字化け 修正",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="shortcut icon" type="image/svg+xml" href="favicon.svg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
