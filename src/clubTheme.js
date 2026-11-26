/**
 * TEMA DEL CLUB — para cambiar la identidad visual de toda la app,
 * modifica SOLO la linea ACTIVE_CLUB y guarda el archivo.
 *
 * Opciones disponibles: 'colocolo' | 'udechile' | 'ucatolica' | 'cobreloa' | 'personalizado'
 * Los colores son aproximaciones de la identidad de cada club: ajusta los codigos hex a gusto.
 */
export const ACTIVE_CLUB = 'colocolo';

export const CLUBS = {
  colocolo: {
    name: 'Colo-Colo',
    colors: {
      primary: '#111111', // color principal: encabezados y tarjetas principales
      accent: '#C8202F', // color de accion: botones de compra
      background: '#F4F4F4',
      text: '#1A1A1A',
      border: '#DDDDDD',
      tint: '#EDEDED',
      tintStrong: '#E4E4E4',
      softDisabled: '#ECECEC',
      accentTint: '#FBE9EB', // fondo suave para resaltar la fila del club
      onPrimaryMuted: '#C9C9C9', // texto secundario sobre el color principal
      onPrimaryFaint: '#9A9A9A',
    },
  },
  udechile: {
    name: 'Universidad de Chile',
    colors: {
      primary: '#0B2A6B',
      accent: '#D71920',
      background: '#F3F5F9',
      text: '#14213D',
      border: '#DDE2EA',
      tint: '#E8EDF4',
      tintStrong: '#E4E8EF',
      softDisabled: '#ECEDEF',
      accentTint: '#FDECEE',
      onPrimaryMuted: '#B8C7DA',
      onPrimaryFaint: '#8FA3BC',
    },
  },
  ucatolica: {
    name: 'Universidad Católica',
    colors: {
      primary: '#0A3D91',
      accent: '#0097D7',
      background: '#F3F6FA',
      text: '#14213D',
      border: '#DDE4EE',
      tint: '#E6EEF8',
      tintStrong: '#DFE8F4',
      softDisabled: '#ECEDEF',
      accentTint: '#E3F3FB',
      onPrimaryMuted: '#BCD0EA',
      onPrimaryFaint: '#8FAAD1',
    },
  },
  cobreloa: {
    name: 'Cobreloa',
    colors: {
      primary: '#E8590C',
      accent: '#1A1A1A',
      background: '#F7F4F1',
      text: '#1F1A17',
      border: '#E5DED8',
      tint: '#F1EAE4',
      tintStrong: '#EAE2DA',
      softDisabled: '#ECEAE8',
      accentTint: '#FDEDE3',
      onPrimaryMuted: '#FFD9C2',
      onPrimaryFaint: '#FFC2A0',
    },
  },
  // Plantilla para cualquier otro club: copia estos valores y cambia los colores.
  personalizado: {
    name: 'Mi Club',
    colors: {
      primary: '#0E2A47',
      accent: '#C8202F',
      background: '#F3F5F8',
      text: '#14213D',
      border: '#DDE2EA',
      tint: '#E8EDF4',
      tintStrong: '#E4E8EF',
      softDisabled: '#ECEDEF',
      accentTint: '#FDECEE',
      onPrimaryMuted: '#B8C7DA',
      onPrimaryFaint: '#8FA3BC',
    },
  },
};
