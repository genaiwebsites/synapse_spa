"use client";

import { useEffect, useRef, useState } from "react";
import { X, ShieldCheck, EnvelopeSimple, LockKey, Check, GitBranch, Cloud } from "@phosphor-icons/react";

export default function AuthPortal({ isOpen, onClose }) {
  const canvasRef = useRef(null);
  const cardRef = useRef(null);
  
  // Track mouse coordinates globally for the repel effect
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isOpen) {
        mouseRef.current = { x: e.clientX, y: e.clientY };
      }
    };
    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => window.removeEventListener("mousemove", handleGlobalMouseMove);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    let pWidth, pHeight, animId;
    const fibers = [];
    const numFibers = 120;
    const numSegments = 30;
    let dpr = 1;

    const colorLeft1 = [6, 182, 212];
    const colorLeft2 = [16, 185, 129];
    const colorRight1 = [112, 0, 255];
    const colorRight2 = [168, 85, 247];

    function lerpColor(c1, c2, t) {
      return `rgb(${Math.round(c1[0] + (c2[0] - c1[0]) * t)}, ${Math.round(c1[1] + (c2[1] - c1[1]) * t)}, ${Math.round(c1[2] + (c2[2] - c1[2]) * t)})`;
    }

    function cubicBezier(p0, p1, p2, p3, t) {
      const u = 1 - t;
      const tt = t * t;
      const uu = u * u;
      const uuu = uu * u;
      const ttt = tt * t;
      return {
        x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
        y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
      };
    }

    function initFibers() {
      fibers.length = 0;
      const cx = pWidth / 2;
      const cy = pHeight / 2;
      
      let cardW = 440;
      let cardH = 500;
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        if (rect.width > 0) cardW = rect.width;
        if (rect.height > 0) cardH = rect.height;
      }
      
      const offset = (cardW / 2) + 2;

      for (let i = 0; i < numFibers; i++) {
        const isLeft = i < numFibers / 2;
        const sideIdx = i % (numFibers / 2);
        const tNorm = sideIdx / ((numFibers / 2) - 1);

        const startY = pHeight * 0.1 + tNorm * pHeight * 0.8;
        const endY = cy - (cardH * 0.45) + tNorm * (cardH * 0.9);

        const p0 = { x: isLeft ? -20 : pWidth + 20, y: startY };
        const p3 = { x: isLeft ? cx - offset : cx + offset, y: endY };
        
        const p1 = { x: isLeft ? pWidth * 0.25 : pWidth * 0.75, y: startY };
        const p2 = { x: isLeft ? cx - offset - 120 : cx + offset + 120, y: endY };

        const color = isLeft ? lerpColor(colorLeft1, colorLeft2, tNorm) : lerpColor(colorRight1, colorRight2, tNorm);

        const points = [];
        for (let j = 0; j <= numSegments; j++) {
          const t = j / numSegments;
          const base = cubicBezier(p0, p1, p2, p3, t);
          points.push({
            x: base.x, y: base.y,
            baseX: base.x, baseY: base.y,
            vx: 0, vy: 0
          });
        }

        fibers.push({
          isLeft, points, color,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.015 + Math.random() * 0.02
        });
      }
    }

    function resizeCanvas() {
      dpr = window.devicePixelRatio || 1;
      pWidth = window.innerWidth;
      pHeight = window.innerHeight;
      canvas.width = pWidth * dpr;
      canvas.height = pHeight * dpr;
      ctx.scale(dpr, dpr);
      setTimeout(initFibers, 50);
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    mouseRef.current = { x: -1000, y: -1000 };
    const spring = 0.035;
    const friction = 0.88;
    const hoverRadius = 140;
    const repelStrength = 3.5;
    const maxRepelDist = hoverRadius * hoverRadius;

    function draw() {
      ctx.fillStyle = "rgba(3, 3, 5, 0.25)";
      ctx.fillRect(0, 0, pWidth, pHeight);
      ctx.globalCompositeOperation = "source-over";
      
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      fibers.forEach(fiber => {
        ctx.beginPath();
        fiber.pulsePhase += fiber.pulseSpeed;

        for (let j = 0; j < fiber.points.length; j++) {
          const p = fiber.points[j];
          
          if (j !== 0 && j !== fiber.points.length - 1) {
            p.vx += (p.baseX - p.x) * spring;
            p.vy += (p.baseY - p.y) * spring;

            if (Math.abs(p.x - mx) < hoverRadius && Math.abs(p.y - my) < hoverRadius) {
              const dx = p.x - mx;
              const dy = p.y - my;
              const distSq = dx * dx + dy * dy;
              
              if (distSq < maxRepelDist && distSq > 0.1) {
                const dist = Math.sqrt(distSq);
                const force = (hoverRadius - dist) / hoverRadius;
                p.vx += (dx / dist) * force * repelStrength;
                p.vy += (dy / dist) * force * repelStrength;
              }
            }

            p.vx *= friction;
            p.vy *= friction;
            p.x += p.vx;
            p.y += p.vy;
          }

          if (j === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }

        ctx.strokeStyle = fiber.color;
        ctx.lineWidth = 1.0;
        ctx.globalAlpha = 0.6;
        ctx.stroke();

        const lastP = fiber.points[fiber.points.length - 1];
        ctx.beginPath();
        ctx.arc(lastP.x, lastP.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = fiber.color;
        ctx.globalAlpha = 0.9;
        ctx.shadowBlur = 6;
        ctx.shadowColor = fiber.color;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        const pulseT = (Math.sin(fiber.pulsePhase) + 1) / 2;
        const pulseIdx = Math.floor(pulseT * (fiber.points.length - 1));
        if (pulseIdx > 0 && pulseIdx < fiber.points.length - 1) {
          const pp = fiber.points[pulseIdx];
          ctx.beginPath();
          ctx.arc(pp.x, pp.y, 2, 0, Math.PI * 2);
          ctx.fillStyle = "#FFFFFF";
          ctx.shadowBlur = 10;
          ctx.shadowColor = fiber.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      ctx.globalAlpha = 1.0;
      animId = requestAnimationFrame(draw);
    }
    
    initFibers();
    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animId);
    };
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className={`portal-overlay fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 ${isOpen ? "open" : ""}`}
      onClick={handleBackdropClick}
    >
      <canvas 
        ref={canvasRef} 
        id="portal-webgl-canvas" 
        className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-90"
      />
      
      <div 
        className={`relative z-10 mb-6 transform transition-all duration-700 delay-200 ${isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
      >
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981] text-xs font-mono font-medium shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <ShieldCheck weight="fill" /> Encrypted session
        </div>
      </div>

      <div ref={cardRef} className="portal-card relative z-10 p-7 sm:p-10" onClick={(e) => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 text-[#A1A1AA] hover:text-white transition-all hover:rotate-90 hover:scale-110 duration-300"
        >
          <X weight="regular" className="text-2xl" />
        </button>
        
        <div className="text-center mb-8">
          <h2 className="text-[32px] sm:text-[36px] font-space font-medium text-white mb-2 tracking-tight">Access Dashboard</h2>
          <p className="text-[#A1A1AA] text-sm sm:text-base font-sans">Verify your identity to proceed to the control panel.</p>
        </div>
        
        <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-2 text-left">
            <label className="block text-zinc-400 text-xs font-mono font-semibold tracking-wide">Corporate Email</label>
            <div className="relative group">
              <EnvelopeSimple className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#00F0FF] transition-colors text-lg z-10" />
              <input type="email" className="portal-input w-full py-3.5 pl-12 pr-4 font-sans text-sm sm:text-base" placeholder="alias@organization.com" required />
            </div>
          </div>

          <div className="space-y-2 text-left">
            <div className="flex justify-between items-center">
              <label className="block text-zinc-400 text-xs font-mono font-semibold tracking-wide">Passphrase</label>
              <a href="#" className="text-[#00F0FF] hover:text-white text-xs font-sans transition-colors">Recover access?</a>
            </div>
            <div className="relative group">
              <LockKey className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#00F0FF] transition-colors text-lg z-10" />
              <input type="password" className="portal-input w-full py-3.5 pl-12 pr-4 font-sans text-base tracking-[0.2em]" placeholder="••••••••" required />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <label className="relative flex items-center cursor-pointer">
              <input type="checkbox" className="peer sr-only" />
              <div className="w-5 h-5 rounded border border-zinc-600 bg-black/50 peer-checked:bg-[#00F0FF] peer-checked:border-[#00F0FF] transition-all flex items-center justify-center">
                <Check weight="bold" className="text-black text-xs opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
            </label>
            <span className="text-zinc-400 text-sm font-sans select-none">Keep session active</span>
          </div>
          
          <button type="submit" className="portal-btn w-full font-sans font-medium py-3.5 mt-2 flex items-center justify-center gap-2 text-base tracking-wide">
            Authenticate
          </button>
          
          <div className="mt-8 pt-6 border-t border-white/5 relative">
            <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0C0C12] px-3 text-xs text-zinc-500 font-sans">or authenticate via</span>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button type="button" className="portal-action-btn flex items-center justify-center gap-2 py-2.5 text-zinc-300 text-sm font-sans hover:text-white">
                <GitBranch className="text-lg" /> Repository
              </button>
              <button type="button" className="portal-action-btn flex items-center justify-center gap-2 py-2.5 text-zinc-300 text-sm font-sans hover:text-white">
                <Cloud className="text-lg" /> Workspace
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
