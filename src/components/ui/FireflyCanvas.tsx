'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  brightness: number;
  pulseSpeed: number;
  wavePhase: number;
}

interface WaveLine {
  points: { x: number; y: number }[];
  color: string;
  phase: number;
  amplitude: number;
  frequency: number;
}

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#06b6d4', '#ec4899'];
const PARTICLE_COUNT = 300;
const CONNECTION_DISTANCE = 100;
const CONNECTION_ALPHA = 0.1;
const WAVE_LINES = 8;

export default function FireflyCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const waveLinesRef = useRef<WaveLine[]>([]);
  const animationFrameRef = useRef<number>(0);
  const lastResizeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Setup canvas
    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      ctx.scale(dpr, dpr);
      
      const displayWidth = rect.width;
      const displayHeight = rect.height;
      
      canvas.style.width = displayWidth + 'px';
      canvas.style.height = displayHeight + 'px';
      
      return { width: displayWidth, height: displayHeight };
    };

    let { width, height } = updateCanvasSize();

    // Initialize particles
    const initializeParticles = () => {
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => {
        // Bias toward center-right
        const x = Math.random() * width * 0.7 + width * 0.2;
        const y = Math.random() * height;
        
        return {
          x,
          y,
          vx: (Math.random() - 0.3) * 0.5, // Biased rightward
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.5 + 0.5,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          brightness: Math.random() * 0.5 + 0.5,
          pulseSpeed: Math.random() * 0.02 + 0.01,
          wavePhase: Math.random() * Math.PI * 2,
        };
      });
    };

    // Initialize wave lines
    const initializeWaveLines = () => {
      waveLinesRef.current = Array.from({ length: WAVE_LINES }, (_, i) => {
        const startY = (height / (WAVE_LINES + 1)) * (i + 1);
        const points = Array.from({ length: Math.floor(width / 20) + 1 }, (_, j) => ({
          x: j * 20,
          y: startY,
        }));
        
        return {
          points,
          color: i % 2 === 0 ? '#8b5cf6' : '#6366f1',
          phase: Math.random() * Math.PI * 2,
          amplitude: 15 + Math.random() * 10,
          frequency: 0.01 + Math.random() * 0.01,
        };
      });
    };

    initializeParticles();
    initializeWaveLines();

    // Draw function
    const draw = () => {
      // Clear canvas with subtle trail effect
      ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
      ctx.fillRect(0, 0, width, height);

      // Update and draw particles
      particlesRef.current.forEach((particle) => {
        // Update position with drift
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Add wave motion
        particle.wavePhase += particle.pulseSpeed;
        const waveMotion = Math.sin(particle.wavePhase) * 0.3;
        particle.y += waveMotion;

        // Pulse brightness
        particle.brightness += particle.pulseSpeed * 0.5;
        if (particle.brightness > 1) particle.brightness = 1;
        if (particle.brightness < 0.3) particle.brightness = 0.3;

        // Wrap around edges
        if (particle.x < -10) particle.x = width + 10;
        if (particle.x > width + 10) particle.x = -10;
        if (particle.y < -10) particle.y = height + 10;
        if (particle.y > height + 10) particle.y = -10;

        // Draw particle with glow
        const glowRadius = particle.size * 8;
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          glowRadius
        );

        // Parse color for gradient stops
        const color = particle.color;
        gradient.addColorStop(0, `${color}${Math.round(particle.brightness * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(0.5, `${color}${Math.round(particle.brightness * 0.5 * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${color}00`);

        ctx.fillStyle = gradient;
        ctx.fillRect(
          particle.x - glowRadius,
          particle.y - glowRadius,
          glowRadius * 2,
          glowRadius * 2
        );

        // Draw particle core
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw connections between nearby particles
      ctx.strokeStyle = `rgba(139, 92, 246, ${CONNECTION_ALPHA})`;
      ctx.lineWidth = 0.5;

      for (let i = 0; i < particlesRef.current.length; i++) {
        for (let j = i + 1; j < particlesRef.current.length; j++) {
          const p1 = particlesRef.current[i];
          const p2 = particlesRef.current[j];
          
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < CONNECTION_DISTANCE) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw wave lines
      waveLinesRef.current.forEach((wave) => {
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();

        wave.points.forEach((point, index) => {
          const offsetY =
            Math.sin(wave.phase + index * wave.frequency) * wave.amplitude;
          const y = point.y + offsetY;
          
          if (index === 0) {
            ctx.moveTo(point.x, y);
          } else {
            ctx.lineTo(point.x, y);
          }
        });

        ctx.stroke();
        ctx.globalAlpha = 1;

        // Update wave phase
        wave.phase += 0.02;
      });
    };

    // Animation loop
    const animate = () => {
      draw();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      const now = Date.now();
      if (now - lastResizeRef.current < 100) return;
      lastResizeRef.current = now;

      const newSize = updateCanvasSize();
      width = newSize.width;
      height = newSize.height;

      initializeParticles();
      initializeWaveLines();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full absolute top-0 left-0"
      style={{
        backgroundColor: '#0f172a',
      }}
    />
  );
}
