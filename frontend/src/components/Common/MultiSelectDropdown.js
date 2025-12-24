import React, { useState, useEffect, useRef } from 'react';
import '../../pages/admin/Pages.css'; // Ensure styles are available

const MultiSelectDropdown = ({ options, selectedIds, onChange, placeholder, labelKey = 'name' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt[labelKey].toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggleOption = (id) => {
        const newSelected = selectedIds.includes(id)
            ? selectedIds.filter(item => item !== id)
            : [...selectedIds, id];
        onChange(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedIds.length === options.length) {
            onChange([]); // Deselect all
        } else {
            onChange(options.map(opt => opt.id)); // Select all
        }
    };

    const removeOption = (e, id) => {
        e.stopPropagation();
        onChange(selectedIds.filter(item => item !== id));
    };

    // Get selected option objects
    const selectedOptions = options.filter(opt => selectedIds.includes(opt.id));

    return (
        <div className="multi-select-container" ref={dropdownRef}>
            <div className="multi-select-header" onClick={() => setIsOpen(!isOpen)}>
                <div className="multi-select-tags">
                    {selectedOptions.length > 0 ? (
                        selectedOptions.map(opt => (
                            <span key={opt.id} className="multi-select-tag">
                                <span
                                    className="tag-remove"
                                    onClick={(e) => removeOption(e, opt.id)}
                                >
                                    ×
                                </span>
                                {opt[labelKey]}
                            </span>
                        ))
                    ) : (
                        <span className="placeholder">{placeholder}</span>
                    )}
                </div>
                <span className="arrow">{isOpen ? '▲' : '▼'}</span>
            </div>
            {isOpen && (
                <div className="multi-select-dropdown">
                    <input
                        type="text"
                        className="multi-select-search"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="multi-select-options">
                        {/* Select All Option */}
                        {filteredOptions.length > 0 && !searchTerm && (
                            <div
                                className="multi-select-option"
                                onClick={handleSelectAll}
                                style={{ borderBottom: '1px solid #eee', fontWeight: 'bold' }}
                            >
                                <input
                                    type="checkbox"
                                    className="custom-checkbox"
                                    checked={selectedIds.length === options.length && options.length > 0}
                                    readOnly
                                />
                                <span>Select All</span>
                            </div>
                        )}

                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(opt => (
                                <div
                                    key={opt.id}
                                    className={`multi-select-option ${selectedIds.includes(opt.id) ? 'selected' : ''}`}
                                    onClick={() => handleToggleOption(opt.id)}
                                >
                                    <input
                                        type="checkbox"
                                        className="custom-checkbox"
                                        checked={selectedIds.includes(opt.id)}
                                        readOnly
                                    />
                                    <span>{opt[labelKey]}</span>
                                </div>
                            ))
                        ) : (
                            <div className="no-options">No matches found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MultiSelectDropdown;
