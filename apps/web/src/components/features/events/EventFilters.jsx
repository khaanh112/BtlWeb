import React from 'react';
import { 
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  TagIcon,
  MapPinIcon,
  CalendarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const EventFilters = ({
  filters,
  onFilterChange,
  categories
}) => {
  const handleInputChange = (field, value) => {
    onFilterChange({ [field]: value });
  };
  
  const clearAllFilters = () => {
    onFilterChange({
      search: '',
      category: '',
      location: '',
      startDate: '',
      endDate: ''
    });
  };

  const hasActiveFilters = () => {
    return filters.search || 
           filters.category || 
           filters.location || 
           filters.startDate || 
           filters.endDate;
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 sticky top-20 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-cyan-50 flex justify-between items-center">
        <div className="flex items-center gap-1.5">
          <AdjustmentsHorizontalIcon className="h-4 w-4 text-teal-600" />
          <h3 className="text-xs font-bold text-gray-900">Bộ lọc</h3>
        </div>
        {hasActiveFilters() && (
          <button
            onClick={clearAllFilters}
            className="text-xs font-semibold text-red-600 hover:text-red-700"
          >
            Xóa
          </button>
        )}
      </div>

      {/* Filters Content */}
      <div className="p-3 space-y-3 max-h-[calc(100vh-180px)] overflow-y-auto">
        {/* Search */}
        <div>
          <label className="flex items-center gap-1 text-[10px] font-semibold text-gray-700 mb-1">
            <MagnifyingGlassIcon className="h-3 w-3" />
            Tìm kiếm
          </label>
          <div className="relative">
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleInputChange('search', e.target.value)}
              placeholder="Tìm sự kiện..."
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
            />
            {filters.search && (
              <button
                onClick={() => handleInputChange('search', '')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Category */}
        <div>
          <label className="flex items-center gap-1 text-[10px] font-semibold text-gray-700 mb-1">
            <TagIcon className="h-3 w-3" />
            Danh mục
          </label>
          <select
            value={filters.category || ''}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
          >
            <option value="">Tất cả</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
        
        {/* Location */}
        <div>
          <label className="flex items-center gap-1 text-[10px] font-semibold text-gray-700 mb-1">
            <MapPinIcon className="h-3 w-3" />
            Địa điểm
          </label>
          <input
            type="text"
            value={filters.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Nhập địa điểm..."
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
          />
        </div>
        
        {/* Date Range */}
        <div>
          <label className="flex items-center gap-1 text-[10px] font-semibold text-gray-700 mb-1">
            <CalendarIcon className="h-3 w-3" />
            Thời gian
          </label>
          <div className="space-y-1.5">
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-[10px] focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
            />
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              min={filters.startDate || ''}
              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-[10px] focus:border-teal-500 focus:ring-1 focus:ring-teal-200"
            />
          </div>
        </div>
        

      </div>
    </div>
  );
};

export default EventFilters;