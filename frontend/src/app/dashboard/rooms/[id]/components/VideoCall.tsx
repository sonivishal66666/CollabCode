'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, Users, Volume2, User
} from 'lucide-react';
import { useEditorStore } from '@/stores/editorStore';
import { useAuth } from '@/hooks/useAuth';
import { audio } from '@/lib/audio';
import type { WSMessage } from '@/types';

interface PeerConnectionWrapper {
  userId: string;
  displayName: string;
  connection: RTCPeerConnection;
  stream?: MediaStream;
  pendingCandidates?: RTCIceCandidateInit[];
}

interface VideoCallProps {
  sendMessage: (msg: WSMessage) => void;
}

export function VideoCall({ sendMessage }: VideoCallProps) {
  const { showVideoCall, setShowVideoCall, onlineUsers } = useEditorStore();
  const { user: currentUser } = useAuth();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [activePeers, setActivePeers] = useState<PeerConnectionWrapper[]>([]);
  const [speakingUsers, setSpeakingUsers] = useState<Record<string, boolean>>({});

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnections = useRef<Record<string, PeerConnectionWrapper>>({});
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioAnalysers = useRef<Record<string, { analyser: AnalyserNode; interval: ReturnType<typeof setInterval> }>>({});

  // STUN config for ICE negotiation
  const rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // 1. Join / Leave voice & video session
  useEffect(() => {
    if (showVideoCall) {
      audio.playPop();
      initLocalMedia();
    } else {
      cleanupCallState();
    }

    return () => {
      cleanupCallState();
    };
  }, [showVideoCall]);

  // Sync tracks when local media stream becomes available
  useEffect(() => {
    if (localStream) {
      Object.values(peerConnections.current).forEach((wrapper) => {
        const pc = wrapper.connection;
        const senders = pc.getSenders();
        localStream.getTracks().forEach((track) => {
          const alreadyAdded = senders.some((s) => s.track === track);
          if (!alreadyAdded) {
            pc.addTrack(track, localStream);
          }
        });
      });
    }
  }, [localStream]);

  const initLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize Web Audio voice volume detector for self
      setupVolumeDetector('self', stream);

      // Signal the room that we are ready to exchange streams
      sendMessage({
        type: 'webrtc:signal',
        payload: {
          action: 'ready',
          sender_user_id: currentUser?.id,
          sender_display_name: currentUser?.display_name
        }
      });
    } catch (err) {
      console.warn('Failed to fetch camera and audio tracks. Re-trying with audio only...', err);
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true
        });
        setLocalStream(audioOnlyStream);
        localStreamRef.current = audioOnlyStream;
        setVideoEnabled(false);
        setupVolumeDetector('self', audioOnlyStream);

        sendMessage({
          type: 'webrtc:signal',
          payload: {
            action: 'ready',
            sender_user_id: currentUser?.id,
            sender_display_name: currentUser?.display_name
          }
        });
      } catch (audioErr) {
        console.error('Failed to grab any local audio or video stream', audioErr);
        audio.playAlert();
        setShowVideoCall(false);
      }
    }
  };

  const cleanupCallState = () => {
    // Stop all media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);

    // Close peer connections
    Object.values(peerConnections.current).forEach((wrapper) => {
      wrapper.connection.close();
    });
    peerConnections.current = {};
    setActivePeers([]);

    // Clear speaking analyzers
    Object.values(audioAnalysers.current).forEach((obj) => {
      clearInterval(obj.interval);
    });
    audioAnalysers.current = {};
    setSpeakingUsers({});
  };

  // 2. Setup Web Audio speak detection
  const setupVolumeDetector = (userId: string, stream: MediaStream) => {
    // Clean old analyzer if any
    if (audioAnalysers.current[userId]) {
      clearInterval(audioAnalysers.current[userId].interval);
      delete audioAnalysers.current[userId];
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const interval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        let total = 0;
        for (let i = 0; i < bufferLength; i++) {
          total += dataArray[i];
        }
        const avg = total / bufferLength;
        const isSpeaking = avg > 12; // Adjusted threshold for sensitivity
        setSpeakingUsers((prev) => {
          if (prev[userId] === isSpeaking) return prev;
          return { ...prev, [userId]: isSpeaking };
        });
      }, 200);

      audioAnalysers.current[userId] = { analyser, interval };
    } catch (e) {
      console.warn('Could not launch Web Audio Analyser for stream', e);
    }
  };

  // 3. Initiate RTCPeerConnection to a specific remote peer
  const getOrCreatePeerConnection = (remoteUserId: string, remoteName: string): RTCPeerConnection => {
    if (peerConnections.current[remoteUserId]) {
      return peerConnections.current[remoteUserId].connection;
    }

    const pc = new RTCPeerConnection(rtcConfig);

    // Track negotiation needed to trigger offers on track updates
    pc.onnegotiationneeded = async () => {
      try {
        if (pc.signalingState !== 'stable') return;
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        sendMessage({
          type: 'webrtc:signal',
          payload: {
            action: 'offer',
            target_user_id: remoteUserId,
            sender_user_id: currentUser?.id,
            sender_display_name: currentUser?.display_name,
            sdp: offer
          }
        });
      } catch (err) {
        console.error('Error during onnegotiationneeded:', err);
      }
    };

    // Track candidates and send them
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendMessage({
          type: 'webrtc:signal',
          payload: {
            action: 'candidate',
            target_user_id: remoteUserId,
            sender_user_id: currentUser?.id,
            candidate: event.candidate
          }
        });
      }
    };

    // Receive incoming tracks
    pc.ontrack = (event) => {
      const remoteWrapper = peerConnections.current[remoteUserId];
      if (!remoteWrapper) return;

      let stream = remoteWrapper.stream;
      if (!stream) {
        stream = event.streams[0] || new MediaStream();
        remoteWrapper.stream = stream;
      }

      const track = event.track;
      if (!stream.getTracks().some((t) => t.id === track.id)) {
        stream.addTrack(track);
      }

      setActivePeers(Object.values(peerConnections.current).map((p) => ({ ...p })));
      setupVolumeDetector(remoteUserId, stream);
    };

    // Attach local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    peerConnections.current[remoteUserId] = {
      userId: remoteUserId,
      displayName: remoteName,
      connection: pc,
      pendingCandidates: []
    };

    setActivePeers(Object.values(peerConnections.current).map((p) => ({ ...p })));
    return pc;
  };

  // 4. WebSocket signaling router
  useEffect(() => {
    const handleSignalEvent = async (e: Event) => {
      const customEvent = e as CustomEvent<WSMessage>;
      if (customEvent.detail.type !== 'webrtc:signal') return;

      const payload = customEvent.detail.payload as {
        action: 'ready' | 'offer' | 'answer' | 'candidate';
        target_user_id?: string;
        sender_user_id: string;
        sender_display_name?: string;
        sdp?: RTCSessionDescriptionInit;
        candidate?: RTCIceCandidateInit;
      };

      const { action, sender_user_id, sender_display_name, sdp, candidate, target_user_id } = payload;

      // Ignore signals from self
      if (sender_user_id === currentUser?.id) return;

      // Filter targeted signals
      if (action !== 'ready' && target_user_id !== currentUser?.id) return;

      const remoteName = sender_display_name || onlineUsers.get(sender_user_id)?.display_name || 'Collaborator';

      try {
        if (action === 'ready') {
          // A peer just joined. Initiate connection by sending offer.
          const pc = getOrCreatePeerConnection(sender_user_id, remoteName);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          sendMessage({
            type: 'webrtc:signal',
            payload: {
              action: 'offer',
              target_user_id: sender_user_id,
              sender_user_id: currentUser?.id,
              sender_display_name: currentUser?.display_name,
              sdp: offer
            }
          });
        } else if (action === 'offer' && sdp) {
          // Received offer from peer. Answer it.
          const pc = getOrCreatePeerConnection(sender_user_id, remoteName);
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          sendMessage({
            type: 'webrtc:signal',
            payload: {
              action: 'answer',
              target_user_id: sender_user_id,
              sender_user_id: currentUser?.id,
              sender_display_name: currentUser?.display_name,
              sdp: answer
            }
          });

          // Process any queued ICE candidates
          const wrapper = peerConnections.current[sender_user_id];
          if (wrapper && wrapper.pendingCandidates && wrapper.pendingCandidates.length > 0) {
            for (const cand of wrapper.pendingCandidates) {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            }
            wrapper.pendingCandidates = [];
          }
        } else if (action === 'answer' && sdp) {
          // Received answer. Complete negotiation.
          const wrapper = peerConnections.current[sender_user_id];
          if (wrapper) {
            const pc = wrapper.connection;
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));

            // Process any queued ICE candidates
            if (wrapper.pendingCandidates && wrapper.pendingCandidates.length > 0) {
              for (const cand of wrapper.pendingCandidates) {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              }
              wrapper.pendingCandidates = [];
            }
          }
        } else if (action === 'candidate' && candidate) {
          // Received ICE candidate. Add it or queue it.
          const wrapper = peerConnections.current[sender_user_id];
          if (wrapper) {
            const pc = wrapper.connection;
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
              if (!wrapper.pendingCandidates) {
                wrapper.pendingCandidates = [];
              }
              wrapper.pendingCandidates.push(candidate);
            }
          }
        }
      } catch (err) {
        console.error('WebRTC negotiation exception:', err);
      }
    };

    window.addEventListener('ws:webrtc:signal', handleSignalEvent);
    return () => window.removeEventListener('ws:webrtc:signal', handleSignalEvent);
  }, [localStream, currentUser, onlineUsers]);

  // Toggle local streams
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const active = !videoEnabled;
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = active;
      });
      setVideoEnabled(active);
      audio.playClick();
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const active = !audioEnabled;
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = active;
      });
      setAudioEnabled(active);
      audio.playClick();
    }
  };

  if (!showVideoCall) return null;

  return (
    <div className="fixed bottom-20 max-md:bottom-24 max-md:left-4 max-md:right-4 md:bottom-16 md:right-4 z-40 w-auto md:w-72 glass-panel neon-glow rounded-xl flex flex-col overflow-hidden border border-border-default bg-bg-glass backdrop-blur-xl">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border-default bg-bg-secondary/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-accent-cyan animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-primary">Voice & Video Room</span>
        </div>
        <span className="text-[10px] font-bold bg-accent-cyan/10 text-accent-cyan px-1.5 py-0.5 rounded font-mono">
          {activePeers.length + 1} ON
        </span>
      </div>

      {/* Video Streams Grid */}
      <div className="p-3 grid grid-cols-2 md:grid-cols-1 gap-2 max-h-[30vh] md:max-h-[300px] overflow-y-auto no-scrollbar bg-bg-primary/20">
        {/* Local video card */}
        <div className={`relative h-24 md:h-32 rounded-lg bg-bg-tertiary border transition-all overflow-hidden flex items-center justify-center ${
          speakingUsers['self'] ? 'border-accent-emerald shadow-[0_0_12px_rgba(52,211,153,0.4)] scale-[0.98]' : 'border-border-default'
        }`}>
          {videoEnabled && localStream ? (
            <video
              ref={(video) => {
                if (video && localStream && video.srcObject !== localStream) {
                  video.srcObject = localStream;
                }
              }}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover rounded-lg scale-x-[-1]"
            />
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-text-muted select-none">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 text-[10px] font-bold text-text-secondary">
                {currentUser?.display_name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-[10px] font-semibold">{currentUser?.display_name} (You)</span>
            </div>
          )}
          {/* Label overlays */}
          <div className="absolute bottom-1.5 left-1.5 bg-black/50 text-[10px] px-1.5 py-0.5 rounded text-white font-medium select-none">
            You
          </div>
          <div className="absolute top-1.5 right-1.5 flex gap-1">
            {!audioEnabled && (
              <span className="p-1 rounded bg-accent-rose/20 text-accent-rose">
                <MicOff className="w-2.5 h-2.5" />
              </span>
            )}
          </div>
        </div>

        {/* Remote videos */}
        {activePeers.map((peer) => {
          const isSpeaking = speakingUsers[peer.userId];
          return (
            <div
              key={peer.userId}
              className={`relative h-24 md:h-32 rounded-lg bg-bg-tertiary border transition-all overflow-hidden flex items-center justify-center ${
                isSpeaking ? 'border-accent-cyan shadow-[0_0_12px_rgba(34,211,238,0.4)] scale-[0.98]' : 'border-border-default'
              }`}
            >
              {peer.stream && peer.stream.getVideoTracks().some(t => t.enabled) ? (
                <video
                  autoPlay
                  playsInline
                  ref={(video) => {
                    if (video && video.srcObject !== peer.stream) {
                      video.srcObject = peer.stream || null;
                    }
                  }}
                  className="absolute inset-0 w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-text-muted select-none">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5 text-[10px] font-bold text-text-secondary">
                    {peer.displayName?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[10px] font-semibold">{peer.displayName}</span>
                </div>
              )}
              {/* Remote labels */}
              <div className="absolute bottom-1.5 left-1.5 bg-black/50 text-[10px] px-1.5 py-0.5 rounded text-white font-medium select-none">
                {peer.displayName}
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar actions footer */}
      <div className="p-2.5 border-t border-border-default bg-bg-secondary/60 flex items-center justify-center gap-3">
        <button
          onClick={toggleAudio}
          className={`p-2 rounded-lg border transition-all ${
            audioEnabled
              ? 'bg-bg-tertiary text-text-primary hover:bg-white/5 border-border-default'
              : 'bg-accent-rose/10 border-accent-rose/25 text-accent-rose'
          }`}
          title={audioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {audioEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={toggleVideo}
          className={`p-2 rounded-lg border transition-all ${
            videoEnabled
              ? 'bg-bg-tertiary text-text-primary hover:bg-white/5 border-border-default'
              : 'bg-accent-rose/10 border-accent-rose/25 text-accent-rose'
          }`}
          title={videoEnabled ? 'Disable Camera' : 'Enable Camera'}
        >
          {videoEnabled ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={() => { setShowVideoCall(false); audio.playPop(); }}
          className="p-2 rounded-lg bg-accent-rose hover:bg-accent-rose/90 border border-transparent text-white transition-all font-semibold"
          title="Disconnect from session"
        >
          <PhoneOff className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
