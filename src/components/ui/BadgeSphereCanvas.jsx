import React, { useRef, useMemo, Suspense, useCallback, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const SPHERE_RADIUS = 3.0;
const ATLAS_COLS = 6;
const ATLAS_ROWS = 4;
const TILE_SIZE = 256;

function preloadImages(srcs) {
    return Promise.all(srcs.map((src, i) => new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            console.log(`[BadgeSphere] Loaded image ${i}: ${src} (${img.naturalWidth}x${img.naturalHeight})`);
            resolve(img);
        };
        img.onerror = () => {
            console.warn(`[BadgeSphere] Failed to load image ${i}: ${src}`);
            resolve(null);
        };
        img.src = src;
    })));
}

function useAtlas(imagePaths) {
    const [atlas, setAtlas] = useState(null);

    useEffect(() => {
        let cancelled = false;
        console.log('[BadgeSphere] Loading images:', imagePaths);
        preloadImages(imagePaths).then(images => {
            if (cancelled) return;
            console.log('[BadgeSphere] Images loaded:', images.map((img, i) => img ? `${i}:ok` : `${i}:fail`));

            const canvas = document.createElement('canvas');
            canvas.width = TILE_SIZE * ATLAS_COLS;
            canvas.height = TILE_SIZE * ATLAS_ROWS;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = '#1a1a1a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            images.forEach((img, i) => {
                if (!img) return;
                const col = i % ATLAS_COLS;
                const row = Math.floor(i / ATLAS_COLS);
                const x = col * TILE_SIZE;
                const y = row * TILE_SIZE;

                ctx.fillStyle = '#fff';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

                try {
                    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, x, y, TILE_SIZE, TILE_SIZE);
                    console.log(`[BadgeSphere] Drew image ${i} at tile [${col},${row}]`);
                } catch(e) {
                    console.warn(`[BadgeSphere] Failed to draw image ${i}:`, e);
                }
            });

            // Fill empty slots
            const totalSlots = ATLAS_COLS * ATLAS_ROWS;
            for (let i = images.length; i < totalSlots; i++) {
                const col = i % ATLAS_COLS;
                const row = Math.floor(i / ATLAS_COLS);
                const x = col * TILE_SIZE;
                const y = row * TILE_SIZE;
                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#2a2a2a';
                ctx.lineWidth = 2;
                ctx.strokeRect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16);
                ctx.fillStyle = '#333';
                ctx.font = '36px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('🏅', x + TILE_SIZE / 2, y + TILE_SIZE / 2);
            }

            const tex = new THREE.CanvasTexture(canvas);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.needsUpdate = true;
            console.log('[BadgeSphere] Atlas texture created');
            setAtlas(tex);
        });
        return () => { cancelled = true; };
    }, [imagePaths.join(',')]);

    return atlas;
}

function uvToBadgeIndex(u, v, total) {
    const col = Math.floor(u * ATLAS_COLS);
    const row = Math.floor((1 - v) * ATLAS_ROWS);
    const index = row * ATLAS_COLS + col;
    if (index >= 0 && index < total) return index;
    return -1;
}

function Sphere({ atlas, badges, onHover }) {
    const ref = useRef();
    const { camera, gl } = useThree();
    const raycaster = useMemo(() => new THREE.Raycaster(), []);
    const pointer = useMemo(() => new THREE.Vector2(), []);
    const hoveredRef = useRef(-1);

    const handlePointerMove = useCallback((e) => {
        const rect = gl.domElement.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }, [gl, pointer]);

    useMemo(() => {
        const el = gl.domElement;
        el.addEventListener('pointermove', handlePointerMove);
        return () => el.removeEventListener('pointermove', handlePointerMove);
    }, [gl, handlePointerMove]);

    useFrame((_, dt) => {
        if (ref.current) {
            ref.current.rotation.y += dt * 0.15;

            raycaster.setFromCamera(pointer, camera);
            const hits = raycaster.intersectObject(ref.current);
            if (hits.length > 0 && hits[0].uv) {
                const idx = uvToBadgeIndex(hits[0].uv.x, hits[0].uv.y, badges.length);
                if (idx !== hoveredRef.current) {
                    hoveredRef.current = idx;
                    onHover(idx >= 0 ? badges[idx] : null);
                }
            } else if (hoveredRef.current !== -1) {
                hoveredRef.current = -1;
                onHover(null);
            }
        }
    });

    if (!atlas) return null;

    return (
        <mesh ref={ref}>
            <sphereGeometry args={[SPHERE_RADIUS, 64, 64]} />
            <meshBasicMaterial map={atlas} />
        </mesh>
    );
}

function Scene({ badges, onHover }) {
    const imagePaths = useMemo(() => badges.map(b => b.image), [badges]);
    const atlas = useAtlas(imagePaths);
    return <Sphere atlas={atlas} badges={badges} onHover={onHover} />;
}

export default function BadgeSphereCanvas({ items }) {
    const [hovered, setHovered] = useState(null);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Canvas
                camera={{ position: [0, 0, 7.5], fov: 50 }}
                gl={{ antialias: true, alpha: true }}
                style={{ background: 'transparent' }}
            >
                <ambientLight intensity={0.9} />
                <OrbitControls
                    enableZoom={true}
                    enablePan={false}
                    autoRotate
                    autoRotateSpeed={0.4}
                    minDistance={4}
                    maxDistance={12}
                />
                <Suspense fallback={null}>
                    <Scene badges={items} onHover={setHovered} />
                </Suspense>
            </Canvas>
            {hovered && (
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.85)',
                    border: '2px solid #DC143C',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    textAlign: 'center',
                    pointerEvents: 'none',
                    zIndex: 10,
                }}>
                    <div style={{
                        fontFamily: "'Rubik Scribble', cursive",
                        fontSize: '1rem',
                        color: '#fff',
                        fontWeight: 700,
                    }}>
                        {hovered.label}
                    </div>
                    <div style={{
                        fontFamily: "'Cabin Sketch', cursive",
                        fontSize: '0.75rem',
                        color: '#aaa',
                        marginTop: '2px',
                    }}>
                        {hovered.date}
                    </div>
                </div>
            )}
        </div>
    );
}
