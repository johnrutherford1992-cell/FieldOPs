"use client";

import React, { useState, useRef } from "react";
import { Camera, X, Image as ImageIcon } from "lucide-react";
import type { PhotoEntry, PhotoCategory, TaktZone } from "@/lib/types";
import { CSI_DIVISIONS } from "@/data/csi-divisions";

interface PhotosScreenProps {
  photos: PhotoEntry[];
  onPhotosChange: (photos: PhotoEntry[]) => void;
  taktZones: TaktZone[];
}

interface CategoryInfo {
  id: PhotoCategory;
  label: string;
  color: string;
  bgColor: string;
}

const photoCategories: CategoryInfo[] = [
  { id: "progress", label: "Progress", color: "bg-blue-500", bgColor: "bg-blue-100" },
  { id: "safety", label: "Safety", color: "bg-green-500", bgColor: "bg-green-100" },
  { id: "quality", label: "Quality", color: "bg-purple-500", bgColor: "bg-purple-100" },
  { id: "issue", label: "Issue", color: "bg-amber-500", bgColor: "bg-amber-100" },
  { id: "damage", label: "Damage", color: "bg-red-500", bgColor: "bg-red-100" },
];

export default function PhotosScreen({
  photos,
  onPhotosChange,
  taktZones,
}: PhotosScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showTaggingModal, setShowTaggingModal] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<{
    file: string;
    timestamp: string;
  } | null>(null);

  // Form state for tagging modal
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory>("progress");
  const [selectedTaktZone, setSelectedTaktZone] = useState<string>("");
  const [selectedCSIDivision, setSelectedCSIDivision] = useState<string>("");
  const [caption, setCaption] = useState<string>("");
  const [gpsLatitude, setGpsLatitude] = useState<number | null>(null);
  const [gpsLongitude, setGpsLongitude] = useState<number | null>(null);
  const [witnessPresent, setWitnessPresent] = useState(false);

  // Generate unique ID
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle file selection (camera or gallery)
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      setPendingPhoto({
        file: base64,
        timestamp: new Date().toISOString(),
      });
      setShowTaggingModal(true);

      // Reset form state
      setSelectedCategory("progress");
      setSelectedTaktZone("");
      setSelectedCSIDivision("");
      setCaption("");
      setWitnessPresent(false);

      // Auto-set GPS coordinates from navigator geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setGpsLatitude(position.coords.latitude);
            setGpsLongitude(position.coords.longitude);
          },
          (error) => {
            console.log("Geolocation not available:", error.message);
          }
        );
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error reading file:", error);
    }
  };

  // Handle saving photo with tags
  const handleSavePhoto = () => {
    if (!pendingPhoto) return;

    const newPhoto: PhotoEntry = {
      id: generateId(),
      file: pendingPhoto.file,
      category: selectedCategory,
      timestamp: pendingPhoto.timestamp,
      ...(selectedTaktZone && { taktZone: selectedTaktZone }),
      ...(selectedCSIDivision && { csiDivision: selectedCSIDivision }),
      ...(caption && { caption }),
      ...(gpsLatitude !== null && { gpsLatitude }),
      ...(gpsLongitude !== null && { gpsLongitude }),
      ...(witnessPresent && { witnessPresent }),
    };

    onPhotosChange([...photos, newPhoto]);
    setShowTaggingModal(false);
    setPendingPhoto(null);
    setGpsLatitude(null);
    setGpsLongitude(null);
  };

  // Handle removing a photo
  const handleRemovePhoto = (photoId: string) => {
    onPhotosChange(photos.filter((p) => p.id !== photoId));
  };

  // Get category label and color by ID
  const getCategoryInfo = (categoryId: PhotoCategory): CategoryInfo | undefined => {
    return photoCategories.find((c) => c.id === categoryId);
  };

  // Get CSI division name by code
  const getCSIDivisionName = (code: string): string => {
    const division = CSI_DIVISIONS.find((d) => d.code === code);
    return division ? `${division.code} - ${division.name}` : code;
  };

  // Get TaktZone label
  const getTaktZoneLabel = (zoneId: string): string => {
    const zone = taktZones.find((z) => z.id === zoneId);
    return zone ? `${zone.zoneCode} - ${zone.zoneName}` : zoneId;
  };

  // Group takt zones by floor
  const taktZonesByFloor = taktZones.reduce(
    (acc, zone) => {
      if (!acc[zone.floor]) {
        acc[zone.floor] = [];
      }
      acc[zone.floor].push(zone);
      return acc;
    },
    {} as Record<string, TaktZone[]>
  );

  const hasPhotos = photos.length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 bg-alabaster min-h-screen">
      {/* Take Photo Button */}
      <div className="mb-8">
        <label htmlFor="camera-input" className="block">
          <button
            className="
              w-full min-h-[72px] rounded-xl bg-onyx text-white
              flex items-center justify-center gap-3
              font-heading text-field-lg font-medium
              transition-all duration-150
              hover:shadow-card-hover active:shadow-card-active
            "
          >
            <Camera size={28} />
            Take Photo
          </button>
        </label>
        <input
          ref={fileInputRef}
          id="camera-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelected}
          className="hidden"
        />
      </div>

      {/* Summary */}
      <div className="mb-6 text-center">
        <p className="text-field-base font-body text-warm-gray">
          {hasPhotos ? `${photos.length} photos captured` : "Tap 'Take Photo' to document today's progress"}
        </p>
      </div>

      {/* Photo Grid or Empty State */}
      {hasPhotos ? (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {photos.map((photo) => {
            const categoryInfo = getCategoryInfo(photo.category);
            return (
              <div key={photo.id} className="flex flex-col">
                {/* Photo Container */}
                <div className="relative rounded-xl overflow-hidden mb-2 bg-white border border-gray-200">
                  <img
                    src={photo.file}
                    alt={photo.caption || "Photo"}
                    className="w-full aspect-square object-cover"
                  />

                  {/* Category Badge */}
                  {categoryInfo && (
                    <div
                      className={`
                        absolute top-2 right-2 px-2 py-1 rounded-full
                        text-white text-xs font-bold
                        ${categoryInfo.color}
                      `}
                    >
                      {categoryInfo.label}
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="
                      absolute top-2 left-2 bg-white rounded-full p-1
                      shadow-card hover:shadow-card-hover
                      transition-all duration-150 min-h-[32px] min-w-[32px]
                      flex items-center justify-center
                    "
                    aria-label="Remove photo"
                  >
                    <X size={18} className="text-onyx" />
                  </button>
                </div>

                {/* Caption and Tags */}
                <div className="min-h-[60px]">
                  {photo.caption && (
                    <p className="text-field-sm font-body text-onyx mb-1 line-clamp-2">
                      {photo.caption}
                    </p>
                  )}

                  {/* GPS Coordinates if present */}
                  {(photo.gpsLatitude !== undefined || photo.gpsLongitude !== undefined) && (
                    <p className="text-xs text-warm-gray font-body mb-1">
                      GPS: {photo.gpsLatitude?.toFixed(4)}, {photo.gpsLongitude?.toFixed(4)}
                    </p>
                  )}

                  {/* Witness Present indicator */}
                  {photo.witnessPresent && (
                    <p className="text-xs text-accent-amber font-semibold mb-1">
                      Witness Present
                    </p>
                  )}

                  {/* Inline tags */}
                  <div className="flex flex-wrap gap-1">
                    {photo.taktZone && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        {getTaktZoneLabel(photo.taktZone)}
                      </span>
                    )}
                    {photo.csiDivision && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                        {getCSIDivisionName(photo.csiDivision)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ImageIcon size={48} className="text-warm-gray mb-4 opacity-50" />
          <p className="text-field-base font-body text-warm-gray">
            Tap &lsquo;Take Photo&rsquo; to document today&rsquo;s progress
          </p>
        </div>
      )}

      {/* Tagging Modal */}
      {showTaggingModal && pendingPhoto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-card-hover">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-heading text-field-lg font-medium text-onyx">
                  Tag Photo
                </h3>
                <button
                  onClick={() => {
                    setShowTaggingModal(false);
                    setPendingPhoto(null);
                  }}
                  className="text-warm-gray hover:text-onyx transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Photo Preview */}
              <div className="flex justify-center mb-6">
                <img
                  src={pendingPhoto.file}
                  alt="Preview"
                  className="max-h-[200px] rounded-xl border border-gray-200 object-contain"
                />
              </div>

              {/* Category Selection */}
              <div className="mb-6">
                <label className="block text-field-base font-heading font-medium text-onyx mb-3">
                  Category
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {photoCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`
                        py-2 px-3 rounded-lg font-body text-field-sm font-medium
                        transition-all duration-150 border-2
                        ${
                          selectedCategory === cat.id
                            ? `${cat.color} text-white border-transparent`
                            : `bg-white border-gray-200 text-onyx hover:border-gray-300`
                        }
                      `}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Takt Zone Selection */}
              {taktZones.length > 0 && (
                <div className="mb-6">
                  <label className="block text-field-base font-heading font-medium text-onyx mb-3">
                    Takt Zone (Optional)
                  </label>
                  <select
                    value={selectedTaktZone}
                    onChange={(e) => setSelectedTaktZone(e.target.value)}
                    className="
                      w-full min-h-[56px] px-4 rounded-lg border border-gray-200
                      font-body text-field-base text-onyx
                      focus:outline-none focus:ring-2 focus:ring-onyx
                      bg-white
                    "
                  >
                    <option value="">Select a zone&hellip;</option>
                    {Object.entries(taktZonesByFloor).map(([floor, zones]) => (
                      <optgroup key={floor} label={floor}>
                        {zones.map((zone) => (
                          <option key={zone.id} value={zone.id}>
                            {zone.zoneCode} - {zone.zoneName}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              )}

              {/* CSI Division Selection */}
              <div className="mb-6">
                <label className="block text-field-base font-heading font-medium text-onyx mb-3">
                  CSI Division (Optional)
                </label>
                <select
                  value={selectedCSIDivision}
                  onChange={(e) => setSelectedCSIDivision(e.target.value)}
                  className="
                    w-full min-h-[56px] px-4 rounded-lg border border-gray-200
                    font-body text-field-base text-onyx
                    focus:outline-none focus:ring-2 focus:ring-onyx
                    bg-white
                  "
                >
                  <option value="">Select a division&hellip;</option>
                  {CSI_DIVISIONS.map((division) => (
                    <option key={division.code} value={division.code}>
                      {division.code} - {division.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Caption Input */}
              <div className="mb-6">
                <label className="block text-field-base font-heading font-medium text-onyx mb-3">
                  Caption (Optional)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add description..."
                  className="
                    w-full min-h-[80px] px-4 py-3 rounded-lg border border-gray-200
                    font-body text-field-base text-onyx
                    focus:outline-none focus:ring-2 focus:ring-onyx
                    bg-white resize-none
                  "
                />
              </div>

              {/* GPS Coordinates Display */}
              {(gpsLatitude !== null || gpsLongitude !== null) && (
                <div className="mb-6 p-3 bg-alabaster rounded-lg border border-gray-200">
                  <p className="text-field-sm text-onyx font-body">
                    <span className="font-semibold">GPS:</span> {gpsLatitude?.toFixed(4)}, {gpsLongitude?.toFixed(4)}
                  </p>
                </div>
              )}

              {/* Witness Present Checkbox */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={witnessPresent}
                    onChange={(e) => setWitnessPresent(e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-gray-300 text-onyx focus:ring-2 focus:ring-onyx"
                  />
                  <span className="text-field-base font-body text-onyx">
                    Witness Present
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowTaggingModal(false);
                    setPendingPhoto(null);
                  }}
                  className="
                    flex-1 min-h-[56px] rounded-lg border border-gray-200 bg-white
                    font-heading text-field-base font-medium text-onyx
                    transition-all duration-150 hover:bg-gray-50
                  "
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePhoto}
                  className="
                    flex-1 min-h-[56px] rounded-lg bg-onyx text-white
                    font-heading text-field-base font-medium
                    transition-all duration-150 hover:shadow-card-hover
                  "
                >
                  Save Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
