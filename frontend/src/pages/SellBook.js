import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FaUpload, FaSpinner } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import imageCompression from 'browser-image-compression';

const SellBook = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    category: '',
    edition: '',
    condition: 'new',
    price: '',
    sellerContact: '',
    images: null,
    originalPrice: '',
    sellingPrice: '',
    quantity: 1
  });
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreviews, setImagePreviews] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = async (e) => {
    if (e.target.name === 'images') {
      const newFiles = Array.from(e.target.files);
      
      // Get existing files
      const existingFiles = formData.images ? Array.from(formData.images) : [];
      
      // Combine existing and new files (temporarily for count check)
      const potentialTotalCount = existingFiles.length + newFiles.length;
      
      // Check total count
      if (potentialTotalCount > 5) {
        alert(`You can upload a maximum of 5 images. You currently have ${existingFiles.length} image(s) and tried to add ${newFiles.length} more. Please select fewer images.`);
        e.target.value = '';
        return;
      }

      // Validate file types for new files
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      const invalidFiles = newFiles.filter(file => !validTypes.includes(file.type));
      
      if (invalidFiles.length > 0) {
        alert('Some files are not valid image formats. Only JPG, PNG, GIF, and WEBP are allowed.');
        e.target.value = '';
        return;
      }

      // Compress images
      setCompressing(true);
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true
      };

      try {
        const compressedFiles = await Promise.all(
          newFiles.map(async (file) => {
            try {
              const compressedBlob = await imageCompression(file, options);
              // Create a new File from the blob to preserve name and type
              return new File([compressedBlob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
            } catch (error) {
              console.warn(`Compression failed for ${file.name}, using original`, error);
              return file;
            }
          })
        );

        const allFiles = [...existingFiles, ...compressedFiles];

        // Update form data with all files
        setFormData(prev => ({ ...prev, images: allFiles }));
        
        // Create previews for all files
        const allPreviews = allFiles.map(file => URL.createObjectURL(file));
        // Clean up old previews
        imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
        setImagePreviews(allPreviews);
      } catch (error) {
        console.error('Error processing images:', error);
        alert('Error processing images. Please try again.');
      } finally {
        setCompressing(false);
        e.target.value = '';
      }
    } else {
      let value = e.target.value;
      if (e.target.name === 'sellerContact' && value) {
        value = value.replace(/\D/g, '');
        value = value.slice(0, 10);
      }
      setFormData(prev => ({ ...prev, [e.target.name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    console.log('🚀 Submitting book form...');
    
    // Validate images
    if (!formData.images || formData.images.length === 0) {
      setError('Please upload at least one book image. Images are required to list a book.');
      return;
    }

    // Validate image count (max 5)
    if (formData.images.length > 5) {
      setError('You can upload a maximum of 5 images. Please remove some images.');
      return;
    }

    // Validate required fields with specific messages
    const missingFields = [];
    if (!formData.title || formData.title.trim() === '') missingFields.push('Title');
    if (!formData.author || formData.author.trim() === '') missingFields.push('Author');
    if (!formData.description || formData.description.trim() === '') missingFields.push('Description');
    if (!formData.category || formData.category === '') missingFields.push('Category');
    if (user?.role === 'admin') {
      if (!formData.originalPrice || formData.originalPrice === '') missingFields.push('Original Price');
      if (!formData.sellingPrice || formData.sellingPrice === '') missingFields.push('Selling Price');
      if (!formData.quantity || Number(formData.quantity) < 1) missingFields.push('Quantity');
    } else {
      if (!formData.originalPrice || formData.originalPrice === '') missingFields.push('Original Price');
      if (!formData.sellingPrice || formData.sellingPrice === '') missingFields.push('Selling Price');
      if (!formData.quantity || Number(formData.quantity) < 1) missingFields.push('Quantity');
      if (!formData.sellerContact || formData.sellerContact.trim() === '') missingFields.push('Contact Number');
    }

    if (missingFields.length > 0) {
      const msg = `Please fill in the following required fields: ${missingFields.join(', ')}`;
      console.warn('❌ Validation failed:', msg);
      setError(msg);
      return;
    }

    if (user?.role === 'admin') {
      const op = Math.round(Number(formData.originalPrice));
      const sp = Math.round(Number(formData.sellingPrice));
      const qty = Number(formData.quantity);
      if (isNaN(op) || isNaN(sp) || op <= 0 || sp <= 0) {
        setError('Original price and selling price must be positive numbers');
        return;
      }
      if (sp > op) {
        setError('Selling price must be less than or equal to original price');
        return;
      }
      if (!Number.isInteger(qty) || qty < 1) {
        setError('Quantity must be a positive integer');
        return;
      }
    } else {
      const op = Math.round(Number(formData.originalPrice));
      const sp = Math.round(Number(formData.sellingPrice));
      const qty = Number(formData.quantity);
      if (isNaN(op) || isNaN(sp) || op <= 0 || sp <= 0) {
        setError('Original price and selling price must be positive numbers');
        return;
      }
      if (sp > op) {
        setError('Selling price must be less than or equal to original price');
        return;
      }
      if (!Number.isInteger(qty) || qty < 1) {
        setError('Quantity must be a positive integer');
        return;
      }
      if (formData.sellerContact) {
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(formData.sellerContact)) {
          setError('Please enter a valid 10-digit mobile number (starting with 6-9)');
          return;
        }
      }
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Add all form fields except images
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('author', formData.author.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('category', formData.category);
      formDataToSend.append('condition', formData.condition);
      formDataToSend.append('originalPrice', Math.round(parseFloat(formData.originalPrice)));
      formDataToSend.append('sellingPrice', Math.round(parseFloat(formData.sellingPrice)));
      formDataToSend.append('quantity', Math.round(parseInt(formData.quantity)));
      if (!user || user.role !== 'admin') {
        formDataToSend.append('sellerContact', formData.sellerContact.trim());
      }
      if (formData.edition && formData.edition.trim() !== '') {
        formDataToSend.append('edition', formData.edition.trim());
      }

      // Add images in order (first image will be the primary/home image)
      const imagesArray = Array.isArray(formData.images) ? Array.from(formData.images) : [formData.images];
      
      if (imagesArray.length === 0) {
        setError('Please upload at least one book image.');
        setLoading(false);
        return;
      }

      imagesArray.forEach((file, index) => {
        if (file && file instanceof File) {
          formDataToSend.append('images', file);
          console.log(`✅ Adding image ${index + 1}:`, file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        }
      });

      console.log('📤 Submitting book with', imagesArray.length, 'image(s)');
      
      // Don't set Content-Type header - let browser set it with boundary for FormData
      const response = await api.post('/books', formDataToSend);

      console.log('✅ Book created successfully:', response.data);
      setSuccess('Book listed successfully! Redirecting...');
      
      // Reset form
      setFormData({
        title: '',
        author: '',
        description: '',
        category: '',
        edition: '',
        condition: 'new',
        price: '',
        sellerContact: '',
        images: null,
        originalPrice: '',
        sellingPrice: '',
        quantity: 1
      });
      setImagePreviews([]);
      
      setTimeout(() => {
        navigate('/browse');
      }, 2000);
    } catch (error) {
      console.error('❌ Error submitting book:', error);
      
      let errorMessage = 'Error submitting book. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Sell a Book</h1>
          <p className="text-gray-600">List your book for sale. It will be immediately visible on the website.</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{success}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title and Author */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter book title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  required
                  placeholder="Enter author name"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                className="input-field"
                name="description"
                rows="5"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Describe the book's condition, any highlights, notes, etc."
              />
            </div>

            {/* Category, Condition, Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  className="input-field"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condition <span className="text-red-500">*</span>
                </label>
                <select
                  className="input-field"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                >
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="used">Used</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Original Price (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  className="input-field"
                  name="originalPrice"
                  value={formData.originalPrice}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Selling Price, Quantity, Edition & Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edition
                </label>
                <input
                  type="text"
                  className="input-field"
                  name="edition"
                  value={formData.edition}
                  onChange={handleChange}
                  placeholder="e.g., 1st Edition, 2023"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selling Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    name="sellingPrice"
                    value={formData.sellingPrice}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="1"
                    step="1"
                    placeholder="1"
                  />
                </div>
              </div>
              {!user || user.role !== 'admin' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    name="sellerContact"
                    value={formData.sellerContact}
                    onChange={handleChange}
                    required
                    placeholder="Your contact number"
                  />
                </div>
              ) : null}
            </div>

            {/* Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Book Images <span className="text-red-500">*</span>
              </label>
              <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                imagePreviews.length > 0 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-gray-300 hover:border-primary-500'
              }`}>
                {compressing ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <FaSpinner className="animate-spin text-3xl text-primary-600 mb-3" />
                    <p className="text-gray-600 font-medium">Compressing images...</p>
                    <p className="text-sm text-gray-500 mt-1">Optimizing for faster upload</p>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      className="hidden"
                      id="images"
                      name="images"
                      accept="image/*"
                      multiple
                      onChange={handleChange}
                    />
                    <label htmlFor="images" className="cursor-pointer">
                      <FaUpload className="text-3xl text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-1">
                        {imagePreviews.length > 0 
                          ? `${imagePreviews.length} image(s) selected. Click to add more.` 
                          : 'Click to upload images'}
                      </p>
                      <p className="text-sm text-gray-500">
                        Upload at least 1 image (up to 5 images allowed). Formats: PNG, JPG, JPEG, GIF, WEBP
                      </p>
                      {imagePreviews.length > 0 && imagePreviews.length < 5 && (
                        <p className="text-xs text-primary-600 mt-2 font-medium">
                          You can add {5 - imagePreviews.length} more image(s)
                        </p>
                      )}
                    </label>
                  </>
                )}
              </div>
              
              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-3">
                    {imagePreviews.length} image{imagePreviews.length > 1 ? 's' : ''} selected
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = Array.from(formData.images || []).filter((_, i) => i !== index);
                            const newPreviews = imagePreviews.filter((_, i) => i !== index);
                            setFormData({ ...formData, images: newFiles.length > 0 ? newFiles : null });
                            setImagePreviews(newPreviews);
                            // Revoke object URL to free memory
                            URL.revokeObjectURL(preview);
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove image"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate('/browse')}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>List Book</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SellBook;
