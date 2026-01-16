// components/IconDropdown/DropdownMenu.js
import React from 'react';
import { FaMoon, FaSun, FaCog } from 'react-icons/fa';
import DropdownOption from './DropdownOption';

const DropdownMenu = ({
  isOpen,
  user,
  mainOptions,
  supportOptions,
  accountOptions,
  activeSubmenu,
  onOptionClick,
  onSubItemClick,
  theme,
  onToggleTheme
}) => {
  if (!isOpen) return null;

  const renderOptions = (options) => {
    return options.map((option) => (
      <DropdownOption
        key={option.id}
        option={option}
        isActive={activeSubmenu === option.id}
        onClick={onOptionClick}
        onSubItemClick={onSubItemClick}
      />
    ));
  };

  return (
    <div className={`dropdown-menu ${isOpen ? 'show' : ''}`}>
     

      <div className="dropdown-section">
        <h4 className="dash-section-title">ACCOUNT</h4>
        {renderOptions(mainOptions)}
      </div>

      <div className="dropdown-section">
        <h4 className="dash-section-title">SUPPORT</h4>
        {renderOptions(supportOptions)}
      </div>

      <div className="dropdown-section">
        <h4 className="dash-section-title">ACCOUNT ACTIONS</h4>
        {renderOptions(accountOptions)}
      </div>

      <div className="dropdown-footer">
        <p className="app-version">Spider v2.0.1</p>
        <div className="quick-actions">
          <button 
            className="quick-action" 
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          >
            {theme === 'light' ? <FaMoon /> : <FaSun />}
          </button>
          <button 
            className="quick-action" 
            onClick={() => console.log('Quick settings')}
            aria-label="Quick settings"
          >
            <FaCog />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DropdownMenu;