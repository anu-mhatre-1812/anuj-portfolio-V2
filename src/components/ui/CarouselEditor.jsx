import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { generateCarousel } from '../../api/generateCarousel';
import '../../styles/CarouselEditor.scss';

const FONT_OPTIONS = [
    { label: 'Rubik Scribble', value: "'Rubik Scribble', cursive", category: 'heading' },
    { label: 'Cabin Sketch Bold', value: "'Cabin Sketch', cursive", weight: 700, category: 'heading' },
    { label: 'Cabin Sketch Regular', value: "'Cabin Sketch', cursive", weight: 400, category: 'body' },
    { label: 'Inter', value: "'Inter', sans-serif", category: 'body' },
    { label: 'Caveat', value: "'Caveat', cursive", category: 'accent' },
    { label: 'Gloria Hallelujah', value: "'Gloria Hallelujah', cursive", category: 'accent' },
];

const COLOR_PALETTE = [
    { label: 'Off-White', value: '#FAFAFA' },
    { label: 'Paper', value: '#F5F5F5' },
    { label: 'Warm Cream', value: '#F5F0E6' },
    { label: 'Cream Dark', value: '#E8E2D5' },
    { label: 'Light Cream', value: '#FFF8E8' },
    { label: 'Dark Text', value: '#1A1A1A' },
    { label: 'Charcoal', value: '#222222' },
    { label: 'Grey', value: '#666666' },
    { label: 'Mid Grey', value: '#4A4A4A' },
    { label: 'Accent Red', value: '#CC3333' },
    { label: 'Accent Green', value: '#22AA44' },
    { label: 'Dark UI', value: '#0A0A0A' },
];

const LAYOUT_OPTIONS = [
    { id: 'hook-content-cta', label: 'Hook → Content → CTA' },
    { id: 'bullet-list', label: 'Bullet List' },
    { id: 'numbered-list', label: 'Numbered List' },
    { id: 'big-text', label: 'Big Text' },
    { id: 'split', label: 'Split Layout' },
    { id: 'quote', label: 'Quote / Statement' },
    { id: 'two-column', label: 'Two Column' },
    { id: 'stats', label: 'Stats / Numbers' },
    { id: 'checklist', label: 'Checklist' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'testimonial', label: 'Testimonial' },
    { id: 'image-overlay', label: 'Image Overlay' },
];

const SHAPE_OPTIONS = [
    { id: 'none', label: 'No Shape' },
    { id: 'rect', label: 'Rectangle' },
    { id: 'rounded', label: 'Rounded Rect' },
    { id: 'pill', label: 'Pill' },
    { id: 'circle', label: 'Circle' },
];

const DEFAULT_BRANDING = () => ({
    text: '@anujmhatre',
    logoUrl: null,
    fontSize: 24,
    logoSize: 32,
    logoX: 880,
    logoY: 1280,
    logoOpacity: 0.5,
    opacity: 0.5,
    position: 'bottom-right',
});

const DEFAULT_ELEMENT = (overrides = {}) => ({
    id: Date.now() + Math.random(),
    type: 'text',
    x: 72,
    y: 400,
    width: 936,
    height: 'auto',
    text: 'New Text',
    imageUrl: null,
    imageAspect: 1,
    shape: 'none',
    shapeColor: '#CC3333',
    style: {
        fontSize: 48,
        fontFamily: "'Cabin Sketch', cursive",
        fontWeight: 700,
        color: '#1A1A1A',
        bold: false,
        italic: false,
        letterSpacing: 0,
        textTransform: 'none',
        textAlign: 'left',
    },
    ...overrides,
});

const DEFAULT_SLIDE = () => ({
    id: Date.now() + Math.random(),
    title: '',
    content: '',
    layout: 'hook-content-cta',
    bgColor: '#FAFAFA',
    textColor: '#1A1A1A',
    fontFamily: "'Cabin Sketch', cursive",
    fontWeight: 700,
    imageUrl: null,
    bullets: ['', ''],
    branding: DEFAULT_BRANDING(),
    elements: [],
});

