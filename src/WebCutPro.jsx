import { useState, useRef, useCallback, useEffect, useReducer } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────




// ─── UTILS ────────────────────────────────────────────────────────────────────
const formatTime = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60), ms = Math.floor((s % 1) * 10);
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}.${ms}`;
};
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const uid = () => Math.random().toString(36).slice(2, 9);

// ─── INITIAL STATE ─────────────────────────────────────────────────────────────
const initState = {
  projectName: "Untitled Project",
  mediaItems: [],
  tracks: [
    { id: "t1", type: "video", name: "Video 1", muted: false, locked: false, clips: [] },
    { id: "t2", type: "audio", name: "Audio 1", muted: false, locked: false, clips: [] },
  ],
  playhead: 0,
  duration: 30,
  playing: false,
  zoom: 60, // px per second
  selectedClipId: null,
  snapping: true,
  markers: [],
  history: [],
  historyIndex: -1,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_PROJECT_NAME": return { ...state, projectName: action.name };
    case "ADD_MEDIA": return { ...state, mediaItems: [...state.mediaItems, action.item] };
    case "REMOVE_MEDIA": return { ...state, mediaItems: state.mediaItems.filter(m => m.id !== action.id) };
    case "ADD_CLIP": {
      const tracks = state.tracks.map(t =>
        t.id === action.trackId ? { ...t, clips: [...t.clips, action.clip] } : t
      );
      const maxEnd = tracks.flatMap(t => t.clips).reduce((m, c) => Math.max(m, c.start + c.duration), 0);
      return { ...state, tracks, duration: Math.max(state.duration, maxEnd + 2) };
    }
    case "MOVE_CLIP": {
      const tracks = state.tracks.map(t => ({
        ...t,
        clips: t.clips.map(c => c.id === action.id ? { ...c, start: Math.max(0, action.start) } : c)
      }));
      return { ...state, tracks };
    }
    case "TRIM_CLIP": {
      const tracks = state.tracks.map(t => ({
        ...t,
        clips: t.clips.map(c => c.id === action.id ? { ...c, ...action.changes } : c)
      }));
      return { ...state, tracks };
    }
    case "DELETE_CLIP": {
      const tracks = state.tracks.map(t => ({
        ...t, clips: t.clips.filter(c => c.id !== action.id)
      }));
      return { ...state, tracks, selectedClipId: state.selectedClipId === action.id ? null : state.selectedClipId };
    }
    case "SPLIT_CLIP": {
      const t = state.tracks.find(tr => tr.clips.some(c => c.id === action.id));
      if (!t) return state;
      const clip = t.clips.find(c => c.id === action.id);
      const splitAt = state.playhead - clip.start;
      if (splitAt <= 0.1 || splitAt >= clip.duration - 0.1) return state;
      const a = { ...clip, duration: splitAt };
      const b = { ...clip, id: uid(), start: clip.start + splitAt, inPoint: (clip.inPoint || 0) + splitAt, duration: clip.duration - splitAt };
      const tracks = state.tracks.map(tr =>
        tr.id === t.id ? { ...tr, clips: tr.clips.map(c => c.id === action.id ? a : c).concat(b) } : tr
      );
      return { ...state, tracks };
    }
    case "SELECT_CLIP": return { ...state, selectedClipId: action.id };
    case "SET_PLAYHEAD": return { ...state, playhead: clamp(action.t, 0, state.duration) };
    case "SET_PLAYING": return { ...state, playing: action.v };
    case "SET_ZOOM": return { ...state, zoom: clamp(action.v, 20, 400) };
    case "TOGGLE_SNAP": return { ...state, snapping: !state.snapping };
    case "TOGGLE_MUTE": return { ...state, tracks: state.tracks.map(t => t.id === action.id ? { ...t, muted: !t.muted } : t) };
    case "TOGGLE_LOCK": return { ...state, tracks: state.tracks.map(t => t.id === action.id ? { ...t, locked: !t.locked } : t) };
    case "ADD_TRACK": return { ...state, tracks: [...state.tracks, action.track] };
    case "ADD_MARKER": return { ...state, markers: [...state.markers, { id: uid(), time: state.playhead, label: "Marker" }] };
    default: return state;
  }
}

// ─── STYLE HELPERS ─────────────────────────────────────────────────────────────
const s = {
  flex: (dir="row", align="center", justify="flex-start", gap=0) => ({
    display:"flex", flexDirection:dir, alignItems:align, justifyContent:justify, gap
  }),
  btn: (active=false, danger=false) => ({
    display:"flex", alignItems:"center", justifyContent:"center", gap:5,
    padding:"5px 10px", borderRadius:6, border:`1px solid ${active?C.accent:C.border}`,
    background: active ? C.accentDim : "transparent",
    color: danger ? C.red : active ? C.accent : C.textSec,
    cursor:"pointer", fontSize:12, fontFamily:"DM Sans, sans-serif",
    transition:"all 0.15s", userSelect:"none", flexShrink:0,
  }),
  iconBtn: (active=false) => ({
    display:"flex", alignItems:"center", justifyContent:"center",
    width:28, height:28, borderRadius:6, border:"none",
    background: active ? C.accentDim : "transparent",
    color: active ? C.accent : C.textSec,
    cursor:"pointer", transition:"all 0.15s", flexShrink:0,
  }),
  panel: {
    background: C.panel, borderRight:`1px solid ${C.border}`,
  },
  input: {
    background: C.surface, border:`1px solid ${C.border}`, borderRadius:6,
    color: C.text, padding:"4px 8px", fontSize:12, fontFamily:"DM Sans, sans-serif",
    outline:"none",
  },
};

// ─── TOP BAR ──────────────────────────────────────────────────────────────────
function TopBar({ state, dispatch }) {
  const [editing, setEditing] = useState(false);
  return (
    <div style={{ ...s.flex("row","center","space-between",8), height:44, padding:"0 12px", background:C.panel, borderBottom:`1px solid ${C.border}`, flexShrink:0, zIndex:100 }}>
      {/* Logo */}
      <div style={{ ...s.flex("row","center","flex-start",8) }}>
        <div style={{ background:`linear-gradient(135deg,${C.accent},${C.purple})`, borderRadius:8, width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <span style={{ color:"#fff", fontSize:13, fontWeight:800 }}>W</span>
        </div>
        <span style={{ color:C.text, fontSize:13, fontWeight:700, letterSpacing:"-0.3px" }}>WebCut <span style={{color:C.accent}}>Pro</span></span>
      </div>

      {/* Project name */}
      <div style={{ flex:1, maxWidth:260, display:"flex", justifyContent:"center" }}>
        {editing ? (
          <input
            autoFocus
            style={{ ...s.input, textAlign:"center", width:"100%", fontSize:13 }}
            value={state.projectName}
            onChange={e => dispatch({ type:"SET_PROJECT_NAME", name:e.target.value })}
            onBlur={() => setEditing(false)}
            onKeyDown={e => e.key==="Enter" && setEditing(false)}
          />
        ) : (
          <span onClick={() => setEditing(true)} style={{ color:C.text, fontSize:13, fontWeight:500, cursor:"text", padding:"4px 8px", borderRadius:6, border:`1px solid transparent`, ":hover":{borderColor:C.border} }}>
            {state.projectName}
          </span>
        )}
      </div>

      {/* Actions */}
      <div style={{ ...s.flex("row","center","flex-end",6) }}>
        <button style={s.iconBtn()} title="Undo (Ctrl+Z)" onClick={() => {}}>
          <Icon d={icons.undo} size={14} color={C.textSec} />
        </button>
        <button style={s.iconBtn()} title="Redo (Ctrl+Y)">
          <Icon d={icons.redo} size={14} color={C.textSec} />
        </button>
        <div style={{ width:1, height:20, background:C.border, margin:"0 4px" }} />
        <button style={{ ...s.btn(), fontSize:11, gap:5 }}>
          <Icon d={icons.save} size={13} />
          Save
        </button>
        <button style={{ ...s.btn(), background:`linear-gradient(135deg,${C.accent},${C.purple})`, border:"none", color:"#fff", fontWeight:600, gap:5 }}>
          <Icon d={icons.export} size={13} color="#fff" />
          Export
        </button>
      </div>
    </div>
  );
}

// ─── LEFT PANEL ───────────────────────────────────────────────────────────────
const TABS = [
  { id:"media", icon:icons.film, label:"Media" },
  { id:"effects", icon:icons.wand, label:"Effects" },
  { id:"text", icon:"M4 6h16M4 12h10M4 18h7", label:"Text" },
  { id:"audio", icon:icons.music, label:"Audio" },
  { id:"stickers", icon:icons.image, label:"Stickers" },
];

function LeftPanel({ state, dispatch, width, onResize }) {
  const [tab, setTab] = useState("media");
  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");
  const [draggingOver, setDraggingOver] = useState(false);
  const fileRef = useRef();

  const handleFiles = (files) => {
    Array.from(files).forEach(file => {
      const url = URL.createObjectURL(file);
      const isVideo = file.type.startsWith("video/");
      const isAudio = file.type.startsWith("audio/");
      const isImage = file.type.startsWith("image/");
      const item = {
        id: uid(), name: file.name, url, size: file.size, type: file.type,
        kind: isVideo ? "video" : isAudio ? "audio" : isImage ? "image" : "unknown",
        duration: isImage ? 5 : null, thumbnail: isImage ? url : null,
        addedAt: Date.now(),
      };
      // Try to get video duration
      if (isVideo || isAudio) {
        const el = document.createElement(isVideo ? "video" : "audio");
        el.src = url;
        el.onloadedmetadata = () => {
          dispatch({ type:"ADD_MEDIA", item: { ...item, duration: el.duration } });
        };
        el.onerror = () => dispatch({ type:"ADD_MEDIA", item });
      } else {
        dispatch({ type:"ADD_MEDIA", item });
      }
    });
  };

  const filtered = state.mediaItems.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ ...s.panel, width, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative" }}>
      {/* Tab bar */}
      <div style={{ ...s.flex("row","center","flex-start",0), borderBottom:`1px solid ${C.border}`, padding:"0 4px", flexShrink:0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"8px 10px", border:"none", background:"transparent", cursor:"pointer", borderBottom:`2px solid ${tab===t.id ? C.accent : "transparent"}`, color: tab===t.id ? C.accent : C.textSec, fontSize:10, fontFamily:"DM Sans, sans-serif", transition:"all 0.15s" }}>
            <Icon d={t.icon} size={15} color={tab===t.id ? C.accent : C.textSec} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "media" && (
        <>
          {/* Search + view toggle */}
          <div style={{ ...s.flex("row","center","space-between",6), padding:"8px 10px", flexShrink:0 }}>
            <div style={{ ...s.flex("row","center","flex-start",6), flex:1, background:C.surface, border:`1px solid ${C.border}`, borderRadius:6, padding:"4px 8px" }}>
              <Icon d={icons.search} size={13} />
              <input style={{ background:"transparent", border:"none", outline:"none", color:C.text, fontSize:12, fontFamily:"DM Sans, sans-serif", flex:1, width:0 }} placeholder="Search media..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button style={s.iconBtn(view==="grid")} onClick={() => setView("grid")}><Icon d={icons.grid} size={14} /></button>
            <button style={s.iconBtn(view==="list")} onClick={() => setView("list")}><Icon d={icons.list} size={14} /></button>
          </div>

          {/* Import zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDraggingOver(true); }}
            onDragLeave={() => setDraggingOver(false)}
            onDrop={e => { e.preventDefault(); setDraggingOver(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
            style={{ margin:"0 10px 8px", padding:"14px 10px", border:`1.5px dashed ${draggingOver ? C.accent : C.border}`, borderRadius:8, display:"flex", flexDirection:"column", alignItems:"center", gap:5, cursor:"pointer", background: draggingOver ? C.accentDim : "transparent", transition:"all 0.2s", flexShrink:0 }}
          >
            <Icon d={icons.upload} size={20} color={draggingOver ? C.accent : C.textDim} />
            <span style={{ color: draggingOver ? C.accent : C.textDim, fontSize:11, textAlign:"center" }}>Drop media here or click to import</span>
            <input ref={fileRef} type="file" multiple accept="video/*,audio/*,image/*" style={{ display:"none" }} onChange={e => handleFiles(e.target.files)} />
          </div>

          {/* Media grid/list */}
          <div style={{ flex:1, overflowY:"auto", padding:"0 8px 8px" }}>
            {filtered.length === 0 ? (
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, padding:"30px 20px", color:C.textDim, fontSize:11, textAlign:"center" }}>
                <Icon d={icons.film} size={28} color={C.textDim} />
                <span>No media yet. Import files to get started.</span>
              </div>
            ) : view === "grid" ? (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:6 }}>
                {filtered.map(m => <MediaGridItem key={m.id} item={m} dispatch={dispatch} state={state} />)}
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {filtered.map(m => <MediaListItem key={m.id} item={m} dispatch={dispatch} />)}
              </div>
            )}
          </div>
        </>
      )}

      {tab !== "media" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, color:C.textDim, fontSize:11 }}>
          <Icon d={TABS.find(t=>t.id===tab)?.icon || icons.wand} size={28} color={C.textDim} />
          <span style={{ fontFamily:"DM Sans, sans-serif" }}>{TABS.find(t=>t.id===tab)?.label} — Phase 2</span>
        </div>
      )}

      {/* Resize handle */}
      <div
        onMouseDown={onResize}
        style={{ position:"absolute", right:0, top:0, bottom:0, width:4, cursor:"col-resize", background:"transparent", zIndex:10 }}
        onMouseEnter={e => e.target.style.background=C.accent}
        onMouseLeave={e => e.target.style.background="transparent"}
      />
    </div>
  );
}

function MediaGridItem({ item, dispatch, state }) {
  const [hover, setHover] = useState(false);
  const kindIcon = item.kind === "video" ? icons.film : item.kind === "audio" ? icons.music : icons.image;
  const kindColor = item.kind === "video" ? C.accent : item.kind === "audio" ? C.green : C.yellow;

  const addToTimeline = () => {
    const trackType = item.kind === "audio" ? "audio" : "video";
    const track = state.tracks.find(t => t.type === trackType);
    if (!track) return;
    const lastEnd = track.clips.reduce((m, c) => Math.max(m, c.start + c.duration), 0);
    dispatch({
      type: "ADD_CLIP",
      trackId: track.id,
      clip: { id:uid(), mediaId:item.id, name:item.name, start:lastEnd, duration:item.duration||5, inPoint:0, url:item.url, kind:item.kind, thumbnail:item.thumbnail }
    });
  };

  return (
    <div
      draggable
      onDragStart={e => e.dataTransfer.setData("mediaId", item.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDoubleClick={addToTimeline}
      style={{ position:"relative", background: hover ? C.surface2 : C.surface, borderRadius:8, border:`1px solid ${hover ? C.borderHover : C.border}`, overflow:"hidden", cursor:"grab", transition:"all 0.15s", aspectRatio:"16/10" }}
    >
      {item.thumbnail ? (
        <img src={item.thumbnail} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
      ) : (
        <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center", background:C.surface }}>
          <Icon d={kindIcon} size={22} color={kindColor} />
        </div>
      )}
      {/* Overlay */}
      <div style={{ position:"absolute", inset:0, background: hover ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.2)", transition:"all 0.15s" }} />
      {/* Duration badge */}
      {item.duration && (
        <div style={{ position:"absolute", bottom:4, right:4, background:"rgba(0,0,0,0.8)", color:"#fff", fontSize:9, padding:"1px 4px", borderRadius:3, fontFamily:"JetBrains Mono, monospace" }}>
          {formatTime(item.duration)}
        </div>
      )}
      {/* Kind badge */}
      <div style={{ position:"absolute", top:4, left:4, background:"rgba(0,0,0,0.7)", borderRadius:4, padding:"2px 4px", display:"flex", alignItems:"center", gap:3 }}>
        <Icon d={kindIcon} size={10} color={kindColor} />
      </div>
      {/* Add btn on hover */}
      {hover && (
        <button onClick={e => { e.stopPropagation(); addToTimeline(); }} style={{ position:"absolute", bottom:4, left:4, background:C.accent, border:"none", borderRadius:4, color:"#fff", fontSize:10, padding:"2px 6px", cursor:"pointer" }}>+Add</button>
      )}
      {/* Name */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"14px 4px 4px", background:"linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}>
        <div style={{ color:"#fff", fontSize:9, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontFamily:"DM Sans, sans-serif" }}>{item.name}</div>
      </div>
    </div>
  );
}

function MediaListItem({ item, dispatch }) {
  const [hover, setHover] = useState(false);
  const kindIcon = item.kind === "video" ? icons.film : item.kind === "audio" ? icons.music : icons.image;
  const kindColor = item.kind === "video" ? C.accent : item.kind === "audio" ? C.green : C.yellow;
  return (
    <div
      draggable
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ ...s.flex("row","center","space-between",8), padding:"6px 8px", borderRadius:6, background: hover ? C.surface2 : C.surface, border:`1px solid ${hover?C.borderHover:C.border}`, cursor:"grab", transition:"all 0.15s" }}
    >
      <div style={{ ...s.flex("row","center","flex-start",8) }}>
        <div style={{ width:36, height:24, borderRadius:4, background:C.surface2, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          {item.thumbnail ? <img src={item.thumbnail} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:4 }} /> : <Icon d={kindIcon} size={14} color={kindColor} />}
        </div>
        <div>
          <div style={{ color:C.text, fontSize:11, fontFamily:"DM Sans, sans-serif", maxWidth:110, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</div>
          <div style={{ color:C.textSec, fontSize:9, fontFamily:"JetBrains Mono, monospace" }}>{item.duration ? formatTime(item.duration) : "—"}</div>
        </div>
      </div>
      <button onClick={() => dispatch({ type:"REMOVE_MEDIA", id:item.id })} style={{ ...s.iconBtn(), opacity: hover?1:0, transition:"opacity 0.15s" }}>
        <Icon d={icons.trash} size={12} color={C.red} />
      </button>
    </div>
  );
}

// ─── PREVIEW PLAYER ───────────────────────────────────────────────────────────
function PreviewPlayer({ state, dispatch }) {
  const videoRef = useRef();
  const animRef = useRef();
  const [volume, setVolume] = useState(1);
  const [showVol, setShowVol] = useState(false);
  const [ratio, setRatio] = useState("16:9");

  const ratioMap = { "16:9":"56.25%", "9:16":"177.78%", "1:1":"100%", "4:5":"125%" };

  // Get currently playing clip
  const currentClip = state.tracks.flatMap(t => t.clips).find(c =>
    c.start <= state.playhead && (c.start + c.duration) > state.playhead && c.kind !== "audio"
  );

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !currentClip) return;
    const targetTime = state.playhead - currentClip.start + (currentClip.inPoint || 0);
    if (Math.abs(v.currentTime - targetTime) > 0.1) v.currentTime = targetTime;
    v.volume = volume;
    if (state.playing) v.play().catch(()=>{});
    else v.pause();
  }, [state.playing, state.playhead, currentClip?.id]);

  // RAF playhead advance
  useEffect(() => {
    if (!state.playing) return;
    let last = null;
    const tick = (ts) => {
      if (last !== null) {
        const dt = (ts - last) / 1000;
        dispatch({ type:"SET_PLAYHEAD", t: state.playhead + dt });
      }
      last = ts;
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [state.playing]);

  // Stop at end
  useEffect(() => {
    if (state.playhead >= state.duration && state.playing) dispatch({ type:"SET_PLAYING", v:false });
  }, [state.playhead]);

  const togglePlay = () => dispatch({ type:"SET_PLAYING", v:!state.playing });

  const SPEEDS = [0.25, 0.5, 1, 1.5, 2];
  const [speed, setSpeed] = useState(1);

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", background:C.bg, overflow:"hidden" }}>
      {/* Aspect ratio selector */}
      <div style={{ ...s.flex("row","center","center",6), padding:"6px 12px", flexShrink:0 }}>
        {["16:9","9:16","1:1","4:5"].map(r => (
          <button key={r} onClick={() => setRatio(r)} style={{ ...s.btn(ratio===r), fontSize:10, padding:"3px 8px" }}>{r}</button>
        ))}
        <div style={{ flex:1 }} />
        <span style={{ color:C.textSec, fontSize:11, fontFamily:"JetBrains Mono, monospace" }}>{formatTime(state.playhead)}</span>
      </div>

      {/* Canvas area */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 16px", overflow:"hidden" }}>
        <div style={{ position:"relative", width:"100%", maxWidth: ratio==="9:16" ? 240 : "100%", maxHeight:"100%" }}>
          <div style={{ paddingTop: ratioMap[ratio] || "56.25%", background:"#000", borderRadius:8, overflow:"hidden", position:"relative", boxShadow:"0 8px 32px rgba(0,0,0,0.8)", border:`1px solid ${C.border}` }}>
            {currentClip?.url ? (
              <video ref={videoRef} src={currentClip.url} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"contain" }} />
            ) : (
              <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}>
                <Icon d={icons.film} size={40} color={C.textDim} />
                <span style={{ color:C.textDim, fontSize:12, fontFamily:"DM Sans, sans-serif" }}>No clip at playhead</span>
              </div>
            )}
            {/* Playhead overlay text */}
            <div style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.6)", padding:"2px 6px", borderRadius:4 }}>
              <span style={{ color:"#fff", fontSize:10, fontFamily:"JetBrains Mono, monospace" }}>{formatTime(state.playhead)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Playback controls */}
      <div style={{ ...s.flex("row","center","center",8), padding:"8px 16px", flexShrink:0, borderTop:`1px solid ${C.border}` }}>
        <button style={s.iconBtn()} onClick={() => dispatch({ type:"SET_PLAYHEAD", t:0 })} title="Go to start">
          <Icon d={icons.skipBack} size={16} />
        </button>
        <button style={s.iconBtn()} onClick={() => dispatch({ type:"SET_PLAYHEAD", t: Math.max(0, state.playhead - (1/30)) })} title="Step back">
          <Icon d={icons.stepBack} size={16} />
        </button>
        <button
          onClick={togglePlay}
          style={{ display:"flex", alignItems:"center", justifyContent:"center", width:36, height:36, borderRadius:"50%", background:C.accent, border:"none", cursor:"pointer", boxShadow:`0 0 12px ${C.accentDim}`, transition:"all 0.15s" }}
        >
          <Icon d={state.playing ? icons.pause : icons.play} size={16} color="#fff" fill="#fff" />
        </button>
        <button style={s.iconBtn()} onClick={() => dispatch({ type:"SET_PLAYHEAD", t: state.playhead + (1/30) })} title="Step forward">
          <Icon d={icons.stepFwd} size={16} />
        </button>
        <button style={s.iconBtn()} onClick={() => dispatch({ type:"SET_PLAYHEAD", t:state.duration })} title="Go to end">
          <Icon d={icons.skipFwd} size={16} />
        </button>

        <div style={{ width:1, height:20, background:C.border, margin:"0 4px" }} />

        {/* Speed */}
        <select value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ ...s.input, padding:"3px 6px", fontSize:11, cursor:"pointer" }}>
          {SPEEDS.map(sp => <option key={sp} value={sp}>{sp}x</option>)}
        </select>

        <div style={{ flex:1 }} />

        {/* Volume */}
        <div style={{ ...s.flex("row","center","flex-end",6), position:"relative" }}>
          <button style={s.iconBtn()} onClick={() => setShowVol(!showVol)}>
            <Icon d={volume === 0 ? icons.mute : icons.volume} size={14} />
          </button>
          {showVol && (
            <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(Number(e.target.value))} style={{ width:70, accentColor:C.accent }} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── RIGHT PANEL ──────────────────────────────────────────────────────────────
function RightPanel({ state, dispatch, width, onResize }) {
  const clip = state.tracks.flatMap(t => t.clips).find(c => c.id === state.selectedClipId);

  return (
    <div style={{ ...s.panel, borderRight:"none", borderLeft:`1px solid ${C.border}`, width, display:"flex", flexDirection:"column", overflow:"hidden", position:"relative" }}>
      <div style={{ ...s.flex("row","center","flex-start",0), padding:"8px 12px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        <span style={{ color:C.text, fontSize:12, fontWeight:600, fontFamily:"DM Sans, sans-serif" }}>Properties</span>
      </div>

      {clip ? (
        <div style={{ flex:1, overflowY:"auto", padding:12, display:"flex", flexDirection:"column", gap:12 }}>
          <PropSection title="Clip Info">
            <PropRow label="Name" value={clip.name.replace(/\.[^.]+$/, "")} />
            <PropRow label="Duration" value={formatTime(clip.duration)} />
            <PropRow label="Start" value={formatTime(clip.start)} />
          </PropSection>
          <PropSection title="Transform">
            <SliderProp label="Opacity" value={100} min={0} max={100} unit="%" />
            <SliderProp label="Scale" value={100} min={10} max={300} unit="%" />
            <SliderProp label="Rotation" value={0} min={-180} max={180} unit="°" />
          </PropSection>
          <PropSection title="Speed">
            <SliderProp label="Speed" value={100} min={10} max={1600} unit="%" />
          </PropSection>
          <PropSection title="Color">
            <SliderProp label="Brightness" value={0} min={-100} max={100} />
            <SliderProp label="Contrast" value={0} min={-100} max={100} />
            <SliderProp label="Saturation" value={0} min={-100} max={100} />
          </PropSection>
        </div>
      ) : (
        <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, color:C.textDim }}>
          <Icon d={icons.layers} size={28} color={C.textDim} />
          <span style={{ fontSize:11, fontFamily:"DM Sans, sans-serif", textAlign:"center", padding:"0 20px" }}>Select a clip to see its properties</span>
        </div>
      )}

      {/* Resize handle */}
      <div
        onMouseDown={onResize}
        style={{ position:"absolute", left:0, top:0, bottom:0, width:4, cursor:"col-resize", background:"transparent", zIndex:10 }}
        onMouseEnter={e => e.target.style.background=C.accent}
        onMouseLeave={e => e.target.style.background="transparent"}
      />
    </div>
  );
}

function PropSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button onClick={() => setOpen(!open)} style={{ ...s.flex("row","center","space-between",0), width:"100%", background:"transparent", border:"none", cursor:"pointer", marginBottom:8 }}>
        <span style={{ color:C.text, fontSize:11, fontWeight:600, fontFamily:"DM Sans, sans-serif" }}>{title}</span>
        <Icon d={open ? icons.chevDown : icons.chevRight} size={12} color={C.textSec} />
      </button>
      {open && <div style={{ display:"flex", flexDirection:"column", gap:6 }}>{children}</div>}
    </div>
  );
}

function PropRow({ label, value }) {
  return (
    <div style={{ ...s.flex("row","center","space-between",0) }}>
      <span style={{ color:C.textSec, fontSize:11, fontFamily:"DM Sans, sans-serif" }}>{label}</span>
      <span style={{ color:C.text, fontSize:11, fontFamily:"JetBrains Mono, monospace" }}>{value}</span>
    </div>
  );
}

function SliderProp({ label, value: initVal, min, max, unit="" }) {
  const [val, setVal] = useState(initVal);
  return (
    <div style={{ ...s.flex("row","center","space-between",8) }}>
      <span style={{ color:C.textSec, fontSize:10, fontFamily:"DM Sans, sans-serif", width:70, flexShrink:0 }}>{label}</span>
      <input type="range" min={min} max={max} value={val} onChange={e=>setVal(Number(e.target.value))} style={{ flex:1, accentColor:C.accent }} />
      <span style={{ color:C.text, fontSize:10, fontFamily:"JetBrains Mono, monospace", width:36, textAlign:"right" }}>{val}{unit}</span>
    </div>
  );
}

// ─── TIMELINE ─────────────────────────────────────────────────────────────────
const HEADER_W = 140;

function Timeline({ state, dispatch, height, onResize }) {
  const scrollRef = useRef();
  const [tool, setTool] = useState("select"); // select | razor
  const [dragInfo, setDragInfo] = useState(null);
  const [trimInfo, setTrimInfo] = useState(null);

  const timeToX = (t) => t * state.zoom;
  const xToTime = (x) => x / state.zoom;

  const totalWidth = Math.max(state.duration * state.zoom + 200, 800);

  // Playhead drag
  const handleRulerClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - HEADER_W + (scrollRef.current?.scrollLeft || 0);
    if (x < 0) return;
    dispatch({ type:"SET_PLAYHEAD", t: xToTime(x) });
  };

  // Clip drag
  const startClipDrag = (e, clipId, trackId, clipStart) => {
    if (tool === "razor") return;
    e.stopPropagation();
    dispatch({ type:"SELECT_CLIP", id:clipId });
    const startX = e.clientX;
    const startTime = clipStart;

    const onMove = (me) => {
      const dx = me.clientX - startX;
      const dt = xToTime(dx);
      let newStart = startTime + dt;
      if (state.snapping) newStart = snapTime(newStart, clipId);
      dispatch({ type:"MOVE_CLIP", id:clipId, start:newStart });
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const snapTime = (t, excludeId) => {
    const snapPts = [0, state.playhead, ...state.markers.map(m=>m.time)];
    state.tracks.forEach(tr => tr.clips.forEach(c => {
      if (c.id === excludeId) return;
      snapPts.push(c.start, c.start + c.duration);
    }));
    const threshold = 5 / state.zoom; // 5px snap
    for (const sp of snapPts) {
      if (Math.abs(t - sp) < threshold) return sp;
    }
    return t;
  };

  // Trim drag
  const startTrim = (e, clipId, side) => {
    e.stopPropagation();
    const startX = e.clientX;
    const track = state.tracks.find(t => t.clips.some(c => c.id === clipId));
    const clip = track?.clips.find(c => c.id === clipId);
    if (!clip) return;

    const origStart = clip.start, origDur = clip.duration, origIn = clip.inPoint || 0;
    const onMove = (me) => {
      const dx = me.clientX - startX;
      const dt = xToTime(dx);
      if (side === "left") {
        const newStart = clamp(origStart + dt, 0, origStart + origDur - 0.2);
        const newDur = origDur - (newStart - origStart);
        const newIn = origIn + (newStart - origStart);
        dispatch({ type:"TRIM_CLIP", id:clipId, changes:{ start:newStart, duration:newDur, inPoint:newIn } });
      } else {
        const newDur = clamp(origDur + dt, 0.2, 999);
        dispatch({ type:"TRIM_CLIP", id:clipId, changes:{ duration:newDur } });
      }
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Drop from media bin
  const handleTrackDrop = (e, trackId) => {
    e.preventDefault();
    const mediaId = e.dataTransfer.getData("mediaId");
    if (!mediaId) return;
    const item = state.mediaItems.find(m => m.id === mediaId);
    if (!item) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + (scrollRef.current?.scrollLeft || 0);
    let start = xToTime(x);
    if (state.snapping) start = snapTime(start, null);
    dispatch({
      type:"ADD_CLIP", trackId,
      clip:{ id:uid(), mediaId:item.id, name:item.name, start:Math.max(0,start), duration:item.duration||5, inPoint:0, url:item.url, kind:item.kind, thumbnail:item.thumbnail }
    });
  };

  // Razor click
  const handleClipClick = (e, clipId) => {
    if (tool === "razor") {
      dispatch({ type:"SPLIT_CLIP", id:clipId });
    } else {
      dispatch({ type:"SELECT_CLIP", id:clipId });
    }
  };

  const TOOLS = [
    { id:"select", icon:"M3 3l7 18 3-7 7-3-17-8z", label:"Select (V)" },
    { id:"razor", icon:icons.scissors, label:"Razor/Split (C)" },
  ];

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === " ") { e.preventDefault(); dispatch({ type:"SET_PLAYING", v:!state.playing }); }
      if (e.key === "ArrowLeft") dispatch({ type:"SET_PLAYHEAD", t: state.playhead - (e.shiftKey ? 1 : 1/30) });
      if (e.key === "ArrowRight") dispatch({ type:"SET_PLAYHEAD", t: state.playhead + (e.shiftKey ? 1 : 1/30) });
      if (e.key === "Home") dispatch({ type:"SET_PLAYHEAD", t:0 });
      if (e.key === "End") dispatch({ type:"SET_PLAYHEAD", t:state.duration });
      if ((e.key === "Delete" || e.key === "Backspace") && state.selectedClipId) dispatch({ type:"DELETE_CLIP", id:state.selectedClipId });
      if (e.key === "s" || e.key === "S") { if (state.selectedClipId) dispatch({ type:"SPLIT_CLIP", id:state.selectedClipId }); }
      if (e.key === "v" || e.key === "V") setTool("select");
      if (e.key === "c" || e.key === "C") setTool("razor");
      if (e.key === "m" || e.key === "M") dispatch({ type:"ADD_MARKER" });
      if (e.key === "n" || e.key === "N") dispatch({ type:"TOGGLE_SNAP" });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.playing, state.playhead, state.selectedClipId, state.duration]);

  const playheadX = timeToX(state.playhead) + HEADER_W;

  return (
    <div style={{ background:C.panel, borderTop:`1px solid ${C.border}`, display:"flex", flexDirection:"column", height, flexShrink:0, position:"relative", overflow:"hidden" }}>
      {/* Resize handle */}
      <div onMouseDown={onResize} style={{ position:"absolute", top:0, left:0, right:0, height:4, cursor:"row-resize", background:"transparent", zIndex:10 }}
        onMouseEnter={e=>e.target.style.background=C.accent} onMouseLeave={e=>e.target.style.background="transparent"} />

      {/* Toolbar */}
      <div style={{ ...s.flex("row","center","flex-start",6), padding:"4px 10px", borderBottom:`1px solid ${C.border}`, flexShrink:0 }}>
        {/* Tools */}
        {TOOLS.map(t => (
          <button key={t.id} title={t.label} onClick={() => setTool(t.id)} style={s.iconBtn(tool===t.id)}>
            <Icon d={t.icon} size={14} color={tool===t.id ? C.accent : C.textSec} />
          </button>
        ))}
        <div style={{ width:1, height:18, background:C.border }} />

        {/* Add track */}
        <button style={{ ...s.btn(), gap:4, fontSize:10 }} onClick={() => dispatch({ type:"ADD_TRACK", track:{ id:uid(), type:"video", name:`Video ${state.tracks.filter(t=>t.type==="video").length+1}`, muted:false, locked:false, clips:[] } })}>
          <Icon d={icons.plus} size={12} /> Track
        </button>

        {/* Zoom */}
        <button style={s.iconBtn()} onClick={() => dispatch({ type:"SET_ZOOM", v:state.zoom*1.5 })} title="Zoom In">
          <Icon d={icons.zoomIn} size={14} />
        </button>
        <button style={s.iconBtn()} onClick={() => dispatch({ type:"SET_ZOOM", v:state.zoom/1.5 })} title="Zoom Out">
          <Icon d={icons.zoomOut} size={14} />
        </button>
        <button style={{ ...s.btn(), fontSize:10, padding:"3px 8px" }} onClick={() => dispatch({ type:"SET_ZOOM", v:60 })}>Fit</button>

        {/* Snap */}
        <button style={s.iconBtn(state.snapping)} onClick={() => dispatch({ type:"TOGGLE_SNAP" })} title="Snapping (N)">
          <Icon d={icons.magnet} size={14} color={state.snapping ? C.accent : C.textSec} />
        </button>

        {/* Marker */}
        <button style={s.iconBtn()} onClick={() => dispatch({ type:"ADD_MARKER" })} title="Add Marker (M)">
          <Icon d={icons.marker} size={14} />
        </button>

        <div style={{ flex:1 }} />
        <span style={{ color:C.textSec, fontSize:10, fontFamily:"JetBrains Mono, monospace" }}>
          {formatTime(state.duration)} total
        </span>
      </div>

      {/* Timeline body */}
      <div ref={scrollRef} style={{ flex:1, overflowX:"auto", overflowY:"auto", position:"relative" }}>
        <div style={{ minWidth: totalWidth + HEADER_W, position:"relative" }}>

          {/* Time ruler */}
          <div onClick={handleRulerClick} style={{ height:24, background:C.surface, borderBottom:`1px solid ${C.border}`, position:"sticky", top:0, zIndex:20, cursor:"crosshair", display:"flex" }}>
            <div style={{ width:HEADER_W, flexShrink:0, borderRight:`1px solid ${C.border}`, background:C.surface }} />
            <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
              {/* Ruler ticks */}
              {Array.from({ length: Math.ceil(state.duration) + 1 }).map((_, i) => {
                const x = i * state.zoom;
                const showLabel = state.zoom >= 30 ? true : i % Math.max(1, Math.round(5/state.zoom*10)) === 0;
                return showLabel ? (
                  <div key={i} style={{ position:"absolute", left:x, top:0, bottom:0, borderLeft:`1px solid ${C.border}`, paddingLeft:3 }}>
                    <span style={{ color:C.textSec, fontSize:9, fontFamily:"JetBrains Mono, monospace", userSelect:"none" }}>{formatTime(i)}</span>
                  </div>
                ) : null;
              })}
              {/* Markers */}
              {state.markers.map(mk => (
                <div key={mk.id} style={{ position:"absolute", left:timeToX(mk.time), top:0, bottom:0, borderLeft:`1px solid ${C.yellow}`, pointerEvents:"none" }}>
                  <div style={{ background:C.yellow, padding:"0 3px", borderRadius:"0 2px 2px 0", position:"absolute", top:3 }}>
                    <span style={{ color:"#000", fontSize:8, fontFamily:"DM Sans, sans-serif" }}>{mk.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Playhead line */}
          <div style={{ position:"absolute", left:playheadX, top:0, bottom:0, width:1.5, background:C.accent, zIndex:30, pointerEvents:"none" }}>
            <div style={{ position:"absolute", top:0, left:-6, width:13, height:13, clipPath:"polygon(50% 100%,0 0,100% 0)", background:C.accent }} />
          </div>

          {/* Tracks */}
          {state.tracks.map((track, ti) => (
            <TrackRow
              key={track.id}
              track={track}
              state={state}
              dispatch={dispatch}
              timeToX={timeToX}
              tool={tool}
              onClipDragStart={startClipDrag}
              onTrimStart={startTrim}
              onClipClick={handleClipClick}
              onTrackDrop={handleTrackDrop}
            />
          ))}

          {/* Empty track drop zone */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              const mediaId = e.dataTransfer.getData("mediaId");
              if (!mediaId) return;
              const item = state.mediaItems.find(m => m.id === mediaId);
              if (!item) return;
              const trackType = item.kind === "audio" ? "audio" : "video";
              const newTrack = { id:uid(), type:trackType, name:`${trackType === "video" ? "Video" : "Audio"} ${state.tracks.filter(t=>t.type===trackType).length+1}`, muted:false, locked:false, clips:[] };
              dispatch({ type:"ADD_TRACK", track:newTrack });
              setTimeout(() => {
                dispatch({ type:"ADD_CLIP", trackId:newTrack.id, clip:{ id:uid(), mediaId:item.id, name:item.name, start:0, duration:item.duration||5, inPoint:0, url:item.url, kind:item.kind, thumbnail:item.thumbnail } });
              }, 10);
            }}
            style={{ height:36, display:"flex", alignItems:"center", paddingLeft:HEADER_W+10, color:C.textDim, fontSize:11, fontFamily:"DM Sans, sans-serif", borderTop:`1px dashed ${C.border}` }}
          >
            + Drop media here to add a new track
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackRow({ track, state, dispatch, timeToX, tool, onClipDragStart, onTrimStart, onClipClick, onTrackDrop }) {
  const [dropOver, setDropOver] = useState(false);
  const trackColor = track.type === "audio" ? C.green : C.accent;

  return (
    <div style={{ height:C.trackH, display:"flex", borderBottom:`1px solid ${C.border}`, background: dropOver ? "rgba(79,142,247,0.05)" : "transparent" }}>
      {/* Track header */}
      <div style={{ width:HEADER_W, flexShrink:0, borderRight:`1px solid ${C.border}`, background:C.panel, display:"flex", alignItems:"center", padding:"0 8px", gap:6 }}>
        <div style={{ width:3, height:24, borderRadius:2, background:trackColor, flexShrink:0 }} />
        <span style={{ color:C.text, fontSize:11, fontFamily:"DM Sans, sans-serif", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{track.name}</span>
        <div style={{ ...s.flex("row","center","flex-end",2), flexShrink:0 }}>
          <button style={s.iconBtn(track.muted)} onClick={() => dispatch({ type:"TOGGLE_MUTE", id:track.id })} title="Mute">
            <Icon d={track.muted ? icons.mute : icons.volume} size={11} color={track.muted ? C.yellow : C.textSec} />
          </button>
          <button style={s.iconBtn(track.locked)} onClick={() => dispatch({ type:"TOGGLE_LOCK", id:track.id })} title="Lock">
            <Icon d={icons.lock} size={11} color={track.locked ? C.red : C.textSec} />
          </button>
        </div>
      </div>

      {/* Track clips area */}
      <div
        style={{ flex:1, position:"relative", overflow:"visible" }}
        onDragOver={e => { e.preventDefault(); setDropOver(true); }}
        onDragLeave={() => setDropOver(false)}
        onDrop={e => { setDropOver(false); onTrackDrop(e, track.id); }}
        onClick={e => { if (e.target === e.currentTarget) dispatch({ type:"SELECT_CLIP", id:null }); }}
      >
        {track.clips.map(clip => (
          <ClipBlock
            key={clip.id}
            clip={clip}
            track={track}
            selected={state.selectedClipId === clip.id}
            timeToX={timeToX}
            tool={tool}
            onDragStart={onClipDragStart}
            onTrimStart={onTrimStart}
            onClick={onClipClick}
          />
        ))}
      </div>
    </div>
  );
}

function ClipBlock({ clip, track, selected, timeToX, tool, onDragStart, onTrimStart, onClick }) {
  const x = timeToX(clip.start);
  const w = Math.max(timeToX(clip.duration), 4);
  const isAudio = track.type === "audio";
  const bgColor = isAudio ? C.clipAudio : C.clipVideo;
  const borderColor = isAudio ? C.green : C.accent;

  return (
    <div
      onMouseDown={e => onDragStart(e, clip.id, track.id, clip.start)}
      onClick={e => { e.stopPropagation(); onClick(e, clip.id); }}
      style={{
        position:"absolute", left:x, top:4, height:C.trackH - 8, width:w,
        background: bgColor, borderRadius:6,
        border:`1.5px solid ${selected ? borderColor : isAudio ? "#234A32" : "#1E3E6A"}`,
        boxShadow: selected ? `0 0 0 1.5px ${borderColor}` : "none",
        cursor: tool === "razor" ? "crosshair" : "grab",
        overflow:"hidden", userSelect:"none",
        transition:"box-shadow 0.1s",
        display:"flex", flexDirection:"column", justifyContent:"center",
      }}
    >
      {/* Thumbnail strip */}
      {clip.thumbnail && (
        <div style={{ position:"absolute", inset:0, backgroundImage:`url(${clip.thumbnail})`, backgroundSize:"cover", backgroundPosition:"center", opacity:0.3 }} />
      )}
      {/* Label */}
      <div style={{ position:"relative", zIndex:1, padding:"0 6px" }}>
        <span style={{ color:"#fff", fontSize:10, fontFamily:"DM Sans, sans-serif", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", display:"block", textShadow:"0 1px 2px rgba(0,0,0,0.8)" }}>
          {clip.name.replace(/\.[^.]+$/, "")}
        </span>
        <span style={{ color:"rgba(255,255,255,0.5)", fontSize:9, fontFamily:"JetBrains Mono, monospace" }}>{formatTime(clip.duration)}</span>
      </div>
      {/* Trim handles */}
      <div onMouseDown={e => { e.stopPropagation(); onTrimStart(e, clip.id, "left"); }} style={{ position:"absolute", left:0, top:0, bottom:0, width:6, cursor:"ew-resize", background:"rgba(255,255,255,0.1)", borderRadius:"4px 0 0 4px", zIndex:5 }} />
      <div onMouseDown={e => { e.stopPropagation(); onTrimStart(e, clip.id, "right"); }} style={{ position:"absolute", right:0, top:0, bottom:0, width:6, cursor:"ew-resize", background:"rgba(255,255,255,0.1)", borderRadius:"0 4px 4px 0", zIndex:5 }} />
    </div>
  );
}

// ─── STATUS BAR ───────────────────────────────────────────────────────────────
function StatusBar({ state }) {
  return (
    <div style={{ ...s.flex("row","center","space-between",12), height:22, padding:"0 12px", background:C.bg, borderTop:`1px solid ${C.border}`, flexShrink:0 }}>
      <span style={{ color:C.textDim, fontSize:9, fontFamily:"DM Sans, sans-serif" }}>
        {state.mediaItems.length} media item{state.mediaItems.length !== 1 ? "s" : ""} &nbsp;·&nbsp; {state.tracks.flatMap(t=>t.clips).length} clip{state.tracks.flatMap(t=>t.clips).length !== 1 ? "s" : ""} &nbsp;·&nbsp; {state.tracks.length} track{state.tracks.length !== 1 ? "s" : ""}
      </span>
      <span style={{ color:C.textDim, fontSize:9, fontFamily:"JetBrains Mono, monospace" }}>
        Zoom: {Math.round(state.zoom)}px/s &nbsp;·&nbsp; Snap: {state.snapping ? "ON" : "OFF"} &nbsp;·&nbsp; Press ? for shortcuts
      </span>
    </div>
  );
}

// ─── SHORTCUTS OVERLAY ────────────────────────────────────────────────────────
function ShortcutsOverlay({ onClose }) {
  const shortcuts = [
    ["Space","Play / Pause"],["J / K / L","Rev / Stop / Fwd"],
    ["← / →","Step 1 Frame"],["Shift+← / →","Step 1 Second"],
    ["Home / End","Go to Start / End"],["S","Split clip at playhead"],
    ["Delete","Delete selected clip"],["V","Select tool"],
    ["C","Razor tool"],["M","Add marker"],
    ["N","Toggle snapping"],["Ctrl+S","Save project"],
  ];
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:999, display:"flex", alignItems:"center", justifyContent:"center" }} onClick={onClose}>
      <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:14, padding:28, minWidth:420, maxWidth:500 }} onClick={e=>e.stopPropagation()}>
        <div style={{ ...s.flex("row","center","space-between",0), marginBottom:18 }}>
          <span style={{ color:C.text, fontSize:15, fontWeight:700, fontFamily:"DM Sans, sans-serif" }}>Keyboard Shortcuts</span>
          <button onClick={onClose} style={{ ...s.iconBtn() }}><Icon d={icons.close} size={14} /></button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px 24px" }}>
          {shortcuts.map(([key, desc]) => (
            <div key={key} style={{ ...s.flex("row","center","flex-start",10) }}>
              <kbd style={{ background:C.panel, border:`1px solid ${C.border}`, borderRadius:4, padding:"2px 6px", color:C.accent, fontSize:10, fontFamily:"JetBrains Mono, monospace", flexShrink:0 }}>{key}</kbd>
              <span style={{ color:C.textSec, fontSize:11, fontFamily:"DM Sans, sans-serif" }}>{desc}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop:18, color:C.textDim, fontSize:10, fontFamily:"DM Sans, sans-serif", textAlign:"center" }}>Press ? or Esc to close</div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [state, dispatch] = useReducer(reducer, initState);
  const [leftW, setLeftW] = useState(220);
  const [rightW, setRightW] = useState(220);
  const [timelineH, setTimelineH] = useState(220);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const containerRef = useRef();

  // Panel resize handlers
  const makeHResize = (setter, minW, maxW, side) => (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = side === "left" ? leftW : rightW;
    const onMove = (me) => {
      const dx = side === "left" ? me.clientX - startX : startX - me.clientX;
      setter(clamp(startW + dx, minW, maxW));
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const makeVResize = (e) => {
    e.preventDefault();
    const startY = e.clientY;
    const startH = timelineH;
    const containerH = containerRef.current?.clientHeight || 600;
    const onMove = (me) => {
      const dy = startY - me.clientY;
      setTimelineH(clamp(startH + dy, 120, containerH - 200));
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // Shortcuts key
  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "?") setShowShortcuts(s => !s);
      if (e.key === "Escape") setShowShortcuts(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <div style={{ width:"100%", height:"100vh", background:C.bg, display:"flex", flexDirection:"column", fontFamily:"DM Sans, sans-serif", overflow:"hidden", color:C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: ${C.panel}; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${C.borderHover}; }
        input[type=range] { appearance: none; height: 4px; border-radius: 2px; background: ${C.border}; cursor: pointer; }
        input[type=range]::-webkit-slider-thumb { appearance: none; width: 12px; height: 12px; border-radius: 50%; background: ${C.accent}; }
        select { outline: none; }
        button:hover { filter: brightness(1.1); }
      `}</style>

      <TopBar state={state} dispatch={dispatch} />

      {/* Middle row */}
      <div ref={containerRef} style={{ flex:1, display:"flex", overflow:"hidden", minHeight:0 }}>
        <LeftPanel state={state} dispatch={dispatch} width={leftW} onResize={makeHResize(setLeftW, 160, 360, "left")} />
        <PreviewPlayer state={state} dispatch={dispatch} />
        <RightPanel state={state} dispatch={dispatch} width={rightW} onResize={makeHResize(setRightW, 160, 360, "right")} />
      </div>

      <Timeline state={state} dispatch={dispatch} height={timelineH} onResize={makeVResize} />
      <StatusBar state={state} />

      {showShortcuts && <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}
