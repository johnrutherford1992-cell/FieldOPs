"use client";

import React, { useState, useRef, useEffect } from "react";
import { Plus, X, RotateCcw } from "lucide-react";

interface Signature {
  name: string;
  role: string;
  timestamp: string;
  signatureData: string;
}

interface SignaturePadProps {
  signatures: Signature[];
  onAddSignature: (sig: Signature) => void;
}

export default function SignaturePad({
  signatures,
  onAddSignature,
}: SignaturePadProps) {
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize canvas on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && showModal) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Set canvas display size
        canvas.width = 300;
        canvas.height = 150;
        // Clear to white
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [showModal]);

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x: number, y: number;

    if ("touches" in e) {
      const touch = e.touches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x: number, y: number;

    if ("touches" in e) {
      const touch = e.touches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handleSaveSignature = () => {
    if (!name.trim() || !role.trim()) {
      alert("Please enter both name and role");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      alert("Canvas not found");
      return;
    }

    const signatureData = canvas.toDataURL("image/png");
    const timestamp = new Date().toISOString();

    const newSignature: Signature = {
      name: name.trim(),
      role: role.trim(),
      timestamp,
      signatureData,
    };

    onAddSignature(newSignature);

    // Reset form
    setName("");
    setRole("");
    handleClearCanvas();
    setShowModal(false);
  };

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Header */}
      <div>
        <h3 className="text-field-lg font-semibold text-onyx mb-4">
          Crew Sign-Off
        </h3>

        {/* Signatures List */}
        {signatures.length === 0 ? (
          <div className="text-center py-8 text-warm-gray">
            <p className="text-field-base">No signatures yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {signatures.map((sig, index) => (
              <div
                key={index}
                className="p-4 rounded-card bg-surface-elevated border border-gray-200"
              >
                <div className="flex items-start gap-4">
                  {/* Signature Preview */}
                  <div className="flex-shrink-0 w-20 h-10 rounded-md border border-gray-300 bg-white overflow-hidden">
                    <img
                      src={sig.signatureData}
                      alt={`Signature by ${sig.name}`}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-field-base font-semibold text-onyx">
                      {sig.name}
                    </div>
                    <div className="text-field-sm text-warm-gray mt-1">
                      {sig.role}
                    </div>
                    <div className="text-xs text-warm-gray mt-1">
                      {formatTime(sig.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Signature Button */}
      <button
        onClick={() => setShowModal(true)}
        className="
          w-full min-h-[56px] rounded-card bg-onyx text-white
          font-semibold font-body text-field-base transition-all
          hover:bg-slate active:scale-[0.98]
          flex items-center justify-center gap-2
        "
      >
        <Plus size={20} />
        <span>Add Signature</span>
      </button>

      {/* Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end animate-fade-in">
          <div className="w-full bg-white rounded-t-3xl p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-heading font-bold text-onyx text-field-xl">
                Add Signature
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} className="text-onyx" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4">
              {/* Name Input */}
              <div>
                <label className="block text-field-base font-semibold text-onyx mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter crew member name"
                  className="
                    w-full px-4 py-3 rounded-card border border-gray-200
                    text-field-base font-body text-onyx
                    focus:outline-none focus:ring-2 focus:ring-onyx focus:border-transparent
                    placeholder-warm-gray
                  "
                />
              </div>

              {/* Role Input */}
              <div>
                <label className="block text-field-base font-semibold text-onyx mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Foreman, Superintendent, Safety Officer"
                  className="
                    w-full px-4 py-3 rounded-card border border-gray-200
                    text-field-base font-body text-onyx
                    focus:outline-none focus:ring-2 focus:ring-onyx focus:border-transparent
                    placeholder-warm-gray
                  "
                />
              </div>

              {/* Canvas */}
              <div>
                <label className="block text-field-base font-semibold text-onyx mb-2">
                  Signature
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-card bg-gray-50 p-0 overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-auto cursor-crosshair bg-white block"
                    style={{ display: "block", maxWidth: "100%" }}
                  />
                </div>
                <p className="text-xs text-warm-gray mt-2">
                  Draw your signature with mouse or touch
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClearCanvas}
                  className="
                    flex-1 min-h-[48px] rounded-card bg-alabaster text-onyx
                    font-semibold font-body text-field-base transition-all
                    hover:bg-gray-200 active:scale-[0.98]
                    flex items-center justify-center gap-2
                  "
                >
                  <RotateCcw size={18} />
                  <span>Clear</span>
                </button>

                <button
                  onClick={handleSaveSignature}
                  className="
                    flex-1 min-h-[48px] rounded-card bg-accent-green text-white
                    font-semibold font-body text-field-base transition-all
                    hover:bg-opacity-90 active:scale-[0.98]
                  "
                >
                  Save Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
