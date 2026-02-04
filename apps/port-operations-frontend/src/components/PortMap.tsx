import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PlusIcon, MinusIcon, ArrowPathIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { Tugboat, Vessel, Dock } from '../types';
import { EntityDetailsDialog } from './EntityDetailsDialog';
import { IconButton } from './ui/IconButton';
import { Tooltip, TooltipProvider } from './ui/Tooltip';

interface PortMapProps {
  tugboats: Map<string, Tugboat>;
  vessels: Map<string, Vessel>;
}

const PORT_SIZE = 1000;
const GRID_SIZE = 100;
const CLICK_THRESHOLD_RADIUS = 15;

const DOCKS: Dock[] = [
  { id: 'DOCK_01', name: 'Muelle A1', position: { x: 200, y: 300 } },
  { id: 'DOCK_02', name: 'Muelle A2', position: { x: 400, y: 350 } },
  { id: 'DOCK_03', name: 'Muelle B1', position: { x: 600, y: 300 } },
  { id: 'DOCK_04', name: 'Muelle B2', position: { x: 800, y: 350 } },
  { id: 'DOCK_05', name: 'Muelle C1', position: { x: 300, y: 600 } },
  { id: 'DOCK_06', name: 'Muelle C2', position: { x: 700, y: 600 } },
];

