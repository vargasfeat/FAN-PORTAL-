import { Dimensions, PixelRatio } from 'react-native';

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

export const colors = {
  primary: '#0E2A47', // azul institucional
  accent: '#C8202F', // rojo de entradas / acciones de venta
  background: '#F3F5F8',
  surface: '#FFFFFF',
  text: '#14213D',
  muted: '#667085',
  border: '#DDE2EA',
  disabled: '#CBD0D8',
  disabledText: '#8A919C',
  success: '#17825A',
  warning: '#B45309',
};
