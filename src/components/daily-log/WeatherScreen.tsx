"use client";

import React, { useState } from "react";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Snowflake,
  CloudFog,
  Plus,
  Minus,
  Check,
  ChevronDown,
} from "lucide-react";
import {
  DailyLogWeather,
  Subcontractor,
  WeatherImpact,
} from "@/lib/types";

interface WeatherScreenProps {
  weather: DailyLogWeather;
  onWeatherChange: (weather: DailyLogWeather) => void;
  subcontractors: Subcontractor[];
}

interface WeatherOption {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const weatherOptions: WeatherOption[] = [
  { id: "clear", label: "Clear", icon: <Sun size={24} /> },
  { id: "partly_cloudy", label: "Partly Cloudy", icon: <CloudSun size={24} /> },
  { id: "cloudy", label: "Cloudy", icon: <Cloud size={24} /> },
  { id: "rain", label: "Rain", icon: <CloudRain size={24} /> },
  { id: "thunderstorm", label: "Thunderstorm", icon: <CloudLightning size={24} /> },
  { id: "snow", label: "Snow", icon: <Snowflake size={24} /> },
  { id: "fog", label: "Fog", icon: <CloudFog size={24} /> },
];

export default function WeatherScreen({
  weather,
  onWeatherChange,
  subcontractors,
}: WeatherScreenProps) {
  const [temperatureUnit, setTemperatureUnit] = useState<"F" | "C">("F");
  const [showDetailedConditions, setShowDetailedConditions] = useState(false);

  // Handle weather condition selection
  const handleConditionChange = (conditionId: string) => {
    onWeatherChange({
      ...weather,
      conditions: conditionId,
    });
  };

  // Handle temperature input
  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const temp = value === "" ? 0 : parseInt(value, 10);
    onWeatherChange({
      ...weather,
      temperature: isNaN(temp) ? 0 : temp,
    });
  };

  // Handle impact selection
  const handleImpactChange = (impact: WeatherImpact) => {
    const updatedWeather: DailyLogWeather = {
      ...weather,
      impact,
    };

    // Set hoursLost based on impact type
    if (impact === "weather_day") {
      updatedWeather.hoursLost = 8;
    } else if (impact === "partial_delay") {
      updatedWeather.hoursLost = weather.hoursLost || 0.5;
    } else {
      updatedWeather.hoursLost = undefined;
    }

    onWeatherChange(updatedWeather);
  };

  // Handle hours lost adjustment (0.5 increment)
  const adjustHoursLost = (delta: number) => {
    const current = weather.hoursLost || 0.5;
    const newValue = Math.max(0.5, Math.min(8, current + delta));
    onWeatherChange({
      ...weather,
      hoursLost: Math.round(newValue * 2) / 2, // Ensure 0.5 increments
    });
  };

  // Handle affected trades toggle
  const toggleAffectedTrade = (subId: string) => {
    const currentTrades = weather.affectedTrades || [];
    const updated = currentTrades.includes(subId)
      ? currentTrades.filter((id) => id !== subId)
      : [...currentTrades, subId];
    onWeatherChange({
      ...weather,
      affectedTrades: updated,
    });
  };

