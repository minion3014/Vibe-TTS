import React, { useState, useMemo } from "react";
import { VoicePreset } from "../types";
import { Volume2, Sliders, Star, BookmarkPlus, Trash, Sparkles, Lock } from "lucide-react";

interface VoicePanelProps {
  voices: SpeechSynthesisVoice[];
  selectedVoiceName: string;
  onSelectVoice: (name: string) => void;
  rate: number;
  pitch: number;
  volume: number;
  onRateChange: (val: number) => void;
  onPitchChange: (val: number) => void;
  onVolumeChange: (val: number) => void;
  isPlaying?: boolean;
  
  bookmarks: VoicePreset[];
  onSaveBookmark: (name: string) => void;
  onLoadBookmark: (preset: VoicePreset) => void;
  onDeleteBookmark: (id: string) => void;
}

// Map system Vietnamese voices to elegant regional human personas
const getVietnameseVoicePersona = (voiceName: string) => {
  const name = voiceName.toLowerCase();
  
  if (name.includes("huyền my") || name.includes("huyen-my") || name.includes("huyen my")) {
    return {
      personaName: "Huyền My (Premium)",
      desc: "Nữ chuẩn mượt - Cloud ☁️",
      flag: "👑",
      genderBadge: "bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/20"
    };
  }
  
  if (name.includes("virtual-khanh-an") || name.includes("khanh an")) {
    return {
      personaName: "Khánh An",
      desc: "Nữ chuẩn - Miền Bắc",
      flag: "🇻🇳",
      genderBadge: "bg-pink-500/10 text-pink-300 font-bold border border-pink-500/20"
    };
  }
  if (name.includes("virtual-minh-dung") || name.includes("minh dung")) {
    return {
      personaName: "Minh Dũng",
      desc: "Nam trầm - Miền Bắc",
      flag: "🇻🇳",
      genderBadge: "bg-blue-500/10 text-blue-300 font-bold border border-blue-500/20"
    };
  }
  if (name.includes("virtual-thanh-truc") || name.includes("thanh truc")) {
    return {
      personaName: "Thanh Trúc",
      desc: "Nữ mượt mà - Miền Nam",
      flag: "🇻🇳",
      genderBadge: "bg-pink-500/10 text-pink-300 font-bold border border-pink-500/20"
    };
  }
  if (name.includes("virtual-hoai-nam") || name.includes("hoai nam")) {
    return {
      personaName: "Hoài Nam",
      desc: "Nam ấm áp - Miền Nam",
      flag: "🇻🇳",
      genderBadge: "bg-blue-500/10 text-blue-300 font-bold border border-blue-500/20"
    };
  }
  if (name.includes("google") || name.includes("vi-vn")) {
    return {
      personaName: "Khánh An (AI)",
      desc: "Nữ chuẩn - Miền Bắc",
      flag: "🇻🇳",
      genderBadge: "bg-pink-500/10 text-pink-300 font-bold border border-pink-500/20"
    };
  }
  if (name.includes("an") || name.includes("microsoft")) {
    return {
      personaName: "Minh Thư (AI)",
      desc: "Nữ thanh lịch - Miền Bắc",
      flag: "🇻🇳",
      genderBadge: "bg-pink-500/10 text-pink-300 font-bold border border-pink-500/20"
    };
  }
  if (name.includes("linh")) {
    return {
      personaName: "Hồng Linh (AI)",
      desc: "Nữ hồn hậu - Miền Nam",
      flag: "🇻🇳",
      genderBadge: "bg-pink-500/10 text-pink-300 font-bold border border-pink-500/20"
    };
  }
  if (name.includes("thanh")) {
    return {
      personaName: "Thanh Hải (AI)",
      desc: "Nam truyền cảm - Miền Nam",
      flag: "🇻🇳",
      genderBadge: "bg-blue-500/10 text-blue-300 font-bold border border-blue-500/20"
    };
  }
  if (name.includes("lan")) {
    return {
      personaName: "Phương Lan (AI)",
      desc: "Nữ chuẩn tin tức - Miền Bắc",
      flag: "🇻🇳",
      genderBadge: "bg-pink-500/10 text-pink-300 font-bold border border-pink-500/20"
    };
  }
  if (name.includes("mai")) {
    return {
      personaName: "Ngọc Mai (AI)",
      desc: "Nữ ngọt ngào - Miền Nam",
      flag: "🇻🇳",
      genderBadge: "bg-pink-500/10 text-pink-300 font-bold border border-pink-500/20"
    };
  }
  if (name.includes("vân") || name.includes("van")) {
    return {
      personaName: "Cẩm Vân (AI)",
      desc: "Nữ thanh thoát - Miền Bắc",
      flag: "🇻🇳",
      genderBadge: "bg-pink-500/10 text-pink-300 font-bold border border-pink-500/20"
    };
  }
  
  return {
    personaName: voiceName.replace("Microsoft", "").replace("Google", "").replace("Speech Synthesis", "").trim(),
    desc: "Giọng đọc Tiếng Việt",
    flag: "🇻🇳",
    genderBadge: "bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20"
  };
};

