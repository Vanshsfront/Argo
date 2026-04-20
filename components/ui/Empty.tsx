import { ReactNode } from "react";
import { Card, CardContent } from "./Card";

export function Empty({ title, description, action, icon }: { title: string; description?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <Card>
      <CardContent className="py-12 flex flex-col items-center text-center gap-2">
        {icon && <div className="mb-2 text-text-tertiary">{icon}</div>}
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        {description && <p className="text-xs text-text-secondary max-w-sm">{description}</p>}
        {action && <div className="mt-3">{action}</div>}
      </CardContent>
    </Card>
  );
}
