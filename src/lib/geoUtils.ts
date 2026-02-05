 /**
  * Utilidades de geolocalización para validación de fotos
  * Incluye cálculo de distancia Haversine y extracción de ubicación
  */
 
 import { GEO_CONFIG, type ValidacionGeo } from '@/types/checklist';
 
 // Radio de la Tierra en metros
 const EARTH_RADIUS_M = 6371000;
 
 /**
  * Calcula la distancia entre dos puntos usando fórmula Haversine
  * @returns Distancia en metros
  */
 export function calcularDistanciaHaversine(
   lat1: number,
   lng1: number,
   lat2: number,
   lng2: number
 ): number {
   const dLat = ((lat2 - lat1) * Math.PI) / 180;
   const dLng = ((lng2 - lng1) * Math.PI) / 180;
 
   const a =
     Math.sin(dLat / 2) * Math.sin(dLat / 2) +
     Math.cos((lat1 * Math.PI) / 180) *
       Math.cos((lat2 * Math.PI) / 180) *
       Math.sin(dLng / 2) *
       Math.sin(dLng / 2);
 
   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
 
   return EARTH_RADIUS_M * c;
 }
 
 /**
  * Obtiene la ubicación actual del dispositivo
  * @throws Error si geolocalización no está disponible o falla
  */
 export function getCurrentPosition(): Promise<GeolocationPosition> {
   return new Promise((resolve, reject) => {
     if (!navigator.geolocation) {
       reject(new Error('Geolocalización no disponible en este dispositivo'));
       return;
     }
 
     navigator.geolocation.getCurrentPosition(resolve, reject, {
       enableHighAccuracy: true,
       timeout: GEO_CONFIG.TIMEOUT_GPS_MS,
       maximumAge: GEO_CONFIG.MAX_AGE_GPS_MS,
     });
   });
 }
 
 /**
  * Obtiene la ubicación actual de forma segura (no lanza error)
  * @returns Coordenadas o null si no se pudo obtener
  */
 export async function getCurrentPositionSafe(): Promise<{
   lat: number;
   lng: number;
 } | null> {
   try {
     const position = await getCurrentPosition();
     return {
       lat: position.coords.latitude,
       lng: position.coords.longitude,
     };
   } catch (error) {
     console.warn('[GeoUtils] No se pudo obtener ubicación:', error);
     return null;
   }
 }
 
 /**
  * Resultado de validación de ubicación de foto
  */
 export interface ValidacionUbicacionResult {
   valido: boolean;
   distancia: number | null;
   validacion: ValidacionGeo;
   mensaje: string;
 }
 
 /**
  * Valida si una foto está dentro del rango permitido del origen
  * IMPORTANTE: Esta validación NO es bloqueante - solo genera advertencias
  */
 export function validarUbicacionFoto(
   fotoLat: number | null,
   fotoLng: number | null,
   origenLat: number,
   origenLng: number,
   toleranciaM: number = GEO_CONFIG.TOLERANCIA_METROS
 ): ValidacionUbicacionResult {
   // Sin GPS - no bloqueante, marcar para auditoría
   if (fotoLat === null || fotoLng === null) {
     return {
       valido: true,
       distancia: null,
       validacion: 'sin_gps',
       mensaje: 'Sin datos GPS - será auditado',
     };
   }
 
   const distancia = calcularDistanciaHaversine(
     fotoLat,
     fotoLng,
     origenLat,
     origenLng
   );
   const distanciaRedondeada = Math.round(distancia);
 
   // Dentro del rango permitido
   if (distancia <= toleranciaM) {
     return {
       valido: true,
       distancia: distanciaRedondeada,
       validacion: 'ok',
       mensaje: `${distanciaRedondeada}m del origen`,
     };
   }
 
   // Fuera de rango - NO BLOQUEANTE, solo advertencia para auditoría
   return {
     valido: true,
     distancia: distanciaRedondeada,
     validacion: 'fuera_rango',
     mensaje: `${distanciaRedondeada}m del origen - será auditado`,
   };
 }
 
 /**
  * Formatea distancia para mostrar en UI
  */
 export function formatearDistancia(metros: number | null): string {
   if (metros === null) return 'Sin GPS';
   if (metros < 1000) return `${metros}m`;
   return `${(metros / 1000).toFixed(1)}km`;
 }
 
 /**
  * Verifica si el navegador soporta geolocalización
  */
 export function isGeolocationSupported(): boolean {
   return 'geolocation' in navigator;
 }
 
 /**
  * Solicita permisos de geolocalización
  * @returns true si se obtuvieron permisos, false si fueron denegados
  */
 export async function requestGeolocationPermission(): Promise<boolean> {
   if (!isGeolocationSupported()) return false;
 
   try {
     const permission = await navigator.permissions.query({
       name: 'geolocation',
     });
     return permission.state === 'granted' || permission.state === 'prompt';
   } catch {
     // Fallback: intentar obtener ubicación directamente
     try {
       await getCurrentPosition();
       return true;
     } catch {
       return false;
     }
   }
 }