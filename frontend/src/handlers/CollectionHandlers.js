import { createCollection, deleteCollection, fetchCollectionsByUserID } from '../services/collectionService';

export const handleAddCollection = async (userId, collectionName) => {
    try {
        await createCollection(userId, collectionName);
        // Handle successful creation (e.g., update state, show message)
        setManageCollectionsModalOpen(false);
        // Refresh collections list
        fetchCollectionsByUserID(id)
            .then(data => {
                setCollections(data || []);
            })
            .catch(error => {
                console.error('Error fetching collections:', error);
            });
    } catch (error) {
        console.error('Failed to create collection:', error);
        // Handle error (e.g., show error message)
    }
};

export const handleDeleteCollection = async (userId, collectionName) => {
    try {
        await deleteCollection(userId, collectionName);
        // Handle successful deletion (e.g., update state, show message)
        setManageCollectionsModalOpen(false);
        // Refresh collections list
        fetchCollectionsByUserID(id)
            .then(data => {
                setCollections(data || []);
            })
            .catch(error => {
                console.error('Error fetching collections:', error);
            });
    } catch (error) {
        console.error('Failed to delete collection:', error);
        // Handle error (e.g., show error message)
    }
};