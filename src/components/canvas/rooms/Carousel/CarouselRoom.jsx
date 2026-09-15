import { memo, useEffect, useRef } from 'react';
import { Float, RoundedBox, Text } from '@react-three/drei';
import { useScene } from '../../../../context/SceneContext';

const CarouselRoom = memo(({ showRoom, onReady, isWarmup = false }) => {
    const { openOverlay, overlayContent, currentRoom } = useScene();
    const hasOpened = useRef(false);
    const hasSignaledReady = useRef(false);
    const openOverlayRef = useRef(openOverlay);
    const onReadyRef = useRef(onReady);
    const overlayContentRef = useRef(overlayContent);

    openOverlayRef.current = openOverlay;
    onReadyRef.current = onReady;
    overlayContentRef.current = overlayContent;

    // Signal ready when showRoom becomes true (triggers door open in DoorSection)
    useEffect(() => {
        if (showRoom && !isWarmup && !hasSignaledReady.current) {
            hasSignaledReady.current = true;
            onReadyRef.current?.();
        }
    }, [showRoom, isWarmup]);

    // Open overlay AFTER enterRoom sets currentRoom to 'carousel'
    // This avoids the bug where enterRoom(doorId) clears overlayContent
    // before the old timer-based approach could keep it open.
    useEffect(() => {
        if (currentRoom === 'carousel' && showRoom && !hasOpened.current) {
            hasOpened.current = true;
            // Small delay to ensure enterRoom's setOverlayContent(null) has settled
            const timer = setTimeout(() => {
                if (!overlayContentRef.current) {
                    openOverlayRef.current({
                        layout: 'carousel_editor',
                        title: 'CAROUSEL',
                    });
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [currentRoom, showRoom]);

    useEffect(() => {
        if (!showRoom) {
            hasOpened.current = false;
            hasSignaledReady.current = false;
        }
    }, [showRoom]);

    return (
        <group>
            <color attach="background" args={['#f3eee3']} />
            <ambientLight intensity={2.1} />
            <directionalLight position={[3, 6, 4]} intensity={1.7} color="#fff4dc" />

            <mesh position={[0, -1.45, -6]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[16, 15]} />
                <meshBasicMaterial color="#e5dac9" />
            </mesh>

            <group position={[0, 0.35, -7.6]}>
                <RoundedBox args={[11.5, 5.9, 0.18]} radius={0.16} smoothness={4}>
                    <meshStandardMaterial color="#fffaf1" roughness={0.92} />
                </RoundedBox>
                <RoundedBox position={[0, 0, 0.11]} args={[10.9, 5.3, 0.03]} radius={0.12} smoothness={3}>
                    <meshBasicMaterial color="#1a1a1a" />
                </RoundedBox>

                <Text position={[0, 1.78, 0.16]} font="/fonts/RubikScribble-Regular.ttf" fontSize={0.68} color="#f7e7bd" anchorX="center">
                    CAROUSEL LAB
                </Text>
                <Text position={[0, 1.16, 0.16]} font="/fonts/CabinSketch-Regular.ttf" fontSize={0.27} color="#fffaf1" anchorX="center">
                    MAKE IDEAS SWIPE-WORTHY
                </Text>

                <SlidePreview position={[-3.1, -0.65, 0.17]} color="#e75f4d" title="HOOK" index="01" />
                <SlidePreview position={[0, -0.65, 0.17]} color="#f2bf5e" title="VALUE" index="02" />
                <SlidePreview position={[3.1, -0.65, 0.17]} color="#6389c8" title="CTA" index="03" />
            </group>

            <Float speed={1.8} rotationIntensity={0.12} floatIntensity={0.24} position={[-5.2, 2.15, -5.7]}>
                <Text font="/fonts/CabinSketch-Bold.ttf" fontSize={0.42} color="#cf4d3c" rotation={[0, 0, -0.15]}>AI</Text>
            </Float>
            <Float speed={1.35} rotationIntensity={0.1} floatIntensity={0.18} position={[5.15, 1.8, -5.9]}>
                <Text font="/fonts/CabinSketch-Bold.ttf" fontSize={0.34} color="#315e9b" rotation={[0, 0, 0.18]}>CREATE</Text>
            </Float>
        </group>
    );
});

const SlidePreview = ({ position, color, title, index }) => (
    <group position={position}>
        <RoundedBox args={[2.25, 2.85, 0.06]} radius={0.08} smoothness={3}>
            <meshBasicMaterial color={color} />
        </RoundedBox>
        <Text position={[-0.78, 0.96, 0.05]} font="/fonts/CabinSketch-Bold.ttf" fontSize={0.2} color="#171717">{index}</Text>
        <Text position={[0, 0.1, 0.05]} font="/fonts/RubikScribble-Regular.ttf" fontSize={0.38} color="#171717" anchorX="center">{title}</Text>
        <mesh position={[0, -0.58, 0.05]}>
            <planeGeometry args={[1.25, 0.05]} />
            <meshBasicMaterial color="#171717" />
        </mesh>
        <mesh position={[0, -0.83, 0.05]}>
            <planeGeometry args={[0.82, 0.05]} />
            <meshBasicMaterial color="#171717" />
        </mesh>
    </group>
);

CarouselRoom.displayName = 'CarouselRoom';
export default CarouselRoom;
