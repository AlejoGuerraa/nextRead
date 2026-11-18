import React from 'react';
import { Image, StyleSheet } from 'react-native';

const fondo = require('../../assets/fondo.jpg');

/**
 * Fondo "Páginas al viento". Va como primer hijo del contenedor de la pantalla:
 * queda fijo detrás mientras el contenido scrollea.
 */
export default function ScreenBackground({ opacity = 1 }) {
  return <Image source={fondo} style={[StyleSheet.absoluteFill, { opacity }]} resizeMode="cover" pointerEvents="none" />;
}
