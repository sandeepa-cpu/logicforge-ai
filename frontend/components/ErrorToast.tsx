"use client";

import { useId } from "react";

import "./ErrorToast.css";

type ErrorToastProps = {
  message: string;
  open: boolean;
  onClose: () => void;
};

export default function ErrorToast({ message, open, onClose }: ErrorToastProps) {
  const titleId = useId();
  const visible = open && Boolean(message);

  return (
    <div
      role="alert"
      hidden={!visible}
      aria-labelledby={titleId}
      className="error-toast"
    >
      <div>
        <p id={titleId} className="error-toast__title">
          Could not generate the explanation
        </p>
        <p>{message}</p>
      </div>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