export const PortMap: React.FC<PortMapProps> = ({ tugboats, vessels }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouseX, setLastMouseX] = useState(0);
  const [lastMouseY, setLastMouseY] = useState(0);
  const [selectedEntity, setSelectedEntity] = useState<Tugboat | Vessel | null>(null);
  const [selectedEntityType, setSelectedEntityType] = useState<'tugboat' | 'vessel' | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  const toCanvasX = useCallback((x: number) => offsetX + x * scale, [offsetX, scale]);
  const toCanvasY = useCallback((y: number) => offsetY + y * scale, [offsetY, scale]);

  const toWorldX = useCallback((canvasX: number) => (canvasX - offsetX) / scale, [offsetX, scale]);
  const toWorldY = useCallback((canvasY: number) => (canvasY - offsetY) / scale, [offsetY, scale]);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    const canvasWidth = rect.width;
    const canvasHeight = rect.height;
    const newScale = Math.min(canvasWidth, canvasHeight) / (PORT_SIZE * 1.2);
    setScale(newScale);
    setOffsetX((canvasWidth - PORT_SIZE * newScale) / 2);
    setOffsetY((canvasHeight - PORT_SIZE * newScale) / 2);
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= PORT_SIZE; i += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(i), toCanvasY(0));
      ctx.lineTo(toCanvasX(i), toCanvasY(PORT_SIZE));
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(toCanvasX(0), toCanvasY(i));
      ctx.lineTo(toCanvasX(PORT_SIZE), toCanvasY(i));
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(toCanvasX(0), toCanvasY(0), PORT_SIZE * scale, PORT_SIZE * scale);
  }, [toCanvasX, toCanvasY, scale]);

  const drawDock = useCallback((ctx: CanvasRenderingContext2D, dock: Dock) => {
    const x = toCanvasX(dock.position.x);
    const y = toCanvasY(dock.position.y);
    const size = Math.max(14, 14 * scale);

    ctx.fillStyle = 'rgba(0, 255, 170, 0.15)';
    ctx.strokeStyle = 'rgba(0, 255, 170, 0.8)';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.rect(x - size, y - size, size * 2, size * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#b6ffe7';
    ctx.font = `${Math.max(10, 10 * scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(dock.name, x, y - size - 6);
  }, [toCanvasX, toCanvasY, scale]);

  const drawConnections = useCallback((ctx: CanvasRenderingContext2D) => {
    tugboats.forEach((tugboat) => {
      if (tugboat.assignedVesselId) {
        const vessel = vessels.get(tugboat.assignedVesselId);
        if (vessel) {
          ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);

          ctx.beginPath();
          ctx.moveTo(toCanvasX(tugboat.position.x), toCanvasY(tugboat.position.y));
          ctx.lineTo(toCanvasX(vessel.position.x), toCanvasY(vessel.position.y));
          ctx.stroke();

          ctx.setLineDash([]);
        }
      }
    });
  }, [tugboats, vessels, toCanvasX, toCanvasY]);

  const drawTugboat = useCallback((ctx: CanvasRenderingContext2D, tugboat: Tugboat) => {
    const x = toCanvasX(tugboat.position.x);
    const y = toCanvasY(tugboat.position.y);
    const radius = Math.max(8, 8 * scale);

    let color = '#00d4ff';
    if (tugboat.status === 'ASSISTING') {
      color = '#ffaa00';
    }

    if (tugboat.status === 'MOVING') {
      ctx.shadowBlur = 15;
      ctx.shadowColor = color;
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#0099cc';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.max(10, 10 * scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(tugboat.tugboatName, x, y - radius - 8);
  }, [toCanvasX, toCanvasY, scale]);

  const drawVessel = useCallback((ctx: CanvasRenderingContext2D, vessel: Vessel) => {
    const x = toCanvasX(vessel.position.x);
    const y = toCanvasY(vessel.position.y);
    const size = Math.max(12, 12 * scale);

    let color = '#e94560';
    if (
      vessel.status === 'BEING_ASSISTED' ||
      vessel.status === 'BEING_TOWED_TO_DOCK' ||
      vessel.status === 'BEING_TOWED_TO_EXIT'
    ) {
      color = '#ffaa00';
    }

    if (vessel.status === 'REQUESTING_ASSISTANCE' || vessel.status === 'AT_ENTRY') {
      const opacity = (Math.sin(Date.now() / 300) + 1) / 2;
      color = `rgba(233, 69, 96, ${opacity})`;
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#cc3344';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = `${Math.max(10, 10 * scale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(vessel.vesselName, x, y + size + 15);
  }, [toCanvasX, toCanvasY, scale]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    ctx.save();

    // Sync towed vessel positions
    const vesselsArray = Array.from(vessels.values());
    vesselsArray.forEach((vessel) => {
      if (
        (vessel.status === 'BEING_TOWED_TO_DOCK' || vessel.status === 'BEING_TOWED_TO_EXIT') &&
        vessel.assignedTugboatId
      ) {
        const tugboat = tugboats.get(vessel.assignedTugboatId);
        if (tugboat) {
          vessel.position = { ...tugboat.position };
        }
      }
    });

    drawGrid(ctx);
    DOCKS.forEach((dock) => drawDock(ctx, dock));
    drawConnections(ctx);
    vesselsArray.forEach((vessel) => drawVessel(ctx, vessel));
    Array.from(tugboats.values()).forEach((tugboat) => drawTugboat(ctx, tugboat));

    ctx.restore();
  }, [tugboats, vessels, drawGrid, drawDock, drawConnections, drawVessel, drawTugboat]);

  useEffect(() => {
    let animationFrameId: number;
    const animate = () => {
      render();
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [render]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMouseX(e.clientX);
    setLastMouseY(e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      setOffsetX(offsetX + dx);
      setOffsetY(offsetY + dy);
      setLastMouseX(e.clientX);
      setLastMouseY(e.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isDragging) return; // Don't open dialog if we were dragging

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const worldX = toWorldX(clickX);
    const worldY = toWorldY(clickY);

    // Check tugboats first (they're drawn on top)
    for (const tugboat of tugboats.values()) {
      const distance = Math.sqrt(
        Math.pow(tugboat.position.x - worldX, 2) + Math.pow(tugboat.position.y - worldY, 2)
      );
      if (distance <= CLICK_THRESHOLD_RADIUS) {
        setSelectedEntity(tugboat);
        setSelectedEntityType('tugboat');
        setDialogOpen(true);
        return;
      }
    }

    // Check vessels
    for (const vessel of vessels.values()) {
      const distance = Math.sqrt(
        Math.pow(vessel.position.x - worldX, 2) + Math.pow(vessel.position.y - worldY, 2)
      );
      if (distance <= CLICK_THRESHOLD_RADIUS) {
        setSelectedEntity(vessel);
        setSelectedEntityType('vessel');
        setDialogOpen(true);
        return;
      }
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setOffsetX(mouseX - (mouseX - offsetX) * delta);
    setOffsetY(mouseY - (mouseY - offsetY) * delta);
    setScale(scale * delta);
  };

  const handleZoomIn = () => setScale(scale * 1.2);
  const handleZoomOut = () => setScale(scale * 0.8);
  const handleResetView = () => resizeCanvas();

  return (
    <TooltipProvider>
      <div className="relative w-full h-full">
        {/* Responsive Controls Bar - Bottom on mobile, Top-right on tablet+ */}
        <div className="fixed bottom-0 left-0 right-0 flex flex-row gap-2 justify-center py-2 px-4 bg-bg-secondary/95 backdrop-blur border-t border-border-color z-10 md:absolute md:top-4 md:right-4 md:bottom-auto md:left-auto md:flex-col md:bg-transparent md:border-0 md:backdrop-blur-none">
          <Tooltip content="Zoom In">
            <IconButton
              icon={<PlusIcon className="w-5 h-5" />}
              onClick={handleZoomIn}
              label="Zoom In"
            />
          </Tooltip>
          <Tooltip content="Zoom Out">
            <IconButton
              icon={<MinusIcon className="w-5 h-5" />}
              onClick={handleZoomOut}
              label="Zoom Out"
            />
          </Tooltip>
          <Tooltip content="Reset View">
            <IconButton
              icon={<ArrowPathIcon className="w-5 h-5" />}
              onClick={handleResetView}
              label="Reset View"
            />
          </Tooltip>
        </div>

        <canvas
          ref={canvasRef}
          id="port-map"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
          onWheel={handleWheel}
          className="w-full h-full cursor-move"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        />

        <div className="absolute bottom-4 left-4 bg-bg-secondary/90 backdrop-blur px-4 py-2 rounded-lg text-sm text-text-secondary border border-border-color">
          <span>Port Area: 1000 x 1000 units</span>
        </div>

        {/* Legend Button */}
        <div className="absolute bottom-4 right-4">
          <Tooltip 
            content={
              <div className="space-y-3 p-2 min-w-[200px]">
                <div className="font-semibold text-accent-primary mb-2">🎨 Legend</div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full border-2 border-accent-primary flex-shrink-0"></div>
                  <span>Tugboat - Idle</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full border-2 border-accent-primary bg-accent-primary flex-shrink-0"></div>
                  <span>Tugboat - Moving</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full border-2 border-accent-warning bg-accent-warning flex-shrink-0"></div>
                  <span>Tugboat - Assisting</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded border-2 border-accent-secondary rotate-45 flex-shrink-0"></div>
                  <span>Vessel - Requesting</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded border-2 border-accent-secondary bg-accent-secondary rotate-45 flex-shrink-0"></div>
                  <span>Vessel - Waiting</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded border-2 border-accent-warning bg-accent-warning rotate-45 flex-shrink-0"></div>
                  <span>Vessel - Assisted</span>
                </div>
              </div>
            }
            open={showLegend}
            onOpenChange={setShowLegend}
          >
            <IconButton
              icon={<QuestionMarkCircleIcon className="w-6 h-6" />}
              onClick={() => setShowLegend(!showLegend)}
              label="Show Legend"
              className="bg-bg-secondary/90 backdrop-blur hover:bg-bg-tertiary"
            />
          </Tooltip>
        </div>

        <EntityDetailsDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          entity={selectedEntity}
          entityType={selectedEntityType}
        />
      </div>
    </TooltipProvider>
  );
};