  // Handle notes change
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onWeatherChange({
      ...weather,
      notes: e.target.value,
    });
  };

  const showAffectedTrades =
    weather.impact === "partial_delay" || weather.impact === "weather_day";

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 bg-alabaster min-h-screen">
      {/* Weather Conditions Section */}
      <section className="mb-8">
        <h2 className="font-heading text-lg font-medium text-onyx mb-4">
          Weather Conditions
        </h2>
        <div className="flex flex-wrap gap-3">
          {weatherOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleConditionChange(option.id)}
              className={`
                flex items-center gap-2 px-4 py-3 rounded-full min-h-[56px]
                transition-all duration-150 font-body text-field-base font-medium
                ${
                  weather.conditions === option.id
                    ? "bg-accent-violet text-white shadow-card-active"
                    : "bg-glass text-onyx border border-gray-100 hover:border-gray-200"
                }
              `}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {/* Temperature Section */}
      <section className="mb-8">
        <h2 className="font-heading text-lg font-medium text-onyx mb-4">
          Temperature
        </h2>
        <div className="flex gap-3 items-center">
          <input
            type="number"
            value={weather.temperature}
            onChange={handleTemperatureChange}
            className="field-input w-24 min-h-[56px] text-field-base"
            placeholder="0"
            min="-50"
            max="150"
            step="1"
          />
          <span className="text-field-base font-body text-onyx">°{temperatureUnit}</span>
          <button
            onClick={() =>
              setTemperatureUnit(temperatureUnit === "F" ? "C" : "F")
            }
            className={`
              min-h-[56px] px-4 rounded-button font-body text-field-base font-medium
              transition-all duration-150
              ${
                temperatureUnit === "F"
                  ? "bg-accent-violet text-white"
                  : "bg-glass border border-gray-100 text-onyx hover:border-gray-200"
              }
            `}
          >
            °{temperatureUnit === "F" ? "C" : "F"}
          </button>
        </div>
      </section>

      {/* Weather Impact Section */}
      <section className="mb-8">
        <h2 className="font-heading text-lg font-medium text-onyx mb-4">
          Work Impact
        </h2>
        <div className="space-y-3">
          {/* Full Day - Green */}
          <button
            onClick={() => handleImpactChange("full_day")}
            className={`
              w-full min-h-[72px] rounded-card px-4 py-4
              transition-all duration-150 flex flex-col justify-center
              border-2 font-body
              ${
                weather.impact === "full_day"
                  ? "bg-accent-green/15 border-accent-green shadow-card-active"
                  : "bg-glass border-gray-100 hover:border-accent-green"
              }
            `}
          >
            <div className="text-left">
              <h3 className="font-heading font-semibold text-field-base text-onyx">
                Full Day Operations
              </h3>
              <p className="text-field-sm text-warm-gray mt-1">
                Normal work schedule
              </p>
            </div>
          </button>

          {/* Partial Delay - Amber */}
          <button
            onClick={() => handleImpactChange("partial_delay")}
            className={`
              w-full min-h-[72px] rounded-card px-4 py-4
              transition-all duration-150 flex flex-col justify-center
              border-2 font-body
              ${
                weather.impact === "partial_delay"
                  ? "bg-accent-amber/15 border-accent-amber shadow-card-active"
                  : "bg-glass border-gray-100 hover:border-accent-amber"
              }
            `}
          >
            <div className="text-left">
              <h3 className="font-heading font-semibold text-field-base text-onyx">
                Partial Delay
              </h3>
              <p className="text-field-sm text-warm-gray mt-1">
                Some trades affected
              </p>
            </div>
          </button>

          {/* Weather Day - Red */}
          <button
            onClick={() => handleImpactChange("weather_day")}
            className={`
              w-full min-h-[72px] rounded-card px-4 py-4
              transition-all duration-150 flex flex-col justify-center
              border-2 font-body
              ${
                weather.impact === "weather_day"
                  ? "bg-accent-red/15 border-accent-red shadow-card-active"
                  : "bg-glass border-gray-100 hover:border-accent-red"
              }
            `}
          >
            <div className="text-left">
              <h3 className="font-heading font-semibold text-field-base text-onyx">
                Weather Day
              </h3>
              <p className="text-field-sm text-warm-gray mt-1">
                All work suspended (8 hours)
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* Hours Lost Section (for partial_delay and weather_day) */}
      {(weather.impact === "partial_delay" || weather.impact === "weather_day") && (
        <section className="mb-8">
          <h2 className="font-heading text-lg font-medium text-onyx mb-4">
            Hours Lost
          </h2>
          <div className="flex items-center gap-4">
            <button
              onClick={() => adjustHoursLost(-0.5)}
              disabled={weather.impact === "weather_day" || (weather.hoursLost || 0) <= 0.5}
              className="min-h-[56px] min-w-[56px] rounded-button bg-glass border border-gray-100 hover:border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all"
            >
              <Minus size={20} className="text-onyx" />
            </button>

            <div className="flex-1 text-center">
              <input
                type="number"
                value={weather.hoursLost || 0}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    onWeatherChange({
                      ...weather,
                      hoursLost: Math.max(0.5, Math.min(8, Math.round(value * 2) / 2)),
                    });
                  }
                }}
                disabled={weather.impact === "weather_day"}
                className="field-input w-20 text-center min-h-[56px] text-field-base disabled:opacity-50"
                step="0.5"
                min="0.5"
                max="8"
              />
              <p className="text-field-sm text-warm-gray mt-2">hours</p>
            </div>

            <button
              onClick={() => adjustHoursLost(0.5)}
              disabled={weather.impact === "weather_day" || (weather.hoursLost || 0) >= 8}
              className="min-h-[56px] min-w-[56px] rounded-button bg-glass border border-gray-100 hover:border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all"
            >
              <Plus size={20} className="text-onyx" />
            </button>
          </div>
        </section>
      )}

      {/* Affected Trades Section */}
      {showAffectedTrades && subcontractors.length > 0 && (
        <section className="mb-8">
          <h2 className="font-heading text-lg font-medium text-onyx mb-4">
            Affected Trades
          </h2>
          <div className="space-y-2">
            {subcontractors.map((sub) => {
              const isSelected = (weather.affectedTrades || []).includes(sub.id);
              return (
                <button
                  key={sub.id}
                  onClick={() => toggleAffectedTrade(sub.id)}
                  className={`
                    w-full min-h-[56px] rounded-button px-4 py-3
                    transition-all duration-150 flex items-center gap-3
                    font-body text-field-base
                    ${
                      isSelected
                        ? "bg-accent-violet text-white"
                        : "bg-glass border border-gray-100 text-onyx hover:border-gray-200"
                    }
                  `}
                >
                  <div
                    className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-accent-violet border-accent-violet"
                        : "border-gray-200 bg-glass"
                    }`}
                  >
                    {isSelected && <Check size={16} className="text-white" />}
                  </div>
                  <span className="text-left flex-1">{sub.company}</span>
                  <span className="text-field-sm text-warm-gray">{sub.trade}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Detailed Conditions Section - Collapsible */}
      <section className="mb-8">
        <button
          onClick={() => setShowDetailedConditions(!showDetailedConditions)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-card bg-glass border border-gray-100 hover:border-gray-200 transition-all mb-4"
        >
          <h2 className="font-heading text-lg font-medium text-onyx">
            Detailed Conditions
          </h2>
          <ChevronDown
            size={20}
            className={`text-onyx transition-transform ${
              showDetailedConditions ? "rotate-180" : ""
            }`}
          />
        </button>

        {showDetailedConditions && (
          <div className="space-y-4 bg-glass rounded-card p-4 border border-gray-100">
            {/* Humidity Slider */}
            <div>
              <label className="block text-field-sm font-semibold text-onyx mb-2">
                Humidity
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={weather.humidity ?? 50}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  onWeatherChange({ ...weather, humidity: value });
                }}
                className="w-full h-2 bg-glass-medium rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-field-sm text-warm-gray mt-1 text-center">
                {weather.humidity ?? 50}%
              </div>
            </div>

            {/* Wind Speed */}
            <div>
              <label className="block text-field-sm font-semibold text-onyx mb-2">
                Wind Speed (mph)
              </label>
              <input
                type="number"
                value={weather.windSpeed ?? ""}
                onChange={(e) => {
                  const value =
                    e.target.value === "" ? undefined : parseFloat(e.target.value);
                  onWeatherChange({ ...weather, windSpeed: value });
                }}
                placeholder="Enter wind speed"
                className="field-input w-full text-field-base min-h-[56px]"
                min="0"
                step="0.5"
              />
            </div>

            {/* Wind Direction */}
            <div>
              <label className="block text-field-sm font-semibold text-onyx mb-2">
                Wind Direction
              </label>
              <div className="grid grid-cols-4 gap-2">
                {["N", "NE", "E", "SE", "S", "SW", "W", "NW"].map((dir) => (
                  <button
                    key={dir}
                    onClick={() => {
                      onWeatherChange({
                        ...weather,
                        windDirection:
                          weather.windDirection === dir ? undefined : dir,
                      });
                    }}
                    className={`py-2 px-1 rounded-button text-field-sm font-semibold transition-all ${
                      weather.windDirection === dir
                        ? "bg-accent-violet text-white"
                        : "bg-glass border border-gray-100 text-onyx hover:border-gray-200"
                    }`}
                  >
                    {dir}
                  </button>
                ))}
              </div>
            </div>

            {/* Precipitation Type */}
            <div>
              <label className="block text-field-sm font-semibold text-onyx mb-2">
                Precipitation Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["rain", "sleet", "snow", "hail"].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      onWeatherChange({
                        ...weather,
                        precipitationType:
                          weather.precipitationType === type
                            ? undefined
                            : type,
                      });
                    }}
                    className={`py-2 px-3 rounded-button text-field-sm font-medium transition-all capitalize ${
                      weather.precipitationType === type
                        ? "bg-accent-violet text-white"
                        : "bg-glass border border-gray-100 text-onyx hover:border-gray-200"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Precipitation Amount */}
            <div>
              <label className="block text-field-sm font-semibold text-onyx mb-2">
                Precipitation Amount (inches)
              </label>
              <input
                type="number"
                value={weather.precipitationAmount ?? ""}
                onChange={(e) => {
                  const value =
                    e.target.value === "" ? undefined : parseFloat(e.target.value);
                  onWeatherChange({ ...weather, precipitationAmount: value });
                }}
                placeholder="Enter amount"
                className="field-input w-full text-field-base min-h-[56px]"
                min="0"
                step="0.1"
              />
            </div>

            {/* Ground Conditions */}
            <div>
              <label className="block text-field-sm font-semibold text-onyx mb-2">
                Ground Conditions
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "dry",
                  "damp",
                  "wet",
                  "saturated",
                  "frozen",
                  "standing_water",
                ].map((condition) => (
                  <button
                    key={condition}
                    onClick={() => {
                      onWeatherChange({
                        ...weather,
                        groundConditions:
                          weather.groundConditions === condition
                            ? undefined
                            : condition,
                      });
                    }}
                    className={`py-2 px-3 rounded-button text-field-sm font-medium transition-all capitalize ${
                      weather.groundConditions === condition
                        ? "bg-accent-violet text-white"
                        : "bg-glass border border-gray-100 text-onyx hover:border-gray-200"
                    }`}
                  >
                    {condition.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-field-sm font-semibold text-onyx mb-2">
                Visibility (miles)
              </label>
              <input
                type="number"
                value={weather.visibility ?? ""}
                onChange={(e) => {
                  const value =
                    e.target.value === "" ? undefined : parseFloat(e.target.value);
                  onWeatherChange({ ...weather, visibility: value });
                }}
                placeholder="Enter visibility"
                className="field-input w-full text-field-base min-h-[56px]"
                min="0"
                step="0.1"
              />
            </div>
          </div>
        )}
      </section>

      {/* Notes Section */}
      <section className="mb-8">
        <h2 className="font-heading text-lg font-medium text-onyx mb-4">
          Weather Notes
        </h2>
        <textarea
          value={weather.notes || ""}
          onChange={handleNotesChange}
          placeholder="Add any weather-related comments or observations..."
          className="field-input w-full min-h-[120px] text-field-base rounded-card p-4 resize-none font-body"
        />
      </section>

      {/* Spacing for bottom nav */}
      <div className="h-24" />
    </div>
  );
}
