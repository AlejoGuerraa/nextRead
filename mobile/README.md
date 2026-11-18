# NextRead Mobile

App de celular de NextRead hecha con **React Native + Expo**. Usa la misma API que la web (`/api`).

## Requisitos

- Node.js 18 o superior
- La app **Expo Go** en el celular (Play Store / App Store)
- El celular y la PC conectados a **la misma red WiFi**

## Cómo correrla

Necesitás 3 terminales abiertas:

```bash
# 1) API (también sirve las portadas, íconos y banners de client/public)
cd api
npm start

# 2) Worker de recomendaciones (genera los carruseles personalizados)
cd api
npm run worker:recommendations

# 3) App mobile
cd mobile
npm install
npx expo install --fix   # alinea las versiones con tu SDK de Expo
npx expo start
```

Escaneá el QR con Expo Go (Android) o con la cámara (iPhone).

> Si Expo Go te dice que el proyecto usa un SDK viejo, actualizalo con
> `npx expo install expo@latest` y después `npx expo install --fix`.

### ¿Cómo encuentra la API?

`src/config.js` saca la IP de tu PC del servidor de Expo y arma
`http://<tu-ip>:3000` para la API y las imágenes.
En **Configuración** (ícono ⚙️ del perfil) se ve qué URL está usando.

Si no conecta, copiá `.env.example` como `.env`, poné la IP de tu PC
(en Windows: `ipconfig` → "Dirección IPv4") y reiniciá con `npx expo start -c`.

Si sigue sin conectar, revisá que el **Firewall de Windows** permita Node.js en redes privadas.

## Estructura

```
mobile/
├── App.js                  # Providers + navegación
├── src/
│   ├── config.js           # URL de la API (detecta la IP sola)
│   ├── theme.js            # Colores del diseño (azul #253754, rosa #FF149D…)
│   ├── api/
│   │   ├── client.js       # axios + token Bearer
│   │   └── endpoints.js    # TODOS los endpoints de la API
│   ├── context/            # AuthContext (sesión) y ToastContext
│   ├── navigation/         # Stack de acceso / app + tabs inferiores
│   ├── components/         # Botones, inputs, portadas, carruseles, reseñas…
│   └── screens/
│       ├── auth/           # Bienvenida, Login, Registro (4 pasos), Recuperar contraseña
│       ├── HomeScreen      # Página principal con carruseles
│       ├── BookScreen      # Libro: estanterías, estrellas, reseñas, likes, respuestas
│       ├── AddToListScreen # Añadir a lista / Nueva lista
│       ├── ProfileScreen   # Perfil propio
│       ├── SearchScreen    # Búsqueda de libros, autores y lectores
│       ├── DiscoverScreen  # Descubrir: deslizá libros (→ leído, ← quiero leer, doble toque ♥)
│       ├── CategoryScreen  # Libros por categoría / género (desde Búsqueda)
│       ├── LibraryScreen   # Mi biblioteca (estanterías + listas)
│       ├── ListDetailScreen
│       ├── NotificationsScreen
│       ├── AuthorScreen
│       ├── UserProfileScreen + FollowListScreen
│       ├── EditProfileScreen
│       └── SettingsScreen  # Contraseña, correo, eliminar cuenta, cerrar sesión
```
