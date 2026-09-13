import { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Corridor Component - Hand-drawn Style
 * 
 * More sketchy, paper-like aesthetic.
 */
const Corridor = ({ length = 100 }) => {
    const corridorWidth = 4;
    const corridorHeight = 3.5;

    // Load paper texture
    const paperTexture = useTexture('/textures/paper-texture.webp');

    useMemo(() => {
        paperTexture.wrapS = paperTexture.wrapT = THREE.RepeatWrapping;
        paperTexture.colorSpace = THREE.SRGBColorSpace;
    }, [paperTexture]);

    const zOffset = -length / 2 + 5;

    return (
        <group>
            {/* Floor - cream/paper color */}
            <mesh
                position={[0, -corridorHeight / 2, zOffset]}
                rotation={[-Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[corridorWidth, length]} />
                <meshBasicMaterial
                    color="#8A6245"
                />
            </mesh>

            {/* Floor grid - notebook style */}
            <gridHelper
                args={[length, length * 2, '#7A6A5A', '#8A7A6A']}
                position={[0, -corridorHeight / 2 + 0.01, zOffset]}
                rotation={[0, Math.PI / 2, 0]}
            />

            {/* Ceiling */}
            <mesh
                position={[0, corridorHeight / 2, zOffset]}
                rotation={[Math.PI / 2, 0, 0]}
            >
                <planeGeometry args={[corridorWidth, length]} />
                <meshBasicMaterial
                    color="#F2EEE6"
                />
            </mesh>

            {/* Left Wall */}
            <mesh
                position={[-corridorWidth / 2, 0, zOffset]}
                rotation={[0, Math.PI / 2, 0]}
            >
                <planeGeometry args={[length, corridorHeight]} />
                <meshBasicMaterial
                    color="#DDD6CC"
                />
            </mesh>

            {/* Right Wall */}
            <mesh
                position={[corridorWidth / 2, 0, zOffset]}
                rotation={[0, -Math.PI / 2, 0]}
            >
                <planeGeometry args={[length, corridorHeight]} />
                <meshBasicMaterial
                    color="#DDD6CC"
                />
            </mesh>

            {/* Sketch-style decorations */}
            <SketchDecorations
                corridorWidth={corridorWidth}
                corridorHeight={corridorHeight}
                length={length}
                zOffset={zOffset}
            />

            {/* End wall */}
            <mesh position={[0, 0, zOffset - length / 2 + 0.5]}>
                <planeGeometry args={[corridorWidth, corridorHeight]} />
                <meshBasicMaterial color="#E8E1D7" />
            </mesh>
        </group>
    );
};

/**
 * Sketch-style decorations - hand-drawn lines and marks
 */
const SketchDecorations = ({ corridorWidth, corridorHeight, length, zOffset }) => {
    // Wall accents - vertical sketch lines
    const wallLines = useMemo(() => {
        const lines = [];
        for (let z = -5; z > -length + 10; z -= 12) {
            lines.push(z + zOffset + length / 2);
        }
        return lines;
    }, [length, zOffset]);

    return (
        <group>
            {/* Baseboard sketch lines */}
            <mesh position={[-corridorWidth / 2 + 0.01, -corridorHeight / 2 + 0.08, zOffset]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[length, 0.06]} />
                <meshBasicMaterial color="#5C4635" side={2} />
            </mesh>
            <mesh position={[corridorWidth / 2 - 0.01, -corridorHeight / 2 + 0.08, zOffset]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[length, 0.06]} />
                <meshBasicMaterial color="#5C4635" side={2} />
            </mesh>

            {/* Crown molding sketch */}
            <mesh position={[-corridorWidth / 2 + 0.01, corridorHeight / 2 - 0.05, zOffset]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[length, 0.04]} />
                <meshBasicMaterial color="#C8BFB3" side={2} />
            </mesh>
            <mesh position={[corridorWidth / 2 - 0.01, corridorHeight / 2 - 0.05, zOffset]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[length, 0.04]} />
                <meshBasicMaterial color="#C8BFB3" side={2} />
            </mesh>

            {/* Vertical accent lines on walls */}
            {wallLines.map((z, i) => (
                <group key={i}>
                    <mesh position={[-corridorWidth / 2 + 0.01, 0, z]}>
                        <planeGeometry args={[0.015, corridorHeight * 0.6]} />
                        <meshBasicMaterial color="#756657" side={2} />
                    </mesh>
                    <mesh position={[corridorWidth / 2 - 0.01, 0, z]}>
                        <planeGeometry args={[0.015, corridorHeight * 0.6]} />
                        <meshBasicMaterial color="#756657" side={2} />
                    </mesh>
                </group>
            ))}

            {/* Random sketch marks on walls - like pencil marks */}
            <SketchMarks corridorWidth={corridorWidth} zOffset={zOffset} length={length} />
        </group>
    );
};

/**
 * Random pencil-like marks on walls
 */
const SketchMarks = ({ corridorWidth, zOffset, length }) => {
    const marks = useMemo(() => {
        const m = [];
        for (let i = 0; i < 15; i++) {
            m.push({
                x: Math.random() > 0.5 ? -corridorWidth / 2 + 0.02 : corridorWidth / 2 - 0.02,
                y: (Math.random() - 0.5) * 2,
                z: zOffset + length / 2 - Math.random() * (length - 10),
                rotation: (Math.random() - 0.5) * 0.5,
                width: 0.05 + Math.random() * 0.1,
                opacity: 0.1 + Math.random() * 0.15
            });
        }
        return m;
    }, [corridorWidth, zOffset, length]);

    return (
        <group>
            {marks.map((mark, i) => (
                <mesh
                    key={i}
                    position={[mark.x, mark.y, mark.z]}
                    rotation={[0, mark.x < 0 ? Math.PI / 2 : -Math.PI / 2, mark.rotation]}
                >
                    <planeGeometry args={[mark.width, 0.008]} />
                    <meshBasicMaterial color="#5A554F" transparent opacity={mark.opacity} side={2} />
                </mesh>
            ))}
        </group>
    );
};

export default Corridor;
