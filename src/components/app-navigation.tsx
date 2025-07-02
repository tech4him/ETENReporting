'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  Home, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  ChevronDown,
  Menu,
  X,
  Bell,
  Search
} from 'lucide-react'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  adminOnly?: boolean
  children?: NavigationItem[]
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Overview and reports'
  },
  {
    name: 'Applications',
    href: '/applications',
    icon: FileText,
    description: 'Manage application reports',
    children: [
      {
        name: 'All Applications',
        href: '/applications',
        icon: FileText,
        description: 'View all applications'
      },
      {
        name: 'Draft Reports',
        href: '/applications?status=draft',
        icon: FileText,
        description: 'Continue working on drafts'
      },
      {
        name: 'Submitted Reports',
        href: '/applications?status=submitted',
        icon: FileText,
        description: 'View submitted reports'
      }
    ]
  },
  {
    name: 'Projects',
    href: '/projects',
    icon: Users,
    description: 'Project management'
  },
  {
    name: 'Admin',
    href: '/admin',
    icon: Settings,
    description: 'Administrative functions',
    adminOnly: true,
    children: [
      {
        name: 'User Management',
        href: '/admin/users',
        icon: Users,
        description: 'Manage users and permissions'
      },
      {
        name: 'Report Management',
        href: '/admin/reports',
        icon: FileText,
        description: 'Review and manage all reports'
      },
      {
        name: 'System Settings',
        href: '/admin/settings',
        icon: Settings,
        description: 'Configure system settings'
      }
    ]
  }
]

function UserMenu() {
  const { userProfile, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 text-gray-700 hover:text-gray-900 focus:outline-none"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {userProfile?.full_name?.charAt(0) || 'U'}
          </span>
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium text-gray-900">
            {userProfile?.full_name || 'User'}
          </p>
          <p className="text-xs text-gray-500">
            {userProfile?.organization?.name}
          </p>
        </div>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">
                {userProfile?.full_name}
              </p>
              <p className="text-xs text-gray-500">
                {userProfile?.email}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {userProfile?.organization?.name}
              </p>
            </div>
            <div className="py-1">
              <button
                onClick={() => {
                  signOut()
                  setIsOpen(false)
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function NavigationDropdown({ item }: { item: NavigationItem }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
          ${pathname.startsWith(item.href)
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }
        `}
      >
        <item.icon className="w-4 h-4 mr-2" />
        {item.name}
        <ChevronDown className="w-4 h-4 ml-1" />
      </button>

      {isOpen && item.children && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute left-0 mt-1 w-64 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-20">
            <div className="py-1">
              {item.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-start px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <child.icon className="w-4 h-4 mr-3 mt-0.5 text-gray-400" />
                  <div>
                    <p className="font-medium">{child.name}</p>
                    {child.description && (
                      <p className="text-xs text-gray-500 mt-1">{child.description}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function AppNavigation() {
  const { userProfile, loading } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mobileSubmenus, setMobileSubmenus] = useState<{[key: string]: boolean}>({})
  const pathname = usePathname()

  // Don't show navigation on login/signup pages or when not authenticated
  if (loading || !userProfile || pathname === '/login' || pathname === '/signup') {
    return null
  }

  const filteredNavigation = navigation.filter(item => 
    !item.adminOnly || userProfile?.role === 'admin'
  )

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ER</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">
                ETEN Reporting
              </span>
            </Link>

            {/* Desktop navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              {filteredNavigation.map((item) => (
                item.children ? (
                  <NavigationDropdown key={item.name} item={item} />
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${pathname === item.href || pathname.startsWith(item.href + '/')
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    `}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                )
              ))}
            </div>
          </div>

          {/* Right side navigation */}
          <div className="flex items-center space-x-4">
            {/* Search (desktop only) */}
            <div className="hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="form-input-sm pl-10 pr-4 w-64"
                />
              </div>
            </div>

            {/* Notifications */}
            <button 
              className="p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
              aria-label="View notifications"
            >
              <Bell className="w-5 h-5" />
            </button>

            {/* User menu */}
            <UserMenu />

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 bg-white">
            {/* Mobile search */}
            <div className="px-3 py-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="form-input-sm pl-10 pr-4"
                />
              </div>
            </div>

            {/* Mobile navigation links */}
            {filteredNavigation.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => setMobileSubmenus(prev => ({
                        ...prev,
                        [item.name]: !prev[item.name]
                      }))}
                      className={`
                        flex items-center justify-between w-full px-3 py-2 rounded-md text-base font-medium
                        ${pathname === item.href || pathname.startsWith(item.href + '/')
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }
                      `}
                      aria-expanded={mobileSubmenus[item.name] || false}
                      aria-haspopup="true"
                    >
                      <div className="flex items-center">
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.name}
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${
                        mobileSubmenus[item.name] ? 'rotate-180' : ''
                      }`} />
                    </button>
                    
                    {/* Mobile submenu */}
                    {mobileSubmenus[item.name] && (
                      <div className="ml-8 space-y-1 mt-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center px-3 py-2 rounded-md text-sm ${
                              pathname === child.href
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            <child.icon className="w-4 h-4 mr-2" />
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center px-3 py-2 rounded-md text-base font-medium
                      ${pathname === item.href || pathname.startsWith(item.href + '/')
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }
                    `}
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}