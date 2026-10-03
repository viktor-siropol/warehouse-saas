"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

type DownloadCsvButtonProps = {
  fileName: string;

  csv: string;

  label?: string;
};

export function DownloadCsvButton({
  fileName,
  csv,
  label = "Download CSV",
}: DownloadCsvButtonProps) {
  function download(): void {
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const anchor = document.createElement("a");

    anchor.href = url;

    anchor.download = fileName;

    document.body.appendChild(anchor);

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <Button type="button" variant="outline" onClick={download}>
      <Download className="size-4" />

      {label}
    </Button>
  );
}
