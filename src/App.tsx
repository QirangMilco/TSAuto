import React from 'react';
import HomePage from './ui-react/components/HomePage';
import './App.css'; // 确保引入了 Tailwind 的样式

function App() {
  return (
    <div className="w-full h-screen">
      <HomePage />
    </div>
  );
}

export default App;