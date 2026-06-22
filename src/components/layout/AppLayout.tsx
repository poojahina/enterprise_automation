import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface Props {
  children: React.ReactNode;
}

const AppLayout: React.FC<Props> = ({ children }) => {
  return (
    <div className="flex h-screen bg-[hsl(220,25%,7%)] text-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-[hsl(220,25%,7%)]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
