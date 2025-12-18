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
      if (!msg.audio || !playerRef.current) return;

      // 🔥 reset queue if speaker changed
      if (msg.senderId !== lastSpeakerRef.current) {
        playerRef.current.reset();
        lastSpeakerRef.current = msg.senderId;
      }

      if (msg.senderId === teacherId) return;
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

  if (!id) return <h1>No Lesson ID available</h1>;
  if (isLoading) return <h1>Loading lesson...</h1>;
  if (error) return <h1>Failed to load lesson</h1>;

  return (
    <div className="p-6">
      <h3 className="text-3xl font-bold">Teacher Page</h3>
      <h1 className="text-2xl font-semibold">{data?.name}</h1>
      <CopyLessonLink lessonId={id} />
      <img src={data.qr} alt="qr code" />

      <Select value={language} onValueChange={(value) => setLanguage(value)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="nl">Dutch</SelectItem>
          <SelectItem value="uk">Ukrainian</SelectItem>
        </SelectContent>
      </Select>

      <div>
        <div className="border p-3 h-60 overflow-auto">
          {data.chatMessages.map((m: Message, i: number) => (
            <div key={i} className="mb-2 flex items-center justify-between">
              <b>
                {m.senderId}:{m.content}
              </b>
              <p className="text-xs text-gray-500 italic ml-6">
                {new Date(m.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
          {messages.map((m, i) => (
            <div key={i} className="mb-2 flex justify-between items-center">
              <div>
                <b>{m.senderId}:</b> {m.translated}
                <p className="text-xs text-gray-500 italic ml-6">
                  Original: {m.original}
                </p>
              </div>
              <p className="text-xs text-gray-500 italic ml-6">
                {new Date(m.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        <input
          className="border p-2 mt-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message..."
        />
        <button
          className="ml-2 p-2 bg-blue-500 text-white"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>

      {/* 🎤 VOICE CONTROLS */}
      <div className="mt-4">
        {!recording ? (
          <button className="p-2 bg-green-500 text-white" onClick={startVoice}>
            Start Voice Translation
          </button>
        ) : (
          <button className="p-2 bg-red-500 text-white" onClick={stopVoice}>
            Stop Voice Translation
          </button>
        )}
      </div>
    </div>
  );
};

export default TeacherLessonPage;
