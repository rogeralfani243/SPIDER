import React from 'react';

const SortDropdown = ({ options, value, onChange, label = 'Sort by' }) => {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="sort-dropdown">
      <label className="sort-label">
        <i className="fas fa-sort-amount-down"></i> {label}
      </label>
      <select
        value={value}
        onChange={handleChange}
        className="sort-select"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="sort-actions">
        <button
          className="sort-action"
          onClick={() => onChange('newest')}
          title="Reset to newest"
        >
          <i className="fas fa-redo"></i>
        </button>
      </div>
    </div>
  );
};

export default SortDropdown;