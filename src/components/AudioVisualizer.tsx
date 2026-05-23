import { useEffect, useRef } from "react";
import { Disc, Play, Pause, Music, Mic, Headphones } from "lucide-react";

interface AudioVisualizerProps {
  isPlaying: boolean;
  isPaused: boolean;
  speed: number;
  charIndex?: number;
  textLength?: number;
}

export default function AudioVisualizer({
  isPlaying,
  isPaused,
  speed,
  charIndex = -1,
  textLength = 0,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions with high-DPI scaling
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(() => resizeCanvas());
    resizeObserver.observe(canvas.parentElement || canvas);

    const draw = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      // Clear with subtle fade-back
      ctx.clearRect(0, 0, width, height);

      const numWaves = 4;
      const waveColors = [
        "rgba(129, 140, 248, 0.45)", // Indigo-400
        "rgba(168, 85, 247, 0.35)", // Purple-500
        "rgba(59, 130, 246, 0.25)", // Blue-500
        "rgba(139, 92, 246, 0.15)"   // Violet-500
      ];

      // If playing AND not paused, advance phase
      if (isPlaying && !isPaused) {
        phaseRef.current += 0.08 * speed;
      }

      ctx.lineWidth = 1.2;
      ctx.lineCap = "round";

      for (let i = 0; i < numWaves; i++) {
        ctx.beginPath();
        ctx.strokeStyle = waveColors[i];

        // Wave parameters calculated using wave index
        const amplitude = isPlaying && !isPaused
          ? (14 - i * 2) * (0.6 + Math.sin(phaseRef.current * 0.5 + i) * 0.4) 
          : 1.5; // Flat line if not speaking
        
        const frequency = 0.012 + i * 0.004;

        for (let x = 0; x < width; x++) {
          // Centered vertical alignment slightly pushed to bottom half to avoid text overlay
          const y = (height * 0.65) + 
            Math.sin(x * frequency + phaseRef.current + i * 1.5) * 
            amplitude * 
            Math.sin((x / width) * Math.PI); // Pin ends to zero for clean loop

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // Add small particle pulses while speaking
      if (isPlaying && !isPaused && Math.random() < 0.1) {
        ctx.beginPath();
        const grad = ctx.createRadialGradient(
          width / 2, height / 2, 0,
          width / 2, height / 2, 100
        );
        grad.addColorStop(0, "rgba(129, 140, 248, 0.04)");
        grad.addColorStop(1, "rgba(129, 140, 248, 0)");
        ctx.fillStyle = grad;
        ctx.arc(width / 2, height / 2, 100, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [isPlaying, isPaused, speed]);

  // Compute progress of the karaoke or speech segment
  const progressPercent = textLength > 0 && charIndex >= 0
    ? Math.min(100, Math.round((charIndex / textLength) * 100))
    : 0;

  return (
    <div className="relative w-full h-36 bg-gradient-to-r from-[#0d1026] via-[#0f143c] to-[#0d1026] backdrop-blur-xl rounded-3xl overflow-hidden border border-indigo-500/15 shadow-2xl flex flex-col justify-between pt-4 pb-5 px-5 group select-none">
      
      {/* Background visualizer canvas wave stream */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-60 z-0" />

      {/* Media Player Core Interface */}
      <div className="flex items-center justify-between w-full h-full relative z-10">
        
        {/* Left: Spinning Vinyl Disc case */}
        <div className="flex items-center gap-4.5">
          <div className="relative -translate-y-2.5">
            <div className={`w-16 h-16 rounded-full bg-slate-950 border-2 border-indigo-500/25 flex items-center justify-center relative shadow-lg shadow-black/40 overflow-hidden`}>
              {/* Disc Grooves */}
              <div className="absolute inset-2 rounded-full border border-white/5 opacity-40"></div>
              <div className="absolute inset-4 rounded-full border border-white/5 opacity-30"></div>
              <div className="absolute inset-6 rounded-full border border-white/5 opacity-20"></div>
              
              {/* Spinning core */}
              <div className={`w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 border border-black/30 flex items-center justify-center text-white ${
                isPlaying && !isPaused ? "animate-spin" : ""
              }`} style={{ animationDuration: "3.5s" }}>
                <Music className="w-2.5 h-2.5 text-white/90" />
              </div>
            </div>
          </div>

          {/* Speaker Text Descriptions */}
          <div className="text-left select-none">
            <div className="flex items-center gap-2">
              {!isPlaying && (
                <h3 className="font-bold text-white text-base tracking-tight font-sans flex items-center gap-1.5 animate-fade-in">
                  <Headphones className="w-4 h-4 text-indigo-400" />
                  Trình phát âm thanh
                </h3>
              )}
            </div>
          </div>
        </div>

        {/* Right: Interactive playing audio bar animations pins (pure CSS) */}
        <div className="flex items-center gap-1">
          {isPlaying && !isPaused ? (
            <div className="flex items-end gap-0.5 h-6">
              <span className="w-1 bg-indigo-400 rounded-full animate-[pulse_1.2s_infinite_ease-in-out]" style={{ height: '60%' }}></span>
              <span className="w-1 bg-purple-400 rounded-full animate-[pulse_0.9s_infinite_ease-in-out_0.2s]" style={{ height: '90%' }}></span>
              <span className="w-1 bg-indigo-300 rounded-full animate-[pulse_1s_infinite_ease-in-out_0.4s]" style={{ height: '40%' }}></span>
              <span className="w-1 bg-emerald-400 rounded-full animate-[pulse_1.1s_infinite_ease-in-out_0.1s]" style={{ height: '70%' }}></span>
              <span className="w-1 bg-indigo-400 rounded-full animate-[pulse_0.8s_infinite_ease-in-out_0.3s]" style={{ height: '50%' }}></span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Bottom: Flowing Scrubbler / Karaoke Progress timeline indicator */}
      <div className="w-full mt-4.5 pt-2 border-t border-white/5 relative z-10 flex flex-col gap-1.5 translate-y-1">
        <div className="w-full h-1.5 bg-white/10 rounded-full relative">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-300" 
            style={{ width: `${progressPercent}%` }}
          />
          {/* Glowing thumb to visualize active playing progress point */}
          {isPlaying && (
            <div 
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white border-2 border-indigo-500 shadow-[0_0_10px_#818cf8] transition-all duration-300 z-10"
              style={{ left: `${progressPercent}%` }}
            />
          )}
        </div>
        <div className="flex justify-between items-center text-[10px] text-white/45 font-mono tracking-wider">
          <span>
            {isPlaying 
              ? (isPaused ? `⏸️ TẠM DỪNG: ${progressPercent}%` : `🔊 ĐANG PHÁT: ${progressPercent}%`) 
              : `⏹️ SẴN SÀNG: 0%`
            }
          </span>
          {isPlaying && charIndex >= 0 && textLength > 0 && (
            <span className="text-white/35">
              Ký tự: {charIndex}/{textLength}
            </span>
          )}
        </div>
      </div>

    </div>
  );
}
