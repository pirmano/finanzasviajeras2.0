
export enum ExpenseCategory {
  ALOJAMIENTO = 'Alojamiento',
  ACTIVIDADES = 'Actividades',
  COMIDA = 'Comida',
  TRANSPORTE = 'Transporte',
  ENTRADAS = 'Entradas',
  COMPRAS = 'Compras',
  OTROS = 'Otros',
}

export interface Expense {
  id: string;
  tripId: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: ExpenseCategory;
  description: string;
  paidBy: string; // Participant name
  proofImage?: string; // Base64 encoded image string
  paymentMethod?: 'tarjeta' | 'efectivo' | '';
}

export interface Participant {
  name: string;
}

export interface Trip {
  id: string;
  name:string;
  participants: Participant[];
  tripCode: string; // Unique code for sharing/joining
}

export interface User {
  username: string;
}

export interface StoredUser {
  username: string;
  password?: string;
}

export interface SettledPayment {
  from: string;
  to: string;
  amount: number;
}

// --- New Types for "RECUERDOS" ---
export interface MediaItem {
  id: string;
  tripId: string;
  uploader: string; // Participant name
  type: 'image' | 'video';
  dataUrl: string; // Base64 encoded data
  fileName: string;
  uploadedAt: string; // ISO date string
  description?: string;
}

// --- New Types for "INFO" ---
export enum InfoItemType {
  BOARDING_PASS = 'Tarjeta de Embarque',
  HOTEL_RESERVATION = 'Reserva de Hotel',
  ATTRACTION_TICKET = 'Entrada Atracción',
  NOTE_TEXT = 'Nota de Texto',
  NOTE_AUDIO = 'Nota de Audio',
  OTHER = 'Otro Documento',
}

export const INFO_ITEM_TYPES = Object.values(InfoItemType); // Exported for use

export interface InfoItem {
  id: string;
  tripId: string;
  title: string;
  type: InfoItemType;
  details?: string; // For text notes or descriptions
  fileDataUrl?: string; // Base64 for uploaded files (boarding pass, ticket, audio)
  fileName?: string;
  date?: string; // Relevant date for the item (e.g., flight date, check-in date)
  time?: string; // Relevant time
  isCompleted: boolean;
  reminderEnabled: boolean; // UI only, no real notifications
  addedBy: string; // Participant name
  createdAt: string; // ISO date string
}

// --- New Types for "CHAT" ---
export interface ChatMessage {
  id: string;
  tripId: string;
  sender: string; // Participant name or current user's name
  text: string;
  timestamp: string; // ISO date string
  // isReadBy?: { [participantName: string]: boolean }; // Future enhancement
}

// --- New Types for "ITINERARIO" ---
export enum ItineraryItemCategory { // Example categories, can be expanded
  VISIT = 'Visita Turística',
  MEAL = 'Comida',
  ACTIVITY = 'Actividad Planificada',
  TRANSPORT = 'Transporte Programado',
  NOTE = 'Nota de Planning',
  OTHER = 'Otro',
}
export const ITINERARY_ITEM_CATEGORIES = Object.values(ItineraryItemCategory);


export interface ItineraryItem {
  id: string;
  tripId: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM (optional)
  category?: ItineraryItemCategory; // Optional category
  notes?: string;
  location?: string; // Address or name of place (optional)
  isCompleted: boolean;
  addedBy: string; // Participant name
  createdAt: string; // ISO date string
}

// --- New Types for "MAPAS" ---
export interface MarkedLocation {
  id: string;
  tripId: string;
  name: string; // User-defined name for the marked location
  query: string; // The search query used for Google Maps
  addedAt: string; // ISO date string
}