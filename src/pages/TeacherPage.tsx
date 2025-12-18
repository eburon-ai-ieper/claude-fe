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
    <div className="flex justify-center mt-12">
      <Card className="w-full max-w-lg p-4">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Teacher Dashboard</CardTitle>
          <CardDescription>Create & manage lessons</CardDescription>
        </CardHeader>

        <Separator className="my-4" />

        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label>Lesson Name</Label>
              <Input
                placeholder="Enter lesson name..."
                value={lessonName}
                onChange={(e) => setLessonName(e.target.value)}
              />
            </div>

            <Button className="w-full" onClick={handleCreateLesson}>
              {mutation.isPending ? "Creating..." : "Create Lesson"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
