"use client";

import type { ReactNode } from "react";

type ScrollToFormButtonProps = {
  children: ReactNode;
  className?: string;
  targetId?: string;
};

export function ScrollToFormButton({
  children,
  className = "k21-btn-primary",
  targetId = "postulacion-form",
}: ScrollToFormButtonProps) {
  const handleClick = () => {
    const target = document.getElementById(targetId);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
