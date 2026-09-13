import { useEffect, useRef } from 'react';
import { useScene } from '../context/SceneContext';

/**
 * useDocumentMeta — Dynamic Meta Tags & Virtual Routing (History API)
 * 
 * Updates the browser URL, page title, and meta description
 * whenever the user enters/exits a 3D room. Also handles the
 * browser back/forward buttons for seamless navigation.
 */

const ROOM_META = {
    null: {
        path: '/',
        title: 'Anuj Mhatre — Creative 3D Portfolio',
        description: 'Interactive 3D developer portfolio by Anuj Mhatre. Explore AI agents, hardware projects & GSAP animations in a hand-drawn gallery.',
    },
    about: {
        path: '/about',
        title: 'About Me — Anuj Mhatre Portfolio',
        description: 'Learn about Anuj Mhatre — a creative engineer specializing in AI agents, 3D web experiences, React, Three.js, and hardware projects.',
    },
    gallery: {
        path: '/gallery',
        title: 'Gallery & Projects — Anuj Mhatre Portfolio',
        description: 'Browse the interactive 3D gallery of projects by Anuj Mhatre. Each project is displayed as a hand-drawn card you can flip and explore.',
    },
    studio: {
        path: '/studio',
        title: 'The Studio — Anuj Mhatre Portfolio',
        description: 'Explore Anuj Mhatre\'s content studio — projects, blog posts, and experiments displayed on floating monitors in an immersive 3D space.',
    },
    contact: {
        path: '/contact',
        title: 'Contact — Anuj Mhatre Portfolio',
        description: 'Get in touch with Anuj Mhatre. Find social media links and contact information in this interactive 3D contact room.',
    },
    carousel: {
        path: '/carousel',
        title: 'Carousel Creator — Anuj Mhatre Portfolio',
        description: 'AI-powered Instagram carousel creator. Generate, edit and export beautiful carousel slides.',
    },
};

// Map URL paths back to room IDs for deep linking
const PATH_TO_ROOM = {
    '/': null,
    '/about': 'about',
    '/gallery': 'gallery',
    '/studio': 'studio',
    '/contact': 'contact',
    '/carousel': 'carousel',
};

/**
 * Returns the room ID that the initial URL points to (for deep linking).
 * Call this once at app startup to determine if we need to auto-teleport.
 */
export function getInitialRoomFromUrl() {
    const path = window.location.pathname.replace(/\/+$/, '') || '/';
    return PATH_TO_ROOM[path] !== undefined ? PATH_TO_ROOM[path] : null;
}

export function useDocumentMeta() {
    const { currentRoom, teleportTo, hasEntered, exitRoom, cancelTeleport, isTeleporting } = useScene();
    const isHandlingPopState = useRef(false);
    const lastPushedRoom = useRef(undefined); // Track what we last pushed to avoid duplicates

    // Update document meta and URL when room changes
    useEffect(() => {
        const roomKey = currentRoom === null ? 'null' : currentRoom;
        const meta = ROOM_META[roomKey] || ROOM_META['null'];

        // Update the page title
        document.title = meta.title;

        // Update meta description
        const descTag = document.querySelector('meta[name="description"]');
        if (descTag) {
            descTag.setAttribute('content', meta.description);
        }

        // Update OG meta tags
        const ogTitle = document.querySelector('meta[property="og:title"]');
        if (ogTitle) ogTitle.setAttribute('content', meta.title);

        const ogDesc = document.querySelector('meta[property="og:description"]');
        if (ogDesc) ogDesc.setAttribute('content', meta.description);

        const ogUrl = document.querySelector('meta[property="og:url"]');
        if (ogUrl) ogUrl.setAttribute('content', `https://anujmhatre.me${meta.path}`);

        // Update canonical link to ensure virtual routes are correctly indexable as separate pages
        const canonicalTag = document.querySelector('link[rel="canonical"]');
        if (canonicalTag) {
            canonicalTag.setAttribute('href', `https://anujmhatre.me${meta.path}`);
        }

        // Push to browser history (only if not handling a popstate event and room actually changed)
        if (!isHandlingPopState.current && lastPushedRoom.current !== currentRoom) {
            // Use replaceState for the very first load, pushState for subsequent navigations
            if (lastPushedRoom.current === undefined) {
                window.history.replaceState({ room: currentRoom }, '', meta.path);
            } else {
                window.history.pushState({ room: currentRoom }, '', meta.path);
            }
            lastPushedRoom.current = currentRoom;
        }

    }, [currentRoom]);

    // Handle browser back/forward buttons
    useEffect(() => {
        const handlePopState = (event) => {
            isHandlingPopState.current = true;
            const targetRoom = event.state?.room ?? null;
            lastPushedRoom.current = targetRoom;

            if (targetRoom === null) {
                // Going back to corridor — exit the current room
                exitRoom();
            } else if (hasEntered) {
                // Cancel any active teleport before starting a new one
                if (isTeleporting) {
                    cancelTeleport();
                }
                teleportTo(targetRoom);
            }
            // Reset flag after processing so next pushState isn't skipped
            isHandlingPopState.current = false;
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [teleportTo, hasEntered, exitRoom, cancelTeleport, isTeleporting]);
}
