"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import { useAppStore } from "@/lib/store";

export default function SettingsPage() {
  const { claudeApiKey, setClaudeApiKey } = useAppStore();
  const [apiKeyInput, setApiKeyInput] = useState(claudeApiKey);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setApiKeyInput(value);
    setClaudeApiKey(value);
  };

  return (
    <AppShell>
      <div className="screen">
        <Header title="Settings" backHref="/" />

        {/* Claude API Key Section */}
        <div className="px-5 pt-6">
          <h3 className="font-heading text-sm font-semibold text-onyx mb-3">
            Claude API Key
          </h3>

          <input
            type="password"
            value={apiKeyInput}
            onChange={handleApiKeyChange}
            placeholder="sk-ant-..."
            className="field-input w-full px-4 py-3 rounded-lg border border-white/[0.06] bg-glass font-body text-field-sm placeholder-warm-gray focus:outline-none focus:border-accent-violet focus:ring-1 focus:ring-accent-violet transition-colors"
          />

          <p className="text-warm-gray text-field-sm font-body mt-2">
            Enter your Anthropic API key to enable AI features. Get one at{" "}
            <a
              href="https://console.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-violet underline hover:text-onyx"
            >
              console.anthropic.com
            </a>
          </p>
        </div>

        {/* User Profile Section */}
        <div className="px-5 pt-8">
          <h3 className="font-heading text-sm font-semibold text-onyx mb-4">
            User Profile
          </h3>

          <div className="bg-glass border border-white/[0.06] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-accent-violet rounded-full flex items-center justify-center text-white font-heading font-semibold">
                JR
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-heading text-sm font-semibold text-onyx">
                  John Rutherford
                </h4>
                <p className="text-field-sm text-warm-gray font-body">
                  PM • john@blackstone.build
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="px-5 pt-8 pb-8">
          <h3 className="font-heading text-sm font-semibold text-onyx mb-4">
            About
          </h3>

          <div className="text-center">
            <p className="font-heading text-field-sm font-medium text-onyx">
              FieldOps v0.1.0 — Prototype
            </p>
            <p className="text-field-sm text-warm-gray font-body mt-2">
              Blackstone Construction, LLC
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
