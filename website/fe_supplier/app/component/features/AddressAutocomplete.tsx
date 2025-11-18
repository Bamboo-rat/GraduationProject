import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Loader2, Search, X } from 'lucide-react';
import axios from 'axios';

const GOONG_API_KEY = import.meta.env.VITE_GOONG_API_KEY || '';
const GOONG_AUTOCOMPLETE_API = 'https://rsapi.goong.io/Place/AutoComplete';
const GOONG_PLACE_DETAIL_API = 'https://rsapi.goong.io/Place/Detail';

interface GoongPrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelected: (place: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onPlaceSelected,
  placeholder = "Nhập địa chỉ để tìm kiếm...",
  label = "Địa chỉ",
  required = false,
}) => {
  const [predictions, setPredictions] = useState<GoongPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (!value || value.length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      if (!GOONG_API_KEY) {
        setError('Thiếu Goong API key');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(GOONG_AUTOCOMPLETE_API, {
          params: {
            api_key: GOONG_API_KEY,
            input: value,
            location: '10.762622,106.660172', // TP.HCM center
            radius: 50000, // 50km
          },
        });

        if (response.data.predictions) {
          setPredictions(response.data.predictions);
          setShowDropdown(true);
        }
      } catch (err: any) {
        console.error('Goong Autocomplete Error:', err);
        setError('Lỗi tìm kiếm địa chỉ');
        setPredictions([]);
      } finally {
        setIsLoading(false);
      }
    }, 500); // Debounce 500ms

    return () => clearTimeout(delayDebounce);
  }, [value]);

  // Get place details (coordinates)
  const handleSelectPlace = async (prediction: GoongPrediction) => {
    try {
      setIsLoading(true);
      const response = await axios.get(GOONG_PLACE_DETAIL_API, {
        params: {
          api_key: GOONG_API_KEY,
          place_id: prediction.place_id,
        },
      });

      if (response.data.result) {
        const { geometry, formatted_address } = response.data.result;
        const lat = geometry.location.lat;
        const lng = geometry.location.lng;

        setSelectedPlace({ lat, lng });
        onChange(formatted_address || prediction.description);
        onPlaceSelected({
          address: formatted_address || prediction.description,
          latitude: lat,
          longitude: lng,
        });

        console.log('📍 Goong Place selected:', {
          address: formatted_address,
          lat,
          lng,
        });
      }

      setShowDropdown(false);
      setPredictions([]);
    } catch (err: any) {
      console.error('Goong Place Detail Error:', err);
      setError('Lỗi lấy thông tin vị trí');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearInput = () => {
    onChange('');
    setSelectedPlace(null);
    setPredictions([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // Error state - show warning
  if (!GOONG_API_KEY) {
    return (
      <div className="w-full">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="w-full px-4 py-3 border-2 border-orange-300 rounded-xl bg-orange-50">
          <p className="text-orange-700 text-sm flex items-center">
            <span className="mr-2">⚠️</span>
            Chưa cấu hình Goong API key. Vui lòng nhập địa chỉ thủ công.
          </p>
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all outline-none mt-2"
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <div className="w-full" ref={dropdownRef}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setSelectedPlace(null);
          }}
          onFocus={() => {
            if (predictions.length > 0) {
              setShowDropdown(true);
            }
          }}
          required={required}
          className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-[#2F855A] focus:ring-2 focus:ring-[#A4C3A2] transition-all outline-none"
          placeholder={placeholder}
        />

        {/* Clear button */}
        {value && (
          <button
            type="button"
            onClick={handleClearInput}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 animate-spin text-[#2F855A]" />
        )}

        {/* Success indicator */}
        {selectedPlace && !isLoading && (
          <MapPin className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#2F855A]" />
        )}

        {/* Dropdown suggestions */}
        {showDropdown && predictions.length > 0 && (
          <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                type="button"
                onClick={() => handleSelectPlace(prediction)}
                className="w-full px-4 py-3 text-left hover:bg-[#E8FFED] transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 text-[#2F855A] mr-2 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-[#2D2D2D]">
                      {prediction.structured_formatting.main_text}
                    </p>
                    <p className="text-xs text-[#6B6B6B] mt-0.5">
                      {prediction.structured_formatting.secondary_text}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Success message */}
      {selectedPlace && (
        <div className="mt-2 p-3 bg-[#E8FFED] border border-[#B7E4C7] rounded-lg">
          <p className="text-xs text-[#2F855A] flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            Đã chọn vị trí: {selectedPlace.lat.toFixed(6)}, {selectedPlace.lng.toFixed(6)}
          </p>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-700 flex items-center">
            <span className="mr-1">⚠️</span>
            {error}
          </p>
        </div>
      )}

      {/* Powered by Goong */}
      <p className="mt-1 text-xs text-gray-400 flex items-center">
        <span className="mr-1">🗺️</span>
        Powered by <a href="https://goong.io" target="_blank" rel="noopener noreferrer" className="text-[#2F855A] hover:underline ml-1">Goong Maps</a>
      </p>
    </div>
  );
};

export default AddressAutocomplete;
