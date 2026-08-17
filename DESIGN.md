# FIN-A --- UI Layout & Visual Design Guide

> This document defines the **layout style, composition, spacing,
> hierarchy, and interaction patterns** of the EasyPay e-wallet UI.
> Colors are intentionally flexible and should be treated as a theme
> layer rather than a fixed part of the layout system.

------------------------------------------------------------------------

# 1. Design Direction

The interface should feel:

-   **Clean**
-   **Lightweight**
-   **Premium**
-   **Friendly**
-   **Mobile-first**
-   **Financial, but not overly corporate**
-   **Visually expressive without relying on heavy containers**

The reference style uses a **large-content / small-navigation
composition**. Important financial information gets generous whitespace
and visual emphasis, while secondary information is compact.

Avoid making every section look like a separate card.

The UI should feel like a **continuous canvas with floating elements**,
rather than a dashboard made entirely from boxes.

------------------------------------------------------------------------

# 2. Core Layout Philosophy

## 2.1 Content First

The most important information should visually dominate the screen.

For the wallet home screen, the hierarchy is:

``` text
Balance
   ↓
Virtual / Physical Card
   ↓
Quick Actions
   ↓
Payment Activity
   ↓
Bottom Navigation
```

The balance and card should occupy the visual center of the screen.

------------------------------------------------------------------------

## 2.2 Use Vertical Rhythm

Use generous spacing between major sections.

Recommended rhythm:

``` text
Screen edge
   ↓ 24px
Header
   ↓ 20–28px
Balance
   ↓ 16–24px
Card
   ↓ 18–24px
Quick actions
   ↓ 24–32px
Activity
   ↓
Bottom navigation
```

Do not compress unrelated sections together.

------------------------------------------------------------------------

# 3. Screen Composition

## Mobile Canvas

Design around a narrow phone viewport first.

Recommended content width:

``` text
Screen
│
├── 20–24px outer margin
│
├── Main content
│
├── 20–24px outer margin
│
└── Bottom navigation
```

The screen should never feel edge-to-edge unless an intentional visual
element extends to the edge.

------------------------------------------------------------------------

# 4. Header Style

The header should be **minimal and lightweight**.

Typical structure:

``` text
[Back / Menu]       Page Title       [Action]
```

However, do not force a visible container around the header.

### Guidelines

-   Keep header height around 48--56px.
-   Use simple icon buttons.
-   Keep icons visually secondary.
-   Center titles when the screen is task-oriented.
-   Allow the content below to visually connect to the header.

The header should not compete with the wallet balance.

------------------------------------------------------------------------

# 5. Balance Area

The balance is the primary focal point.

Example composition:

``` text
            Available balance

                $2,800

             Available balance
```

More generally:

``` text
     Small supporting label

       LARGE PRIMARY VALUE

      Small contextual detail
```

### Guidelines

-   Use large typography.
-   Keep supporting text small.
-   Avoid putting the balance inside a heavy card.
-   Center alignment works well for wallet/account overview screens.
-   Allow substantial whitespace around the balance.

The number should feel like the **hero element**, not a field in a form.

------------------------------------------------------------------------

# 6. Financial Card

The payment card is the largest visual object on the home screen.

Recommended proportions:

``` text
Width: 100% of content area
Height: approximately 55–65% of width
Aspect ratio: approximately 1.55–1.75
```

Example:

``` text
┌──────────────────────────────────────┐
│                                      │
│  CARD BRAND                 STATUS   │
│                                      │
│                                      │
│                                      │
│  •••• •••• •••• 1099                │
│  CARD HOLDER                         │
└──────────────────────────────────────┘
```

### Card Design

The card can use:

-   Gradient
-   Solid color
-   Abstract shapes
-   Subtle texture
-   Soft lighting
-   Glass effects
-   Minimal geometric artwork

Colors should be themeable.

### Important

The card should feel like a **real financial object**, not a generic
content card.

It should have:

-   Strong depth
-   Large radius
-   Internal hierarchy
-   Generous padding
-   Clear card number
-   Brand/logo
-   Status indicator

------------------------------------------------------------------------

# 7. Card Carousel

If multiple cards exist, use a horizontal carousel.

``` text
        ┌───────────────────────┐
        │                       │
        │       CARD 1          │
        │                       │
        └───────────────────────┘

             •  ○  ○
```

### Behavior

-   Current card is fully visible.
-   Adjacent cards may slightly peek into view.
-   Use small pagination indicators.
-   Swiping changes the active card.
-   The balance and card details update with the selected card.

Avoid traditional desktop-style tabs.

------------------------------------------------------------------------

# 8. Quick Actions

Quick actions should be **icon-first**.

Example:

