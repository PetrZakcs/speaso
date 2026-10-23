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
export const COMPANION_AVATAR_SOURCE: ImageSourcePropType = require('../../assets/companion_avatar.png');
export const COMPANION_FULL_SOURCE: ImageSourcePropType = require('../../assets/companion.png');
export const CAPYBARA_SOURCE: ImageSourcePropType = require('../../assets/capybara_avatar.png');

export const CUSTOM_MASCOT_SOURCE: ImageSourcePropType | null = COMPANION_AVATAR_SOURCE;
export const hasCustomMascot = CUSTOM_MASCOT_SOURCE !== null;
