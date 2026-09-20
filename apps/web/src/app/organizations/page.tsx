import Link from "next/link";

import { ArrowRight, Boxes, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { logoutAction } from "@/features/auth/actions";

import { getCurrentUser } from "@/features/auth/get-current-user";

export default async function OrganizationsPage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-svh bg-muted/30">
      <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Boxes className="size-5" />
              </div>

              <span className="font-semibold">Warehouse</span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              Choose organization
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Signed in as {user.email}
            </p>
          </div>

          <form action={logoutAction}>
            <Button variant="outline" size="sm">
              <LogOut className="size-4" />
              Log out
            </Button>
          </form>
        </div>

        {user.memberships.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              You do not belong to any organization.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {user.memberships.map((membership) => (
              <Link
                key={membership.id}
                href={`/organizations/${membership.organization.id}`}
                prefetch={false}
              >
                <Card className="h-full transition-colors hover:bg-muted/40">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {membership.organization.name}
                    </CardTitle>

                    <CardDescription>{membership.role}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Open workspace
                    </span>

                    <ArrowRight className="size-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
