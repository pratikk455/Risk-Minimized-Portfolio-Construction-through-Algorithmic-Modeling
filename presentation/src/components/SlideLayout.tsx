"use client";

import { ReactNode } from "react";

type SlideLayoutProps = {
  children: ReactNode;
  index: number;
  total: number;
  title: string;
};

export default function SlideLayout({ children }: SlideLayoutProps) {
  return (
    <div className="relative h-full w-full">
      <div className="flex h-full w-full items-center justify-center px-12 md:px-20">
        {children}
      </div>
    </div>
  );
}
