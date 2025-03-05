import React, { useEffect, useState } from 'react';
import propTypes from 'prop-types';
import axios from 'axios';
import { Link } from 'react-router-dom';

import { BACKEND_URL } from '../../constants';

const USERS_READ_ENDPOINT = `${BACKEND_URL}/user/read`;
const USERS_CREATE_ENDPOINT = `${BACKEND_URL}/user/create`;
const USER_DELETE_ENDPOINT = `${BACKEND_URL}/user/delete`;
const USER_UPDATE_ENDPOINT = `${BACKEND_URL}/user/update`

function AddUserForm({
  visible,
  cancel,
  fetchUsers,
  setError,
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [roles, setRoles] = useState('');

  const changeName = (event) => { setName(event.target.value); };
  const changeEmail = (event) => { setEmail(event.target.value); };
  const changeAffiliation = (event) => { setAffiliation(event.target.value);};
  const changeRoles = (event) => { setRoles(event.target.value); };

  const addUser = (event) => {
    event.preventDefault();
    const rolesArray = roles.split(',')
      .map(role => role.trim())
      .filter(role => role.length > 0);
    const newUser = {
      name: name,
      email: email,
      affiliation: affiliation,
      roles: rolesArray,
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
      <label htmlFor="roles">Roles (comma separated)</label>
      <input type="text" id="roles" value={roles} onChange={changeRoles} />
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

function EditUserForm({ 
  visible, cancel, fetchUsers, setError, user 
}) {
  const [name, setName] = useState(user.name);
  const [affiliation, setAffiliation] = useState(user.affiliation || '');
  const [roles, setRoles] = useState(user.roles ? user.roles.join(', ') : '');
  const email = user.email;
  const changeName = (event) => { setName(event.target.value); };
  const changeAffiliation = (event) => { setAffiliation(event.target.value); };
  const changeRoles = (event) => { setRoles(event.target.value); };
  const updateUser = (event) => {
    event.preventDefault();
    const rolesArray = roles.split(',')
      .map(role => role.trim())
      .filter(role => role.length > 0);
    const updatedUser = {
      name,
      email,
      affiliation,
      roles: rolesArray
    };
    axios.put(USER_UPDATE_ENDPOINT, updatedUser)
      .then(() => {
        fetchUsers();
        cancel();
      })
      .catch((error) => { setError(`error updating the user. ${error}`); });
  };

  if (!visible) return null;
  return (
    <form>
      <h3>Update User</h3>
      <label htmlFor="name">Name</label>
      <input required type="text" id="name" value={name} onChange={changeName} />
      <label htmlFor="email">Email</label>
      <input type="text" id="email" value={email} disabled />
      <label htmlFor="affiliation">Affiliation</label>
      <input required type="text" id="affiliation" value={affiliation} onChange={changeAffiliation} />
      <label htmlFor="roles">Roles (comma separated)</label>
      <input type="text" id="roles" value={roles} onChange={changeRoles} />
      <button type="button" onClick={cancel}>Cancel</button>
      <button type="submit" onClick={updateUser}>Submit</button>
    </form>
  );
}
EditUserForm.propTypes = {
  visible: propTypes.bool.isRequired,
  cancel: propTypes.func.isRequired,
  fetchUsers: propTypes.func.isRequired,
  setError: propTypes.func.isRequired,
  user: propTypes.shape({
    name: propTypes.string.isRequired,
    email: propTypes.string.isRequired,
    affiliation: propTypes.string,
    roles: propTypes.array
  }).isRequired,
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

function User({ user, onDelete, onEdit }) {
  const { name, email, affiliation, roles } = user;
  const handleDelete = () => 
  {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      onDelete(email);
    }
  };
  const handleEdit = () => 
  {
    onEdit(user);
  };

  return (
    <div className="user-container">
      <Link to={email}>
        <h2>{name}</h2>
        <p>
          Email: {email}
        </p>
        {affiliation && (
          <p>
            Affiliation: {affiliation}
          </p>
        )}
        {roles && roles.length > 0 && (
          <p>
            Roles: {roles.join(', ')}
          </p>
        )}
      </Link>
      <button type="button" onClick={handleDelete}>Delete</button>
      <button type="button" onClick={handleEdit}>Edit</button>
    </div>
  );
}
User.propTypes = {
  user: propTypes.shape({
    name: propTypes.string.isRequired,
    email: propTypes.string.isRequired,
    affiliation: propTypes.string,
    roles: propTypes.array
  }).isRequired,
  onDelete: propTypes.func.isRequired,
  onEdit: propTypes.func.isRequired,
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
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = () => {
    axios.get(USERS_READ_ENDPOINT)
      .then(({ data }) => {
        setUsers(usersObjectToArray(data.Users)) }
    )
      .catch((error) => setError(`There was a problem retrieving the list of users. ${error}`));
  };

  
  const deleteUser = (email) => 
  {
    axios.delete(`${USER_DELETE_ENDPOINT}/${email}`)
      .then(fetchUsers)
      .catch((error) => setError(`There was a problem deleting the user. ${error}`));
  };

  const showAddUserForm = () => { setAddingUser(true); };
  const hideAddUserForm = () => { setAddingUser(false); };

  const editUser = (user) => {
    setEditingUser(user);
  };

  const hideEditUserForm = () => {
    setEditingUser(null);
  };

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
      {editingUser && (
        <EditUserForm
          visible={true}
          cancel={hideEditUserForm}
          fetchUsers={fetchUsers}
          setError={setError}
          user={editingUser}
        />
      )}
      {error && <ErrorMessage message={error} />}
      {users.map((user) => <User key={user.name} user={user} onDelete={deleteUser} onEdit={editUser} />)}
    </div>
  );
}

export default Users;
