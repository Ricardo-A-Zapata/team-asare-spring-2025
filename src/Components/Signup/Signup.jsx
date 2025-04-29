import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios'
import propTypes from 'prop-types';
import { useAuth } from '../../AuthContext';

import { BACKEND_URL } from '../../constants';
const USERS_CREATE_ENDPOINT = `${BACKEND_URL}/user/create`;
const ROLES_READ_ENDPOINT = `${BACKEND_URL}/roles`;

function AddUserForm({
    roles
  }) {
    const navigate = useNavigate();
    const { login } = useAuth();
    
    const addUser = async (e) => {
      e.preventDefault();
      const chosenRoles = [];
      for (const key in roles ) {
        console.log(Object.keys(e.target?.elements))
        console.log([`role-${key}`])
        console.log(e.target?.elements[`role-${key}`])
        if (e.target?.elements[`role-${key}`]?.checked === true) {
            chosenRoles.push(key)
        }
      }
        const newUser = {
          name: e.target?.elements?.name?.value,
          email: e.target?.elements?.email?.value,
          password: e.target?.elements?.password?.value,
          affiliation: e.target?.elements?.affiliation?.value,
          roleCodes: [...chosenRoles],
        };
      try {
        await axios.put(USERS_CREATE_ENDPOINT, newUser);
        login(e.target?.elements?.email?.value);
        navigate('/');
      }
      catch (error) {
        alert(`${error.response.data.message}`)
      }
    };
    return (
      <div className="form-container">
        <h3>Add New User</h3>
        
        <form className="user-form" onSubmit={addUser}>
          <div className="form-fields">
            <div className="form-field">
              <label htmlFor="name">Name</label>
              <input 
                required 
                type="text" 
                id="name" 
                name="name"
              />
            </div>
            
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input required type="email" id="email" />
            </div>
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <input required type="password" id="password" />
            </div>
            
            <div className="form-field">
              <label htmlFor="affiliation">Affiliation</label>
              <input required type="text" id="affiliation" />
            </div>
          </div>
          
          <div className="roles-container">
            <h4>Select Roles</h4>
            <div className="roles-checkboxes">
              {Object.entries(roles)
                .filter(([code]) => code === 'AU') // Only show Author role
                .map(([code, displayName]) => (
                  <div key={code} className="role-checkbox">
                    <input
                      type="checkbox"
                      id={`role-${code}`}
                      value={code}
                      defaultChecked={true} // Automatically check the Author role
                      disabled // Disable the checkbox since it's the only option
                    />
                    <label htmlFor={`role-${code}`}>{displayName}</label>
                  </div>
                ))}
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit">Submit</button>
          </div>
        </form>
      </div>
    );
  }
  AddUserForm.propTypes = {
    roles: propTypes.object.isRequired
  };

const  Signup = () => {
    const [roles, setRoles] = useState([]);
    // const getRoleDisplayName = (roleCode, roles) => roles[roleCode] || roleCode;
    const fetchRoles = async () => {
        try {
        //   console.log('Fetching roles from:', ROLES_READ_ENDPOINT);
          const { data } = await axios.get(ROLES_READ_ENDPOINT);
        //   console.log('Roles response:', data);
          
          // Handle the roles data directly (no nested 'roles' property in the response)
          // Remove the 'string' key if it exists as it's not a valid role
          const roleData = { ...data };
          if ('string' in roleData) {
            delete roleData.string;
          }
        //   console.log('Processed roles:', roleData);
          setRoles(roleData);
        } catch (error) {
          console.error('Error fetching roles:', error);
          alert(`There was a problem retrieving the roles. ${error}`);
        }
      };
    useEffect(() => fetchRoles, []);
  return (
    <div>
        <h1 style={{textAlign: 'center'}}>Sign Up</h1>
        <AddUserForm roles={roles}/>
    </div>
  )
}

export default Signup