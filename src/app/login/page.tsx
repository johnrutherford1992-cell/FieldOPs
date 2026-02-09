"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { db, getAllUsers, verifyPin, setUserPin, seedDefaultUsers } from "@/lib/db";
import { USER_ROLE_LABELS } from "@/lib/types";
import type { AppUser } from "@/lib/types";
import { DEMO_PROJECT } from "@/data/demo-project";
import {
  HardHat,
  ChevronRight,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

type LoginStep = "select-user" | "enter-pin" | "set-pin";

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser, currentUser } = useAppStore();

  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<LoginStep>("select-user");
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [showPin, setShowPin] = useState(false);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      router.replace("/select-project");
    }
  }, [currentUser, router]);

  // Load users and seed if needed
  useEffect(() => {
    async function init() {
      // Ensure demo project exists
      const projectCount = await db.projects.count();
      if (projectCount === 0) {
        await db.projects.put(DEMO_PROJECT);
      }

      // Seed default users
      await seedDefaultUsers(DEMO_PROJECT.id);

      const allUsers = await getAllUsers();
      setUsers(allUsers);
      setLoading(false);
    }
    init();
  }, []);

  // Focus PIN input when step changes
  useEffect(() => {
    if ((step === "enter-pin" || step === "set-pin") && pinInputRef.current) {
      pinInputRef.current.focus();
    }
  }, [step]);

  const handleUserSelect = (user: AppUser) => {
    setSelectedUser(user);
    setPin("");
    setConfirmPin("");
    setError("");

    if (user.pinSet) {
      setStep("enter-pin");
    } else {
      setStep("set-pin");
    }
  };

  const handlePinSubmit = async () => {
    if (!selectedUser) return;

    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }

    const valid = await verifyPin(selectedUser.id, pin);
    if (valid) {
      setCurrentUser(selectedUser);
      router.replace("/select-project");
    } else {
      setError("Incorrect PIN");
      setPin("");
    }
  };

  const handleSetPin = async () => {
    if (!selectedUser) return;

    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }

    if (pin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    await setUserPin(selectedUser.id, pin);
    // Refresh the user data
    const updatedUsers = await getAllUsers();
    const updatedUser = updatedUsers.find((u) => u.id === selectedUser.id);
    if (updatedUser) {
      setCurrentUser(updatedUser);
    }
    router.replace("/select-project");
  };

  const handleBack = () => {
    setStep("select-user");
    setSelectedUser(null);
    setPin("");
    setConfirmPin("");
    setError("");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-onyx flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-onyx flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center pt-16 pb-8 px-6">
        <img
          src="/logos/blackstone-white.png"
          alt="Blackstone Construction"
          className="w-40 mb-3 opacity-90"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <h1 className="font-heading text-3xl font-bold text-white tracking-tight">
          FieldOps
        </h1>
        <p className="text-white/50 text-sm mt-1">Field Intelligence Platform</p>
      </div>

      {/* Content Card */}
      <div className="flex-1 bg-white rounded-t-3xl px-6 pt-8 pb-safe-bottom">
        {/* Step 1: Select User */}
        {step === "select-user" && (
          <>
            <h2 className="font-heading text-xl font-semibold text-onyx mb-1">
              Who&apos;s logging in?
            </h2>
            <p className="text-field-sm text-warm-gray mb-6">
              Select your name to continue
            </p>

            <div className="space-y-2">
              {users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-xl bg-alabaster hover:bg-gray-200 transition-colors text-left active:scale-[0.98]"
                >
                  <div className="flex-shrink-0 w-11 h-11 bg-onyx rounded-full flex items-center justify-center">
                    <span className="text-white font-heading font-bold text-sm">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-field-base text-onyx">
                      {user.name}
                    </p>
                    <p className="text-field-sm text-warm-gray">
                      {USER_ROLE_LABELS[user.role]}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {user.pinSet && <Lock size={14} className="text-warm-gray" />}
                    <ChevronRight size={20} className="text-warm-gray" />
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Enter PIN */}
        {step === "enter-pin" && selectedUser && (
          <>
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-warm-gray text-sm mb-6 active:text-onyx transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="flex-shrink-0 w-12 h-12 bg-onyx rounded-full flex items-center justify-center">
                <span className="text-white font-heading font-bold text-sm">
                  {selectedUser.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
              <div>
                <p className="font-heading font-semibold text-lg text-onyx">
                  {selectedUser.name}
                </p>
                <p className="text-field-sm text-warm-gray">
                  {USER_ROLE_LABELS[selectedUser.role]}
                </p>
              </div>
            </div>

            <label className="block text-field-sm font-semibold text-onyx mb-2">
              Enter your 4-digit PIN
            </label>
            <div className="relative mb-4">
              <input
                ref={pinInputRef}
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setPin(val);
                  setError("");
                }}
                placeholder="____"
                inputMode="numeric"
                maxLength={4}
                className="w-full px-4 py-4 rounded-xl border border-gray-200 font-heading text-2xl text-center tracking-[0.5em] text-onyx placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-onyx"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && pin.length === 4) handlePinSubmit();
                }}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray"
              >
                {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && (
              <p className="text-accent-red text-field-sm font-semibold mb-4">{error}</p>
            )}

            <button
              onClick={handlePinSubmit}
              disabled={pin.length !== 4}
              className="w-full min-h-touch-target rounded-xl bg-onyx text-white font-body font-semibold text-field-base py-3.5 transition-all active:scale-[0.98] disabled:opacity-40"
            >
              Sign In
            </button>
          </>
        )}

        {/* Step 3: Set PIN (first time) */}
        {step === "set-pin" && selectedUser && (
          <>
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-warm-gray text-sm mb-6 active:text-onyx transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-shrink-0 w-12 h-12 bg-onyx rounded-full flex items-center justify-center">
                <HardHat size={24} className="text-white" />
              </div>
              <div>
                <p className="font-heading font-semibold text-lg text-onyx">
                  Welcome, {selectedUser.name.split(" ")[0]}!
                </p>
                <p className="text-field-sm text-warm-gray">
                  Set up your 4-digit PIN to secure your account
                </p>
              </div>
            </div>

            <label className="block text-field-sm font-semibold text-onyx mb-2">
              Create a PIN
            </label>
            <div className="relative mb-4">
              <input
                ref={pinInputRef}
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  setPin(val);
                  setError("");
                }}
                placeholder="____"
                inputMode="numeric"
                maxLength={4}
                className="w-full px-4 py-4 rounded-xl border border-gray-200 font-heading text-2xl text-center tracking-[0.5em] text-onyx placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-onyx"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-warm-gray"
              >
                {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <label className="block text-field-sm font-semibold text-onyx mb-2">
              Confirm PIN
            </label>
            <input
              type={showPin ? "text" : "password"}
              value={confirmPin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                setConfirmPin(val);
                setError("");
              }}
              placeholder="____"
              inputMode="numeric"
              maxLength={4}
              className="w-full px-4 py-4 rounded-xl border border-gray-200 font-heading text-2xl text-center tracking-[0.5em] text-onyx placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-onyx mb-4"
              onKeyDown={(e) => {
                if (e.key === "Enter" && pin.length === 4 && confirmPin.length === 4)
                  handleSetPin();
              }}
            />

            {error && (
              <p className="text-accent-red text-field-sm font-semibold mb-4">{error}</p>
            )}

            <button
              onClick={handleSetPin}
              disabled={pin.length !== 4 || confirmPin.length !== 4}
              className="w-full min-h-touch-target rounded-xl bg-onyx text-white font-body font-semibold text-field-base py-3.5 transition-all active:scale-[0.98] disabled:opacity-40"
            >
              Set PIN &amp; Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
