/**
 * Client-side compression utilities
 * Images → ~100 KB WebP
 * Videos → compressed MP4 via ffmpeg.wasm (target 2-5 MB for short clips)
 */

"use client";

import imageCompression from "browser-image-compression";

export async function compressImage(
  file: File,
  targetKB: number = 100
): Promise<{ file: File; originalSize: number; compressedSize: number }> {
  const originalSize = file.size;

  const options = {
    maxSizeMB: targetKB / 1024, // convert KB to MB
    maxWidthOrHeight: 1280,
    useWebWorker: true,
    fileType: "image/webp" as const,
    initialQuality: 0.82,
    maxIteration: 12,
  };

  try {
    const compressed = await imageCompression(file, options);
    return {
      file: compressed,
      originalSize,
      compressedSize: compressed.size,
    };
  } catch (err) {
    console.warn("Image compression failed, using original:", err);
    return { file, originalSize, compressedSize: originalSize };
  }
}

/**
 * Compress multiple images in parallel
 */
export async function compressImages(
  files: FileList | File[],
  targetKB = 100
): Promise<{ file: File; originalSize: number; compressedSize: number }[]> {
  const list = Array.from(files);
  return Promise.all(list.map((f) => compressImage(f, targetKB)));
}

/**
 * Video compression using ffmpeg.wasm
 * Load core only when needed (large download ~25MB first time)
 */
import type { FFmpeg } from "@ffmpeg/ffmpeg";

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoading: Promise<FFmpeg> | null = null;

async function getFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance;
  if (ffmpegLoading) return ffmpegLoading;

  ffmpegLoading = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");

    const ffmpeg = new FFmpeg();
    const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
    });

    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return ffmpegLoading;
}

export type VideoCompressProgress = (ratio: number) => void;

export async function compressVideo(
  file: File,
  onProgress?: VideoCompressProgress
): Promise<{ file: File; originalSize: number; compressedSize: number }> {
  const originalSize = file.size;

  // Skip if already small (< 3 MB)
  if (originalSize < 3 * 1024 * 1024) {
    return { file, originalSize, compressedSize: originalSize };
  }

  try {
    const { fetchFile } = await import("@ffmpeg/util");
    const ffmpeg = await getFFmpeg();

    if (onProgress) {
      ffmpeg.on("progress", ({ progress }: { progress: number }) => {
        onProgress(Math.min(1, progress));
      });
    }

    const inputName = "input" + getExt(file.name);
    const outputName = "output.mp4";

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    // Balanced quality: 720p, CRF 28, fast preset
    await ffmpeg.exec([
      "-i", inputName,
      "-vf", "scale=-2:720",
      "-c:v", "libx264",
      "-crf", "28",
      "-preset", "veryfast",
      "-c:a", "aac",
      "-b:a", "96k",
      "-movflags", "+faststart",
      "-pix_fmt", "yuv420p",
      outputName,
    ]);

    const data = await ffmpeg.readFile(outputName);
    const buffer = typeof data === "string"
      ? new TextEncoder().encode(data)
      : new Uint8Array(data.slice());
    const blob = new Blob([buffer], { type: "video/mp4" });
    const compressed = new File(
      [blob],
      file.name.replace(/\.[^.]+$/, "") + "_compressed.mp4",
      { type: "video/mp4" }
    );

    // Cleanup
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    return {
      file: compressed,
      originalSize,
      compressedSize: compressed.size,
    };
  } catch (err) {
    console.warn("Video compression failed, using original:", err);
    return { file, originalSize, compressedSize: originalSize };
  }
}

function getExt(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i) : ".mp4";
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