``` text
   (+)       ($)       (◉)       (⌁)
   New     Estimate   Options    Scan
```

### Structure

Each action:

``` text
   Circular icon

   Short label
```

### Guidelines

-   Use circular or softly rounded icon surfaces.
-   Keep labels extremely short.
-   Use 3--5 actions maximum.
-   Distribute actions evenly across the screen.
-   Avoid rectangular buttons unless the action is primary.

Quick actions should feel like **tools**, not navigation cards.

------------------------------------------------------------------------

# 9. Activity / Payment Timeline

The payment section should be compact and information-dense.

Instead of displaying every transaction as a large card, use a
lightweight list or timeline.

Example:

``` text
Payments

Amazon                         $1,420

●────────●────────◐────────○
Done     Done     Feb 5     Mar 5
```

The timeline is especially useful for:

-   Installments
-   Recurring payments
-   Bills
-   Scheduled transfers
-   Payment plans

------------------------------------------------------------------------

# 10. Timeline Visual Language

Use a simple horizontal progression.

``` text
●────────●────────◐────────○
```

States:

### Completed

``` text
●
```

### Current

``` text
◐
```

### Upcoming

``` text
○
```

The timeline should remain visually quiet.

Do not make it look like a complex analytics chart.

------------------------------------------------------------------------

# 11. Split Payment Screen

The split-payment screen changes the hierarchy.

``` text
Header

Split the payment

┌─────────────────────────────────┐
│ Merchant              Amount    │
│ Date                  Status    │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Merchant              Amount    │
│ Date                  Status    │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Merchant              Amount    │
│ Date                  Status    │
└─────────────────────────────────┘

Analytics

[ Week ] [ Month ] [ Year ]

        BAR CHART
```

Merchant items should be visually distinct, but they don't all need
thick borders.

------------------------------------------------------------------------

# 12. Merchant Payment Rows

A merchant row should communicate four things immediately:

1.  Merchant
2.  Purchase date
3.  Amount
4.  Action/status

Suggested composition:

``` text
[Logo]  Apple Store                    $1,200
        February 1                 Can be divided
```

The amount should be aligned consistently.

Status text should remain secondary.

------------------------------------------------------------------------

# 13. Analytics Layout

Analytics should appear **below the primary financial task**.

Recommended structure:

``` text
Analytics

[ Week ] [ Month ] [ Year ]

                         [ Toggle ]

        │
  2000  │       █
  1500  │   █   █   █
  1000  │   █   █   █
   500  │ █ █   █
        └────────────────
          J F M A M J
```

### Guidelines

-   Keep charts simple.
-   Use rounded bar ends.
-   Avoid excessive grid lines.
-   Keep labels subtle.
-   Highlight the selected period.
-   Allow the chart to occupy the width of the content area.

The chart should support understanding, not dominate the screen.

------------------------------------------------------------------------

# 14. Bottom Navigation

Bottom navigation should remain persistent.

Structure:

``` text
┌──────────────────────────────────────┐
│                                      │
│  Home    Wallet    Activity   More   │
│   ●        ○          ○        ○     │
└──────────────────────────────────────┘
```

Recommended:

-   4--5 destinations
-   Icon + optional label
-   Large touch targets
-   Fixed to bottom
-   Visually separated through whitespace, blur, or subtle elevation
    rather than heavy borders

The active destination should be obvious through shape, weight, or
color.

------------------------------------------------------------------------

# 15. Containers

## Primary Rule

**Do not put everything inside cards.**

Use containers only when they improve grouping or interaction.

### Prefer

``` text
Balance
        ↓
Large card
        ↓
Quick actions
        ↓
Activity list
```

### Avoid

``` text
┌───────────────────────────┐
│ ┌───────────────────────┐ │
│ │ Balance               │ │
│ └───────────────────────┘ │
│                           │
│ ┌───────────────────────┐ │
│ │ Card                  │ │
│ └───────────────────────┘ │
│                           │
│ ┌───────────────────────┐ │
│ │ Actions               │ │
│ └───────────────────────┘ │
└───────────────────────────┘
```

The second approach feels like a generic admin dashboard.

------------------------------------------------------------------------

# 16. Borders & Dividers

Use borders sparingly.

Prefer:

-   Whitespace
-   Alignment
-   Typography
-   Background contrast
-   Soft shadows
-   Iconography

Instead of:

-   Heavy outlines
-   Multiple horizontal separators
-   Nested borders

If a divider is necessary, make it subtle.

------------------------------------------------------------------------

# 17. Radius System

Use a consistent radius language.

``` text
Small controls       10–14px
Buttons              14–18px
Cards                20–28px
Large financial card 22–28px
Bottom navigation    20–28px
```

