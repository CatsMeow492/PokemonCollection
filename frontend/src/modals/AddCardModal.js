import React from 'react';
import { Dialog, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import AddCardForm from '../forms/AddCardForm';
import '../styles/AddCardModal.css';

const AddCardModal = ({ open, onClose, onCardAdded, collections }) => {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="add-card-modal-title" aria-describedby="add-card-modal-description" className="add-card-modal">
      <DialogContent className="modal-title">
        <Typography variant="h6" id="modal-title">Add Card</Typography>
        <AddCardForm 
          onCardAdded={onCardAdded}
          setAddCardModalOpen={onClose}
          collections={collections}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddCardModal;
