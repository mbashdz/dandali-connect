"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, RefreshCw, Check, X, RotateCcw, Smartphone, Loader2 } from "lucide-react";
import { useAppSettings } from "@/contexts/app-settings-context";

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (file: File) => void;
  defaultFacingMode?: "user" | "environment";
}

export function CameraCaptureModal({
  isOpen,
  onClose,
  onCapture,
  defaultFacingMode = "environment",
}: CameraCaptureModalProps) {
  const { language } = useAppSettings();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const nativeInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<"user" | "environment">(defaultFacingMode);
  const [isStarting, setIsStarting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(
    async (mode: "user" | "environment") => {
      stopStream();
      setIsStarting(true);
      setCameraError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          language === "ha"
            ? "Na'urar ka ba ta goyan bayan kamara kai tsaye. Yi amfani da maballin Kamarar Waya a kasa."
            : "Live camera is not supported in this view. Tap 'Use Phone Camera' below."
        );
        setIsStarting(false);
        return;
      }

      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          await videoRef.current.play().catch(() => {});
        }
      } catch (err: any) {
        console.warn("[CameraCaptureModal] Camera access error:", err);
        setCameraError(
          language === "ha"
            ? "An kasa bude kamara. Da fatan za a ba da izinin kamara ko danna 'Kamarar Waya'."
            : "Could not access live camera. Please grant camera permission or tap 'Use Phone Camera' below."
        );
      } finally {
        setIsStarting(false);
      }
    },
    [language, stopStream]
  );

  useEffect(() => {
    if (isOpen && !capturedDataUrl) {
      startCamera(facingMode);
    } else if (!isOpen) {
      stopStream();
      setCapturedDataUrl(null);
      setCapturedFile(null);
      setCameraError(null);
    }
    return () => {
      stopStream();
    };
  }, [isOpen, facingMode, capturedDataUrl, startCamera, stopStream]);

  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const handleTakePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 180);

    // Mirror horizontally if front selfie camera
    if (facingMode === "user") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedDataUrl(dataUrl);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `zaure_photo_${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          setCapturedFile(file);
        }
      },
      "image/jpeg",
      0.9
    );

    stopStream();
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
    setCapturedFile(null);
  };

  const handleConfirmPhoto = () => {
    if (capturedFile) {
      onCapture(capturedFile);
      onClose();
    }
  };

  const handleNativeCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onCapture(e.target.files[0]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-black text-white border-zinc-800 rounded-3xl shadow-2xl">
        <DialogHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-white/10 bg-zinc-950">
          <DialogTitle className="text-sm font-bold flex items-center gap-2 text-white">
            <Camera className="w-4 h-4 text-primary" />
            {language === "ha" ? "Dauki Hoto (Camera)" : "Take a Picture"}
          </DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full text-zinc-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        {/* Hidden canvas & fallback native camera input */}
        <canvas ref={canvasRef} className="hidden" />
        <input
          ref={nativeInputRef}
          type="file"
          accept="image/*"
          capture={facingMode === "user" ? "user" : "environment"}
          onChange={handleNativeCameraChange}
          className="hidden"
        />

        {/* Camera Viewfinder or Captured Preview */}
        <div className="relative aspect-[3/4] w-full bg-zinc-900 flex items-center justify-center overflow-hidden">
          {isFlashing && (
            <div className="absolute inset-0 bg-white z-30 animate-fade-out pointer-events-none" />
          )}

          {capturedDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capturedDataUrl}
              alt="Captured preview"
              className="w-full h-full object-contain bg-black"
            />
          ) : cameraError ? (
            <div className="p-6 text-center space-y-4 max-w-xs">
              <div className="w-14 h-14 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto">
                <Camera className="w-7 h-7" />
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">{cameraError}</p>
              <Button
                type="button"
                onClick={() => nativeInputRef.current?.click()}
                className="w-full rounded-xl font-bold bg-primary text-primary-foreground gap-2"
              >
                <Smartphone className="w-4 h-4" />
                {language === "ha" ? "Bude Kamarar Waya" : "Open Phone Camera"}
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === "user" ? "scale-x-[-1]" : ""
                }`}
              />
              {isStarting && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 z-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-xs text-zinc-300">
                    {language === "ha" ? "Ana bude kamara..." : "Starting camera..."}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Camera Controls Footer */}
        <div className="p-4 bg-zinc-950 border-t border-white/10">
          {capturedDataUrl ? (
            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleRetake}
                className="flex-1 rounded-2xl border-zinc-700 bg-zinc-900 text-white hover:bg-zinc-800 font-bold gap-2 h-11"
              >
                <RotateCcw className="w-4 h-4" />
                {language === "ha" ? "Sake Dauka" : "Retake"}
              </Button>
              <Button
                type="button"
                onClick={handleConfirmPhoto}
                className="flex-1 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2 h-11"
              >
                <Check className="w-4 h-4" />
                {language === "ha" ? "Yi Amfani da Hoto" : "Use Photo"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-2">
              {/* Native phone camera launcher option */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => nativeInputRef.current?.click()}
                className="rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-white/10 gap-1.5 h-10 px-3"
                title={language === "ha" ? "Kamarar Waya" : "System Camera"}
              >
                <Smartphone className="w-4 h-4 text-primary" />
                <span className="text-[11px] font-semibold">
                  {language === "ha" ? "Kamarar Waya" : "System App"}
                </span>
              </Button>

              {/* Main Shutter Button */}
              <button
                type="button"
                onClick={handleTakePhoto}
                disabled={isStarting || !!cameraError}
                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center p-1 hover:scale-105 active:scale-95 transition-transform disabled:opacity-40"
                aria-label="Take Photo"
              >
                <div className="w-full h-full rounded-full bg-white hover:bg-primary transition-colors" />
              </button>

              {/* Flip Front/Back Camera */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleToggleFacingMode}
                disabled={isStarting}
                className="h-10 w-10 rounded-full bg-white/10 text-white hover:bg-white/20"
                title={language === "ha" ? "Juya Kamara" : "Flip Camera"}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
