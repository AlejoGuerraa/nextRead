// Paleta tomada de los diseños mobile de NextRead (Whimsical) + web
// Paleta de la versión web (azules #1A374D / #406882 / #6998AB / #B1D0E0).
// El rosa queda solo como acento chico (corazones, likes, "Read" del logo, badges).
export const colors = {
  navy: '#1A374D', // fondo de las pantallas de acceso (= --primary de la web)
  header: '#1A374D', // barra superior y de pestañas
  panel: '#24475E', // paneles oscuros (acciones del libro, Descubrir, modales)
  panelLight: '#406882',
  primary: '#406882', // botones y estados activos (= --secondary de la web)
  primaryLight: '#6998AB', // (= --accent de la web)
  sky: '#B1D0E0',
  rose: '#D9779F', // acento rosa suave
  pink: '#D9779F', // alias (compatibilidad)
  pinkDark: '#B85F84',
  bg: '#EEF5F8',
  card: '#FFFFFF',
  cardAlt: '#F3F8FA',
  border: '#D5E4EA',
  text: '#1A374D',
  textMuted: '#5E7A88',
  white: '#FFFFFF',
  whiteMuted: 'rgba(255,255,255,0.72)',
  star: '#4F86A6',
  danger: '#B64F5A',
  success: '#3C8D7A',
  // pasteles azulados para portadas sin imagen (sin amarillos)
  pastels: ['#DCEAF2', '#E3E9F7', '#D6EEF0', '#E8E4F3', '#DDE7EE', '#F1E6EE'],
};

export const radius = { sm: 8, md: 14, lg: 22, pill: 999 };

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };

export const font = {
  h1: { fontSize: 28, fontWeight: '800' },
  h2: { fontSize: 22, fontWeight: '800' },
  h3: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 15 },
  small: { fontSize: 13 },
  tiny: { fontSize: 11 },
};
