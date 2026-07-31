import { useEffect, useState } from 'react'
import { defaultFrameSettings } from '../data/frameDefaults.js'

const STORAGE_KEY = 'quote-app-frame-settings'

export function useFrameSettings() {
  const [settings, setSettings] = useState(defaultFrameSettings)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setSettings({ ...defaultFrameSettings, ...JSON.parse(raw) })
    } catch {
      // Bỏ qua nếu dữ liệu lưu bị lỗi, dùng giá trị mặc định
    }
  }, [])

  const updateSetting = (key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const resetSettings = () => {
    setSettings(defaultFrameSettings)
    localStorage.removeItem(STORAGE_KEY)
  }

  return { settings, updateSetting, resetSettings }
}
