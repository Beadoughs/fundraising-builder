"use client";

import { Button } from "@/components/ui/Button";
import { SafeImage } from "@/components/SafeImage";
import { FieldGroup, Label } from "@/components/ui/Form";
import { useRef, useState } from "react";

const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;

export function ImageUpload({
  value,
  onChange,
  label = "Image",
}: {
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG, PNG, etc.)");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image must be under 1.5MB");
      return;
    }

    setUploading(true);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      onChange(dataUrl);
    } catch {
      setError("Could not read image. Try a different file.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <FieldGroup>
      <Label>{label}</Label>
      <div className="flex items-start gap-4">
        {value ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200">
            <SafeImage src={value} alt="" fill className="object-cover" />
          </div>
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 text-gray-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        <div className="flex-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Adding…" : value ? "Change image" : "Add image"}
          </Button>
          {value && (
            <button
              type="button"
              className="ml-3 text-sm text-gray-500 hover:text-red-600"
              onClick={() => onChange("")}
            >
              Remove
            </button>
          )}
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <p className="mt-2 text-xs text-gray-400">JPG or PNG, max 1.5MB</p>
        </div>
      </div>
    </FieldGroup>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Invalid file"));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
