import React, { useContext, useState, useEffect } from 'react';
import { Container, Paper, Typography, Avatar, Button, Grid, TextField, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import AuthContext from '../context/AuthContext';
import { updateUserProfile } from '../utils/apiUtils';
import '../styles/ProfilePage.css';
import config from '../config';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  borderRadius: '15px',
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
}));

const defaultProfilePicture = 'https://i.pinimg.com/originals/45/84/c0/4584c0b11190ed3bd738acf8f1d24fa4.jpg';

const ProfilePage = () => {
  const { verbose } = config;
  const { username, profilePicture, updateProfile } = useContext(AuthContext);
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(username);
  const [newProfilePicture, setNewProfilePicture] = useState(profilePicture);

  useEffect(() => {
    setNewUsername(username);
    setNewProfilePicture(profilePicture);
  }, [username, profilePicture]);

  if (verbose) console.log('username:', username, 'profilePicture:', profilePicture);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = async () => {
    try {
      await updateUserProfile(newUsername, newProfilePicture);
      updateProfile(newUsername, newProfilePicture);
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  return (
    <Container maxWidth="md" className="profile-container">
      <StyledPaper elevation={3}>
        <Avatar
          src={profilePicture || defaultProfilePicture}
          alt={username}
          sx={{ width: 150, height: 150, mb: 2 }}
        />
        <Typography variant="h4" gutterBottom>
          {username}'s Profile
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {editing ? (
              <TextField
                fullWidth
                label="Username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            ) : (
              <Typography variant="h6">Username: {username}</Typography>
            )}
          </Grid>
          <Grid item xs={12}>
            {editing ? (
              <TextField
                fullWidth
                label="Profile Picture URL"
                value={newProfilePicture}
                onChange={(e) => setNewProfilePicture(e.target.value)}
              />
            ) : (
              <Typography variant="body1">Profile Picture URL: {profilePicture || 'Not set'}</Typography>
            )}
          </Grid>
        </Grid>
        <Box mt={3}>
          {editing ? (
            <Button variant="contained" color="primary" onClick={handleSave}>
              Save Changes
            </Button>
          ) : (
            <Button variant="contained" color="primary" onClick={handleEdit}>
              Edit Profile
            </Button>
          )}
        </Box>
      </StyledPaper>
    </Container>
  );
};

export default ProfilePage;
