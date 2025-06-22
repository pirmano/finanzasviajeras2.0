
import React from 'react';
import { ExpenseCategory, InfoItemType } from './types';

export const APP_NAME = "FinanzasViajeras";
export const TEST_USER_USERNAME = "testuser";
export const TEST_USER_PASSWORD = "password";

export const CATEGORIES = Object.values(ExpenseCategory);

interface CategoryVisuals {
  icon: React.ReactNode;
  color: string; // Tailwind color class
}

// Helper to ensure consistent icon sizing
const IconWrapper: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => {
  const defaultClassName = "w-5 h-5"; // Default size if className affecting size is not provided
  const finalClassName = className || defaultClassName;
  // Ensure children is a valid React element and specifically an SVG element for type safety on props
  if (React.isValidElement<React.SVGAttributes<SVGElement>>(children)) {
    // After this check, 'children' is typed as React.ReactElement<React.SVGAttributes<SVGElement>>
    // So, 'children.props' is React.SVGAttributes<SVGElement>, which has an optional 'className' property.
    const originalClassName = children.props.className || '';
    return React.cloneElement(children, { // children is already correctly typed here
        className: `${originalClassName} ${finalClassName}`.trim()
    });
  }
  return null;
};


export const CATEGORY_DETAILS: Record<ExpenseCategory, CategoryVisuals> = {
  [ExpenseCategory.ALOJAMIENTO]: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
      </svg>
    ),
    color: 'bg-sky-600',
  },
  [ExpenseCategory.ACTIVIDADES]: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L1.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.25 12L17 14.188l-1.25-2.188a2.25 2.25 0 00-1.7-1.7L12 9.25l2.188-1.25a2.25 2.25 0 001.7-1.7L17 4.25l1.25 2.188a2.25 2.25 0 001.7 1.7L22.75 9.25l-2.188 1.25a2.25 2.25 0 00-1.7 1.7z" />
      </svg>
    ),
    color: 'bg-amber-500',
  },
  [ExpenseCategory.COMIDA]: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 12.75V9a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 9v3.75m19.5 0a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.625a2.25 2.25 0 01-2.36 0l-7.5-4.625A2.25 2.25 0 012.25 12.993V12.75m19.5 0h-4.5M3.75 12.75h4.5m11.25 0h4.5m-15 0h9" />
      </svg>
    ),
    color: 'bg-emerald-600',
  },
  [ExpenseCategory.TRANSPORTE]: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.139A48.784 48.784 0 0012 5.25c-2.73 0-5.356.356-7.834.966c-.566.091-.986.571-.986 1.139v.958m16.5 0a2.025 2.025 0 00-2.025-2.025H6.75A2.025 2.025 0 004.725 7.5v11.25c0 .621.504 1.125 1.125 1.125h.09M16.5 18.75v-2.25M5.25 16.5v2.25m0-11.177v-.958c0-.568.422-1.048.987-1.139A48.784 48.784 0 0112 5.25c2.73 0 5.356.356 7.834.966.566.091-.986.571-.986 1.139v.958M8.25 15h7.5" />
      </svg>
    ),
    color: 'bg-orange-600',
  },
  [ExpenseCategory.ENTRADAS]: {
    icon: (
       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h3m-3 0h-3m0 0h1.5m9 3.75h-5.25m5.25 0h3m-3 0h-1.5m-9 3.75h5.25m-5.25 0h3m-3 0h-1.5m0 0h1.5m0 0h5.25m6-10.5V6a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6v12a2.25 2.25 0 002.25 2.25h10.5A2.25 2.25 0 0019.5 18v-2.25m-5.25-6H9m6 0v.01" />
      </svg>
    ),
    color: 'bg-rose-600',
  },
  [ExpenseCategory.COMPRAS]: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5M3.75 18A2.25 2.25 0 006 20.25h12A2.25 2.25 0 0020.25 18M11.25 6.75h.008v.008h-.008V6.75z" />
         <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 21h-9a2.25 2.25 0 01-2.25-2.25V7.5A2.25 2.25 0 017.5 5.25h9A2.25 2.25 0 0118.75 7.5v11.25A2.25 2.25 0 0116.5 21z" />
      </svg>
    ),
    color: 'bg-cyan-600',
  },
  [ExpenseCategory.OTROS]: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345h5.518a.562.562 0 01.329.988l-4.203 3.075a.563.563 0 00-.182.557l1.285 5.022a.562.562 0 01-.82.632l-4.197-3.075a.563.563 0 00-.656 0l-4.197 3.075a.562.562 0 01-.82-.632l1.285-5.022a.562.562 0 00-.182-.557l-4.204-3.075a.562.562 0 01.33-.988h5.518a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    color: 'bg-indigo-600',
  },
};

