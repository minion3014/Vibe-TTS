import { HistoryItem } from "../types";
import { History, Play, Trash, ClipboardCopy, CheckCircle2, Download, RefreshCw } from "lucide-react";
import { useState } from "react";

interface HistoryLogProps {
  history: HistoryItem[];
  onLoadHistory: (item: HistoryItem) => void;
  onClearHistory: () => void;
  onDeleteHistory: (id: string) => void;
  onRenameHistory: (id: string, newTitle: string) => void;
}

const formatVoiceName = (name: string) => {
  const lowercase = name.toLowerCase();
  if (lowercase.includes("huyền my") || lowercase.includes("huyen-my") || lowercase.includes("huyen my")) return "Huyền My (Premium)";
  if (lowercase.includes("virtual-khanh-an") || lowercase.includes("khanh an")) return "Khánh An";
  if (lowercase.includes("virtual-minh-dung") || lowercase.includes("minh dung")) return "Minh Dũng";
  if (lowercase.includes("virtual-thanh-truc") || lowercase.includes("thanh truc")) return "Thanh Trúc";
  if (lowercase.includes("virtual-hoai-nam") || lowercase.includes("hoai nam")) return "Hoài Nam";
  if (lowercase.includes("google") || lowercase.includes("vi-vn")) return "Khánh An (AI)";
  if (lowercase.includes("an") || lowercase.includes("microsoft")) return "Minh Thư (AI)";
  if (lowercase.includes("linh")) return "Hồng Linh (AI)";
  if (lowercase.includes("thanh")) return "Thanh Hải (AI)";
  if (lowercase.includes("lan")) return "Phương Lan (AI)";
  if (lowercase.includes("mai")) return "Ngọc Mai (AI)";
  if (lowercase.includes("vân") || lowercase.includes("van")) return "Cẩm Vân (AI)";
  return name.replace("Microsoft", "").replace("Google", "").replace("Speech Synthesis", "").trim() || name;
};

export default function HistoryLog({
  history,
  onLoadHistory,
  onClearHistory,
  onDeleteHistory,
  onRenameHistory,
}: HistoryLogProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState<string>("");

  const handleCopyText = (item: HistoryItem) => {
    navigator.clipboard.writeText(item.text);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStartEdit = (item: HistoryItem) => {
    setEditingId(item.id);
    setEditVal(item.customTitle || item.text.substring(0, 20));
  };

  const handleSaveEdit = (id: string) => {
    if (editVal.trim()) {
      onRenameHistory(id, editVal.trim());
    }
    setEditingId(null);
  };

  const handleDownloadAudio = async (item: HistoryItem) => {
    setDownloadingId(item.id);
    try {
      const fullText = item.text;
      const segments: string[] = [];
      const lines = fullText.split("\n");
      
      for (const line of lines) {
        if (!line.trim()) continue;
        let current = "";
        const sentences = line.match(/[^,.!?;:]+[,.!?;:]*/g) || [line];
        for (const sentence of sentences) {
          if ((current + sentence).length > 180) {
            if (current.trim()) {
              segments.push(current.trim());
            }
            current = sentence;
            while (current.length > 180) {
              segments.push(current.substring(0, 180).trim());
              current = current.substring(180);
            }
          } else {
            current += sentence;
          }
        }
        if (current.trim()) {
          segments.push(current.trim());
        }
      }

      if (segments.length === 0 && fullText.trim()) {
        segments.push(fullText.trim());
      }

      // Fetch each segment audio chunk response ArrayBuffer
      const arrayBuffers: ArrayBuffer[] = [];
      for (const segment of segments) {
        const audioUrl = `/api/tts?text=${encodeURIComponent(segment)}`;
        const res = await fetch(audioUrl);
        if (!res.ok) throw new Error("Không thể tải phân đoạn âm thanh");
        const buffer = await res.arrayBuffer();
        arrayBuffers.push(buffer);
      }

      // Concatenate standard raw MP3 array buffer payloads seamlessly
      const combinedBlob = new Blob(arrayBuffers, { type: "audio/mpeg" });
      const downloadUrl = URL.createObjectURL(combinedBlob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      const safeTime = item.timestamp.replace(/:/g, "-");
      const titleToUse = item.customTitle || item.text.substring(0, 15);
      const truncatedText = titleToUse.replace(/[\\\/:*?"<>|]/g, "");
      a.download = `${truncatedText}-${safeTime}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Lỗi khi tải xuống lịch sử:", err);
      alert("Đã xảy ra lỗi khi tạo tệp tải xuống. Hãy thử lại!");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col" id="history-log">
      {history.length === 0 ? (
        <div className="text-center py-12 text-white/30 text-sm font-light italic">
          Chưa có văn bản nào được chuyển đổi giọng nói. Lịch sử của bạn sẽ lưu tại đây.
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto pr-1 no-scrollbar flex-1 pb-16">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-white/5 p-3.5 rounded-2xl border border-white/5 hover:border-white/15 transition-all text-left flex flex-col gap-2"
            >
              {/* Optional Renaming Widget Title Row */}
              <div className="flex items-center justify-between border-b border-white/5 pb-1 text-[11px] font-mono">
                {editingId === item.id ? (
                  <div className="flex items-center gap-1.5 flex-1 max-w-[80%]">
                    <input
                      type="text"
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      className="bg-black/40 text-xs text-white border border-indigo-500/30 rounded-lg px-2 py-0.5 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                      maxLength={40}
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(item.id)}
                      className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-0.5 rounded"
                    >
                      Xong
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-indigo-300 font-bold truncate max-w-[150px]">
                      📂 {item.customTitle || "Chưa đặt tên"}
                    </span>
                    <button
                      onClick={() => handleStartEdit(item)}
                      className="text-[9px] text-white/30 hover:text-white underline"
                    >
                      đổi tên
                    </button>
                  </div>
                )}
                <span className="text-white/20 select-none text-[9px]">{item.timestamp}</span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <p className="text-white/80 text-xs font-sans line-clamp-2 leading-relaxed flex-1">
                  "{item.text}"
                </p>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                     onClick={() => handleDownloadAudio(item)}
                     disabled={downloadingId !== null}
                     className="p-1 hover:bg-white/10 rounded-lg text-white/40 hover:text-emerald-400 transition-colors disabled:opacity-30"
                     title="Tải tệp âm thanh MP3"
                  >
                    {downloadingId === item.id ? (
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                     onClick={() => handleCopyText(item)}
                     className="p-1 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors"
                     title="Sao chép văn bản này"
                  >
                    {copiedId === item.id ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <ClipboardCopy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => onDeleteHistory(item.id)}
                    className="p-1 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                    title="Xóa bản ghi"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-2 text-[10px] font-mono text-white/40">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-white/10 text-indigo-300 px-2 py-0.5 rounded-full font-bold border border-white/5">
                    {formatVoiceName(item.voiceName)}
                  </span>
                  <span>
                    Tốc độ: <strong className="text-white/70">{item.rate}x</strong>
                  </span>
                  <span>
                    Cao độ: <strong className="text-white/70">{item.pitch}</strong>
                  </span>
                </div>
              </div>

              <button
                onClick={() => onLoadHistory(item)}
                className="w-full mt-1 bg-white/5 hover:bg-white/10 border border-white/10 py-1.5 rounded-xl text-center text-[10px] text-indigo-300 hover:text-indigo-200 font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 font-mono cursor-pointer"
              >
                <Play className="w-2.5 h-2.5 fill-current" /> nạp lại & chơi giọng đọc này
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
