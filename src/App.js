import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import HomePage from "./components/homepage";
import GameOfLife from "./components/conways_game_of_life";
import Mandelbrot from "./components/mandelbrot";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gol" element={<GameOfLife />} />
        <Route path="/mandelbrot" element={<Mandelbrot />} />
      </Routes>
    </Router>
  );
};

export default App;
