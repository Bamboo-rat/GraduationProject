import React from 'react'
import DashboardLayout from '~/component/DashboardLayout';

const ChangePassword = () => {
  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Đổi mật khẩu</h1>
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
          <form>
            <div className="mb-4">
              <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu hiện tại:
              </label>
              <input
                type="password"
                id="current-password"
                name="current-password"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu mới:
              </label>
              <input
                type="password"
                id="new-password"
                name="new-password"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                Xác nhận mật khẩu mới:
              </label>
              <input
                type="password"
                id="confirm-password"
                name="confirm-password"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Đổi mật khẩu
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default ChangePassword
