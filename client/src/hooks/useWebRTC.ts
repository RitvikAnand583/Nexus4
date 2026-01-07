import { useRef, useCallback, useState, useEffect } from 'react';

interface UseWebRTCOptions {
    onRemoteStream?: (stream: MediaStream) => void;
    sendSignal: (type: string, data: any) => void;
}

interface RTCSignal {
    type: 'rtc_offer' | 'rtc_answer' | 'rtc_ice_candidate';
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
}

const ICE_SERVERS: RTCConfiguration = {
    iceServers: [

        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },

        {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
        {
            urls: 'turn:openrelay.metered.ca:443?transport=tcp',
            username: 'openrelayproject',
            credential: 'openrelayproject',
        },
    ],
    iceCandidatePoolSize: 10,
};

export function useWebRTC({ onRemoteStream, sendSignal }: UseWebRTCOptions) {
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);

    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        const audio = document.createElement('audio');
        audio.autoplay = true;
        audio.setAttribute('playsinline', 'true');
        audio.style.display = 'none';
        document.body.appendChild(audio);
        remoteAudioRef.current = audio;

        return () => {
            audio.pause();
            audio.srcObject = null;
            document.body.removeChild(audio);
        };
    }, []);


    const getLocalStream = useCallback(async () => {
        try {
            console.log('🎤 Requesting microphone access...');
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    // High quality settings
                    sampleRate: 48000,
                    sampleSize: 16,
                    channelCount: 1, // Mono is better for voice
                },
                video: false
            });
            console.log('🎤 Microphone access granted!');
            localStreamRef.current = stream;
            return stream;
        } catch (err) {
            console.error('❌ Failed to get microphone:', err);
            setError('Microphone access denied');
            return null;
        }
    }, []);

    // Create peer connection
    const createPeerConnection = useCallback(() => {
        console.log('📡 Creating peer connection...');
        const pc = new RTCPeerConnection(ICE_SERVERS);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('🧊 Sending ICE candidate');
                sendSignal('rtc_ice_candidate', { candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            console.log('🔊 Received remote audio track!');
            if (remoteAudioRef.current && event.streams[0]) {
                remoteAudioRef.current.srcObject = event.streams[0];
                // Try to play (may need user interaction)
                remoteAudioRef.current.play().catch(err => {
                    console.warn('⚠️ Audio autoplay blocked:', err);
                });
                onRemoteStream?.(event.streams[0]);
            }
        };

        pc.onconnectionstatechange = () => {
            console.log('📶 Connection state:', pc.connectionState);
            if (pc.connectionState === 'connected') {
                console.log('✅ WebRTC connected!');
                setIsConnected(true);
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                console.log('❌ WebRTC disconnected');
                setIsConnected(false);
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log('🧊 ICE state:', pc.iceConnectionState);
        };

        peerConnectionRef.current = pc;
        return pc;
    }, [sendSignal, onRemoteStream]);

    // Start call (caller side)
    const startCall = useCallback(async () => {
        try {
            setError(null);
            const stream = await getLocalStream();
            if (!stream) return;

            const pc = createPeerConnection();

            // Add local tracks to connection
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            // Create and send offer
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendSignal('rtc_offer', { offer });

            console.log('Sent RTC offer');
        } catch (err) {
            console.error('Failed to start call:', err);
            setError('Failed to start call');
        }
    }, [getLocalStream, createPeerConnection, sendSignal]);

    // Handle incoming offer (callee side)
    const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit) => {
        try {
            setError(null);
            console.log('🎧 Processing incoming offer...');
            const stream = await getLocalStream();
            if (!stream) return;

            const pc = createPeerConnection();

            // Add local tracks
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });

            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            console.log('📥 Remote description set');

            // Process any queued ICE candidates
            if (pendingCandidatesRef.current.length > 0) {
                console.log(`🧊 Processing ${pendingCandidatesRef.current.length} queued ICE candidates`);
                for (const candidate of pendingCandidatesRef.current) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
                pendingCandidatesRef.current = [];
            }

            // Create and send answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignal('rtc_answer', { answer });

            console.log('✅ Sent RTC answer');
        } catch (err) {
            console.error('Failed to handle offer:', err);
            setError('Failed to connect');
        }
    }, [getLocalStream, createPeerConnection, sendSignal]);

    // Handle incoming answer
    const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
        try {
            const pc = peerConnectionRef.current;
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
                console.log('📥 Set remote description from answer');

                // Process any queued ICE candidates
                if (pendingCandidatesRef.current.length > 0) {
                    console.log(`🧊 Processing ${pendingCandidatesRef.current.length} queued ICE candidates`);
                    for (const candidate of pendingCandidatesRef.current) {
                        await pc.addIceCandidate(new RTCIceCandidate(candidate));
                    }
                    pendingCandidatesRef.current = [];
                }
            }
        } catch (err) {
            console.error('Failed to handle answer:', err);
        }
    }, []);

    // Handle incoming ICE candidate
    const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
        try {
            const pc = peerConnectionRef.current;
            if (pc && pc.remoteDescription) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('✅ Added ICE candidate');
            } else {
                // Queue the candidate for later when peer connection is ready
                console.log('📦 Queuing ICE candidate (peer connection not ready)');
                pendingCandidatesRef.current.push(candidate);
            }
        } catch (err) {
            console.error('Failed to add ICE candidate:', err);
        }
    }, []);

    // Handle incoming RTC signal
    const handleSignal = useCallback((signal: RTCSignal) => {
        console.log('📥 Received RTC signal:', signal.type, signal);
        switch (signal.type) {
            case 'rtc_offer':
                console.log('📥 Processing RTC offer');
                if (signal.offer) handleOffer(signal.offer);
                break;
            case 'rtc_answer':
                console.log('📥 Processing RTC answer');
                if (signal.answer) handleAnswer(signal.answer);
                break;
            case 'rtc_ice_candidate':
                console.log('📥 Processing ICE candidate');
                if (signal.candidate) handleIceCandidate(signal.candidate);
                break;
        }
    }, [handleOffer, handleAnswer, handleIceCandidate]);

    // Toggle mute
    const toggleMute = useCallback(() => {
        const stream = localStreamRef.current;
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    }, [isMuted]);

    // End call
    const endCall = useCallback(() => {
        // Stop local stream
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }

        // Close peer connection
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        // Clear remote audio
        if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = null;
        }

        setIsConnected(false);
        setIsMuted(false);
        setError(null);
    }, []);

    return {
        startCall,
        handleSignal,
        toggleMute,
        endCall,
        isConnected,
        isMuted,
        error,
    };
}
