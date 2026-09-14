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
];

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
});

const SAMPLE_SLIDES = [
    {
        id: 1,
        title: '5 Ways to Boost Your Creativity',
        content: 'Small habits that make a big difference in your daily creative workflow.',
        layout: 'hook-content-cta',
        bgColor: '#FAFAFA',
        textColor: '#1A1A1A',
        fontFamily: "'Cabin Sketch', cursive",
        fontWeight: 700,
        imageUrl: null,
        bullets: [],
    },
    {
        id: 2,
        title: 'Start With Morning Pages',
        content: 'Write 3 pages every morning. No rules, no judgment. Just dump your thoughts onto paper.',
        layout: 'bullet-list',
        bgColor: '#F5F0E6',
        textColor: '#1A1A1A',
        fontFamily: "'Cabin Sketch', cursive",
        fontWeight: 700,
        imageUrl: null,
        bullets: ['Clears mental clutter', 'Sparks new ideas', 'Takes only 20 minutes'],
    },
    {
        id: 3,
        title: 'Take Walks Without Your Phone',
        content: 'Boredom is the birthplace of creativity. Let your mind wander.',
        layout: 'big-text',
        bgColor: '#E8E2D5',
        textColor: '#1A1A1A',
        fontFamily: "'Rubik Scribble', cursive",
        fontWeight: 400,
        imageUrl: null,
        bullets: [],
    },
    {
        id: 4,
        title: 'Try the 2-Minute Rule',
        content: 'If a creative idea takes less than 2 minutes, do it now. Don\'t overthink.',
        layout: 'numbered-list',
        bgColor: '#FAFAFA',
        textColor: '#1A1A1A',
        fontFamily: "'Cabin Sketch', cursive",
        fontWeight: 700,
        imageUrl: null,
        bullets: ['Sketch it', 'Write it down', 'Record a voice note'],
    },
    {
        id: 5,
        title: 'Save This For Later',
        content: 'Follow @anujmhatre for more creative tips and engineering insights.',
        layout: 'hook-content-cta',
        bgColor: '#0A0A0A',
        textColor: '#FAFAFA',
        fontFamily: "'Rubik Scribble', cursive",
        fontWeight: 400,
        imageUrl: null,
        bullets: [],
    },
];

const SlideCanvas = React.forwardRef(({ slide, scale }, ref) => {
    const width = 1080;
    const height = 1350;

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

    return (
        <div
            ref={ref}
            className="slide-canvas"
            style={{
                width: `${width}px`,
                height: `${height}px`,
                backgroundColor: slide.bgColor,
                color: slide.textColor,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
            }}
        >
            {slide.imageUrl && (
                <div className="slide-image-container">
                    <img src={slide.imageUrl} alt="" className="slide-image" />
                </div>
            )}
            <div className="slide-content-wrapper">
                {renderLayout()}
            </div>
            <div className="slide-footer">
                <span className="slide-footer-text">@anujmhatre</span>
            </div>
        </div>
    );
});

SlideCanvas.displayName = 'SlideCanvas';

