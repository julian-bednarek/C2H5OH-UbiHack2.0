import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { MusicGallery } from "@/components/MusicGallery";
import { MusicPlayer } from "@/components/MusicPlayer";
import { ChatBot } from "@/components/ChatBot";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Logo } from "@/components/Logo";
import { useToast } from "@/hooks/use-toast";

type EqualizerSettings = {
  bass: number;
  mid: number;
  treble: number;
};

const Index = () => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [equalizer, setEqualizer] = useState<EqualizerSettings>({
    bass: 0,
    mid: 0,
    treble: 0,
  });
  const { toast } = useToast();

  const handleFileUpload = (files: File[]) => {
    setUploadedFiles((prev) => [...prev, ...files]);
    if (files.length > 0) {
      setSelectedFile(files[0]);
      setIsPlaying(false);
    }
    toast({
      title: `${files.length} file${files.length > 1 ? 's' : ''} added`,
      description: `${files.length} track${files.length > 1 ? 's' : ''} ready to play`
    });
  };

  const handleDeleteFile = (file: File) => {
    setUploadedFiles((prev) => prev.filter(f => f !== file));
    if (selectedFile === file) {
      setSelectedFile(null);
      setIsPlaying(false);
    }
    toast({
      title: "File removed",
      description: `${file.name} has been deleted`
    });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      <AnimatedBackground />
      
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none" aria-hidden="true" />
      
      <header className="relative border-b border-white/10 glass-strong" role="banner">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <Logo />
          <div className="glass px-6 py-2 rounded-full border border-white/20 animate-glow" role="status" aria-live="off">
            <p className="text-xs font-bold text-gradient-cyber">
              NEURAL AUDIO ENGINE v2.0
              <span className="sr-only">- Current application version</span>
            </p>
          </div>
        </div>
      </header>

      <main id="main-content" className="relative container mx-auto px-6 py-12 max-w-6xl" role="main">
        <h1 className="sr-only">DATABAND - Transform Medical Data Into Sound</h1>
        <div className="space-y-8">
          <FileUpload onFileUploaded={handleFileUpload} />
          <MusicGallery 
            files={uploadedFiles}
            selectedFile={selectedFile}
            isPlaying={isPlaying}
            onSelectFile={setSelectedFile}
            onDeleteFile={handleDeleteFile}
          />
          <MusicPlayer 
            fileName={selectedFile?.name} 
            audioFile={selectedFile}
            isPlaying={isPlaying}
            onPlayingChange={setIsPlaying}
            equalizer={equalizer}
            onEqualizerChange={setEqualizer}
          />
          <ChatBot onEqualizerChange={setEqualizer} />
        </div>
      </main>
      
      <div className="fixed bottom-8 right-8 glass px-4 py-2 rounded-full border border-white/20 animate-pulse-slow" role="status" aria-live="polite">
        <p className="text-xs font-bold text-muted-foreground">Backend: Mock Mode</p>
      </div>
    </div>
  );
};

export default Index;
