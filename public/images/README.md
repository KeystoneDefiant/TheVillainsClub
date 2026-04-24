# Static Images Directory

This directory contains all static image assets included with the final Pokerthing package.

## Directory Structure

```
public/images/
├── logos/              # Game and brand logos
├── icons/              # UI icons and small graphics
├── cards/              # Card-related imagery (not card faces)
├── backgrounds/        # Background images and textures
└── ui/                 # UI elements and decorative graphics
```

## Subdirectories

### `/logos`

- **app-logo.png** - Main application logo (256x256px recommended)
- **app-logo-dark.png** - Dark theme version of logo
- **app-icon.svg** - Scalable vector logo
- **splash-screen.png** - Splash/loading screen image

**Usage:** MainMenu, app branding

### `/icons`

- **play.svg** - Play button icon
- **settings.svg** - Settings/gear icon
- **shop.svg** - Shop/store icon
- **close.svg** - Close/X icon
- **chevron-up.svg** - Up arrow icon
- **chevron-down.svg** - Down arrow icon
- **heart.svg** - Hearts/lives icon
- **coin.svg** - Credits/money icon
- **star.svg** - Rating/favorite icon
- **info.svg** - Information icon

**Usage:** Buttons, UI elements, navigation

### `/cards`

- **card-back.png** - Card back design
- **card-shadow.png** - Shadow effect for cards
- **suit-hearts.svg** - Hearts suit symbol
- **suit-diamonds.svg** - Diamonds suit symbol
- **suit-clubs.svg** - Clubs suit symbol
- **suit-spades.svg** - Spades suit symbol

**Usage:** Card displays, poker hand imagery

### `/backgrounds`

- **poker-table.png** - Poker table texture
- **felt-green.png** - Green felt texture
- **grid-pattern.png** - Grid overlay pattern
- **particle-glow.png** - Glow particle texture
- **scanlines.png** - CRT scanline pattern

**Usage:** Theme backgrounds, texture overlays

### `/ui`

- **button-bg.png** - Button background texture
- **panel-border.svg** - Decorative panel border
- **divider.svg** - Line divider element
- **shadow-top.png** - Shadow gradient overlay
- **glow-corner.png** - Corner glow effect

**Usage:** UI decorations, theme styling

## Image Guidelines

### Format Recommendations

- **Logos & UI Elements**: SVG preferred (scalable, small file size)
- **Photographs & Complex Images**: PNG with transparency or JPG
- **Animated Elements**: Animated SVG or consider CSS animations instead
- **Icons**: SVG (16x16 to 256x256 range)

### Size Recommendations

- Logos: 256x256px minimum (SVG preferred)
- Icons: 64x64px to 128x128px (SVG preferred)
- Backgrounds: 1920x1080px minimum for full-screen
- Textures: Optimized for tile size (typically 512x512px or smaller)

### Optimization Guidelines

- Use SVGO for SVG optimization
- Compress PNG files with pngquant or similar
- Keep JPG quality balanced with file size
- Use WebP for modern browser support (with PNG fallback)

## File Naming Convention

- Use lowercase with hyphens: `card-back.png`
- Include size suffix for variants: `logo-128x128.png`
- Include theme suffix where applicable: `button-bg-neon.png`
- Use descriptive names: `play-button-icon.svg` (not `icon1.svg`)

## Integration with Code

### Using Images in Components

```tsx
// SVG Import
import Logo from '@/public/images/logos/app-logo.svg';

// Image URL
<img src="/images/logos/app-logo.png" alt="Pokerthing Logo" />;

// CSS Background
background: url('/images/backgrounds/felt-green.png');

// React Component
<img src={`/images/icons/${iconName}.svg`} alt={iconName} />;
```

### Vite Configuration

Images are automatically handled by Vite and included in the `dist/` folder during build.

## Version Control

Image files should be tracked in git. Use `.gitignore` if storing very large files:

```
# Uncomment if using large raw image files
# public/images/**/*.raw
# public/images/**/*.psd
```

## Adding New Images

1. Create the image file following guidelines above
2. Place in appropriate subdirectory
3. Use descriptive filename
4. Update this README with the new image
5. Reference in components using absolute path: `/images/...`

## Build Integration

During the build process:

1. Images in `public/` are copied to `dist/`
2. URL references `/images/...` resolve correctly
3. All images included in final package automatically

## Performance Considerations

- **Lazy Loading**: Use `loading="lazy"` attribute on images
- **Responsive Images**: Use `srcset` for different screen sizes
- **CSS Sprites**: Consider for small icons to reduce requests
- **CDN Ready**: Structure allows easy migration to CDN

## Future Enhancements

- [ ] SVG sprite sheet for icons
- [ ] WebP conversion script
- [ ] Automatic image optimization in build
- [ ] Theme-specific image variants
- [ ] Dark/light mode image switching

## Related Files

- `/src/components/MainMenu.tsx` - Uses logo placeholder
- `/src/themes/` - Theme-specific styling
- `vite.config.ts` - Asset handling configuration
- `package.json` - Build scripts
