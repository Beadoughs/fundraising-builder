"use client";

import { Button } from "@/components/ui/Button";
import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";

export function CampaignSharePanel({
  slug,
  campaignName,
  campaignId,
}: {
  slug: string;
  campaignName: string;
  campaignId: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [publicUrl, setPublicUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const url = `${window.location.origin}/c/${slug}`;
    setPublicUrl(url);
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 200,
        margin: 2,
        color: { dark: "#1a1a2e", light: "#ffffff" },
      });
    }
  }, [slug]);

  async function copyLink() {
    if (!publicUrl) return;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadQr() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${slug}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="rounded-xl border border-green-200 bg-green-50/50 p-6">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700">
          ✓
        </span>
        <h2 className="text-lg font-semibold text-gray-900">
          {campaignName} is live!
        </h2>
      </div>
      <p className="mb-6 text-sm text-gray-600">
        Share this link or QR code so supporters can start ordering.
      </p>

      <div className="grid gap-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            Your fundraiser link
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              readOnly
              value={publicUrl}
              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800"
            />
            <Button type="button" onClick={copyLink} variant="secondary">
              {copied ? "Copied!" : "Copy link"}
            </Button>
          </div>
          <Link
            href={`/c/${slug}`}
            target="_blank"
            className="mt-3 inline-block text-sm font-medium text-brand hover:underline"
          >
            Open live page →
          </Link>
          <Link
            href={`/dashboard/campaigns/${campaignId}/edit`}
            className="mt-2 block text-sm font-medium text-gray-600 hover:text-brand"
          >
            Edit fundraiser →
          </Link>
        </div>

        <div className="flex flex-col items-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
            QR code
          </p>
          <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
            <canvas ref={canvasRef} />
          </div>
          <button
            type="button"
            onClick={downloadQr}
            className="mt-3 text-sm font-medium text-gray-600 hover:text-brand"
          >
            Download QR code
          </button>
        </div>
      </div>
    </div>
  );
}
