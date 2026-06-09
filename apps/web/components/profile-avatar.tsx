"use client";

import { useState } from "react";
import Image from "next/image";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  src?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-11 w-11 text-xs",
  md: "h-16 w-16 text-sm",
  lg: "h-20 w-20 text-base"
};

function initialsFromName(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

export function ProfileAvatar({ src, name = "", size = "md", className }: ProfileAvatarProps) {
  const [broken, setBroken] = useState(false);
  const showImage = !!src && !broken;

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 font-semibold text-slate-500",
        sizeClasses[size],
        className
      )}
    >
      {showImage ? (
        <Image
          src={src}
          alt={name ? `${name} profile photo` : "Profile photo"}
          fill
          className="object-cover"
          unoptimized
          onError={() => setBroken(true)}
        />
      ) : name ? (
        <span aria-hidden="true">{initialsFromName(name)}</span>
      ) : (
        <User className="h-1/2 w-1/2 text-slate-400" aria-hidden="true" />
      )}
    </div>
  );
}
