import React, { useState } from 'react';
import './CSVUploader.css';

function CSVUploader({ uploadedFiles, onFileUpload, preFilledFiles }) {
  const [uploadStatus, setUploadStatus] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});

  const handleFileChange = async (fileType, file) => {
    if (!file) return;

    // Set uploading status
    setUploadStatus(prev => ({ ...prev, [fileType]: 'uploading' }));
    setUploadErrors(prev => ({ ...prev, [fileType]: null }));

    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      const response = await fetch('http://localhost:3000/merchants/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setUploadStatus(prev => ({ ...prev, [fileType]: 'success' }));
        onFileUpload(fileType, file.name);
        console.log(`✅ Uploaded ${file.name} - ${data.merchantCount} merchants loaded`);
      } else {
        // Parse error response
        let errorMessage = 'Upload failed';
        try {
          const errorData = await response.json();
          
          // Extract specific error message
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
          
          // Add hint if available
          if (errorData.hint) {
            errorMessage += ` (${errorData.hint})`;
          }
          
          console.error('Upload failed:', errorData);
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = `Upload failed: ${response.statusText || response.status}`;
        }
        
        setUploadStatus(prev => ({ ...prev, [fileType]: 'error' }));
        setUploadErrors(prev => ({ ...prev, [fileType]: errorMessage }));
      }
    } catch (error) {
      // Network or other errors
      let errorMessage = 'Network error';
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to server. Make sure backend is running on port 3000.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setUploadStatus(prev => ({ ...prev, [fileType]: 'error' }));
      setUploadErrors(prev => ({ ...prev, [fileType]: errorMessage }));
      console.error('Upload error:', error);
    }
  };

  return (
    <div className="csv-uploader">
      <h3>📁 CSV Upload</h3>
      <div className="upload-grid">
        <FileUploadBox
          label="Merchant Onboarding Data"
          fileType="merchants"
          uploadedFile={uploadedFiles.merchants}
          uploadStatus={uploadStatus.merchants}
          uploadError={uploadErrors.merchants}
          isPrefilled={preFilledFiles?.merchants}
          onUpload={(file) => handleFileChange('merchants', file)}
          required
        />
        <FileUploadBox
          label="Network Metrics CSV"
          fileType="network"
          uploadedFile={uploadedFiles.network}
          uploadStatus={uploadStatus.network}
          uploadError={uploadErrors.network}
          isPrefilled={preFilledFiles?.network}
          onUpload={(file) => handleFileChange('network', file)}
        />
        <FileUploadBox
          label="Merchant Bio/Profile CSV"
          fileType="bio"
          uploadedFile={uploadedFiles.bio}
          uploadStatus={uploadStatus.bio}
          uploadError={uploadErrors.bio}
          isPrefilled={preFilledFiles?.bio}
          onUpload={(file) => handleFileChange('bio', file)}
        />
      </div>
    </div>
  );
}

function FileUploadBox({ label, fileType, uploadedFile, uploadStatus, uploadError, isPrefilled, onUpload, required }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file extension
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.csv') && !fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        alert('Please upload a CSV or Excel file');
        e.target.value = ''; // Reset input
        return;
      }
      onUpload(file);
    }
  };

  const getStatusIcon = () => {
    if (uploadStatus === 'uploading') return '⏳';
    if (uploadStatus === 'success' && uploadedFile) return '✅';
    if (uploadStatus === 'error') return '❌';
    if (isPrefilled && uploadedFile) return '📋'; // Pre-filled from data folder
    if (uploadedFile) return '✅';
    return '📄';
  };

  const getStatusText = () => {
    if (uploadStatus === 'uploading') return 'Uploading...';
    if (uploadStatus === 'success' && uploadedFile) return uploadedFile;
    if (uploadStatus === 'error') return 'Upload failed';
    if (uploadedFile) return uploadedFile;
    return 'Choose CSV or Excel file...';
  };

  const getStatusClass = () => {
    if (uploadStatus === 'uploading') return 'uploading';
    if (uploadStatus === 'success') return 'success';
    if (uploadStatus === 'error') return 'error';
    if (isPrefilled && uploadedFile) return 'prefilled';
    if (uploadedFile) return 'success';
    return '';
  };

  return (
    <div className="file-upload-box">
      <label className="upload-label">
        {label} {required && <span className="required">*</span>}
        {isPrefilled && uploadedFile && (
          <span className="prefilled-badge">Pre-loaded</span>
        )}
      </label>
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        onChange={handleFileChange}
        className="file-input"
        id={`upload-${fileType}`}
      />
      <label htmlFor={`upload-${fileType}`} className={`file-input-label ${getStatusClass()}`}>
        <span className="file-icon">{getStatusIcon()}</span>
        <span className={uploadedFile ? 'file-name' : 'file-placeholder'}>
          {getStatusText()}
        </span>
      </label>
      {isPrefilled && uploadedFile && !uploadError && (
        <div className="prefilled-info">
          Found in data folder - ready to use
        </div>
      )}
      {uploadError && (
        <div className="upload-error">
          {uploadError}
        </div>
      )}
    </div>
  );
}

export default CSVUploader;
