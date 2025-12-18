import { createRoom } from "@/pages/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/authStore";
import { Separator } from "@radix-ui/react-separator";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";

export default function TeacherDashboard() {
  const [lessonName, setLessonName] = useState("");
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: createRoom,
    onSuccess: (res) => {
      const roomId = res.data.id;
      toast.success("Lesson created!");
      navigate(`/teacher/lessons/${roomId}`);
    },
    onError: () => toast.error("Failed to create lesson"),
  });

  const handleCreateLesson = () => {
    const teacherId = user?.id;
    console.log(teacherId);
    if (!teacherId) {
      toast.error("No teacher id provided");
      return;
    }
    if (!lessonName.trim()) return toast.error("Lesson name required");

    mutation.mutate({ name: lessonName, teacherId });
  };

  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-b from-background via-background to-muted px-4 py-10">
      <Card className="w-full max-w-xl border border-border/70 shadow-xl shadow-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Teacher dashboard
          </CardTitle>
          <CardDescription>
            Create a new live lesson and share it with your students.
          </CardDescription>
        </CardHeader>

        <Separator className="my-2" />

        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Lesson name</Label>
              <Input
                placeholder="Intro to English conversation"
                value={lessonName}
                onChange={(e) => setLessonName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Pick something your students will immediately recognize.
              </p>
            </div>

            <Button
              className="w-full rounded-full py-2 text-base font-semibold shadow-md shadow-primary/30"
              onClick={handleCreateLesson}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Creating lesson…" : "Create lesson"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
