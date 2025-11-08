import { Play, Pause, Volume2, Activity } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

type EqualizerSettings = {
  bass: number;
  mid: number;
  treble: number;
};

type MusicPlayerProps = {
  fileName?: string;
  audioFile?: File | null;
  isPlaying: boolean;
  onPlayingChange: (playing: boolean) => void;
  equalizer: EqualizerSettings;
  onEqualizerChange: (settings: EqualizerSettings) => void;
};

export const MusicPlayer = ({ fileName, audioFile, isPlaying, onPlayingChange, equalizer, onEqualizerChange }: MusicPlayerProps) => {
  const [volume, setVolume] = useState([70]);
  const [bars, setBars] = useState<number[]>(Array(20).fill(0));
  const { toast } = useToast();
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const midFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);

  // Initialize audio context and nodes
  useEffect(() => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    audioContextRef.current = new AudioContext();
    
    // Create nodes
    analyserRef.current = audioContextRef.current.createAnalyser();
    gainNodeRef.current = audioContextRef.current.createGain();
    
    // Create equalizer filters with optimized settings for .wav files
    // Bass: Low shelf filter affecting frequencies below 250Hz
    bassFilterRef.current = audioContextRef.current.createBiquadFilter();
    bassFilterRef.current.type = "lowshelf";
    bassFilterRef.current.frequency.value = 250; // Increased from 200 for better bass control
    bassFilterRef.current.gain.value = 0;
    
    // Mid: Peaking filter centered at 1kHz
    midFilterRef.current = audioContextRef.current.createBiquadFilter();
    midFilterRef.current.type = "peaking";
    midFilterRef.current.frequency.value = 1000;
    midFilterRef.current.Q.value = 1.4; // Slightly higher Q for more focused mid control
    midFilterRef.current.gain.value = 0;
    
    // Treble: High shelf filter affecting frequencies above 4kHz
    trebleFilterRef.current = audioContextRef.current.createBiquadFilter();
    trebleFilterRef.current.type = "highshelf";
    trebleFilterRef.current.frequency.value = 4000; // Increased from 3000 for clearer treble
    trebleFilterRef.current.gain.value = 0;
    
    // Set up analyser for visualizer
    analyserRef.current.fftSize = 64;
    analyserRef.current.smoothingTimeConstant = 0.8;
    
    console.log("Audio context initialized:", audioContextRef.current.state);
    
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Load audio file
  useEffect(() => {
    if (!audioFile || !audioContextRef.current) return;
    
    console.log("Loading audio file:", audioFile.name, audioFile.type);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        console.log("Audio file read, size:", arrayBuffer.byteLength, "bytes");
        
        // Resume audio context if suspended (required by some browsers)
        if (audioContextRef.current?.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        
        const audioBuffer = await audioContextRef.current!.decodeAudioData(arrayBuffer);
        audioBufferRef.current = audioBuffer;
        
        console.log("Audio decoded successfully:", {
          duration: audioBuffer.duration,
          sampleRate: audioBuffer.sampleRate,
          channels: audioBuffer.numberOfChannels
        });
        
        toast({
          title: "Audio loaded successfully",
          description: `${audioFile.name} - ${audioBuffer.duration.toFixed(1)}s, ${audioBuffer.numberOfChannels} channel(s)`,
        });
      } catch (error) {
        console.error("Error loading audio:", error);
        toast({
          title: "Error loading audio",
          description: error instanceof Error ? error.message : "Please upload a valid audio file",
          variant: "destructive",
        });
      }
    };
    
    reader.onerror = () => {
      toast({
        title: "File read error",
        description: "Could not read the audio file",
        variant: "destructive",
      });
    };
    
    reader.readAsArrayBuffer(audioFile);
  }, [audioFile, toast]);

  // Update equalizer values
  useEffect(() => {
    if (!bassFilterRef.current || !midFilterRef.current || !trebleFilterRef.current) return;
    
    bassFilterRef.current.gain.value = equalizer.bass;
    midFilterRef.current.gain.value = equalizer.mid;
    trebleFilterRef.current.gain.value = equalizer.treble;
  }, [equalizer]);

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume[0] / 100;
    }
  }, [volume]);

  // Visualizer animation
  useEffect(() => {
    if (!isPlaying || !analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateBars = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      const normalizedBars = Array.from(dataArray.slice(0, 20)).map(v => (v / 255) * 100);
      setBars(normalizedBars);
    };
    
    const interval = setInterval(updateBars, 50);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlayback = async () => {
    if (!audioContextRef.current || !audioBufferRef.current) {
      toast({
        title: "No audio loaded",
        description: "Please upload an audio file first",
        variant: "destructive",
      });
      return;
    }

    if (isPlaying) {
      // Stop playback
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.stop();
        } catch (e) {
          console.error("Error stopping audio:", e);
        }
        audioSourceRef.current = null;
      }
      onPlayingChange(false);
      console.log("Playback stopped");
    } else {
      try {
        // Resume audio context if needed (required by browsers for user interaction)
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
          console.log("Audio context resumed");
        }
        
        // Create new buffer source
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        
        // Connect audio chain: source -> bass -> mid -> treble -> gain -> analyser -> destination
        source.connect(bassFilterRef.current!);
        bassFilterRef.current!.connect(midFilterRef.current!);
        midFilterRef.current!.connect(trebleFilterRef.current!);
        trebleFilterRef.current!.connect(gainNodeRef.current!);
        gainNodeRef.current!.connect(analyserRef.current!);
        analyserRef.current!.connect(audioContextRef.current.destination);
        
        console.log("Audio chain connected with EQ settings:", {
          bass: bassFilterRef.current!.gain.value,
          mid: midFilterRef.current!.gain.value,
          treble: trebleFilterRef.current!.gain.value,
          volume: gainNodeRef.current!.gain.value
        });
        
        source.start(0);
        source.onended = () => {
          onPlayingChange(false);
          console.log("Playback ended");
        };
        
        audioSourceRef.current = source;
        onPlayingChange(true);
        console.log("Playback started");
      } catch (error) {
        console.error("Error starting playback:", error);
        toast({
          title: "Playback error",
          description: error instanceof Error ? error.message : "Could not start playback",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <section className="glass-strong rounded-2xl p-8 border border-white/20 relative overflow-hidden group hover:border-primary/50 transition-all duration-300" role="region" aria-label="Sonic output music player">
      <div className="absolute inset-0 bg-gradient-purple opacity-0 group-hover:opacity-20 transition-opacity duration-300" aria-hidden="true" />
      <div className="relative space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-secondary animate-pulse" aria-hidden="true" />
              <h2 className="font-black text-xl text-gradient">SONIC OUTPUT</h2>
            </div>
            <p className="text-sm text-muted-foreground" id="player-status" role="status" aria-live="polite">
              {fileName ? `Playing audio generated from file: ${fileName}` : "No audio file loaded. Please upload a data file to begin."}
            </p>
          </div>
          <Button
            size="icon"
            onClick={togglePlayback}
            disabled={!fileName}
            className="h-16 w-16 rounded-full bg-gradient-fire hover:scale-110 transition-all duration-300 shadow-neon border-0"
            aria-label={isPlaying ? "Pause audio playback" : "Play audio"}
            aria-describedby="player-status"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="w-8 h-8" aria-hidden="true" /> : <Play className="w-8 h-8 ml-1" aria-hidden="true" />}
            <span className="sr-only">{isPlaying ? "Pause" : "Play"}</span>
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-1 h-32 glass rounded-xl p-4" role="img" aria-label="Audio visualizer showing sound levels">
            {bars.map((height, i) => (
              <div
                key={i}
                className="flex-1 bg-gradient-cyber rounded-t-lg transition-all duration-100 shadow-cyan"
                style={{
                  height: `${isPlaying ? height : 10}%`,
                  opacity: isPlaying ? 0.8 : 0.3,
                }}
                aria-hidden="true"
              />
            ))}
          </div>
          
          <div className="glass rounded-xl p-4 space-y-4" role="group" aria-label="Audio controls">
            <div className="flex items-center gap-4">
              <Volume2 className="w-5 h-5 text-primary" aria-hidden="true" />
              <label htmlFor="volume-slider" className="sr-only">Adjust volume level from 0 to 100 percent</label>
              <Slider
                id="volume-slider"
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                className="flex-1"
                aria-label={`Volume level: ${volume[0]} percent`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={volume[0]}
                aria-valuetext={`${volume[0]} percent volume`}
              />
              <span className="text-sm font-bold text-primary w-12" aria-live="polite" aria-atomic="true">
                {volume[0]}%
                <span className="sr-only">volume level</span>
              </span>
            </div>
          </div>
          
          <div className="glass rounded-xl p-6 space-y-6" role="group" aria-label="Equalizer controls">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gradient-cyber">EQUALIZER</h3>
              <button
                onClick={() => onEqualizerChange({ bass: 0, mid: 0, treble: 0 })}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
                aria-label="Reset equalizer to flat response"
              >
                Reset
              </button>
            </div>
            
            <div className="space-y-5">
              {/* Bass Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="bass-slider" className="text-xs font-semibold text-foreground">
                    Bass
                  </label>
                  <span className="text-xs font-bold text-primary w-16 text-right" aria-live="polite">
                    {equalizer.bass > 0 ? '+' : ''}{equalizer.bass}dB
                  </span>
                </div>
                <Slider
                  id="bass-slider"
                  value={[equalizer.bass]}
                  onValueChange={(value) => onEqualizerChange({ ...equalizer, bass: value[0] })}
                  min={-12}
                  max={12}
                  step={1}
                  className="flex-1"
                  aria-label={`Bass level: ${equalizer.bass} decibels`}
                  aria-valuemin={-12}
                  aria-valuemax={12}
                  aria-valuenow={equalizer.bass}
                  aria-valuetext={`${equalizer.bass} decibels bass`}
                />
              </div>
              
              {/* Mid Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="mid-slider" className="text-xs font-semibold text-foreground">
                    Mid
                  </label>
                  <span className="text-xs font-bold text-primary w-16 text-right" aria-live="polite">
                    {equalizer.mid > 0 ? '+' : ''}{equalizer.mid}dB
                  </span>
                </div>
                <Slider
                  id="mid-slider"
                  value={[equalizer.mid]}
                  onValueChange={(value) => onEqualizerChange({ ...equalizer, mid: value[0] })}
                  min={-12}
                  max={12}
                  step={1}
                  className="flex-1"
                  aria-label={`Mid level: ${equalizer.mid} decibels`}
                  aria-valuemin={-12}
                  aria-valuemax={12}
                  aria-valuenow={equalizer.mid}
                  aria-valuetext={`${equalizer.mid} decibels mid range`}
                />
              </div>
              
              {/* Treble Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="treble-slider" className="text-xs font-semibold text-foreground">
                    Treble
                  </label>
                  <span className="text-xs font-bold text-primary w-16 text-right" aria-live="polite">
                    {equalizer.treble > 0 ? '+' : ''}{equalizer.treble}dB
                  </span>
                </div>
                <Slider
                  id="treble-slider"
                  value={[equalizer.treble]}
                  onValueChange={(value) => onEqualizerChange({ ...equalizer, treble: value[0] })}
                  min={-12}
                  max={12}
                  step={1}
                  className="flex-1"
                  aria-label={`Treble level: ${equalizer.treble} decibels`}
                  aria-valuemin={-12}
                  aria-valuemax={12}
                  aria-valuenow={equalizer.treble}
                  aria-valuetext={`${equalizer.treble} decibels treble`}
                />
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground pt-2 border-t border-white/10">
              <p>Adjust manually or ask AI Producer to control the equalizer</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
