import {createRoot} from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import App from './App.tsx';
import './index.css';

// Initialize Native Capacitor capabilities
if (Capacitor.isNativePlatform()) {
  StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
  StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
  StatusBar.setBackgroundColor({ color: '#00000000' }).catch(() => {});
  // Auto hide splash screen once mounted
  setTimeout(() => {
    SplashScreen.hide().catch(() => {});
  }, 500);
}

createRoot(document.getElementById('root')!).render(<App />);
