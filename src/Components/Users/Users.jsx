import React, { useEffect, useState, useMemo } from 'react';
import propTypes from 'prop-types';
import axios from 'axios';
import { Link } from 'react-router-dom';

import { BACKEND_URL } from '../../constants';
import Loading from '../Loading/Loading';
import { useAuth } from '../../AuthContext';
import './Users.css';

// Remove trailing slash if present to ensure proper URL formation
const backendUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;

const USERS_READ_ENDPOINT = `${backendUrl}/user/read`;
const USERS_CREATE_ENDPOINT = `${backendUrl}/user/create`;
const USER_DELETE_ENDPOINT = `${backendUrl}/user/delete`;
const USER_UPDATE_ENDPOINT = `${backendUrl}/user/update`;
const ROLES_READ_ENDPOINT = `${backendUrl}/roles`;
// Remove the unused ROLES_ENDPOINT variable
// const ROLES_ENDPOINT = `${BACKEND_URL}/roles`;

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
    
    return matchesSearchTerm && matchesRole;
  });
};

// New function for sorting users
const sortUsers = (users, sortCriteria) => {
  if (!sortCriteria) return users;
  
  const { key, direction } = sortCriteria;
  
  return [...users].sort((a, b) => {
    let comparison = 0;
    
    switch (key) {
      case 'name': {
        comparison = a.name.localeCompare(b.name);
        break;
      }
      case 'email': {
        comparison = a.email.localeCompare(b.email);
        break;
      }
      case 'affiliation': {
        comparison = (a.affiliation || '').localeCompare(b.affiliation || '');
        break;
      }
      case 'role': {
        // Sort by first role code if available
        const aRole = a.roleCodes && a.roleCodes.length > 0 ? a.roleCodes[0] : '';
        const bRole = b.roleCodes && b.roleCodes.length > 0 ? b.roleCodes[0] : '';
        comparison = aRole.localeCompare(bRole);
        break;
      }
      default:
        comparison = 0;
    }
    
    return direction === 'asc' ? comparison : -comparison;
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
  roles, isEditor
}) {
  const [name, setName] = useState(user.name);
  const [affiliation, setAffiliation] = useState(user.affiliation || '');
  const [selectedRoles, setSelectedRoles] = useState(
    (user.roleCodes && user.roleCodes.length > 0) ? user.roleCodes : (user.roles || [])
  );
  const [formError, setFormError] = useState('');
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
    
    // If user is not an editor and trying to add editor role, show error
    if (!isEditor && value === 'ED' && !selectedRoles.includes('ED')) {
      setFormError('Only editors can assign the editor role to users');
      return;
    }
    
    setSelectedRoles(
      // When a role is already selected, remove it; otherwise, add it
      selectedRoles.includes(value)
        ? selectedRoles.filter(role => role !== value)
        : [...selectedRoles, value]
    );
    
    // Clear any previous error when roles are successfully changed
    setFormError('');
  };
  
  const updateUser = async (event) => {
    event.preventDefault();
    
    // If user is not an editor but trying to update editor role
    if (!isEditor && selectedRoles.includes('ED') && !user.roleCodes?.includes('ED')) {
      setFormError('You do not have permission to assign the editor role');
      return;
    }
    
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
      console.log('User updated successfully:', updatedUser);
      await fetchUsers();
      cancel();
    } catch (error) {
      console.error('Error updating user:', error);
      console.error('Error details:', error.response?.data || error.message);
      setFormError(`Error updating the user: ${error.response?.data?.message || error.message}`);
      setError(`Error updating the user: ${error.response?.data?.message || error.message}`);
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
          <h4>
            Select Roles 
            {isEditor && <span className="editor-badge">Editor Mode</span>}
          </h4>
          <div className="roles-checkboxes">
            {Object.entries(roles).map(([code, displayName]) => (
              <div key={code} className="role-checkbox">
                <input
                  type="checkbox"
                  id={`edit-role-${code}`}
                  value={code}
                  checked={selectedRoles.includes(code)}
                  onChange={handleRoleChange}
                  disabled={!isEditor && code === 'ED'} // Only editors can assign editor roles
                />
                <label htmlFor={`edit-role-${code}`}>{displayName}</label>
              </div>
            ))}
          </div>
          {isEditor && (
            <div className="editor-note">
              As an editor, you can modify all roles including assigning editor privileges.
            </div>
          )}
          {!isEditor && (
            <div className="non-editor-note">
              Only editors can assign or modify the Editor role.
            </div>
          )}
          
          {formError && <div className="error-message">{formError}</div>}
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
  roles: propTypes.object.isRequired,
  isEditor: propTypes.bool
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

function User({ user, onDelete, onEdit, isOperationLoading, roles, currentUserRoles }) {
  // Check if the current user has editor permissions
  const isEditor = currentUserRoles && currentUserRoles.includes('ED');
  
  return (
    <div className="user-container">
      <Link to={`/${user.email}`}>
        <h2>{user.name}</h2>
        <p>Email: {user.email}</p>
        <p>Affiliation: {user.affiliation}</p>
        <p>
          Roles: {user.roleCodes && user.roleCodes.length > 0
            ? user.roleCodes.map(code => roles[code] || code).join(', ')
            : 'No roles assigned'}
        </p>
      </Link>
      {isEditor && (
        <div className="button-group">
          <button 
            type="button" 
            onClick={() => onDelete(user.email)}
            disabled={isOperationLoading}
          >
            Delete
          </button>
          <button 
            type="button" 
            onClick={() => onEdit(user)}
            disabled={isOperationLoading}
          >
            Edit
          </button>
        </div>
      )}
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
  roles: propTypes.object.isRequired,
  currentUserRoles: propTypes.array
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
  const [currentUserRoles, setCurrentUserRoles] = useState([]);
  const { userEmail } = useAuth();
  
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
      console.error('Error details:', error.response || error.message);
      setError(`There was a problem retrieving the roles. Please try again later.`);
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
        
        // First fetch roles, then users
        await fetchRoles();
        await fetchUsers();
        
        // We need to check for current user after users are loaded
        if (mounted && userEmail && users.length > 0) {
          const currentUser = users.find(user => user.email === userEmail);
          if (currentUser && currentUser.roleCodes) {
            console.log('Current user roles:', currentUser.roleCodes);
            setCurrentUserRoles(currentUser.roleCodes);
          }
        }
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
  }, [userEmail, users.length]);

  // Use useMemo for filtering and sorting
  const displayUsers = useMemo(() => {
    // First filter the users
    const filteredUsers = filterUsers(users, { searchTerm: filters.searchTerm, selectedRole: filters.selectedRole });
    // Then sort the filtered results
    return sortUsers(filteredUsers, sortConfig);
  }, [users, filters.searchTerm, filters.selectedRole, sortConfig]);

  return (
    <div className="wrapper">
      {isLoading ? (
        <Loading message="Loading users..." />
      ) : (
        <>
          <header>
            <h1>View All Users</h1>
            {currentUserRoles.includes('ED') && (
              <button 
                type="button" 
                onClick={showAddUserForm}
                disabled={isOperationLoading}
              >
                Add a User
              </button>
            )}
          </header>
          
          {!currentUserRoles.includes('ED') && (
            <div className="permission-notice">
              You are viewing users in read-only mode. Editor privileges are required to add, edit, or delete users.
            </div>
          )}
          
          <div className="user-controls">
            <UserFilters filters={filters} setFilters={setFilters} roles={roles} />
            
            {displayUsers.length > 0 && (
              <UserSorting sortConfig={sortConfig} setSortConfig={setSortConfig} />
            )}
          </div>
          
          <div className="user-count">
            {displayUsers.length === users.length 
              ? `Showing all ${users.length} users` 
              : `Showing ${displayUsers.length} of ${users.length} users`}
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
              isEditor={currentUserRoles.includes('ED')}
            />
          )}
          
          {error && <ErrorMessage message={error} />}
          
          {displayUsers.length > 0 ? (
            displayUsers.map((user) => (
              <User 
                key={user.email}
                user={user} 
                onDelete={deleteUser} 
                onEdit={editUser}
                isOperationLoading={isOperationLoading}
                roles={roles}
                currentUserRoles={currentUserRoles}
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
