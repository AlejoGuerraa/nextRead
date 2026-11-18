import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Detecta la IP de tu PC a partir del servidor de Expo (el mismo que usa el
 * celular para bajar el bundle). Así no hay que hardcodear "192.168.x.x".
 *
 * Podés pisarlo creando un archivo .env en /mobile con:
 *   EXPO_PUBLIC_API_URL=http://192.168.0.15:3000
 */
function detectDevHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    '';
  const host = hostUri.split(':')[0];
  if (host) return host;
  // Emulador de Android sin hostUri: 10.0.2.2 apunta al localhost de la PC
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

const DEV_HOST = detectDevHost();

export const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${DEV_HOST}:3000`;

// Las portadas, íconos y banners viven en client/public y los sirve la misma API
// (express.static en api/index.js), así no hace falta levantar la web.
export const ASSETS_URL = process.env.EXPO_PUBLIC_ASSETS_URL || API_URL;
