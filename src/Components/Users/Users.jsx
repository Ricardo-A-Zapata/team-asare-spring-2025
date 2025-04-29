import React, { useEffect, useState } from 'react';
import propTypes from 'prop-types';
import axios from 'axios';
import { Link } from 'react-router-dom';

import { BACKEND_URL } from '../../constants';
import Loading from '../Loading/Loading';
import './Users.css';

const USERS_READ_ENDPOINT = `${BACKEND_URL}/user/read`;
const USERS_CREATE_ENDPOINT = `${BACKEND_URL}/user/create`;
const USER_DELETE_ENDPOINT = `${BACKEND_URL}/user/delete`;
const USER_UPDATE_ENDPOINT = `${BACKEND_URL}/user/update`;
const ROLES_READ_ENDPOINT = `${BACKEND_URL}/roles`;
// Remove the unused ROLES_ENDPOINT variable
// const ROLES_ENDPOINT = `${BACKEND_URL}/roles`;
// Helper function to convert role codes to display names
const getRoleDisplayName = (roleCode, roles) => roles[roleCode] || roleCode;

// New function for filtering users
const filterUsers = (users, filters) => {
  const { searchTerm, selectedRole } = filters;
  
  return users.filter(user => {
    // If no filters are applied, return all users
    if (!searchTerm && !selectedRole) return true;
    
    // Search term filter - check if name or email contains the search term
    const matchesSearchTerm = !searchTerm || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Role filter - check if user has the selected role
    const matchesRole = !selectedRole || 
      (user.roleCodes && user.roleCodes.includes(selectedRole));
    
    // Return user only if they match all applied filters
    return matchesSearchTerm && matchesRole;
  });
};

// New function for sorting users
const sortUsers = (users, sortConfig) => {
  if (!sortConfig || !sortConfig.key) return users;
  
  return [...users].sort((a, b) => {
    // Handle sorting by primary role
    if (sortConfig.key === 'role') {
      const aRoles = a.roleCodes && a.roleCodes.length > 0 ? a.roleCodes : (a.roles || []);
      const bRoles = b.roleCodes && b.roleCodes.length > 0 ? b.roleCodes : (b.roles || []);
      
      // Get display names of first roles (or empty string if no roles)
      const aRole = aRoles.length > 0 ? getRoleDisplayName(aRoles[0], sortConfig.roles || {}) : '';
      const bRole = bRoles.length > 0 ? getRoleDisplayName(bRoles[0], sortConfig.roles || {}) : '';      
      
      return sortConfig.direction === 'asc' 
        ? aRole.localeCompare(bRole)
        : bRole.localeCompare(aRole);
    }
    
    // Handle sorting by affiliation (which might be undefined)
    if (sortConfig.key === 'affiliation') {
      const aAffiliation = a.affiliation || '';
      const bAffiliation = b.affiliation || '';
      
      return sortConfig.direction === 'asc'
        ? aAffiliation.localeCompare(bAffiliation)
        : bAffiliation.localeCompare(aAffiliation);
    }
    
    // Handle default case (name and email)
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    return sortConfig.direction === 'asc'
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });
};

