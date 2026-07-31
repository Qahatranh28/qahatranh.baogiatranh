import { useCallback, useEffect, useState } from 'react'

// ⚠️ Demo only: tài khoản admin được kiểm tra ở phía client nên KHÔNG an toàn
// cho môi trường production. Khi triển khai thật, hãy thay hàm checkCredentials
// bằng một lệnh gọi API tới backend của bạn (xác thực bằng token/JWT, v.v.).
const DEMO_ADMIN_USERNAME = 'admin'
const DEMO_ADMIN_PASSWORD = 'admin123'
const SESSION_KEY = 'quote-app-admin-session'

function checkCredentials(username, password) {
  return username === DEMO_ADMIN_USERNAME && password === DEMO_ADMIN_PASSWORD
}

export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false)

  // Giữ trạng thái đăng nhập khi người dùng tải lại trang
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      setIsAdmin(true)
    }
  }, [])

  const login = useCallback((username, password) => {
    const success = checkCredentials(username, password)
    if (success) {
      setIsAdmin(true)
      sessionStorage.setItem(SESSION_KEY, 'true')
    }
    return success
  }, [])

  const logout = useCallback(() => {
    setIsAdmin(false)
    sessionStorage.removeItem(SESSION_KEY)
  }, [])

  return { isAdmin, login, logout }
}