export default function VoicePanel({
  voices,
  selectedVoiceName,
  onSelectVoice,
  rate,
  pitch,
  volume,
  onRateChange,
  onPitchChange,
  onVolumeChange,
  isPlaying = false,
  bookmarks,
  onSaveBookmark,
  onLoadBookmark,
  onDeleteBookmark,
}: VoicePanelProps) {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [bookmarkName, setBookmarkName] = useState<string>("");
  const [showAddBookmark, setShowAddBookmark] = useState<boolean>(false);

  const handleAddNewBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookmarkName.trim()) return;
    onSaveBookmark(bookmarkName.trim());
    setBookmarkName("");
    setShowAddBookmark(false);
  };

  const persona = getVietnameseVoicePersona("Huyền My");

  return (
    <div className="flex flex-col gap-6" id="voice-panel">
      {/* 2. Audio Tuning Sliders */}
      <div className={`bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-xl transition-all ${
        isPlaying ? "opacity-75" : ""
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-sm tracking-wide uppercase flex items-center gap-2 select-none">
            <Volume2 className="w-4 h-4 text-indigo-400" />
            Điều chỉnh âm giọng
          </h3>
          {isPlaying && (
            <div 
              className="w-7 h-7 flex items-center justify-center text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full animate-pulse select-none"
              title="Khóa cấu hình khi đang phát"
            >
              <Lock className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        <div className="space-y-5">
          {/* Rate Sliders */}
          <div>
            <div className="flex justify-between items-center mb-1.5 font-mono">
              <span className="text-[11px] text-white/50 font-bold uppercase tracking-wider">Tốc độ phát</span>
              <span className="text-xs text-indigo-300 font-bold bg-white/10 px-2 py-0.5 rounded">
                {rate.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={rate}
              onChange={(e) => onRateChange(parseFloat(e.target.value))}
              disabled={isPlaying}
              className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed transition-all"
            />
            <div className="flex justify-between text-[10px] text-white/40 font-mono mt-1">
              <span>Chậm (0.5x)</span>
              <span>Bình thường (1.0x)</span>
              <span>Nhanh (2.5x)</span>
            </div>
          </div>

          {/* Pitch Sliders */}
          <div>
            <div className="flex justify-between items-center mb-1.5 font-mono">
              <span className="text-[11px] text-white/50 font-bold uppercase tracking-wider">Tông giọng (Cao độ)</span>
              <span className="text-xs text-indigo-300 font-bold bg-white/10 px-2 py-0.5 rounded">
                {pitch.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={pitch}
              onChange={(e) => onPitchChange(parseFloat(e.target.value))}
              disabled={isPlaying}
              className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed transition-all"
            />
            <div className="flex justify-between text-[10px] text-white/40 font-mono mt-1">
              <span>Trầm (0.5)</span>
              <span>Bình thường (1.0)</span>
              <span>Thanh (2.0)</span>
            </div>
          </div>

          {/* Volume Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5 font-mono">
              <span className="text-[11px] text-white/50 font-bold uppercase tracking-wider font-mono">Âm lượng</span>
              <span className="text-xs text-indigo-300 font-bold bg-white/10 px-2 py-0.5 rounded">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              disabled={isPlaying}
              className="w-full accent-indigo-500 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3. Bookmarks Presets (Lưu cấu hình yêu thích) */}
      <div className={`bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 shadow-xl transition-all ${
        isPlaying ? "opacity-75" : ""
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white text-sm tracking-wide uppercase flex items-center gap-2 select-none">
            <Star className="w-4 h-4 text-indigo-400" />
            Cấu hình đã lưu
          </h3>
          <button
            onClick={() => !isPlaying && setShowAddBookmark(!showAddBookmark)}
            disabled={isPlaying}
            className="text-xs text-indigo-300 font-bold hover:text-indigo-200 transition-colors flex items-center gap-1 font-mono disabled:opacity-45 disabled:cursor-not-allowed select-none"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            Lưu hiện tại
          </button>
        </div>

        {showAddBookmark && (
          <form onSubmit={handleAddNewBookmark} className="mb-4 bg-white/5 p-3 rounded-xl border border-white/10 flex gap-2">
            <input
              type="text"
              placeholder="Đặt tên cho cấu hình..."
              value={bookmarkName}
              onChange={(e) => setBookmarkName(e.target.value)}
              className="flex-1 bg-transparent border-none text-white placeholder-white/20 text-xs focus:outline-none"
              maxLength={20}
              required
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-3 py-1 rounded-lg text-xs font-bold font-mono transition-colors"
            >
              Lưu
            </button>
          </form>
        )}

        {bookmarks.length === 0 ? (
          <div className="text-center py-4 bg-white/5 rounded-2xl border border-dashed border-white/10 text-white/30 text-xs font-mono">
            Chưa có cấu hình đã lưu.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {bookmarks.map((b) => {
              const persona = getVietnameseVoicePersona(b.voiceName);
              const isActive = b.voiceName === selectedVoiceName && 
                Math.abs(b.rate - rate) < 0.01 && 
                Math.abs(b.pitch - pitch) < 0.01 && 
                Math.abs(b.volume - volume) < 0.01;
              return (
                <div
                  key={b.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl text-left transition-all border ${
                    isActive 
                      ? "bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_12px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30" 
                      : "bg-white/5 border-white/5 hover:border-white/15"
                  }`}
                >
                  <button
                    onClick={() => !isPlaying && onLoadBookmark(b)}
                    disabled={isPlaying}
                    className="flex-1 text-left mr-2 min-w-0 group disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-1.5 font-sans">
                      <span className={`font-bold text-xs group-hover:underline truncate block ${
                        isActive ? "text-indigo-300" : "text-indigo-400"
                      }`}>
                        {b.name} {isActive && "✨"}
                      </span>
                      <span className="text-[10px] text-white/50 font-mono">
                        {b.rate}x / {b.pitch}p / v{Math.round(b.volume * 100)}
                      </span>
                    </div>
                    <span className="text-[9px] text-white/40 font-mono block truncate">
                      Giọng: {persona.personaName} ({persona.desc})
                    </span>
                  </button>
                  <button
                    onClick={() => onDeleteBookmark(b.id)}
                    className="text-white/30 hover:text-red-400 p-1 rounded transition-colors"
                    title="Xóa cấu hình"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
