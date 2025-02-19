import selfieImg from './res/selfie.jpg';
import griffyImg from './res/griffy.jpg';
import MatrixBackground from './components/matrix_background';

const About = () => {
    
    return (
        <div>
            <div>
                <MatrixBackground />
                <h1 className="leading-loose text-4xl font-semibold">About Me</h1>
                <p>I'm a 24 year old programmer living in Los Angeles. My favorite
                things are mathematics, programming, and my dog Griffin ❤️</p>

                <br />
                <p>I graduated from UCLA in 2021 with a Bachelor's in Mathematics
                and a specialization in computing. My favorite area of math is
                mathematical logic. <a className="text-amber-500 hover:underline" href="https://en.wikipedia.org/wiki/Gödel's_incompleteness_theorems">Gödel's Incompleteness
                Theorems</a> are some of the coolest things ever and you should totally check them out :). The proof of the first one is particularly
                beautiful, if you haven't seen it already.</p>

                <br />
                <p>My most-used language is Python. I've written Python code for
                stuff like data processing/analysis (mostly numpy/pandas), deep
                learning (pytorch), backend functionality and endpoints, web scraping,
                among other things. Libraries/tools I am experienced with are numpy, pandas,
                pytorch, scipy, scikit-learn, matplotlib, sqlite, selenium, among others.</p>

                <br />
                <p>I also have a lot of familiarity with Javascript/Typescript and web
                development. I have written a good deal of React code, for tasks ranging
                from user interfaces to communicating with the backend, synchronizing
                frontend state with backend state, etc. I have worked with React
                frameworks like NextJS, as well as base React and component libraries
                like Material UI.</p>

                <br />
                <p>Other languages I am familiar with (in no particular order): Java,
                C++, C#, Matlab, HTML/CSS, Haskell (functional programming is cool!), R.</p>
                <br />
                <p>
                I enjoy learning about computer graphics in my freetime. I have written demo applications in OpenGL, WebGL and Vulkan. Most of this was done in C++ (my second most-used language), but much of the webgl stuff including the demos you see on this site were written with a javascript WebGL library called <a href="https://threejs.org/" className="text-amber-500 hover:underline">ThreeJS</a>.
                </p>
                <br />
                <p>Some more stuff about me: I speak (ok-ish) Finnish, I know a lot
                of random trivia about airplanes and I love Greyhounds. My current
                dog, Griffin, is a three year old retired race Greyhound. He's my
                best friend!</p>

                <br />
                <p>
                    Here's a picture of me
                    <br />
                    <div className="p-8">
                    <img src={selfieImg} alt="selfie.jpg" className="rounded-lg overflow-hidden"/>
                    </div>
                    <br />
                    Here's a picture of Griffy with one of his holes :)
                    <br />
                    <div className="p-8">
                    <img src={griffyImg} alt="griffy.jpg" className="rounded-lg overflow-hidden"/>
                    </div>
                </p>

            </div>
        </div>
    );
}

export default About;