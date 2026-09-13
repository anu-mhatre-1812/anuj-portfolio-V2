import { memo, useEffect, useRef } from 'react';
import { useScene } from '../../../../context/SceneContext';

const CarouselRoom = memo(({ showRoom, onReady, isExiting }) => {
    const { openOverlay, overlayContent } = useScene();
    const hasOpened = useRef(false);

    // Open the carousel editor overlay when room is entered
    useEffect(() => {
        if (showRoom && !hasOpened.current && !overlayContent) {
            hasOpened.current = true;
            // Signal ready first, then open overlay after a short delay
            onReady?.();
            const timer = setTimeout(() => {
                openOverlay({
                    layout: 'carousel_editor',
                    title: 'CAROUSEL',
                });
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [showRoom, onReady, openOverlay, overlayContent]);

    // Reset when exiting
    useEffect(() => {
        if (!showRoom) {
            hasOpened.current = false;
        }
    }, [showRoom]);

    // Minimal room — just a floor and back wall (the editor is a 2D overlay)
    return null;
});

CarouselRoom.displayName = 'CarouselRoom';
export default CarouselRoom;
