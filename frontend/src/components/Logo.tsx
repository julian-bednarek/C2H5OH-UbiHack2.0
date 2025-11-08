export const Logo = () => {
  return (
    <div className="flex items-center gap-1" role="img" aria-label="DATABAND - Medical Data to Sound Transformation">
      <span className="text-4xl font-black tracking-tighter">
        <span className="text-gradient neon-text">DATABAN</span>
        <span className="relative inline-block text-gradient-cyber neon-text">
          D
          <span className="absolute -right-3 -top-1 flex flex-col gap-0 text-sm text-secondary animate-pulse-slow" aria-hidden="true">
            <span>♪</span>
            <span className="-mt-2">♫</span>
          </span>
        </span>
      </span>
    </div>
  );
};
