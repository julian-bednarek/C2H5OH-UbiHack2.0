import { Upload, Zap, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export const FileUpload = ({
  onFileUploaded,
  onAudioReceived,
}: {
  onFileUploaded: (file: File) => void;
  onAudioReceived: (audioFile: File) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // This function processes PKL files by sending them to the backend
  const processPklFile = async (file: File) => {
    setIsProcessing(true);
    onFileUploaded(file); // Show file name in player

    try {
      const formData = new FormData();
      formData.append("file", file);

      toast({
        title: "Processing started",
        description: `Uploading ${file.name}... This may take a few minutes.`,
      });

      // This fetch call matches your curl command
      const response = await fetch("http://localhost:8000/api/", {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(600000), // 10 minute timeout
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Processing failed");
      }

      // Get the .wav file blob from response
      const audioBlob = await response.blob();
      const audioFile = new File([audioBlob], "processed_audio.wav", {
        type: "audio/wav",
      });

      // Pass the new audio file to the player
      onAudioReceived(audioFile);

      toast({
        title: "Processing complete!",
        description: `${file.name} has been converted to audio. Click play to listen.`,
      });
    } catch (error) {
      console.error("Processing error:", error);
      toast({
        title: "Processing failed",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred during processing. Is the backend server at localhost:8000 running?",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // This function handles all incoming files (from drop or select)
  const handleFile = (file: File | undefined) => {
    if (!file) return;

    // Check if it's a PKL file
    if (file.name.match(/\.pkl$/i)) {
      processPklFile(file);
    }
    // Check if it's a WAV file
    else if (file.name.match(/\.wav$/i)) {
      onFileUploaded(file); // Show file name
      onAudioReceived(file); // Load .wav directly
      toast({
        title: "WAV file loaded",
        description: `${file.name} is ready to play.`,
      });
    }
    // Otherwise, reject it
    else {
      toast({
        title: "Invalid file type",
        description: "Please upload a PKL or WAV file",
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0]; // App handles one file at a time
    handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; // App handles one file at a time
    handleFile(file);
    e.target.value = ""; // Reset input to allow re-uploading the same file
  };

  return (
    <section
      className={`glass-strong rounded-2xl p-10 border-2 transition-all duration-300 animate-float ${isDragging ? "neon-border scale-105" : "border-white/20"
        } ${isProcessing ? "opacity-75" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      role="region"
      aria-label="File upload area"
      aria-busy={isProcessing}
    >
      <div className="flex flex-col items-center justify-center gap-6 text-center">
        <div className="relative">
          <div
            className="absolute inset-0 bg-gradient-purple blur-3xl opacity-50 animate-pulse-slow"
            aria-hidden="true"
          />
          <div className="relative p-6 rounded-2xl glass neon-border">
            {isProcessing ? (
              <Loader2
                className="w-12 h-12 text-primary animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Upload
                className="w-12 h-12 text-primary animate-float"
                aria-hidden="true"
              />
            )}
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="font-black text-2xl text-gradient-cyber">
            {isProcessing ? "PROCESSING..." : "DROP YOUR PKL OR WAV FILE"}
          </h2>
          <p
            className="text-muted-foreground text-sm"
            id="file-upload-description"
          >
            {isProcessing
              ? "Converting your data to audio. This may take up to 5 minutes..."
              : "Upload a PKL file to process or a WAV file to play directly."}
          </p>
        </div>
        <Button
          asChild
          className="relative group bg-gradient-fire hover:scale-110 transition-all duration-300 shadow-neon border-0 h-12 px-8 font-bold"
          disabled={isProcessing}
        >
          <label
            className={`cursor-pointer flex items-center gap-2 ${isProcessing ? "cursor-not-allowed opacity-50" : ""
              }`}
            htmlFor="file-input"
          >
            <input
              id="file-input"
              type="file"
              accept=".pkl,.wav" // Updated to accept both
              className="hidden"
              onChange={handleFileInput}
              aria-describedby="file-upload-description"
              disabled={isProcessing}
            />
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                PROCESSING
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 animate-pulse" aria-hidden="true" />
                SELECT FILE
              </>
            )}
          </label>
        </Button>
      </div>
    </section>
  );
};