---
name: "BakuWay Design System"
description: "Warm, calm, nature-inspired travel web design system for international visitors exploring Baku and Azerbaijan."
---

## Overview

BakuWay is a calm, welcoming, and practical travel website for international tourists and families visiting Azerbaijan without a tour guide. Inspired by Azerbaijani nature, tea culture, and subtle geometric carpet heritage, the interface pairs generous warm-cream breathing room with crisp white cards, deep forest green actions, soft sage accents, and warm sand bands. Every interaction feels unhurried, trustworthy, and effortless to scan on both 1440px desktop and mobile browsers.

## Colors

The palette is strictly soft, earthy, and natural—never bright or neon. Deep forest green (`primary`) anchors primary buttons, active tabs, and links, while soft sage green (`sage`) highlights welcoming travel guides and banners. Warm cream (`surface`) forms the canvas, pure white (`surface-card`) lifts content cards, and warm sand (`sand`) grounds editorial strips and the footer. Soft terracotta (`terracotta`) marks discount badges and small highlights.

```yaml
colors:
  primary: "#3F5E4A"
  on-primary: "#FFFFFF"
  primary-container: "#D6F9DF"
  on-primary-container: "#183625"
  sage: "#7A9E7E"
  on-sage: "#15351E"
  sage-soft: "#EBF2EC"
  secondary: "#8B6B4F"
  on-secondary: "#FFFFFF"
  secondary-container: "#FFEEE1"
  on-secondary-container: "#432B14"
  terracotta: "#C98B6B"
  on-terracotta: "#2E1A10"
  terracotta-soft: "#F7EAE2"
  surface: "#F7F3EC"
  on-surface: "#2E2A26"
  surface-card: "#FFFFFF"
  on-surface-card: "#2E2A26"
  sand: "#E8DFD0"
  on-sand: "#2E2A26"
  on-surface-variant: "#655D56"
  muted: "#7A716A"
  outline: "#DDD5C7"
  outline-variant: "#EAE1D2"
  success: "#4A7C59"
  on-success: "#FFFFFF"
  warning: "#B58238"
  on-warning: "#201B15"
  error: "#A84A42"
  on-error: "#FFFFFF"
```

## Typography

**Plus Jakarta Sans** is used across both headings and body copy for its rounded, friendly geometric warmth and high legibility across Latin, Cyrillic, and Azerbaijani characters. Display and large headline levels include `-mobile` counterparts (`<= 32px`) for responsive mobile viewports.

```yaml
typography:
  display-lg:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 44px
    fontWeight: 700
    lineHeight: 52px
    letterSpacing: -0.5px
  display-lg-mobile:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 30px
    fontWeight: 700
    lineHeight: 38px
    letterSpacing: -0.25px
  headline-lg:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 32px
    fontWeight: 700
    lineHeight: 40px
    letterSpacing: -0.25px
  headline-md:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 24px
    fontWeight: 700
    lineHeight: 32px
    letterSpacing: -0.15px
  headline-sm:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 18px
    fontWeight: 600
    lineHeight: 26px
    letterSpacing: 0px
  title-md:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 16px
    fontWeight: 600
    lineHeight: 24px
    letterSpacing: 0px
  body-lg:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 26px
    letterSpacing: 0px
  body-md:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 22px
    letterSpacing: 0px
  body-sm:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 13px
    fontWeight: 400
    lineHeight: 18px
    letterSpacing: 0px
  label-lg:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
    letterSpacing: 0px
  label-md:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 16px
    letterSpacing: 0.2px
  label-sm:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 14px
    letterSpacing: 0.3px
```

## Layout & Spacing

The layout uses a centered max-width container (`max-w-[1200px]`) within a 1440px desktop viewport, collapsing cleanly into responsive single- and two-column stacks on tablet and mobile browsers. Generous vertical section spacing (`64px`–`80px`) and 4px/8px grid increments keep every card row airy and uncrowded.

```yaml
spacing:
  gutter-xs: 4px
  gutter-sm: 8px
  gutter-md: 16px
  gutter-lg: 24px
  gutter-xl: 32px
  section: 64px
  page-margin: 24px
```

## Elevation & Depth

Cards sit on pure white (`surface-card`) against warm cream (`surface`) with very soft, warm-tinted ambient shadows (`0 4px 20px rgba(46, 42, 38, 0.05)`) and subtle `1px` `outline-variant` hairlines only where needed for inputs or crisp separation. Sticky headers use a solid white surface with a soft bottom shadow—no glassmorphism or backdrop blur.

## Shapes

Friendly, rounded corners reinforce the approachable travel tone: `16px` (`rounded-lg`) for all content cards and banners, `12px` (`rounded-md`) for buttons and form inputs, and `9999px` (`rounded-full`) for filter chips, badges, and dish avatars.

```yaml
rounded:
  sm: 8px
  DEFAULT: 12px
  md: 12px
  lg: 16px
  xl: 24px
  full: 9999px
```

## Motion & Micro-interaction

Transitions are calm, tactile, and subtle—never jarring. Interactive hover states on cards and buttons settle within `150ms`, while drawers, modals, and toasts enter smoothly over `250ms`. Only `transform`, `opacity`, and color properties are animated.

```yaml
motion:
  state-change:
    duration: 150ms
    delay: 0ms
    timingFunction: ease-out
  surface-enter:
    duration: 250ms
    delay: 0ms
    timingFunction: cubic-bezier(0.2, 0, 0, 1)
  surface-exit:
    duration: 150ms
    delay: 0ms
    timingFunction: cubic-bezier(0.3, 0, 1, 1)
```

## Voice & Content Strategy

Copy is warm, clear, and practical—written like a helpful local friend who respects a traveler's time. Use sentence case for headings and buttons, concise action verbs ("Compare rides", "Read guide", "See all"), and realistic Baku pricing in Azerbaijani Manat (`₼`) with approximate USD (`≈ $...`) in smaller muted text. Avoid hype, clichés, or tour-agency jargon.

## Components

Component implementations live as individual HTML sticker sheet files in
`components/`. Each file contains the canonical, styled HTML components with
`<!-- COMPONENT: name -->` comment markers. Read each file before use.

- **Badge** → `@components/badge.html` — `badge-numeric`, `badge-dot`
- **Button** → `@components/button.html` — `button-primary`, `button-icon`, `button-with-icon`
- **Card** → `@components/card.html` — `card-elevated`, `card-action`, `card-interactive`, `card-interactive-2`
- **Chip** → `@components/chip.html` — `chip-action`, `chip-input`, `chip-with-icon`
- **Input Field** → `@components/input-field.html` — `input-field-text`, `input-field-icon`
- **Tabs** → `@components/tabs.html` — `tabs-horizontal`, `tabs-with-icon`
