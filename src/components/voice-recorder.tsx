"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, Trash2, Check, Radio } from "lucide-react";

interface VoiceRecorderProps {
  onAudioRecorded: (blob: Blob, duration: number) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onAudioRecorded, onCancel, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        recordedBlobRef.current = audioBlob;
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Unable to access microphone. Please check browser permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleConfirm = () => {
    if (recordedBlobRef.current) {
      onAudioRecorded(recordedBlobRef.current, recordingSeconds);
    }
  };

  const handleDiscard = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setRecordedAudioUrl(null);
    onCancel();
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/30 rounded-2xl w-full">
      {!isRecording && !recordedAudioUrl && (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-xs font-semibold text-foreground">
              Record voice note
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleDiscard} disabled={disabled}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={startRecording}
              className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 rounded-xl shadow"
            >
              <Mic className="w-4 h-4" /> Start Recording
            </Button>
          </div>
        </div>
      )}

      {isRecording && (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-xs font-bold text-red-600 dark:text-red-400">
              Recording: {formatTime(recordingSeconds)}
            </span>
            {/* Waveform indicator bars */}
            <div className="flex items-center gap-0.5 ml-2 h-4">
              {[40, 70, 30, 90, 60, 80, 45, 100, 50, 85].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-primary rounded-full animate-bounce"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${i * 80}ms`,
                  }}
                />
              ))}
            </div>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={stopRecording}
            className="rounded-xl gap-1.5"
          >
            <Square className="w-3.5 h-3.5 fill-current" /> Stop
          </Button>
        </div>
      )}

      {recordedAudioUrl && (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              className="w-8 h-8 rounded-full"
              onClick={togglePlayback}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </Button>
            <span className="text-xs font-semibold text-muted-foreground">
              Voice Note ({formatTime(recordingSeconds)})
            </span>
            <audio
              ref={audioPlayerRef}
              src={recordedAudioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              size="icon"
              variant="ghost"
              className="w-8 h-8 text-destructive rounded-full"
              onClick={handleDiscard}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={handleConfirm}
              className="bg-primary text-primary-foreground gap-1 rounded-xl text-xs"
            >
              <Check className="w-3.5 h-3.5" /> Attach
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
