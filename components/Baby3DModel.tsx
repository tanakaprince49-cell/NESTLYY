import React, { useRef, useEffect, useState, useCallback } from 'react';

interface Baby3DModelProps {
  week: number;
  className?: string;
}

// --- Stage data for the baby silhouette at different weeks ---
interface StageData {
  headRatio: number;      // head size relative to body (1 = same)
  bodyLength: number;     // body elongation factor
  limbLength: number;     // arm/leg length factor (0 = none)
  curlFactor: number;     // how curled the baby is (1 = fully curled, 0 = straight)
  tailFactor: number;     // embryonic tail (early weeks)
  eyeSize: number;        // eye prominence
  earSize: number;        // ear visibility
  fingerDetail: number;   // finger detail level (0-1)
  opacity: number;        // overall opacity
  glowColor: string;      // ambient glow
  skinHue: number;        // skin color hue
  label: string;
}

function getStageData(week: number): StageData {
  if (week <= 5) return {
    headRatio: 0.3, bodyLength: 0.2, limbLength: 0, curlFactor: 0.9,
    tailFactor: 0.8, eyeSize: 0, earSize: 0, fingerDetail: 0, opacity: 0.7,
    glowColor: 'rgba(255,182,193,0.4)', skinHue: 10, label: 'Embryo'
  };
  if (week <= 8) return {
    headRatio: 0.55, bodyLength: 0.35, limbLength: 0.15, curlFactor: 0.85,
    tailFactor: 0.4, eyeSize: 0.2, earSize: 0, fingerDetail: 0, opacity: 0.8,
    glowColor: 'rgba(255,160,180,0.45)', skinHue: 15, label: 'Early Embryo'
  };
  if (week <= 12) return {
    headRatio: 0.7, bodyLength: 0.5, limbLength: 0.3, curlFactor: 0.7,
    tailFactor: 0, eyeSize: 0.4, earSize: 0.2, fingerDetail: 0.3, opacity: 0.85,
    glowColor: 'rgba(255,140,170,0.5)', skinHue: 18, label: 'Fetus'
  };
  if (week <= 16) return {
    headRatio: 0.6, bodyLength: 0.6, limbLength: 0.45, curlFactor: 0.5,
    tailFactor: 0, eyeSize: 0.5, earSize: 0.4, fingerDetail: 0.5, opacity: 0.9,
    glowColor: 'rgba(255,120,160,0.5)', skinHue: 20, label: 'Growing Fetus'
  };
  if (week <= 20) return {
    headRatio: 0.5, bodyLength: 0.7, limbLength: 0.55, curlFactor: 0.4,
    tailFactor: 0, eyeSize: 0.6, earSize: 0.6, fingerDetail: 0.7, opacity: 0.92,
    glowColor: 'rgba(255,100,150,0.55)', skinHue: 22, label: 'Active Baby'
  };
  if (week <= 26) return {
    headRatio: 0.45, bodyLength: 0.8, limbLength: 0.65, curlFactor: 0.35,
    tailFactor: 0, eyeSize: 0.7, earSize: 0.7, fingerDetail: 0.8, opacity: 0.94,
    glowColor: 'rgba(248,90,140,0.55)', skinHue: 24, label: 'Viable Baby'
  };
  if (week <= 32) return {
    headRatio: 0.4, bodyLength: 0.88, limbLength: 0.75, curlFactor: 0.45,
    tailFactor: 0, eyeSize: 0.8, earSize: 0.8, fingerDetail: 0.9, opacity: 0.96,
    glowColor: 'rgba(244,80,130,0.6)', skinHue: 25, label: 'Maturing Baby'
  };
  if (week <= 36) return {
    headRatio: 0.38, bodyLength: 0.93, limbLength: 0.85, curlFactor: 0.5,
    tailFactor: 0, eyeSize: 0.85, earSize: 0.85, fingerDetail: 0.95, opacity: 0.97,
    glowColor: 'rgba(240,70,120,0.6)', skinHue: 26, label: 'Almost Ready'
  };
  return {
    headRatio: 0.35, bodyLength: 1.0, limbLength: 0.9, curlFactor: 0.55,
    tailFactor: 0, eyeSize: 0.9, earSize: 0.9, fingerDetail: 1.0, opacity: 1.0,
    glowColor: 'rgba(236,64,110,0.65)', skinHue: 28, label: 'Full Term'
  };
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function lerpStage(a: StageData, b: StageData, t: number): StageData {
  return {
    headRatio: lerp(a.headRatio, b.headRatio, t),
    bodyLength: lerp(a.bodyLength, b.bodyLength, t),
    limbLength: lerp(a.limbLength, b.limbLength, t),
    curlFactor: lerp(a.curlFactor, b.curlFactor, t),
    tailFactor: lerp(a.tailFactor, b.tailFactor, t),
    eyeSize: lerp(a.eyeSize, b.eyeSize, t),
    earSize: lerp(a.earSize, b.earSize, t),
    fingerDetail: lerp(a.fingerDetail, b.fingerDetail, t),
    opacity: lerp(a.opacity, b.opacity, t),
    glowColor: b.glowColor,
    skinHue: lerp(a.skinHue, b.skinHue, t),
    label: b.label,
  };
}

function getSmoothStage(week: number): StageData {
  const breakpoints = [4, 6, 8, 12, 16, 20, 26, 32, 36, 40];
  for (let i = 0; i < breakpoints.length - 1; i++) {
    if (week <= breakpoints[i + 1]) {
      const t = (week - breakpoints[i]) / (breakpoints[i + 1] - breakpoints[i]);
      return lerpStage(getStageData(breakpoints[i]), getStageData(breakpoints[i + 1]), Math.max(0, Math.min(1, t)));
    }
  }
  return getStageData(40);
}

// --- Particles for amniotic fluid effect ---
interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; hue: number;
}

