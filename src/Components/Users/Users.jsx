import React, { useEffect, useState } from 'react';
import propTypes from 'prop-types';
import axios from 'axios';
import { Link } from 'react-router-dom';

import { BACKEND_URL } from '../../constants';
import './Users.css';

const USERS_READ_ENDPOINT = `${BACKEND_URL}/user/read`;
const USERS_CREATE_ENDPOINT = `${BACKEND_URL}/user/create`;
const USER_DELETE_ENDPOINT = `${BACKEND_URL}/user/delete`;
const USER_UPDATE_ENDPOINT = `${BACKEND_URL}/user/update`;

// Role constants
const AUTHOR_CODE = 'AU';
const EDITOR_CODE = 'ED';
const REFEREE_CODE = 'RE';

const ROLES = {
  [AUTHOR_CODE]: 'Author',
  [EDITOR_CODE]: 'Editor',
  [REFEREE_CODE]: 'Referee',
};

// Helper function to convert role codes to display names
const getRoleDisplayName = (roleCode) => ROLES[roleCode] || roleCode;


function AddUserForm({
  visible,
  cancel,
  fetchUsers,
  setError,
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [selectedRoles, setSelectedRoles] = useState([]);
  const nameInputRef = React.useRef(null);

  // Focus the name input when the form becomes visible
  React.useEffect(() => {
    if (visible && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [visible]);

  const changeName = (event) => { setName(event.target.value); };
  const changeEmail = (event) => { setEmail(event.target.value); };
  const changeAffiliation = (event) => { setAffiliation(event.target.value);};
  
  const handleRoleChange = (event) => {
    const value = event.target.value;
    setSelectedRoles(
      // When a role is already selected, remove it; otherwise, add it
      selectedRoles.includes(value)
        ? selectedRoles.filter(role => role !== value)
        : [...selectedRoles, value]
    );
  };

  const addUser = (event) => {
    event.preventDefault();
    const newUser = {
      name: name,
      email: email,
      affiliation: affiliation,
      roles: selectedRoles,
      roleCodes: selectedRoles
    }
    axios.put(USERS_CREATE_ENDPOINT, newUser)
      .then(() => {
        fetchUsers();
        cancel();
      }
      )
      .catch((error) => { setError(`${error.response.data.message}`); });
  };

  if (!visible) return null;
  return (
    <div className="form-container">
      <h3>Add New User</h3>
      
      <form className="user-form">
        <div className="form-fields">
          <div className="form-field">
            <label htmlFor="name">Name</label>
            <input 
              required 
              type="text" 
              id="name" 
              value={name} 
              onChange={changeName}
              ref={nameInputRef}
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input required type="email" id="email" onChange={changeEmail} />
          </div>
          
          <div className="form-field">
            <label htmlFor="affiliation">Affiliation</label>
            <input required type="text" id="affiliation" onChange={changeAffiliation} />
          </div>
        </div>
        
        <div className="roles-container">
          <h4>Select Roles</h4>
          <div className="roles-checkboxes">
            {Object.entries(ROLES).map(([code, displayName]) => (
              <div key={code} className="role-checkbox">
                <input
                  type="checkbox"
                  id={`role-${code}`}
                  value={code}
                  checked={selectedRoles.includes(code)}
                  onChange={handleRoleChange}
                />
                <label htmlFor={`role-${code}`}>{displayName}</label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={cancel}>Cancel</button>
          <button type="submit" onClick={addUser}>Submit</button>
        </div>
      </form>
    </div>
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
  const [selectedRoles, setSelectedRoles] = useState(
    (user.roleCodes && user.roleCodes.length > 0) ? user.roleCodes : (user.roles || [])
  );
  const email = user.email;
  const nameInputRef = React.useRef(null);
  
  // Focus the name input when the form becomes visible
  React.useEffect(() => {
    if (visible && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [visible]);
  
  const changeName = (event) => { setName(event.target.value); };
  const changeAffiliation = (event) => { setAffiliation(event.target.value); };
  
  const handleRoleChange = (event) => {
    const value = event.target.value;
    setSelectedRoles(
      // When a role is already selected, remove it; otherwise, add it
      selectedRoles.includes(value)
        ? selectedRoles.filter(role => role !== value)
        : [...selectedRoles, value]
    );
  };
  
  const updateUser = (event) => {
    event.preventDefault();
    const updatedUser = {
      name,
      email,
      affiliation,
      roles: selectedRoles,
      roleCodes: selectedRoles
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
    <div className="form-container">
      <h3>Update User</h3>
      
      <form className="user-form">
        <div className="form-fields">
          <div className="form-field">
            <label htmlFor="name">Name</label>
            <input 
              required 
              type="text" 
              id="name" 
              value={name} 
              onChange={changeName}
              ref={nameInputRef}  
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={email} disabled />
          </div>
          
          <div className="form-field">
            <label htmlFor="affiliation">Affiliation</label>
            <input required type="text" id="affiliation" value={affiliation} onChange={changeAffiliation} />
          </div>
        </div>
        
        <div className="roles-container">
          <h4>Select Roles</h4>
          <div className="roles-checkboxes">
            {Object.entries(ROLES).map(([code, displayName]) => (
              <div key={code} className="role-checkbox">
                <input
                  type="checkbox"
                  id={`edit-role-${code}`}
                  value={code}
                  checked={selectedRoles.includes(code)}
                  onChange={handleRoleChange}
                />
                <label htmlFor={`edit-role-${code}`}>{displayName}</label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={cancel}>Cancel</button>
          <button type="submit" onClick={updateUser}>Update</button>
        </div>
      </form>
    </div>
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
    roles: propTypes.array,
    roleCodes: propTypes.array
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
  const { name, email, affiliation, roles, roleCodes } = user;
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

  // Determine which roles to display, prioritizing roleCodes if available
  const displayRoles = roleCodes && roleCodes.length > 0 ? roleCodes : roles;

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
        {displayRoles && displayRoles.length > 0 && (
          <p>
            Roles: {displayRoles.map(role => getRoleDisplayName(role)).join(', ')}
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
    roles: propTypes.array,
    roleCodes: propTypes.array
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

  // When adding a user, close any edit forms that might be open
  const showAddUserForm = () => { 
    setEditingUser(null); // Close edit form if open
    setAddingUser(true);
  };
  
  const hideAddUserForm = () => { 
    setAddingUser(false);
  };

  // When editing a user, close the add form if it's open
  const editUser = (user) => {
    setAddingUser(false); // Close add form if open
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
