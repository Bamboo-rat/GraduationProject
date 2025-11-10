import { useState, useEffect } from 'react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import categoryService, { type Category, type CategoryRequest } from '~/service/categoryService';
import fileStorageService from '~/service/fileStorageService';
import { PlusCircle, Search, Filter, Edit2, ToggleLeft, ToggleRight, Upload, Image as ImageIcon } from 'lucide-react';

export default function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const size = 20;

  // Filters
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form state
  const [formData, setFormData] = useState<CategoryRequest>({
    name: '',
    description: '',
    imageUrl: '',
    active: true,
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  // Debounce search query (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchQuery.trim();
      // Only reset page if search query actually changed (ignoring whitespace)
      if (trimmed !== debouncedSearchQuery) {
        setPage(0);
      }
      setDebouncedSearchQuery(trimmed);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchCategories();
  }, [page, activeFilter, debouncedSearchQuery]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await categoryService.getAllCategories(
        page,
        size,
        activeFilter,
        debouncedSearchQuery || undefined, // Convert empty string to undefined
        'name',
        'ASC'
      );
      setCategories(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = fileStorageService.validateFile(file, 5, [
      'image/jpeg',
      'image/png',
      'image/jpg',
    ]);

    if (!validation.valid) {
      setError(validation.error || 'File không hợp lệ');
      return;
    }

    try {
      setUploadingImage(true);
      const url = await fileStorageService.uploadCategoryImage(file);
      setFormData({ ...formData, imageUrl: url });
      setSuccess('Upload ảnh thành công');
    } catch (err: any) {
      setError(err.message || 'Không thể upload ảnh');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setLoading(true);
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.categoryId, formData);
        setSuccess('Cập nhật danh mục thành công');
      } else {
        await categoryService.createCategory(formData);
        setSuccess('Tạo danh mục thành công');
      }
      setShowModal(false);
      resetForm();
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      active: category.active,
    });
    setShowModal(true);
  };

  const handleToggleActive = async (category: Category) => {
    try {
      setLoading(true);
      setError(null);
      await categoryService.toggleActive(category.categoryId, !category.active);
      setSuccess(`${!category.active ? 'Kích hoạt' : 'Vô hiệu hóa'} danh mục thành công`);
      fetchCategories();
    } catch (err: any) {
      setError(err.message || 'Không thể cập nhật trạng thái');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      active: true,
    });
    setEditingCategory(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const getStatusBadge = (active: boolean) => {
    return active ? (
      <span className="badge-success">Hoạt động</span>
    ) : (
      <span className="badge-neutral">Không hoạt động</span>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <h1 className="heading-primary mb-2">Quản lý Danh mục</h1>
          <p className="text-muted">Tổng số: {totalElements} danh mục</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 border border-accent-red bg-red-50 text-accent-red rounded-lg animate-scaleIn">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 border border-secondary bg-[#E8FFED] text-secondary rounded-lg animate-scaleIn">
            {success}
          </div>
        )}

        {/* Action Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên danh mục..."
                className="input-field w-full pl-10"
              />
            </div>
            
            <select
              value={activeFilter === undefined ? 'all' : activeFilter ? 'active' : 'inactive'}
              onChange={(e) => {
                const value = e.target.value;
                setActiveFilter(value === 'all' ? undefined : value === 'active');
                setPage(0);
              }}
              className="input-field min-w-[160px]"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Không hoạt động</option>
            </select>
          </div>

          <button
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2 whitespace-nowrap lg:ml-auto"
          >
            <PlusCircle size={20} />
            Tạo danh mục mới
          </button>
        </div>

        {/* Categories Table */}
        <div className="card overflow-hidden">
          {loading && !categories.length ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted">Đang tải...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <div className="text-lg mb-2">📁</div>
              <p>Không có danh mục nào</p>
              <p className="text-sm text-light mt-1">Hãy tạo danh mục đầu tiên</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-surface-light">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Hình ảnh
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Tên danh mục
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Mô tả
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Số sản phẩm
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-surface divide-y divide-gray-200">
                    {categories.map((category) => (
                      <tr key={category.categoryId} className="hover:bg-surface-light transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {category.imageUrl ? (
                            <img
                              src={category.imageUrl}
                              alt={category.name}
                              className="h-12 w-12 rounded-lg object-cover border border-default"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-surface-light border border-default flex items-center justify-center">
                              <ImageIcon size={20} className="text-light" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-text">
                            {category.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-muted max-w-xs line-clamp-2">
                            {category.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-text">
                            {category.productCount}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(category.active)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(category)}
                              className="text-text hover:text-secondary transition-colors p-1"
                              title="Sửa"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleToggleActive(category)}
                              className="text-text hover:text-accent-warm transition-colors p-1"
                              title={category.active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                            >
                              {category.active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-surface-light px-6 py-4 flex items-center justify-between border-t border-default">
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-muted">
                        Hiển thị <span className="font-semibold text-text">{page * size + 1}</span> đến{' '}
                        <span className="font-semibold text-text">
                          {Math.min((page + 1) * size, totalElements)}
                        </span>{' '}
                        trong tổng số <span className="font-semibold text-text">{totalElements}</span> danh mục
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-lg shadow-sm -space-x-px">
                        <button
                          onClick={() => setPage(page - 1)}
                          disabled={page === 0}
                          className="btn-secondary rounded-l-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ← Trước
                        </button>
                        {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                          let pageNumber = i;
                          if (totalPages > 5) {
                            if (page < 3) pageNumber = i;
                            else if (page > totalPages - 4) pageNumber = totalPages - 5 + i;
                            else pageNumber = page - 2 + i;
                          }
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => setPage(pageNumber)}
                              className={`px-4 py-2 border text-sm font-medium transition-colors ${
                                pageNumber === page
                                  ? 'bg-primary text-surface border-primary-dark z-10'
                                  : 'bg-surface border-default text-text hover:bg-surface-light'
                              } ${i === 0 ? 'rounded-l-lg' : ''} ${i === Math.min(totalPages, 5) - 1 ? 'rounded-r-lg' : ''}`}
                            >
                              {pageNumber + 1}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setPage(page + 1)}
                          disabled={page >= totalPages - 1}
                          className="btn-secondary rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Sau →
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center w-full h-full z-50 p-4 animate-fadeIn">
            <div className="bg-surface rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto card-hover">
              <h3 className="heading-secondary mb-4">
                {editingCategory ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Tên danh mục <span className="text-accent-red">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="input-field w-full"
                    placeholder="Nhập tên danh mục"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Mô tả
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="input-field w-full resize-none"
                    placeholder="Nhập mô tả danh mục"
                    maxLength={1000}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Hình ảnh
                  </label>
                  <div className="border-2 border-dashed border-default rounded-lg p-4 text-center bg-surface-light transition-colors hover:border-primary">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                      id="category-image-upload"
                    />
                    <label
                      htmlFor="category-image-upload"
                      className={`cursor-pointer flex flex-col items-center gap-2 ${uploadingImage ? 'opacity-50' : ''}`}
                    >
                      <Upload size={32} className="text-light" />
                      <div>
                        <p className="text-sm text-text font-medium">
                          {uploadingImage ? 'Đang upload...' : 'Bấm để chọn ảnh'}
                        </p>
                        <p className="text-xs text-muted mt-1">PNG, JPG, JPEG (tối đa 5MB)</p>
                      </div>
                    </label>
                  </div>
                  {formData.imageUrl && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-text mb-2">Preview:</p>
                      <img
                        src={formData.imageUrl}
                        alt="Category preview"
                        className="h-24 w-24 object-cover rounded-lg border border-default"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center pt-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="h-4 w-4 text-primary focus:ring-primary border-default rounded"
                  />
                  <label htmlFor="active" className="ml-2 block text-sm text-text">
                    Kích hoạt danh mục
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-default">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn-secondary px-4 py-2"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploadingImage}
                    className="btn-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-surface border-t-transparent"></div>
                        Đang xử lý...
                      </span>
                    ) : editingCategory ? (
                      'Cập nhật'
                    ) : (
                      'Tạo mới'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}