import React, { useState, useEffect, useContext } from 'react';
import axios from '../../api/axios';
import './Dashboard.css';
import { useUser } from '../UserContext/UserContext'; // Adjust the path to your actual UserContext location

function Dashboard() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [description, setDescription] = useState('');
  const [userRating, setUserRating] = useState(0); // User's rating for the selected image
  const { userId } = useUser();  // Using the custom hook
  const [averageRating, setAverageRating] = useState(0);
  useEffect(() => {
    fetchData().then(data => {
        setImages(data);
    });
}, []);
  const fetchData = async () => {
    try {
        const response = await axios.get('/dashboard');
        return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
        console.error("Error fetching data:", error);
        return [];
    }
};

  
  const getImageUrl = (path) => {
    return `http://localhost:3001/${path.replace('\\', '/')}`;
  };

  const handleImageChange = (event) => {
    setUploadedImage(event.target.files[0]);
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append('image', uploadedImage);
    formData.append('description', description);

    try {
      await axios.post('/dashboard/upload', formData);
      toggleUploadModal();
      fetchData();
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleImageClick = async (image) => {
    try {
        const response = await axios.get(`/dashboard/rating/${image.id}`);
        
        // Convert each rating from the response to a number and store in an array
        const ratingsArray = (Array.isArray(response.data) ? response.data : [])
        .map(item => Number(item.rating));
        
        // Calculate the total ratings using reduce function
        const totalRatings = ratingsArray.reduce((sum, ratingValue) => sum + ratingValue, 0);
        
        // Calculate the average rating
        const averageRating = totalRatings / ratingsArray.length;

        // Store the average rating in the selected image object
        setSelectedImage({
            ...image,
            averageRating: averageRating
        });
    } catch (error) {
        console.error("Error fetching ratings:", error);
    }
};


  const toggleUploadModal = () => {
    setUploadModalVisible(!isUploadModalVisible);
  };

  const handleRating = async (rating) => {
    if (selectedImage) {
      try {
        await axios.post('/dashboard/rate', {
          user_id: userId,
          photo_id: selectedImage.id, // Pass the id of the selected image
          rating: rating
        });
  
        setUserRating(rating);
        
        const response = await axios.get(`/dashboard/rating/${selectedImage.id}`);
    
        console.log('Selected Image ID:', selectedImage.id);
        console.log('Rating:', rating);
        console.log('User ID:', userId);
        
        // Convert each rating from the response to a number and store in an array
        const ratingsArray = (Array.isArray(response.data) ? response.data : [])
        .map(item => Number(item.rating));
        
        console.log(ratingsArray);
        
        // Calculate the total ratings using reduce function
        const totalRatings = ratingsArray.reduce((sum, ratingValue) => sum + ratingValue, 0);
        
        // Calculate the average rating
        const averageRating = totalRatings / ratingsArray.length;

        setSelectedImage(prevImage => ({
          ...prevImage,
          averageRating: averageRating
      }));
      fetchData().then(data => {
        setImages(data);
    });
      setSelectedImage(null);
        // Update the average rating in the UI or do something with it
      console.log("Average Rating:", averageRating);
  
      } catch (error) {
        console.error("Error rating image:", error);
      }
    } else {
      console.error("No selected image to rate.");
    }
};

const SelectedImageModal = () => {
    return (
        <div className="dashboard-modal">
            <div className="dashboard-modal-content">
                <span className="dashboard-close-button" onClick={() => setSelectedImage(null)}>X</span>
                <h2>Selected Photo</h2>
                <img src={getImageUrl(selectedImage.image_path)} alt={selectedImage.description} />
                <p>{selectedImage.description}</p>
                <div className="rate-section">
                    <p className="average-rating">Average Rating: {selectedImage.averageRating.toFixed(1)} / 5</p>
                    <span className="rate-text">Rate:</span>
                    <span className="empty-star" onClick={() => handleRating(5)}>&#9734;</span>
                    <span className="empty-star" onClick={() => handleRating(4)}>&#9734;</span>
                    <span className="empty-star" onClick={() => handleRating(3)}>&#9734;</span>
                    <span className="empty-star" onClick={() => handleRating(2)}>&#9734;</span>
                    <span className="empty-star" onClick={() => handleRating(1)}>&#9734;</span>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="Dashboard">
      <h1>Food Gallery</h1>
      
      <div className="image-grid">
        {images.map((image) => (
          <div
            key={image.id}
            className="image-thumbnail"
            onClick={() => handleImageClick(image)}
          >
            <img src={getImageUrl(image.image_path)} alt={image.description} />
          </div>
        ))}
      </div>
  
      <button className="upload-btn" onClick={toggleUploadModal}>Upload A Photo</button>
  
      {isUploadModalVisible && (
        <div className="upload-modal">
          <div className="dashboard-modal-content">
            <span className="dashboard-close-button" onClick={toggleUploadModal}>X</span>
            <h2>Upload Photo</h2>
            <input type="file" accept="image/*" onChange={handleImageChange} />
            <textarea 
              placeholder="Add a description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            ></textarea>
            <button onClick={handleSubmit}>Submit</button>
          </div>
        </div>
      )}
  
      {selectedImage && <SelectedImageModal />}
    </div>
  );
}

export default Dashboard;