function createParticles(count: number, w: number, h: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    size: Math.random() * 3 + 1,
    alpha: Math.random() * 0.4 + 0.1,
    hue: Math.random() * 30 + 330,
  }));
}

export const Baby3DModel: React.FC<Baby3DModelProps> = ({ week, className = '' }: Baby3DModelProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const rotRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const dragRef = useRef({ active: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });
  const timeRef = useRef(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // --- Realistic Skin Grain & Veins ---
  const drawSkinTexture = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, stage: StageData) => {
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.15;
    
    // Veins (more visible in early weeks)
    if (week < 28) {
      ctx.beginPath();
      const veinCount = Math.floor(lerp(8, 3, (week-4)/36));
      for (let i = 0; i < veinCount; i++) {
        const angle = (i / veinCount) * Math.PI * 2;
        const vx = x + Math.cos(angle) * r * 0.4;
        const vy = y + Math.sin(angle) * r * 0.4;
        ctx.moveTo(vx, vy);
        ctx.bezierCurveTo(
          vx + (Math.random()-0.5)*r, vy + (Math.random()-0.5)*r,
          vx + (Math.random()-0.5)*r, vy + (Math.random()-0.5)*r,
          vx + (Math.random()-0.5)*r*1.5, vy + (Math.random()-0.5)*r*1.5
        );
      }
      ctx.strokeStyle = `hsla(210, 50%, 40%, ${0.3 * (1 - week/42)})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Subsurface Scattering Glow
    ctx.globalCompositeOperation = 'screen';
    const sss = ctx.createRadialGradient(x, y, r * 0.6, x, y, r);
    sss.addColorStop(0, 'rgba(255, 100, 100, 0)');
    sss.addColorStop(1, 'rgba(255, 50, 50, 0.15)');
    ctx.fillStyle = sss;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawBaby = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, time: number, stage: StageData, rot: { x: number, y: number }) => {
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) * 0.28;
    
    // 3D rotation offsets
    const rx = rot.x * 0.012;
    const ry = rot.y * 0.012;
    
    // Breathing animation
    const breathe = Math.sin(time * 0.8) * 0.015 + 1;
    
    // Gentle float animation
    const floatY = Math.sin(time * 0.45) * 6;
    const floatX = Math.cos(time * 0.25) * 3;
    
    const bx = cx + floatX + ry * 25;
    const by = cy + floatY + rx * 15;

    ctx.save();
    ctx.globalAlpha = stage.opacity;
    
    // --- Environment: Caustics / God Rays ---
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 3; i++) {
        const rayAngle = time * 0.1 + i * 2;
        const grad = ctx.createLinearGradient(
            bx + Math.cos(rayAngle) * 500, by + Math.sin(rayAngle) * 500,
            bx - Math.cos(rayAngle) * 500, by - Math.sin(rayAngle) * 500
        );
        grad.addColorStop(0, 'rgba(255,255,255,0.05)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0)');
        grad.addColorStop(1, 'rgba(255,255,255,0.05)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();

    // --- Amniotic fluid glow ---
    const ambGrad = ctx.createRadialGradient(bx, by, 0, bx, by, scale * 2.8);
    ambGrad.addColorStop(0, stage.glowColor);
    ambGrad.addColorStop(0.6, 'rgba(255,200,225,0.12)');
    ambGrad.addColorStop(1, 'rgba(255,200,225,0)');
    ctx.fillStyle = ambGrad;
    ctx.beginPath();
    ctx.arc(bx, by, scale * 2.8, 0, Math.PI * 2);
    ctx.fill();

    // Skin color palette
    const skinBase = `hsl(${stage.skinHue}, 60%, 82%)`;
    const skinLight = `hsl(${stage.skinHue}, 65%, 92%)`;
    const skinDark = `hsl(${stage.skinHue}, 45%, 70%)`;
    const skinShadow = `hsl(${stage.skinHue}, 40%, 60%)`;

    // --- 3D shading gradient ---
    const createSkinGradient = (x: number, y: number, r: number) => {
      const lightOffX = -ry * r * 0.4;
      const lightOffY = -rx * r * 0.4;
      const grad = ctx.createRadialGradient(
        x + lightOffX, y + lightOffY, r * 0.05,
        x, y, r
      );
      grad.addColorStop(0, skinLight);
      grad.addColorStop(0.4, skinBase);
      grad.addColorStop(0.8, skinDark);
      grad.addColorStop(1, skinShadow);
      return grad;
    };

    // === HEAD ===
    const headR = scale * stage.headRatio * breathe;
    const headX = bx + Math.sin(stage.curlFactor * 0.5) * scale * 0.08;
    const headY = by - scale * stage.bodyLength * 0.55;
    
    // Head main
    ctx.beginPath();
    ctx.arc(headX, headY, headR, 0, Math.PI * 2);
    ctx.fillStyle = createSkinGradient(headX, headY, headR);
    ctx.fill();
    drawSkinTexture(ctx, headX, headY, headR, stage);

    // === FACE DETAILS ===
    const faceCX = headX + ry * 5;
    const faceCY = headY + rx * 3;

    // EYES - Realistic lids
    if (stage.eyeSize > 0.1) {
      const eyeR = headR * 0.14 * stage.eyeSize;
      const eyeOffX = headR * 0.3;
      const eyeOffY = -headR * 0.05;
      
      [ -1, 1 ].forEach((side) => {
        const ex = faceCX + side * eyeOffX;
        const ey = faceCY + eyeOffY;
        
        // Eye Shadow / Socket
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(150, 50, 70, ${0.1 * stage.eyeSize})`;
        ctx.fill();

        // Eyelid
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
        ctx.fillStyle = skinDark;
        ctx.fill();

        // Highlight line
        ctx.beginPath();
        ctx.arc(ex, ey, eyeR, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.strokeStyle = `rgba(255,255,255,0.2)`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    // NOSE - Refined
    if (stage.eyeSize > 0.3) {
      ctx.beginPath();
      ctx.ellipse(faceCX, faceCY + headR * 0.15, headR * 0.05, headR * 0.08, 0, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${stage.skinHue}, 40%, 65%, 0.3)`;
      ctx.fill();
      
      // Nostrils
      if (week > 20) {
          ctx.beginPath();
          ctx.arc(faceCX - 2, faceCY + headR * 0.22, 1, 0, Math.PI * 2);
          ctx.arc(faceCX + 2, faceCY + headR * 0.22, 1, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(100, 20, 20, 0.2)';
          ctx.fill();
      }
    }

    // MOUTH - Realistic lips
    if (stage.eyeSize > 0.4) {
      ctx.beginPath();
      const mouthW = headR * 0.25 * stage.eyeSize;
      ctx.moveTo(faceCX - mouthW/2, faceCY + headR * 0.35);
      ctx.quadraticCurveTo(faceCX, faceCY + headR * 0.4, faceCX + mouthW/2, faceCY + headR * 0.35);
      ctx.strokeStyle = `rgba(180, 50, 80, ${0.4 * stage.eyeSize})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // === BODY (TORSO) ===
    const bodyTopY = headY + headR * 0.8;
    const bodyBottomY = by + scale * stage.bodyLength * 0.5;
    const bodyWidth = scale * 0.28 * Math.max(0.4, stage.bodyLength);
    const curlOffset = stage.curlFactor * scale * 0.12;
    
    ctx.beginPath();
    ctx.moveTo(headX - bodyWidth * 0.8, bodyTopY);
    ctx.bezierCurveTo(
      headX - bodyWidth * 1.2 + curlOffset, (bodyTopY + bodyBottomY) / 2,
      headX - bodyWidth * 0.8 + curlOffset, bodyBottomY,
      headX + curlOffset * 0.5, bodyBottomY
    );
    ctx.bezierCurveTo(
      headX + bodyWidth * 0.8 + curlOffset, bodyBottomY,
      headX + bodyWidth * 1.2 + curlOffset, (bodyTopY + bodyBottomY) / 2,
      headX + bodyWidth * 0.8, bodyTopY
    );
    ctx.closePath();
    
    const bodyGrad = ctx.createRadialGradient(bx, by, 0, bx, by, scale);
    bodyGrad.addColorStop(0, skinBase);
    bodyGrad.addColorStop(1, skinDark);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    drawSkinTexture(ctx, bx, by, bodyWidth * 1.2, stage);

    // === ARMS & HANDS ===
    if (stage.limbLength > 0) {
      const armOriginY = bodyTopY + (bodyBottomY - bodyTopY) * 0.2;
      const armLen = scale * stage.limbLength * 0.6;
      const armAngle = stage.curlFactor * 0.8 + Math.sin(time * 0.6) * 0.1;
      
      [ -1, 1 ].forEach(side => {
          const ax1 = headX + side * bodyWidth * 0.7;
          const ax2 = ax1 + side * Math.cos(armAngle) * armLen;
          const ay2 = armOriginY + Math.sin(armAngle) * armLen;
          
          ctx.beginPath();
          ctx.moveTo(ax1, armOriginY);
          ctx.quadraticCurveTo(ax1 + side * armLen * 0.2, armOriginY + armLen * 0.4, ax2, ay2);
          ctx.strokeStyle = skinBase;
          ctx.lineWidth = scale * 0.1 * stage.limbLength;
          ctx.lineCap = 'round';
          ctx.stroke();

          // HANDS with fingers
          if (stage.fingerDetail > 0.4) {
              const handR = scale * 0.05 * stage.fingerDetail;
              ctx.beginPath();
              ctx.arc(ax2, ay2, handR, 0, Math.PI * 2);
              ctx.fillStyle = skinBase;
              ctx.fill();
              
              // Finger tips
              for (let i = 0; i < 4; i++) {
                  const fa = i * 0.3 - 0.5;
                  ctx.beginPath();
                  ctx.arc(ax2 + Math.cos(fa) * handR, ay2 + Math.sin(fa) * handR, handR*0.4, 0, Math.PI * 2);
                  ctx.fill();
              }
          }
      });
    }

    // === LEGS & FEET ===
    if (stage.limbLength > 0.2) {
      const legOriginY = bodyBottomY - 10;
      const legLen = scale * stage.limbLength * 0.7;
      const legCurl = 0.8 + Math.sin(time * 0.5) * 0.1;
      
      [ -1, 1 ].forEach(side => {
          const lx1 = headX + side * bodyWidth * 0.4 + curlOffset * 0.5;
          const lx2 = lx1 + side * Math.cos(legCurl) * legLen * 0.6;
          const ly2 = legOriginY + Math.sin(legCurl) * legLen;
          
          ctx.beginPath();
          ctx.moveTo(lx1, legOriginY);
          ctx.quadraticCurveTo(lx1 + side * legLen * 0.3, legOriginY + legLen * 0.2, lx2, ly2);
          ctx.strokeStyle = skinBase;
          ctx.lineWidth = scale * 0.14 * stage.limbLength;
          ctx.lineCap = 'round';
          ctx.stroke();

          // FEET
          if (stage.fingerDetail > 0.5) {
              const footW = scale * 0.08 * stage.fingerDetail;
              const footH = scale * 0.04 * stage.fingerDetail;
              ctx.save();
              ctx.translate(lx2, ly2);
              ctx.rotate(side * 0.5);
              ctx.beginPath();
              ctx.ellipse(0, 0, footW, footH, 0, 0, Math.PI * 2);
              ctx.fillStyle = skinBase;
              ctx.fill();
              ctx.restore();
          }
      });
    }

    // === UMBILICAL CORD - Enhanced color and flow ===
    if (stage.bodyLength > 0.3) {
      const cordStartX = headX + curlOffset * 0.3;
      const cordStartY = (bodyTopY + bodyBottomY) / 2 + 10;
      ctx.beginPath();
      ctx.moveTo(cordStartX, cordStartY);
      const wave = Math.sin(time * 0.8) * 20;
      ctx.bezierCurveTo(
        cordStartX + 50 + wave, cordStartY + 20,
        cordStartX - 40 - wave, cordStartY + 80,
        cordStartX + wave, cordStartY + 150
      );
      ctx.strokeStyle = `rgba(200, 70, 90, 0.4)`;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    // === HEARTBEAT GLOW ===
    const hbPhase = Math.pow(Math.abs(Math.sin(time * 2.8)), 2);
    const hbX = headX + curlOffset * 0.2;
    const hbY = bodyTopY + (bodyBottomY - bodyTopY) * 0.3;
    const hbR = scale * 0.12 * hbPhase;
    const hbGrad = ctx.createRadialGradient(hbX, hbY, 0, hbX, hbY, hbR);
    hbGrad.addColorStop(0, `rgba(255,50,80,${0.3 * hbPhase})`);
    hbGrad.addColorStop(1, 'rgba(255,50,80,0)');
    ctx.beginPath();
    ctx.arc(hbX, hbY, hbR, 0, Math.PI * 2);
    ctx.fillStyle = hbGrad;
    ctx.fill();

    ctx.restore();
  }, [week]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      particlesRef.current = createParticles(60, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const ctx = canvas.getContext('2d')!;
    const stage = getSmoothStage(week);

    const animate = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width;
      const h = canvas.height;
      timeRef.current += 0.016;
      const time = timeRef.current;

      rotRef.current.x += (rotRef.current.targetX - rotRef.current.x) * 0.1;
      rotRef.current.y += (rotRef.current.targetY - rotRef.current.y) * 0.1;

      if (!dragRef.current.active) {
        rotRef.current.targetX = Math.sin(time * 0.3) * 6;
        rotRef.current.targetY = Math.cos(time * 0.25) * 10;
      }

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(dpr, dpr);
      const sw = w / dpr;
      const sh = h / dpr;

      // Deep Womb Gradient
      const wombGrad = ctx.createRadialGradient(sw/2, sh/2, 0, sw/2, sh/2, sw * 0.8);
      wombGrad.addColorStop(0, isFullscreen ? '#2d0a0a' : 'rgba(255,220,230,0.1)');
      wombGrad.addColorStop(0.5, isFullscreen ? '#4c0e0e' : 'rgba(255,200,215,0.05)');
      wombGrad.addColorStop(1, isFullscreen ? '#1a0505' : 'transparent');
      ctx.fillStyle = wombGrad;
      ctx.fillRect(0, 0, sw, sh);

      // --- Amniotic particles with bloom ---
      particlesRef.current.forEach(p => {
        p.x += p.vx + Math.sin(time + p.y * 0.01) * 0.3;
        p.y += p.vy + Math.cos(time + p.x * 0.01) * 0.3;
        if (p.x < 0) p.x = sw; if (p.x > sw) p.x = 0;
        if (p.y < 0) p.y = sh; if (p.y > sh) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 60%, 85%, ${p.alpha * (0.4 + Math.sin(time + p.x) * 0.2)})`;
        ctx.fill();
        if (p.size > 2) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = `hsla(${p.hue}, 60%, 80%, 0.2)`;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
      });

      drawBaby(ctx, sw, sh, time, stage, rotRef.current);

      ctx.restore();
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [week, drawBaby, isFullscreen]);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragRef.current = {
      active: true, startX: e.clientX, startY: e.clientY,
      baseX: rotRef.current.targetX, baseY: rotRef.current.targetY,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const dx = (e.clientX - dragRef.current.startX) * 0.8;
    const dy = (e.clientY - dragRef.current.startY) * 0.8;
    rotRef.current.targetY = dragRef.current.baseY + dx;
    rotRef.current.targetX = dragRef.current.baseX + dy;
  };

  const handlePointerUp = () => dragRef.current.active = false;

  return (
    <div
      ref={containerRef}
      className={`baby-3d-wrapper ${isFullscreen ? 'fixed inset-0 z-[200] bg-black' : 'relative w-full aspect-square max-w-[380px] mx-auto'}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: 'none' }}
    >
      <div 
        className={`baby-3d-view transition-all duration-500 ${isFullscreen ? 'w-full h-full' : 'w-full h-full rounded-[2.5rem] overflow-hidden'}`}
        style={{
          background: isFullscreen ? 'radial-gradient(circle at center, #3d0a0a 0%, #000 100%)' : 'radial-gradient(ellipse at center, rgba(255,230,240,0.5) 0%, rgba(255,245,248,0.2) 60%, transparent 100%)',
          boxShadow: isFullscreen ? 'none' : '0 20px 50px rgba(244,63,94,0.12), inset 0 0 40px rgba(255,200,220,0.15)',
          cursor: 'grab'
        }}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        
        {/* UI Overlays */}
        <div className="absolute top-6 left-6 pointer-events-none">
            <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] mb-1">Development Phase</h4>
            <p className="text-xl font-serif text-white/90 drop-shadow-md">Week {week}</p>
        </div>

        <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="absolute top-6 right-6 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white/80 hover:bg-white/20 transition-all active:scale-95 group"
        >
            {isFullscreen ? (
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest">Exit Focus</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v5H3M16 3v5h5M8 21v-5H3M16 21v-5h5"/></svg>
                </div>
            ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 15v6h-6M3 9V3h6"/></svg>
            )}
        </button>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none text-center">
            <span className="text-[8px] font-black text-rose-300 uppercase tracking-widest animate-pulse">
                {isFullscreen ? 'Immersive Human Focus Mode • drag to rotate' : 'Tap for Focus Mode'}
            </span>
        </div>
      </div>
    </div>
  );
};
