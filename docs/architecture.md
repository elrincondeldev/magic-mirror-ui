# 🏗 Arquitectura Técnica

## Resumen

El proyecto **Magic Mirror UI** utiliza un servidor personalizado de Node.js para integrar **Next.js** (App Router) con **Socket.io**. Esta combinación permite una sincronización bidireccional entre el panel de administración y la pantalla del espejo.

## Flujo de Datos en Tiempo Real

1. **Servidor Central (server.js)**:
   - Mantiene un estado compartido en memoria llamado `mirrorState`.
   - Escucha conexiones de sockets en la misma instancia que el servidor HTTP de Next.js.
   - Envía el estado actual inmediatamente después de que un cliente (espejo o admin) se conecta.

2. **Panel de Administración (/app/admin)**:
   - Emite el evento `mirror:update` al servidor cada vez que se cambia un ajuste (ciudad, mensaje, modo).
   - El servidor actualiza su estado interno y retransmite (`io.emit`) el nuevo estado a todos los clientes conectados.

3. **Interfaz del Espejo (/app/mirror)**:
   - Escucha el evento `mirror:state`.
   - Cuando recibe una actualización, React actualiza la UI de forma reactiva sin necesidad de refrescar la página.

## Estado del Espejo (MirrorState)

El estado global que se sincroniza tiene la siguiente estructura:

```typescript
interface MirrorState {
  mode: 'dashboard' | 'youtube'; // Modo de visualización activo
  youtubeId: string | null;      // ID del vídeo de YouTube actual
  message: string;              // Mensaje personalizado en el pie
  weatherCity: string;          // Ciudad para los datos del clima (e.g., "Madrid,ES")
}
```

## Optimización para Dispositivos Kiosk

- **Sin Cursor**: Se utiliza la clase `cursor-none` en el espejo para ocultar el puntero del ratón en pantallas táctiles o controladas remotamente.
- **Sin Selección**: Se utiliza `select-none` para evitar que el usuario pueda resaltar texto accidentalmente.
- **Carga de YouTube**: El componente `YouTubePlayer` utiliza la API de IFrame de YouTube con lógica de auto-reproducción (muteando inicialmente para cumplir con las políticas del navegador y des-muteando después).

## Autenticación

El acceso al panel de administración está protegido mediante:

- **Middleware de Next.js**: Verifica la presencia de una cookie de sesión (`mm_session`).
- **Rutas de API**: La ruta `/api/auth/login` valida las credenciales y establece la cookie con `httpOnly` y `secure` para mayor seguridad.
- **Credenciales Hardcoded**: Por defecto, se utilizan las credenciales `admin` / `admin123`, configuradas en `app/api/auth/login/route.ts`. Se recomienda cambiarlas antes del despliegue.