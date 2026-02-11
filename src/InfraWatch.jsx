import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Polygon } from 'react-leaflet'
import L from 'leaflet'
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, AlertTriangle, Camera, Droplets, Activity, Shield, Users, Settings, FileText, TrendingUp, Bell, ChevronRight, Maximize2, X, Menu, Radio, Zap, CheckCircle, XCircle, Clock, Navigation, Eye, AlertCircle } from 'lucide-react';

export default function InfraWatch() {
  const socket = useRef(null);
  const [activeModule, setActiveModule] = useState('dashboard');
  const [selectedRiver, setSelectedRiver] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [systemHealth, setSystemHealth] = useState('normal');
  const [mapLayers, setMapLayers] = useState({
    rivers: true,
    dangerZones: true,
    cameras: true,
    infrastructure: false
  });
  const [jurisdiction, setJurisdiction] = useState({
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    zone: 'Central'
  });
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({
    rivers: [],
    dangerZones: [],
    cameras: []
  });

  // Sample data - replace with real API data
  const metrics = {
    activeCameras: 1247,
    dangerZones: 23,
    infrastructureHealth: 87,
    riversUnderAlert: 4,
    openIncidents: 15,
    teamsDeployed: 8
  };

  const rivers = [
    { 
      id: 1, 
      name: 'Mithi River', 
      waterLevel: 4.2, 
      normalLevel: 2.8, 
      dangerLevel: 5.0, 
      status: 'warning',
      flowVelocity: '2.3 m/s',
      floodProbability: 68,
      rateOfChange: '+0.4m/hr'
    },
    { 
      id: 2, 
      name: 'Ulhas River', 
      waterLevel: 2.1, 
      normalLevel: 2.5, 
      dangerLevel: 4.5, 
      status: 'normal',
      flowVelocity: '1.8 m/s',
      floodProbability: 12,
      rateOfChange: '-0.1m/hr'
    },
    { 
      id: 3, 
      name: 'Amba River', 
      waterLevel: 5.8, 
      normalLevel: 3.2, 
      dangerLevel: 5.5, 
      status: 'critical',
      flowVelocity: '4.1 m/s',
      floodProbability: 94,
      rateOfChange: '+0.8m/hr'
    },
    { 
      id: 4, 
      name: 'Patalganga River', 
      waterLevel: 3.9, 
      normalLevel: 3.0, 
      dangerLevel: 5.2, 
      status: 'warning',
      flowVelocity: '2.7 m/s',
      floodProbability: 45,
      rateOfChange: '+0.3m/hr'
    }
  ];

  const dangerZones = [
    {
      id: 'DZ-001',
      type: 'Structural Damage',
      severity: 92,
      confidence: 87,
      location: 'Eastern Express Highway, Km 12.4',
      detectedAt: '2026-02-10 14:23:45',
      status: 'open',
      affectedInfra: ['Bridge', 'Road'],
      description: 'Severe structural cracks detected on bridge deck'
    },
    {
      id: 'DZ-002',
      type: 'Flood Risk',
      severity: 78,
      confidence: 94,
      location: 'Bandra-Kurla Complex',
      detectedAt: '2026-02-10 13:15:22',
      status: 'assigned',
      affectedInfra: ['Drainage', 'Roads'],
      description: 'Water accumulation and drainage overflow detected'
    },
    {
      id: 'DZ-003',
      type: 'Fire Hazard',
      severity: 85,
      confidence: 91,
      location: 'Industrial Estate, Turbhe',
      detectedAt: '2026-02-10 12:48:11',
      status: 'resolved',
      affectedInfra: ['Building', 'Utilities'],
      description: 'Smoke and thermal anomaly detected'
    }
  ];

  const alerts = [
    {
      id: 'ALT-1247',
      type: 'Critical Infrastructure',
      severity: 'critical',
      message: 'Bridge structural integrity compromised - Eastern Express Highway',
      location: 'Zone 3A',
      timestamp: '14:23:45',
      source: 'CAM-0847'
    },
    {
      id: 'ALT-1246',
      type: 'Flood Warning',
      severity: 'high',
      message: 'Amba River crossing danger threshold - Immediate evacuation recommended',
      location: 'Zone 2B',
      timestamp: '14:18:32',
      source: 'SENSOR-1293'
    },
    {
      id: 'ALT-1245',
      type: 'Crowd Anomaly',
      severity: 'medium',
      message: 'Unusual crowd density detected at railway station',
      location: 'Central Station',
      timestamp: '13:52:18',
      source: 'CAM-0234'
    }
  ];

  const cameras = [
    { id: 'CAM-0847', location: 'Eastern Express Hwy', status: 'active', aiDetection: 'Structural Crack' },
    { id: 'CAM-0234', location: 'Central Station', status: 'active', aiDetection: 'Crowd Density' },
    { id: 'CAM-1293', location: 'Bandra Complex', status: 'active', aiDetection: 'Water Overflow' },
    { id: 'CAM-0512', location: 'Turbhe Industrial', status: 'active', aiDetection: 'Smoke Detection' },
    { id: 'CAM-0923', location: 'Harbor Link Road', status: 'active', aiDetection: 'Normal' },
    { id: 'CAM-0445', location: 'JVLR Junction', status: 'maintenance', aiDetection: 'Offline' }
  ];

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = () => {
      if (!window.L) {
        setTimeout(initMap, 100);
        return;
      }

      const L = window.L;
      
      const map = L.map(mapRef.current, {
        zoomControl: false
      }).setView([19.0760, 72.8777], 11);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19
      }).addTo(map);

      L.control.zoom({
        position: 'bottomright'
      }).addTo(map);

      mapInstanceRef.current = map;
      updateMapMarkers();
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMapMarkers();
    }
  }, [mapLayers]);

  const updateMapMarkers = () => {
    if (!mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    Object.values(markersRef.current).forEach(layerGroup => {
      layerGroup.forEach(marker => map.removeLayer(marker));
    });
    markersRef.current = { rivers: [], dangerZones: [], cameras: [] };

    if (mapLayers.rivers) {
      const riverLocations = [
        { ...rivers[0], lat: 19.0896, lng: 72.8656 },
        { ...rivers[1], lat: 19.2183, lng: 72.9781 },
        { ...rivers[2], lat: 19.1136, lng: 72.9083 },
        { ...rivers[3], lat: 19.0368, lng: 73.0158 }
      ];

      riverLocations.forEach(river => {
        const color = river.status === 'critical' ? '#ef4444' : 
                     river.status === 'warning' ? '#f59e0b' : '#3b82f6';
        
        const circleMarker = L.circleMarker([river.lat, river.lng], {
          radius: 12,
          fillColor: color,
          color: color,
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.4
        }).addTo(map);

        circleMarker.bindPopup(`
          <div style="color: #1e293b; font-family: 'Rajdhani', sans-serif;">
            <strong style="font-size: 16px;">${river.name}</strong><br/>
            <span style="font-size: 12px;">Water Level: ${river.waterLevel}m / ${river.dangerLevel}m</span><br/>
            <span style="font-size: 12px;">Flood Risk: ${river.floodProbability}%</span><br/>
            <span style="font-size: 12px; color: ${color}; font-weight: bold;">${river.status.toUpperCase()}</span>
          </div>
        `);

        circleMarker.on('click', () => setSelectedRiver(river));
        markersRef.current.rivers.push(circleMarker);
      });
    }

    if (mapLayers.dangerZones) {
      const zoneLocations = [
        { ...dangerZones[0], coords: [[19.1020, 72.8870], [19.1040, 72.8870], [19.1040, 72.8900], [19.1020, 72.8900]] },
        { ...dangerZones[1], coords: [[19.0650, 72.8680], [19.0670, 72.8680], [19.0670, 72.8710], [19.0650, 72.8710]] },
        { ...dangerZones[2], coords: [[19.0380, 73.0120], [19.0400, 73.0120], [19.0400, 73.0150], [19.0380, 73.0150]] }
      ];

      zoneLocations.forEach(zone => {
        const color = zone.severity >= 80 ? '#ef4444' : 
                     zone.severity >= 50 ? '#f59e0b' : '#eab308';
        
        const polygon = L.polygon(zone.coords, {
          color: color,
          fillColor: color,
          weight: 2,
          opacity: 0.8,
          fillOpacity: 0.3
        }).addTo(map);

        polygon.bindPopup(`
          <div style="color: #1e293b; font-family: 'Rajdhani', sans-serif;">
            <strong style="font-size: 16px;">${zone.id}</strong><br/>
            <span style="font-size: 12px;">${zone.type}</span><br/>
            <span style="font-size: 12px;">Severity: ${zone.severity}%</span><br/>
            <span style="font-size: 12px;">${zone.location}</span>
          </div>
        `);

        polygon.on('click', () => setSelectedZone(zone));
        markersRef.current.dangerZones.push(polygon);
      });
    }

    if (mapLayers.cameras) {
      const cameraLocations = [
        { ...cameras[0], lat: 19.1030, lng: 72.8880 },
        { ...cameras[1], lat: 19.0728, lng: 72.8826 },
        { ...cameras[2], lat: 19.0660, lng: 72.8690 },
        { ...cameras[3], lat: 19.0390, lng: 73.0130 },
        { ...cameras[4], lat: 19.1176, lng: 72.9060 },
        { ...cameras[5], lat: 19.0895, lng: 72.8686 }
      ];

      const cameraIcon = L.divIcon({
        className: 'custom-camera-icon',
        html: `<div style="background: #3b82f6; border: 2px solid #1e40af; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
        </div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      cameraLocations.forEach(camera => {
        const marker = L.marker([camera.lat, camera.lng], { icon: cameraIcon }).addTo(map);

        marker.bindPopup(`
          <div style="color: #1e293b; font-family: 'Rajdhani', sans-serif;">
            <strong style="font-size: 16px;">${camera.id}</strong><br/>
            <span style="font-size: 12px;">${camera.location}</span><br/>
            <span style="font-size: 12px; color: ${camera.status === 'active' ? '#10b981' : '#ef4444'}; font-weight: bold;">${camera.status.toUpperCase()}</span><br/>
            <span style="font-size: 11px;">AI: ${camera.aiDetection}</span>
          </div>
        `);

        marker.on('click', () => setSelectedCamera(camera));
        markersRef.current.cameras.push(marker);
      });
    }
  };

  const getSeverityColor = (severity) => {
    if (typeof severity === 'number') {
      if (severity >= 80) return 'text-red-500 bg-red-500/10 border-red-500/30';
      if (severity >= 50) return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
    }
    const colors = {
      critical: 'text-red-500 bg-red-500/10 border-red-500/30',
      high: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
      medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
      low: 'text-blue-500 bg-blue-500/10 border-blue-500/30'
    };
    return colors[severity] || colors.medium;
  };

  const getRiverStatusColor = (status) => {
    const colors = {
      normal: '#3b82f6',
      warning: '#f59e0b',
      critical: '#ef4444'
    };
    return colors[status] || colors.normal;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        
        * {
          font-family: 'Rajdhani', sans-serif;
        }
        
        .mono-font {
          font-family: 'IBM Plex Mono', monospace;
        }
        
        .leaflet-container {
          background: #0f172a;
          font-family: 'Rajdhani', sans-serif;
        }
        
        .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 8px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .leaflet-popup-tip {
          background: rgba(255, 255, 255, 0.95);
        }
        
        .custom-camera-icon {
          background: transparent;
          border: none;
        }
        
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
          50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.8); }
        }
        
        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        
        .scan-line {
          position: absolute;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.8), transparent);
          animation: scan-line 3s linear infinite;
          pointer-events: none;
        }
        
        .grid-pattern {
          background-image: 
            linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        .metric-card {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6));
          border: 1px solid rgba(59, 130, 246, 0.2);
          transition: all 0.3s ease;
        }
        
        .metric-card:hover {
          border-color: rgba(59, 130, 246, 0.5);
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.2);
        }
        
        .status-indicator {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        
        .alert-item {
          background: rgba(15, 23, 42, 0.6);
          border-left: 3px solid;
          transition: all 0.2s ease;
        }
        
        .alert-item:hover {
          background: rgba(30, 41, 59, 0.8);
          transform: translateX(4px);
        }
        
        .river-bar {
          transition: all 0.3s ease;
        }
        
        .danger-zone-card {
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.9), rgba(30, 41, 59, 0.7));
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        
        .camera-tile {
          background: rgba(15, 23, 42, 0.8);
          border: 1px solid rgba(59, 130, 246, 0.2);
          transition: all 0.3s ease;
        }
        
        .camera-tile:hover {
          border-color: rgba(59, 130, 246, 0.5);
          transform: scale(1.02);
        }
        
        .nav-item {
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }
        
        .nav-item:hover {
          background: rgba(59, 130, 246, 0.1);
          border-left-color: rgba(59, 130, 246, 0.8);
        }
        
        .nav-item.active {
          background: rgba(59, 130, 246, 0.15);
          border-left-color: #3b82f6;
        }
        
        .map-container {
          background: 
            radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
            linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
        }
      `}</style>

      <div className="h-16 bg-slate-900/95 backdrop-blur-sm border-b border-blue-500/20 flex items-center px-6 justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" />
            <div>
              <h1 className="text-2xl font-bold tracking-wider text-blue-400">INFRAWATCH</h1>
              <p className="text-xs text-slate-400 mono-font">INFRASTRUCTURE MONITORING SYSTEM</p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-blue-500/30"></div>
          
          <div className="flex gap-2 mono-font text-sm">
            <select className="bg-slate-800 border border-blue-500/30 rounded px-3 py-1 text-slate-300 focus:outline-none focus:border-blue-500">
              <option>{jurisdiction.country}</option>
            </select>
            <select className="bg-slate-800 border border-blue-500/30 rounded px-3 py-1 text-slate-300 focus:outline-none focus:border-blue-500">
              <option>{jurisdiction.state}</option>
            </select>
            <select className="bg-slate-800 border border-blue-500/30 rounded px-3 py-1 text-slate-300 focus:outline-none focus:border-blue-500">
              <option>{jurisdiction.city}</option>
            </select>
            <select className="bg-slate-800 border border-blue-500/30 rounded px-3 py-1 text-slate-300 focus:outline-none focus:border-blue-500">
              <option>{jurisdiction.zone}</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${
              systemHealth === 'critical' ? 'bg-red-500/20 border-red-500/50 text-red-400' :
              systemHealth === 'warning' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' :
              'bg-green-500/20 border-green-500/50 text-green-400'
            }`}>
              <div className={`w-2 h-2 rounded-full status-indicator ${
                systemHealth === 'critical' ? 'bg-red-500' :
                systemHealth === 'warning' ? 'bg-orange-500' :
                'bg-green-500'
              }`}></div>
              <span className="mono-font text-xs font-semibold uppercase">{systemHealth}</span>
            </div>
          </div>

          <div className="mono-font text-sm text-slate-400">
            <div>UTC: {new Date().toUTCString().split(' ')[4]}</div>
            <div>IST: {new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
          </div>

          <button className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-slate-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-blue-500/30">
            <div className="text-right">
              <div className="text-sm font-semibold">Admin User</div>
              <div className="text-xs text-slate-400 mono-font">SUPER_ADMIN</div>
            </div>
            <div className="w-9 h-9 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/50">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        <div className={`bg-slate-900/90 backdrop-blur-sm border-r border-blue-500/20 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          <div className="p-4">
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-full flex items-center justify-center p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <nav className="space-y-1 px-2">
            {[
              { id: 'dashboard', icon: Activity, label: 'Dashboard Overview' },
              { id: 'map', icon: MapPin, label: 'Live Map' },
              { id: 'infrastructure', icon: Shield, label: 'Infrastructure Health' },
              { id: 'rivers', icon: Droplets, label: 'River Monitoring' },
              { id: 'alerts', icon: AlertTriangle, label: 'AI Alerts' },
              { id: 'cameras', icon: Camera, label: 'Live Cameras' },
              { id: 'zones', icon: AlertCircle, label: 'Danger Zones' },
              { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
              { id: 'prediction', icon: Zap, label: 'Prediction Engine' },
              { id: 'response', icon: Radio, label: 'Emergency Response' },
              { id: 'settings', icon: Settings, label: 'Settings' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg nav-item ${
                  activeModule === item.id ? 'active' : ''
                }`}
              >
                <item.icon className="w-5 h-5 text-blue-400 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {activeModule === 'dashboard' && (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-6 gap-4">
                  <div className="metric-card rounded-xl p-4 relative overflow-hidden">
                    <div className="scan-line"></div>
                    <div className="flex items-start justify-between mb-2">
                      <Camera className="w-5 h-5 text-blue-400" />
                      <span className="mono-font text-xs text-slate-500">LIVE</span>
                    </div>
                    <div className="mono-font text-3xl font-bold text-blue-400 mb-1">{metrics.activeCameras}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Active Cameras</div>
                  </div>

                  <div className="metric-card rounded-xl p-4 relative overflow-hidden">
                    <div className="scan-line"></div>
                    <div className="flex items-start justify-between mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <span className="mono-font text-xs text-red-500">ALERT</span>
                    </div>
                    <div className="mono-font text-3xl font-bold text-red-400 mb-1">{metrics.dangerZones}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Danger Zones</div>
                  </div>

                  <div className="metric-card rounded-xl p-4 relative overflow-hidden">
                    <div className="scan-line"></div>
                    <div className="flex items-start justify-between mb-2">
                      <Shield className="w-5 h-5 text-green-400" />
                      <span className="mono-font text-xs text-green-500">{metrics.infrastructureHealth}%</span>
                    </div>
                    <div className="mono-font text-3xl font-bold text-green-400 mb-1">{metrics.infrastructureHealth}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Health Score</div>
                  </div>

                  <div className="metric-card rounded-xl p-4 relative overflow-hidden">
                    <div className="scan-line"></div>
                    <div className="flex items-start justify-between mb-2">
                      <Droplets className="w-5 h-5 text-orange-400" />
                      <span className="mono-font text-xs text-orange-500">WARNING</span>
                    </div>
                    <div className="mono-font text-3xl font-bold text-orange-400 mb-1">{metrics.riversUnderAlert}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Rivers Alert</div>
                  </div>

                  <div className="metric-card rounded-xl p-4 relative overflow-hidden">
                    <div className="scan-line"></div>
                    <div className="flex items-start justify-between mb-2">
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                      <span className="mono-font text-xs text-yellow-500">OPEN</span>
                    </div>
                    <div className="mono-font text-3xl font-bold text-yellow-400 mb-1">{metrics.openIncidents}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Open Incidents</div>
                  </div>

                  <div className="metric-card rounded-xl p-4 relative overflow-hidden">
                    <div className="scan-line"></div>
                    <div className="flex items-start justify-between mb-2">
                      <Radio className="w-5 h-5 text-purple-400" />
                      <span className="mono-font text-xs text-purple-500">ACTIVE</span>
                    </div>
                    <div className="mono-font text-3xl font-bold text-purple-400 mb-1">{metrics.teamsDeployed}</div>
                    <div className="text-xs text-slate-400 uppercase tracking-wide">Teams Deployed</div>
                  </div>
                </div>

                <div className="rounded-xl border border-blue-500/20 overflow-hidden relative" style={{ height: '500px' }}>
                  <div className="absolute top-4 left-4 z-[1000] space-y-2">
                    <div className="bg-slate-900/90 backdrop-blur-sm border border-blue-500/30 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Map Layers</div>
                      {Object.entries(mapLayers).map(([key, value]) => (
                        <label key={key} className="flex items-center gap-2 mb-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={() => setMapLayers({ ...mapLayers, [key]: !value })}
                            className="w-4 h-4 accent-blue-500"
                          />
                          <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </label>
                      ))}
                    </div>
                    
                    <div className="bg-slate-900/90 backdrop-blur-sm border border-blue-500/30 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Legend</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span>Normal</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                          <span>Warning</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span>Critical</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <MapContainer
  center={[19.0760,72.8777]}
  zoom={11}
  style={{ width:'100%', height:'100%' }}
>

<TileLayer
  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
/>

{rivers.map((r,i)=>(
  <CircleMarker key={i} center={[19.08+i*0.01,72.87+i*0.01]} radius={10} pathOptions={{color:'blue'}}>
    <Popup>{r.name}</Popup>
  </CircleMarker>
))}

{dangerZones.map((z,i)=>(
  <Polygon key={i} positions={[
    [19.1+i*0.01,72.88],
    [19.1+i*0.01,72.89],
    [19.11+i*0.01,72.89],
  ]} pathOptions={{color:'red'}}>
    <Popup>{z.id}</Popup>
  </Polygon>
))}

{cameras.map((c,i)=>(
  <Marker key={i} position={[19.05+i*0.01,72.86+i*0.01]}>
    <Popup>{c.id}</Popup>
  </Marker>
))}

</MapContainer>

                </div>

                <div className="bg-slate-900/60 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Droplets className="w-6 h-6 text-blue-400" />
                    River & Flood Monitoring
                  </h2>
                  <div className="space-y-3">
                    {rivers.map(river => (
                      <div
                        key={river.id}
                        className="bg-slate-800/50 rounded-lg p-4 border border-blue-500/10 hover:border-blue-500/30 transition-all cursor-pointer"
                        onClick={() => setSelectedRiver(river)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{river.name}</h3>
                            <p className="text-xs text-slate-400 mono-font">FLOW: {river.flowVelocity} | CHANGE: {river.rateOfChange}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-bold mono-font ${
                            river.status === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
                            river.status === 'warning' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                          }`}>
                            {river.status.toUpperCase()}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-400">Water Level</span>
                            <span className="mono-font font-semibold">{river.waterLevel}m / {river.dangerLevel}m</span>
                          </div>
                          <div className="relative h-3 bg-slate-700 rounded-full overflow-hidden">
                            <div className="absolute inset-0 flex">
                              <div 
                                className="h-full transition-all duration-500"
                                style={{ 
                                  width: `${(river.normalLevel / river.dangerLevel) * 100}%`,
                                  backgroundColor: '#3b82f6'
                                }}
                              ></div>
                              <div 
                                className="h-full transition-all duration-500"
                                style={{ 
                                  width: `${((river.waterLevel - river.normalLevel) / river.dangerLevel) * 100}%`,
                                  backgroundColor: getRiverStatusColor(river.status)
                                }}
                              ></div>
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-slate-500">
                            <span>Normal: {river.normalLevel}m</span>
                            <span>Current: {river.waterLevel}m</span>
                            <span>Danger: {river.dangerLevel}m</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-400" />
                            <span className="text-sm">Flood Probability: <span className="font-bold mono-font">{river.floodProbability}%</span></span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-500" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                    Active Danger Zones
                  </h2>
                  <div className="grid grid-cols-3 gap-4">
                    {dangerZones.map(zone => (
                      <div
                        key={zone.id}
                        className="danger-zone-card rounded-lg p-4 cursor-pointer hover:border-red-500/50 transition-all"
                        onClick={() => setSelectedZone(zone)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="mono-font text-sm font-bold text-blue-400">{zone.id}</div>
                          <div className={`px-2 py-1 rounded text-xs font-bold border ${getSeverityColor(zone.severity)}`}>
                            {zone.severity}%
                          </div>
                        </div>
                        <h3 className="font-semibold mb-1">{zone.type}</h3>
                        <p className="text-xs text-slate-400 mb-3">{zone.location}</p>
                        <div className="text-xs text-slate-500 mb-2">{zone.description}</div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                          <span className="text-xs text-slate-500 mono-font">{zone.detectedAt}</span>
                          <div className={`px-2 py-1 rounded text-xs font-semibold ${
                            zone.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                            zone.status === 'assigned' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-orange-500/20 text-orange-400'
                          }`}>
                            {zone.status.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeModule === 'cameras' && (
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Camera className="w-7 h-7 text-blue-400" />
                  Live Camera Feeds
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  {cameras.map(camera => (
                    <div
                      key={camera.id}
                      className="camera-tile rounded-lg p-4 cursor-pointer"
                      onClick={() => setSelectedCamera(camera)}
                    >
                      <div className="aspect-video bg-slate-800 rounded-lg mb-3 relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Eye className="w-12 h-12 text-slate-600" />
                        </div>
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          LIVE
                        </div>
                      </div>
                      <div className="mono-font text-sm font-bold text-blue-400 mb-1">{camera.id}</div>
                      <div className="text-xs text-slate-400 mb-2">{camera.location}</div>
                      <div className={`text-xs px-2 py-1 rounded inline-block ${
                        camera.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {camera.aiDetection}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-96 bg-slate-900/90 backdrop-blur-sm border-l border-blue-500/20 overflow-y-auto">
            <div className="p-4 border-b border-blue-500/20">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-400" />
                Live Alerts & Incidents
              </h2>
            </div>
            <div className="p-4 space-y-3">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`alert-item rounded-lg p-3 cursor-pointer ${
                    alert.severity === 'critical' ? 'border-red-500' :
                    alert.severity === 'high' ? 'border-orange-500' :
                    'border-yellow-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(alert.severity)}`}>
                      {alert.severity.toUpperCase()}
                    </div>
                    <span className="mono-font text-xs text-slate-500">{alert.timestamp}</span>
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{alert.type}</h3>
                  <p className="text-xs text-slate-400 mb-2">{alert.message}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{alert.location}</span>
                    <span className="mono-font text-xs text-blue-400">{alert.source}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs py-1.5 rounded transition-colors">
                      View Map
                    </button>
                    <button className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-xs py-1.5 rounded transition-colors">
                      Assign
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedRiver && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-slate-900 border border-blue-500/30 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-500/20 flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Droplets className="w-7 h-7 text-blue-400" />
                {selectedRiver.name} - Detailed Analysis
              </h2>
              <button
                onClick={() => setSelectedRiver(null)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">Current Water Level</div>
                  <div className="text-3xl font-bold mono-font text-blue-400">{selectedRiver.waterLevel}m</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">Flood Probability</div>
                  <div className="text-3xl font-bold mono-font text-orange-400">{selectedRiver.floodProbability}%</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">Flow Velocity</div>
                  <div className="text-3xl font-bold mono-font text-green-400">{selectedRiver.flowVelocity}</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">Rate of Change</div>
                  <div className="text-3xl font-bold mono-font text-yellow-400">{selectedRiver.rateOfChange}</div>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-semibold mb-3">Historical Data & Predictions</h3>
                <p className="text-sm text-slate-400">Integrate time-series charts showing water level trends, rainfall correlation, and 72-hour flood forecasting models.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedZone && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-red-500/20 flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <AlertTriangle className="w-7 h-7 text-red-400" />
                Danger Zone {selectedZone.id}
              </h2>
              <button
                onClick={() => setSelectedZone(null)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">Severity Score</div>
                  <div className="text-3xl font-bold mono-font text-red-400">{selectedZone.severity}/100</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <div className="text-sm text-slate-400 mb-1">AI Confidence</div>
                  <div className="text-3xl font-bold mono-font text-blue-400">{selectedZone.confidence}%</div>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-slate-300">{selectedZone.description}</p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Affected Infrastructure</h3>
                <div className="flex gap-2">
                  {selectedZone.affectedInfra.map(infra => (
                    <span key={infra} className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
                      {infra}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors">
                  View on Map
                </button>
                <button className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors">
                  Deploy Response Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}