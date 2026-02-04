import { useState, useEffect, useCallback } from 'react';
import { Tugboat, Vessel, UpdateEvent } from '../types';

const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : '';

export const usePortData = () => {
  const [tugboats, setTugboats] = useState<Map<string, Tugboat>>(new Map());
  const [vessels, setVessels] = useState<Map<string, Vessel>>(new Map());
  const [connected, setConnected] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addLog = useCallback((msg: string) => {
    setDebugLogs((prev) => {
      const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`];
      return newLogs.slice(-100);
    });
  }, []);

  const normalizeVesselStatus = (status: string): Vessel['status'] => {
    const validStatuses = ['AT_ENTRY', 'BEING_TOWED_TO_DOCK', 'BEING_TOWED_TO_EXIT', 'DOCKED', 'DEPARTED', 'REQUESTING_ASSISTANCE', 'WAITING_FOR_TUGBOAT', 'BEING_ASSISTED'] as const;
    return (validStatuses.includes(status as any) ? status : 'UNKNOWN') as Vessel['status'];
  };

  const updateTugboat = useCallback((data: any) => {
    setTugboats((prev) => {
      const newMap = new Map(prev);
      newMap.set(data.tugboatId, {
        ...data,
        timestamp: new Date(data.timestamp),
      });
      return newMap;
    });
  }, []);

  const updateVessel = useCallback((data: any) => {
    setVessels((prev) => {
      const newMap = new Map(prev);
      const normalizedStatus = normalizeVesselStatus(data.status);
      newMap.set(data.vesselId, {
        vesselId: data.vesselId,
        vesselName: data.vesselName,
        vesselType: data.vesselType,
        position: data.position,
        status: normalizedStatus,
        assignedTugboatId: data.assignedTugboatId,
        timestamp: new Date(),
      });
      return newMap;
    });
  }, []);

  const removeVessel = useCallback((vesselId: string) => {
    setVessels((prev) => {
      const newMap = new Map(prev);
      newMap.delete(vesselId);
      return newMap;
    });
  }, []);

  const updateVesselFromEvent = useCallback((event: any) => {
    setVessels((prev) => {
      const vessel = prev.get(event.vesselId);
      if (vessel) {
        const newMap = new Map(prev);
        newMap.set(event.vesselId, {
          ...vessel,
          status: 'DOCKED',
          position: event.position || vessel.position,
        });
        return newMap;
      }
      return prev;
    });
  }, []);

  const handleUpdate = useCallback((update: UpdateEvent) => {
    addLog(`Received ${update.type}`);
    
    switch (update.type) {
      case 'SNAPSHOT':
        addLog(`SNAPSHOT: ${update.data.tugboats.length} tugboats, ${update.data.vessels.length} vessels`);
        update.data.tugboats.forEach((t: any) => updateTugboat(t));
        update.data.vessels.forEach((v: any) => updateVessel(v));
        break;
      case 'TUGBOAT_POSITION':
        addLog(`TUGBOAT_POSITION: ${update.data.tugboatId} at (${Math.round(update.data.position.x)}, ${Math.round(update.data.position.y)})`);
        updateTugboat(update.data);
        break;
      case 'VESSEL_POSITION':
        updateVessel(update.data);
        break;
      case 'VESSEL_REQUEST':
      case 'VESSEL_ARRIVED':
        updateVessel(update.data);
        break;
      case 'VESSEL_DOCKED':
        updateVesselFromEvent(update.data);
        break;
      case 'VESSEL_DEPARTED':
        removeVessel(update.data.vesselId);
        break;
      default:
        break;
    }
  }, [addLog, updateTugboat, updateVessel, removeVessel, updateVesselFromEvent]);

  useEffect(() => {
    addLog('Connecting to stream...');
    const eventSource = new EventSource(`${API_URL}/api/stream`);

    eventSource.onopen = () => {
      console.log('Connected to stream');
      setConnected(true);
      addLog('Connected to stream');
    };

    eventSource.onerror = () => {
      console.error('Stream connection error');
      setConnected(false);
      addLog('Connection error');
    };

    eventSource.onmessage = (event) => {
      try {
        const update: UpdateEvent = JSON.parse(event.data);
        handleUpdate(update);
      } catch (error) {
        console.error('Error parsing message:', error);
        addLog(`Error parsing: ${error}`);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [handleUpdate, addLog]);

  return {
    tugboats,
    vessels,
    connected,
    debugLogs,
  };
};
