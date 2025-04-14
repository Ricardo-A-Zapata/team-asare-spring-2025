import React from 'react';
import './About.css';

function About() {
  return (
    <div className="about-container">
      <section className="about-section">
        <h1>About Our Journal</h1>
        <p>
          Welcome to our academic journal, a collaborative project by NYU students dedicated to advancing knowledge 
          and fostering scholarly discourse in our field. Our journal serves as a platform for researchers, 
          scholars, and practitioners to share their findings and contribute to the ongoing development of our discipline.
        </p>
      </section>

      <section className="about-section">
        <h2>Editors</h2>
        <div className="editors-grid">
          <div className="editor-card">
            <h3>Aurora Cruci</h3>
            <p>New York University</p>
            <p>aac9988@nyu.edu</p>
          </div>
          
          <div className="editor-card">
            <h3>Aayush Daftary</h3>
            <p>New York University</p>
            <p>asd572@nyu.edu</p>
          </div>

          <div className="editor-card">
            <h3>Eli Edme</h3>
            <p>New York University</p>
            <p>eae8374@nyu.edu</p>
          </div>

          <div className="editor-card">
            <h3>Sam Huppert</h3>
            <p>New York University</p>
            <p>sjh9967@nyu.edu</p>
          </div>

          <div className="editor-card">
            <h3>Ricky Zapata</h3>
            <p>New York University</p>
            <p>raz6675@nyu.edu</p>
          </div>
        </div>
      </section>

      <section className="about-section">
        <h2>Mission Statement</h2>
        <p>
          Our mission is to publish high-quality, peer-reviewed research that contributes to the advancement 
          of knowledge in our field. We are committed to maintaining the highest standards of academic 
          integrity and providing a platform for diverse perspectives and innovative research.
        </p>
      </section>
    </div>
  );
}

export default About; 