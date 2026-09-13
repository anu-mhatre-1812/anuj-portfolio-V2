import { memo, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { useScene } from '../../../context/SceneContext';

// Door positions (Global Z for Segment 0)
// Calculation: 10 (Start Z) + Relative Z + 2 (Door Offset)
const DOOR_POSITIONS_Z = {
    'gallery': -6,   // 10 - 18 + 2
    'studio': -20,   // 10 - 32 + 2
    'about': -36,    // 10 - 48 + 2
    'contact': -50,  // 10 - 62 + 2
    'carousel': -50  // No corridor door — uses same Z as contact, teleports directly into room
};

// Rooms that have no corridor door (map-only access)
const DOORLESS_ROOMS = new Set(['carousel']);

/**
 * TeleportRoom Component
 * 
 * Handles moving the camera to the correct corridor position during teleport.
 * Instead of rendering the room, it:
 * 1. Moves camera to ~8 units before the door
 * 2. During FAST teleport: triggers completeTeleport immediately (paper stays closed)
 * 3. During normal teleport: signals PaperTransition to open
 * 4. SceneContext then triggers 'pendingDoorClick' which DoorSection picks up
 *    (For doorless rooms like carousel, we skip the door click and directly enter)
 */
const TeleportRoom = memo(() => {
    const {
        teleportTarget,
        teleportPhase,
        openTeleportTransition,
        completeTeleport,
        signalRoomReady,
        enterRoom,
        openOverlay,
        isFastTeleport,
        isTeleporting
    } = useScene();
    const { camera } = useThree();
    const hasPositioned = useRef(false);

    // Position camera when entering 'teleporting' phase
    useEffect(() => {
        if (teleportPhase === 'teleporting' && teleportTarget && !hasPositioned.current) {
            const doorZ = DOOR_POSITIONS_Z[teleportTarget];

            if (doorZ !== undefined) {
                // Place camera 8 units "before" the door (towards positive Z)
                // Center of corridor (X=0)
                // Height standard (Y=0.2)
                const targetZ = doorZ + 8;

                // Instantly teleport camera
                camera.position.set(0, 0.2, targetZ);

                // Reset rotation to look straight down corridor (towards negative Z)
                // This ensures we start "neutral" before the door click animation takes over
                camera.rotation.set(0, 0, 0);

                hasPositioned.current = true;

                // Small delay to ensure frame update
                setTimeout(() => {
                    if (DOORLESS_ROOMS.has(teleportTarget)) {
                        // DOORLESS ROOM: No corridor door exists — skip door click,
                        // directly enter the room and open its overlay
                        // All state changes in same tick to prevent flash
                        enterRoom(teleportTarget);
                        if (teleportTarget === 'carousel') {
                            openOverlay({ layout: 'carousel_editor', title: 'CAROUSEL' });
                        }
                        signalRoomReady();
                    } else if (isFastTeleport) {
                        // FAST TELEPORT: Skip paper open, go straight to door click
                        // Paper stays closed, DoorSection will call signalRoomReady when done
                        completeTeleport();
                    } else {
                        // NORMAL TELEPORT: Open paper first (not currently used, but kept for flexibility)
                        openTeleportTransition();
                    }
                }, 50);
            }
        }

        // Reset flag when teleportation ends
        if (!isTeleporting) {
            hasPositioned.current = false;
        }
    }, [teleportPhase, teleportTarget, isTeleporting, isFastTeleport, camera, openTeleportTransition, completeTeleport, enterRoom, openOverlay, signalRoomReady]);

    // Don't render anything - we just manipulate camera
    return null;
});

TeleportRoom.displayName = 'TeleportRoom';

export default TeleportRoom;
