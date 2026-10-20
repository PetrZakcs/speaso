import type { ImageSourcePropType } from 'react-native';

/**
 * Pluggable mascot asset slot.
 * When the user provides their hand-drawn or 3D companion character
 * (e.g. placing `assets/companion.png`), set CUSTOM_MASCOT_SOURCE:
 *
 *   export const CUSTOM_MASCOT_SOURCE: ImageSourcePropType | null = require('../../assets/companion.png');
 *
 * If null, CompanionAvatar renders the rich procedural organic SVG companion with all animations!
 */
export const CUSTOM_MASCOT_SOURCE: ImageSourcePropType | null = null;
