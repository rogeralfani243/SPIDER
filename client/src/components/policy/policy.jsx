import React, { useState } from 'react';
import './PolicyPage.css';

const PolicyPage = () => {
  const [activeSection, setActiveSection] = useState('introduction');

  const policyContent = {
    introduction: {
      title: "1. Introduction",
      content: `Welcome to SPIDER, a web application for sharing feedback, connecting with profiles, groups, and posts, and facilitating conversations. Our community thrives on respectful, constructive interactions. This policy outlines prohibited behaviors and content to ensure a safe environment for all users.`
    },
    prohibitedContent: {
      title: "2. Prohibited Content",
      subsections: [
        {
          title: "2.1 Illegal Content",
          items: [
            "Content that violates applicable laws and regulations",
            "Threats of violence or harm against individuals or groups",
            "Terrorist content or material promoting violent extremism",
            "Child sexual exploitation material"
          ]
        },
        {
          title: "2.2 Harmful or Dangerous Content",
          items: [
            "Content promoting self-harm, suicide, or eating disorders",
            "Instructions for creating harmful devices or substances",
            "Misinformation causing imminent physical harm",
            "Bullying, harassment, or targeted abuse"
          ]
        },
        {
          title: "2.3 Hate Speech",
          items: [
            "Content promoting violence or hatred against individuals based on:",
            "- Race or ethnicity",
            "- Religion",
            "- Gender or gender identity",
            "- Sexual orientation",
            "- Disability",
            "- National origin",
            "Dehumanizing language or stereotypes"
          ]
        },
        {
          title: "2.4 Harassment and Cyberbullying",
          items: [
            "Targeted harassment or malicious shaming",
            "Revealing private personal information (\"doxxing\")",
            "Sexual harassment or unwelcome sexual advances",
            "Repeated unwanted contact or stalking behavior"
          ]
        },
        {
          title: "2.5 Sexual Content",
          items: [
            "Non-consensual intimate images (\"revenge porn\")",
            "Sexual exploitation or solicitation",
            "Pornographic content (unless explicitly permitted in age-restricted sections)",
            "Sexual content involving minors"
          ]
        },
        {
          title: "2.6 Violent or Graphic Content",
          items: [
            "Gratuitously violent or graphic material",
            "Content glorifying suffering or humiliation",
            "Extreme violence without appropriate warnings or age restrictions"
          ]
        },
        {
          title: "2.7 Intellectual Property Violations",
          items: [
            "Copyright or trademark infringement",
            "Counterfeit goods or unauthorized sales",
            "Plagiarism of others' content without attribution"
          ]
        },
        {
          title: "2.8 Spam and Deceptive Practices",
          items: [
            "Artificial engagement (fake likes, comments, followers)",
            "Impersonation of individuals or organizations",
            "Phishing attempts or fraudulent schemes",
            "Misleading metadata or disguised content",
            "Unsolicited commercial messages"
          ]
        }
      ]
    },
    profileGroupGuidelines: {
      title: "3. Profile and Group Specific Guidelines",
      subsections: [
        {
          title: "3.1 Profile Content",
          items: [
            "Profiles must not impersonate others",
            "Profile names and images must not contain prohibited content",
            "Profile information must not facilitate harassment"
          ]
        },
        {
          title: "3.2 Group Administration",
          items: [
            "Group administrators are responsible for content within their groups",
            "Groups dedicated to prohibited activities will be removed",
            "Groups must have clear, accurate descriptions"
          ]
        },
        {
          title: "3.3 Feedback and Ratings",
          items: [
            "Feedback must be based on genuine experiences",
            "Coordinated campaigns to manipulate ratings are prohibited",
            "Feedback containing prohibited content will be removed"
          ]
        }
      ]
    },
    commentingStandards: {
      title: "4. Commenting and Conversation Standards",
      subsections: [
        {
          title: "4.1 Respectful Discourse",
          items: [
            "Disagreements should focus on ideas, not individuals",
            "Personal attacks or insults are prohibited",
            "Constructive criticism is encouraged; destructive criticism is not"
          ]
        },
        {
          title: "4.2 Conversation Integrity",
          items: [
            "Deliberate disruption of conversations (\"trolling\") is prohibited",
            "Off-topic comments that derail constructive discussions",
            "Repetitive posting of identical or similar content"
          ]
        }
      ]
    },
    reportingSystem: {
      title: "5. Reporting System",
      subsections: [
        {
          title: "5.1 How to Report",
          items: [
            "Use the \"Report\" button on any content, profile, group, or post",
            "Select the most appropriate category for your report",
            "Provide specific details when possible",
            "False reporting may result in account penalties"
          ]
        },
        {
          title: "5.2 Our Response Process",
          items: [
            "Reports are reviewed within 24-48 hours",
            "We may remove content without notice if it violates policy",
            "Serious violations may result in immediate account suspension",
            "Repeat offenders face progressively severe penalties"
          ]
        },
        {
          title: "5.3 Appeal Process",
          items: [
            "Users may appeal moderation decisions through our contact form",
            "Appeals will be reviewed by a separate moderator",
            "Decisions on appeals are typically made within 72 hours"
          ]
        }
      ]
    },
    enforcementActions: {
      title: "6. Enforcement Actions",
      subsections: [
        {
          title: "6.1 Content Actions",
          items: [
            "Removal of violating content",
            "Restricting visibility of content",
            "Adding warning screens to sensitive content"
          ]
        },
        {
          title: "6.2 Account Actions",
          items: [
            "Warning notices",
            "Temporary suspension (1 day to 30 days)",
            "Permanent suspension for severe or repeated violations",
            "Device or IP blocking in extreme cases"
          ]
        }
      ]
    },
    userResponsibilities: {
      title: "7. User Responsibilities",
      subsections: [
        {
          title: "7.1 Content Ownership",
          items: [
            "You retain ownership of your content",
            "You grant SPIDER license to display and distribute your content on our platform",
            "You are responsible for ensuring you have rights to share content"
          ]
        },
        {
          title: "7.2 Age Requirements",
          items: [
            "Users must be at least 13 years old",
            "Additional age restrictions may apply to certain features",
            "False age representation may result in account termination"
          ]
        },
        {
          title: "7.3 Security Responsibilities",
          items: [
            "Protect your account credentials",
            "Do not share your account with others",
            "Report suspicious activity immediately"
          ]
        }
      ]
    },
    platformRights: {
      title: "8. Platform Moderation Rights",
      content: `SPIDER reserves the right to:
- Remove any content that violates this policy
- Restrict access to features for policy violations
- Terminate accounts for severe or repeated violations
- Modify this policy with 30 days' notice to users
- Make final determinations on policy interpretation`
    },
    contactUs: {
      title: "9. How to Contact Us",
      content: `For policy questions or appeals:
Email: policy@spider-app.com
Online Form: spider-app.com/contact/policy
Mail: SPIDER Policy Team, [Your Business Address]`
    },
    policyUpdates: {
      title: "10. Policy Updates",
      content: `We will notify users of significant policy changes via:
- In-app notifications
- Email to registered addresses
- Announcements on our official channels

Last Updated: ${new Date().toLocaleDateString('en-US', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}`
    }
  };

  const renderSection = (sectionKey) => {
    const section = policyContent[sectionKey];
    
    if (!section) return null;

    return (
      <div className="policy-section">
        <h2 className="section-title-policy">{section.title}</h2>
        
        {section.content && (
          <div className="section-content">
            {section.content.split('\n').map((line, index) => (
              <p key={index} className="policy-text">{line}</p>
            ))}
          </div>
        )}
        
        {section.subsections && section.subsections.map((subsection, index) => (
          <div key={index} className="subsection">
            <h3 className="subsection-title">{subsection.title}</h3>
            <ul className="policy-list">
              {subsection.items.map((item, itemIndex) => (
                <li key={itemIndex} className="policy-list-item">{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="policy-page">
      <div className="policy-header">
        <h1 className="policy-main-title">SPIDER Platform Content and Conduct Policy</h1>
        <div className="policy-subtitle">
          Building a safe and respectful community for everyone
        </div>
      </div>
      
      <div className="policy-container">
        <div className="policy-sidebar">
          <h3 className="sidebar-title">Policy Sections</h3>
          <nav className="policy-nav">
            <button 
              className={`nav-item-policy ${activeSection === 'introduction' ? 'active' : ''}`}
              onClick={() => setActiveSection('introduction')}
            >
              1. Introduction
            </button>
            <button 
              className={`nav-item-policy ${activeSection === 'prohibitedContent' ? 'active' : ''}`}
              onClick={() => setActiveSection('prohibitedContent')}
            >
              2. Prohibited Content
            </button>
            <button 
              className={`nav-item-policy ${activeSection === 'profileGroupGuidelines' ? 'active' : ''}`}
              onClick={() => setActiveSection('profileGroupGuidelines')}
            >
              3. Profile & Group Guidelines
            </button>
            <button 
              className={`nav-item-policy ${activeSection === 'commentingStandards' ? 'active' : ''}`}
              onClick={() => setActiveSection('commentingStandards')}
            >
              4. Commenting Standards
            </button>
            <button 
              className={`nav-item-policy ${activeSection === 'reportingSystem' ? 'active' : ''}`}
              onClick={() => setActiveSection('reportingSystem')}
            >
              5. Reporting System
            </button>
            <button 
              className={`nav-item-policy ${activeSection === 'enforcementActions' ? 'active' : ''}`}
              onClick={() => setActiveSection('enforcementActions')}
            >
              6. Enforcement Actions
            </button>
            <button 
              className={`nav-item-policy ${activeSection === 'userResponsibilities' ? 'active' : ''}`}
              onClick={() => setActiveSection('userResponsibilities')}
            >
              7. User Responsibilities
            </button>
            <button 
              className={`nav-item-policy ${activeSection === 'platformRights' ? 'active' : ''}`}
              onClick={() => setActiveSection('platformRights')}
            >
              8. Platform Rights
            </button>
            <button 
              className={`nav-item-policy ${activeSection === 'contactUs' ? 'active' : ''}`}
              onClick={() => setActiveSection('contactUs')}
            >
              9. Contact Us
            </button>
            <button 
              className={`nav-item-policy ${activeSection === 'policyUpdates' ? 'active' : ''}`}
              onClick={() => setActiveSection('policyUpdates')}
            >
              10. Policy Updates
            </button>
          </nav>
          
          <div className="sidebar-info">
            <div className="quick-info">
              <h4>Important</h4>
              <p>By using SPIDER, you agree to this policy.</p>
              <p>Violations may result in content removal or account suspension.</p>
            </div>
          </div>
        </div>
        
        <div className="policy-content">
          {renderSection(activeSection)}
          
          <div className="policy-footer">
            <div className="agreement-box">
              <h3>User Agreement</h3>
              <p>
                By using the SPIDER platform, you acknowledge that you have read, 
                understood, and agree to be bound by this Content and Conduct Policy.
              </p>
              <button className="agree-button" onClick={() => alert('Thank you for agreeing to our policy!')}>
                I Understand and Agree
              </button>
            </div>
            
            <div className="report-reminder">
              <h4>See Something Wrong?</h4>
              <p>
                Help us maintain a safe community. Use the <strong>Report</strong> button 
                on any content that violates this policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyPage;