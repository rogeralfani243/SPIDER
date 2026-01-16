// src/components/posts/main_post/PostContainer.jsx
import React, { useState } from 'react';
import SoftwareCard from './SoftwareCrad'; // ✅ Correction de la faute de frappe
import DownloadMediaModal from './DownloadManager';
import '../../../../styles/main_post/post-container.css';

const PostContainer = ({ post, currentUser, URL, ...props }) => {
  const [showDownloadManager, setShowDownloadManager] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  console.log('🟢 PostContainer rendered for:', post?.title);
  console.log('🟢 showDownloadManager state:', showDownloadManager);

  const handleInstall = (post) => {
    console.log('🔵 INSTALL BUTTON CLICKED in PostContainer!');
    console.log('🔵 Post:', post?.title);
    
    setSelectedPost(post);
    setShowDownloadManager(true);
    
    // Force un re-render immédiat
    setTimeout(() => {
      console.log('🔄 showDownloadManager should now be true:', showDownloadManager);
    }, 0);
  };

  const handleDownload = (downloadData) => {
    console.log('📥 Starting download:', downloadData);
    
    // Téléchargement réel
    if (downloadData.format === 'zip') {
      downloadAsZip(downloadData.files);
    } else {
      downloadIndividualFiles(downloadData.files);
    }
  };

  const downloadAsZip = async (files) => {
    console.log('📦 Creating ZIP with files:', files.length);
    alert(`Téléchargement ZIP de ${files.length} fichiers`);
    
    // Téléchargement simple pour tester
    files.forEach(file => {
      if (file.url) {
        console.log('⬇️ Downloading:', file.name);
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  const downloadIndividualFiles = (files) => {
    console.log('📄 Downloading individual files:', files.length);
    files.forEach((file, index) => {
      if (file.url) {
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = file.url;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, index * 100);
      }
    });
  };

  return (
    <>
      <SoftwareCard
        post={post}
        currentUser={currentUser}
        URL={URL}
        onInstall={handleInstall} // ✅ Cette fonction est passée à SoftwareCard
        {...props}
      />

      {showDownloadManager && selectedPost && (
        <>
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'red',
            color: 'white',
            padding: '20px',
            zIndex: 9999999,
            borderRadius: '10px',
            fontWeight: 'bold'
          }}>
            DEBUG: DownloadManager is rendered!
          </div>
          <DownloadMediaModal
            post={selectedPost}
            onClose={() => {
              console.log('❌ Closing DownloadManager');
              setShowDownloadManager(false);
              setSelectedPost(null);
            }}
            onDownload={(downloadData) => {
              console.log('✅ Download confirmed');
              handleDownload(downloadData);
              setShowDownloadManager(false);
              setSelectedPost(null);
            }}
          />
        </>
      )}
    </>
  );
};

export default PostContainer;