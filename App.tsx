import React, { useState, useEffect, useCallback, useMemo, useRef, forwardRef } from 'react';
import { Trip, Expense, User, Participant, ExpenseCategory, SettledPayment, StoredUser, MediaItem, InfoItem, InfoItemType, ChatMessage, INFO_ITEM_TYPES, ItineraryItem, ItineraryItemCategory, ITINERARY_ITEM_CATEGORIES, MarkedLocation } from './types';
import { CATEGORIES, CATEGORY_DETAILS, TEST_USER_USERNAME, TEST_USER_PASSWORD, APP_NAME, CHART_COLORS, INFO_ITEM_TYPE_DETAILS, MAIN_VIEW_ICONS, GASTOS_SUBVIEW_ICONS } from './constants';
import useLocalStorage from './hooks/useLocalStorage';
import useCurrentTime from './hooks/useCurrentTime';
import CategoryBarChart from './CategoryBarChart';

declare global {
  interface Window {
    jspdf?: {
      jsPDF: new (options?: any) => any;
    };
    Chart?: any;
    MediaRecorder: typeof MediaRecorder; // Add MediaRecorder
  }
}

// --- Helper Functions ---
const generateTripCode = (): string => {
  const S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1).toUpperCase();
  return `TF-${S4()}-${S4()}`;
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text)
    .then(() => alert('Código del viaje copiado al portapapeles!'))
    .catch(err => console.error('Error al copiar el código: ', err));
};

const formatDate = (dateString: string, options?: Intl.DateTimeFormatOptions) => {
  const defaultOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  // Ensure the date string is treated as local time by appending T00:00:00 if it's just a date
  const date = dateString.includes('T') ? new Date(dateString) : new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('es-ES', options || defaultOptions);
};

// --- UI Helper Components ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', size = 'md', iconLeft, iconRight, ...props }) => {
  const baseStyle = "font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed focus:ring-offset-black flex items-center justify-center space-x-2";
  const variantStyles = {
    primary: "bg-teal-500 hover:bg-teal-600 text-white focus:ring-teal-400",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-100 focus:ring-slate-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    ghost: "bg-transparent hover:bg-slate-700 text-slate-100 focus:ring-teal-500",
    link: "bg-transparent hover:text-teal-400 text-teal-500 focus:ring-teal-500 underline",
  };
  const sizeStyles = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };
  return (
    <button className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`} {...props}>
      {iconLeft}
      {children && <span>{children}</span>}
      {iconRight}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, id, error, className, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>}
      <input
        id={id}
        ref={ref} // Pass the ref to the actual input element
        className={`block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-slate-800 text-white ${error ? 'border-red-500' : ''} ${props.type === 'file' ? 'file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
});
Input.displayName = "Input";


interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
const Textarea: React.FC<TextareaProps> = ({ label, id, error, className, ...props }) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>}
      <textarea
        id={id}
        className={`block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-slate-800 text-white ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
};


interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}
const Select: React.FC<SelectProps> = ({ label, id, children, error, className, ...props }) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1">{label}</label>}
      <select
        id={id}
        className={`block w-full px-3 py-2 border border-slate-600 bg-slate-800 text-white rounded-md shadow-sm focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
};

const Card: React.FC<{ children: React.ReactNode; className?: string; noPadding?: boolean }> = ({ children, className, noPadding }) => {
  return <div className={`bg-slate-800 border border-slate-700 rounded-xl ${noPadding ? '' : 'p-4 md:p-6'} ${className}`}>{children}</div>;
};

