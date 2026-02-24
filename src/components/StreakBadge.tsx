import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Flame } from "lucide-react";

export function StreakBadge() {
  const { user } = useAuth();
  const [streakWeeks, setStreakWeeks] = useState(0);
  const [thisWeekCount, setThisWeekCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchStreak();
  }, [user]);

  const fetchStreak = async () => {
    try {
      const { data } = await (supabase.from("user_streaks") as any)
        .select("week_start, analysis_count")
        .eq("user_id", user!.id)
        .order("week_start", { ascending: false })
        .limit(12);

      if (!data?.length) return;

      // Count consecutive weeks
      let consecutive = 0;
      const today = new Date();
      const currentWeekStart = getWeekStart(today);

      for (let i = 0; i < data.length; i++) {
        const weekDate = new Date(data[i].week_start);
        const expectedWeek = new Date(currentWeekStart);
        expectedWeek.setDate(expectedWeek.getDate() - i * 7);

        if (weekDate.toISOString().slice(0, 10) === expectedWeek.toISOString().slice(0, 10)) {
          consecutive++;
        } else {
          break;
        }
      }

      setStreakWeeks(consecutive);
      // This week's count
      const thisWeek = data.find(
        (d: any) => d.week_start === currentWeekStart.toISOString().slice(0, 10)
      );
      setThisWeekCount(thisWeek?.analysis_count || 0);
    } catch (err) {
      console.error("Failed to fetch streak:", err);
    }
  };

  if (streakWeeks === 0) return null;

  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
      style={{
        background: "hsl(25 95% 53% / 0.1)",
        color: "hsl(25 95% 45%)",
        border: "1px solid hsl(25 95% 53% / 0.2)",
      }}
    >
      <Flame size={13} style={{ color: "hsl(25 95% 53%)" }} />
      Week {streakWeeks} streak
      {thisWeekCount > 0 && (
        <span className="text-[10px] font-medium" style={{ color: "hsl(25 95% 53% / 0.7)" }}>
          · {thisWeekCount} this week
        </span>
      )}
    </div>
  );
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)); // Monday
  d.setHours(0, 0, 0, 0);
  return d;
}
