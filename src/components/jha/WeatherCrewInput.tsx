"use client";

import React from "react";
import {
  Sun,
  Cloud,
  CloudRain,
  Snowflake,
  Wind,
  Thermometer,
  ThermometerSnowflake,
  Plus,
  Minus,
} from "lucide-react";

interface WeatherCrewInputProps {
  weather: {
    conditions: string;
    temperature: number;
    temperatureUnit: "F" | "C";
  };
  crewSize: number;
  siteNotes: string;
  onWeatherChange: (weather: {
    conditions: string;
    temperature: number;
    temperatureUnit: "F" | "C";
  }) => void;
  onCrewSizeChange: (size: number) => void;
  onSiteNotesChange: (notes: string) => void;
}

const WEATHER_CONDITIONS = [
  { label: "Clear", icon: Sun },
  { label: "Cloudy", icon: Cloud },
  { label: "Rain", icon: CloudRain },
  { label: "Snow", icon: Snowflake },
  { label: "Wind", icon: Wind },
  { label: "Extreme Heat", icon: Thermometer },
  { label: "Extreme Cold", icon: ThermometerSnowflake },
];

export default function WeatherCrewInput({
  weather,
  crewSize,
  siteNotes,
  onWeatherChange,
  onCrewSizeChange,
  onSiteNotesChange,
}: WeatherCrewInputProps) {
  const handleWeatherConditionChange = (condition: string) => {
    onWeatherChange({
      ...weather,
      conditions: condition === weather.conditions ? "" : condition,
    });
  };

  const handleTemperatureChange = (value: string) => {
    const temp = value === "" ? 0 : parseInt(value, 10);
    onWeatherChange({
      ...weather,
      temperature: isNaN(temp) ? 0 : temp,
    });
  };

  const handleCrewSizeIncrement = () => {
    onCrewSizeChange(crewSize + 1);
  };

  const handleCrewSizeDecrement = () => {
    if (crewSize > 0) {
      onCrewSizeChange(crewSize - 1);
    }
  };

  const handleCrewSizeChange = (value: string) => {
    const size = value === "" ? 0 : parseInt(value, 10);
    onCrewSizeChange(isNaN(size) ? 0 : Math.max(0, size));
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Weather Conditions Section */}
      <div>
        <label className="block text-field-lg font-semibold text-onyx mb-3">
          Weather Condition
        </label>
        <div className="grid grid-cols-2 gap-2">
          {WEATHER_CONDITIONS.map(({ label, icon: IconComponent }) => {
            const isActive = weather.conditions === label;
            return (
              <button
                key={label}
                onClick={() => handleWeatherConditionChange(label)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-full font-body font-semibold
                  text-field-sm transition-all active:scale-[0.98]
                  ${
                    isActive
                      ? "bg-accent-violet text-white"
                      : "bg-glass text-onyx hover:bg-glass-light"
                  }
                `}
              >
                <IconComponent size={18} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Temperature Section */}
      <div>
        <label className="block text-field-lg font-semibold text-onyx mb-3">
          Temperature
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={weather.temperature}
            onChange={(e) => handleTemperatureChange(e.target.value)}
            className="
              flex-1 px-4 py-3 rounded-card border border-gray-100
              text-field-base font-body text-onyx
              focus:outline-none focus:ring-2 focus:ring-accent-violet focus:border-transparent
              placeholder-warm-gray
            "
            placeholder="Enter temp"
            min="-50"
            max="150"
          />
          <span className="text-field-lg font-semibold text-onyx">
            °{weather.temperatureUnit}
          </span>
        </div>
      </div>

      {/* Crew Size Section */}
      <div>
        <label className="block text-field-lg font-semibold text-onyx mb-3">
          Crew Size
        </label>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCrewSizeDecrement}
            className="
              flex items-center justify-center w-14 h-14 rounded-card
              bg-glass text-onyx font-semibold text-field-lg
              hover:bg-glass-light active:scale-[0.95] transition-all
            "
            aria-label="Decrease crew size"
          >
            <Minus size={20} />
          </button>

          <input
            type="number"
            value={crewSize}
            onChange={(e) => handleCrewSizeChange(e.target.value)}
            className="
              flex-1 px-4 py-3 rounded-card border border-gray-100
              text-field-xl font-semibold font-body text-onyx text-center
              focus:outline-none focus:ring-2 focus:ring-accent-violet focus:border-transparent
            "
            placeholder="0"
            min="0"
          />

          <button
            onClick={handleCrewSizeIncrement}
            className="
              flex items-center justify-center w-14 h-14 rounded-card
              bg-accent-violet text-white font-semibold text-field-lg
              hover:bg-slate active:scale-[0.95] transition-all
            "
            aria-label="Increase crew size"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Site Notes Section */}
      <div>
        <label className="block text-field-lg font-semibold text-onyx mb-3">
          Site Notes
        </label>
        <textarea
          value={siteNotes}
          onChange={(e) => onSiteNotesChange(e.target.value)}
          placeholder="Any site-specific notes (crane on-site, occupied building, etc.)"
          className="
            w-full px-4 py-3 rounded-card border border-gray-100
            text-field-base font-body text-onyx
            focus:outline-none focus:ring-2 focus:ring-accent-violet focus:border-transparent
            placeholder-warm-gray
            resize-none
            min-h-[120px]
          "
        />
      </div>
    </div>
  );
}