// --- App Component ---
type AppView = 'auth' | 'trip_dashboard' | 'trip_create' | 'trip_join' | 'active_trip';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('travelfin-user', null);
  const [storedUsers, setStoredUsers] = useLocalStorage<StoredUser[]>('travelfin-stored-users', []);
  const [trips, setTrips] = useLocalStorage<Trip[]>('travelfin-trips', []);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('travelfin-expenses', []);
  const [mediaItems, setMediaItems] = useLocalStorage<MediaItem[]>('travelfin-media-items', []);
  const [infoItems, setInfoItems] = useLocalStorage<InfoItem[]>('travelfin-info-items', []);
  const [chatMessages, setChatMessages] = useLocalStorage<ChatMessage[]>('travelfin-chat-messages', []);
  const [itineraryItems, setItineraryItems] = useLocalStorage<ItineraryItem[]>('travelfin-itinerary-items', []);
  const [markedMapLocations, setMarkedMapLocations] = useLocalStorage<MarkedLocation[]>('travelfin-marked-locations', []);
  const [activeTripId, setActiveTripId] = useLocalStorage<string | null>('travelfin-activeTripId', null);
  
  const [view, setView] = useState<AppView>('auth');
  const [joinTripError, setJoinTripError] = useState<string | null>(null);
  const [showTripCodeModal, setShowTripCodeModal] = useState<string | null>(null); // Stores code of newly created trip
  const [authFormInitialValues, setAuthFormInitialValues] = useState<{username?: string, password?: string} | null>(null);


  const currentTime = useCurrentTime({ month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  useEffect(() => {
    if (storedUsers.length === 0) {
      setStoredUsers([{ username: TEST_USER_USERNAME, password: TEST_USER_PASSWORD }]);
    }
  }, [storedUsers, setStoredUsers]);

  useEffect(() => {
    if (currentUser) {
      if (activeTripId && trips.find(t => t.id === activeTripId)) {
        setView('active_trip');
      } else {
        setView('trip_dashboard');
      }
    } else {
      setView('auth');
    }
  }, [currentUser, activeTripId, trips]);

  const activeTrip = useMemo(() => {
    if (!activeTripId) return null;
    return trips.find(trip => trip.id === activeTripId) || null;
  }, [activeTripId, trips]);

  const activeTripExpenses = useMemo(() => {
    if (!activeTripId) return [];
    return expenses.filter(exp => exp.tripId === activeTripId).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.id.localeCompare(a.id));
  }, [activeTripId, expenses]);

  const activeTripMediaItems = useMemo(() => {
    if (!activeTripId) return [];
    return mediaItems.filter(item => item.tripId === activeTripId).sort((a,b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [activeTripId, mediaItems]);

  const activeTripInfoItems = useMemo(() => {
    if (!activeTripId) return [];
    return infoItems.filter(item => item.tripId === activeTripId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [activeTripId, infoItems]);

  const activeTripChatMessages = useMemo(() => {
    if (!activeTripId) return [];
    return chatMessages.filter(msg => msg.tripId === activeTripId).sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [activeTripId, chatMessages]);
  
  const activeTripItineraryItems = useMemo(() => {
    if (!activeTripId) return [];
    return itineraryItems.filter(item => item.tripId === activeTripId).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime() || (a.time || "00:00").localeCompare(b.time || "00:00"));
  }, [activeTripId, itineraryItems]);

  const activeTripMarkedLocations = useMemo(() => {
    if(!activeTripId) return [];
    return markedMapLocations.filter(loc => loc.tripId === activeTripId).sort((a,b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
  }, [activeTripId, markedMapLocations]);


  const handleLogin = (username: string, pass: string): boolean => {
    const userExists = storedUsers.find(
      (user) => user.username === username && user.password === pass
    );
    if (userExists) {
      setCurrentUser({ username: userExists.username });
      setAuthFormInitialValues(null); // Clear initial values after successful login
      return true;
    }
    return false;
  };
  
  const handleRegister = (username: string, pass: string, confirmPass: string): string | true => {
    if (!username.trim() || !pass.trim()) return "El nombre de usuario y la contraseña no pueden estar vacíos.";
    if (pass !== confirmPass) return "Las contraseñas no coinciden.";
    if (storedUsers.some(user => user.username === username)) return "El nombre de usuario ya existe.";
    setStoredUsers(prev => [...prev, { username, password: pass }]);
    setAuthFormInitialValues({ username, password: pass }); // Set initial values for login form
    return true;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTripId(null);
    setAuthFormInitialValues(null);
  };

  const handleCreateTrip = (name: string, participantNames: string[]) => {
    if (!name.trim() || participantNames.length === 0 || participantNames.some(p => !p.trim())) {
      alert("El nombre del viaje y los nombres de los participantes no pueden estar vacíos.");
      return;
    }
    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      name,
      participants: participantNames.map(pName => ({ name: pName.trim() })),
      tripCode: generateTripCode(),
    };
    setTrips(prev => [...prev, newTrip]);
    setActiveTripId(newTrip.id);
    setShowTripCodeModal(newTrip.tripCode); // Show modal with code
  };

  const handleJoinTrip = (tripCode: string) => {
    setJoinTripError(null);
    const tripToJoin = trips.find(t => t.tripCode === tripCode.trim());
    if (tripToJoin) {
      setActiveTripId(tripToJoin.id);
      setView('active_trip');
    } else {
      setJoinTripError("Viaje no encontrado con este código. Para unirte, los datos completos del viaje (no solo el código) deben haber sido importados o compartidos previamente en este dispositivo. Pídele al creador del viaje que comparta los datos si es necesario.");
    }
  };
  
  const handleDeleteTrip = (tripId: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este viaje y todos sus datos asociados (gastos, recuerdos, info, itinerario, chat, lugares marcados)? Esta acción no se puede deshacer.")) return;
    setTrips(prev => prev.filter(t => t.id !== tripId));
    setExpenses(prev => prev.filter(e => e.tripId !== tripId));
    setMediaItems(prev => prev.filter(m => m.tripId !== tripId));
    setInfoItems(prev => prev.filter(i => i.tripId !== tripId));
    setChatMessages(prev => prev.filter(c => c.tripId !== tripId));
    setItineraryItems(prev => prev.filter(it => it.tripId !== tripId));
    setMarkedMapLocations(prev => prev.filter(ml => ml.tripId !== tripId));
    if (activeTripId === tripId) {
      setActiveTripId(null);
      setView('trip_dashboard');
    }
  };

  const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'tripId'>) => {
    if (!activeTripId) return;
    const newExpense: Expense = { ...expenseData, id: `exp-${Date.now()}`, tripId: activeTripId };
    setExpenses(prev => [...prev, newExpense]);
  };
  
  const handleDeleteExpense = (expenseId: string) => {
     if (!window.confirm("¿Estás seguro de que quieres eliminar este gasto?")) return;
     setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
  };

  const handleAddMediaItem = (item: Omit<MediaItem, 'id' | 'tripId' | 'uploader'>) => {
    if (!activeTripId || !currentUser) return;
    const newMediaItem: MediaItem = { ...item, id: `media-${Date.now()}`, tripId: activeTripId, uploader: currentUser.username };
    setMediaItems(prev => [...prev, newMediaItem]);
  };
  const handleDeleteMediaItem = (itemId: string) => {
    if (!window.confirm("¿Eliminar este recuerdo?")) return;
    setMediaItems(prev => prev.filter(item => item.id !== itemId));
  };
  
  const handleAddInfoItem = (item: Omit<InfoItem, 'id' | 'tripId' | 'addedBy' | 'createdAt' | 'isCompleted' | 'reminderEnabled'>) => {
    if (!activeTripId || !currentUser) return;
    const newInfoItem: InfoItem = { 
      ...item, 
      id: `info-${Date.now()}`, 
      tripId: activeTripId, 
      addedBy: currentUser.username, 
      createdAt: new Date().toISOString(),
      isCompleted: false,
      reminderEnabled: false,
    };
    setInfoItems(prev => [...prev, newInfoItem]);
  };
  const handleUpdateInfoItem = (updatedItem: InfoItem) => {
    setInfoItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };
  const handleDeleteInfoItem = (itemId: string) => {
    if (!window.confirm("¿Eliminar esta información?")) return;
    setInfoItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleAddChatMessage = (text: string) => {
    if (!activeTripId || !currentUser || !text.trim()) return;
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      tripId: activeTripId,
      sender: currentUser.username,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const handleAddItineraryItem = (item: Omit<ItineraryItem, 'id' | 'tripId' | 'addedBy' | 'createdAt' | 'isCompleted'>) => {
    if (!activeTripId || !currentUser) return;
    const newItineraryItem: ItineraryItem = {
      ...item,
      id: `itinerary-${Date.now()}`,
      tripId: activeTripId,
      addedBy: currentUser.username,
      createdAt: new Date().toISOString(),
      isCompleted: false,
    };
    setItineraryItems(prev => [...prev, newItineraryItem]);
  };
  const handleUpdateItineraryItem = (updatedItem: ItineraryItem) => {
    setItineraryItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };
  const handleDeleteItineraryItem = (itemId: string) => {
    if (!window.confirm("¿Eliminar este elemento del itinerario?")) return;
    setItineraryItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleAddMarkedMapLocation = (name: string, query: string) => {
    if(!activeTripId || !name.trim() || !query.trim()) return;
    const newLocation: MarkedLocation = {
        id: `maploc-${Date.now()}`,
        tripId: activeTripId,
        name: name.trim(),
        query: query.trim(),
        addedAt: new Date().toISOString(),
    };
    setMarkedMapLocations(prev => [...prev, newLocation]);
  };
  const handleDeleteMarkedMapLocation = (locationId: string) => {
    if(!window.confirm("¿Eliminar este lugar guardado del mapa?")) return;
    setMarkedMapLocations(prev => prev.filter(loc => loc.id !== locationId));
  };


  // --- Render Views ---
  const renderAuthScreen = () => <AuthScreen onLogin={handleLogin} onRegister={handleRegister} initialValues={authFormInitialValues} />;
  
  const renderTripDashboardView = () => (
    <div className="p-4 md:p-6 flex-grow flex flex-col max-w-3xl mx-auto w-full">
      <AppHeader title="Tus Viajes" onLogout={handleLogout} currentTime={currentTime} />
      <div className="flex space-x-4 mb-6">
        <Button onClick={() => setView('trip_create')} size="lg" className="flex-1" iconLeft={<PlusIcon />}>Crear Viaje</Button>
        <Button onClick={() => setView('trip_join')} variant="secondary" size="lg" className="flex-1" iconLeft={<UserGroupIcon />}>Unirse a Viaje</Button>
      </div>
      {trips.length === 0 ? (
        <Card className="text-center py-10">
          <NoSymbolIcon className="w-24 h-24 text-slate-600 mx-auto mb-4" />
          <p className="text-xl font-semibold text-slate-100 mb-2">¡Aún no hay viajes!</p>
          <p className="text-slate-400">Comienza creando uno nuevo o uniéndote a uno existente.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {trips.map(trip => (
            <Card key={trip.id} className="flex items-center justify-between hover:border-slate-600 transition-colors">
              <div>
                <h2 className="text-xl font-semibold text-teal-400">{trip.name}</h2>
                <p className="text-sm text-slate-400">Participantes: {trip.participants.map(p => p.name).join(', ')}</p>
                <p className="text-xs text-slate-500 mt-1">Código: {trip.tripCode} <Button variant="link" size="sm" className="p-0 ml-1 text-xs" onClick={() => copyToClipboard(trip.tripCode)}>Copiar</Button></p>
              </div>
              <div className="flex space-x-2">
                 <Button onClick={() => setActiveTripId(trip.id)} variant="primary" size="sm">Abrir</Button>
                 <Button onClick={() => handleDeleteTrip(trip.id)} variant="danger" size="sm" aria-label="Eliminar viaje">
                    <TrashIcon className="w-4 h-4"/>
                 </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderTripCreateView = () => (
     <div className="p-4 md:p-6 flex-grow flex flex-col max-w-xl mx-auto w-full">
        <AppHeader title="Crear Nuevo Viaje" onLogout={handleLogout} currentTime={currentTime} showBackButton={() => setView('trip_dashboard')}/>
        <TripCreateForm onSubmit={handleCreateTrip} onCancel={() => setView('trip_dashboard')} />
     </div>
  );

  const renderTripJoinView = () => (
    <div className="p-4 md:p-6 flex-grow flex flex-col max-w-xl mx-auto w-full">
      <AppHeader title="Unirse a Viaje Existente" onLogout={handleLogout} currentTime={currentTime} showBackButton={() => setView('trip_dashboard')} />
      <Card className="mt-4">
        <form onSubmit={(e) => { e.preventDefault(); const code = (e.target as any).tripCode.value; handleJoinTrip(code); }} className="space-y-4">
          <Input label="Código del Viaje" id="tripCode" name="tripCode" type="text" placeholder="Ingresa el código del viaje" required />
          {joinTripError && <p className="text-sm text-red-400">{joinTripError}</p>}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="secondary" onClick={() => setView('trip_dashboard')}>Cancelar</Button>
            <Button type="submit">Unirse al Viaje</Button>
          </div>
        </form>
      </Card>
    </div>
  );

  const renderActiveTripView = () => {
    if (!activeTrip || !currentUser) return <p className="text-center p-10">Cargando viaje...</p>;
    return (
      <ActiveTripContext.Provider value={{ 
          trip: activeTrip, 
          currentUser,
          expenses: activeTripExpenses, addExpense: handleAddExpense, deleteExpense: handleDeleteExpense, 
          mediaItems: activeTripMediaItems, addMediaItem: handleAddMediaItem, deleteMediaItem: handleDeleteMediaItem,
          infoItems: activeTripInfoItems, addInfoItem: handleAddInfoItem, updateInfoItem: handleUpdateInfoItem, deleteInfoItem: handleDeleteInfoItem,
          chatMessages: activeTripChatMessages, addChatMessage: handleAddChatMessage,
          itineraryItems: activeTripItineraryItems, addItineraryItem: handleAddItineraryItem, updateItineraryItem: handleUpdateItineraryItem, deleteItineraryItem: handleDeleteItineraryItem,
          markedMapLocations: activeTripMarkedLocations, addMarkedMapLocation: handleAddMarkedMapLocation, deleteMarkedMapLocation: handleDeleteMarkedMapLocation,
          navigateBack: () => setActiveTripId(null) 
      }}>
        <ActiveTripView onLogout={handleLogout} currentTimeGlobal={currentTime}/>
      </ActiveTripContext.Provider>
    );
  };
  
  let currentRenderView;
  switch(view) {
    case 'auth': currentRenderView = renderAuthScreen(); break;
    case 'trip_dashboard': currentRenderView = renderTripDashboardView(); break;
    case 'trip_create': currentRenderView = renderTripCreateView(); break;
    case 'trip_join': currentRenderView = renderTripJoinView(); break;
    case 'active_trip': currentRenderView = renderActiveTripView(); break;
    default: currentRenderView = <p className="text-center p-10 text-red-400">Error: Estado de vista desconocido.</p>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      {currentRenderView}
      {showTripCodeModal && activeTrip && (
        <Modal title="¡Viaje Creado!" onClose={() => setShowTripCodeModal(null)}>
          <p className="text-slate-300 mb-2">Tu nuevo viaje "{activeTrip.name}" ha sido creado.</p>
          <p className="text-slate-300 mb-4">Comparte este código con otros participantes. Para que puedan ver los detalles del viaje en sus dispositivos, necesitarán que les compartas manualmente los datos del viaje (la app aún no tiene sincronización automática):</p>
          <div className="bg-slate-700 p-3 rounded-md text-center mb-4">
            <p className="text-2xl font-mono text-teal-400">{showTripCodeModal}</p>
          </div>
          <Button onClick={() => { copyToClipboard(showTripCodeModal); setShowTripCodeModal(null); }} className="w-full">Copiar Código y Cerrar</Button>
        </Modal>
      )}
    </div>
  );
};

// --- Modal Component ---
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode;}> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
    <Card className="w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
        <Button variant="ghost" size="sm" onClick={onClose} className="p-1" aria-label="Cerrar modal">
          <XMarkIcon className="w-6 h-6" />
        </Button>
      </div>
      {children}
    </Card>
  </div>
);


// --- Sub-Components for Views ---
interface AuthScreenProps {
  onLogin: (username: string, pass: string) => boolean;
  onRegister: (username: string, pass: string, confirmPass: string) => string | true;
  initialValues: {username?: string, password?: string} | null;
}
const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onRegister, initialValues }) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLoginSubmit = (username: string, pass: string) => {
    setError(null); setSuccessMessage(null);
    if (!onLogin(username, pass)) setError("Credenciales inválidas o usuario no encontrado.");
  };

  const handleRegisterSubmit = (username: string, pass: string, confirmPass: string) => {
    setError(null); setSuccessMessage(null);
    const result = onRegister(username, pass, confirmPass);
    if (result === true) {
      setSuccessMessage("¡Registro exitoso! Ahora puedes iniciar sesión.");
      setAuthMode('login');
    } else {
      setError(result);
    }
  };
  
  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 bg-black">
      <Card className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-center text-teal-400 mb-2">{APP_NAME}</h1>
        {authMode === 'login' ? (
          <>
            <p className="text-center text-slate-300 mb-6">Inicia sesión para gestionar tus viajes.</p>
            {error && <p className="text-sm text-red-400 mb-3 text-center">{error}</p>}
            {successMessage && <p className="text-sm text-green-400 mb-3 text-center">{successMessage}</p>}
            <LoginForm onSubmit={handleLoginSubmit} initialUsername={initialValues?.username} initialPassword={initialValues?.password}/>
            <p className="mt-6 text-center text-sm"><span className="text-slate-400">¿No tienes cuenta? </span><Button variant="link" size="sm" onClick={() => { setAuthMode('register'); setError(null); setSuccessMessage(null); }} className="p-0">Regístrate aquí</Button></p>
          </>
        ) : (
          <>
            <p className="text-center text-slate-300 mb-6">Crea una cuenta para empezar.</p>
            {error && <p className="text-sm text-red-400 mb-3 text-center">{error}</p>}
            <RegistrationForm onSubmit={handleRegisterSubmit} />
            <p className="mt-6 text-center text-sm"><span className="text-slate-400">¿Ya tienes cuenta? </span><Button variant="link" size="sm" onClick={() => { setAuthMode('login'); setError(null); setSuccessMessage(null); }} className="p-0">Inicia sesión</Button></p>
          </>
        )}
      </Card>
    </div>
  );
};

interface LoginFormProps { 
  onSubmit: (username: string, pass: string) => void; 
  initialUsername?: string; 
  initialPassword?: string;
}
const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, initialUsername, initialPassword }) => {
  const [username, setUsername] = useState(initialUsername || ''); 
  const [password, setPassword] = useState(initialPassword || '');
  
  useEffect(() => { // Update if initial values change (e.g., after registration)
    if(initialUsername) setUsername(initialUsername);
    if(initialPassword) setPassword(initialPassword);
  }, [initialUsername, initialPassword]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(username, password); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input type="text" placeholder="Usuario" value={username} onChange={e => setUsername(e.target.value)} required aria-label="Usuario" />
      <Input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required aria-label="Contraseña" />
      <Button type="submit" className="w-full" size="lg">Iniciar Sesión</Button>
    </form>
  );
};

interface RegistrationFormProps { onSubmit: (username: string, pass: string, confirmPass: string) => void; }
const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSubmit }) => {
  const [username, setUsername] = useState(''); const [password, setPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState('');
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSubmit(username, password, confirmPassword); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input type="text" placeholder="Nombre de usuario" value={username} onChange={e => setUsername(e.target.value)} required aria-label="Nombre de usuario" />
      <Input type="password" placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)} required aria-label="Contraseña"/>
      <Input type="password" placeholder="Confirmar contraseña" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required aria-label="Confirmar contraseña"/>
      <Button type="submit" className="w-full" size="lg">Registrarse</Button>
    </form>
  );
};

interface TripCreateFormProps { onSubmit: (name: string, participants: string[]) => void; onCancel: () => void; }
const TripCreateForm: React.FC<TripCreateFormProps> = ({ onSubmit, onCancel }) => {
  const [tripName, setTripName] = useState(''); const [participantsStr, setParticipantsStr] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const participantNames = participantsStr.split(',').map(p => p.trim()).filter(p => p);
    if (participantNames.length === 0) { alert("Por favor, añade al menos un participante."); return; }
    onSubmit(tripName, participantNames);
  };
  return (
    <Card className="mt-4">
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input label="Nombre del Viaje" id="tripName" type="text" placeholder="Ej: Vacaciones en Italia" value={tripName} onChange={e => setTripName(e.target.value)} required />
        <div>
          <Input label="Participantes" id="participants" type="text" placeholder="Ej: Ana, Juan, Eva (separados por comas)" value={participantsStr} onChange={e => setParticipantsStr(e.target.value)} required />
          <p className="mt-1 text-xs text-slate-400">Introduce los nombres separados por comas.</p>
        </div>
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
          <Button type="submit">Crear Viaje</Button>
        </div>
      </form>
    </Card>
  );
};


interface AppHeaderProps { title: string; onLogout: () => void; currentTime: string; showBackButton?: () => void; tripCode?: string | null;}
const AppHeader: React.FC<AppHeaderProps> = ({ title, onLogout, currentTime, showBackButton, tripCode }) => (
    <header className="mb-6 pb-4 border-b border-slate-700">
        <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
                {showBackButton && (
                     <Button onClick={showBackButton} variant="ghost" size="sm" className="p-1" aria-label="Volver">
                        <ArrowLeftIcon className="w-6 h-6"/>
                    </Button>
                )}
                <h1 className="text-2xl md:text-3xl font-bold text-teal-400">{title}</h1>
            </div>
            <Button onClick={onLogout} variant="secondary" size="sm">Cerrar Sesión</Button>
        </div>
        <div className="flex justify-between items-center">
            <p className="text-sm text-slate-400 mt-1">{currentTime}</p>
            {tripCode && (
                <div className="text-sm text-slate-400 mt-1">
                    Código del Viaje: <span className="font-semibold text-teal-300">{tripCode}</span>
                    <Button variant="link" size="sm" className="p-0 ml-2 text-xs" onClick={() => copyToClipboard(tripCode)}>Copiar</Button>
                </div>
            )}
        </div>
    </header>
);

// --- Active Trip Context & View ---
interface ActiveTripContextType {
  trip: Trip;
  currentUser: User;
  expenses: Expense[];
  addExpense: (expenseData: Omit<Expense, 'id' | 'tripId'>) => void;
  deleteExpense: (expenseId: string) => void;
  mediaItems: MediaItem[];
  addMediaItem: (item: Omit<MediaItem, 'id' | 'tripId' | 'uploader'>) => void;
  deleteMediaItem: (itemId: string) => void;
  infoItems: InfoItem[];
  addInfoItem: (item: Omit<InfoItem, 'id' | 'tripId' | 'addedBy' | 'createdAt'| 'isCompleted' | 'reminderEnabled'>) => void;
  updateInfoItem: (updatedItem: InfoItem) => void;
  deleteInfoItem: (itemId: string) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (text: string) => void;
  itineraryItems: ItineraryItem[];
  addItineraryItem: (item: Omit<ItineraryItem, 'id' | 'tripId' | 'addedBy' | 'createdAt' | 'isCompleted'>) => void;
  updateItineraryItem: (updatedItem: ItineraryItem) => void;
  deleteItineraryItem: (itemId: string) => void;
  markedMapLocations: MarkedLocation[];
  addMarkedMapLocation: (name: string, query: string) => void;
  deleteMarkedMapLocation: (locationId: string) => void;
  navigateBack: () => void;
}

const ActiveTripContext = React.createContext<ActiveTripContextType | null>(null);

const useActiveTrip = () => {
  const context = React.useContext(ActiveTripContext);
  if (!context) throw new Error("useActiveTrip debe usarse dentro de un ActiveTripProvider");
  return context;
};

type MainTripView = 'GASTOS' | 'RECUERDOS' | 'INFO' | 'MAPAS' | 'CHAT' | 'ITINERARIO';
type GastosSubView = 'list' | 'add' | 'summary' | 'calendar';


const ActiveTripView: React.FC<{onLogout: () => void; currentTimeGlobal: string}> = ({onLogout, currentTimeGlobal}) => {
  const { trip, navigateBack } = useActiveTrip();
  const [currentMainView, setCurrentMainView] = useState<MainTripView>('GASTOS');
  const [unreadMessages, setUnreadMessages] = useState(0); 
  const chatAudioRef = useRef<HTMLAudioElement | null>(null);
  const { chatMessages, currentUser } = useActiveTrip(); 

  useEffect(() => {
    if (typeof Audio !== "undefined") {
        chatAudioRef.current = new Audio("https://cdn.freesound.org/previews/505/505707_9859089-lq.mp3"); 
        chatAudioRef.current.volume = 0.3;
    }
  }, []);
  
  useEffect(() => {
    if (currentMainView !== 'CHAT' && chatMessages.length > 0) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage && lastMessage.sender !== currentUser.username) {
         setUnreadMessages(prev => prev + 1); 
         if (chatAudioRef.current) {
            chatAudioRef.current.play().catch(e => console.error("Error playing sound:", e));
         }
      }
    }
  }, [chatMessages, currentMainView, currentUser.username]);


  const renderMainContent = () => {
    switch(currentMainView) {
      case 'GASTOS': return <GastosView />;
      case 'RECUERDOS': return <RecuerdosView />;
      case 'INFO': return <InfoView />;
      case 'MAPAS': return <MapasView />;
      case 'CHAT': return <ChatView />;
      case 'ITINERARIO': return <ItinerarioView />;
      default: return <p>Sección no encontrada.</p>;
    }
  };

  const mainViews: MainTripView[] = ['GASTOS', 'RECUERDOS', 'INFO', 'MAPAS', 'CHAT', 'ITINERARIO'];

  return (
    <div className="flex-grow flex flex-col p-4 md:p-6 max-w-4xl mx-auto w-full"> 
        <AppHeader title={trip.name} onLogout={onLogout} currentTime={currentTimeGlobal} showBackButton={navigateBack} tripCode={trip.tripCode} />

        <div className="mb-6 flex border-b border-slate-700 space-x-1 overflow-x-auto pb-px">
            {mainViews.map(viewKey => (
                 <button
                    key={viewKey}
                    onClick={() => {
                        setCurrentMainView(viewKey);
                        if (viewKey === 'CHAT') setUnreadMessages(0); 
                    }}
                    className={`px-3 py-3 text-sm font-medium capitalize -mb-px border-b-2 flex items-center space-x-2 whitespace-nowrap
                        ${currentMainView === viewKey 
                            ? 'border-teal-500 text-teal-400' 
                            : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'}`}
                    aria-current={currentMainView === viewKey ? 'page' : undefined}
                >
                    {MAIN_VIEW_ICONS[viewKey]}
                    <span>{viewKey.toLowerCase()}</span>
                    {viewKey === 'CHAT' && unreadMessages > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{unreadMessages > 9 ? '9+' : unreadMessages}</span>
                    )}
                </button>
            ))}
        </div>
        <div className="flex-grow">
          {renderMainContent()}
        </div>
    </div>
  );
};

