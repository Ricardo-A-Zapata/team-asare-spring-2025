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

      <section className="about-section masthead">
        <h2>Editorial Board</h2>
        
        <div className="role-section">
          <h3>Administrators</h3>
          <div className="editors-grid">
            <div className="editor-card admin">
              <h4>Aayush Daftary</h4>
              <p className="title">Lead Administrator</p>
              <p>New York University</p>
              <p>asd572@nyu.edu</p>
            </div>
            
            <div className="editor-card admin">
              <h4>Aurora Cruci</h4>
              <p className="title">System Administrator</p>
              <p>New York University</p>
              <p>aac9988@nyu.edu</p>
            </div>
          </div>
        </div>

        <div className="role-section">
          <h3>Editorial Staff</h3>
          <div className="editors-grid">
            <div className="editor-card">
              <h4>Eli Edme</h4>
              <p className="title">Editor</p>
              <p>New York University</p>
              <p>eae8374@nyu.edu</p>
            </div>

            <div className="editor-card">
              <h4>Ricky Zapata</h4>
              <p className="title">Editor</p>
              <p>New York University</p>
              <p>raz6675@nyu.edu</p>
            </div>
          </div>
        </div>

        <div className="role-section">
          <h3>Referees</h3>
          <div className="editors-grid">
            <div className="editor-card referee">
              <h4>Sam Huppert</h4>
              <p className="title">Lead Referee</p>
              <p>New York University</p>
              <p>sjh9967@nyu.edu</p>
            </div>
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