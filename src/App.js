import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./components/homepage";
import GameOfLife from "./components/conways_game_of_life";
import Mandelbrot from "./components/mandelbrot";
import Boids from "./components/boids";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gol" element={<GameOfLife />} />
        <Route path="/mandelbrot" element={<Mandelbrot />} />
        <Route path="/boids" element={<Boids />} />
      </Routes>
    </Router>
  );
};

export default App;
