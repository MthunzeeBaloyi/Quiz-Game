// frontend/src/components/Quiz.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import correctSound from '../assets/correct.mp3';
import incorrectSound from '../assets/incorrect.mp3';
import timeoutSound from '../assets/timeout.mp3';
import './Quiz.css';

const Quiz = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState({ team1: 0, team2: 0 });
  const [timeLeft, setTimeLeft] = useState(10);
  const [currentTeam, setCurrentTeam] = useState('team1');
  const [gameOver, setGameOver] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [teamNames, setTeamNames] = useState({ team1: '', team2: '' });
  const [teamMembers, setTeamMembers] = useState({ team1: [], team2: [] });
  const [gameStarted, setGameStarted] = useState(false);
  const [muted, setMuted] = useState(false);

  const correctAudio = useRef(new Audio(correctSound));
  const incorrectAudio = useRef(new Audio(incorrectSound));
  const timeoutAudio = useRef(new Audio(timeoutSound));

  useEffect(() => {
    fetchQuestions();
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && gameStarted && !gameOver) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && gameStarted && !gameOver) {
      handleTimeout();
    }
  }, [timeLeft, gameStarted, gameOver]);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/questions');
      setQuestions(shuffleArray(response.data));
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/leaderboard');
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const shuffleArray = (array) => {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
  };

  const handleAnswer = (correct) => {
    if (correct) {
      setScores(prev => ({
        ...prev,
        [currentTeam]: prev[currentTeam] + 1
      }));
      if (!muted) correctAudio.current.play();
    } else {
      if (!muted) incorrectAudio.current.play();
    }
    nextQuestion();
  };

  const handleTimeout = () => {
    if (!muted) timeoutAudio.current.play();
    nextQuestion();
  };

  const nextQuestion = () => {
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
      setTimeLeft(10);
      setCurrentTeam(currentTeam === 'team1' ? 'team2' : 'team1');
    } else {
      endGame();
    }
  };

  const endGame = () => {
    setGameOver(true);
    const winningTeam = scores.team1 > scores.team2 ? 'team1' : 'team2';
    const winningScore = Math.max(scores.team1, scores.team2);
    addScoreToLeaderboard(teamNames[winningTeam], teamMembers[winningTeam], winningScore);
  };

  const addScoreToLeaderboard = async (teamName, members, score) => {
    try {
      await axios.post('http://localhost:5000/api/leaderboard', {
        team_name: teamName,
        member_names: members,
        score: score
      });
      fetchLeaderboard();
    } catch (error) {
      console.error('Error adding score to leaderboard:', error);
    }
  };

  const startGame = () => {
    if (teamNames.team1 && teamNames.team2 && teamMembers.team1.length && teamMembers.team2.length) {
      setGameStarted(true);
    } else {
      alert('Please enter team names and member names for both teams');
    }
  };

  const getEmoji = (team) => {
    const percentage = (scores[team] / questions.length) * 100;
    if (percentage === 100) return '🎉';
    if (percentage >= 50) return '😊';
    return '😢';
  };

  if (questions.length === 0) return <div>Loading...</div>;

  if (!gameStarted) {
    return (
      <div className="setup-container">
        <h2>Team Setup</h2>
        {['team1', 'team2'].map(team => (
          <div key={team}>
            <input
              type="text"
              placeholder={`${team} name`}
              value={teamNames[team]}
              onChange={(e) => setTeamNames({...teamNames, [team]: e.target.value})}
            />
            <input
              type="text"
              placeholder={`${team} members (comma-separated)`}
              onChange={(e) => setTeamMembers({...teamMembers, [team]: e.target.value.split(',')})}
            />
          </div>
        ))}
        <button onClick={startGame}>Start Game</button>
      </div>
    );
  }

  return (
    <motion.div
      className="quiz-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {!gameOver ? (
        <>
          <h2>Time left: {timeLeft} seconds</h2>
          <h3>{currentTeam === 'team1' ? teamNames.team2 : teamNames.team1}, ask this question:</h3>
          <p>{questions[currentQuestion].question}</p>
          <h3>{teamNames[currentTeam]} to answer:</h3>
          {['option1', 'option2', 'option3', 'option4'].map((option, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleAnswer(index + 1 === questions[currentQuestion].correct_answer)}
            >
              {questions[currentQuestion][option]}
            </motion.button>
          ))}
          <div className="scores">
            <p>{teamNames.team1}: {scores.team1} {getEmoji('team1')}</p>
            <p>{teamNames.team2}: {scores.team2} {getEmoji('team2')}</p>
          </div>
        </>
      ) : (
        <div>
          <h2>Game Over!</h2>
          <p>{teamNames.team1} score: {scores.team1} {getEmoji('team1')}</p>
          <p>{teamNames.team2} score: {scores.team2} {getEmoji('team2')}</p>
          <h3>{scores.team1 > scores.team2 ? `${teamNames.team1} wins!` : `${teamNames.team2} wins!`}</h3>
        </div>
      )}
      <button onClick={() => setMuted(!muted)}>{muted ? 'Unmute' : 'Mute'}</button>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowLeaderboard(!showLeaderboard)}
      >
        {showLeaderboard ? 'Hide Leaderboard' : 'Show Leaderboard'}
      </motion.button>
      {showLeaderboard && (
        <motion.div
          className="leaderboard"
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3>Leaderboard</h3>
          <ul>
            {leaderboard.map((entry, index) => (
              <li key={index}>
                {entry.team_name}: {entry.score} - Members: {JSON.parse(entry.member_names).join(', ')}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Quiz;
