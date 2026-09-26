import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

export type Language = 'es' | 'en';
const LANGUAGE_KEY = 'shyftex-language';
export const translations: Record<string, string> = {
  'Compra inteligente, precios reales': 'Smarter shopping, better prices',
  'Iniciar sesion': 'Sign in',
  Continuar: 'Continue',
  'No tienes cuenta? ': "Don't have an account? ",
  Registrate: 'Sign up',
  'Probar sin cuenta': 'Try demo without an account',
  'Crear cuenta': 'Create account',
  'Empieza a ahorrar en tus compras': 'Start saving on your shopping',
  'Tu nombre': 'Your name',
  'Minimo 6 caracteres': 'At least 6 characters',
  'Ya tienes cuenta? ': 'Already have an account? ',
  'Inicia sesion': 'Sign in',
  'Por favor ingresa email y contrasena': 'Please enter your email and password',
  'Completa todos los campos': 'Please complete all fields',
  'La contrasena debe tener al menos 6 caracteres': 'Password must be at least 6 characters',
  Error: 'Error',
  Inicio: 'Home',
  Listas: 'Lists',
  Planes: 'Plans',
  Perfil: 'Profile',
  Historial: 'History',
  SHYFTEX: 'SHYFTEX',
  'Buenos dias': 'Good morning',
  'Buenas tardes': 'Good afternoon',
  'Buenas noches': 'Good evening',
  Usuario: 'User',
  'Nueva compra': 'New shopping trip',
  'Escribe tu lista y encontramos los mejores precios':
    'Write your list and we’ll find the best prices',
  Ahorrado: 'Saved',
  'Tu ultima lista': 'Your latest list',
  'Como funciona': 'How it works',
  'Sube tu lista': 'Add your list',
  'Escribe, pega o dicta tu lista de compras': 'Type, paste, or dictate your shopping list',
  'Comparamos precios': 'We compare prices',
  'Revisamos tiendas, promociones y disponibilidad': 'We check stores, offers, and availability',
  'Optimizamos la ruta': 'We optimize your route',
  'La mejor estrategia para ahorrar tiempo y dinero': 'The best strategy to save time and money',
  'Mis listas': 'My lists',
  'Todas las listas': 'All lists',
  'Crear primera lista': 'Create your first list',
  'Sin listas todavía': 'No lists yet',
  'Tus planes': 'Your plans',
  'Ej: 2 litros de leche Lala, huevos, arroz, cereal Zucaritas, pechuga de pollo, Ariel y papel Regio': 'E.g. 2 liters of milk, eggs, rice, cereal, chicken breast, detergent, and paper towels',
  'Ej: Lala': 'E.g. Lala', 'Ej: sin azúcar': 'E.g. sugar-free', 'Ej: Nissan, Toyota, Chevrolet': 'E.g. Nissan, Toyota, Chevrolet', 'Ej: Versa, Corolla, Aveo': 'E.g. Versa, Corolla, Aveo', 'Ej: 2023': 'E.g. 2023', 'Ej: 13': 'E.g. 13',
  '¿Qué hacer con': 'What would you like to do with', 'Marcar como no encontrado': 'Mark as not found', 'Total gastado': 'Total spent',
  'No hay planes': 'No plans yet',
  'Cerrar sesión': 'Sign out',
  Transporte: 'Transportation',
  Preferencias: 'Preferences',
  Cuenta: 'Account',
  '¿Estás seguro de que quieres cerrar sesión?': 'Are you sure you want to sign out?',
  'Detalle de tienda': 'Store details',
  'Tienda no encontrada': 'Store not found',
  Ubicación: 'Location',
  Horario: 'Hours',
  Servicios: 'Services',
  'Productos disponibles': 'Available products',
  Volver: 'Back',
  'Sin historial aún': 'No history yet',
  Resumen: 'Summary',
  'Nueva lista': 'New list', 'Escribe los productos que necesitas. Sé lo más específico posible.': 'Enter the products you need. Be as specific as possible.',
  'Maximo ahorro': 'Maximum savings', 'Maxima comodidad': 'Maximum convenience', 'No hay lista seleccionada': 'No list selected',
  'Crea una lista de compra y optimiza tus rutas para generar planes personalizados.': 'Create a shopping list and optimize your routes to generate personalized plans.',
  'Crea tu primera lista de compras para comenzar a optimizar tus gastos.': 'Create your first shopping list to start optimizing your spending.',
  producto: 'item', productos: 'items', lista: 'list', listas: 'lists',
  'Aquí aparecerán tus listas anteriores y los planes de optimización generados.': 'Your previous lists and generated optimization plans will appear here.',
  'Total ahorrado': 'Total saved', 'Ahorro promedio': 'Average savings', 'No configurado': 'Not configured', 'Valor del tiempo': 'Value of time', '/hora': '/hour', Activada: 'Enabled', 'No activada': 'Not enabled', Ninguna: 'None', 'Listas y planes': 'Lists and plans', Notificaciones: 'Notifications', Configurar: 'Configure', Privacidad: 'Privacy',
  'Promociones activas': 'Active promotions', 'No se pudo cargar la información de esta tienda.': 'Could not load this store information.', Abierto: 'Open', Cerrado: 'Closed', Hoy: 'Today', 'Hoy cierra a las': 'Today closes at', Farmacia: 'Pharmacy', Panadería: 'Bakery', Carnicería: 'Butcher', Cajero: 'ATM', Estacionamiento: 'Parking', Gasolinera: 'Gas station', 'Descuento fijo': 'Fixed discount', 'Descuento por volumen': 'Volume discount', 'Precio de lealtad': 'Loyalty price', Cupón: 'Coupon', 'Promoción con tarjeta': 'Card promotion', 'Precio de membresía': 'Membership price', 'Requiere': 'Requires', tarjeta: 'card', Membresía: 'Membership', 'No hay información de precios disponible.': 'No pricing information is available.', 'Agregar a mi ruta': 'Add to my route',
  'App controls are translated; user-entered products, retailer names, addresses, and provider-generated demo text stay in their original language.': 'App controls are translated; user-entered products, retailer names, addresses, and provider-generated demo text stay in their original language.',
  'caracteres': 'characters', Limpiar: 'Clear', 'Consejos para mejores resultados:': 'Tips for better results:',
  "Incluye cantidades: '2 litros de leche'": "Include quantities: '2 liters of milk'", 'Especifica marcas cuando las tengas claras': 'Specify brands when you know them',
  'Usa comas para separar productos': 'Use commas to separate products', "Puedes incluir tamaños: '375g de cereal'": "You can include sizes: '375g of cereal'",
  'Ejemplo:': 'Example:', 'Usar este ejemplo': 'Use this example', 'Otras formas de crear tu lista:': 'Other ways to create your list:', Foto: 'Photo', Voz: 'Voice', Código: 'Barcode', Archivo: 'File', 'Analizar mi lista': 'Analyze my list',
  'Detalle de lista': 'List details', Analizada: 'Analyzed', Revisada: 'Reviewed', Optimizada: 'Optimized', 'En progreso': 'In progress', Completada: 'Completed', Exacto: 'Exact match', Variante: 'Variant', Sustituto: 'Substitute', Posible: 'Possible', 'Sin match': 'No match', 'Sin productos': 'No products', 'Esta lista no tiene productos todavía.': 'This list has no products yet.', Productos: 'Products', 'Optimizando...': 'Optimizing...', 'Optimizar compra': 'Optimize shopping', 'Editar producto': 'Edit product', Cantidad: 'Quantity', 'Marca (opcional)': 'Brand (optional)', Notas: 'Notes', Guardar: 'Save', 'Eliminar producto': 'Remove product', '¿Eliminar este producto de la lista?': 'Remove this product from the list?', Cancelar: 'Cancel', Eliminar: 'Remove', Prioridad: 'Priority', Categoría: 'Category', 'No detectada': 'Not detected', Presentación: 'Packaging', Sustituciones: 'Substitutions', Permitidas: 'Allowed', 'No permitidas': 'Not allowed', 'Sin sustitutos': 'No substitutes', 'Permitir sustitutos': 'Allow substitutes', Editar: 'Edit', 'Cambiar prioridad:': 'Change priority:', Obligatorio: 'Required', Preferido: 'Preferred', Opcional: 'Optional',
  'Revisar productos': 'Review products', 'productos encontrados': 'products found', 'Agregar producto manualmente': 'Add product manually', 'No encontrado': 'Not found', '¿Eliminar este producto?': 'Remove this product?', 'Planes de compra': 'Shopping plans', 'No hay planes disponibles': 'No plans available', 'Crea una lista primero para generar planes optimizados.': 'Create a list first to generate optimized plans.', 'Tu plan optimizado': 'Your optimized plan', 'Ahorro estimado': 'Estimated savings', 'Total estimado': 'Estimated total', Ruta: 'Route', Tiempo: 'Time', Distancia: 'Distance', Tiendas: 'Stores', Paradas: 'Stops', '¿Por qué este plan?': 'Why this plan?', Advertencias: 'Warnings', 'Otros planes': 'Other plans', 'Iniciar compra': 'Start shopping', 'Alta confianza': 'High confidence', 'Confianza media': 'Medium confidence', 'Baja confianza': 'Low confidence', total: 'total',
  'En compras': 'Shopping in progress', 'Cancelar compra': 'Cancel shopping', '¿Estás seguro de que quieres cancelar?': 'Are you sure you want to cancel?', No: 'No', 'Sí, cancelar': 'Yes, cancel', Checklist: 'Checklist', 'Por comprar': 'To buy', Encontrados: 'Found', 'No encontrados': 'Not found', 'No disponible en esta tienda': 'Unavailable at this store', Esperado: 'Expected', Gastado: 'Spent', Ahorro: 'Savings', 'Productos no encontrados': 'Products not found', 'Puedes buscar estos productos en otra tienda o pedir un sustituto.': 'You can look for these products at another store or choose a substitute.', 'Buscar alternativas': 'Find alternatives', '¡Compra completada!': 'Shopping complete!', 'Ver resumen': 'View summary', 'Finalizar compra': 'Finish shopping', 'Precio real': 'Actual price', 'Confirmar': 'Confirm', 'No hay misión activa': 'No active shopping trip', 'Genera un plan de compra primero.': 'Generate a shopping plan first.',
  'Mi vehículo': 'My vehicle', 'Por favor ingresa marca y modelo': 'Please enter make and model', Guardado: 'Saved', 'Información del vehículo actualizada': 'Vehicle information updated', Marca: 'Make', Modelo: 'Model', Año: 'Year', 'Tipo de combustible': 'Fuel type', 'Consumo personalizado (km/L)': 'Custom efficiency (km/L)', 'Si lo conoces, este valor tiene prioridad sobre el consumo oficial.': 'If known, this value takes precedence over the official efficiency.',
  'Crear lista': 'Create list',
  'Tip: Se concreta con las marcas para mejores resultados. "2L leche Lala" funciona mejor que solo "leche".': 'Tip: Be specific about brands for better results. "2L Lala milk" works better than just "milk".',
  'Hoy cierra a las {closeTime}': 'Today closes at {closeTime}', 'Producto no encontrado': 'Product not found',
  Producto: 'Product', 'Notas:': 'Notes:',
};

export function translate(language: Language, value: string, values?: Record<string, string | number>): string {
  const template = language === 'en' ? translations[value] ?? value : value;
  return values ? template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match)) : template;
}

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (value: string, values?: Record<string, string | number>) => string;
};
const LanguageContext = createContext<LanguageContextValue>({
  language: 'es',
  setLanguage: () => undefined,
  t: (value) => value,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es');
  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(LANGUAGE_KEY)
      .then((stored) => {
        if (mounted && (stored === 'en' || stored === 'es')) {
          setLanguageState(stored);
          if (Platform.OS === 'web' && typeof document !== 'undefined')
            document.documentElement.lang = stored;
        }
      })
      .catch(() => {
        // Keep the default Spanish language if browser storage is unavailable.
      });
    return () => {
      mounted = false;
    };
  }, []);
  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    AsyncStorage.setItem(LANGUAGE_KEY, nextLanguage).catch(() => {
      // The selected language remains active for this session if persistence fails.
    });
    if (Platform.OS === 'web' && typeof document !== 'undefined')
      document.documentElement.lang = nextLanguage;
  };
  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (text: string, values?: Record<string, string | number>) => translate(language, text, values),
    }),
    [language],
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
