import React, { useState } from "react";
import { PresetText } from "../types";
import { PRESET_TEXTS } from "../presets";
import { FileText, Trash2, Copy, Check, Clock } from "lucide-react";

interface TextControlPanelProps {
  text: string;
  onTextChange: (val: string) => void;
  onApplyPreset: (preset: PresetText) => void;
}

export default function TextControlPanel({
  text,
  onTextChange,
  onApplyPreset,
}: TextControlPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [copied, setCopied] = useState<boolean>(false);

  // Group presets categories
  const categories = ["all", "Truyện kể", "Tin tức", "Thơ ca", "Triết lý", "Chào hỏi"];

  const filteredPresets = PRESET_TEXTS.filter(
    (p) => selectedCategory === "all" || p.category === selectedCategory
  );

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  // Average speaking time is 140 words per minute
  const speakTimeSecs = Math.ceil((wordCount / 140) * 60);
  const formattedTime = speakTimeSecs >= 60 
    ? `${Math.floor(speakTimeSecs / 60)} phút ${speakTimeSecs % 60} giây` 
    : `${speakTimeSecs} giây`;

  const handleCopy = () => {
    if (!text.trim()) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value;
    // Compress multiple redundant vertical line endings / blank lines to a single return to save character budget
    const compressed = raw.replace(/\n\s*\n+/g, "\n");
    onTextChange(compressed);
  };

  return (
    <div className="flex flex-col gap-4" id="text-control-panel">
      {/* 1. Editor Area */}
      <div className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10 flex flex-col gap-3 shadow-xl">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-white flex items-center gap-2 uppercase tracking-wider font-mono">
            <FileText className="w-4 h-4 text-indigo-400" />
            Văn bản đọc
          </label>
          <div className="flex gap-1.5">
            <button
              onClick={handleCopy}
              disabled={!text.trim()}
              className="p-1.5 hover:bg-white/10 text-white/40 hover:text-white rounded-lg transition-all disabled:opacity-20 disabled:pointer-events-none"
              title="Sao chép văn bản"
            >
              {copied ? <Check className="w-4 h-4 text-indigo-400" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onTextChange("")}
              disabled={!text.trim()}
              className="p-1.5 hover:bg-white/10 text-white/40 hover:text-red-400 rounded-lg transition-all disabled:opacity-20 disabled:pointer-events-none"
              title="Xóa trắng văn bản"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            value={text}
            onChange={handleTextAreaChange}
            placeholder="Nhập hoặc dán văn bản của bạn tại đây để phát âm thanh. Tối đa 5000 ký tự (các dòng trống dư thừa sẽ được tự động rút gọn để tiết kiệm dung lượng)..."
            className="w-full h-80 bg-white/5 text-white border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder-white/20 resize-none font-sans leading-relaxed no-scrollbar"
            maxLength={5000}
          />
        </div>

        {/* Metrics Footer */}
        <div className="md:flex justify-between items-center text-xs text-white/40 font-mono border-t border-white/5 pt-3">
          <div className="flex gap-4 mb-2 md:mb-0">
            <span>
              Ký tự: <strong className="text-white/80">{charCount}</strong><span className="opacity-50">/5000</span>
            </span>
            <span>
              Từ: <strong className="text-white/80">{wordCount}</strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-white/60">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Thời gian đọc ước tính: <strong className="text-indigo-300">{formattedTime}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
