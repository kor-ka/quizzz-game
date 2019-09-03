import React from 'react';
import './App.css';
import { Session } from './model/Session';
import { SessionComponent } from './components/Sesssion';

export let SessionContext = React.createContext<Session | undefined>(undefined);

const App: React.FC = () => {
  let id = window.location.pathname.split('/').filter(s => s.length)[0];
  let session = new Session(id);
  return (
    <SessionContext.Provider value={session}>
      <SessionComponent />
    </SessionContext.Provider>
  );
}

export default App;
