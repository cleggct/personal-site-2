import React, { useState, useEffect } from 'react';
import MatrixBackground from './matrix_background';
import { Link } from "react-router-dom";

const HomePage = () => {
  const [catImageUrl, setCatImageUrl] = useState('');

  useEffect(() => {
    fetch('https://api.thecatapi.com/v1/images/search')
      .then((response) => response.json())
      .then((data) => {
        setCatImageUrl(data[0]?.url || '');
      })
      .catch((error) => console.error('Error fetching cat image:', error));
  }, []);

  return (
    <div>
      <div>
        <MatrixBackground />
        <header>
          <h2 className="leading-loose text-4xl font-semibold">Hello!</h2>
          <h3 className="leading-relaxed text-3xl font-medium">
            My name is <a href="/about" className="text-amber-500 hover:underline">Christa...</a>
          </h3>
          <h4 className="leading-relaxed text-2xl">Welcome to my personal site!</h4>
          <p className="mb-4 leading-normal text-xl">
            If you're looking for my GitHub, it's{' '}
            <a
              href="https://www.github.com/cleggct"
              className="text-amber-500 hover:underline"
            >
              github.com/cleggct
            </a>
            .
            <br />
            If you need to get in touch with me, email me at cleggct (at) gmail (dot) com.
          </p>
          <p className="mb-4 leading-loose text-xl">
            Otherwise, here's a random cat image! (courtesy of{' '}
            <a
              href="https://www.thecatapi.com"
              className="text-amber-500 hover:underline"
            >
              the cat api
            </a>
            )
          </p>
          {catImageUrl && (
            <img
              id="cat-pic"
              src={catImageUrl}
            />
          )}
        </header>
        <section>
          <h2 className="leading-loose text-3xl font-medium">Pages on this site:</h2>
          <ul>
            <li>
                <Link
                    to="/gol"
                    style={{
                    display: "inline-block",
                    fontSize: "20px",
                    color: "orange",
                    background: "black",
                    textDecoration: "none",
                    borderRadius: "5px",
                    }}
                >
                    Conway's Game of Life
                </Link>
            </li>
            <li>
                <Link
                    to="/mandelbrot"
                    style={{
                    display: "inline-block",
                    fontSize: "20px",
                    color: "orange",
                    background: "black",
                    textDecoration: "none",
                    borderRadius: "5px",
                    }}
                >
                    Mandelbrot Set Viewer
                </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
