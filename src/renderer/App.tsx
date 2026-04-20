import { useEffect, useRef, useState } from 'react';

import UpdateCheckFeedback from '@/components/UpdateCheckFeedback';
import UpdateNotification from '@/components/UpdateNotification';
import UpdateReadyBanner from '@/components/UpdateReadyBanner';
import { LanguageProvider } from '@/i18n/context';
import Chat from '@/pages/Chat';
import Settings from '@/pages/Settings';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'settings'>('home');
  const currentViewRef = useRef<'home' | 'settings'>('home');
  const [sessionMcpServers, setSessionMcpServers] = useState<{ name: string; status: string }[]>(
    []
  );

  useEffect(() => {
    currentViewRef.current = currentView;
  }, [currentView]);

  useEffect(() => {
    const unsubscribeNavigate = window.electron.onNavigate((view: string) => {
      if (view === 'settings' && currentViewRef.current === 'settings') {
        setCurrentView('home');
      } else {
        setCurrentView(view as 'home' | 'settings');
      }
    });

    const unsubInit = window.electron.chat.onSessionInit((data) => {
      setSessionMcpServers(data.mcpServers ?? []);
    });

    return () => {
      unsubscribeNavigate();
      unsubInit();
    };
  }, []);

  return (
    <LanguageProvider>
      <UpdateCheckFeedback />
      <UpdateNotification />
      <UpdateReadyBanner />
      <div className={currentView === 'settings' ? 'block' : 'hidden'}>
        <Settings onBack={() => setCurrentView('home')} sessionMcpServers={sessionMcpServers} />
      </div>
      <div className={currentView === 'home' ? 'block' : 'hidden'}>
        <Chat
          onOpenSettings={() => {
            if (currentViewRef.current === 'settings') {
              setCurrentView('home');
            } else {
              setCurrentView('settings');
            }
          }}
        />
      </div>
    </LanguageProvider>
  );
}
