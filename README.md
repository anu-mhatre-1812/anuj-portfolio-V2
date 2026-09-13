# ANUJ MHATRE | Interactive 3D WebGL Portfolio

<div align="center">
  <img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=threedotjs" alt="Three.js" />
  <img src="https://img.shields.io/badge/React_Three_Fiber-FF6B6B?style=for-the-badge" alt="R3F" />
  <img src="https://img.shields.io/badge/GSAP-0AE944?style=for-the-badge&logo=greensock&logoColor=white" alt="GSAP" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Neo--Brutalist-CRIMSON?style=for-the-badge" alt="Theme" />
</div>

<br/>

A neo-brutalist, cyberpunk-inspired 3D interactive portfolio. Walk through a corridor, open doors into rooms, and explore projects, skills, and contact info — all rendered in real-time WebGL.

**Live:** [anujmhatre.me](https://anujmhatre.me)

---

## What Is This

An immersive 3D portfolio where visitors physically walk through a corridor and enter rooms:
- **About** — Scroll-to-fly story with floating clouds, a paper airplane, and award cards
- **Gallery** — Horizontally scrolling project cards with paint-reveal effects
- **Studio** — 3D monitor tower with code particles and floating devices
- **Contact** — Social links, email, Discord, phone with ocean/barrel animations
- **Carousel** — AI-powered social media carousel generator (beta)

## Tech Stack

| Layer | Tech |
|-------|------|
| 3D Engine | Three.js + React Three Fiber |
| Animation | GSAP (ScrollTrigger, Observer, Flip) |
| UI | React 19 + Custom SCSS |
| Shaders | Custom GLSL (reveal, paint, fog) |
| CMS | Sanity (disabled, fallback projects) |
| AI | OpenRouter API (carousel generation) |
| Deploy | Vercel |
| Language | JavaScript (no TypeScript) |

## Quick Start

```bash
git clone https://github.com/a18-n03/anuj-portfolio-V2.git
cd anuj-portfolio-V2
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Build & Deploy

```bash
npm run build        # Production build
npx vercel --prod    # Deploy to Vercel
```

## Project Structure

```
src/
  components/
    canvas/           # 3D scene components
      corridor/       # Main corridor, doors, teleport
      rooms/          # About, Gallery, Studio, Contact, Carousel
      shaders/        # Custom GLSL materials
      entrance/       # Entry door animation
    ui/               # 2D overlay UI (NavigationUI, GlobalOverlay, CarouselEditor)
  context/            # React contexts (Scene, Audio, Achievements)
  hooks/              # Custom hooks (useDocumentMeta, useSanityData)
  api/                # Server-side API (carousel AI generation)
  styles/             # SCSS stylesheets
  utils/              # Utilities (audio, device detection)
public/               # Static assets (textures, fonts, models)
```

## Features

- Real-time 3D corridor navigation with door-based room entry
- Map-based teleport system (click to jump between rooms)
- Custom GLSL reveal/paint shader transitions
- GSAP-powered scroll animations with `Observer` (wheel/touch/pointer normalization)
- Spatial positional audio
- Adaptive device tiering (auto-scales quality based on GPU)
- SEO-optimized with semantic DOM fallbacks
- AI-powered social media carousel generator
- Neo-brutalist design with crimson/black/electric blue palette

## Author

**Anuj Mhatre**
- GitHub: [@a18-n03](https://github.com/a18-n03)
- LinkedIn: [anuj-mhatre-031807ma](https://www.linkedin.com/in/anuj-mhatre-031807ma)
- X: [@MhatreAnuj1814](https://x.com/MhatreAnuj1814)
- Instagram: [@anu__m.1812](https://www.instagram.com/anu__m.1812)
- Email: anujmhatre125@gmail.com

---

*Built different. I don't wait for the right tool — I build it.*
