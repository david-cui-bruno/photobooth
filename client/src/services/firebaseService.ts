import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc,
    increment,
    orderBy,
    query,
    onSnapshot,
    Timestamp
  } from 'firebase/firestore';
  import { db } from './firebaseConfig';
  
  export interface PhotoStrip {
    id: string;
    title: string;
    description?: string;
    imageData: string;
    stripType: '2-panel' | '4-panel' | '6-panel';
    frameType: string;
    createdAt: Date;
    likes: number;
    author?: string;
    tags?: string[];
  }
  
  class FirebaseService {
    async createPhotoStrip(data: {
      title: string;
      description?: string;
      imageData: string;
      stripType: '2-panel' | '4-panel' | '6-panel';
      frameType: string;
      author?: string;
      tags?: string[];
    }): Promise<PhotoStrip> {
      try {
        const docRef = await addDoc(collection(db, 'photostrips'), {
          title: data.title,
          description: data.description,
          imageData: data.imageData,
          stripType: data.stripType,
          frameType: data.frameType,
          author: data.author,
          tags: data.tags || [],
          createdAt: Timestamp.now(),
          likes: 0
        });

        return {
          id: docRef.id,
          title: data.title,
          description: data.description,
          imageData: data.imageData,
          stripType: data.stripType,
          frameType: data.frameType,
          author: data.author,
          tags: data.tags || [],
          createdAt: new Date(),
          likes: 0
        };
      } catch (error) {
        console.error('Error creating photo strip:', error);
        throw new Error('Failed to create photo strip');
      }
    }
  
    subscribeToPhotoStrips(callback: (strips: PhotoStrip[]) => void): () => void {
      const q = query(
        collection(db, 'photostrips'), 
        orderBy('createdAt', 'desc')
      );
      
      return onSnapshot(q, (snapshot) => {
        const strips = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate()
          } as PhotoStrip;
        });
        callback(strips);
      }, (error) => {
        console.error('Error subscribing to photo strips:', error);
      });
    }
  
    async getAllPhotoStrips(): Promise<PhotoStrip[]> {
      try {
        const q = query(
          collection(db, 'photostrips'), 
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        
        return snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate()
          } as PhotoStrip;
        });
      } catch (error) {
        console.error('Error getting photo strips:', error);
        throw new Error('Failed to get photo strips');
      }
    }
  
    async deletePhotoStrip(id: string): Promise<void> {
      try {
        const docRef = doc(db, 'photostrips', id);
        await deleteDoc(docRef);
      } catch (error) {
        console.error('Error deleting photo strip:', error);
        throw new Error('Failed to delete photo strip');
      }
    }
  
    async deleteAllPhotoStrips(): Promise<void> {
      try {
        const q = query(collection(db, 'photostrips'));
        const snapshot = await getDocs(q);
        
        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
      } catch (error) {
        console.error('Error deleting all photo strips:', error);
        throw new Error('Failed to delete all photo strips');
      }
    }
  }
  
  export const firebaseService = new FirebaseService();