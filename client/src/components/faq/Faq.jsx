import React, { useState, useMemo } from 'react';
import './FAQPage.css';
import {
  FaUser,
  FaStar,
  FaUsers,
  FaEdit,
  FaShieldAlt,
  FaTools,
  FaLock,
  FaSearch,
  FaTimes,
  FaChevronRight,
  FaChevronDown,
  FaEnvelope,
  FaFileAlt,
  FaVideo,
  FaCheck,
  FaTimesCircle,
  FaCog,
  FaKey,
  FaTrash,
  FaCommentAlt,
  FaFlag,
  FaBan,
  FaExclamationTriangle,
  FaUpload,
  FaBell,
  FaMoon,
  FaDownload,
  FaComments
} from 'react-icons/fa';

const FAQPage = () => {
  const [activeCategory, setActiveCategory] = useState('account');
  const [openQuestions, setOpenQuestions] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const faqData = [
    {
      id: 'account',
      title: 'Account & Profile',
      icon: <FaUser className="faq-icon" />,
      questions: [
        {
          id: 'acc1',
          question: 'How do I create a SPIDER account?',
          answer: 'Click the "Sign Up" button on the homepage. Enter your email, choose a username and password, and verify your email address. You can also sign up using Google or Apple if available.'
        },
        {
          id: 'acc2',
          question: 'Can I change my username?',
          answer: 'Yes, you can change your username once every 30 days. Go to Settings > Profile > Edit Username. Note that your old username becomes available for others after 48 hours.'
        },
        {
          id: 'acc3',
          question: 'How do I delete my account permanently?',
          answer: 'Go to Settings > Security > Delete Account. You will need to confirm your password. Warning: This action is irreversible and will delete all your data, feedback, posts, and conversations.'
        },
        {
          id: 'acc4',
          question: 'What if I forgot my password?',
          answer: 'Click "Forgot Password" on the login page. Enter your email address and check your inbox for a reset link. The link expires in 24 hours for security.'
        }
      ]
    },
    {
      id: 'feedback',
      title: 'Feedback & Ratings',
      icon: <FaStar className="faq-icon" />,
      questions: [
        {
          id: 'fb1',
          question: 'How do I give feedback to someone?',
          answer: 'Navigate to the user\'s profile and click the "Give Feedback" button. You can rate on a scale of 1-5 stars and add written comments. Feedback can be public or private depending on your settings.'
        },
        {
          id: 'fb2',
          question: 'Can I edit or delete my feedback?',
          answer: 'You can edit your feedback as much as possible '
        },
        {
          id: 'fb3',
          question: 'How are overall ratings calculated?',
          answer: 'Overall ratings are an average of all feedback received in the last 12 months. Older feedback has reduced weight. We use a weighted algorithm to prevent manipulation.'
        },
        {
          id: 'fb4',
          question: 'What happens if someone gives me unfair feedback?',
          answer: 'Use the "Report" button on the feedback if you believe it violates our policies. Our moderation team will review within 48 hours. Malicious feedback may be removed.'
        }
      ]
    },
    {
      id: 'groups',
      title: 'Groups & Communities',
      icon: <FaUsers className="faq-icon" />,
      questions: [
        {
          id: 'gr1',
          question: 'How do I create a group?',
          answer: 'Go to your inbox then Click "Create Group" in the main menu or sidebar. Choose a name, description, cover image, and privacy settings. You can make it Public, Private (approval required), or Secret (invite only).'
        },
        {
          id: 'gr2',
          question: 'What are the responsibilities of a group admin?',
          answer: 'Admins can approve/deny membership requests, remove members, moderate content, assign moderators, and customize group settings. They are responsible for enforcing community guidelines.'
        },
        {
          id: 'gr3',
          question: 'How do I report inappropriate content in a group?',
          answer: 'Click the "Report" button (⋯) on the post or comment. You can also report the entire group by visiting the group page and using the report option.'
        },
        {
          id: 'gr4',
          question: 'Can I transfer group ownership?',
          answer: 'Yes, group owners can transfer ownership to another member. Go to Group Settings > Members > Select member > Transfer Ownership. This action cannot be undone.'
        }
      ]
    },
    {
      id: 'content',
      title: 'Posts & Comments',
      icon: <FaEdit className="faq-icon" />,
      questions: [
        {
          id: 'pc1',
          question: 'How do I control who sees my posts?',
          answer: 'Feedback is a public platform , you can only delete comment on your post or report it'
        },
        {
          id: 'pc2',
          question: 'Can I schedule posts?',
          answer: 'We are working on this fonctionnality'
        },
        {
          id: 'pc3',
          question: 'Why was my post/comments removed?',
          answer: 'Content is removed if it violates our Content Policy. Common reasons include hate speech, harassment, spam, or illegal content. You will receive a notification explaining the reason.'
        },
        {
          id: 'pc4',
          question: 'How do mentions (@) work?',
          answer: 'Type @ followed by a username to mention someone. They will receive a notification. You can mention up to 10 people per post. Mentions in comments work the same way.'
        }
      ]
    },
    {
      id: 'reporting',
      title: 'Reporting & Safety',
      icon: <FaShieldAlt className="faq-icon" />,
      questions: [
        {
          id: 'rp1',
          question: 'How do I report content or users?',
          answer: 'Click the "Report" button (⋯ menu) on any content, profile, or comment. Select the most appropriate reason and provide details. False reports may result in penalties.'
        },
        {
          id: 'rp2',
          question: 'What happens after I make a report?',
          answer: 'Reports are reviewed by our moderation team within 24-48 hours. You\'ll receive a notification when action is taken. Serious violations may result in immediate suspension.'
        },
        {
          id: 'rp3',
          question: 'How do I block someone?',
          answer: 'Go to their profile, click the ⋯ menu, and select "Block User". Blocked users cannot see your content, message you, or interact with you in any way.'
        },
        {
          id: 'rp4',
          question: 'What if I\'m being harassed?',
          answer: '1) Block the user immediately. 2) Report their messages/profile. 3) Contact our safety team at safety@spider-app.com for urgent situations. We take harassment seriously.'
        }
      ]
    },
    {
      id: 'technical',
      title: 'Technical Issues',
      icon: <FaTools className="faq-icon" />,
      questions: [
        {
          id: 'tech1',
          question: 'The app is slow or not loading properly',
          answer: '1) Clear your browser cache and cookies. 2) Check your internet connection. 3) Try using our mobile app. 4) Disable browser extensions that might interfere. If problems persist, contact support.'
        },
        {
          id: 'tech2',
          question: 'I can\'t upload images or files',
          answer: 'Ensure files are under 10MB. Supported formats: JPG, PNG, GIF, PDF, DOC, MP4 (under 50MB). Check browser permissions allow file uploads. Try a different browser.'
        },
        {
          id: 'tech3',
          question: 'Notifications are not working',
          answer: '1) Check Settings > Notifications are enabled. 2) Check browser/device notification permissions. 3) Ensure "Do Not Disturb" mode is off. 4) Whitelist notifications@spider-app.com.'
        },
        {
          id: 'tech4',
          question: 'How do I enable dark mode?',
          answer: 'Click your profile picture > Appearance > Select Dark Mode. You can also set it to follow your system settings or schedule automatic switching.'
        }
      ]
    },
    {
      id: 'privacy',
      title: 'Privacy & Data',
      icon: <FaLock className="faq-icon" />,
      questions: [
        {
          id: 'priv1',
          question: 'Who can see my personal information?',
          answer: 'Your email is never public. Username and profile info are visible based on your privacy settings. You can control visibility in Settings > Privacy > Profile Visibility.'
        },
        {
          id: 'priv2',
          question: 'How can I download my data?',
          answer: 'Go to Settings > Privacy > Download My Data. Request a copy, and we\'ll email you a secure link within 72 hours. The download includes all your content and activity.'
        },
        {
          id: 'priv3',
          question: 'Are conversations encrypted?',
          answer: 'Yes, all direct messages use end-to-end encryption. Group messages are encrypted in transit. We cannot read your private conversations.'
        },
        {
          id: 'priv4',
          question: 'How long is my data kept after account deletion?',
          answer: 'Most data is deleted immediately. Some information may be retained for 30 days for security purposes, then permanently erased. Backups are deleted within 90 days.'
        }
      ]
    }
  ];

  const toggleQuestion = (questionId) => {
    setOpenQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const filteredQuestions = useMemo(() => {
    if (!searchTerm.trim()) return faqData;

    const searchLower = searchTerm.toLowerCase();
    return faqData.map(category => ({
      ...category,
      questions: category.questions.filter(q =>
        q.question.toLowerCase().includes(searchLower) ||
        q.answer.toLowerCase().includes(searchLower)
      )
    })).filter(category => category.questions.length > 0);
  }, [searchTerm, faqData]);

  const activeCategoryData = filteredQuestions.find(cat => cat.id === activeCategory) || filteredQuestions[0];

  return (
    <div className="faq-container">
      <div className="faq-header">
        <h1 className="faq-main-title">Frequently Asked Questions</h1>
        <p className="faq-subtitle">
          Find quick answers to common questions about using SPIDER
        </p>
        
        <div className="faq-search-container">
          <div className="faq-search-wrapper">
            <FaSearch className="faq-search-icon" />
            <input
              type="text"
              placeholder="Search questions..."
              className="faq-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="faq-search-clear"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="faq-layout">
        <div className="faq-sidebar">
          <h3 className="faq-sidebar-title">Categories</h3>
          <nav className="faq-nav">
            {filteredQuestions.map(category => (
              <button
                key={category.id}
                className={`faq-nav-item ${activeCategory === category.id ? 'faq-nav-item-active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                <span className="faq-nav-icon">{category.icon}</span>
                <span className="faq-nav-text">{category.title}</span>
                <span className="faq-nav-count">{category.questions.length}</span>
                <FaChevronRight className="faq-nav-arrow" />
              </button>
            ))}
          </nav>

          <div className="faq-sidebar-help">
            <h4 className="faq-help-title">Need more help?</h4>
            <p className="faq-help-text">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <a href="/contact" className="faq-help-button">
              <FaEnvelope className="faq-button-icon" />
              Contact Support
            </a>
            <a href="/policy" className="faq-help-link">
              <FaFileAlt className="faq-link-icon" />
              View Content Policy
            </a>
          </div>
        </div>

        <div className="faq-content">
          <div className="faq-category-header">
            <h2 className="faq-category-title">
              <span className="faq-category-icon">{activeCategoryData.icon}</span>
              {activeCategoryData.title}
            </h2>
            <p className="faq-category-description">
              {activeCategoryData.questions.length} questions available
            </p>
          </div>

          <div className="faq-questions">
            {activeCategoryData.questions.length > 0 ? (
              activeCategoryData.questions.map(item => (
                <div key={item.id} className="faq-question-item">
                  <button
                    className="faq-question-button"
                    onClick={() => toggleQuestion(item.id)}
                    aria-expanded={openQuestions[item.id]}
                  >
                    <span className="faq-question-text">{item.question}</span>
                    <span className="faq-question-toggle">
                      {openQuestions[item.id] ? <FaChevronDown /> : <FaChevronRight />}
                    </span>
                  </button>
                  {openQuestions[item.id] && (
                    <div className="faq-answer">
                      <p>{item.answer}</p>
                      {item.id === 'rp1' && (
                        <div className="faq-extra">
                          <strong>Report categories include:</strong>
                          <ul className="faq-list">
                            <li><FaFlag className="faq-list-icon" /> Harassment or bullying</li>
                            <li><FaBan className="faq-list-icon" /> Hate speech</li>
                            <li><FaExclamationTriangle className="faq-list-icon" /> Spam or misinformation</li>
                            <li><FaCommentAlt className="faq-list-icon" /> Inappropriate content</li>
                            <li><FaUser className="faq-list-icon" /> Impersonation</li>
                          </ul>
                        </div>
                      )}
                      {item.id === 'tech2' && (
                        <div className="faq-extra">
                          <strong>Supported file types:</strong>
                          <ul className="faq-list">
                            <li><FaUpload className="faq-list-icon" /> Images: JPG, PNG, GIF (max 10MB)</li>
                            <li><FaFileAlt className="faq-list-icon" /> Documents: PDF, DOC (max 5MB)</li>
                            <li><FaVideo className="faq-list-icon" /> Videos: MP4 (max 50MB)</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="faq-no-results">
                <FaSearch className="faq-no-results-icon" />
                <p>No questions found for your search.</p>
                <button 
                  className="faq-clear-search"
                  onClick={() => setSearchTerm('')}
                >
                  <FaTimes className="faq-clear-icon" />
                  Clear search
                </button>
              </div>
            )}
          </div>

          <div className="faq-footer">
            <div className="faq-footer-section">
              <h4 className="faq-footer-title">Was this helpful?</h4>
              <div className="faq-feedback">
                <button className="faq-feedback-button faq-feedback-yes">
                  <FaCheck className="faq-feedback-icon" />
                  Yes
                </button>
                <button className="faq-feedback-button faq-feedback-no">
                  <FaTimesCircle className="faq-feedback-icon" />
                  No
                </button>
              </div>
            </div>
            
            <div className="faq-footer-section">
              <h4 className="faq-footer-title">Related Resources</h4>
              <div className="faq-resource-links">
                <a href="/policy" className="faq-resource-link">
                  <FaFileAlt className="faq-resource-icon" />
                  Content Policy
                </a>
                <a href="/community" className="faq-resource-link">
                  <FaUsers className="faq-resource-icon" />
                  Community Guidelines
                </a>
                <a href="/tutorials" className="faq-resource-link">
                  <FaVideo className="faq-resource-icon" />
                  Video Tutorials
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;