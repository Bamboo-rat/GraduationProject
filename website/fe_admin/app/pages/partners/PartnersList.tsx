import { useState, useEffect } from 'react';
import DashboardLayout from '~/component/DashboardLayout';

// TODO: Create supplierService with backend API
interface Supplier {
  id: string;
  businessName: string;
  email: string;
  phoneNumber: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
}

export default function PartnersList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // TODO: Fetch suppliers from backend
    setLoading(false);
  }, [currentPage, searchTerm]);

  const getStatusBadge = (status: string) => {
    const config = {
      ACTIVE: { label: 'Hoạt động', color: 'bg-green-100 text-green-800' },
      INACTIVE: { label: 'Không hoạt động', color: 'bg-gray-100 text-gray-800' },
      SUSPENDED: { label: 'Tạm khóa', color: 'bg-red-100 text-red-800' },
    };
    const { label, color } = config[status as keyof typeof config] || config.ACTIVE;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>{label}</span>;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Đang tải...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Danh sách Đối tác</h1>
        
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Tìm kiếm đối tác..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border rounded"
          />
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Tìm kiếm
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên doanh nghiệp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số điện thoại</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Địa chỉ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                Chưa có dữ liệu - Cần implement backend API
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </DashboardLayout>
  );
}
