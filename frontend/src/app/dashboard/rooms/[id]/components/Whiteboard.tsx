'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  PenTool, Square, Circle, Minus, Eraser, Trash2, X, Download
} from 'lucide-react';
import { useEditorStore } from '@/stores/editorStore';
import { audio } from '@/lib/audio';
import type { WSMessage } from '@/types';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  id: string;
  type: 'pencil' | 'rect' | 'circle' | 'line' | 'eraser';
  color: string;
  points: Point[];
  thickness: number;
}

interface WhiteboardProps {
  sendMessage: (msg: WSMessage) => void;
}

export function Whiteboard({ sendMessage }: WhiteboardProps) {
  const { showWhiteboard, setShowWhiteboard } = useEditorStore();

  const [tool, setTool] = useState<'pencil' | 'rect' | 'circle' | 'line' | 'eraser'>('pencil');
  const [color, setColor] = useState('#8b5cf6'); // Violet
  const [thickness, setThickness] = useState(4);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const isDrawing = useRef(false);
  const startPoint = useRef<Point>({ x: 0, y: 0 });
  const currentPoints = useRef<Point[]>([]);

  // List of all completed strokes
  const [strokes, setStrokes] = useState<Stroke[]>([]);

  const colors = [
    { name: 'Violet', value: '#8b5cf6' },
    { name: 'Cyan', value: '#22d3ee' },
    { name: 'Emerald', value: '#34d399' },
    { name: 'Pink', value: '#fb7185' },
    { name: 'Amber', value: '#fbbf24' },
    { name: 'White', value: '#f0f0f5' },
  ];

  // Initialize canvas
  useEffect(() => {
    if (!showWhiteboard || !canvasRef.current) return;

    const canvas = canvasRef.current;
    // Set display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const context = canvas.getContext('2d');
    if (context) {
      context.scale(2, 2);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      contextRef.current = context;
    }

    // Redraw all existing strokes
    redrawCanvas();

    // Listen to resize
    const handleResize = () => {
      const activeRect = canvas.getBoundingClientRect();
      canvas.width = activeRect.width * 2;
      canvas.height = activeRect.height * 2;
      canvas.style.width = `${activeRect.width}px`;
      canvas.style.height = `${activeRect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(2, 2);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        contextRef.current = ctx;
        redrawCanvas();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showWhiteboard, strokes]);

  // Hook up WebSocket draw updates
  useEffect(() => {
    const handleDrawingEvent = (e: Event) => {
      const customEvent = e as CustomEvent<WSMessage>;
      if (customEvent.detail.type === 'draw:stroke') {
        const receivedStroke = customEvent.detail.payload as Stroke;
        setStrokes((prev) => {
          // Avoid duplicate strokes
          if (prev.some((s) => s.id === receivedStroke.id)) return prev;
          return [...prev, receivedStroke];
        });
      }
    };

    window.addEventListener('ws:draw:stroke', handleDrawingEvent);
    return () => window.removeEventListener('ws:draw:stroke', handleDrawingEvent);
  }, []);

  const drawStrokeOnContext = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
    if (stroke.points.length === 0) return;

    ctx.strokeStyle = stroke.type === 'eraser' ? '#0a0a0f' : stroke.color;
    ctx.lineWidth = stroke.thickness;
    ctx.beginPath();

    if (stroke.type === 'pencil' || stroke.type === 'eraser') {
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    } else if (stroke.type === 'line' && stroke.points.length >= 2) {
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      ctx.lineTo(stroke.points[1].x, stroke.points[1].y);
      ctx.stroke();
    } else if (stroke.type === 'rect' && stroke.points.length >= 2) {
      const p1 = stroke.points[0];
      const p2 = stroke.points[1];
      ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y);
    } else if (stroke.type === 'circle' && stroke.points.length >= 2) {
      const p1 = stroke.points[0];
      const p2 = stroke.points[1];
      const radius = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      ctx.arc(p1.x, p1.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#0a0a0f'; // Matches our --color-bg-primary
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => drawStrokeOnContext(ctx, stroke));
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const point = getCoordinates(e);
    isDrawing.current = true;
    startPoint.current = point;
    currentPoints.current = [point];

    const ctx = contextRef.current;
    if (ctx) {
      ctx.strokeStyle = tool === 'eraser' ? '#0a0a0f' : color;
      ctx.lineWidth = thickness;
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !contextRef.current) return;

    const point = getCoordinates(e);
    const ctx = contextRef.current;

    if (tool === 'pencil' || tool === 'eraser') {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
      currentPoints.current.push(point);
    } else {
      // For shapes, we must clear and redraw the transient state
      redrawCanvas();
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.beginPath();

      if (tool === 'line') {
        ctx.moveTo(startPoint.current.x, startPoint.current.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      } else if (tool === 'rect') {
        ctx.strokeRect(
          startPoint.current.x,
          startPoint.current.y,
          point.x - startPoint.current.x,
          point.y - startPoint.current.y
        );
      } else if (tool === 'circle') {
        const radius = Math.sqrt(
          Math.pow(point.x - startPoint.current.x, 2) + Math.pow(point.y - startPoint.current.y, 2)
        );
        ctx.arc(startPoint.current.x, startPoint.current.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
      currentPoints.current = [startPoint.current, point];
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (currentPoints.current.length > 0) {
      const newStroke: Stroke = {
        id: crypto.randomUUID(),
        type: tool,
        color,
        points: currentPoints.current,
        thickness,
      };

      setStrokes((prev) => [...prev, newStroke]);

      // Sync stroke over WS
      sendMessage({
        type: 'draw:stroke',
        payload: newStroke,
      });
    }
  };

  const handleClear = () => {
    audio.playAlert();
    setStrokes([]);
    sendMessage({
      type: 'draw:stroke',
      payload: { id: 'clear', type: 'eraser', color: '#0a0a0f', points: [], thickness: 9999 } as any,
    });
  };

  useEffect(() => {
    // Watch for clear messages received from WS
    const handleDrawingEvent = (e: Event) => {
      const customEvent = e as CustomEvent<WSMessage>;
      if (customEvent.detail.type === 'draw:stroke') {
        const receivedStroke = customEvent.detail.payload as Stroke;
        if (receivedStroke.id === 'clear') {
          setStrokes([]);
        }
      }
    };

    window.addEventListener('ws:draw:stroke', handleDrawingEvent);
    return () => window.removeEventListener('ws:draw:stroke', handleDrawingEvent);
  }, []);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    audio.playPop();
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'collabcode-whiteboard.png';
    link.href = dataUrl;
    link.click();
  };

  if (!showWhiteboard) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="fixed inset-0 md:inset-4 z-40 glass-panel neon-glow md:rounded-xl flex flex-col overflow-hidden border max-md:border-none border-border-default bg-bg-primary/95 backdrop-blur-xl"
    >
      {/* Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between px-4 py-3 border-b border-border-default bg-bg-secondary/60 shrink-0 gap-3">
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          <div className="flex items-center gap-1.5 bg-bg-tertiary/60 border border-white/5 rounded-lg p-0.5">
            <button
              onClick={() => { setTool('pencil'); audio.playClick(); }}
              className={`p-2 rounded-md transition-all ${tool === 'pencil' ? 'bg-accent-violet text-white' : 'text-text-secondary hover:bg-white/5'}`}
              title="Pencil"
            >
              <PenTool className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setTool('rect'); audio.playClick(); }}
              className={`p-2 rounded-md transition-all ${tool === 'rect' ? 'bg-accent-violet text-white' : 'text-text-secondary hover:bg-white/5'}`}
              title="Rectangle"
            >
              <Square className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setTool('circle'); audio.playClick(); }}
              className={`p-2 rounded-md transition-all ${tool === 'circle' ? 'bg-accent-violet text-white' : 'text-text-secondary hover:bg-white/5'}`}
              title="Circle"
            >
              <Circle className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setTool('line'); audio.playClick(); }}
              className={`p-2 rounded-md transition-all ${tool === 'line' ? 'bg-accent-violet text-white' : 'text-text-secondary hover:bg-white/5'}`}
              title="Line"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setTool('eraser'); audio.playClick(); }}
              className={`p-2 rounded-md transition-all ${tool === 'eraser' ? 'bg-accent-violet text-white' : 'text-text-secondary hover:bg-white/5'}`}
              title="Eraser"
            >
              <Eraser className="w-4 h-4" />
            </button>
          </div>

          {/* Color choices */}
          {tool !== 'eraser' && (
            <div className="flex items-center gap-2">
              {colors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => { setColor(c.value); audio.playPop(); }}
                  style={{ backgroundColor: c.value }}
                  className={`w-6 h-6 rounded-full border transition-all ${
                    color === c.value
                      ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.4)]'
                      : 'border-white/10 hover:scale-105'
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          )}

          {/* Line weight */}
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-text-secondary uppercase tracking-wider font-bold">Size</span>
            <input
              type="range"
              min="2"
              max="24"
              value={thickness}
              onChange={(e) => setThickness(Number(e.target.value))}
              className="w-24 accent-accent-violet"
            />
            <span className="text-xs font-mono font-semibold w-5">{thickness}px</span>
          </div>
        </div>

        {/* Clear & Save buttons */}
        <div className="flex items-center justify-between md:justify-end gap-2 max-md:w-full">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg bg-bg-tertiary text-text-secondary hover:text-text-primary hover:bg-white/5 border border-border-default transition-all flex items-center gap-1.5 text-xs font-medium"
              title="Download drawing as PNG"
            >
              <Download className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Save Image</span>
            </button>
            <button
              onClick={handleClear}
              className="p-2 rounded-lg bg-accent-rose/10 hover:bg-accent-rose/25 text-accent-rose transition-all flex items-center gap-1.5 text-xs font-medium"
              title="Clear all drawings"
            >
              <Trash2 className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
          <button
            onClick={() => { setShowWhiteboard(false); audio.playPop(); }}
            className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-all md:ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas viewport */}
      <div className="flex-1 bg-bg-primary relative cursor-crosshair overflow-hidden select-none">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
          className="absolute inset-0 w-full h-full block"
        />
      </div>
    </motion.div>
  );
}
