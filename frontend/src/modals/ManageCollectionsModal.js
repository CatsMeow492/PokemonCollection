import React, { useState } from 'react';
import { 
    Dialog, DialogContent, DialogActions, Button, TextField, List, 
    ListItem, ListItemText, ListItemSecondaryAction, IconButton, 
    Typography, Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import '../styles/ManageCollectionsModal.css';
import { handleAddCollection, handleDeleteCollection, refreshCollections } from '../handlers/CollectionHandlers';

const ManageCollectionsModal = ({ 
    open, 
    onClose, 
    userId, 
    collections,
    setCollections
}) => {
    const [newCollectionName, setNewCollectionName] = useState('');

    const handleAddCollectionClick = async () => {
        if (newCollectionName.trim()) {
            await handleAddCollection(userId, newCollectionName.trim(), setCollections);
            setNewCollectionName('');
        }
    };

    const onCollectionDeleted = async () => {
        // Refresh the collections after deletion
        await refreshCollections(userId, setCollections);
    };

    const deleteCollection = (collectionName) => {
        handleDeleteCollection(userId, collectionName, onCollectionDeleted);
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" className="manage-collections-modal">
            <DialogContent className="modal-content">
                <Typography variant="h6" className="modal-title">Manage Collections</Typography>
                <Divider />
                
                <Typography variant="subtitle1" className="modal-subtitle">Create New Collection</Typography>
                <div className="new-collection-input">
                    <TextField
                        label="New Collection Name"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        fullWidth
                        variant="outlined"
                        size="small"
                    />
                    <IconButton color="primary" onClick={handleAddCollectionClick} disabled={!newCollectionName.trim()}>
                        <AddIcon />
                    </IconButton>
                </div>

                <Typography variant="subtitle1" className="modal-subtitle">Existing Collections</Typography>
                <List className="collection-list">
                    {collections?.map((collectionName) => (
                        <ListItem key={collectionName} className="collection-item">
                            <ListItemText primary={collectionName} className="collection-name" />
                            <ListItemSecondaryAction>
                                <IconButton edge="end" aria-label="delete" onClick={() => deleteCollection(collectionName)} className="delete-button">
                                    <DeleteIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary" className="close-button">Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ManageCollectionsModal;