// Apply IconWrapper to all category icons for consistent sizing
Object.values(ExpenseCategory).forEach(category => {
  if (CATEGORY_DETAILS[category]) {
    CATEGORY_DETAILS[category].icon = <IconWrapper className="w-5 h-5">{CATEGORY_DETAILS[category].icon}</IconWrapper>;
  }
});


export const INFO_ITEM_TYPE_DETAILS: Record<InfoItemType, { icon: React.ReactNode; color: string }> = {
  [InfoItemType.BOARDING_PASS]: {
    icon: <IconWrapper className="w-5 h-5"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg></IconWrapper>,
    color: 'bg-blue-500',
  },
  [InfoItemType.HOTEL_RESERVATION]: {
    icon: <IconWrapper className="w-5 h-5"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 7.5h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h18M3 7.5h18M3 12h18m-4.5 4.5h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" /></svg></IconWrapper>,
    color: 'bg-green-500',
  },
  [InfoItemType.ATTRACTION_TICKET]: {
    icon: <IconWrapper className="w-5 h-5"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-1.5h5.25m-5.25 0h3m-3 0h-3m0 0h1.5m9 3.75h-5.25m5.25 0h3m-3 0h-1.5m-9 3.75h5.25m-5.25 0h3m-3 0h-1.5m0 0h1.5m0 0h5.25M19.5 12h-15" /></svg></IconWrapper>,
    color: 'bg-yellow-500',
  },
  [InfoItemType.NOTE_TEXT]: {
    icon: <IconWrapper className="w-5 h-5"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg></IconWrapper>,
    color: 'bg-purple-500',
  },
  [InfoItemType.NOTE_AUDIO]: {
    icon: <IconWrapper className="w-5 h-5"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg></IconWrapper>,
    color: 'bg-pink-500',
  },
  [InfoItemType.OTHER]: {
    icon: <IconWrapper className="w-5 h-5"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg></IconWrapper>,
    color: 'bg-gray-500',
  }
};


export const CHART_COLORS: string[] = [
  '#4ade80', // green-400
  '#22d3ee', // cyan-400
  '#facc15', // yellow-400
  '#fb923c', // orange-400
  '#f87171', // red-400
  '#a78bfa', // violet-400
  '#38bdf8', // lightBlue-400
  '#c084fc', // purple-400
  '#fb7185', // rose-400
  '#60a5fa', // blue-400
];

export const MAIN_VIEW_ICONS: Record<string, React.ReactNode> = {
  GASTOS: <IconWrapper className="w-6 h-6"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6A.75.75 0 012.25 5.25V4.5m0 0V3.75A.75.75 0 013 3A.75.75 0 013.75 3.75v.75m0 0h.008v.008H3.75V4.5m7.5 0h.008v.008H11.25V4.5m0 0V3.75a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.75m0 0h.008v.008H11.25V4.5M12 2.25c-1.882 0-3.674.542-5.228 1.499M12 21.75c-1.882 0-3.674-.542-5.228-1.499M12 2.25c1.882 0 3.674.542 5.228 1.499M12 21.75c1.882 0 3.674-.542 5.228-1.499M12 6.75a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM12 15.75a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" /></svg></IconWrapper>,
  RECUERDOS: <IconWrapper className="w-6 h-6"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.174C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.04l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" /></svg></IconWrapper>,
  INFO: <IconWrapper className="w-6 h-6"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg></IconWrapper>,
  MAPAS: <IconWrapper className="w-6 h-6"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503-6.998l-6.868 2.646M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></IconWrapper>,
  CHAT: <IconWrapper className="w-6 h-6"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-3.861 8.25-8.625 8.25S3.75 16.556 3.75 12 7.611 3.75 12.375 3.75 21 7.444 21 12z" /></svg></IconWrapper>,
  ITINERARIO: <IconWrapper className="w-6 h-6"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-3.75h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008z" /></svg></IconWrapper>
};

export const GASTOS_SUBVIEW_ICONS: Record<string, React.ReactNode> = {
  list: <IconWrapper className="w-5 h-5"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h7.5M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 17.25h.007v.008H3.75V17.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg></IconWrapper>,
  add: <IconWrapper className="w-5 h-5"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg></IconWrapper>,
  summary: <IconWrapper className="w-5 h-5"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3h-1.5m1.5 0h16.5M3.75 16.5c0 1.242 1.008 2.25 2.25 2.25h13.5A2.25 2.25 0 0021 16.5M16.5 8.25l-4.5 4.5-4.5-4.5" /></svg></IconWrapper>,
  calendar: <IconWrapper className="w-5 h-5"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg></IconWrapper>,
};
