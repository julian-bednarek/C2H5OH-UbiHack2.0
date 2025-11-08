import { Music2, Play, Pause, Trash2, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

type MusicGalleryProps = {
  files: File[];
  selectedFile: File | null;
  isPlaying: boolean;
  onSelectFile: (file: File) => void;
  onDeleteFile: (file: File) => void;
};

export const MusicGallery = ({ 
  files, 
  selectedFile, 
  isPlaying,
  onSelectFile,
  onDeleteFile 
}: MusicGalleryProps) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <section
      className="glass-strong rounded-2xl p-8 border-2 border-white/20 animate-float"
      role="region"
      aria-label="Music gallery"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-purple blur-2xl opacity-50 animate-pulse-slow" aria-hidden="true" />
            <div className="relative p-3 rounded-2xl glass neon-border">
              <Music2 className="w-8 h-8 text-primary animate-pulse" aria-hidden="true" />
            </div>
          </div>
          <div>
            <h2 className="font-black text-3xl text-gradient-cyber">MUSIC GALLERY</h2>
            <p className="text-sm text-muted-foreground font-bold mt-1">
              {files.length} {files.length === 1 ? 'TRACK' : 'TRACKS'} LOADED
            </p>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="p-6 rounded-full glass border-2 border-dashed border-primary/30">
            <Music2 className="w-16 h-16 text-primary/50" aria-hidden="true" />
          </div>
          <p className="text-muted-foreground font-bold text-lg">No tracks uploaded yet</p>
          <p className="text-muted-foreground text-sm">Upload PKL or WAV files to see them here</p>
        </div>
      ) : (
        <ScrollArea className="h-[500px] pr-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((file, index) => {
              const isSelected = selectedFile === file;
              const isCurrentlyPlaying = isSelected && isPlaying;
              
              return (
                <Card
                  key={`${file.name}-${index}`}
                  className={`group relative overflow-hidden border-2 transition-all duration-500 hover:shadow-2xl ${
                    isSelected 
                      ? "border-primary bg-gradient-to-br from-primary/20 via-primary/10 to-transparent shadow-neon scale-105" 
                      : "border-white/20 hover:border-primary/50 glass hover:scale-102"
                  }`}
                >
                  {/* Album Art Area */}
                  <div 
                    className="aspect-square relative cursor-pointer overflow-hidden"
                    onClick={() => onSelectFile(file)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectFile(file);
                      }
                    }}
                    aria-label={`Select ${file.name}`}
                  >
                    {/* Animated Background */}
                    <div className={`absolute inset-0 bg-gradient-fire opacity-20 ${isCurrentlyPlaying ? 'animate-pulse' : ''}`} aria-hidden="true" />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-accent/20 to-transparent" aria-hidden="true" />
                    
                    {/* Visualizer Bars */}
                    <div className="absolute inset-0 flex items-end justify-center gap-1 p-8 opacity-40">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 bg-primary rounded-t-full transition-all duration-300 ${
                            isCurrentlyPlaying ? 'animate-pulse' : ''
                          }`}
                          style={{
                            height: `${30 + Math.random() * 70}%`,
                            animationDelay: `${i * 0.1}s`
                          }}
                          aria-hidden="true"
                        />
                      ))}
                    </div>

                    {/* Play/Pause Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`p-6 rounded-full transition-all duration-300 ${
                        isCurrentlyPlaying 
                          ? "bg-primary/90 scale-110 shadow-neon animate-pulse-slow" 
                          : "bg-primary/70 group-hover:bg-primary/90 group-hover:scale-110"
                      }`}>
                        {isCurrentlyPlaying ? (
                          <Pause className="w-10 h-10 text-primary-foreground fill-current" aria-hidden="true" />
                        ) : (
                          <Play className="w-10 h-10 text-primary-foreground fill-current" aria-hidden="true" />
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <div className="px-3 py-1 rounded-full bg-primary/90 backdrop-blur-sm border border-primary-foreground/20">
                          <p className="text-xs font-black text-primary-foreground flex items-center gap-1">
                            {isCurrentlyPlaying ? (
                              <>
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                PLAYING
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                                SELECTED
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className={`p-4 border-t-2 transition-all duration-300 ${
                    isSelected 
                      ? "border-primary/50 bg-primary/5" 
                      : "border-white/10 group-hover:border-primary/30"
                  }`}>
                    <div className="space-y-2">
                       <h3 className={`font-black text-sm truncate transition-colors duration-300 ${
                        isSelected 
                          ? "text-primary" 
                          : "text-foreground group-hover:text-primary"
                      }`}>
                        {file.name.replace(/\.(pkl|wav)$/i, '')}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        <span>{formatFileSize(file.size)}</span>
                      </div>
                    </div>

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFile(file);
                      }}
                      aria-label={`Delete ${file.name}`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                      DELETE
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </section>
  );
};
