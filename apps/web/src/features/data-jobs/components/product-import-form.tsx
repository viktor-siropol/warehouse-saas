"use client";

import { useActionState, useEffect, useRef } from "react";

import { useRouter } from "next/navigation";

import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";

import { createProductImportJobAction } from "../actions";

import type { ProductImportActionState } from "../actions";

type ProductImportFormProps = {
  organizationId: string;
};

const INITIAL_STATE: ProductImportActionState = {
  status: "idle",

  message: "",

  jobId: null,
};

export function ProductImportForm({ organizationId }: ProductImportFormProps) {
  const router = useRouter();

  const formRef = useRef<HTMLFormElement>(null);

  const action = createProductImportJobAction.bind(null, organizationId);

  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }

    formRef.current?.reset();

    router.refresh();
  }, [state.status, state.jobId, router]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="product-import-file" className="text-sm font-medium">
          CSV file
        </label>

        <input
          id="product-import-file"
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          className="block w-full rounded-md border bg-background px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
        />

        <p className="text-xs text-muted-foreground">
          Maximum 2 MiB and 1,000 data rows.
        </p>
      </div>

      <Button type="submit" disabled={pending}>
        <Upload className="size-4" />

        {pending ? "Creating job…" : "Import products"}
      </Button>

      {state.status !== "idle" ? (
        <p
          className={
            state.status === "error"
              ? "text-sm text-destructive"
              : "text-sm text-muted-foreground"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
