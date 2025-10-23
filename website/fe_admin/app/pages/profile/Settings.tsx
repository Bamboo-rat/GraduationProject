import React from 'react'
import DashboardLayout from '~/component/layout/DashboardLayout';

const Settings = () => {
    return (
        <DashboardLayout>
            <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Cài đặt</h1>
                <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
                    <form>
                        <div className="mb-4">
                            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                                Ngôn ngữ:
                            </label>
                            <select
                                id="language"
                                name="language"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="vi">Tiếng Việt</option>
                                <option value="en">Tiếng Anh</option>
                            </select>
                        </div>
                        <div className="mb-6">
                            <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                                Múi giờ:
                            </label>
                            <select
                                id="timezone"
                                name="timezone"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                            >
                                <option value="GMT+7">GMT+7</option>
                                <option value="GMT+8">GMT+8</option>
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Lưu cài đặt
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Các tính năng khác:</h3>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>• Cài đặt chung</li>
                            <li>• Tùy chỉnh giao diện</li>
                            <li>• Cài đặt bảo mật</li>
                        </ul>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}

export default Settings
