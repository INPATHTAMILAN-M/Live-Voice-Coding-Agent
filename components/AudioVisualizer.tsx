import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  volume: number; // 0 to 1
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isActive, volume }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // State for the 4 bars
  // We store current height to interpolate smoothly
  const barsRef = useRef<number[]>([0.2, 0.2, 0.2, 0.2]); 

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      // Config for the 4 bars
      const barCount = 4;
      const spacing = 12; // Space between bars
      const totalWidth = width * 0.6; // Occupy 60% of width
      const barWidth = (totalWidth - (spacing * (barCount - 1))) / barCount;
      const startX = (width - totalWidth) / 2;
      const centerY = height / 2;
      const maxBarHeight = height * 0.8;
      const minBarHeight = barWidth; // Make them circular when small

      // Animation logic
      const time = Date.now() / 1000;
      
      barsRef.current = barsRef.current.map((prevHeight, i) => {
        let targetHeight = 0.2; // Default idle height

        if (isActive) {
          // Create a wave-like effect across the 4 bars using sine + volume
          const noise = Math.sin(time * 5 + i); 
          // Base volume effect
          const volumeEffect = Math.max(0.1, volume * 2.5); 
          
          // The center bars usually react more in voice assistants
          const positionBias = (i === 1 || i === 2) ? 1.2 : 0.8;
          
          targetHeight = Math.min(1, volumeEffect * positionBias + (noise * 0.1));
        }

        // Smooth lerp
        return prevHeight + (targetHeight - prevHeight) * 0.15;
      });

      // Draw bars
      ctx.fillStyle = '#FFFFFF'; // White bars like the example
      
      barsRef.current.forEach((h, i) => {
        const currentHeight = minBarHeight + (maxBarHeight - minBarHeight) * h;
        const x = startX + i * (barWidth + spacing);
        const y = centerY - currentHeight / 2;
        const radius = barWidth / 2;
        
        // Draw pill shape manually for compatibility (roundRect can crash some browsers)
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, y + currentHeight - radius);
        ctx.quadraticCurveTo(x + barWidth, y + currentHeight, x + barWidth - radius, y + currentHeight);
        ctx.lineTo(x + radius, y + currentHeight);
        ctx.quadraticCurveTo(x, y + currentHeight, x, y + currentHeight - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
      });

      requestRef.current = requestAnimationFrame(animate);
    };

    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isActive, volume]);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={300}
        height={150}
        className="w-full h-full"
      />
    </div>
  );
};

export default AudioVisualizer;