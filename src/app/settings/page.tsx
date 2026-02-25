"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import Header from "@/components/layout/Header";
import { useAppStore } from "@/lib/store";
import { useTheme } from "@/components/layout/ThemeProvider";
import { Moon, Sun } from "lucide-react";

export default function SettingsPage() {
  const { claudeApiKey, setClaudeApiKey } = useAppStore();
  const [apiKeyInput, setApiKeyInput] = useState(claudeApiKey);
  const { theme, toggleTheme } = useTheme();

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setApiKeyInput(value);
    setClaudeApiKey(value);
  };

  return (
    <AppShell>
      <div className="screen">
        <Header title="Settings" backHref="/" />

        {/* Appearance Section */}
        <div className="px-5 pt-6">
          <h3 className="font-heading text-sm font-semibold text-onyx mb-3">
            Appearance
          </h3>

          <div className="bg-alabaster border border-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === "dark" ? (
                  <Moon className="w-5 h-5 text-onyx" />
                ) : (
                  <Sun className="w-5 h-5 text-onyx" />
                )}
                <div>
                  <p className="font-heading text-sm font-semibold text-onyx">
                    Dark Mode
                  </p>
                  <p className="text-xs text-warm-gray">
                    {theme === "dark" ? "On" : "Off"}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className={`
                  relative w-12 h-7 rounded-full transition-colors duration-200 cursor-pointer
                  ${theme === "dark" ? "bg-onyx" : "bg-gray-300"}
                `}
                aria-label="Toggle dark mode"
              >
                <span
                  className={`
                    absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-200
                    ${theme === "dark" ? "translate-x-5" : "translate-x-0"}
                  `}
                />
              </button>
            </div>
          </div>
        </div>

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
            className="field-input w-full px-4 py-3 rounded-lg border border-gray-100 bg-white font-body text-field-sm placeholder-warm-gray focus:outline-none focus:border-onyx focus:ring-1 focus:ring-onyx transition-colors"
          />

          <p className="text-warm-gray text-field-sm font-body mt-2">
            Enter your Anthropic API key to enable AI features. Get one at{" "}
            <a
              href="https://console.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-onyx underline hover:text-slate"
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

          <div className="bg-alabaster border border-gray-100 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-onyx rounded-full flex items-center justify-center text-white font-heading font-semibold">
                JR
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-heading text-sm font-semibold text-onyx">
                  John Rutherford
                </h4>
                <p className="text-field-sm text-warm-gray font-body">
                  PM &bull; john@blackstone.build
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
