import React from 'react'
import DashboardLayout from '~/component/DashboardLayout';

const Notifications = () => {
    return (
        <DashboardLayout>
            <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Thông báo</h1>
                <div className="bg-white rounded-lg shadow p-6 max-w-4xl">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Danh sách thông báo</h3>
                        <ul className="space-y-3">
                            <li className="p-3 bg-gray-50 rounded-lg border border-gray-200">Thông báo 1</li>
                            <li className="p-3 bg-gray-50 rounded-lg border border-gray-200">Thông báo 2</li>
                            <li className="p-3 bg-gray-50 rounded-lg border border-gray-200">Thông báo 3</li>
                        </ul>
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Cài đặt thông báo:</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>🔄 Cài đặt thông báo email</li>
                            <li>🔄 Cài đặt thông báo push</li>
                            <li>🔄 Quản lý tùy chọn thông báo</li>
                        </ul>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

export default Notifications
