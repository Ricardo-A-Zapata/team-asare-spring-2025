import React, { useEffect, useState } from 'react';
import propTypes from 'prop-types';
import axios from 'axios';
import { Link } from 'react-router-dom';

import { BACKEND_URL } from '../../constants';

const USERS_READ_ENDPOINT = `${BACKEND_URL}/user/read`;
const USERS_CREATE_ENDPOINT = `${BACKEND_URL}/user/create`;

function AddUserForm({
  visible,
  cancel,
  fetchUsers,
  setError,
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [affiliation, setAffiliation] = useState('');

  const changeName = (event) => { setName(event.target.value); };
  const changeEmail = (event) => { setEmail(event.target.value); };
  const changeAffiliation = (event) => { setAffiliation(event.target.value);};

  const addUser = (event) => {
    event.preventDefault();
    const newUser = {
      name: name,
      email: email,
      affiliation: affiliation,
    }
    axios.put(USERS_CREATE_ENDPOINT, newUser)
      .then(fetchUsers)
      .catch((error) => { setError(`There was a problem adding the user. ${error}`); });
  };

  if (!visible) return null;
  return (
    <form>
      <label htmlFor="name">
        Name
      </label>
      <input required type="text" id="name" value={name} onChange={changeName} />
      <label htmlFor="email">
        Email
      </label>
      <input required type="text" id="email" onChange={changeEmail} />
      <label htmlFor="affiliation">
        Affiliation
      </label>
      <input required type="text" id="affiliation" onChange={changeAffiliation} />
      <button type="button" onClick={cancel}>Cancel</button>
      <button type="submit" onClick={addUser}>Submit</button>
    </form>
  );
}
AddUserForm.propTypes = {
  visible: propTypes.bool.isRequired,
  cancel: propTypes.func.isRequired,
  fetchUsers: propTypes.func.isRequired,
  setError: propTypes.func.isRequired,
};

function ErrorMessage({ message }) {
  return (
    <div className="error-message">
      {message}
    </div>
  );
}
ErrorMessage.propTypes = {
  message: propTypes.string.isRequired,
};

function User({ user }) {
  const { name, email } = user;
  return (
    <Link to={name}>
      <div className="user-container">
        <h2>{name}</h2>
        <p>
          Email: {email}
        </p>
      </div>
    </Link>
  );
}
User.propTypes = {
  user: propTypes.shape({
    name: propTypes.string.isRequired,
    email: propTypes.string.isRequired,
  }).isRequired,
};

function usersObjectToArray(Data) {
  const keys = Object.keys(Data);
  const users = keys.map((key) => Data[key]);
  return users;
}

function Users() {
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [addingUser, setAddingUser] = useState(false);

  const fetchUsers = () => {
    axios.get(USERS_READ_ENDPOINT)
      .then(({ data }) => {
        setUsers(usersObjectToArray(data.Users)) }
    )
      .catch((error) => setError(`There was a problem retrieving the list of users. ${error}`));
  };

  const showAddUserForm = () => { setAddingUser(true); };
  const hideAddUserForm = () => { setAddingUser(false); };

  useEffect(fetchUsers, []);

  return (
    <div className="wrapper">
      <header>
        <h1>
          View All Users
        </h1>
        <button type="button" onClick={showAddUserForm}>
          Add a User
        </button>
      </header>
      <AddUserForm
        visible={addingUser}
        cancel={hideAddUserForm}
        fetchUsers={fetchUsers}
        setError={setError}
      />
      {error && <ErrorMessage message={error} />}
      {users.map((user) => <User key={user.name} user={user} />)}
    </div>
  );
}

export default Users;
