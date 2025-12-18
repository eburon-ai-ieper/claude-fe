import api from "@/api/axiosInstance";
import { socket } from "@/lib/socket";
import { useAuthStore } from "@/stores/authStore";
import { useChatSettings } from "@/stores/chatSettings";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { float32ToPCM16, PCMPlayer } from "@/audio/pcm";
import { toast } from "sonner";
import CopyLessonLink from "@/components/CopyLessonLink";
import type { Message } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TeacherLessonPage = () => {
  //lesson id
  const { id } = useParams<{ id: string }>();
  const [recording, setRecording] = useState(false);
  const [messages, setMessages] = useState<
    {
      senderId: number;
      original: string;
      translated: string;
      createdAt: Date;
    }[]
  >([]);
  const [text, setText] = useState("");
  const [showShare, setShowShare] = useState(true);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playerRef = useRef<PCMPlayer | null>(null);
  const lastSpeakerRef = useRef<string | null>(null);

  const { language, setLanguage } = useChatSettings();
  const teacherId = useAuthStore().user?.id;
  console.log("teacher id is ", teacherId);

  useEffect(() => {
    if (!id) return;

    playerRef.current = new PCMPlayer(16000);

    const resumeAudio = () => {
      playerRef.current?.resume();
      document.removeEventListener("click", resumeAudio);
    };

    document.addEventListener("click", resumeAudio);

    socket.emit("joinRoom", {
      roomId: id,
      userId: teacherId,
      preferredLanguage: language,
    });

    socket.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on("voice:audio", (msg) => {
      console.log(msg);
      if (msg.senderId === teacherId) return;
      console.log(msg);
      if (!msg.audio || !playerRef.current) return;

      // 🔥 reset queue if speaker changed
      if (msg.senderId !== lastSpeakerRef.current) {
        playerRef.current.reset();
        lastSpeakerRef.current = msg.senderId;
      }
      playerRef.current.playChunk(msg.audio);
    });

    return () => {
      socket.off("newMessage");
      socket.off("voice:audio");
    };
  }, [id, language]);

  const sendMessage = () => {
    socket.emit("sendMessage", {
      roomId: id,
      content: text,
      senderId: teacherId,
    });
    setText("");
  };

  const startVoice = async () => {
    if (!id || !teacherId) return;

    setRecording(true);

    socket.emit("voice:start", {
      roomId: id,
      userId: teacherId,
      preferredLanguage: language,
    });

    streamRef.current = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    const audioCtx = new AudioContext({ sampleRate: 16000 });
    audioCtxRef.current = audioCtx;

    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    try {
      await audioCtx.audioWorklet.addModule("/pcm-worklet.js");
    } catch {
      toast.error(
        "Worklet error. Please enable microphone a bit later or try to reload the page"
      );
    }

    const source = audioCtx.createMediaStreamSource(streamRef.current);
    const worklet = new AudioWorkletNode(audioCtx, "pcm-worklet");

    worklet.port.onmessage = (e) => {
      const float32 = e.data as Float32Array;
      const pcm16 = float32ToPCM16(float32);
      socket.emit("voice:stream", { roomId: id, audio: pcm16.buffer });
    };
    source.connect(worklet);
  };

  const stopVoice = async () => {
    socket.emit("voice:stop", { roomId: id, language });

    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    await audioCtxRef.current?.close();
    audioCtxRef.current = null;

    setRecording(false);
  };

  const getLesson = async (lessonId: string) => {
    const { data } = await api.get(`teachers/rooms/${lessonId}`);
    return data;
  };
  const { data, isLoading, error } = useQuery({
    queryKey: ["teacher-lesson", id],
    queryFn: () => getLesson(id as string),
    enabled: !!id,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false, // Don't refetch when component remounts if cached
    retry: false,
  });

  console.log(data);

  if (!id)
    return (
      <div className="flex min-h-svh items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-lg">No lesson selected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              We could not find a lesson ID in the URL. Please go back and
              create or choose a lesson again.
            </p>
          </CardContent>
        </Card>
      </div>
    );

  if (isLoading)
    return (
      <div className="flex min-h-svh items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-lg">Loading lesson…</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Fetching lesson details and chat history.
            </p>
          </CardContent>
        </Card>
      </div>
    );

  if (error)
    return (
      <div className="flex min-h-svh items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-lg text-destructive">
              Failed to load lesson
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Something went wrong while loading the lesson. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );

  return (
    <div className="flex min-h-svh flex-col gap-6 bg-background px-4 py-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight">
            Teacher view
          </h3>
          <p className="text-sm text-muted-foreground">
            Control your lesson, share access with students, and follow the live
            translation.
          </p>
          <p className="mt-2 text-lg font-medium">{data?.name}</p>
        </div>

        <div className="flex flex-col gap-3">
          <Card className="w-full max-w-sm lg:w-[400px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Select Language
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={language}
                onValueChange={(value) => setLanguage(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="nl">Dutch</SelectItem>
                  <SelectItem value="uk">Ukrainian</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="ru">Russian</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                  <SelectItem value="zh">Chinese (Simplified)</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                  <SelectItem value="sv">Swedish</SelectItem>
                  <SelectItem value="pl">Polish</SelectItem>
                  <SelectItem value="tr">Turkish</SelectItem>
                  <SelectItem value="fi">Finnish</SelectItem>
                  <SelectItem value="no">Norwegian</SelectItem>
                  <SelectItem value="da">Danish</SelectItem>
                  <SelectItem value="cs">Czech</SelectItem>
                  <SelectItem value="ro">Romanian</SelectItem>
                  <SelectItem value="el">Greek</SelectItem>
                  <SelectItem value="he">Hebrew</SelectItem>
                  <SelectItem value="th">Thai</SelectItem>
                  <SelectItem value="id">Indonesian</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="w-full max-w-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Student access
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowShare((prev) => !prev)}
              >
                {showShare ? "Hide" : "Show"}
              </Button>
            </CardHeader>
            {showShare && (
              <CardContent className="space-y-3">
                <CopyLessonLink lessonId={id} />
                <div className="overflow-hidden rounded-md border bg-muted/40 p-2">
                  <img
                    src={data.qr}
                    alt="qr code"
                    className="mx-auto h-40 w-40 object-contain"
                  />
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Voice controls */}
        <Card className="order-2 h-fit lg:order-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Voice translation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Start speaking and the system will automatically stream and
              translate your voice for all participants.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {!recording ? (
                <Button
                  size="lg"
                  className="rounded-full px-6 py-2 text-base font-semibold shadow-md shadow-primary/30"
                  onClick={startVoice}
                >
                  <span className="mr-2 inline-flex size-3 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
                  Start speaking
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full px-6 py-2 text-base font-semibold shadow-md shadow-destructive/30"
                  onClick={stopVoice}
                >
                  <span className="mr-2 inline-flex size-3 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.8)]" />
                  Stop speaking
                </Button>
              )}
              <span className="text-xs text-muted-foreground">
                {recording
                  ? "Microphone is live and streaming audio."
                  : "Click to start streaming your voice."}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Chat */}
        <Card className="order-1 flex min-h-[60vh] flex-col lg:order-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Live chat</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-3">
            <div className="flex-1 overflow-auto rounded-md border bg-muted/30 p-3">
              {data.chatMessages.map((m: Message, i: number) => (
                <div
                  key={i}
                  className="mb-2 flex items-start justify-between gap-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      <span className="mr-1 text-xs font-semibold text-muted-foreground">
                        {m.senderId}
                      </span>
                      {m.content}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs italic text-muted-foreground">
                    {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className="mb-2 flex items-start justify-between gap-3 text-sm"
                >
                  <div>
                    <p className="font-medium">
                      <span className="mr-1 text-xs font-semibold text-muted-foreground">
                        {m.senderId}
                      </span>
                      {m.translated}
                    </p>
                    <p className="mt-0.5 text-xs italic text-muted-foreground">
                      Original: {m.original}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs italic text-muted-foreground">
                    {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <form
              className="flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
            >
              <Input
                className="flex-1"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a message…"
              />
              <Button type="submit" className="sm:w-auto">
                Send
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherLessonPage;
