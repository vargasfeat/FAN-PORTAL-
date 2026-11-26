import { Dimensions, PixelRatio } from 'react-native';
import { ACTIVE_CLUB, CLUBS } from './clubTheme';

const { width } = Dimensions.get('window');
const BASE_WIDTH = 375; // ancho de referencia de diseño (iPhone estándar)

/**
 * rs = "relative size".
 * Escala tipografías, paddings y radios según el ancho real de la pantalla,
 * en lugar de usar píxeles fijos. Los contenedores se dimensionan con
 * flex y porcentajes; rs se reserva para texto y espaciados finos.
 */
export const rs = (size) => {
  const factor = Math.min(Math.max(width / BASE_WIDTH, 0.85), 1.35);
  return Math.round(PixelRatio.roundToNearestPixel(size * factor));
};

// Colores que no dependen del club
const baseColors = {
  surface: '#FFFFFF',
  muted: '#667085',
  disabled: '#CBD0D8',
  disabledText: '#8A919C',
  success: '#17825A',
  warning: '#B45309',
};

// El tema se elige en src/clubTheme.js (linea ACTIVE_CLUB)
const preset = CLUBS[ACTIVE_CLUB] || CLUBS.colocolo;

export const club = { key: CLUBS[ACTIVE_CLUB] ? ACTIVE_CLUB : 'colocolo', name: preset.name };
export const colors = { ...baseColors, ...preset.colors };
