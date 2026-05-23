import { Play, Pause, Square } from "lucide-react";

interface PlaybackControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  wordCount: number;
}

export default function PlaybackControls({
  isPlaying,
  isPaused,
  onPlay,
  onPause,
  onStop,
  wordCount,
}: PlaybackControlsProps) {
  // Main core button clicking action
  const handleMainClick = () => {
    if (!isPlaying) {
      onPlay();
    } else {
      // Toggle pausing/resuming
      onPause();
    }
  };

  return (
    <div className="flex items-center justify-center gap-5 w-full py-2 animate-fade-in" id="playback-controls">
      {/* 
        1. Main Play / Pause Button:
        Click once to start reading. If reading, click again to pause. If paused, click to resume.
      */}
      <button
        onClick={handleMainClick}
        className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl relative cursor-pointer ${
          isPlaying && !isPaused
            ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/35 scale-105"
            : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white hover:scale-110 active:scale-95 shadow-indigo-500/20"
        }`}
        title={!isPlaying ? "Bắt đầu đọc" : isPaused ? "Tiếp tục đọc" : "Tạm dừng đọc"}
        id="playback-btn-main"
      >
        {isPlaying && !isPaused ? (
          <Pause className="w-6 h-6 text-white fill-white" />
        ) : (
          <Play className="w-6 h-6 text-white fill-white ml-0.5" />
        )}
        {isPlaying && !isPaused && (
          <span className="absolute inset-[-6px] rounded-full border border-indigo-500/30 animate-ping pointer-events-none" />
        )}
      </button>
    </div>
  );
}

