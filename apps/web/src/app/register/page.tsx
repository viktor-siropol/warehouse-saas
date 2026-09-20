import { Boxes } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { RegisterForm } from "@/features/auth/components/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Boxes className="size-5" />
          </div>

          <span className="text-lg font-semibold tracking-tight">
            Warehouse
          </span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create your workspace</CardTitle>

            <CardDescription>
              Create an owner account and your first organization.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
