"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

export default function BackButton({ label = "Back", className = "" }: { label?: string; className?: string }) {
  const router = useRouter();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => router.back()}
      className={`inline-flex items-center gap-1 px-2 ${className}`}
    >
      <ChevronLeft className="w-4 h-4" />
      {label}
    </Button>
  );
}
