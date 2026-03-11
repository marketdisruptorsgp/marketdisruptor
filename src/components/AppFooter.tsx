import React from "react";
import { ShieldCheck, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const AppFooter = React.forwardRef<HTMLElement>(function AppFooter(_props, ref) {
  const { profile } = useAuth();

  return (
    <footer ref={ref} className="border-t border-border pb-20 md:pb-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
          <span className="flex items-center gap-1">
            <ShieldCheck size={11} /> Your data is encrypted & never shared
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:flex items-center gap-1">
            <BookOpen size={11} /> Analyses scoped to your account via RLS
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/pricing" className="font-semibold text-primary hover:underline py-1">
            Enterprise & Teams
          </a>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center px-4">
        {profile && (
          <p className="text-xs text-muted-foreground">
            Signed in as <strong className="text-foreground">{profile.first_name}</strong>
          </p>
        )}
      </div>
    </footer>
  );
}