const CarouselEditor = ({ onClose }) => {
    const [slides, setSlides] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [slideCount, setSlideCount] = useState(5);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateError, setGenerateError] = useState(null);
    const [dragIndex, setDragIndex] = useState(null);

    const canvasRefs = useRef({});
    const previewRef = useRef(null);

    const activeSlide = slides[activeIndex] || null;

    const updateSlide = useCallback((index, updates) => {
        setSlides(prev => {
            const next = [...prev];
            next[index] = { ...next[index], ...updates };
            return next;
        });
    }, []);

    const addSlide = useCallback((afterIndex) => {
        setSlides(prev => {
            const next = [...prev];
            const newSlide = DEFAULT_SLIDE();
            next.splice(afterIndex + 1, 0, newSlide);
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
            const copy = { ...next[index], id: Date.now() + Math.random() };
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
        setIsGenerating(true);
        setGenerateError(null);
        try {
            const generated = await generateCarousel(prompt, slideCount);
            setSlides(generated);
            setActiveIndex(0);
        } catch (err) {
            console.error('Generation failed:', err);
            setGenerateError(err.message || 'Generation failed. Try again.');
        } finally {
            setIsGenerating(false);
        }
    }, [prompt, slideCount]);

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
        } catch (err) {
            console.error('Export failed:', err);
        }
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
        } catch (err) {
            console.error('Export all failed:', err);
        }
        setIsExporting(false);
    }, [slides]);

    const handleImageUpload = useCallback((index, e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            updateSlide(index, { imageUrl: ev.target.result });
        };
        reader.readAsDataURL(file);
    }, [updateSlide]);

    // Drag reorder
    const handleDragStart = useCallback((e, index) => {
        setDragIndex(index);
        e.dataTransfer.effectAllowed = 'move';
    }, []);

    const handleDragOver = useCallback((e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e, index) => {
        e.preventDefault();
        if (dragIndex !== null && dragIndex !== index) {
            moveSlide(dragIndex, index);
        }
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
                            <button
                                className="ce-btn ce-btn--ghost"
                                onClick={() => setIsPreviewing(!isPreviewing)}
                            >
                                {isPreviewing ? 'Exit Preview' : 'Preview'}
                            </button>
                            <button
                                className="ce-btn ce-btn--ghost"
                                onClick={handleExportAll}
                                disabled={isExporting}
                            >
                                Export All ZIP
                            </button>
                        </>
                    )}
                    <button className="ce-btn ce-btn--close" onClick={onClose} aria-label="Close">
                        <svg viewBox="0 0 24 24" width="20" height="20"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" fill="none" /></svg>
                    </button>
                </div>
            </div>

            <div className="ce-body">
                {/* Left Panel — Prompt & Slides */}
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
                            {generateError && (
                                <div className="ce-error-msg">{generateError}</div>
                            )}
                              <div className="ce-slide-count">
                                  <label className="ce-label">Slides: {slideCount}</label>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <input
                                          type="range"
                                          min="2"
                                          max="50"
                                          value={slideCount}
                                          onChange={(e) => setSlideCount(parseInt(e.target.value))}
                                          style={{ flex: 1 }}
                                      />
                                      <input
                                          type="number"
                                          min="2"
                                          max="50"
                                          value={slideCount}
                                          onChange={(e) => {
                                              const v = parseInt(e.target.value);
                                              if (v >= 2 && v <= 50) setSlideCount(v);
                                          }}
                                          className="ce-input"
                                          style={{ width: '3rem', textAlign: 'center' }}
                                      />
                                  </div>
                              </div>
                            <button
                                className="ce-btn ce-btn--primary ce-btn--full"
                                onClick={handleGenerate}
                                disabled={isGenerating || !prompt.trim()}
                            >
                                {isGenerating ? 'Generating...' : 'Generate Carousel'}
                            </button>
                            <button
                                className="ce-btn ce-btn--ghost ce-btn--full"
                                onClick={() => {
                                    setSlides(SAMPLE_SLIDES.map((s, i) => ({ ...s, id: Date.now() + i })));
                                    setActiveIndex(0);
                                }}
                            >
                                Load Sample
                            </button>
                        </div>
                    ) : (
                        <div className="ce-slides-section">
                            <div className="ce-slides-header">
                                <span className="ce-label">{slides.length} Slides</span>
                                <button className="ce-btn ce-btn--small" onClick={() => {
                                    setSlides([]);
                                    setActiveIndex(0);
                                    setPrompt('');
                                }}>Clear All</button>
                            </div>
                            <div className="ce-slide-thumbnails">
                                {slides.map((slide, i) => (
                                    <div
                                        key={slide.id}
                                        className={`ce-thumb ${i === activeIndex ? 'active' : ''} ${dragIndex === i ? 'dragging' : ''}`}
                                        onClick={() => { setActiveIndex(i); setIsPreviewing(false); }}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, i)}
                                        onDragOver={(e) => handleDragOver(e, i)}
                                        onDrop={(e) => handleDrop(e, i)}
                                    >
                                        <div className="ce-thumb-number">{i + 1}</div>
                                        <div
                                            className="ce-thumb-preview"
                                            style={{ backgroundColor: slide.bgColor, color: slide.textColor }}
                                        >
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
                <div className="ce-canvas-area">
                    {activeSlide && !isPreviewing ? (
                        <div className="ce-canvas-wrapper" style={{ width: 1080 * canvasScale, height: 1350 * canvasScale }}>
                            <SlideCanvas
                                ref={(el) => { canvasRefs.current[activeIndex] = el; }}
                                slide={activeSlide}
                                scale={canvasScale}
                            />
                        </div>
                    ) : activeSlide && isPreviewing ? (
                        <div className="ce-preview-container" ref={previewRef}>
                            {slides.map((slide, i) => (
                                <div key={slide.id} className="ce-preview-slide">
                                    <div className="ce-preview-label">Slide {i + 1}</div>
                                    <SlideCanvas
                                        ref={(el) => { canvasRefs.current[i] = el; }}
                                        slide={slide}
                                        scale={0.3}
                                    />
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

                {/* Right Panel — Slide Settings */}
                {activeSlide && !isPreviewing && (
                    <div className="ce-panel ce-panel--right">
                        <div className="ce-settings">
                            <h3 className="ce-settings-title">Slide {activeIndex + 1}</h3>

                            <div className="ce-field">
                                <label className="ce-label">Layout</label>
                                <select
                                    className="ce-select"
                                    value={activeSlide.layout}
                                    onChange={(e) => updateSlide(activeIndex, { layout: e.target.value })}
                                >
                                    {LAYOUT_OPTIONS.map(l => (
                                        <option key={l.id} value={l.id}>{l.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="ce-field">
                                <label className="ce-label">Title</label>
                                <input
                                    className="ce-input"
                                    type="text"
                                    value={activeSlide.title}
                                    onChange={(e) => updateSlide(activeIndex, { title: e.target.value })}
                                    placeholder="Slide title"
                                />
                            </div>

                            <div className="ce-field">
                                <label className="ce-label">Content</label>
                                <textarea
                                    className="ce-textarea"
                                    value={activeSlide.content}
                                    onChange={(e) => updateSlide(activeIndex, { content: e.target.value })}
                                    placeholder="Slide content"
                                    rows={3}
                                />
                            </div>

                            {(activeSlide.layout === 'bullet-list' || activeSlide.layout === 'numbered-list') && (
                                <div className="ce-field">
                                    <label className="ce-label">Points</label>
                                    {(activeSlide.bullets || []).map((b, i) => (
                                        <div key={i} className="ce-bullet-row">
                                            <input
                                                className="ce-input ce-input--small"
                                                type="text"
                                                value={b}
                                                onChange={(e) => {
                                                    const newBullets = [...(activeSlide.bullets || [])];
                                                    newBullets[i] = e.target.value;
                                                    updateSlide(activeIndex, { bullets: newBullets });
                                                }}
                                                placeholder={`Point ${i + 1}`}
                                            />
                                            <button
                                                className="ce-btn ce-btn--tiny"
                                                onClick={() => {
                                                    const newBullets = (activeSlide.bullets || []).filter((_, j) => j !== i);
                                                    updateSlide(activeIndex, { bullets: newBullets });
                                                }}
                                            >×</button>
                                        </div>
                                    ))}
                                    <button
                                        className="ce-btn ce-btn--ghost ce-btn--small"
                                        onClick={() => updateSlide(activeIndex, { bullets: [...(activeSlide.bullets || []), ''] })}
                                    >+ Add Point</button>
                                </div>
                            )}

                            <div className="ce-field">
                                <label className="ce-label">Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(activeIndex, e)}
                                    className="ce-file-input"
                                />
                                {activeSlide.imageUrl && (
                                    <button
                                        className="ce-btn ce-btn--tiny"
                                        onClick={() => updateSlide(activeIndex, { imageUrl: null })}
                                    >Remove Image</button>
                                )}
                            </div>

                            <div className="ce-field">
                                <label className="ce-label">Background</label>
                                <div className="ce-color-grid">
                                    {COLOR_PALETTE.map(c => (
                                        <button
                                            key={c.value}
                                            className={`ce-color-swatch ${activeSlide.bgColor === c.value ? 'active' : ''}`}
                                            style={{ backgroundColor: c.value }}
                                            onClick={() => updateSlide(activeIndex, { bgColor: c.value })}
                                            title={c.label}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="ce-field">
                                <label className="ce-label">Text Color</label>
                                <div className="ce-color-grid">
                                    {COLOR_PALETTE.map(c => (
                                        <button
                                            key={c.value}
                                            className={`ce-color-swatch ${activeSlide.textColor === c.value ? 'active' : ''}`}
                                            style={{ backgroundColor: c.value, border: c.value === '#FAFAFA' ? '1px solid #ccc' : 'none' }}
                                            onClick={() => updateSlide(activeIndex, { textColor: c.value })}
                                            title={c.label}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="ce-field">
                                <label className="ce-label">Font</label>
                                <select
                                    className="ce-select"
                                    value={activeSlide.fontFamily}
                                    onChange={(e) => updateSlide(activeIndex, { fontFamily: e.target.value })}
                                >
                                    {FONT_OPTIONS.map(f => (
                                        <option key={f.label} value={f.value}>{f.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="ce-field">
                                <label className="ce-label">Actions</label>
                                <div className="ce-action-row">
                                    <button className="ce-btn ce-btn--ghost" onClick={() => handleExportSingle(activeIndex)}>
                                        Export PNG
                                    </button>
                                    <button className="ce-btn ce-btn--ghost" onClick={() => duplicateSlide(activeIndex)}>
                                        Duplicate
                                    </button>
                                    <button className="ce-btn ce-btn--danger" onClick={() => deleteSlide(activeIndex)} disabled={slides.length <= 1}>
                                        Delete
                                    </button>
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
