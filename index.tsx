import React, { useState, useEffect ,useMemo, ChangeEvent, useCallback } from 'react';
import { ChevronDown, Phone, AlertCircle } from 'lucide-react'; 
import { useCountryData } from './Hooks/useCountryData';
import { useDebounce } from './Hooks/useDebounce';
import { ProPhoneInputProps, Country } from './Types/index';
import { validateNumber } from './Utils/utils';

const ProPhoneInput: React.FC<ProPhoneInputProps> = (props) => {
  const { fullCountryList, defaultCountry } = useCountryData(props);
  const { 
    initialValue = '', 
    customErrorMessage = 'Invalid phone number format.',
    placeholder,
    onChange,
    disableNativeName = false
  } = props;

  const [phoneNumber, setPhoneNumber] = useState(initialValue);
  const [selectedCountry, setSelectedCountry] = useState<Country>(defaultCountry);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [isValid, setIsValid] = useState(true);

    const debouncedPhoneNumber = useDebounce(phoneNumber, 500); // 500ms delay
  // Memoize the list for search filtering
  const filteredCountries = useMemo(() => {
    const lowerCaseFilter = filterText.toLowerCase();
    return fullCountryList.filter(c => 
      c.name.toLowerCase().includes(lowerCaseFilter) ||
      c.nativeName.toLowerCase().includes(lowerCaseFilter) ||
      c.dialCode.includes(filterText) ||
      c.isoCode.toLowerCase().includes(lowerCaseFilter)
    );
  }, [fullCountryList, filterText]);

  // Handler to sync number, validation, and external change callback
  const handleUpdate = useCallback((country: Country, number: string) => {
    const valid = validateNumber(number, country);
    setIsValid(valid);

    if (onChange) {
      // Send back the full number, country object, and validation status
      onChange(country.dialCode + number, country, valid);
    }
  }, [onChange]);

  useEffect(() => {
    handleUpdate(selectedCountry, debouncedPhoneNumber);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPhoneNumber, selectedCountry]);

  const handleNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    // FIX 1: Correctly sanitize input to allow only digits. 
    // \D matches any non-digit character. Replacing it with '' keeps only digits.
    const value = e.target.value.replace(/\D/g, ''); 
    setPhoneNumber(value);
    // FIX 2: Removed direct call to handleUpdate. Validation is now handled 
    // by the useEffect block using debouncedPhoneNumber.
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsDropdownOpen(false);
    setFilterText(''); 
    handleUpdate(country, phoneNumber); // Re-validate/update with new country
  };

    const handleDropdownToggle = () => {
    
      setIsDropdownOpen(prev => !prev);
      setFilterText(''); // Reset filter when opening
    
  }
  
  // Update selected country when defaultCountry changes from props
  React.useEffect(() => {
    setSelectedCountry(defaultCountry);
    handleUpdate(defaultCountry, phoneNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultCountry]);

  // Fallback image source in case the path is broken 
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.onerror = null; // prevents infinite loop
    // Placeholder image with "!" text to indicate missing asset
    e.currentTarget.src = "https://placehold.co/24x18/ccc/000?text=!"; 
  };

  // --- STYLES (Refactored for Sleekness and Customization) ---
  const ringColor = isValid ? 'ring-blue-500/50' : 'ring-red-500';
  
  // Main container now shares the border for both parts
  const containerClasses = `phone-input-container relative flex items-center w-full max-w-lg mx-auto bg-white rounded-xl shadow-lg ring-2 ${ringColor} transition duration-300 ease-in-out`;
  
  // Country selector button (no right border needed, the separator handles the visual divide)
  const dropdownButtonClasses = 'phone-input-selector flex items-center p-3 text-gray-700 rounded-l-xl cursor-pointer hover:bg-gray-50 transition duration-150 flex-shrink-0';
  
  // The input field itself is borderless now
  const inputClasses = "phone-input-field flex-grow p-3 text-lg border-none focus:outline-none placeholder-gray-400";
  
  // Separator style
  const separatorClasses = 'w-px h-6 bg-gray-300 mx-1 flex-shrink-0';

  // Dropdown menu with rounded corners
  const dropdownMenuClasses = "phone-input-dropdown absolute z-20 top-full left-0 mt-3 w-full max-h-72 bg-white rounded-xl shadow-2xl overflow-hidden ring-1 ring-gray-200 transform origin-top transition-all duration-200";

  return (
    <div className="w-full">
      <div className={containerClasses}>
        {/* Country Dropdown Button (Flag + Dial Code) */}
        <div 
          className={dropdownButtonClasses} 
          onClick={() => setIsDropdownOpen(prev => !prev)}
          role="button"
          tabIndex={0}
        >
          {/* FLAG RENDERING: Uses the resolved public path/URL */}
          <img 
            src={`/flags/${selectedCountry.isoCode.toLowerCase()}.svg`} 
            alt={`${selectedCountry.name} flag`} 
            style={{ width: '24px', height: '18px' }} 
            className="phone-input-flag mr-2 rounded-sm shadow-sm" 
            onError={handleImageError}
          />
          <span className="phone-input-dial-code text-base font-semibold">{selectedCountry.dialCode}</span>
          <ChevronDown size={16} className={`ml-2 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
        </div>

        {/* Separator */}
        <div className={separatorClasses} aria-hidden="true" />

        {/* Main Phone Number Input */}
        <input
          type="tel"
          value={phoneNumber}
          aria-countrycode={selectedCountry.isoCode}
          aria-countrydialcode={selectedCountry.dialCode}
          aria-countryname={selectedCountry.name}
          aria-countrynativename={selectedCountry.nativeName}
          aria-countrynsnlength={selectedCountry.nsnLength}
          placeholder={placeholder || `Example: ${'X'.repeat(selectedCountry.nsnLength)}`}
          onChange={handleNumberChange}
          className={inputClasses}
          style={{ minWidth: '150px' }}
          aria-label="Phone number input"
        />
        
        {/* Dropdown Menu */}
      
      </div>
        {/* Dropdown Menu */}
          {isDropdownOpen&&(<div className={dropdownMenuClasses}>
            <div className="phone-input-filter-container p-3 border-b border-gray-100 shadow-sm">
              <input
                type="text"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                placeholder="Search country..."
                className="phone-input-filter w-full p-2 text-base border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
                autoFocus
                // Keep the dropdown open while filtering
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                onFocus={() => setIsDropdownOpen(true)}
              />
            </div>
            <div className="phone-input-list-container overflow-y-auto max-h-60" role="listbox">
              {filteredCountries.map((country) => (
                <div 
                  key={country.isoCode}
                  className="phone-input-list-item flex items-center justify-between p-3 cursor-pointer hover:bg-blue-50 transition duration-100"
                  onClick={() => handleCountrySelect(country)}
                  role="option"
                  aria-selected={selectedCountry.isoCode === country.isoCode}
                >
                  <div className="flex items-center">
                    {/* FLAG RENDERING in Dropdown */}
                    <img 
                      src={`/flags/${country.isoCode.toLowerCase()}.svg`} 
                      alt={`${country.name} flag`} 
                      style={{ width: '24px', height: '18px' }} 
                      className="phone-input-flag-small mr-3 rounded-sm shadow-sm"
                      onError={handleImageError}
                    />
                    <span className="phone-input-country-name text-sm font-medium whitespace-nowrap">
                      {country.name}
                      {!disableNativeName && country.nativeName !== country.name && (
                        <span className="phone-input-native-name text-gray-500 ml-2 text-xs">({country.nativeName})</span>
                      )}
                    </span>
                  </div>
                  <span className="phone-input-dial-code-small text-sm font-semibold text-blue-600 flex-shrink-0 ml-3">{country.dialCode}</span>
                </div>
              ))}
              {filteredCountries.length === 0 && (
                <div className="phone-input-no-results p-4 text-center text-gray-500 text-sm">No countries found.</div>
              )}
            </div>
          </div>)}
        
      {/* Error Message */}
      {!isValid && (
        <div className="phone-input-error-message flex items-center mt-2 text-red-600 text-sm font-medium">
          <AlertCircle size={16} className="mr-2 flex-shrink-0" />
          {customErrorMessage}
        </div>
      )}
      
      {/* Global Styles */}
      <style>
        {`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; box-sizing: border-box; }
        .max-w-lg { max-width: 450px; }
        .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); }
        /* Flex alignment for vertical separator */
        .phone-input-container {align-items: center;
    display: flex;
    border: 1.5px solid black;
    border-radius: 0.5rem; 
    } .phone-input-selector {
    display: flex;
    align-items: center;
    min-width: 33%;
    cursor: pointer;
    justify-content: space-around;
    border-right: 1.5px solid grey;
}  img.phone-input-flag {
    width: 24px;
    height: 18px;
    border: 1px solid #80808073;
    border-radius: 5px;
    cursor: pointer;
}
input.phone-input-field{
    border: none;
    padding: 5px 2px;
    width: -webkit-fill-available;
    outline: none;
    background: transparent;
} .phone-input-dropdown {
    background: white;
    margin: auto;
    padding: 5px 3px;
    width: 99%;
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 34%), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border-bottom-right-radius: 1rem;
    border-bottom-left-radius: 1rem;
    max-height: 350px;
    /* height: 350px; */
    overflow-y: scroll;
} .phone-input-filter-container{
    width: 100%;
} .phone-input-list-item{
    display: flex;
    align-items: center;
    padding: 12px 5px;
    width: 100%;
    cursor: pointer;
    border-bottom: 0.025rem solid #80808042;
} .phone-input-list-item > div {
    /* display: flex; */
    /* align-items: center; */
    width: 79%;
    display: flex;
    align-items: center;
    margin-inline-end: 15px;
    justify-content: flex-start;
}
    img.phone-input-flag-small.mr-3.rounded-sm.shadow-sm {
    border: 1px solid #80808073;
    border-radius: 5px;
    width: 24px;
    height: 18px;
    margin-right: 10px;
} .phone-input-error-message {
    color: red;
    font-size: 0.75rem;
    font-weight: 200;
}
        `}
      </style>
    </div>
  );
};

export default ProPhoneInput;
