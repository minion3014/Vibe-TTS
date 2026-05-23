import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "motion/react";
import { VoicePreset, HistoryItem, PresetText } from "./types";
import { PRESET_TEXTS } from "./presets";
import AudioVisualizer from "./components/AudioVisualizer";
import VoicePanel from "./components/VoicePanel";
import TextControlPanel from "./components/TextControlPanel";
import PlaybackControls from "./components/PlaybackControls";
import HistoryLog from "./components/HistoryLog";
import { Volume2, FileAudio, Star, HelpCircle, GraduationCap, MoreVertical, X, Music, Square, Target } from "lucide-react";

export default function App() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("");
  const [text, setText] = useState<string>(
    "Chào mừng bạn đến với ứng dụng chuyển đổi văn bản thành giọng nói chuyên nghiệp. Hãy nhấn bắt đầu đọc bên dưới để nghe thử hoặc nhập văn bản của riêng bạn tại ô này!"
  );

  // Voice Tuning Params
  const [rate, setRate] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);

  // Playback States
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [charIndex, setCharIndex] = useState<number>(-1);
  const [charLength, setCharLength] = useState<number>(0);

  // Stored preferences & History
  const [bookmarks, setBookmarks] = useState<VoicePreset[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

  // Cloud TTS Audio player states and refs
  const cloudAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeSegmentIndexRef = useRef<number>(0);
  const segmentsRef = useRef<any[]>([]);

  // Scroll Container and Active highlight refs for automatic focus & jumping
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeWordRef = useRef<HTMLSpanElement | null>(null);

  // Smooth scroll tracking function
  const scrollToActiveWord = () => {
    if (activeWordRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeWord = activeWordRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const activeRect = activeWord.getBoundingClientRect();
      
      const relativeTop = activeRect.top - containerRect.top + container.scrollTop;
      const targetScrollTop = relativeTop - (containerRect.height / 2) + (activeRect.height / 2);
      
      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: "smooth"
      });
    }
  };

  // 1. Loading active browser voices asynchronously
  useEffect(() => {
    const cloudVoice = {
      name: "Huyền My (Giọng Nữ Studio - Cloud ☁️)",
      lang: "vi-VN",
      voiceURI: "cloud-huyen-my",
      localService: false,
      default: true,
    } as unknown as SpeechSynthesisVoice;

    const loadVoices = () => {
      let finalVoices = [cloudVoice];

      if (synth) {
        const allVoices = synth.getVoices();
        
        // Filter specifically to native Vietnamese (vi-VN or vi)
        let viVoices = allVoices.filter((v) => v.lang.toLowerCase().includes("vi"));
        
        // If no native Vietnamese voice is installed/available, generate virtual profiles and map to system default voice
        if (viVoices.length === 0 && allVoices.length > 0) {
          const systemDefaultVoice = allVoices.find(v => v.default) || allVoices[0];
          viVoices = [
            {
              name: "Khánh An (Giọng Bắc - Nữ)",
              lang: "vi-VN",
              voiceURI: "virtual-khanh-an",
            },
            {
              name: "Minh Dũng (Giọng Bắc - Nam)",
              lang: "vi-VN",
              voiceURI: "virtual-minh-dung",
            },
            {
              name: "Thanh Trúc (Giọng Nam - Nữ)",
              lang: "vi-VN",
              voiceURI: "virtual-thanh-truc",
            },
            {
              name: "Hoài Nam (Giọng Nam - Nam)",
              lang: "vi-VN",
              voiceURI: "virtual-hoai-nam",
            }
          ].map(virtual => ({
            ...systemDefaultVoice,
            name: virtual.name,
            lang: virtual.lang,
            voiceURI: virtual.voiceURI,
            _isVirtual: true,
            _originalVoice: systemDefaultVoice
          } as unknown as SpeechSynthesisVoice));
        }

        finalVoices = [cloudVoice, ...viVoices];
      }

      setVoices(finalVoices);

      // Attempt to restore selected voice or default to cloudVoice
      setSelectedVoiceName((prev) => {
        if (prev && finalVoices.some(v => v.name === prev)) {
          return prev;
        }
        return cloudVoice.name;
      });
    };

    loadVoices();
    if (synth) {
      synth.onvoiceschanged = () => {
        loadVoices();
      };
    }

    // Load custom presets and history from localStorage
    try {
      const savedPresets = localStorage.getItem("tts_voice_presets");
      if (savedPresets) setBookmarks(JSON.parse(savedPresets));

      const savedHistory = localStorage.getItem("tts_history");
      if (savedHistory) setHistory(JSON.parse(savedHistory));
    } catch (e) {
      console.error("Failed to load local storage configurations:", e);
    }

    // Clean up active streams on unmount
    return () => {
      if (synth) synth.cancel();
      if (cloudAudioRef.current) {
        cloudAudioRef.current.pause();
        cloudAudioRef.current = null;
      }
    };
  }, []);

  // Save Bookmarks in storage
  const handleSaveBookmark = (name: string) => {
    const newPreset: VoicePreset = {
      id: crypto.randomUUID(),
      name,
      voiceName: selectedVoiceName,
      rate,
      pitch,
      volume,
    };
    const updated = [newPreset, ...bookmarks];
    setBookmarks(updated);
    localStorage.setItem("tts_voice_presets", JSON.stringify(updated));
  };

  const handleLoadBookmark = (preset: VoicePreset) => {
    // Check if the voice still exists in current browser
    const voiceExists = voices.find((v) => v.name === preset.voiceName);
    if (voiceExists) {
      setSelectedVoiceName(preset.voiceName);
    }
    setRate(preset.rate);
    setPitch(preset.pitch);
    setVolume(preset.volume);
  };

  const handleDeleteBookmark = (id: string) => {
    const updated = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updated);
    localStorage.setItem("tts_voice_presets", JSON.stringify(updated));
  };

  // History state logic
  const saveToHistory = (txt: string, voiceName: string, speedVal: number, pitchVal: number) => {
    // Limit to 20 text items max in history
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      text: txt,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      voiceName,
      rate: speedVal,
      pitch: pitchVal,
    };
    const updated = [newItem, ...history.slice(0, 19)];
    setHistory(updated);
    localStorage.setItem("tts_history", JSON.stringify(updated));
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("tts_history");
  };

  const handleDeleteHistory = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem("tts_history", JSON.stringify(updated));
  };

  const handleRenameHistory = (id: string, newTitle: string) => {
    const updated = history.map((item) => {
      if (item.id === id) {
        return { ...item, customTitle: newTitle };
      }
      return item;
    });
    setHistory(updated);
    localStorage.setItem("tts_history", JSON.stringify(updated));
  };

  const handleLoadHistory = (item: HistoryItem) => {
    setText(item.text);
    const mVoice = voices.find((v) => v.name === item.voiceName);
    if (mVoice) {
      setSelectedVoiceName(item.voiceName);
    }
    setRate(item.rate);
    setPitch(item.pitch);
  };

  const currentWordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  // 2. Playback actions
  const handlePlay = () => {
    if (!text.trim()) return;

    if (selectedVoiceName === "Huyền My (Giọng Nữ Studio - Cloud ☁️)") {
      // ----------------------------------------------------
      // CLOUD TTS PLAYBACK (No browser synthesis dependency)
      // ----------------------------------------------------
      if (isPaused) {
        if (cloudAudioRef.current) {
          cloudAudioRef.current.play().then(() => setIsPaused(false));
        }
        return;
      }

      // Stop any existing synthesizer or web streams
      if (synth) synth.cancel();
      if (cloudAudioRef.current) {
        cloudAudioRef.current.pause();
        cloudAudioRef.current = null;
      }

      // 1. Split the text into segments
      const fullText = text;
      const regex = /[^,.!?;:\n]+[,.!?;:\n]*/g;
      let match;
      const segments: { text: string; startIndex: number }[] = [];
      let currentChunk = "";
      let currentStart = 0;

      while ((match = regex.exec(fullText)) !== null) {
        const part = match[0];
        if (currentChunk.length + part.length < 180) {
          if (!currentChunk) {
            currentStart = match.index;
          }
          currentChunk += part;
        } else {
          if (currentChunk.trim()) {
            segments.push({ text: currentChunk.trim(), startIndex: currentStart });
          }
          currentChunk = part;
          currentStart = match.index;
        }
      }
      if (currentChunk.trim()) {
        segments.push({ text: currentChunk.trim(), startIndex: currentStart });
      }
      if (segments.length === 0 && fullText.trim()) {
        segments.push({ text: fullText.trim(), startIndex: 0 });
      }

      segmentsRef.current = segments;
      activeSegmentIndexRef.current = 0;

      const playCurrentSegment = () => {
        const idx = activeSegmentIndexRef.current;
        if (idx >= segmentsRef.current.length) {
          setIsPlaying(false);
          setIsPaused(false);
          setCharIndex(-1);
          setCharLength(0);
          saveToHistory(text, selectedVoiceName, rate, pitch);
          return;
        }

        const segment = segmentsRef.current[idx];
        setCharIndex(segment.startIndex);
        setCharLength(segment.text.length);

        const audioUrl = `/api/tts?text=${encodeURIComponent(segment.text)}`;
        const audio = new Audio(audioUrl);
        cloudAudioRef.current = audio;

        audio.playbackRate = rate;
        audio.volume = volume;

        audio.onplay = () => {
          setIsPlaying(true);
          setIsPaused(false);
        };

        audio.ontimeupdate = () => {
          if (audio.duration && audio.duration > 0) {
            const segmentProgress = audio.currentTime / audio.duration;
            const segmentCharsRead = Math.round(segment.text.length * segmentProgress);
            setCharIndex(segment.startIndex + segmentCharsRead);
          }
        };

        audio.onended = () => {
          setTimeout(() => {
            activeSegmentIndexRef.current += 1;
            playCurrentSegment();
          }, 250);
        };

        audio.onerror = (e) => {
          console.error("Cloud TTS Playback segment Error:", e);
          activeSegmentIndexRef.current += 1;
          playCurrentSegment();
        };

        audio.play().catch(err => {
          console.error("HTML Audio play failed:", err);
          setIsPlaying(false);
          setIsPaused(false);
        });
      };

      setIsPlaying(true);
      setIsPaused(false);
      playCurrentSegment();
      return;
    }

    // ----------------------------------------------------
    // NATIVE BROWSER SPEECH SYNTHESIS
    // ----------------------------------------------------
    if (!synth) return;

    if (isPaused) {
      synth.resume();
      setIsPaused(false);
      return;
    }

    // Terminate existing speech
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    const voice = voices.find((v) => v.name === selectedVoiceName);
    if (voice) {
      utterance.voice = (voice as any)._originalVoice || voice;
      utterance.lang = voice.lang;
    }

    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    // Track speaking offsets for karaoke highlight
    utterance.onboundary = (event) => {
      if (event.name === "word") {
        setCharIndex(event.charIndex);
        setCharLength(event.charLength || 0);
      }
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      setCharIndex(-1);
      setCharLength(0);
      saveToHistory(text, selectedVoiceName, rate, pitch);
    };

    utterance.onerror = (e) => {
      console.error("Speech Error:", e);
      setIsPlaying(false);
      setIsPaused(false);
      setCharIndex(-1);
      setCharLength(0);
    };

    setIsPlaying(true);
    setIsPaused(false);
    synth.speak(utterance);
  };

  const handlePause = () => {
    if (selectedVoiceName === "Huyền My (Giọng Nữ Studio - Cloud ☁️)") {
      const audio = cloudAudioRef.current;
      if (audio) {
        if (isPaused) {
          audio.play().then(() => setIsPaused(false));
        } else {
          audio.pause();
          setIsPaused(true);
        }
      }
      return;
    }

    if (!synth) return;
    if (synth.speaking) {
      if (synth.paused) {
        synth.resume();
        setIsPaused(false);
      } else {
        synth.pause();
        setIsPaused(true);
      }
    }
  };

  const handleStop = () => {
    if (selectedVoiceName === "Huyền My (Giọng Nữ Studio - Cloud ☁️)") {
      if (cloudAudioRef.current) {
        cloudAudioRef.current.pause();
        cloudAudioRef.current = null;
      }
      setIsPlaying(false);
      setIsPaused(false);
      setCharIndex(-1);
      setCharLength(0);
      return;
    }

    if (!synth) return;
    synth.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCharIndex(-1);
    setCharLength(0);
  };

  // Slice paragraphs / characters to render Highlighted text view in place of editor when speaking starts
  const highlightedTextView = useMemo(() => {
    if (charIndex < 0 || charIndex >= text.length) {
      return <p className="text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">{text}</p>;
    }

    const before = text.substring(0, charIndex);
    const current = text.substring(charIndex, charIndex + charLength);
    const after = text.substring(charIndex + charLength);

    return (
      <div className="text-slate-200 leading-relaxed font-sans whitespace-pre-wrap select-none" id="karaoke-text">
        {before}
        <span 
          ref={activeWordRef}
          className="bg-emerald-500/25 text-emerald-300 font-bold border-b-2 border-emerald-400 px-1 py-0.5 rounded shadow shadow-emerald-500/10 animate-pulse"
        >
          {current}
        </span>
        {after}
      </div>
    );
  }, [text, charIndex, charLength]);

  return (
    <div className="min-h-screen bg-[#060813] text-white flex flex-col font-sans select-none antialiased relative overflow-hidden selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[130px]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-500 rounded-full blur-[110px]" />
      </div>

      {/* 1. Elegant Header */}
      <header className="border-b border-white/5 bg-[#060813]/65 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Elegant Volume Speach Speaker Logo Icon */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#005cff] to-[#00c5ff] flex items-center justify-center border border-white/10 shadow-lg shadow-blue-500/25">
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-wider text-white select-none font-sans font-extrabold">VIBETTS</h1>
            </div>
          </div>
          {/* Header Action: Three vertical dots to toggle history list drawer */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 hover:bg-white/10 text-white/70 hover:text-white transition-all duration-200 cursor-pointer"
            title="Lịch sử đọc"
            id="btn-header-more"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. Main Body Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 relative z-10">
        
        {/* Dynamic Warning for Speech Synthesis in Iframe */}
        {!synth && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 text-red-300 text-sm">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-bold">Trình duyệt không hỗ trợ Web Speech Synthesis</p>
              <p className="opacity-95 mt-1">Vui lòng thử mở ứng dụng trên các trình duyệt hiện đại như Google Chrome, Microsoft Edge hoặc Safari để trải nghiệm âm thanh.</p>
            </div>
          </div>
        )}

        {/* Audio Wave Visualizer Row */}
        <AudioVisualizer isPlaying={isPlaying} isPaused={isPaused} speed={rate} charIndex={charIndex} textLength={text.length} />

        {/* Playback Controls Row */}
        <PlaybackControls
          isPlaying={isPlaying}
          isPaused={isPaused}
          onPlay={handlePlay}
          onPause={handlePause}
          onStop={handleStop}
          wordCount={currentWordCount}
        />

        {/* Content Section Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Block: Editor or Real-Time Highlights Player */}
          <div className="lg:col-span-12 xl:col-span-8 flex flex-col gap-6">
            {isPlaying ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/5 backdrop-blur-xl pt-3 pb-5 px-5 rounded-3xl border border-indigo-500/10 shadow-2xl flex flex-col gap-3 relative animate-fade-in"
              >
                {/* Clean player panel header with the dismiss button sitting higher */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-white/50 tracking-wider uppercase flex items-center gap-1.5 select-none">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Đang phát
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {/* Manual layout adjustment - trigger scroll-to-active with Target icon */}
                    <button
                      onClick={scrollToActiveWord}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 hover:text-indigo-200 transition-all duration-200 shadow-md cursor-pointer hover:scale-110 active:scale-95 select-none"
                      title="Cuộn tới từ đang phát"
                      id="btn-scroll-to-active"
                    >
                      <Target className="w-4 h-4 animate-spin-slow" />
                    </button>

                    <button
                      onClick={handleStop}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-sans font-black transition-all duration-200 shadow-xl cursor-pointer hover:scale-105 active:scale-95 select-none"
                      title="Tắt trình phát"
                      id="btn-dismiss-player-panel"
                    >
                      <Square className="w-3 h-3 fill-current" />
                      <span className="hidden sm:inline">Tắt trình phát</span>
                    </button>
                  </div>
                </div>

                {/* Scrollable View Containment */}
                <div 
                  ref={scrollContainerRef}
                  className="bg-[#080b1e]/60 border border-white/5 rounded-2xl p-5 h-85 overflow-y-auto no-scrollbar text-white scroll-smooth"
                >
                  {highlightedTextView}
                </div>
              </motion.div>
            ) : (
              <TextControlPanel
                text={text}
                onTextChange={setText}
                onApplyPreset={(p) => {
                  setText(p.text);
                  // Set default parameters suited for specific languages
                  if (p.language === "ja-JP") {
                    setRate(1.1);
                  } else {
                    setRate(1.0);
                  }
                }}
              />
            )}
          </div>

          {/* Right Block: Voice Panel and Parameters Tuning */}
          <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-6">
            <VoicePanel
              voices={voices}
              selectedVoiceName={selectedVoiceName}
              onSelectVoice={setSelectedVoiceName}
              rate={rate}
              pitch={pitch}
              volume={volume}
              onRateChange={setRate}
              onPitchChange={setPitch}
              onVolumeChange={setVolume}
              isPlaying={isPlaying}
              bookmarks={bookmarks}
              onSaveBookmark={handleSaveBookmark}
              onLoadBookmark={handleLoadBookmark}
              onDeleteBookmark={handleDeleteBookmark}
            />
          </div>
        </div>
      </main>

      {/* 3. Humble Footer */}
      <footer className="border-t border-white/5 bg-white/5 backdrop-blur-md py-6 mt-12 relative z-10 font-sans">
        <div className="max-w-7xl mx-auto px-4 select-none flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40 font-mono">
          <p>© 2026 VIBETTS. Powered by Web Speech Engine.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[11px] text-indigo-300 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span> Client-Synthesized
            </span>
            <span>v1.2.0</span>
          </div>
        </div>
      </footer>

      {/* 4. Sliding Right History Drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShowHistory(false)}
          />
          {/* Drawer content */}
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className="relative w-full max-w-md h-full bg-[#070914] border-l border-white/10 shadow-2xl p-6 overflow-y-auto no-scrollbar flex flex-col gap-4 z-10"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2 font-bold text-white text-base font-sans select-none">
                <span className="text-xl">📜</span> Lịch sử đọc
              </div>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-[10px] text-red-400 hover:text-red-300 transition-colors uppercase font-mono font-black border border-red-500/20 bg-red-500/5 px-2.5 py-1 rounded-xl hover:bg-red-500/10 cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                )}
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/5 hover:bg-white/14 text-white/60 hover:text-white transition-colors cursor-pointer ml-1.5"
                  title="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <HistoryLog
              history={history}
              onLoadHistory={(item) => {
                handleLoadHistory(item);
                setShowHistory(false); // Collapses drawer upon load
              }}
              onClearHistory={handleClearHistory}
              onDeleteHistory={handleDeleteHistory}
              onRenameHistory={handleRenameHistory}
            />
          </motion.div>
        </div>
      )}
    </div>
  );
}
