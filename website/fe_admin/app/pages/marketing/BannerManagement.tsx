import { useState, useEffect } from 'react';
import DashboardLayout from '~/component/layout/DashboardLayout';
import bannerService from '~/service/bannerService';
import fileStorageService from '~/service/fileStorageService';
import type { BannerResponse, BannerRequest } from '~/service/bannerService';
import { PlusCircle, Search, Filter, Eye, Edit2, ToggleLeft, ToggleRight, Trash2, Upload, Image as ImageIcon } from 'lucide-react';

export default function BannerManagement() {
  const [banners, setBanners] = useState<BannerResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const size = 10;

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | ''>('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<BannerResponse | null>(null);

  // Form state
  const [formData, setFormData] = useState<BannerRequest>({
    imageUrl: '',
    title: '',
    description: '',
    linkUrl: '',
    status: 'ACTIVE',
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, [page, statusFilter]);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await bannerService.getAllBanners({
        page,
        size,
        status: statusFilter || undefined,
        sortBy: 'createdAt',
        sortDirection: 'DESC',
      });
      setBanners(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách banner');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file ảnh');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB');
      return;
    }

    try {
      setUploading(true);
      const imageUrl = await fileStorageService.uploadBanner(file);
      setFormData({ ...formData, imageUrl });
    } catch (error: any) {
      alert('Upload ảnh thất bại: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateBanner = async () => {
    if (!formData.imageUrl) {
      alert('Vui lòng upload ảnh banner');
      return;
    }

    try {
      await bannerService.createBanner(formData);
      setSuccess('Tạo banner thành công!');
      setShowCreateModal(false);
      resetForm();
      fetchBanners();
    } catch (error: any) {
      setError('Tạo banner thất bại: ' + error.message);
    }
  };

  const handleUpdateBanner = async () => {
    if (!selectedBanner || !formData.imageUrl) return;

    try {
      await bannerService.updateBanner(selectedBanner.bannerId, formData);
      setSuccess('Cập nhật banner thành công!');
      setShowEditModal(false);
      resetForm();
      fetchBanners();
    } catch (error: any) {
      setError('Cập nhật banner thất bại: ' + error.message);
    }
  };

  const handleDeleteBanner = async () => {
    if (!selectedBanner) return;

    try {
      await bannerService.deleteBanner(selectedBanner.bannerId);
      setSuccess('Xóa banner thành công!');
      setShowDeleteModal(false);
      setSelectedBanner(null);
      fetchBanners();
    } catch (error: any) {
      setError('Xóa banner thất bại: ' + error.message);
    }
  };

  const handleToggleStatus = async (banner: BannerResponse) => {
    try {
      if (banner.status === 'ACTIVE') {
        await bannerService.deactivateBanner(banner.bannerId);
        setSuccess('Đã tắt banner');
      } else {
        await bannerService.activateBanner(banner.bannerId);
        setSuccess('Đã bật banner');
      }
      fetchBanners();
    } catch (error: any) {
      setError('Thay đổi trạng thái thất bại: ' + error.message);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (banner: BannerResponse) => {
    setSelectedBanner(banner);
    setFormData({
      imageUrl: banner.imageUrl,
      title: banner.title || '',
      description: banner.description || '',
      linkUrl: banner.linkUrl || '',
      status: banner.status,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (banner: BannerResponse) => {
    setSelectedBanner(banner);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      imageUrl: '',
      title: '',
      description: '',
      linkUrl: '',
      status: 'ACTIVE',
    });
    setSelectedBanner(null);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: 'Đang hiển thị', class: 'badge-success' },
      INACTIVE: { label: 'Đã tắt', class: 'badge-neutral' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, class: 'badge-neutral' };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${config.class}`}>
        {config.label}
      </span>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6 animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <h1 className="heading-primary mb-2">Quản lý Banner & Quảng cáo</h1>
          <p className="text-muted">Tổng số: {totalElements} banner</p>
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
          <div className="flex gap-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setPage(0);
              }}
              className="input-field min-w-[160px]"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hiển thị</option>
              <option value="INACTIVE">Đã tắt</option>
            </select>
          </div>

          <button
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2 whitespace-nowrap lg:ml-auto"
          >
            <PlusCircle size={20} />
            Tạo Banner Mới
          </button>
        </div>

        {/* Banner List */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted">Đang tải...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 text-accent-red">
              <p>{error}</p>
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <div className="text-lg mb-2">🖼️</div>
              <p>Chưa có banner nào</p>
              <p className="text-sm text-light mt-1">Hãy tạo banner đầu tiên</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-surface-light">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Ảnh
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Tiêu đề
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Mô tả
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Link
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-text uppercase tracking-wider">
                        Ngày tạo
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-text uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-surface divide-y divide-gray-200">
                    {banners.map((banner) => (
                      <tr key={banner.bannerId} className="hover:bg-surface-light transition-colors">
                        <td className="px-6 py-4">
                          <img
                            src={banner.imageUrl}
                            alt={banner.title || 'Banner'}
                            className="h-16 w-32 object-cover rounded-lg border border-default"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-text max-w-xs">
                            {banner.title || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-muted max-w-xs line-clamp-2">
                            {banner.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {banner.linkUrl ? (
                            <a
                              href={banner.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-secondary hover:underline flex items-center gap-1"
                            >
                              <Eye size={14} />
                              Xem link
                            </a>
                          ) : (
                            <span className="text-sm text-light">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(banner.status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted">
                          {new Date(banner.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleToggleStatus(banner)}
                              className="text-text hover:text-accent-warm transition-colors p-1"
                              title={banner.status === 'ACTIVE' ? 'Tắt' : 'Bật'}
                            >
                              {banner.status === 'ACTIVE' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </button>
                            <button
                              onClick={() => openEditModal(banner)}
                              className="text-text hover:text-secondary transition-colors p-1"
                              title="Sửa"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(banner)}
                              className="text-text hover:text-accent-red transition-colors p-1"
                              title="Xóa"
                            >
                              <Trash2 size={18} />
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
                        trong tổng số <span className="font-semibold text-text">{totalElements}</span> banner
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

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-surface rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto card-hover">
              <h3 className="heading-secondary mb-4">Tạo Banner Mới</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Ảnh Banner <span className="text-accent-red">*</span>
                  </label>
                  <div className="border-2 border-dashed border-default rounded-lg p-6 text-center bg-surface-light transition-colors hover:border-primary">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                      id="banner-upload"
                    />
                    <label
                      htmlFor="banner-upload"
                      className={`cursor-pointer flex flex-col items-center gap-3 ${uploading ? 'opacity-50' : ''}`}
                    >
                      <Upload size={48} className="text-light" />
                      <div>
                        <p className="text-text font-medium">
                          {uploading ? 'Đang upload...' : 'Bấm để chọn ảnh hoặc kéo thả ảnh vào đây'}
                        </p>
                        <p className="text-sm text-muted mt-1">PNG, JPG, JPEG (tối đa 5MB)</p>
                      </div>
                    </label>
                  </div>
                  {formData.imageUrl && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-text mb-2">Preview:</p>
                      <img 
                        src={formData.imageUrl} 
                        alt="Preview" 
                        className="h-40 w-full object-cover rounded-lg border border-default" 
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Tiêu đề</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field w-full"
                    placeholder="Nhập tiêu đề banner"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="input-field w-full resize-none"
                    placeholder="Nhập mô tả banner"
                    maxLength={1000}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Link URL</label>
                  <input
                    type="url"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    className="input-field w-full"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="input-field w-full"
                  >
                    <option value="ACTIVE">Đang hiển thị</option>
                    <option value="INACTIVE">Đã tắt</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-default mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary px-6 py-2"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateBanner}
                  disabled={!formData.imageUrl || uploading}
                  className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-surface border-t-transparent"></div>
                      Đang upload...
                    </span>
                  ) : (
                    'Tạo Banner'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedBanner && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center w-full h-full z-50 p-4 animate-fadeIn">
            <div className="bg-surface rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto card-hover">
              <h3 className="heading-secondary mb-4">Chỉnh sửa Banner</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">
                    Ảnh Banner <span className="text-accent-red">*</span>
                  </label>
                  <div className="border-2 border-dashed border-default rounded-lg p-6 text-center bg-surface-light transition-colors hover:border-primary">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                      id="banner-edit-upload"
                    />
                    <label
                      htmlFor="banner-edit-upload"
                      className={`cursor-pointer flex flex-col items-center gap-3 ${uploading ? 'opacity-50' : ''}`}
                    >
                      <Upload size={48} className="text-light" />
                      <div>
                        <p className="text-text font-medium">
                          {uploading ? 'Đang upload...' : 'Bấm để chọn ảnh mới hoặc kéo thả ảnh vào đây'}
                        </p>
                        <p className="text-sm text-muted mt-1">PNG, JPG, JPEG (tối đa 5MB)</p>
                      </div>
                    </label>
                  </div>
                  {formData.imageUrl && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-text mb-2">Preview:</p>
                      <img 
                        src={formData.imageUrl} 
                        alt="Preview" 
                        className="h-40 w-full object-cover rounded-lg border border-default" 
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Tiêu đề</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field w-full"
                    placeholder="Nhập tiêu đề banner"
                    maxLength={200}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="input-field w-full resize-none"
                    placeholder="Nhập mô tả banner"
                    maxLength={1000}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Link URL</label>
                  <input
                    type="url"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    className="input-field w-full"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-2">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="input-field w-full"
                  >
                    <option value="ACTIVE">Đang hiển thị</option>
                    <option value="INACTIVE">Đã tắt</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-default mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="btn-secondary px-6 py-2"
                >
                  Hủy
                </button>
                <button
                  onClick={handleUpdateBanner}
                  disabled={!formData.imageUrl || uploading}
                  className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-surface border-t-transparent"></div>
                      Đang upload...
                    </span>
                  ) : (
                    'Cập nhật'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedBanner && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center w-full h-full z-50 p-4 animate-fadeIn">
            <div className="bg-surface rounded-lg p-6 w-96 mx-4 card-hover">
              <div className="text-center">
                <h3 className="heading-secondary mb-2">Xác nhận xóa</h3>
                <div className="mt-2 px-2 py-3">
                  <p className="text-sm text-muted">
                    Bạn có chắc chắn muốn xóa banner này?
                    <br />
                    Hành động này không thể hoàn tác.
                  </p>
                </div>
                <div className="flex justify-center space-x-3 px-4 py-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="btn-secondary px-4 py-2"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleDeleteBanner}
                    className="btn-primary bg-accent-red hover:bg-red-600 px-4 py-2"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}