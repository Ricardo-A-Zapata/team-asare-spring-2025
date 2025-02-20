import React, { useEffect, useState } from 'react';
import propTypes from 'prop-types';
import axios from 'axios';

import { BACKEND_URL } from '../../constants';
import './Home.css';

const JOURNAL_NAME_ENDPOINT = `${BACKEND_URL}/journalname`;

function ErrorMessage({ message }) {
  return <div className="error-message">{message}</div>;
}

ErrorMessage.propTypes = {
  message: propTypes.string.isRequired,
};

function Home() {
  const [journalName, setJournalName] = useState('');
  const [error, setError] = useState('');

  const fetchJournalName = () => {
    axios.get(JOURNAL_NAME_ENDPOINT)
      .then(({ data }) => {
        console.log("Journal API Response:", data);
        if (data && data["Journal Name"]) {
          setJournalName(data["Journal Name"]);
        } else {
          console.warn("API response does not contain 'Journal Name':", data);
        }
      })
      .catch((error) => {
        console.error("Error fetching journal name:", error);
        setError(`There was a problem retrieving the journal name.`);
      });
  };

  useEffect(fetchJournalName, []);

  return (
    <div className="home-container">
      <div className="home-content">
        <h1 className="journal-title">Welcome to {journalName || 'our Journal'}</h1>
        <p className="journal-description">This is the official journal website where scholars and researchers share their work.</p>
      </div>
      {error && <ErrorMessage message={error} />}
    </div>
  );
}

export default Home;
