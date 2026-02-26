export const HeroSection = () => {
  return (
    <div className="hero-glow relative pt-20 md:pt-32 pb-12 md:pb-20 text-center" data-testid="hero-section">
      <div className="relative z-10">
        <p className="text-[10px] md:text-xs font-mono tracking-[0.3em] uppercase text-primary mb-6 opacity-80">
          Natural Language GitHub Search
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter leading-none mb-6 font-[Chivo]">
          Search GitHub
          <br />
          <span className="text-primary">Like You Think</span>
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed font-[Manrope]">
          Find repositories, issues, pull requests, users, and code
          using plain English. No search syntax required.
        </p>
      </div>
    </div>
  );
};
