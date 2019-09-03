import React from 'react';
import './App.css';
import { SessionModel } from './model/SessionModel';
import { SessionComponent } from './components/SesssionComponent';

export let SessionContext = React.createContext<SessionModel | undefined>(undefined);

const App: React.FC = () => {
  let id = window.location.pathname.split('/').filter(s => s.length)[0];
  let session = new SessionModel(id);
  return (
    <SessionContext.Provider value={session}>
      <SessionComponent />
    </SessionContext.Provider>
  );
}

export default App;