// New component for search/filter controls
function UserFilters({ filters, setFilters, roles }) {
  const handleSearchChange = (e) => {
    setFilters({ ...filters, searchTerm: e.target.value });
  };
  
  const handleRoleFilterChange = (e) => {
    setFilters({ ...filters, selectedRole: e.target.value });
  };
  
  const clearFilters = () => {
    setFilters({ searchTerm: '', selectedRole: '' });
  };
  
  return (
    <div className="user-filters">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name or email"
          value={filters.searchTerm}
          onChange={handleSearchChange}
        />
      </div>
      
      <div className="role-filter">
        <select 
          value={filters.selectedRole} 
          onChange={handleRoleFilterChange}
          aria-label="Filter by role"
        >
          <option value="">All Roles</option>
          {Object.entries(roles || {})
            .filter(([code]) => code === 'AU' || code === 'ED' || code === 'RE')
            .map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>
      
      {(filters.searchTerm || filters.selectedRole) && (
        <button 
          type="button" 
          className="clear-filters" 
          onClick={clearFilters}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

UserFilters.propTypes = {
  filters: propTypes.shape({
    searchTerm: propTypes.string,
    selectedRole: propTypes.string
  }).isRequired,
  setFilters: propTypes.func.isRequired,
  roles: propTypes.object.isRequired
};

// New component for sorting controls
function UserSorting({ sortConfig, setSortConfig }) {
  const handleSortChange = (e) => {
    const value = e.target.value;
    
    if (value === "") {
      // No sorting selected
      setSortConfig(null);
    } else {
      // Split the value into key and direction
      const [key, direction] = value.split('-');
      setSortConfig({ key, direction });
    }
  };
  
  // Create the current value string from sortConfig
  const currentValue = sortConfig 
    ? `${sortConfig.key}-${sortConfig.direction}` 
    : "";
  
  return (
    <div className="user-sorting">
      <select 
        value={currentValue}
        onChange={handleSortChange}
        aria-label="Sort users"
      >
        <option value="">Default Order</option>
        <option value="name-asc">Name (A-Z)</option>
        <option value="name-desc">Name (Z-A)</option>
        <option value="email-asc">Email (A-Z)</option>
        <option value="email-desc">Email (Z-A)</option>
        <option value="affiliation-asc">Affiliation (A-Z)</option>
        <option value="affiliation-desc">Affiliation (Z-A)</option>
        <option value="role-asc">Role (A-Z)</option>
        <option value="role-desc">Role (Z-A)</option>
      </select>
    </div>
  );
}

UserSorting.propTypes = {
  sortConfig: propTypes.shape({
    key: propTypes.string.isRequired,
    direction: propTypes.string.isRequired
  }),
  setSortConfig: propTypes.func.isRequired
};

function AddUserForm({
  visible,
  cancel,
  fetchUsers,
  setError,
  setIsOperationLoading,
  roles
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

  const addUser = async (event) => {
    event.preventDefault();
    const newUser = {
      name: name,
      email: email,
      affiliation: affiliation,
      roles: selectedRoles,
      roleCodes: selectedRoles
    };
    
    try {
      setIsOperationLoading(true);
      await axios.put(USERS_CREATE_ENDPOINT, newUser);
      await fetchUsers();
      cancel();
    } catch (error) {
      setError(`${error.response.data.message}`);
    } finally {
      setIsOperationLoading(false);
    }
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
            {Object.entries(roles).map(([code, displayName]) => (
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
  setIsOperationLoading: propTypes.func.isRequired,
  roles: propTypes.object.isRequired
};

function EditUserForm({ 
  visible, cancel, fetchUsers, setError, user, setIsOperationLoading,
  roles
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
  
  const updateUser = async (event) => {
    event.preventDefault();
    const updatedUser = {
      name,
      email,
      affiliation,
      roles: selectedRoles,
      roleCodes: selectedRoles
    };
    
    try {
      setIsOperationLoading(true);
      await axios.put(USER_UPDATE_ENDPOINT, updatedUser);
      await fetchUsers();
      cancel();
    } catch (error) {
      setError(`error updating the user. ${error.response.data.message}`);
    } finally {
      setIsOperationLoading(false);
    }
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
            {Object.entries(roles).map(([code, displayName]) => (
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
  setIsOperationLoading: propTypes.func.isRequired,
  roles: propTypes.object.isRequired
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

function User({ user, onDelete, onEdit, isOperationLoading, roles }) {
  const { name, email, affiliation, roles: userRoles, roleCodes } = user;
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
  const displayRoles = roleCodes && roleCodes.length > 0 ? roleCodes : userRoles;

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
            Roles: {displayRoles.map(role => getRoleDisplayName(role, roles)).join(', ')}
          </p>
        )}
      </Link>
      <div className="button-group">
        <button 
          type="button" 
          onClick={handleDelete}
          disabled={isOperationLoading}
        >
          Delete
        </button>
        <button 
          type="button" 
          onClick={handleEdit}
          disabled={isOperationLoading}
        >
          Edit
        </button>
      </div>
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
  isOperationLoading: propTypes.bool.isRequired,
  roles: propTypes.object.isRequired
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
  const [filters, setFilters] = useState({ searchTerm: '', selectedRole: '' });
  const [sortConfig, setSortConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [roles, setRoles] = useState({});
  
  const fetchRoles = async () => {
    try {
      console.log('Fetching roles from:', ROLES_READ_ENDPOINT);
      const { data } = await axios.get(ROLES_READ_ENDPOINT);
      console.log('Roles response:', data);
      
      // Handle the roles data directly (no nested 'roles' property in the response)
      // Remove the 'string' key if it exists as it's not a valid role
      const roleData = { ...data };
      if ('string' in roleData) {
        delete roleData.string;
      }
      
      setRoles(roleData);
      console.log('Processed roles:', roleData);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setError(`There was a problem retrieving the roles. ${error}`);
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const { data } = await axios.get(USERS_READ_ENDPOINT);
      setUsers(usersObjectToArray(data.Users));
    } catch (error) {
      setError(`There was a problem retrieving the list of users. ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteUser = async (email) => {
    if (!email) return;
    
    try {
      setIsOperationLoading(true);
      setError('');
      await axios.delete(`${USER_DELETE_ENDPOINT}/${email}`);
      await fetchUsers();
    } catch (error) {
      setError(`There was a problem deleting the user. ${error}`);
    } finally {
      setIsOperationLoading(false);
    }
  };

  // When adding a user, close any edit forms that might be open
  const showAddUserForm = () => { 
    setEditingUser(null); // Close edit form if open
    setAddingUser(true);
    setError('');
  };
  
  const hideAddUserForm = () => { 
    setAddingUser(false);
    setError('');
  };

  // When editing a user, close the add form if it's open
  const editUser = (user) => {
    if (!user) return;
    setAddingUser(false); // Close add form if open
    setEditingUser(user);
    setError('');
  };

  const hideEditUserForm = () => {
    setEditingUser(null);
    setError('');
  };

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError('');
        await Promise.all([fetchRoles(), fetchUsers()]);
      } catch (error) {
        if (mounted) {
          setError(`There was a problem loading data. ${error}`);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // Filter users based on current filters
  const filteredUsers = filterUsers(users, filters);
  
  // Sort the filtered users based on current sort configuration
  const sortedUsers = sortConfig ? sortUsers(filteredUsers, sortConfig) : filteredUsers;

  return (
    <div className="wrapper">
      {isLoading ? (
        <Loading message="Loading users..." />
      ) : (
        <>
          <header>
            <h1>View All Users</h1>
            <button 
              type="button" 
              onClick={showAddUserForm}
              disabled={isOperationLoading}
            >
              Add a User
            </button>
          </header>
          
          <div className="user-controls">
            <UserFilters filters={filters} setFilters={setFilters} roles={roles} />
            
            {filteredUsers.length > 0 && (
              <UserSorting sortConfig={sortConfig} setSortConfig={setSortConfig} />
            )}
          </div>
          
          <div className="user-count">
            {filteredUsers.length === users.length 
              ? `Showing all ${users.length} users` 
              : `Showing ${filteredUsers.length} of ${users.length} users`}
          </div>
          
          <AddUserForm
            visible={addingUser}
            cancel={hideAddUserForm}
            fetchUsers={fetchUsers}
            setError={setError}
            setIsOperationLoading={setIsOperationLoading}
            roles={roles}
          />
          
          {editingUser && (
            <EditUserForm
              visible={true}
              cancel={hideEditUserForm}
              fetchUsers={fetchUsers}
              setError={setError}
              user={editingUser}
              setIsOperationLoading={setIsOperationLoading}
              roles={roles}
            />
          )}
          
          {error && <ErrorMessage message={error} />}
          
          {sortedUsers.length > 0 ? (
            sortedUsers.map((user) => (
              <User 
                key={user.email}
                user={user} 
                onDelete={deleteUser} 
                onEdit={editUser}
                isOperationLoading={isOperationLoading}
                roles={roles}
              />
            ))
          ) : (
            <p className="no-results">No users match your filters. Try adjusting your search criteria.</p>
          )}

          {isOperationLoading && <Loading message="Processing your request..." />}
        </>
      )}
    </div>
  );
}

export default Users;
export { filterUsers, sortUsers };