Avoid mixing many unrelated radius values.

------------------------------------------------------------------------

# 18. Shadows & Depth

Depth should be subtle.

Recommended visual hierarchy:

``` text
Background
    ↓
Soft surface
    ↓
Floating component
    ↓
Primary card
```

Avoid strong black shadows.

Use low-opacity shadows that create separation without making the UI
look heavy.

------------------------------------------------------------------------

# 19. Color System

**Colors are intentionally flexible.**

The layout should work equally well with:

-   Purple
-   Blue
-   Green
-   Orange
-   Neutral monochrome
-   Dark mode
-   Brand-specific themes

Define colors as semantic tokens rather than hard-coded visual
assumptions.

Example:

``` text
primary
primaryForeground
background
surface
surfaceElevated
textPrimary
textSecondary
textMuted
success
warning
danger
border
```

The layout must remain recognizable even if the entire color palette
changes.

------------------------------------------------------------------------

# 20. Visual Hierarchy

Use this hierarchy consistently:

``` text
LEVEL 1
Large balance / primary financial value

LEVEL 2
Primary card / active payment

LEVEL 3
Section titles / merchant names

LEVEL 4
Supporting information

LEVEL 5
Dates / labels / metadata
```

Do not make every piece of text equally bold.

------------------------------------------------------------------------

# 21. Responsive Behavior

## Small Phones

-   Reduce outer padding to 16--20px.
-   Preserve card proportions.
-   Allow quick actions to remain horizontally distributed.
-   Collapse long labels.
-   Keep bottom navigation compact.

## Large Phones

-   Increase horizontal breathing room.
-   Keep content from becoming excessively wide.
-   Maintain the same visual hierarchy.

## Tablet

The mobile composition can remain centered with a maximum content width.

``` text
┌─────────────────────────────────────────┐
│                                         │
│          ┌───────────────────┐          │
│          │    App Content    │          │
│          │                   │          │
│          └───────────────────┘          │
│                                         │
└─────────────────────────────────────────┘
```

Do not simply stretch every component to fill the tablet.

------------------------------------------------------------------------

# 22. Interaction Principles

Interactions should feel direct and tactile.

### Card

-   Tap → card details
-   Swipe → change card
-   Long press → card actions

### Payment

-   Tap → payment details
-   Swipe → payment actions where appropriate

### Quick Actions

-   Tap → immediate action flow
-   Avoid unnecessary confirmation screens

### Analytics

-   Tap period → update chart
-   Tap data point/bar → show contextual detail

------------------------------------------------------------------------

# 23. Motion Direction

Motion should reinforce spatial relationships.

Examples:

``` text
Card carousel
← → horizontal movement

Payment details
↑ bottom-sheet expansion

Analytics
↑ chart growth

Navigation
→ screen transition
```

Use short, smooth transitions.

Avoid excessive animations in financial workflows.

------------------------------------------------------------------------

# 24. Component Density

The reference style uses **moderate information density**.

Target:

``` text
Large hero content
        ↓
Moderate interaction density
        ↓
Compact financial metadata
```

The UI should feel spacious without wasting vertical space.

------------------------------------------------------------------------

# 25. Overall Composition

The complete home screen should roughly read as:

``` text
┌──────────────────────────────┐
│ Header                       │
│                              │
│        $ BALANCE             │
│        supporting text       │
│                              │
│  ┌────────────────────────┐  │
│  │                        │  │
│  │      PAYMENT CARD      │  │
│  │                        │  │
│  └────────────────────────┘  │
│          • ○                 │
│                              │
│   (+)      ($)      ◉      ⌁ │
│   New   Estimate  Options Scan
│                              │
│ Payments                     │
│                              │
│ Merchant              Amount │
│ ─────────●──────●────○───── │
│                              │
│                              │
├──────────────────────────────┤
│  Home   Wallet  Activity More│
└──────────────────────────────┘
```

The key characteristic is **hierarchy through scale and whitespace**,
rather than hierarchy through lots of containers.

------------------------------------------------------------------------

# 26. Design Rule of Thumb

When designing a new screen, ask:

> **Can this information be communicated through spacing, typography,
> alignment, and visual hierarchy before adding another card or
> container?**

If yes, prefer the simpler composition.

The EasyPay visual language should feel like a **financial app designed
around objects and actions**, not a collection of dashboard widgets.

------------------------------------------------------------------------

# 27. Keywords

`mobile-first`

`minimal fintech`

`large financial hero`

`floating objects`

`soft surfaces`

`generous whitespace`

`rounded geometry`

`lightweight navigation`

`horizontal card carousel`

`compact financial timelines`

`simple analytics`

`low container density`

`theme-flexible`
