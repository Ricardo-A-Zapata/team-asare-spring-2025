import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Manuscripts.css';

const MANUSCRIPTS_READ_ENDPOINT = `${process.env.REACT_APP_URL_PRE}/manuscripts`;

function Manuscripts() {
  const [manuscripts, setManuscripts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchManuscripts = async () => {
      try {
        const { data } = await axios.get(MANUSCRIPTS_READ_ENDPOINT);
        setManuscripts(data.manuscripts);
      } catch (error) {
        setError('Error fetching manuscripts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchManuscripts();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="manuscripts">
      <h1>View All Manuscripts</h1>
      {Object.keys(manuscripts).length === 0 ? (
        <p>No manuscripts available.</p>
      ) : (
        <ul>
          {Object.entries(manuscripts).map(([id, manuscript]) => (
            <li key={id}>
              <h2>{manuscript.title}</h2>
              <p>Author: {manuscript.author}</p>
              <p>Email: {manuscript.author_email}</p>
              <p>State: {manuscript.state}</p>
              <p>Abstract: {manuscript.abstract}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Manuscripts; 