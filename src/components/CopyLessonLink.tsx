import { Check, Copy, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  lessonId: string;
};

export default function CopyLessonLink({ lessonId }: Props) {
  const [copied, setCopied] = useState(false);

  const lessonUrl = `${import.meta.env.VITE_FRONTEND_URL}/lessons/${lessonId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(lessonUrl);
      setCopied(true);
      toast.success("Lesson link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="flex items-center gap-2 text-sm">
        <LinkIcon className="w-4 h-4 text-muted-foreground" />
        <p className="break-all text-muted-foreground">{lessonUrl}</p>
      </div>

      <button
        onClick={handleCopy}
        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            Copied
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copy lesson link
          </>
        )}
      </button>
    </div>
  );
}