const SAMPLE_STYLES = {
    neoBrutalism: {
        label: 'Neo Brutalism',
        slides: [
            { id: 1, title: 'BREAK THE GRID', content: 'Design rules exist to be shattered. Neo brutalism is raw, loud, and unapologetic.', layout: 'hook-content-cta', bgColor: '#FFFF00', textColor: '#000000', fontFamily: "'Rubik Scribble', cursive", fontWeight: 900, imageUrl: null, bullets: [], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#FF3333' },
            { id: 2, title: 'THICK BORDERS', content: 'Every element gets a 4px black border. No subtlety. No softness. Pure visual impact.', layout: 'bullet-list', bgColor: '#FF6B6B', textColor: '#000000', fontFamily: "'Cabin Sketch', cursive", fontWeight: 700, imageUrl: null, bullets: ['Hard shadows', 'Clashing colors', 'Intentional "ugly"'], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#000' },
            { id: 3, title: 'RAW > POLISHED', content: 'Perfection is boring. The best designs feel human, rough, and alive.', layout: 'big-text', bgColor: '#000000', textColor: '#FFFF00', fontFamily: "'Rubik Scribble', cursive", fontWeight: 900, imageUrl: null, bullets: [], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#FF3333' },
            { id: 4, title: 'COLOR CHAOS', content: 'Pair colors that "shouldn\'t" work together. Yellow + pink + lime green = chef\'s kiss.', layout: 'two-column', bgColor: '#FF00FF', textColor: '#FFFFFF', fontFamily: "'Cabin Sketch', cursive", fontWeight: 700, imageUrl: null, bullets: ['Bold typefaces', 'Asymmetric layouts', 'Maximum contrast'], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#FFFF00' },
            { id: 5, title: 'GO LOUD OR GO HOME', content: 'Follow @anujmhatre for more design chaos.', layout: 'hook-content-cta', bgColor: '#00FF00', textColor: '#000000', fontFamily: "'Rubik Scribble', cursive", fontWeight: 900, imageUrl: null, bullets: [], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#FF00FF' },
        ],
    },
    minimalism: {
        label: 'Minimalism',
        slides: [
            { id: 1, title: 'Less Is More', content: 'The art of subtraction. Remove everything until only the essential remains.', layout: 'hook-content-cta', bgColor: '#FAFAFA', textColor: '#1A1A1A', fontFamily: "'Inter', sans-serif", fontWeight: 300, imageUrl: null, bullets: [], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#CCC' },
            { id: 2, title: 'White Space Is Not Empty', content: 'It\'s a design element. Let your content breathe.', layout: 'big-text', bgColor: '#FFFFFF', textColor: '#1A1A1A', fontFamily: "'Inter', sans-serif", fontWeight: 300, imageUrl: null, bullets: [], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#EEE' },
            { id: 3, title: 'One Font. One Color.', content: 'Typography-led design needs no decoration. The type IS the design.', layout: 'bullet-list', bgColor: '#F5F5F5', textColor: '#333333', fontFamily: "'Inter', sans-serif", fontWeight: 400, imageUrl: null, bullets: ['Hierarchy through size', 'Weight for emphasis', 'Spacing for rhythm'], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#DDD' },
            { id: 4, title: 'Intentional Restraint', content: 'Every pixel must earn its place. If it doesn\'t serve the message, delete it.', layout: 'split', bgColor: '#FAFAFA', textColor: '#1A1A1A', fontFamily: "'Inter', sans-serif", fontWeight: 300, imageUrl: null, bullets: [], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#EEE' },
            { id: 5, title: 'Simplicity Sells', content: 'Follow @anujmhatre for clean design thinking.', layout: 'hook-content-cta', bgColor: '#FFFFFF', textColor: '#1A1A1A', fontFamily: "'Inter', sans-serif", fontWeight: 300, imageUrl: null, bullets: [], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#CCC' },
        ],
    },
    glassmorphism: {
        label: 'Glassmorphism',
        slides: [
            { id: 1, title: 'Frosted Future', content: 'Glass UI is everywhere — from Apple to Vercel. Here\'s why it works.', layout: 'hook-content-cta', bgColor: '#0A0A2E', textColor: '#FFFFFF', fontFamily: "'Inter', sans-serif", fontWeight: 400, imageUrl: null, bullets: [], branding: DEFAULT_BRANDING(), elements: [], shape: 'rounded', shapeColor: 'rgba(255,255,255,0.1)' },
            { id: 2, title: 'Blur + Transparency', content: 'Background blur creates depth without heaviness. It feels modern, light, and premium.', layout: 'bullet-list', bgColor: '#1A1A4E', textColor: '#FFFFFF', fontFamily: "'Inter', sans-serif", fontWeight: 400, imageUrl: null, bullets: ['backdrop-filter: blur(20px)', 'Subtle border (1px white 20%)', 'Layered depth'], branding: DEFAULT_BRANDING(), elements: [], shape: 'rounded', shapeColor: 'rgba(255,255,255,0.08)' },
            { id: 3, title: 'Depth Through Layers', content: 'Stack glass panels to create Z-depth. Each layer adds hierarchy.', layout: 'two-column', bgColor: '#0A0A2E', textColor: '#E0E0FF', fontFamily: "'Caveat', cursive", fontWeight: 400, imageUrl: null, bullets: ['Base layer: gradient bg', 'Mid layer: glass cards', 'Top layer: content'], branding: DEFAULT_BRANDING(), elements: [], shape: 'rounded', shapeColor: 'rgba(255,255,255,0.05)' },
            { id: 4, title: 'Gradient Magic', content: 'Combine glass with vibrant gradients. Purple → blue → teal = chef\'s kiss.', layout: 'big-text', bgColor: '#1A0A3E', textColor: '#FFFFFF', fontFamily: "'Inter', sans-serif", fontWeight: 300, imageUrl: null, bullets: [], branding: DEFAULT_BRANDING(), elements: [], shape: 'pill', shapeColor: 'rgba(100,100,255,0.15)' },
            { id: 5, title: 'Try It Now', content: 'Follow @anujmhatre for more glass UI tutorials.', layout: 'hook-content-cta', bgColor: '#0A0A2E', textColor: '#FFFFFF', fontFamily: "'Inter', sans-serif", fontWeight: 400, imageUrl: null, bullets: [], branding: DEFAULT_BRANDING(), elements: [], shape: 'rounded', shapeColor: 'rgba(255,255,255,0.1)' },
        ],
    },
    maximalism: {
        label: 'Maximalism',
        slides: [
            { id: 1, title: 'MORE IS MORE', content: 'Why settle for less? Maximalism celebrates excess, texture, and visual noise.', layout: 'hook-content-cta', bgColor: '#FF1493', textColor: '#FFFF00', fontFamily: "'Gloria Hallelujah', cursive", fontWeight: 700, imageUrl: null, bullets: [], branding: DEFAULT_BRANDING(), elements: [], shape: 'circle', shapeColor: '#00FF00' },
            { id: 2, title: 'LAYER EVERYTHING', content: 'Text on images on patterns on gradients. There is no "too much."', layout: 'bullet-list', bgColor: '#FFD700', textColor: '#FF0000', fontFamily: "'Rubik Scribble', cursive", fontWeight: 900, imageUrl: null, bullets: ['Mix 5+ fonts', 'Clash patterns', 'Overlap elements', 'Use ALL the colors'], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#FF00FF' },
            { id: 3, title: 'TEXTURE OVERLOAD', content: 'Noise, grain, paper, fabric, metal —堆 everything together. The chaos IS the aesthetic.', layout: 'big-text', bgColor: '#00CED1', textColor: '#FF1493', fontFamily: "'Cabin Sketch', cursive", fontWeight: 700, imageUrl: null, bullets: [], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#FFD700' },
            { id: 4, title: 'RULES? NEVER HEARD OF THEM', content: 'Grid? Nope. Hierarchy? Whatever. Make it loud, make it yours.', layout: 'split', bgColor: '#9400D3', textColor: '#00FF7F', fontFamily: "'Gloria Hallelujah', cursive", fontWeight: 700, imageUrl: null, bullets: [], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#FF1493' },
            { id: 5, title: 'GO CRAZY', content: 'Follow @anujmhatre for more visual chaos.', layout: 'hook-content-cta', bgColor: '#FF4500', textColor: '#FFFF00', fontFamily: "'Rubik Scribble', cursive", fontWeight: 900, imageUrl: null, bullets: [], branding: DEFAULT_BRANDING(), elements: [], shape: 'circle', shapeColor: '#FF00FF' },
        ],
    },
    brutalism: {
        label: 'Brutalism',
        slides: [
            { id: 1, title: 'DESIGN IS DEAD', content: 'Long live raw, unfiltered expression. Brutalism strips away the fake.', layout: 'hook-content-cta', bgColor: '#F5F5F5', textColor: '#000000', fontFamily: "'Inter', sans-serif", fontWeight: 900, imageUrl: null, bullets: [], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#000' },
            { id: 2, title: 'NO DECORATION', content: 'No rounded corners. No gradients. No drop shadows. Just structure and content.', layout: 'bullet-list', bgColor: '#FFFFFF', textColor: '#000000', fontFamily: "'Inter', sans-serif", fontWeight: 900, imageUrl: null, bullets: ['Raw HTML aesthetic', 'Monospace fonts', 'System fonts welcome'], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#000' },
            { id: 3, title: 'FUNCTION OVER FORM', content: 'If it works, it\'s beautiful. Beauty is a side effect, not the goal.', layout: 'numbered-list', bgColor: '#E0E0E0', textColor: '#000000', fontFamily: "'Inter', sans-serif", fontWeight: 700, imageUrl: null, bullets: ['Content first', 'Structure second', 'Style never'], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#000' },
            { id: 4, title: 'THE UGLY TRUTH', content: 'Most "beautiful" design is just hiding boring ideas behind pretty surfaces.', layout: 'quote', bgColor: '#000000', textColor: '#FFFFFF', fontFamily: "'Inter', sans-serif", fontWeight: 900, imageUrl: null, bullets: [], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#FFF' },
            { id: 5, title: 'EMBRACE THE RAW', content: 'Follow @anujmhatre for anti-design thinking.', layout: 'hook-content-cta', bgColor: '#F5F5F5', textColor: '#000000', fontFamily: "'Inter', sans-serif", fontWeight: 900, imageUrl: null, bullets: [], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#000' },
        ],
    },
    skeuomorphism: {
        label: 'Skeuomorphism',
        slides: [
            { id: 1, title: 'Real World Vibes', content: 'Leather, wood, paper, metal — design that mimics real materials is making a comeback.', layout: 'hook-content-cta', bgColor: '#8B4513', textColor: '#FAFAFA', fontFamily: "'Caveat', cursive", fontWeight: 700, imageUrl: null, bullets: [], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#D2691E' },
            { id: 2, title: 'Textures Matter', content: 'Grain, fiber, imperfections — these make digital feel physical and trustworthy.', layout: 'bullet-list', bgColor: '#DEB887', textColor: '#3E2723', fontFamily: "'Caveat', cursive", fontWeight: 700, imageUrl: null, bullets: ['Paper texture backgrounds', 'Embossed buttons', 'Realistic shadows'], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#8B4513' },
            { id: 3, title: 'DEPTH IS REAL', content: 'Multiple shadow layers create the illusion of physical objects on screen.', layout: 'big-text', bgColor: '#D2691E', textColor: '#FFF8DC', fontFamily: "'Gloria Hallelujah', cursive", fontWeight: 700, imageUrl: null, bullets: [], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#8B4513' },
            { id: 4, title: 'WHY IT WORKS', content: 'Familiar materials reduce cognitive load. Users already know how leather and paper "feel."', layout: 'two-column', bgColor: '#FAF0E6', textColor: '#3E2723', fontFamily: "'Caveat', cursive", fontWeight: 700, imageUrl: null, bullets: ['Trust through familiarity', 'Emotional connection', 'Nostalgia factor'], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#DEB887' },
            { id: 5, title: 'GO TACTILE', content: 'Follow @anujmhatre for material design deep dives.', layout: 'hook-content-cta', bgColor: '#8B4513', textColor: '#FAFAFA', fontFamily: "'Caveat', cursive", fontWeight: 700, imageUrl: null, bullets: [], branding: DEFAULT_BRANDING(), elements: [], shape: 'none', shapeColor: '#D2691E' },
        ],
    },
};

const SAMPLE_SLIDES = SAMPLE_STYLES.neoBrutalism.slides;

/* ─── Drag Element Hook ──────────────────────────────── */
function useDragElement(canvasScale, updateElement) {
    const dragRef = useRef(null);

    const onPointerDown = useCallback((e, elemId) => {
        e.stopPropagation();
        const el = e.currentTarget;
        const startX = e.clientX;
        const startY = e.clientY;
        const origX = parseFloat(el.dataset.origX) || 0;
        const origY = parseFloat(el.dataset.origY) || 0;

        dragRef.current = { elemId, startX, startY, origX, origY };
        el.setPointerCapture(e.pointerId);
    }, []);

    const onPointerMove = useCallback((e) => {
        if (!dragRef.current) return;
        const { elemId, startX, startY, origX, origY } = dragRef.current;
        const dx = (e.clientX - startX) / canvasScale;
        const dy = (e.clientY - startY) / canvasScale;
        updateElement(elemId, { x: origX + dx, y: origY + dy });
    }, [canvasScale, updateElement]);

    const onPointerUp = useCallback(() => {
        dragRef.current = null;
    }, []);

    return { onPointerDown, onPointerMove, onPointerUp, dragRef };
}

/* ─── Draggable Text Element ─────────────────────────── */
const DraggableTextElement = React.memo(({ elem, isSelected, onSelect, onUpdate, onPointerDown, onPointerMove, onPointerUp }) => {
    const textRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);

    const handleDoubleClick = useCallback((e) => {
        e.stopPropagation();
        setIsEditing(true);
        setTimeout(() => {
            if (textRef.current) {
                textRef.current.focus();
                // Select all text
                const range = document.createRange();
                range.selectNodeContents(textRef.current);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }, 0);
    }, []);

    const handleBlur = useCallback(() => {
        setIsEditing(false);
        if (textRef.current) {
            const newText = textRef.current.innerText;
            if (newText !== elem.text) {
                onUpdate({ text: newText });
            }
        }
    }, [elem.text, onUpdate]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            textRef.current?.blur();
        }
        if (e.key === 'Escape') {
            textRef.current?.blur();
        }
        // Stop drag while typing
        e.stopPropagation();
    }, []);

    const elemStyle = {
        position: 'absolute',
        left: `${elem.x}px`,
        top: `${elem.y}px`,
        width: `${elem.width || 400}px`,
        fontFamily: elem.style.fontFamily,
        fontSize: `${elem.style.fontSize}px`,
        fontWeight: elem.style.bold ? 900 : elem.style.fontWeight,
        fontStyle: elem.style.italic ? 'italic' : 'normal',
        color: elem.style.color,
        letterSpacing: `${elem.style.letterSpacing}px`,
        textTransform: elem.style.textTransform,
        textAlign: elem.style.textAlign,
        cursor: isEditing ? 'text' : 'move',
        userSelect: isEditing ? 'text' : 'none',
        lineHeight: 1.2,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
    };

    return (
        <div
            ref={textRef}
            className={`slide-element ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''}`}
            style={elemStyle}
            contentEditable={isEditing}
            suppressContentEditableWarning
            spellCheck={false}
            data-orig-x={elem.x}
            data-orig-y={elem.y}
            onPointerDown={(e) => {
                if (isEditing) return;
                onPointerDown(e, elem.id);
                onSelect?.();
            }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onDoubleClick={handleDoubleClick}
            onClick={(e) => e.stopPropagation()}
            onBlur={handleBlur}
            onKeyDown={isEditing ? handleKeyDown : undefined}
        >
            {elem.text}
        </div>
    );
});
DraggableTextElement.displayName = 'DraggableTextElement';

/* ─── Draggable Image Element ────────────────────────── */
const DraggableImageElement = React.memo(({ elem, isSelected, onSelect, onUpdate, onPointerDown, onPointerMove, onPointerUp }) => {
    const [isResizing, setIsResizing] = useState(false);
    const startRef = useRef({});

    const handleResizeStart = useCallback((e) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        startRef.current = { startX: e.clientX, startY: e.clientY, startW: elem.width || 300, startH: (elem.width || 300) / (elem.imageAspect || 1) };
        const onMove = (ev) => {
            const dx = ev.clientX - startRef.current.startX;
            const newW = Math.max(50, startRef.current.startW + dx);
            const newH = newW / (elem.imageAspect || 1);
            onUpdate({ width: newW, height: newH });
        };
        const onUp = () => {
            setIsResizing(false);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    }, [elem.width, elem.imageAspect, onUpdate]);

    return (
        <div
            className={`slide-element slide-element--image ${isSelected ? 'selected' : ''}`}
            style={{
                position: 'absolute',
                left: `${elem.x}px`,
                top: `${elem.y}px`,
                width: `${elem.width || 300}px`,
                height: `${(elem.width || 300) / (elem.imageAspect || 1)}px`,
                cursor: 'move',
                userSelect: 'none',
            }}
            data-orig-x={elem.x}
            data-orig-y={elem.y}
            onPointerDown={(e) => {
                onPointerDown(e, elem.id);
                onSelect?.();
            }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onClick={(e) => e.stopPropagation()}
        >
            <img
                src={elem.imageUrl}
                alt=""
                draggable={false}
                style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
            />
            {isSelected && (
                <div
                    className="slide-resize-handle"
                    onPointerDown={handleResizeStart}
                    style={{
                        position: 'absolute',
                        right: -6,
                        bottom: -6,
                        width: 12,
                        height: 12,
                        background: '#cc3333',
                        cursor: 'se-resize',
                        borderRadius: 2,
                    }}
                />
            )}
        </div>
    );
});
DraggableImageElement.displayName = 'DraggableImageElement';

/* ─── SlideCanvas ────────────────────────────────────── */
const SlideCanvas = React.forwardRef(({ slide, scale, selectedElementId, onSelectElement, onUpdateElement, onBrandingUpdate, showGrid }, ref) => {
    const width = 1080;
    const height = 1350;
    const branding = slide.branding || DEFAULT_BRANDING();

    const updateElement = useCallback((elemId, updates) => {
        if (!onUpdateElement) return;
        const elems = slide.elements || [];
        const newElems = elems.map(el => el.id === elemId ? { ...el, ...updates } : el);
        onUpdateElement(newElems);
    }, [slide.elements, onUpdateElement]);

    const { onPointerDown, onPointerMove, onPointerUp } = useDragElement(scale, updateElement);

    const renderLayout = () => {
        switch (slide.layout) {
            case 'bullet-list':
                return (
                    <div className="slide-layout-bullets">
                        <h1 className="slide-title" style={{ fontFamily: slide.fontFamily, fontWeight: slide.fontWeight }}>
                            {slide.title || 'Slide Title'}
                        </h1>
                        <p className="slide-content">{slide.content || 'Add your content here...'}</p>
                        <ul className="slide-bullets">
                            {(slide.bullets || []).filter(Boolean).map((b, i) => (
                                <li key={i} className="slide-bullet-item">{b}</li>
                            ))}
                        </ul>
                    </div>
                );
            case 'numbered-list':
                return (
                    <div className="slide-layout-numbered">
                        <h1 className="slide-title" style={{ fontFamily: slide.fontFamily, fontWeight: slide.fontWeight }}>
                            {slide.title || 'Slide Title'}
                        </h1>
                        <p className="slide-content">{slide.content || 'Add your content here...'}</p>
                        <ol className="slide-numbered-list">
                            {(slide.bullets || []).filter(Boolean).map((b, i) => (
                                <li key={i} className="slide-numbered-item">{b}</li>
                            ))}
                        </ol>
                    </div>
                );
            case 'big-text':
                return (
                    <div className="slide-layout-bigtext">
                        <h1 className="slide-title slide-title--large" style={{ fontFamily: slide.fontFamily, fontWeight: slide.fontWeight }}>
                            {slide.title || 'Big Statement'}
                        </h1>
                        <p className="slide-content">{slide.content || ''}</p>
                    </div>
                );
            case 'split':
                return (
                    <div className="slide-layout-split">
                        <div className="slide-split-left">
                            <h1 className="slide-title" style={{ fontFamily: slide.fontFamily, fontWeight: slide.fontWeight }}>
                                {slide.title || 'Slide Title'}
                            </h1>
                        </div>
                        <div className="slide-split-right">
                            <p className="slide-content">{slide.content || 'Add your content here...'}</p>
                        </div>
                    </div>
                );
            case 'quote':
                return (
                    <div className="slide-layout-quote">
                        <div className="slide-quote-mark">"</div>
                        <h1 className="slide-title slide-title--quote" style={{ fontFamily: slide.fontFamily, fontWeight: slide.fontWeight }}>
                            {slide.title || 'Quote goes here'}
                        </h1>
                        <p className="slide-content">{slide.content || ''}</p>
                    </div>
                );
            case 'two-column':
                return (
                    <div className="slide-layout-twocol">
                        <div className="slide-twocol-left">
                            <h1 className="slide-title" style={{ fontFamily: slide.fontFamily, fontWeight: slide.fontWeight }}>
                                {slide.title || 'Left Column'}
                            </h1>
                            <p className="slide-content">{slide.content || 'Content goes here...'}</p>
                        </div>
                        <div className="slide-twocol-divider" />
                        <div className="slide-twocol-right">
                            <ul className="slide-bullets">
                                {(slide.bullets || []).filter(Boolean).map((b, i) => (
                                    <li key={i} className="slide-bullet-item">{b}</li>
                                ))}
                                {!(slide.bullets || []).filter(Boolean).length && (
                                    <li className="slide-bullet-item">Add points in the editor</li>
                                )}
                            </ul>
                        </div>
                    </div>
                );
            case 'stats':
                return (
                    <div className="slide-layout-stats">
                        <h1 className="slide-title" style={{ fontFamily: slide.fontFamily, fontWeight: slide.fontWeight }}>
                            {slide.title || 'Key Stats'}
                        </h1>
                        <div className="slide-stats-grid">
                            {(slide.bullets || []).filter(Boolean).map((b, i) => (
                                <div key={i} className="slide-stat-card">
                                    <span className="slide-stat-number">{String(i + 1).padStart(2, '0')}</span>
                                    <span className="slide-stat-text">{b}</span>
                                </div>
                            ))}
                            {!(slide.bullets || []).filter(Boolean).length && (
                                <>
                                    <div className="slide-stat-card"><span className="slide-stat-number">01</span><span className="slide-stat-text">Add stats</span></div>
                                    <div className="slide-stat-card"><span className="slide-stat-number">02</span><span className="slide-stat-text">in the editor</span></div>
                                </>
                            )}
                        </div>
                        <p className="slide-content" style={{ marginTop: '32px' }}>{slide.content || ''}</p>
                    </div>
                );
            case 'checklist':
                return (
                    <div className="slide-layout-checklist">
                        <h1 className="slide-title" style={{ fontFamily: slide.fontFamily, fontWeight: slide.fontWeight }}>
                            {slide.title || 'Checklist'}
                        </h1>
                        <p className="slide-content">{slide.content || ''}</p>
                        <ul className="slide-checklist">
                            {(slide.bullets || []).filter(Boolean).map((b, i) => (
                                <li key={i} className="slide-checklist-item">
                                    <span className="slide-checklist-box">✓</span>
                                    <span className="slide-checklist-text">{b}</span>
                                </li>
                            ))}
                            {!(slide.bullets || []).filter(Boolean).length && (
                                <li className="slide-checklist-item"><span className="slide-checklist-box">✓</span><span className="slide-checklist-text">Add items in the editor</span></li>
                            )}
                        </ul>
                    </div>
                );
            case 'timeline':
                return (
                    <div className="slide-layout-timeline">
                        <h1 className="slide-title" style={{ fontFamily: slide.fontFamily, fontWeight: slide.fontWeight }}>
                            {slide.title || 'Timeline'}
                        </h1>
                        <div className="slide-timeline">
                            {(slide.bullets || []).filter(Boolean).map((b, i) => (
                                <div key={i} className="slide-timeline-item">
                                    <div className="slide-timeline-dot" />
                                    <div className="slide-timeline-content">
                                        <span className="slide-timeline-label">Step {i + 1}</span>
                                        <span className="slide-timeline-text">{b}</span>
                                    </div>
                                </div>
                            ))}
                            {!(slide.bullets || []).filter(Boolean).length && (
                                <>
                                    <div className="slide-timeline-item"><div className="slide-timeline-dot" /><div className="slide-timeline-content"><span className="slide-timeline-label">Step 1</span><span className="slide-timeline-text">Add steps</span></div></div>
                                    <div className="slide-timeline-item"><div className="slide-timeline-dot" /><div className="slide-timeline-content"><span className="slide-timeline-label">Step 2</span><span className="slide-timeline-text">in the editor</span></div></div>
                                </>
                            )}
                        </div>
                    </div>
                );
            case 'testimonial':
                return (
                    <div className="slide-layout-testimonial">
                        <div className="slide-testimonial-quote">"</div>
                        <h1 className="slide-title slide-title--testimonial" style={{ fontFamily: slide.fontFamily, fontWeight: slide.fontWeight }}>
                            {slide.title || ' testimonial goes here'}
                        </h1>
                        <div className="slide-testimonial-author">
                            <div className="slide-testimonial-avatar">{(slide.content || 'A')[0].toUpperCase()}</div>
                            <div className="slide-testimonial-info">
                                <span className="slide-testimonial-name">{slide.content || 'Author Name'}</span>
                                <span className="slide-testimonial-role">{(slide.bullets || [])[0] || 'Role / Company'}</span>
                            </div>
                        </div>
                    </div>
                );
            case 'image-overlay':
                return (
                    <div className="slide-layout-imgoverlay">
                        {slide.imageUrl ? (
                            <img src={slide.imageUrl} alt="" className="slide-imgoverlay-bg" />
                        ) : (
                            <div className="slide-imgoverlay-placeholder">Upload image in editor</div>
                        )}
                        <div className="slide-imgoverlay-content">
                            <h1 className="slide-title" style={{ fontFamily: slide.fontFamily, fontWeight: slide.fontWeight }}>
                                {slide.title || 'Image Title'}
                            </h1>
                            <p className="slide-content">{slide.content || ''}</p>
                        </div>
                    </div>
                );
            case 'hook-content-cta':
            default:
                return (
                    <div className="slide-layout-hook">
                        <h1 className="slide-title" style={{ fontFamily: slide.fontFamily, fontWeight: slide.fontWeight }}>
                            {slide.title || 'Slide Title'}
                        </h1>
                        <div className="slide-divider" />
                        <p className="slide-content">{slide.content || 'Add your content here...'}</p>
                        <div className="slide-cta">→</div>
                    </div>
                );
        }
    };

    const renderShape = (elem) => {
        if (elem.shape === 'none') return null;
        const shapeClass = `slide-shape slide-shape--${elem.shape}`;
        const shapeStyle = {
            backgroundColor: elem.shapeColor || '#CC3333',
            position: 'absolute',
            left: `${elem.x}px`,
            top: `${elem.y}px`,
            width: `${elem.width || 400}px`,
            height: `${elem.height || 120}px`,
        };
        return <div className={shapeClass} style={shapeStyle} />;
    };

    return (
        <div
            ref={ref}
            className={`slide-canvas ${showGrid ? 'slide-canvas--grid' : ''}`}
            style={{
                width: `${width}px`,
                height: `${height}px`,
                backgroundColor: slide.bgColor,
                color: slide.textColor,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
            }}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
        >
            {slide.imageUrl && (
                <div className="slide-image-container">
                    <img src={slide.imageUrl} alt="" className="slide-image" />
                </div>
            )}
            <div className="slide-content-wrapper">
                {renderLayout()}
            </div>

            {/* Draggable / Editable Elements */}
            {(slide.elements || []).map((elem) => (
                <React.Fragment key={elem.id}>
                    {renderShape(elem)}
                    {elem.type === 'text' && (
                        <DraggableTextElement
                            elem={elem}
                            isSelected={selectedElementId === elem.id}
                            onSelect={() => onSelectElement?.(elem.id)}
                            onUpdate={(updates) => updateElement(elem.id, updates)}
                            onPointerDown={onPointerDown}
                            onPointerMove={onPointerMove}
                            onPointerUp={onPointerUp}
                        />
                    )}
                    {elem.type === 'image' && (
                        <DraggableImageElement
                            elem={elem}
                            isSelected={selectedElementId === elem.id}
                            onSelect={() => onSelectElement?.(elem.id)}
                            onUpdate={(updates) => updateElement(elem.id, updates)}
                            onPointerDown={onPointerDown}
                            onPointerMove={onPointerMove}
                            onPointerUp={onPointerUp}
                        />
                    )}
                </React.Fragment>
            ))}

            {/* Branding Footer */}
            <div className={`slide-footer slide-footer--${branding.position}`}>
                <span className="slide-footer-text" style={{ fontSize: `${branding.fontSize}px`, opacity: branding.opacity }}>
                    {branding.text}
                </span>
            </div>

            {/* Draggable Logo */}
            {branding.logoUrl && (
                <img
                    src={branding.logoUrl}
                    alt=""
                    className="slide-logo-element"
                    style={{
                        position: 'absolute',
                        left: `${branding.logoX}px`,
                        top: `${branding.logoY}px`,
                        height: `${branding.logoSize || 32}px`,
                        opacity: branding.logoOpacity ?? branding.opacity,
                        cursor: 'move',
                        userSelect: 'none',
                        zIndex: 10,
                    }}
                    draggable={false}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const origX = branding.logoX;
                        const origY = branding.logoY;
                        const scaleRatio = scale || 1;

                        const onMove = (ev) => {
                            const newX = origX + (ev.clientX - startX) / scaleRatio;
                            const newY = origY + (ev.clientY - startY) / scaleRatio;
                            onUpdateElement?.(slide.elements || []);
                            const newBranding = { ...branding, logoX: Math.max(0, Math.min(1080 - 100, newX)), logoY: Math.max(0, Math.min(1350 - 50, newY)) };
                            onBrandingUpdate?.(newBranding);
                        };
                        const onUp = () => {
                            window.removeEventListener('pointermove', onMove);
                            window.removeEventListener('pointerup', onUp);
                        };
                        window.addEventListener('pointermove', onMove);
                        window.addEventListener('pointerup', onUp);
                    }}
                />
            )}
        </div>
    );
});
SlideCanvas.displayName = 'SlideCanvas';

/* ─── Floating Toolbar ───────────────────────────────── */
const FloatingToolbar = ({ element, onUpdate, onShapeChange, onDelete, onDuplicate }) => {
    if (!element) return null;
    const s = element.style || {};

    const btn = (label, active, onClick) => (
        <button key={label} className={`ce-float-btn ${active ? 'active' : ''}`} onClick={onClick}>{label}</button>
    );

    return (
        <div className="ce-floating-toolbar" onClick={(e) => e.stopPropagation()}>
            <div className="ce-float-group">
                <input
                    type="number"
                    className="ce-float-input"
                    value={s.fontSize || 48}
                    min={12}
                    max={200}
                    onChange={(e) => onUpdate({ style: { ...s, fontSize: parseInt(e.target.value) || 48 } })}
                    title="Font Size"
                />
                <span className="ce-float-unit">px</span>
            </div>
            <div className="ce-float-divider" />
            <div className="ce-float-group">
                {btn('B', s.bold, () => onUpdate({ style: { ...s, bold: !s.bold } }))}
                {btn('I', s.italic, () => onUpdate({ style: { ...s, italic: !s.italic } }))}
            </div>
            <div className="ce-float-divider" />
            <div className="ce-float-group">
                <select
                    className="ce-float-select"
                    value={s.textAlign || 'left'}
                    onChange={(e) => onUpdate({ style: { ...s, textAlign: e.target.value } })}
                >
                    <option value="left">←</option>
                    <option value="center">↔</option>
                    <option value="right">→</option>
                </select>
            </div>
            <div className="ce-float-divider" />
            <div className="ce-float-group">
                <select
                    className="ce-float-select"
                    value={s.textTransform || 'none'}
                    onChange={(e) => onUpdate({ style: { ...s, textTransform: e.target.value } })}
                >
                    <option value="none">Aa</option>
                    <option value="uppercase">AA</option>
                    <option value="lowercase">aa</option>
                </select>
            </div>
            <div className="ce-float-divider" />
            <div className="ce-float-group">
                <input
                    type="number"
                    className="ce-float-input ce-float-input--small"
                    value={s.letterSpacing || 0}
                    min={-10}
                    max={30}
                    onChange={(e) => onUpdate({ style: { ...s, letterSpacing: parseInt(e.target.value) || 0 } })}
                    title="Letter Spacing"
                />
                <span className="ce-float-unit">sp</span>
            </div>
            <div className="ce-float-divider" />
            <div className="ce-float-group">
                <select
                    className="ce-float-select"
                    value={element.shape || 'none'}
                    onChange={(e) => onShapeChange(e.target.value)}
                >
                    {SHAPE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
            </div>
            {element.shape !== 'none' && (
                <>
                    <div className="ce-float-divider" />
                    <div className="ce-float-group">
                        <input
                            type="color"
                            className="ce-float-color"
                            value={element.shapeColor || '#CC3333'}
                            onChange={(e) => onUpdate({ shapeColor: e.target.value })}
                        />
                    </div>
                </>
            )}
            <div className="ce-float-divider" />
            <div className="ce-float-group">
                <select
                    className="ce-float-select"
                    value={s.fontFamily || "'Cabin Sketch', cursive"}
                    onChange={(e) => onUpdate({ style: { ...s, fontFamily: e.target.value } })}
                    title="Font Family"
                >
                    {FONT_OPTIONS.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
                </select>
            </div>
            <div className="ce-float-divider" />
            <div className="ce-float-group">
                <input
                    type="color"
                    className="ce-float-color"
                    value={s.color || '#1A1A1A'}
                    onChange={(e) => onUpdate({ style: { ...s, color: e.target.value } })}
                    title="Text Color"
                />
            </div>
            <div className="ce-float-divider" />
            <div className="ce-float-group">
                <input
                    type="range"
                    className="ce-float-range"
                    min={0.1}
                    max={1}
                    step={0.1}
                    value={element.opacity ?? 1}
                    onChange={(e) => onUpdate({ opacity: parseFloat(e.target.value) })}
                    title="Opacity"
                />
                <span className="ce-float-unit">{Math.round((element.opacity ?? 1) * 100)}%</span>
            </div>
            <div className="ce-float-divider" />
            <div className="ce-float-group">
                <input
                    type="number"
                    className="ce-float-input ce-float-input--small"
                    value={s.lineHeight || 1.2}
                    min={0.5}
                    max={3}
                    step={0.1}
                    onChange={(e) => onUpdate({ style: { ...s, lineHeight: parseFloat(e.target.value) || 1.2 } })}
                    title="Line Height"
                />
                <span className="ce-float-unit">lh</span>
            </div>
            <div className="ce-float-divider" />
            <button className="ce-float-btn" onClick={onDuplicate} title="Duplicate">⧉</button>
            <button className="ce-float-btn ce-float-btn--danger" onClick={onDelete}>×</button>
        </div>
    );
};

/* ─── Main Editor ────────────────────────────────────── */
const CarouselEditor = ({ onClose }) => {
    const [slides, setSlides] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [slideCount, setSlideCount] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);
    const [mcqQuestions, setMcqQuestions] = useState(null);
    const [mcqAnswers, setMcqAnswers] = useState({});
    const [isAskingQuestions, setIsAskingQuestions] = useState(false);
    const [generateError, setGenerateError] = useState(null);
    const [dragIndex, setDragIndex] = useState(null);
    const [selectedElementId, setSelectedElementId] = useState(null);
    const [showGrid, setShowGrid] = useState(false);
    const [editingBranding, setEditingBranding] = useState(false);

    const canvasRefs = useRef({});
    const previewRef = useRef(null);

    const activeSlide = slides[activeIndex] || null;

    const selectedElement = useMemo(() => {
        if (!activeSlide || !selectedElementId) return null;
        return (activeSlide.elements || []).find(el => el.id === selectedElementId) || null;
    }, [activeSlide, selectedElementId]);

    const updateSlide = useCallback((index, updates) => {
        setSlides(prev => {
            const next = [...prev];
            next[index] = { ...next[index], ...updates };
            return next;
        });
    }, []);

    const updateActiveElements = useCallback((elements) => {
        updateSlide(activeIndex, { elements });
    }, [activeIndex, updateSlide]);

    const addElement = useCallback(() => {
        if (!activeSlide) return;
        const elem = DEFAULT_ELEMENT({
            y: 200 + (activeSlide.elements?.length || 0) * 100,
            text: 'New Text',
            style: {
                fontSize: 48,
                fontFamily: activeSlide.fontFamily || "'Cabin Sketch', cursive",
                fontWeight: 700,
                color: activeSlide.textColor || '#1A1A1A',
                bold: false,
                italic: false,
                letterSpacing: 0,
                textTransform: 'none',
                textAlign: 'left',
            },
        });
        const elems = [...(activeSlide.elements || []), elem];
        updateActiveElements(elems);
        setSelectedElementId(elem.id);
    }, [activeSlide, updateActiveElements]);

    const addImageElement = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file || !activeSlide) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                const aspect = img.width / img.height;
                const maxW = 400;
                const w = Math.min(maxW, img.width);
                const h = w / aspect;
                const elem = DEFAULT_ELEMENT({
                    type: 'image',
                    imageUrl: ev.target.result,
                    width: w,
                    height: h,
                    imageAspect: aspect,
                    x: 72 + Math.random() * 200,
                    y: 200 + (activeSlide.elements?.length || 0) * 80,
                    text: '',
                });
                const elems = [...(activeSlide.elements || []), elem];
                updateActiveElements(elems);
                setSelectedElementId(elem.id);
            };
            img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }, [activeSlide, updateActiveElements]);

    const updateElement = useCallback((elemId, updates) => {
        if (!activeSlide) return;
        const elems = (activeSlide.elements || []).map(el =>
            el.id === elemId ? { ...el, ...updates } : el
        );
        updateActiveElements(elems);
    }, [activeSlide, updateActiveElements]);

    const deleteElement = useCallback((elemId) => {
        if (!activeSlide) return;
        const elems = (activeSlide.elements || []).filter(el => el.id !== elemId);
        updateActiveElements(elems);
        setSelectedElementId(null);
    }, [activeSlide, updateActiveElements]);

    const addSlide = useCallback((afterIndex) => {
        setSlides(prev => {
            const next = [...prev];
            next.splice(afterIndex + 1, 0, DEFAULT_SLIDE());
            return next;
        });
        setActiveIndex(prev => prev + 1);
    }, []);

    const deleteSlide = useCallback((index) => {
        if (slides.length <= 1) return;
        setSlides(prev => prev.filter((_, i) => i !== index));
        setActiveIndex(prev => Math.min(prev, slides.length - 2));
    }, [slides.length]);

    const duplicateSlide = useCallback((index) => {
        setSlides(prev => {
            const next = [...prev];
            const copy = { ...next[index], id: Date.now() + Math.random(), elements: (next[index].elements || []).map(e => ({ ...e, id: Date.now() + Math.random() })) };
            next.splice(index + 1, 0, copy);
            return next;
        });
        setActiveIndex(prev => prev + 1);
    }, []);

    const moveSlide = useCallback((from, to) => {
        if (to < 0 || to >= slides.length) return;
        setSlides(prev => {
            const next = [...prev];
            const [item] = next.splice(from, 1);
            next.splice(to, 0, item);
            return next;
        });
        setActiveIndex(to);
    }, [slides.length]);

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) return;

        // If we have MCQ answers, generate with answers
        if (mcqQuestions && Object.keys(mcqAnswers).length > 0) {
            setIsGenerating(true);
            setGenerateError(null);
            try {
                const generated = await generateCarousel(prompt, slideCount, mcqAnswers);
                setSlides(generated.map(s => ({ ...s, branding: s.branding || DEFAULT_BRANDING(), elements: s.elements || [] })));
                setActiveIndex(0);
                setMcqQuestions(null);
                setMcqAnswers({});
            } catch (err) {
                setGenerateError(err.message || 'Generation failed. Try again.');
            } finally {
                setIsGenerating(false);
            }
            return;
        }

        // First: ask MCQ questions
        setIsAskingQuestions(true);
        setGenerateError(null);
        try {
            const response = await fetch('/api/generateCarousel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, slideCount, mode: 'questions' }),
            });
            if (!response.ok) throw new Error('Failed to get questions');
            const data = await response.json();
            setMcqQuestions(data.questions || []);
        } catch (err) {
            // If questions fail, go straight to generate
            setGenerateError(null);
            setIsAskingQuestions(false);
            setIsGenerating(true);
            try {
                const generated = await generateCarousel(prompt, slideCount);
                setSlides(generated.map(s => ({ ...s, branding: s.branding || DEFAULT_BRANDING(), elements: s.elements || [] })));
                setActiveIndex(0);
            } catch (err2) {
                setGenerateError(err2.message || 'Generation failed. Try again.');
            } finally {
                setIsGenerating(false);
            }
        } finally {
            setIsAskingQuestions(false);
        }
    }, [prompt, slideCount, mcqQuestions, mcqAnswers]);

    const handleExportSingle = useCallback(async (index) => {
        const ref = canvasRefs.current[index];
        if (!ref) return;
        setIsExporting(true);
        try {
            const dataUrl = await toPng(ref, { width: 1080, height: 1350, pixelRatio: 2 });
            const link = document.createElement('a');
            link.download = `carousel-slide-${index + 1}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) { console.error('Export failed:', err); }
        setIsExporting(false);
    }, []);

    const handleExportAll = useCallback(async () => {
        setIsExporting(true);
        try {
            const zip = new JSZip();
            for (let i = 0; i < slides.length; i++) {
                const ref = canvasRefs.current[i];
                if (!ref) continue;
                const dataUrl = await toPng(ref, { width: 1080, height: 1350, pixelRatio: 2 });
                const blob = await (await fetch(dataUrl)).blob();
                zip.file(`slide-${i + 1}.png`, blob);
            }
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, 'carousel-slides.zip');
        } catch (err) { console.error('Export all failed:', err); }
        setIsExporting(false);
    }, [slides]);

    const handleImageUpload = useCallback((index, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => updateSlide(index, { imageUrl: ev.target.result });
        reader.readAsDataURL(file);
    }, [updateSlide]);

    const handleBrandingLogoUpload = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file || !activeSlide) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const branding = { ...(activeSlide.branding || DEFAULT_BRANDING()), logoUrl: ev.target.result };
            updateSlide(activeIndex, { branding });
        };
        reader.readAsDataURL(file);
    }, [activeSlide, activeIndex, updateSlide]);

    const handleDragStart = useCallback((e, index) => {
        setDragIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDragOver = useCallback((e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }, []);

    const handleDrop = useCallback((e, index) => {
        e.preventDefault();
        if (dragIndex !== null && dragIndex !== index) moveSlide(dragIndex, index);
        setDragIndex(null);
    }, [dragIndex, moveSlide]);

    const canvasScale = useMemo(() => {
        if (typeof window === 'undefined') return 0.35;
        const maxW = Math.min(window.innerWidth * 0.5, 600);
        return Math.min(maxW / 1080, 0.45);
    }, []);

    return (
        <div className="carousel-editor">
            {/* Top Bar */}
            <div className="ce-topbar">
                <div className="ce-topbar-left">
                    <span className="ce-logo">CAROUSEL</span>
                    <span className="ce-subtitle">AI Instagram Carousel Creator</span>
                </div>
                <div className="ce-topbar-right">
                    {slides.length > 0 && (
                        <>
                            <button className="ce-btn ce-btn--ghost" onClick={() => setIsPreviewing(!isPreviewing)}>
                                {isPreviewing ? 'Exit Preview' : 'Preview'}
                            </button>
                            <button className="ce-btn ce-btn--ghost" onClick={handleExportAll} disabled={isExporting}>
                                Export All ZIP
                            </button>
                        </>
                    )}
                    <button className="ce-btn ce-btn--ghost" onClick={() => setShowGrid(!showGrid)}>
                        Grid {showGrid ? 'ON' : 'OFF'}
                    </button>
                    <button className="ce-btn ce-btn--close" onClick={onClose} aria-label="Close">
                        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
                    </button>
                </div>
            </div>

            <div className="ce-body">
                {/* Left Panel */}
                <div className="ce-panel ce-panel--left">
                    {slides.length === 0 ? (
                        <div className="ce-prompt-section">
                            <h2 className="ce-heading">Create a Carousel</h2>
                            <p className="ce-hint">Enter a topic and the AI will generate your carousel slides.</p>
                            <textarea
                                className="ce-prompt-input"
                                placeholder="e.g. 5 tips for better code reviews..."
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows={4}
                            />
                            {generateError && <div className="ce-error-msg">{generateError}</div>}
                            <div className="ce-slide-count">
                                <label className="ce-label">Slides: {slideCount}</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input type="range" min="2" max="50" value={slideCount} onChange={(e) => setSlideCount(parseInt(e.target.value))} style={{ flex: 1 }} />
                                    <input type="number" min="2" max="50" value={slideCount} onChange={(e) => { const v = parseInt(e.target.value); if (v >= 2 && v <= 50) setSlideCount(v); }} className="ce-input" style={{ width: '3rem', textAlign: 'center' }} />
                                </div>
                            </div>

                            {/* MCQ Questions */}
                            {mcqQuestions && mcqQuestions.length > 0 && (
                                <div className="ce-mcq-section">
                                    <div className="ce-mcq-header">
                                        <span className="ce-mcq-icon">◈</span>
                                        <span className="ce-label">AI has some questions to personalize your carousel:</span>
                                    </div>
                                    {mcqQuestions.map((q) => (
                                        <div key={q.id} className="ce-mcq-question">
                                            <p className="ce-mcq-q">{q.question}</p>
                                            <div className="ce-mcq-options">
                                                {q.options.map((opt, i) => (
                                                    <button
                                                        key={i}
                                                        className={`ce-mcq-option ${mcqAnswers[q.id] === opt ? 'selected' : ''}`}
                                                        onClick={() => setMcqAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                                    >
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        className="ce-btn ce-btn--primary ce-btn--full"
                                        onClick={handleGenerate}
                                        disabled={isGenerating || Object.keys(mcqAnswers).length === 0}
                                    >
                                        {isGenerating ? 'Generating...' : 'Generate With My Choices'}
                                    </button>
                                    <button className="ce-btn ce-btn--ghost ce-btn--full" onClick={() => { setMcqQuestions(null); setMcqAnswers({}); }}>
                                        Skip Questions
                                    </button>
                                </div>
                            )}

                            {!mcqQuestions && (
                                <button className="ce-btn ce-btn--primary ce-btn--full" onClick={handleGenerate} disabled={isGenerating || isAskingQuestions || !prompt.trim()}>
                                    {isAskingQuestions ? 'Thinking...' : isGenerating ? 'Generating...' : 'Generate Carousel'}
                                </button>
                            )}

                            <div className="ce-sample-styles">
                                <span className="ce-label" style={{ fontSize: '0.7rem', marginBottom: '0.4rem', display: 'block' }}>Load Sample Style</span>
                                {Object.entries(SAMPLE_STYLES).map(([key, style]) => (
                                    <button key={key} className="ce-btn ce-btn--ghost ce-btn--style" onClick={() => { setSlides(style.slides.map((s, i) => ({ ...s, id: Date.now() + i }))); setActiveIndex(0); }}>
                                        {style.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="ce-slides-section">
                            <div className="ce-slides-header">
                                <span className="ce-label">{slides.length} Slides</span>
                                <button className="ce-btn ce-btn--small" onClick={() => { setSlides([]); setActiveIndex(0); setPrompt(''); }}>Clear All</button>
                            </div>
                            <div className="ce-slide-thumbnails">
                                {slides.map((slide, i) => (
                                    <div
                                        key={slide.id}
                                        className={`ce-thumb ${i === activeIndex ? 'active' : ''} ${dragIndex === i ? 'dragging' : ''}`}
                                        onClick={() => { setActiveIndex(i); setIsPreviewing(false); setSelectedElementId(null); }}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, i)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, i)}
                                    >
                                        <div className="ce-thumb-number">{i + 1}</div>
                                        <div className="ce-thumb-preview" style={{ backgroundColor: slide.bgColor, color: slide.textColor }}>
                                            <span className="ce-thumb-title">{slide.title || 'Untitled'}</span>
                                        </div>
                                        <div className="ce-thumb-actions">
                                            <button onClick={(e) => { e.stopPropagation(); moveSlide(i, i - 1); }} disabled={i === 0}>↑</button>
                                            <button onClick={(e) => { e.stopPropagation(); moveSlide(i, i + 1); }} disabled={i === slides.length - 1}>↓</button>
                                            <button onClick={(e) => { e.stopPropagation(); duplicateSlide(i); }}>⧉</button>
                                            <button onClick={(e) => { e.stopPropagation(); deleteSlide(i); }} disabled={slides.length <= 1}>×</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="ce-btn ce-btn--ghost ce-btn--full" onClick={() => addSlide(slides.length - 1)}>
                                + Add Slide
                            </button>
                        </div>
                    )}
                </div>

                {/* Center — Canvas */}
                <div className="ce-canvas-area" onClick={() => setSelectedElementId(null)}>
                    {activeSlide && !isPreviewing ? (
                        <>
                            <FloatingToolbar
                                element={selectedElement}
                                onUpdate={(updates) => updateElement(selectedElementId, updates)}
                                onShapeChange={(shape) => updateElement(selectedElementId, { shape })}
                                onDelete={() => deleteElement(selectedElementId)}
                                onDuplicate={() => {
                                    const orig = (activeSlide.elements || []).find(el => el.id === selectedElementId);
                                    if (orig) {
                                        const dup = { ...orig, id: Date.now() + Math.random(), x: (orig.x || 0) + 20, y: (orig.y || 0) + 20, text: orig.text };
                                        updateActiveElements([...(activeSlide.elements || []), dup]);
                                    }
                                }}
                            />
                            <div className="ce-canvas-wrapper" style={{ width: 1080 * canvasScale, height: 1350 * canvasScale }}>
                                <SlideCanvas
                                    ref={(el) => { canvasRefs.current[activeIndex] = el; }}
                                    slide={activeSlide}
                                    scale={canvasScale}
                                    selectedElementId={selectedElementId}
                                    onSelectElement={(id) => { setSelectedElementId(id); }}
                                    onUpdateElement={updateActiveElements}
                                    onBrandingUpdate={(b) => updateSlide(activeIndex, { branding: b })}
                                    showGrid={showGrid}
                                />
                            </div>
                            <div className="ce-add-btns">
                                <button className="ce-add-element-btn" onClick={addElement}>
                                    + Add Text
                                </button>
                                <label className="ce-add-element-btn ce-add-element-btn--image">
                                    + Add Image
                                    <input type="file" accept="image/*" onChange={addImageElement} style={{ display: 'none' }} />
                                </label>
                            </div>
                        </>
                    ) : activeSlide && isPreviewing ? (
                        <div className="ce-preview-container" ref={previewRef}>
                            {slides.map((slide, i) => (
                                <div key={slide.id} className="ce-preview-slide">
                                    <div className="ce-preview-label">Slide {i + 1}</div>
                                    <SlideCanvas ref={(el) => { canvasRefs.current[i] = el; }} slide={slide} scale={0.3} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="ce-empty-state">
                            <div className="ce-empty-icon">◈</div>
                            <p>Create a carousel to get started</p>
                        </div>
                    )}
                </div>

                {/* Right Panel — Settings */}
                {activeSlide && !isPreviewing && (
                    <div className="ce-panel ce-panel--right">
                        <div className="ce-settings">
                            <h3 className="ce-settings-title">Slide {activeIndex + 1}</h3>

                            <div className="ce-field">
                                <label className="ce-label">Layout</label>
                                <select className="ce-select" value={activeSlide.layout} onChange={(e) => updateSlide(activeIndex, { layout: e.target.value })}>
                                    {LAYOUT_OPTIONS.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                                </select>
                            </div>

                            <div className="ce-field">
                                <label className="ce-label">Title</label>
                                <input className="ce-input" type="text" value={activeSlide.title} onChange={(e) => updateSlide(activeIndex, { title: e.target.value })} placeholder="Slide title" />
                            </div>

                            <div className="ce-field">
                                <label className="ce-label">Content</label>
                                <textarea className="ce-textarea" value={activeSlide.content} onChange={(e) => updateSlide(activeIndex, { content: e.target.value })} placeholder="Slide content" rows={3} />
                            </div>

                            {(activeSlide.layout === 'bullet-list' || activeSlide.layout === 'numbered-list') && (
                                <div className="ce-field">
                                    <label className="ce-label">Points</label>
                                    {(activeSlide.bullets || []).map((b, i) => (
                                        <div key={i} className="ce-bullet-row">
                                            <input className="ce-input ce-input--small" type="text" value={b} onChange={(e) => { const nb = [...(activeSlide.bullets || [])]; nb[i] = e.target.value; updateSlide(activeIndex, { bullets: nb }); }} placeholder={`Point ${i + 1}`} />
                                            <button className="ce-btn ce-btn--tiny" onClick={() => { const nb = (activeSlide.bullets || []).filter((_, j) => j !== i); updateSlide(activeIndex, { bullets: nb }); }}>×</button>
                                        </div>
                                    ))}
                                    <button className="ce-btn ce-btn--ghost ce-btn--small" onClick={() => updateSlide(activeIndex, { bullets: [...(activeSlide.bullets || []), ''] })}>+ Add Point</button>
                                </div>
                            )}

                            <div className="ce-field">
                                <label className="ce-label">Image</label>
                                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(activeIndex, e)} className="ce-file-input" />
                                {activeSlide.imageUrl && <button className="ce-btn ce-btn--tiny" onClick={() => updateSlide(activeIndex, { imageUrl: null })}>Remove Image</button>}
                            </div>

                            <div className="ce-field">
                                <label className="ce-label">Background</label>
                                <div className="ce-color-grid">
                                    {COLOR_PALETTE.map(c => (
                                        <button key={c.value} className={`ce-color-swatch ${activeSlide.bgColor === c.value ? 'active' : ''}`} style={{ backgroundColor: c.value }} onClick={() => updateSlide(activeIndex, { bgColor: c.value })} title={c.label} />
                                    ))}
                                </div>
                            </div>

                            <div className="ce-field">
                                <label className="ce-label">Text Color</label>
                                <div className="ce-color-grid">
                                    {COLOR_PALETTE.map(c => (
                                        <button key={c.value} className={`ce-color-swatch ${activeSlide.textColor === c.value ? 'active' : ''}`} style={{ backgroundColor: c.value, border: c.value === '#FAFAFA' ? '1px solid #ccc' : 'none' }} onClick={() => updateSlide(activeIndex, { textColor: c.value })} title={c.label} />
                                    ))}
                                </div>
                            </div>

                            <div className="ce-field">
                                <label className="ce-label">Font</label>
                                <select className="ce-select" value={activeSlide.fontFamily} onChange={(e) => updateSlide(activeIndex, { fontFamily: e.target.value })}>
                                    {FONT_OPTIONS.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
                                </select>
                            </div>

                            {/* ─── Branding Section ───────────────── */}
                            <div className="ce-divider" />
                            <div className="ce-field">
                                <label className="ce-label">Branding</label>
                                <input className="ce-input" type="text" value={activeSlide.branding?.text || ''} onChange={(e) => { const branding = { ...(activeSlide.branding || DEFAULT_BRANDING()), text: e.target.value }; updateSlide(activeIndex, { branding }); }} placeholder="@yourname" />
                            </div>
                            <div className="ce-field">
                                <label className="ce-label">Brand Font Size</label>
                                <input type="range" min="12" max="48" value={activeSlide.branding?.fontSize || 24} onChange={(e) => { const branding = { ...(activeSlide.branding || DEFAULT_BRANDING()), fontSize: parseInt(e.target.value) }; updateSlide(activeIndex, { branding }); }} style={{ width: '100%' }} />
                            </div>
                            <div className="ce-field">
                                <label className="ce-label">Brand Opacity</label>
                                <input type="range" min="0.1" max="1" step="0.05" value={activeSlide.branding?.opacity || 0.5} onChange={(e) => { const branding = { ...(activeSlide.branding || DEFAULT_BRANDING()), opacity: parseFloat(e.target.value) }; updateSlide(activeIndex, { branding }); }} style={{ width: '100%' }} />
                            </div>
                            <div className="ce-field">
                                <label className="ce-label">Brand Position</label>
                                <select className="ce-select" value={activeSlide.branding?.position || 'bottom-right'} onChange={(e) => { const branding = { ...(activeSlide.branding || DEFAULT_BRANDING()), position: e.target.value }; updateSlide(activeIndex, { branding }); }}>
                                    <option value="bottom-left">Bottom Left</option>
                                    <option value="bottom-center">Bottom Center</option>
                                    <option value="bottom-right">Bottom Right</option>
                                </select>
                            </div>
                            <div className="ce-field">
                                <label className="ce-label">Brand Logo</label>
                                <input type="file" accept="image/*" onChange={handleBrandingLogoUpload} className="ce-file-input" />
                                {activeSlide.branding?.logoUrl && <button className="ce-btn ce-btn--tiny" onClick={() => { const branding = { ...(activeSlide.branding || DEFAULT_BRANDING()), logoUrl: null }; updateSlide(activeIndex, { branding }); }}>Remove Logo</button>}
                            </div>
                            {activeSlide.branding?.logoUrl && (
                                <div className="ce-field">
                                    <label className="ce-label">Logo Size</label>
                                    <input type="range" min="16" max="80" value={activeSlide.branding?.logoSize || 32} onChange={(e) => { const branding = { ...(activeSlide.branding || DEFAULT_BRANDING()), logoSize: parseInt(e.target.value) }; updateSlide(activeIndex, { branding }); }} style={{ width: '100%' }} />
                                </div>
                            )}

                            <div className="ce-divider" />
                            <div className="ce-field">
                                <label className="ce-label">Actions</label>
                                <div className="ce-action-row">
                                    <button className="ce-btn ce-btn--ghost" onClick={() => handleExportSingle(activeIndex)}>Export PNG</button>
                                    <button className="ce-btn ce-btn--ghost" onClick={() => duplicateSlide(activeIndex)}>Duplicate</button>
                                    <button className="ce-btn ce-btn--danger" onClick={() => deleteSlide(activeIndex)} disabled={slides.length <= 1}>Delete</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CarouselEditor;
