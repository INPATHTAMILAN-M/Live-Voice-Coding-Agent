import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  volume: number; // 0 to 1
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive, volume }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const phaseRef = useRef<number>(0);
  
  // Use a ref to hold the latest volume to decouple animation loop from render cycle
  const volumeRef = useRef(volume);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      // Update dimensions
      const { width, height } = canvas;
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Base configuration
      const centerY = height / 2;
      const baseAmplitude = height * 0.05; // Subtle breathing when idle
      // Interpolate volume for smoothness (optional, but good for jitter)
      // Here we just use the raw ref for responsiveness
      const activeAmplitude = height * 0.4 * volumeRef.current; 
      
      const amplitude = isActive ? baseAmplitude + activeAmplitude : 2; // Flat-ish line when inactive
      
      // Increment phase for movement
      phaseRef.current += 0.15; // Speed of the wave
      
      // Colors (Gemini Blue, Red, Yellow, Green)
      const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'];
      
      // Draw 4 overlapping sine waves
      colors.forEach((color, i) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        // Opacity based on activity
        ctx.globalAlpha = isActive ? 0.8 : 0.3;

        for (let x = 0; x <= width; x+=5) {
          // Varies frequency slightly for each line
          const frequency = 0.01 + (i * 0.002); 
          // Phase offset for each line so they don't overlap perfectly
          const phaseOffset = i * 2; 
          
          // Calculate Y
          const y = centerY + Math.sin(x * frequency + phaseRef.current + phaseOffset) * amplitude * Math.sin(x / width * Math.PI); // Windowing function to pin edges
          
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(requestRef.current);
  }, [isActive]);

  return (
    <div className="w-full h-full bg-black/20 rounded-lg overflow-hidden relative">
       {/* Background Glow Effect */}
       {isActive && (
         <div 
           className="absolute inset-0 bg-blue-500/10 blur-xl transition-opacity duration-500" 
           style={{ opacity: Math.min(1, volume * 2) }}
         />
       )}
      <canvas
        ref={canvasRef}
        width={300}
        height={150}
        className="w-full h-full relative z-10"
      />
    </div>
  );
};

export default AudioVisualizer;