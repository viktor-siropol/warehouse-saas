import { Badge } from "@/components/ui/badge";

import { Separator } from "@/components/ui/separator";

import { SidebarTrigger } from "@/components/ui/sidebar";

type AppHeaderProps = {
  organizationName: string;
  role: string;
};

export function AppHeader({ organizationName, role }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <SidebarTrigger className="-ml-1" />

      <Separator orientation="vertical" className="h-4" />

      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{organizationName}</p>
      </div>

      <div className="ml-auto">
        <Badge variant="outline" className="font-normal">
          {role}
        </Badge>
      </div>
    </header>
  );
}
