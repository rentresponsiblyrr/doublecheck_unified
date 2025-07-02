import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth.config'

export default async function DashboardPage() {
  const session = await getServerSession(authConfig)
  
  if (!session) {
    redirect('/auth/signin')
  }

  // Check if user has admin/manager role
  if (!['ADMIN', 'MANAGER'].includes(session.user.role)) {
    redirect('/inspector')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome to the DoubleCheck Verified admin center
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Properties Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">P</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Properties
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      Manage Properties
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <a href="/dashboard/properties" className="font-medium text-blue-600 hover:text-blue-500">
                  View all properties
                </a>
              </div>
            </div>
          </div>

          {/* Inspections Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">I</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Inspections
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      Review Inspections
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <a href="/dashboard/inspections" className="font-medium text-blue-600 hover:text-blue-500">
                  View all inspections
                </a>
              </div>
            </div>
          </div>

          {/* Users Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-medium">U</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Users
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      Manage Users
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <a href="/dashboard/users" className="font-medium text-blue-600 hover:text-blue-500">
                  Manage users
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}