// --- GASTOS Section ---
const GastosView: React.FC = () => {
  const { trip, expenses, addExpense, deleteExpense } = useActiveTrip();
  const [currentSubView, setCurrentSubView] = useState<GastosSubView>('list');
  const [newExpense, setNewExpense] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      date: today, amount: '' as string | number, category: CATEGORIES[0],
      description: '', paidBy: trip.participants[0]?.name || '',
      proofImage: undefined as string | undefined, paymentMethod: '' as 'tarjeta' | 'efectivo' | '',
    };
  });
  const [proofImagePreviewUrl, setProofImagePreviewUrl] = useState<string | null>(null);
  const proofImageInputRef = useRef<HTMLInputElement>(null);
  const [formError, setFormError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'file') { 
        const fileInput = e.target as HTMLInputElement;
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewExpense(prev => ({ ...prev, proofImage: reader.result as string }));
                setProofImagePreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setNewExpense(prev => ({ ...prev, proofImage: undefined }));
            setProofImagePreviewUrl(null);
        }
    } else {
        setNewExpense(prev => ({ ...prev, [name]: name === 'amount' ? (value === '' ? '' : value) : value }));
    }
  };
  const handleRemoveProofImage = () => { 
    setNewExpense(prev => ({ ...prev, proofImage: undefined }));
    setProofImagePreviewUrl(null);
    if (proofImageInputRef.current) proofImageInputRef.current.value = '';
  };
  const handleAddExpenseSubmit = (e: React.FormEvent) => { 
    e.preventDefault();
    const amountStr = String(newExpense.amount).trim().replace(',', '.');
    if (amountStr === '' || parseFloat(amountStr) <= 0) { setFormError("La cantidad es obligatoria y debe ser mayor que cero."); return; }
    const numericAmount = parseFloat(amountStr);
    if (isNaN(numericAmount)) { setFormError("La cantidad debe ser un número válido."); return; }
    if (!newExpense.paidBy) { setFormError("Por favor, selecciona quién pagó."); return; }
    setFormError('');
    addExpense({ ...newExpense, amount: numericAmount, paymentMethod: newExpense.paymentMethod || undefined });
    setNewExpense({ date: new Date().toISOString().split('T')[0], amount: '', category: CATEGORIES[0], description: '', paidBy: trip.participants[0]?.name || '', proofImage: undefined, paymentMethod: '' });
    setProofImagePreviewUrl(null);
    if (proofImageInputRef.current) proofImageInputRef.current.value = '';
    setCurrentSubView('list'); 
  };
  
  const totalTripCost = useMemo(() => expenses.reduce((sum, exp) => sum + exp.amount, 0), [expenses]);
  const expensesByCategory = useMemo(() => {
    const byCategory: Record<ExpenseCategory, number> = {} as Record<ExpenseCategory, number>;
    CATEGORIES.forEach(cat => byCategory[cat] = 0);
    expenses.forEach(exp => { byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount; });
    return byCategory;
  }, [expenses]);
  const expensesByParticipant = useMemo(() => { 
    const byParticipant: Record<string, number> = {};
    trip.participants.forEach(p => byParticipant[p.name] = 0);
    expenses.forEach(exp => { byParticipant[exp.paidBy] = (byParticipant[exp.paidBy] || 0) + exp.amount; });
    return byParticipant;
  }, [expenses, trip.participants]);
  const settledPayments = useMemo(() => { 
    if (trip.participants.length < 2 || totalTripCost === 0) return [];
    const avgCost = totalTripCost / trip.participants.length;
    const balances: Record<string, number> = {};
    trip.participants.forEach(p => { balances[p.name] = (expensesByParticipant[p.name] || 0) - avgCost; });
    const debtors = Object.entries(balances).filter(([,amt]) => amt < -0.005).sort((a,b) => a[1] - b[1]); 
    const creditors = Object.entries(balances).filter(([,amt]) => amt > 0.005).sort((a,b) => b[1] - a[1]);
    const payments: SettledPayment[] = []; let dIdx = 0; let cIdx = 0;
    while(dIdx < debtors.length && cIdx < creditors.length) {
      const transfer = Math.min(-debtors[dIdx][1], creditors[cIdx][1]);
      if (transfer > 0.005) { payments.push({ from: debtors[dIdx][0], to: creditors[cIdx][0], amount: transfer }); }
      debtors[dIdx][1] += transfer; creditors[cIdx][1] -= transfer;
      if (Math.abs(debtors[dIdx][1]) < 0.005) dIdx++;
      if (Math.abs(creditors[cIdx][1]) < 0.005) cIdx++;
    }
    return payments;
  }, [totalTripCost, expensesByParticipant, trip.participants]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  
  const handleExportPDF = () => { 
    if (!window.jspdf || !window.jspdf.jsPDF) { console.error("jsPDF not loaded."); alert("Error exporting PDF."); return; }
    const { jsPDF: JSPDF } = window.jspdf; const doc = new JSPDF(); let y = 15;
    const addLine = (text: string, size=10, indent=10) => { doc.setFontSize(size); doc.text(text, indent, y); y += (size * 0.5 + 2); if (y > 280) { doc.addPage(); y = 15;}};
    
    addLine(`Resumen del Viaje: ${trip.name}`, 18); y += 5;
    
    addLine('Resumen General', 14);
    addLine(`Costo Total: ${formatCurrency(totalTripCost)}`);
    addLine(`Total de gastos: ${expenses.length}`); y += 5;

    addLine('Gastos por Participante', 14);
    Object.entries(expensesByParticipant).forEach(([name, amount]) => {
      addLine(`${name}: ${formatCurrency(amount)}`);
    });
    y += 5;

    addLine('Gastos por Categoría', 14);
    Object.entries(expensesByCategory).forEach(([category, amount]) => {
        if (amount > 0) addLine(`${category}: ${formatCurrency(amount)}`);
    });
    y += 5;

    if (settledPayments.length > 0) {
        addLine('Liquidación de Cuentas', 14);
        settledPayments.forEach(payment => {
            addLine(`${payment.from} paga a ${payment.to}: ${formatCurrency(payment.amount)}`);
        });
    }

    doc.save(`resumen_viaje_${trip.name.replace(/\s/g, '_')}.pdf`);
  };
  const chartDataByCategory = useMemo(() => { 
    const labels: string[] = []; const data: number[] = []; const backgroundColors: string[] = []; let cIdx = 0;
    CATEGORIES.forEach(cat => { if (expensesByCategory[cat] > 0) { labels.push(cat); data.push(expensesByCategory[cat]); backgroundColors.push(CHART_COLORS[cIdx % CHART_COLORS.length]); cIdx++; }});
    return { labels, data, backgroundColors };
  }, [expensesByCategory]);

  const gastosSubViews: GastosSubView[] = ['list', 'add', 'summary', 'calendar'];

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-600 space-x-1 overflow-x-auto">
        {gastosSubViews.map(viewKey => (
          <button
            key={viewKey}
            onClick={() => setCurrentSubView(viewKey)}
            className={`px-3 py-2.5 text-xs font-medium capitalize -mb-px border-b-2 flex items-center space-x-1.5 whitespace-nowrap
              ${currentSubView === viewKey ? 'border-teal-400 text-teal-300' : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'}`}
          >
            {GASTOS_SUBVIEW_ICONS[viewKey]}
            <span>{viewKey === 'list' ? 'Lista' : viewKey === 'add' ? 'Añadir' : viewKey === 'summary' ? 'Resumen' : 'Calendario'}</span>
          </button>
        ))}
      </div>

      {currentSubView === 'add' && ( 
        <Card>
            <h2 className="text-xl font-semibold text-slate-100 mb-4">Añadir Nuevo Gasto</h2>
            <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
                <Input label="Fecha" type="date" name="date" value={newExpense.date} onChange={handleInputChange} required />
                <Input label="Cantidad (€)" type="text" name="amount" placeholder="0.00" value={String(newExpense.amount)} onChange={handleInputChange} required inputMode="decimal" />
                <Select label="Categoría" name="category" value={newExpense.category} onChange={handleInputChange} required>
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </Select>
                <Select label="Pagado por" name="paidBy" value={newExpense.paidBy} onChange={handleInputChange} required>
                    <option value="" disabled>Selecciona participante</option>
                    {trip.participants.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </Select>
                <Input label="Descripción (Opcional)" type="text" name="description" placeholder="Ej: Cena en restaurante italiano" value={newExpense.description} onChange={handleInputChange} />
                <Select label="Método de Pago (Opcional)" name="paymentMethod" value={newExpense.paymentMethod} onChange={handleInputChange}>
                    <option value="">No especificar</option><option value="tarjeta">Tarjeta</option><option value="efectivo">Efectivo</option>
                </Select>
                <div>
                    <Input label="Comprobante (Foto/Imagen Opcional)" type="file" name="proofImageFile" id="proofImageFile" accept="image/*" onChange={handleInputChange} ref={proofImageInputRef} />
                    {proofImagePreviewUrl && (
                        <div className="mt-2 relative w-32 h-32">
                            <img src={proofImagePreviewUrl} alt="Previsualización" className="rounded-md object-cover w-full h-full" />
                            <Button type="button" variant="danger" size="sm" onClick={handleRemoveProofImage} className="absolute -top-2 -right-2 p-1 rounded-full text-xs" aria-label="Eliminar imagen"><XMarkIcon className="w-3 h-3"/></Button>
                        </div>
                    )}
                </div>
                {formError && <p className="text-sm text-red-400">{formError}</p>}
                <Button type="submit" className="w-full">Añadir Gasto</Button>
            </form>
        </Card>
      )}
      {currentSubView === 'list' && ( 
        <div className="space-y-3">
            {expenses.length === 0 ? (
                <Card className="text-center py-10">
                    <CurrencyEuroIcon className="w-16 h-16 text-slate-600 mx-auto mb-3"/>
                    <p className="text-slate-300">Aún no hay gastos registrados.</p>
                    <Button onClick={() => setCurrentSubView('add')} className="mt-4">Añadir Primer Gasto</Button>
                </Card>
            ) : (
                expenses.map(exp => (
                    <Card key={exp.id} className="flex flex-col sm:flex-row items-start justify-between">
                        <div className="flex items-center space-x-3 mb-2 sm:mb-0 flex-grow">
                            <div className={`p-2 rounded-full text-white ${CATEGORY_DETAILS[exp.category]?.color || 'bg-slate-500'}`}>
                                {React.cloneElement(CATEGORY_DETAILS[exp.category]?.icon as React.ReactElement<any>, { className: "w-5 h-5" })}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-100">{exp.description || exp.category}</p>
                                <p className="text-xs text-slate-400">
                                    {formatDate(exp.date)} por {exp.paidBy}
                                    {exp.paymentMethod && <span className="ml-1">({exp.paymentMethod === 'tarjeta' ? 'Tarjeta' : 'Efectivo'})</span>}
                                </p>
                                {exp.proofImage && <img src={exp.proofImage} alt="Comprobante" className="mt-1 w-16 h-16 object-cover rounded-md border border-slate-600" />}
                            </div>
                        </div>
                        <div className="text-right flex-shrink-0 mt-2 sm:mt-0">
                            <p className="font-semibold text-lg text-slate-100">{formatCurrency(exp.amount)}</p>
                            <Button onClick={() => deleteExpense(exp.id)} variant="ghost" size="sm" className="text-red-400 hover:text-red-500 p-1 mt-1" aria-label="Eliminar gasto"><TrashIcon className="w-4 h-4"/></Button>
                        </div>
                    </Card>
                ))
            )}
        </div>
      )}
      {currentSubView === 'summary' && (  
          <div className="space-y-6">
            <Card>
                <h2 className="text-xl font-semibold text-slate-100 mb-3">Resumen General</h2>
                <p className="text-3xl font-bold text-teal-400">{formatCurrency(totalTripCost)}</p>
                <p className="text-sm text-slate-400">Total gastado en {expenses.length} {expenses.length === 1 ? 'gasto' : 'gastos'}.</p>
            </Card>
            <Card>
                <h2 className="text-xl font-semibold text-slate-100 mb-4">Por Categoría</h2>
                <div className="space-y-2">
                    {CATEGORIES.map(cat => expensesByCategory[cat] > 0 && (
                        <div key={cat} className="flex justify-between items-center">
                            <div className="flex items-center space-x-2">
                                <span className={`p-1.5 rounded-full text-white text-xs ${CATEGORY_DETAILS[cat]?.color || 'bg-slate-500'}`}>{React.cloneElement(CATEGORY_DETAILS[cat]?.icon as React.ReactElement<any>, { className: "w-4 h-4" })}</span>
                                <span className="text-slate-200">{cat}</span>
                            </div>
                            <span className="font-medium text-slate-100">{formatCurrency(expensesByCategory[cat])}</span>
                        </div>
                    ))}
                    {Object.values(expensesByCategory).every(v => v === 0) && <p className="text-slate-400">No hay gastos para mostrar.</p>}
                </div>
            </Card>
            {chartDataByCategory.data.length > 0 && (
              <Card><CategoryBarChart labels={chartDataByCategory.labels} data={chartDataByCategory.data} backgroundColors={chartDataByCategory.backgroundColors} title="Gráfico de Barras por Categoría"/></Card>
            )}
            <Card>
                <h2 className="text-xl font-semibold text-slate-100 mb-4">Pagos por Participante</h2>
                <div className="space-y-2">
                    {Object.entries(expensesByParticipant).map(([name, amount]) => (
                         <div key={name} className="flex justify-between items-center">
                             <span className="text-slate-200">{name}</span>
                             <span className="font-medium text-slate-100">{formatCurrency(amount)}</span>
                         </div>
                    ))}
                </div>
            </Card>
            {trip.participants.length > 1 && settledPayments.length > 0 && ( 
                <Card> 
                    <h2 className="text-xl font-semibold text-slate-100 mb-4">Saldar Cuentas</h2>
                    <div className="space-y-2">
                        {settledPayments.map((payment, index) => (
                            <div key={index} className="text-sm text-slate-200">
                                <span className="font-semibold text-amber-400">{payment.from}</span> debe pagar a <span className="font-semibold text-sky-400">{payment.to}</span>: <span className="font-bold text-teal-300">{formatCurrency(payment.amount)}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
            {trip.participants.length > 1 && settledPayments.length === 0 && expenses.length > 0 && (
                <Card><p className="text-slate-300">Todas las cuentas están saldadas o no hay suficientes participantes para calcular.</p></Card>
            )}
            <Button onClick={handleExportPDF} variant="secondary" className="w-full mt-4">Exportar Resumen a PDF</Button>
        </div>
      )}
      {currentSubView === 'calendar' && <GastosCalendarView expenses={expenses} />}
    </div>
  );
};

// --- Calendar View for Gastos ---
const GastosCalendarView: React.FC<{ expenses: Expense[] }> = ({ expenses }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateExpenses, setSelectedDateExpenses] = useState<Expense[] | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);


  const expensesByDate = useMemo(() => {
    const map = new Map<string, Expense[]>();
    expenses.forEach(exp => {
      const dateKey = exp.date; // YYYY-MM-DD
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(exp);
    });
    return map;
  }, [expenses]);

  const changeMonth = (offset: number) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
    setSelectedDateExpenses(null);
    setSelectedDateKey(null);
  };

  const today = new Date().toISOString().split('T')[0];

  const renderCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysArray = [];

    const normalizedFirstDay = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth -1;

    for (let i = 0; i < normalizedFirstDay; i++) {
      daysArray.push(<div key={`empty-${i}`} className="border border-slate-700 p-2 h-24"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasExpenses = expensesByDate.has(dateStr);
      const isToday = dateStr === today;
      const isSelected = dateStr === selectedDateKey;


      daysArray.push(
        <div 
          key={day} 
          className={`border border-slate-700 p-2 h-24 flex flex-col cursor-pointer hover:bg-slate-700 relative transition-colors ${isToday ? 'bg-teal-900/70' : ''} ${isSelected ? 'ring-2 ring-teal-500 bg-slate-700' : ''}`}
          onClick={() => {
            setSelectedDateExpenses(expensesByDate.get(dateStr) || []); 
            setSelectedDateKey(dateStr);
          }}
          role="button"
          tabIndex={0}
          aria-label={`Ver gastos del ${day} de ${currentMonth.toLocaleDateString('es-ES', { month: 'long' })}`}
        >
          <span className={`font-medium ${isToday ? 'text-teal-300' : 'text-slate-200'}`}>{day}</span>
          {hasExpenses && <span className="mt-auto self-center w-2 h-2 bg-green-500 rounded-full" title="Hay gastos este día"></span>}
        </div>
      );
    }
    return daysArray;
  };
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);


  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={() => changeMonth(-1)} iconLeft={<ChevronLeftIcon className="w-5 h-5" />} aria-label="Mes anterior"/>
        <h3 className="text-lg font-semibold text-slate-100">
          {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </h3>
        <Button variant="ghost" onClick={() => changeMonth(1)} iconLeft={<ChevronRightIcon className="w-5 h-5" />} aria-label="Mes siguiente"/>
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-700">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
          <div key={day} className="text-center font-medium text-slate-400 p-2 bg-slate-800 text-xs">{day}</div>
        ))}
        {renderCalendarDays()}
      </div>
      {selectedDateExpenses && selectedDateKey && (
        <div className="mt-4 p-4 bg-slate-700/50 rounded-md">
          <h4 className="text-md font-semibold text-slate-100 mb-2">
            Gastos para {formatDate(selectedDateKey, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}:
          </h4>
          {selectedDateExpenses.length > 0 ? (
            <ul className="space-y-2">
              {selectedDateExpenses.map(exp => (
                <li key={exp.id} className="text-sm text-slate-300 flex justify-between">
                  <span>{exp.description || exp.category} (por {exp.paidBy})</span>
                  <span className="font-medium text-slate-100">{formatCurrency(exp.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 text-sm">No hay gastos registrados para este día.</p>
          )}
           <Button variant="link" size="sm" onClick={() => {setSelectedDateExpenses(null); setSelectedDateKey(null);}} className="mt-2 text-xs">Cerrar</Button>
        </div>
      )}
       {!selectedDateKey && expensesByDate.size > 0 && <p className="text-xs text-slate-400 mt-2">Haz clic en un día para ver los gastos.</p>}
       {!selectedDateKey && expensesByDate.size === 0 && <p className="text-xs text-slate-400 mt-2">No hay gastos en el mes actual.</p>}
    </Card>
  );
};


// --- RECUERDOS Section ---
const RecuerdosView: React.FC = () => {
  const { trip, mediaItems, addMediaItem, deleteMediaItem, currentUser } = useActiveTrip();
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setFile(null);
      setPreview(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !preview) { alert("Por favor, selecciona un archivo."); return; }
    addMediaItem({
      type: file.type.startsWith('image/') ? 'image' : 'video',
      dataUrl: preview,
      fileName: file.name,
      uploadedAt: new Date().toISOString(),
      description: description.trim() || undefined,
    });
    setFile(null); setDescription(''); setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = ''; 
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-semibold text-slate-100 mb-4">Añadir Recuerdo</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="file" label="Archivo (Imagen o Video)" accept="image/*,video/*" onChange={handleFileChange} ref={fileInputRef} required />
          {preview && (
            <div className="mt-2">
              {file?.type.startsWith('image/') ? (
                <img src={preview} alt="Previsualización" className="max-h-48 rounded-md border border-slate-600" />
              ) : (
                <video src={preview} controls className="max-h-48 rounded-md border border-slate-600 w-full" />
              )}
            </div>
          )}
          <Input type="text" label="Descripción (Opcional)" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ej: Atardecer en la playa" />
          <Button type="submit" disabled={!file}>Subir Recuerdo</Button>
        </form>
      </Card>
      
      {mediaItems.length === 0 ? (
        <Card className="text-center py-10">
          <PhotoIcon className="w-16 h-16 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300">Aún no hay recuerdos compartidos.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {mediaItems.map(item => (
            <Card key={item.id} className="group relative" noPadding>
              {item.type === 'image' ? (
                <img src={item.dataUrl} alt={item.description || item.fileName} className="w-full h-48 object-cover rounded-t-xl" />
              ) : (
                 <div className="w-full h-48 bg-slate-900 flex items-center justify-center rounded-t-xl relative">
                    <VideoCameraIcon className="w-16 h-16 text-slate-500" />
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { const a = document.createElement('a'); a.href = item.dataUrl; a.target = "_blank"; a.rel="noopener noreferrer"; a.click(); }} 
                        className="absolute bottom-2 left-2 p-1.5 bg-black/50 hover:bg-black/75 rounded-full"
                        title="Ver video en nueva pestaña"
                        aria-label="Ver video en nueva pestaña"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-white"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                    </Button>
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-medium text-slate-100 truncate" title={item.fileName}>{item.fileName}</p>
                {item.description && <p className="text-xs text-slate-400 truncate" title={item.description}>{item.description}</p>}
                <p className="text-xs text-slate-500">Subido por: {item.uploader} el {formatDate(item.uploadedAt.split('T')[0], {day:'numeric', month:'short'})}</p>
                <Button variant="link" size="sm" onClick={() => { const a = document.createElement('a'); a.href = item.dataUrl; a.download = item.fileName; a.click(); }} className="mt-1 p-0 text-xs">Descargar</Button>
              </div>
              {item.uploader === currentUser.username && (
                <Button variant="danger" size="sm" onClick={() => deleteMediaItem(item.id)} className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Eliminar Recuerdo">
                  <TrashIcon className="w-4 h-4" />
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};


// --- INFO Section ---
const InfoView: React.FC = () => {
  const { trip, infoItems, addInfoItem, updateInfoItem, deleteInfoItem, currentUser } = useActiveTrip();
  const [showForm, setShowForm] = useState(false);
  const [newItem, setNewItem] = useState({ title: '', type: INFO_ITEM_TYPES[0], details: '', date: '', time: '', file: null as File | null });
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const infoFileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setNewItem(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewItem(prev => ({ ...prev, file }));
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setNewItem(prev => ({ ...prev, file: null }));
      setFilePreview(null);
    }
  };
  
  const resetFormState = () => {
    setNewItem({ title: '', type: INFO_ITEM_TYPES[0], details: '', date: '', time: '', file: null });
    setFilePreview(null);
    if (infoFileInputRef.current) infoFileInputRef.current.value = '';
    setShowForm(false);
    setIsRecording(false);
    audioChunksRef.current = [];
    setMicPermissionError(null);
  }

  const startRecording = async () => {
    setMicPermissionError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg = "Tu navegador no soporta la grabación de audio.";
        alert(errorMsg);
        setMicPermissionError(errorMsg);
        return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = event => audioChunksRef.current.push(event.data);
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' }); 
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string); 
          setNewItem(prev => ({ ...prev, file: new File([audioBlob], `nota_audio_${Date.now()}.wav`, {type: 'audio/wav'}) })); 
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop()); 
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Error al acceder al micrófono:", err);
      let userMessage = "No se pudo acceder al micrófono. ";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        userMessage += "Has denegado el permiso. Por favor, revisa la configuración de permisos de este sitio en tu navegador.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        userMessage += "No se encontró un micrófono conectado.";
      } else {
        userMessage += "Asegúrate de haber dado permiso y que no esté siendo usado por otra aplicación.";
      }
      alert(userMessage);
      setMicPermissionError(userMessage);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title.trim()) { alert("El título es obligatorio."); return; }
    addInfoItem({
      title: newItem.title,
      type: newItem.type,
      details: newItem.type === InfoItemType.NOTE_TEXT ? newItem.details : (newItem.type !== InfoItemType.NOTE_AUDIO && newItem.details ? newItem.details : undefined ),
      date: newItem.date || undefined,
      time: newItem.time || undefined,
      fileDataUrl: filePreview || undefined, 
      fileName: newItem.file?.name || (newItem.type === InfoItemType.NOTE_AUDIO && filePreview ? `nota_audio_${Date.now()}.wav` : undefined),
    });
    resetFormState();
  };

  const toggleComplete = (item: InfoItem) => {
    updateInfoItem({ ...item, isCompleted: !item.isCompleted });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(s => { if(s) resetFormState(); return !s; })} iconLeft={showForm ? <MinusIcon className="w-5 h-5"/> : <PlusIcon className="w-5 h-5"/>}>
          {showForm ? 'Cancelar' : 'Añadir Información'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Nueva Información</h2>
          {micPermissionError && <p className="text-sm text-red-400 mb-3">{micPermissionError}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Título" name="title" value={newItem.title} onChange={handleInputChange} required />
            <Select label="Tipo" name="type" value={newItem.type} onChange={e => { setNewItem(prev => ({ ...prev, type: e.target.value as InfoItemType, file: null, details: '' })); setFilePreview(null); if(infoFileInputRef.current) infoFileInputRef.current.value = ''; setIsRecording(false); audioChunksRef.current = []; setMicPermissionError(null);}}>
              {INFO_ITEM_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </Select>
            
            {newItem.type === InfoItemType.NOTE_TEXT && (
              <Textarea label="Contenido de la Nota" name="details" value={newItem.details} onChange={handleInputChange} rows={4} />
            )}

            {(newItem.type !== InfoItemType.NOTE_TEXT && newItem.type !== InfoItemType.NOTE_AUDIO) && (
              <Input label="Archivo (PDF, Imagen, etc.)" type="file" name="file" onChange={handleFileChange} ref={infoFileInputRef} />
            )}
            
            {newItem.type === InfoItemType.NOTE_AUDIO && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nota de Audio</label>
                {!isRecording && !filePreview && <Button type="button" onClick={startRecording} iconLeft={<MicrophoneIcon className="w-5 h-5"/>}>Grabar Audio</Button>}
                {isRecording && <Button type="button" onClick={stopRecording} variant="danger" iconLeft={<StopIcon className="w-5 h-5"/>}>Detener Grabación</Button>}
                {filePreview && newItem.file?.type.startsWith('audio/') && (
                  <div className="mt-2">
                    <audio src={filePreview} controls className="w-full h-10" />
                    <Button type="button" variant="link" size="sm" onClick={() => { setFilePreview(null); setNewItem(p=>({...p, file: null}));}} className="text-xs p-0 text-red-400">Quitar audio</Button>
                  </div>
                )}
              </div>
            )}


            {filePreview && newItem.file && !newItem.file.type.startsWith('audio/') && (
                <div className="mt-2">
                    {newItem.file.type.startsWith('image/') ? <img src={filePreview} alt="preview" className="max-h-32 rounded border border-slate-600"/> : <p className="text-sm text-slate-400">Archivo: {newItem.file.name}</p>}
                    <Button type="button" variant="link" size="sm" onClick={() => { setFilePreview(null); setNewItem(p=>({...p, file: null})); if(infoFileInputRef.current) infoFileInputRef.current.value = ''; }} className="text-xs p-0 text-red-400">Quitar archivo</Button>
                </div>
            )}
            
            {(newItem.type !== InfoItemType.NOTE_TEXT && newItem.type !== InfoItemType.NOTE_AUDIO || (newItem.type === InfoItemType.NOTE_AUDIO && filePreview)) && (
                <Textarea label="Descripción del Archivo (Opcional)" name="details" value={newItem.details} onChange={handleInputChange} rows={2} placeholder="Breve descripción del archivo adjunto"/>
            )}


            <div className="grid grid-cols-2 gap-4">
              <Input label="Fecha Relevante (Opcional)" name="date" type="date" value={newItem.date} onChange={handleInputChange} />
              <Input label="Hora Relevante (Opcional)" name="time" type="time" value={newItem.time} onChange={handleInputChange} />
            </div>
            <Button type="submit">Guardar Información</Button>
          </form>
        </Card>
      )}

      {infoItems.length === 0 && !showForm ? (
        <Card className="text-center py-10">
          <InformationCircleIcon className="w-16 h-16 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300">No hay información guardada para este viaje.</p>
        </Card>
      ) : (
        infoItems.map(item => (
          <Card key={item.id} className={`border-l-4 ${item.isCompleted ? 'border-green-600 opacity-70' : INFO_ITEM_TYPE_DETAILS[item.type]?.color.replace('bg-', 'border-') || 'border-slate-500'}`}>
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`p-1 rounded-full text-white text-xs ${INFO_ITEM_TYPE_DETAILS[item.type]?.color || 'bg-slate-500'}`}>
                     {React.cloneElement(INFO_ITEM_TYPE_DETAILS[item.type]?.icon as React.ReactElement<any>, { className: "w-4 h-4" })}
                  </span>
                  <h3 className="text-md font-semibold text-slate-100">{item.title}</h3>
                </div>
                <p className="text-xs text-slate-400">{item.type}</p>
                {item.date && <p className="text-xs text-slate-400">Fecha: {formatDate(item.date)} {item.time}</p>}
                {(item.type === InfoItemType.NOTE_TEXT || (item.type !== InfoItemType.NOTE_AUDIO && item.details)) && <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">{item.details}</p>}
                
                {item.fileDataUrl && (
                  <div className="mt-2">
                    {item.fileName?.match(/\.(jpeg|jpg|png|gif)$/i) ? 
                      <img src={item.fileDataUrl} alt={item.fileName} className="max-h-24 rounded border border-slate-600 my-1"/> 
                      : item.type === InfoItemType.NOTE_AUDIO && item.fileName?.match(/\.(wav|mp3|ogg|m4a)$/i) ?
                      <audio src={item.fileDataUrl} controls className="h-10 my-1 w-full max-w-xs"/>
                      : null
                    }
                    <Button variant="link" size="sm" className="p-0 text-xs" onClick={() => { const a = document.createElement('a'); a.href = item.fileDataUrl!; a.download = item.fileName || 'archivo'; a.click(); }}>
                      Descargar: {item.fileName || 'archivo'}
                    </Button>
                    {(item.type !== InfoItemType.NOTE_TEXT && item.type !== InfoItemType.NOTE_AUDIO && item.details) && <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">{item.details}</p> }
                  </div>
                )}
                <p className="text-xs text-slate-500 mt-1">Añadido por: {item.addedBy} el {formatDate(item.createdAt.split('T')[0], {day:'numeric', month:'short'})}</p>
              </div>
              <div className="flex flex-col items-end space-y-2 flex-shrink-0 ml-2">
                <label className="flex items-center space-x-1 cursor-pointer">
                  <Input type="checkbox" checked={item.isCompleted} onChange={() => toggleComplete(item)} className="form-checkbox h-5 w-5 text-teal-500 rounded border-slate-500 bg-slate-700 focus:ring-teal-400 focus:ring-offset-slate-800" aria-label="Marcar como completado"/>
                  <span className="text-xs text-slate-300 select-none">Hecho</span>
                </label>
                {item.addedBy === currentUser.username && (
                  <Button variant="ghost" size="sm" onClick={() => deleteInfoItem(item.id)} className="p-1 text-red-400 hover:text-red-500" aria-label="Eliminar">
                    <TrashIcon className="w-4 h-4"/>
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
};


// --- MAPAS Section ---
const MapasView: React.FC = () => {
  const { trip, markedMapLocations, addMarkedMapLocation, deleteMarkedMapLocation } = useActiveTrip();
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [customSearchQuery, setCustomSearchQuery] = useState('');
  const [showSaveLocationModal, setShowSaveLocationModal] = useState<string | null>(null); // Stores search query to be saved
  const [saveLocationName, setSaveLocationName] = useState('');


  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
          setLocationError(null);
        },
        err => {
          console.warn("Error obteniendo ubicación:", err.message);
          setLocationError("No se pudo obtener tu ubicación. Las búsquedas serán menos precisas.");
        }
      );
    } else {
      setLocationError("La geolocalización no es soportada por tu navegador.");
    }
  }, []);

  const openGoogleMaps = (query: string) => {
    let mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    const tripLocationContext = trip.name.includes("en ") ? trip.name.split("en ")[1] : trip.name;

    if (userLocation) {
        mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}&ll=${userLocation.latitude},${userLocation.longitude}`;
    } else {
      // If no user location, append trip context for non-specific queries (quick searches)
      // For specific place names, usually less necessary to add "en [trip context]"
       if (!query.toLowerCase().includes(tripLocationContext.toLowerCase()) && 
           !['restaurantes', 'atracciones y visitas', 'alojamientos', 'tiendas'].some(cat => query.toLowerCase().startsWith(cat))) {
         // This logic is a bit tricky; for a specific search like "Torre Eiffel", adding "en Paris" might be redundant if "Paris" is the trip name.
         // But for a generic "restaurantes", adding "en Paris" is helpful.
         // Current implementation keeps it simple: search query as is.
       }
    }
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };
  
  const handleCustomSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = customSearchQuery.trim();
    if (query) {
      openGoogleMaps(query);
      setShowSaveLocationModal(query); // Offer to save this search
      setSaveLocationName(query); // Pre-fill name with query
    }
  };
  
  const handleSaveLocation = () => {
    if (showSaveLocationModal && saveLocationName.trim()) {
      addMarkedMapLocation(saveLocationName.trim(), showSaveLocationModal);
      setShowSaveLocationModal(null);
      setSaveLocationName('');
      setCustomSearchQuery(''); // Clear search bar after saving
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-semibold text-slate-100 mb-4">Explorar en Mapas</h2>
        <p className="text-slate-300 mb-1">
          Encuentra lugares de interés para tu viaje "{trip.name}".
        </p>
        {locationError && <p className="text-xs text-amber-400 mb-3">{locationError}</p>}
        {!locationError && !userLocation && <p className="text-xs text-slate-400 mb-3">Obteniendo tu ubicación para búsquedas más precisas...</p>}
        {!locationError && userLocation && <p className="text-xs text-green-400 mb-3">Ubicación obtenida. Las búsquedas usarán tu posición actual.</p>}
        
        <div className="space-y-3 mb-6">
          <Button onClick={() => openGoogleMaps(`restaurantes cerca de ${userLocation ? `${userLocation.latitude},${userLocation.longitude}` : trip.name}`)} variant="secondary" className="w-full justify-start" iconLeft={<BuildingStorefrontIcon className="w-5 h-5"/>}>Restaurantes</Button>
          <Button onClick={() => openGoogleMaps(`atracciones y visitas cerca de ${userLocation ? `${userLocation.latitude},${userLocation.longitude}` : trip.name}`)} variant="secondary" className="w-full justify-start" iconLeft={<TicketIcon className="w-5 h-5"/>}>Atracciones y Visitas</Button>
          <Button onClick={() => openGoogleMaps(`alojamientos cerca de ${userLocation ? `${userLocation.latitude},${userLocation.longitude}` : trip.name}`)} variant="secondary" className="w-full justify-start" iconLeft={<BuildingOffice2Icon className="w-5 h-5"/>}>Alojamientos</Button>
          <Button onClick={() => openGoogleMaps(`tiendas cerca de ${userLocation ? `${userLocation.latitude},${userLocation.longitude}` : trip.name}`)} variant="secondary" className="w-full justify-start" iconLeft={<ShoppingCartIcon className="w-5 h-5"/>}>Tiendas</Button>
        </div>
        
        <form onSubmit={handleCustomSearch} className="space-y-2 border-t border-slate-700 pt-4">
          <Input 
            label="Buscar lugar específico:"
            type="text" 
            value={customSearchQuery} 
            onChange={e => setCustomSearchQuery(e.target.value)} 
            placeholder="Ej: Museo del Prado, Torre Eiffel..."
            className="flex-grow"
            aria-label="Buscar lugar por nombre"
          />
          <Button type="submit" className="w-full" iconLeft={<MagnifyingGlassIcon className="w-5 h-5"/>}>Buscar Lugar</Button>
        </form>
        <p className="text-xs text-slate-500 mt-4">Esta función abrirá Google Maps en una nueva pestaña.</p>
      </Card>

      {showSaveLocationModal && (
        <Modal title="Guardar Lugar Buscado" onClose={() => setShowSaveLocationModal(null)}>
            <p className="text-slate-300 mb-2">Has buscado: <span className="font-semibold text-teal-300">{showSaveLocationModal}</span></p>
            <Input 
                label="Nombre para este lugar guardado:"
                type="text"
                value={saveLocationName}
                onChange={(e) => setSaveLocationName(e.target.value)}
                placeholder="Ej: Restaurante cena especial"
                className="mb-4"
                required
            />
            <div className="flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setShowSaveLocationModal(null)}>Cancelar</Button>
                <Button onClick={handleSaveLocation}>Guardar Lugar</Button>
            </div>
        </Modal>
      )}

      {markedMapLocations.length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Mis Lugares Guardados</h2>
          <div className="space-y-3">
            {markedMapLocations.map(loc => (
              <div key={loc.id} className="bg-slate-700 p-3 rounded-md flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-100">{loc.name}</p>
                  <p className="text-xs text-slate-400 italic" title={loc.query}>Búsqueda: {loc.query.length > 30 ? loc.query.substring(0,27)+'...' : loc.query}</p>
                </div>
                <div className="space-x-2 flex-shrink-0 flex items-center">
                  <button 
                    onClick={() => openGoogleMaps(loc.query)} 
                    title="Ver en Google Maps" 
                    aria-label="Ver en Google Maps"
                    className="p-1.5 text-slate-300 hover:text-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-800 rounded-md transition-colors"
                  >
                    <MapPinIcon className="w-5 h-5"/>
                  </button>
                  <button 
                    onClick={() => deleteMarkedMapLocation(loc.id)} 
                    title="Eliminar lugar guardado" 
                    aria-label="Eliminar lugar guardado"
                    className="p-1.5 text-slate-300 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-slate-800 rounded-md transition-colors"
                  >
                    <TrashIcon className="w-5 h-5"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
       {markedMapLocations.length === 0 && (
         <p className="text-sm text-center text-slate-400 mt-4">No tienes lugares guardados para este viaje. ¡Realiza una búsqueda y guárdala!</p>
       )}
    </div>
  );
};


// --- CHAT Section ---
const ChatView: React.FC = () => {
  const { trip, chatMessages, addChatMessage, currentUser } = useActiveTrip();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    addChatMessage(newMessage);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] md:h-[calc(100vh-250px)]"> 
      <Card className="flex-grow overflow-y-auto mb-4" noPadding>
        <div className="p-4 space-y-3">
        {chatMessages.length === 0 ? (
          <p className="text-slate-400 text-center py-8">Aún no hay mensajes. ¡Empieza la conversación!</p>
        ) : (
          chatMessages.map(msg => (
            <div key={msg.id} className={`flex ${msg.sender === currentUser.username ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] p-2.5 rounded-lg shadow ${msg.sender === currentUser.username ? 'bg-teal-600 text-white' : 'bg-slate-600 text-slate-100'}`}>
                <p className="text-sm">{msg.text}</p>
                <p className={`text-xs mt-1 ${msg.sender === currentUser.username ? 'text-teal-200' : 'text-slate-400'} text-right`}>
                  {msg.sender.split(' ')[0]} - {new Date(msg.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
        </div>
      </Card>
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input 
          type="text" 
          value={newMessage} 
          onChange={e => setNewMessage(e.target.value)} 
          placeholder="Escribe un mensaje..." 
          className="flex-grow"
          aria-label="Nuevo mensaje"
        />
        <Button type="submit" iconLeft={<PaperAirplaneIcon className="w-5 h-5"/>} aria-label="Enviar mensaje" />
      </form>
    </div>
  );
};

// --- ITINERARIO Section ---
const ItinerarioView: React.FC = () => {
  const { trip, itineraryItems, addItineraryItem, updateItineraryItem, deleteItineraryItem, currentUser } = useActiveTrip();
  const [showForm, setShowForm] = useState(false);
  const todayDate = new Date().toISOString().split('T')[0];
  const [newItem, setNewItem] = useState({ title: '', date: todayDate, time: '', category: ITINERARY_ITEM_CATEGORIES[0], notes: '', location: '' });
  
  const resetForm = () => {
    setNewItem({ title: '', date: todayDate, time: '', category: ITINERARY_ITEM_CATEGORIES[0], notes: '', location: '' });
    setShowForm(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setNewItem(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title.trim() || !newItem.date.trim()) { alert("El título y la fecha son obligatorios."); return; }
    addItineraryItem({
      title: newItem.title.trim(),
      date: newItem.date,
      time: newItem.time || undefined,
      category: newItem.category,
      notes: newItem.notes.trim() || undefined,
      location: newItem.location.trim() || undefined,
    });
    resetForm();
  };
  
  const toggleComplete = (item: ItineraryItem) => {
    updateItineraryItem({ ...item, isCompleted: !item.isCompleted });
  };

  const itemsByDate = useMemo(() => {
    const grouped: Record<string, ItineraryItem[]> = {};
    itineraryItems.forEach(item => {
      if (!grouped[item.date]) grouped[item.date] = [];
      grouped[item.date].push(item);
    });
    // Sort items within each date by time
    for (const date in grouped) {
        grouped[date].sort((a, b) => (a.time || "00:00").localeCompare(b.time || "00:00"));
    }
    return grouped;
  }, [itineraryItems]);

  const sortedDates = useMemo(() => Object.keys(itemsByDate).sort((a,b) => new Date(a).getTime() - new Date(b).getTime()), [itemsByDate]);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(s => !s)} iconLeft={showForm ? <MinusIcon className="w-5 h-5"/> : <PlusIcon className="w-5 h-5"/>}>
          {showForm ? 'Cancelar Nuevo' : 'Añadir al Itinerario'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Nuevo Elemento del Itinerario</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Título / Actividad" name="title" value={newItem.title} onChange={handleInputChange} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Fecha" name="date" type="date" value={newItem.date} onChange={handleInputChange} required />
              <Input label="Hora (Opcional)" name="time" type="time" value={newItem.time} onChange={handleInputChange} />
            </div>
            <Input label="Lugar / Dirección (Opcional)" name="location" value={newItem.location} onChange={handleInputChange} placeholder="Ej: Museo del Louvre, París"/>
             <Select label="Categoría (Opcional)" name="category" value={newItem.category} onChange={e => setNewItem(p => ({...p, category: e.target.value as ItineraryItemCategory}))}>
                {ITINERARY_ITEM_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </Select>
            <Textarea label="Notas (Opcional)" name="notes" value={newItem.notes} onChange={handleInputChange} rows={3} />
            <Button type="submit">Guardar Elemento</Button>
          </form>
        </Card>
      )}

      {sortedDates.length === 0 && !showForm ? (
        <Card className="text-center py-10">
          <CalendarDaysIcon className="w-16 h-16 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300">Tu itinerario está vacío. ¡Añade planes!</p>
        </Card>
      ) : (
        sortedDates.map(date => (
          <div key={date}>
            <h3 className="text-lg font-semibold text-teal-400 my-3 sticky top-0 bg-black py-2 z-10">{formatDate(date, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
            <div className="space-y-3">
              {itemsByDate[date].map(item => (
                <Card key={item.id} className={`border-l-4 ${item.isCompleted ? 'border-green-600 opacity-70' : 'border-sky-500'}`}>
                   <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                         {item.time && <span className="text-sm font-semibold text-teal-300 bg-slate-700 px-2 py-0.5 rounded">{item.time}</span>}
                         <h4 className="text-md font-semibold text-slate-100">{item.title}</h4>
                      </div>
                      {item.category && <p className="text-xs text-slate-400">{item.category}</p>}
                      {item.location && <p className="text-sm text-slate-300"><MapPinIcon className="w-3.5 h-3.5 inline mr-1"/>{item.location}</p>}
                      {item.notes && <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">{item.notes}</p>}
                      <p className="text-xs text-slate-500 mt-1">Añadido por: {item.addedBy}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2 flex-shrink-0 ml-2">
                      <label className="flex items-center space-x-1 cursor-pointer">
                        <Input type="checkbox" checked={item.isCompleted} onChange={() => toggleComplete(item)} className="form-checkbox h-5 w-5 text-teal-500 rounded border-slate-500 bg-slate-700 focus:ring-teal-400 focus:ring-offset-slate-800" aria-label="Marcar como completado"/>
                        <span className="text-xs text-slate-300 select-none">Hecho</span>
                      </label>
                      {item.addedBy === currentUser.username && (
                        <Button variant="ghost" size="sm" onClick={() => deleteItineraryItem(item.id)} className="p-1 text-red-400 hover:text-red-500" aria-label="Eliminar del itinerario">
                          <TrashIcon className="w-4 h-4"/>
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};



// --- Icons (simple inline SVGs for brevity) ---
const PlusIcon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const MinusIcon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>;
const UserGroupIcon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.009-8.057A9.094 9.094 0 0112 3.75m0 0a9.095 9.095 0 01-5.009 8.057m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-11.160h.008c.087 0 .175.008.258.025m-11.833 0h.008c.087 0 .175.008.258.025m11.317 0c.083.017.169.033.258.05M11.998 12a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5zM12 12a9 9 0 100 9 9 9 0 000-9z" /></svg>;
const NoSymbolIcon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>;
const TrashIcon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.096 3.298.29m-.105-.29H5.64M7.5 11.25h9M7.5 15h9" /></svg>;
const ArrowLeftIcon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>;
const XMarkIcon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const CurrencyEuroIcon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 100 8.488M14.25 7.756c2.485 0 4.5 2.015 4.5 4.5s-2.015 4.5-4.5 4.5m0-8.488c-.144.233-.298.455-.464.664M9.75 12c0-2.485 2.015-4.5 4.5-4.5m0 0c.166.209.32.431.464.664m-5.428 5.428a4.503 4.503 0 01-2.143-.91M9.75 12c0 2.485-2.015 4.5-4.5 4.5M4.524 13.91a4.503 4.503 0 01-.412-1.834m.412 1.834c.166.209.32.431.464.664M4.524 13.91L4.5 13.5m0 0L4.088 12.086M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ChevronLeftIcon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>;
const ChevronRightIcon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>;
const PhotoIcon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>;
const VideoCameraIcon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9A2.25 2.25 0 0013.5 5.25h-9A2.25 2.25 0 002.25 7.5v9A2.25 2.25 0 004.5 18.75z" /></svg>;
const InformationCircleIcon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>;
const MicrophoneIcon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>;
const StopIcon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 019 14.437V9.564z" /></svg>;
const BuildingStorefrontIcon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5A2.25 2.25 0 0011.25 11.25H4.5A2.25 2.25 0 002.25 13.5V21M4.5 10.5v2.25M4.5 10.5V6A2.25 2.25 0 016.75 3.75h10.5A2.25 2.25 0 0119.5 6v4.5M19.5 10.5v2.25m0 0V21m0-10.5C19.5 7.672 17.328 5.5 14.5 5.5S9.5 7.672 9.5 10.5m4.662 0h.008v.008h-.008V10.5zm0 0S14.5 10.5 14.5 10.5M14.162 10.5c.097.002.193.006.288.006S14.065 10.502 14.162 10.5z" /></svg>;
const TicketIcon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h3m-3 0h-3m0 0h1.5m9 3.75h-5.25m5.25 0h3m-3 0h-1.5m-9 3.75h5.25m-5.25 0h3m-3 0h-1.5m0 0h1.5m0 0h5.25M19.5 12h-15" /></svg>;
const BuildingOffice2Icon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6.375a.375.375 0 01.375.375v1.5a.375.375 0 01-.375.375H9a.375.375 0 01-.375-.375v-1.5A.375.375 0 019 6.75zM9 12.75h6.375a.375.375 0 01.375.375v1.5a.375.375 0 01-.375.375H9a.375.375 0 01-.375-.375v-1.5A.375.375 0 019 12.75zM12 3v2.25m0 16.5v-2.25M12 6.75v10.5" /></svg>;
const ShoppingCartIcon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>;
const PaperAirplaneIcon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;
const CalendarDaysIcon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25M3 18.75A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-3.75h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008z" /></svg>;
const MapPinIcon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>;
const MagnifyingGlassIcon: React.FC<{className?: string}> = ({className="w-6 h-6"}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;


export default App;