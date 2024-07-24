// frontend/src/App.jsx
import React from 'react';
import Quiz from './components/Quiz';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>Welcome to Pick 'a' Brain</h1>
      <p>Two Teams, 10 Seconds!</p>
      <h2>Let the games begin</h2>
      <Quiz />
    </div>
  );
}

export default App;
