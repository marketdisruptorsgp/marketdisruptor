import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Save, Check } from "lucide-react";

interface ProjectNotesEditorProps {
  value: string;
  onSave: (notes: string) => Promise<void>;
  lastUpdated?: string;
  compact?: boolean;
}

export function ProjectNotesEditor({ value, onSave, lastUpdated, compact }: ProjectNotesEditorProps) {
  const [text, setText] = useState(value);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setText(value); }, [value]);

  const handleSave = async () => {
    if (text === value) return;
    setSaving(true);
    await onSave(text);
    setSaving(false);
    setSaved(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-1.5">
      <Textarea
        value={text}
        onChange={e => { setText(e.target.value); setSaved(false); }}
        onBlur={handleSave}
        placeholder="Add project notes…"
        className={compact ? "min-h-[40px] text-xs" : "min-h-[60px] text-xs"}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving || text === value}
            className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors disabled:opacity-40"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            {saving ? <Save size={10} className="animate-pulse" /> : saved ? <Check size={10} /> : <Save size={10} />}
            {saving ? "Saving…" : saved ? "Saved" : "Save Notes"}
          </button>
        </div>
        {lastUpdated && (
          <span className="text-[9px] text-muted-foreground">
            Last edited {new Date(lastUpdated).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
